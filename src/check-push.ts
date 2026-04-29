import { readFileSync } from "node:fs";
import { scanText, type PiiFinding } from "./scanner.js";

const BLOCK_THRESHOLD = parseFloat(process.env.BLOCK_THRESHOLD || "0.8");
const WARN_THRESHOLD = 0.5;

const IGNORE_ENTITY_TYPES = new Set(["private_url"]);

const IGNORE_PATTERNS = [
  /example\.(com|org|net)/i,
  /test@/i,
  /localhost/i,
  /127\.0\.0\.1/,
  /\.supabase\.co/i,
  /\.vercel\.app/i,
  /\.netlify\.app/i,
  /\.amazonaws\.com/i,
  /\.cloudflare\.com/i,
  /placeholder/i,
  /Jane\s+Doe/i,
  /John\s+Doe/i,
];

function shouldIgnore(finding: PiiFinding): boolean {
  if (IGNORE_ENTITY_TYPES.has(finding.entityGroup)) return true;
  return IGNORE_PATTERNS.some((p) => p.test(finding.word));
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    process.stderr.write("Usage: check-push.ts <file>\n");
    process.exit(1);
  }

  const content = readFileSync(filePath, "utf-8");
  const findings = await scanText(content);

  const blockers = findings.filter((f) => f.score >= BLOCK_THRESHOLD && !shouldIgnore(f));
  const warnings = findings.filter((f) => f.score >= WARN_THRESHOLD && f.score < BLOCK_THRESHOLD && !shouldIgnore(f));

  if (warnings.length > 0) {
    process.stderr.write("  Warnings (below threshold):\n");
    for (const w of warnings) {
      process.stderr.write(`    :${w.line}  ${w.entityGroup} (${w.score.toFixed(2)})  "${w.word}"\n`);
    }
  }

  if (blockers.length > 0) {
    process.stderr.write("  PII detected:\n");
    for (const b of blockers) {
      process.stderr.write(`    :${b.line}  ${b.entityGroup} (${b.score.toFixed(2)})  "${b.word}"\n`);
    }
    process.exit(2);
  }

  process.exit(0);
}

main();
