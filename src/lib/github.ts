/**
 * GitHub API integration for the V2 Forensic Pipeline.
 *
 * Pulls raw `.diff` files from a Pull Request or Commit URL and strips
 * boilerplate so the LLM only sees logic that matters.
 */

const GITHUB_API_BASE = 'https://api.github.com';

export type ParsedGitHubUrl =
  | { kind: 'pull'; owner: string; repo: string; number: number }
  | { kind: 'commit'; owner: string; repo: string; sha: string }
  | { kind: 'unknown'; raw: string };

/**
 * Parse a GitHub URL into a structured descriptor.
 *
 * Supports:
 *   - https://github.com/{owner}/{repo}/pull/{number}
 *   - https://github.com/{owner}/{repo}/commit/{sha}
 */
export function parseGitHubUrl(url: string): ParsedGitHubUrl {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('github.com')) {
      return { kind: 'unknown', raw: url };
    }

    const parts = u.pathname.split('/').filter(Boolean);
    // [owner, repo, type, id]
    if (parts.length >= 4) {
      const [owner, repo, type, id] = parts;
      if (type === 'pull') {
        const number = parseInt(id, 10);
        if (!isNaN(number)) return { kind: 'pull', owner, repo, number };
      }
      if (type === 'commit') {
        return { kind: 'commit', owner, repo, sha: id };
      }
    }
    return { kind: 'unknown', raw: url };
  } catch {
    return { kind: 'unknown', raw: url };
  }
}

/**
 * Fetch the raw unified diff for a PR or commit.
 *
 * Uses the `Accept: application/vnd.github.v3.diff` media type per GitHub's
 * REST API spec. If `GITHUB_API_TOKEN` is set, the rate limit jumps from
 * 60/hr (unauthed) to 5000/hr.
 */
export async function fetchGitHubDiff(url: string): Promise<{
  diff: string;
  parsed: ParsedGitHubUrl;
}> {
  const parsed = parseGitHubUrl(url);
  if (parsed.kind === 'unknown') {
    throw new Error(`Unrecognized GitHub URL: ${url}`);
  }

  let apiUrl: string;
  if (parsed.kind === 'pull') {
    apiUrl = `${GITHUB_API_BASE}/repos/${parsed.owner}/${parsed.repo}/pulls/${parsed.number}`;
  } else {
    apiUrl = `${GITHUB_API_BASE}/repos/${parsed.owner}/${parsed.repo}/commits/${parsed.sha}`;
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3.diff',
    'User-Agent': 'OCAP-Council-Forensic-Engine/1.0',
  };

  const token = process.env.GITHUB_API_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(apiUrl, { headers });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `GitHub diff fetch failed (${response.status} ${response.statusText}) for ${url}` +
        (body ? `\n${body.slice(0, 200)}` : '')
    );
  }

  const diff = await response.text();

  // Sanity check: the v3.diff media type returns a unified diff starting
  // with "diff --git". If we got HTML back (e.g., from a misconfigured
  // proxy or a deleted PR), bail early rather than feeding garbage to Claude.
  if (!diff.startsWith('diff --git') && !diff.startsWith('From ')) {
    throw new Error(
      `GitHub returned non-diff content for ${url} — first 120 chars: ${diff.slice(0, 120)}`
    );
  }

  return { diff, parsed };
}

/**
 * Boilerplate patterns the LLM should NOT waste tokens on.
 * We strip these from the diff before sending to Claude.
 */
const BOILERPLATE_PATHS = [
  // Lockfiles
  /package-lock\.json/,
  /yarn\.lock/,
  /pnpm-lock\.yaml/,
  /Cargo\.lock/,
  /poetry\.lock/,
  /Gemfile\.lock/,
  /go\.sum/,
  /composer\.lock/,
  // Build artifacts / dists
  /^dist\//,
  /^build\//,
  /^\.next\//,
  /^out\//,
  /^target\//,
  /^node_modules\//,
  // Minified
  /\.min\.(js|css)$/,
  // Generated
  /\.generated\./,
  /_pb\.(go|py|ts|js)$/, // protobuf
  // Images / binaries
  /\.(png|jpg|jpeg|gif|svg|ico|webp|pdf|woff2?|ttf|eot)$/,
  // Snapshots
  /__snapshots__\//,
];

function isBoilerplateFile(filePath: string): boolean {
  return BOILERPLATE_PATHS.some((pattern) => pattern.test(filePath));
}

/**
 * Strip boilerplate file diffs from a unified-diff string.
 *
 * A unified diff is organized in blocks starting with `diff --git a/... b/...`.
 * We parse block-by-block and drop any whose file path matches a boilerplate
 * pattern. Preserves the original format of kept blocks.
 */
export function stripBoilerplate(rawDiff: string): {
  cleanDiff: string;
  droppedFiles: string[];
  keptFiles: string[];
} {
  const droppedFiles: string[] = [];
  const keptFiles: string[] = [];

  // Split on "diff --git" boundaries, keeping the delimiter
  const blocks = rawDiff.split(/(?=^diff --git )/m).filter((b) => b.trim().length > 0);

  const kept: string[] = [];
  for (const block of blocks) {
    const header = block.split('\n')[0] || '';
    // "diff --git a/path/to/file b/path/to/file"
    const match = header.match(/^diff --git a\/(\S+) b\/(\S+)/);
    const filePath = match ? match[2] : '';

    if (filePath && isBoilerplateFile(filePath)) {
      droppedFiles.push(filePath);
    } else {
      if (filePath) keptFiles.push(filePath);
      kept.push(block);
    }
  }

  return {
    cleanDiff: kept.join('\n'),
    droppedFiles,
    keptFiles,
  };
}

/**
 * Hard cap the diff by size so we never blow through the Claude context
 * window. 100KB of raw diff is already a ton of logic to reason over.
 */
export function truncateDiff(diff: string, maxBytes = 100_000): {
  diff: string;
  truncated: boolean;
  originalBytes: number;
} {
  const bytes = Buffer.byteLength(diff, 'utf8');
  if (bytes <= maxBytes) {
    return { diff, truncated: false, originalBytes: bytes };
  }
  // Truncate on a line boundary near the limit
  const sliced = diff.slice(0, maxBytes);
  const lastNewline = sliced.lastIndexOf('\n');
  const safe = lastNewline > 0 ? sliced.slice(0, lastNewline) : sliced;
  return {
    diff: safe + '\n\n[... TRUNCATED BY OCAP FORENSIC ENGINE — diff exceeded size ceiling ...]',
    truncated: true,
    originalBytes: bytes,
  };
}

/**
 * One-shot convenience: fetch + strip + truncate.
 */
export async function fetchCleanDiff(url: string): Promise<{
  cleanDiff: string;
  parsed: ParsedGitHubUrl;
  droppedFiles: string[];
  keptFiles: string[];
  truncated: boolean;
  originalBytes: number;
}> {
  const { diff, parsed } = await fetchGitHubDiff(url);
  const { cleanDiff, droppedFiles, keptFiles } = stripBoilerplate(diff);
  const { diff: finalDiff, truncated, originalBytes } = truncateDiff(cleanDiff);

  return {
    cleanDiff: finalDiff,
    parsed,
    droppedFiles,
    keptFiles,
    truncated,
    originalBytes,
  };
}
