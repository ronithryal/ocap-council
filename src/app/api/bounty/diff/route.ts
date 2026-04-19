import { NextResponse } from 'next/server';
import { fetchCleanDiff } from '@/lib/github';

export interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

export interface DiffFile {
  file: string;
  added: number;
  removed: number;
  lines: DiffLine[];
}

/**
 * Parse a unified diff string into structured DiffFile objects.
 * Handles multi-file diffs (multiple `diff --git` blocks).
 */
function parseUnifiedDiff(rawDiff: string): DiffFile[] {
  const files: DiffFile[] = [];

  // Split on diff --git boundaries
  const blocks = rawDiff.split(/(?=^diff --git )/m).filter((b) => b.trim().length > 0);

  for (const block of blocks) {
    const headerLine = block.split('\n')[0] || '';
    const fileMatch = headerLine.match(/^diff --git a\/(\S+) b\/(\S+)/);
    const fileName = fileMatch ? fileMatch[2] : 'unknown';

    const lines: DiffLine[] = [];
    let added = 0;
    let removed = 0;
    let oldLine = 0;
    let newLine = 0;

    const rawLines = block.split('\n');
    let inHunk = false;

    for (const raw of rawLines) {
      // Hunk header: @@ -a,b +c,d @@
      const hunkMatch = raw.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (hunkMatch) {
        oldLine = parseInt(hunkMatch[1], 10);
        newLine = parseInt(hunkMatch[2], 10);
        inHunk = true;
        continue;
      }

      if (!inHunk) continue;

      // Skip diff metadata lines
      if (
        raw.startsWith('diff --git') ||
        raw.startsWith('index ') ||
        raw.startsWith('--- ') ||
        raw.startsWith('+++ ') ||
        raw.startsWith('Binary files') ||
        raw.startsWith('\\ No newline')
      ) {
        continue;
      }

      if (raw.startsWith('+')) {
        lines.push({ type: 'add', content: raw.slice(1), newLineNum: newLine });
        newLine++;
        added++;
      } else if (raw.startsWith('-')) {
        lines.push({ type: 'remove', content: raw.slice(1), oldLineNum: oldLine });
        oldLine++;
        removed++;
      } else {
        // Context line (starts with space or is empty)
        const content = raw.startsWith(' ') ? raw.slice(1) : raw;
        lines.push({ type: 'context', content, oldLineNum: oldLine, newLineNum: newLine });
        oldLine++;
        newLine++;
      }
    }

    if (lines.length > 0) {
      files.push({ file: fileName, added, removed, lines });
    }
  }

  return files;
}

/**
 * GET /api/bounty/diff?url=<encoded_github_url>
 *
 * Fetches the real GitHub diff for a PR, commit, or repo URL.
 * Returns structured diff lines for the Audit page viewer.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing ?url= parameter' }, { status: 400 });
  }

  try {
    const { cleanDiff, keptFiles, droppedFiles, truncated, originalBytes } =
      await fetchCleanDiff(url);

    const files = parseUnifiedDiff(cleanDiff);

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No parseable diff content found for this URL' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      files,
      meta: {
        keptFiles,
        droppedFiles,
        truncated,
        originalBytes,
        totalFiles: files.length,
      },
    });
  } catch (err: any) {
    console.error('[/api/bounty/diff] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
