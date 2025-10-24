#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: node generate_ts_triage_md.js <triage.json> <out.md>");
  process.exit(2);
}
const [inJson, outMd] = args;
if (!fs.existsSync(inJson)) {
  console.error("Input triage JSON not found:", inJson);
  process.exit(2);
}
const data = JSON.parse(fs.readFileSync(inJson, "utf8"));
const total = data.result.total_errors || 0;
const topFiles = data.result.topFiles || [];

let md = `# TypeScript Triage Top Files\n\n`;
md += `Generated: ${data.generated_at || new Date().toISOString()}\n\n`;
md += `Total TS errors recorded: **${total}**\n\n`;
md += `## Top ${Math.min(20, topFiles.length)} files by error count\n\n`;
md += `| Rank | Errors | File | Example error codes |\n`;
md += `|---:|---:|---|---|\n`;
for (let i = 0; i < Math.min(20, topFiles.length); i++) {
  const f = topFiles[i];
  const codes = (f.errors || [])
    .slice(0, 5)
    .map((e) => e.code)
    .filter(Boolean);
  md += `| ${i + 1} | ${f.count} | ${f.file} | ${[...new Set(codes)].join(
    ", "
  )} |\n`;
}

md += `\n\n## Quick recommendations\n\n`;
md += `- Target the top files above first; they represent the largest error surface.\n`;
md += `- Common error classes: missing symbol names (TS2304), shorthand property issues (TS18004), JSX mismatches (TS17002), and unused @ts-expect-error (TS2578). Address these categories with small PRs: add missing imports/decls, fix JSX tags, replace @ts-expect-error with proper fixes or clear them.\n`;

md += `\n\n## Next steps\n\n`;
md += `1. Create small PRs to fix top 3 files and re-run triage.\n`;
md += `2. Add incremental tsconfig slices to widen CI enforcement progressively.\n`;
md += `3. Move clearly legacy files to a /src/legacy/ folder and exclude them from main tsconfig until fixed.\n`;

fs.writeFileSync(outMd, md, "utf8");
console.log("Wrote triage markdown to", outMd);
