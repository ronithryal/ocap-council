/**
 * GitHub API integration for the V2 Forensic Pipeline.
 *
 * Pulls raw `.diff` files from a Pull Request or Commit URL and strips
 * boilerplate so the LLM only sees logic that matters.
 *
 * Phase A additions: metadata fetchers and deterministic artifact signal filter.
 */

const GITHUB_API_BASE = 'https://api.github.com';

// ---------------------------------------------------------------------------
// Artifact signal thresholds — tune here, not inline
// ---------------------------------------------------------------------------

/** Minimum total lines changed (additions + deletions) across all files. */
const SIGNAL_MIN_TOTAL_LINES = 30;

/**
 * Minimum net lines in non-boilerplate, non-doc/config/test files.
 * Applied after stripping noise files from the file list.
 */
const SIGNAL_MIN_LOGIC_LINES = 20;

/** Minimum files spanning distinct top-level directories to flag multi-subsystem scope. */
const SIGNAL_MULTI_SUBSYSTEM_FILE_COUNT = 3;

/** Minimum signal-file lines to flag high logic density (informational). */
const SIGNAL_HIGH_DENSITY_LINES = 50;

// ---------------------------------------------------------------------------
// Metadata types
// ---------------------------------------------------------------------------

export interface PRMetadata {
  number: number;
  title: string;
  state: 'open' | 'closed';
  draft: boolean;
  merged: boolean;
  additions: number;
  deletions: number;
  changed_files: number;
  user: { login: string };
  base: { repo: { full_name: string } };
}

export interface PRFile {
  filename: string;
  status: 'added' | 'modified' | 'removed' | 'renamed';
  additions: number;
  deletions: number;
}

export interface CommitMetadata {
  sha: string;
  commit: { message: string; author: { name: string; date: string } };
  stats: { additions: number; deletions: number; total: number };
  files: Array<{ filename: string; status: string; additions: number; deletions: number }>;
  author: { login: string } | null;
}

export interface ArtifactSignalReport {
  pass: boolean;
  /** Primary rejection reason, or "passed" if all gates cleared. */
  reason: string;
  /** Positive complexity markers found (informational — not gates). */
  signals: string[];
  /** All rejection reasons that fired (may be more than one). */
  rejections: string[];
}

// ---------------------------------------------------------------------------
// Shared auth helper
// ---------------------------------------------------------------------------

function githubJsonHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'OCAP-Council-Forensic-Engine/1.0',
  };
  const token = process.env.GITHUB_API_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// ---------------------------------------------------------------------------
// Metadata fetchers
// ---------------------------------------------------------------------------

export async function getPullRequestMetadata(
  owner: string,
  repo: string,
  number: number,
): Promise<PRMetadata> {
  const res = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${number}`,
    { headers: githubJsonHeaders() },
  );
  if (!res.ok) {
    throw new Error(`GitHub PR metadata fetch failed (${res.status}) for ${owner}/${repo}#${number}`);
  }
  return res.json();
}

export async function listPullRequestFiles(
  owner: string,
  repo: string,
  number: number,
): Promise<PRFile[]> {
  const res = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${number}/files?per_page=100`,
    { headers: githubJsonHeaders() },
  );
  if (!res.ok) {
    throw new Error(`GitHub PR files fetch failed (${res.status}) for ${owner}/${repo}#${number}`);
  }
  return res.json();
}

