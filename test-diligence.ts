/**
 * Smoke test: run the Forensic Diligence Pipeline against a real,
 * known-high-signal PR without going through Next.js / Supabase.
 *
 * Usage:
 *   npx tsx test-diligence.ts
 *
 * Expected: a structured ForensicScore printed to stdout.
 */

import 'dotenv/config';
import { fetchCleanDiff } from './src/lib/github';
import { scoreForensicDiff } from './src/lib/forensic-scorer';

// A Go stdlib fix — real, human-authored grit. Good calibration target.
// Feel free to swap with any PR URL you want to sanity check.
const SMOKING_GUN_URL =
  process.argv[2] ||
  'https://github.com/golang/go/pull/65502';

async function main() {
  console.log('🔍 OCAP V2 — Forensic Diligence Smoke Test');
  console.log('   Target:', SMOKING_GUN_URL);
  console.log();

  console.log('1) Pulling diff from GitHub...');
  const t0 = Date.now();
  const { cleanDiff, parsed, keptFiles, droppedFiles, truncated, originalBytes } =
    await fetchCleanDiff(SMOKING_GUN_URL);
  console.log(`   ✓ Parsed:`, parsed);
  console.log(`   ✓ Kept ${keptFiles.length} files, dropped ${droppedFiles.length} boilerplate`);
  console.log(`   ✓ Size: ${originalBytes}B${truncated ? ' (truncated)' : ''}`);
  console.log(`   ✓ Duration: ${Date.now() - t0}ms`);
  console.log();

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.startsWith('PASTE_')) {
    console.warn('⚠️  ANTHROPIC_API_KEY not set. Printing first 2KB of clean diff and exiting.');
    console.log(cleanDiff.slice(0, 2000));
    return;
  }

  console.log('2) Running Claude 3.5 Sonnet against the Grit-vs-Slop rubric...');
  const t1 = Date.now();
  const score = await scoreForensicDiff({
    developerHandle: parsed.kind !== 'unknown' ? `${parsed.owner}/${parsed.repo}` : 'unknown',
    smokingGunUrl: SMOKING_GUN_URL,
    cleanDiff,
    keptFiles,
    droppedFiles,
  });
  console.log(`   ✓ Scored in ${Date.now() - t1}ms`);
  console.log();

  console.log('────────────────────────────────────────');
  console.log('FORENSIC REPORT');
  console.log('────────────────────────────────────────');
  console.log(`Grit Score:     ${score.gritScore}/10`);
  console.log(`Archetype:      ${score.archetype}`);
  console.log(`Recommendation: ${score.recommendation}`);
  console.log();
  console.log('Dimensions:');
  for (const [k, v] of Object.entries(score.dimensions)) {
    console.log(`  ${k.padEnd(22)} ${v}/10`);
  }
  console.log();
  console.log('Grit Markers:');
  score.gritMarkers.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
  console.log();
  console.log('Red Flags:');
  if (score.redFlags.length === 0) console.log('  (none)');
  else score.redFlags.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
  console.log();
  console.log('Justification:');
  console.log(score.justification);
  console.log('────────────────────────────────────────');
}

main().catch((err) => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});