export async function getCommitMetadata(
  owner: string,
  repo: string,
  sha: string,
): Promise<CommitMetadata> {
  const res = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits/${sha}`,
    { headers: githubJsonHeaders() },
  );
  if (!res.ok) {
    throw new Error(`GitHub commit metadata fetch failed (${res.status}) for ${owner}/${repo}@${sha}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Deterministic artifact signal filter
// ---------------------------------------------------------------------------

const DOC_CONFIG_TEST_PATTERNS = [
  /\.md$/i,
  /\.txt$/i,
  /\.rst$/i,
  /^\.?[A-Z_]+$/, // bare filenames like LICENSE, CHANGELOG, NOTICE
  /\.(yml|yaml)$/, // config files; kept broad — logic-heavy CI files are edge cases
  /\.toml$/,
  /\.ini$/,
  /\.cfg$/,
  /\.env(\..+)?$/,
  /\.spec\.(ts|js|tsx|jsx|py|rb|go)$/,
  /_test\.(ts|js|tsx|jsx|py|rb|go|rs|cpp|c)$/,
  /\.test\.(ts|js|tsx|jsx)$/,
  /\/?(test|tests|spec|specs|__tests__|__mocks__)\//, // test directories
];

const BOT_COMMIT_PATTERNS = /^(chore|bot|dependabot|bump|release\b|update[\s_-]deps)/i;

function isDocConfigTestFile(filename: string): boolean {
  return DOC_CONFIG_TEST_PATTERNS.some((p) => p.test(filename));
}

/**
 * Deterministic pre-filter for a single GitHub artifact (PR or commit).
 * All rules are structural/statistical — no LLM judgment.
 *
 * @param files  File list from PR files API or commit metadata.
 * @param meta   Aggregate stats + optional title/message for bot/chore detection.
 */
export function assessArtifactSignal(
  files: Array<{ filename: string; additions: number; deletions: number }>,
  meta: {
    additions: number;
    deletions: number;
    changed_files?: number;
    title?: string;      // PR title
    message?: string;    // commit message (first line)
    draft?: boolean;
  },
): ArtifactSignalReport {
  const signals: string[] = [];
  const rejections: string[] = [];

  // Gate 1: trivial total scope
  if (meta.additions + meta.deletions < SIGNAL_MIN_TOTAL_LINES) {
    rejections.push('trivial_scope');
  }

  // Gate 2: all files are boilerplate
  const nonBoilerplate = files.filter((f) => !isBoilerplateFile(f.filename));
  if (files.length > 0 && nonBoilerplate.length === 0) {
    rejections.push('only_boilerplate');
  }

  // Gate 3: bot-authored or dep-bump commit/PR
  const titleOrMessage = (meta.title ?? '') + ' ' + (meta.message ?? '');
  if (BOT_COMMIT_PATTERNS.test(titleOrMessage.trim())) {
    rejections.push('dep_bump_or_chore');
  }

  // Gate 4: after stripping boilerplate, only docs/config/test files remain
  const signalFiles = nonBoilerplate.filter((f) => !isDocConfigTestFile(f.filename));
  if (nonBoilerplate.length > 0 && signalFiles.length === 0) {
    rejections.push('docs_config_test_only');
  }

  // Gate 5: insufficient logic density in signal files
  const signalLines = signalFiles.reduce((n, f) => n + f.additions + f.deletions, 0);
  if (signalFiles.length > 0 && signalLines < SIGNAL_MIN_LOGIC_LINES) {
    rejections.push('insufficient_logic_density');
  }

  // Gate 6: draft PR (unmerged work in progress)
  if (meta.draft === true) {
    rejections.push('unmerged_draft');
  }

  // Positive signals (informational)
  const topDirs = new Set(signalFiles.map((f) => f.filename.split('/')[0]));
  if (
    signalFiles.length >= SIGNAL_MULTI_SUBSYSTEM_FILE_COUNT &&
    topDirs.size >= SIGNAL_MULTI_SUBSYSTEM_FILE_COUNT
  ) {
    signals.push('multi_subsystem_scope');
  }
  if (signalLines >= SIGNAL_HIGH_DENSITY_LINES) {
    signals.push('high_logic_density');
  }
  if (/mutex|race|deadlock|lock|atomic|lifetime|unsafe|assembly|state.machine/i.test(titleOrMessage)) {
    signals.push('concurrency_state_hint');
  }

  const pass = rejections.length === 0;
  return {
    pass,
    reason: pass ? 'passed' : rejections[0],
    signals,
    rejections,
  };
}

export type ParsedGitHubUrl =
  | { kind: 'pull'; owner: string; repo: string; number: number }
  | { kind: 'commit'; owner: string; repo: string; sha: string }
  | { kind: 'repo'; owner: string; repo: string }
  | { kind: 'unknown'; raw: string };

/**
 * Parse a GitHub URL into a structured descriptor.
 *
 * Supports:
 *   - https://github.com/{owner}/{repo}/pull/{number}
 *   - https://github.com/{owner}/{repo}/commit/{sha}
 *   - https://github.com/{owner}/{repo}  (repo root — will use latest commit)
 */
export function parseGitHubUrl(url: string): ParsedGitHubUrl {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('github.com')) {
      return { kind: 'unknown', raw: url };
    }

    const parts = u.pathname.split('/').filter(Boolean);
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
    // Repo root URL: github.com/{owner}/{repo}
    if (parts.length === 2) {
      return { kind: 'repo', owner: parts[0], repo: parts[1] };
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

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3.diff',
    'User-Agent': 'OCAP-Council-Forensic-Engine/1.0',
  };

  const token = process.env.GITHUB_API_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // For repo root URLs, resolve to the latest commit SHA first
  let resolvedParsed = parsed;
  if (parsed.kind === 'repo') {
    const commitsRes = await fetch(
      `${GITHUB_API_BASE}/repos/${parsed.owner}/${parsed.repo}/commits?per_page=1`,
      { headers: { ...headers, Accept: 'application/vnd.github.v3+json' } }
    );
    if (!commitsRes.ok) {
      throw new Error(`Could not fetch commits for repo ${parsed.owner}/${parsed.repo}: ${commitsRes.status}`);
    }
    const commits = await commitsRes.json();
    if (!commits?.[0]?.sha) {
      throw new Error(`No commits found in repo ${parsed.owner}/${parsed.repo}`);
    }
    resolvedParsed = { kind: 'commit', owner: parsed.owner, repo: parsed.repo, sha: commits[0].sha };
  }

  let apiUrl: string;
  if (resolvedParsed.kind === 'pull') {
    apiUrl = `${GITHUB_API_BASE}/repos/${resolvedParsed.owner}/${resolvedParsed.repo}/pulls/${resolvedParsed.number}`;
  } else if (resolvedParsed.kind === 'commit') {
    apiUrl = `${GITHUB_API_BASE}/repos/${resolvedParsed.owner}/${resolvedParsed.repo}/commits/${resolvedParsed.sha}`;
  } else {
    throw new Error(`Cannot fetch diff for URL kind: ${(resolvedParsed as any).kind}`);
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
