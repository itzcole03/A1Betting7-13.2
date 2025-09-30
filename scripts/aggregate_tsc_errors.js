#!/usr/bin/env node
// Aggregate tsc stderr output into a JSON triage report.
// Usage: node scripts/aggregate_tsc_errors.js <tsc_errors.txt> <out.json>

const fs = require('fs');
const path = require('path');

function parseTscErrors(text) {
  const lines = text.split(/\r?\n/);
  const entries = [];

  // Support several tsc output formats.
  const reInline1 = /^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.*)$/;
  const reInline2 = /^(.+?):(\d+):(\d+)\s+-\s+error\s+(TS\d+):\s+(.*)$/;

  // Split-line patterns: file line followed by a separate 'error TS...' line
  const reFileOnly1 = /^(.+?)\((\d+),(\d+)\):\s*$/;
  const reFileOnly2 = /^(.+?):(\d+):(\d+)\s*$/;
  const reMsgOnly = /^error\s+(TS\d+):\s+(.*)$/;
  const reMsgOnlyAlt = /^-\s+error\s+(TS\d+):\s+(.*)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m = line.match(reInline1) || line.match(reInline2);
    if (m) {
      const file = path.normalize(m[1]);
      const lineNum = parseInt(m[2], 10);
      const colNum = parseInt(m[3], 10);
      const code = m[4];
      const message = m[5];

      // Collect continuation lines for the message (indented lines)
      const extra = [];
      let j = i + 1;
      while (j < lines.length && /^\s+/.test(lines[j])) {
        extra.push(lines[j].trim());
        j++;
      }
      if (extra.length) {
        i = j - 1;
      }

      entries.push({ file, line: lineNum, column: colNum, code, message, details: extra });
      continue;
    }

    // Check split format: file only on this line, message on the next
    const mf1 = line.match(reFileOnly1) || line.match(reFileOnly2);
    if (mf1) {
      const file = path.normalize(mf1[1]);
      const lineNum = parseInt(mf1[2], 10);
      const colNum = parseInt(mf1[3], 10);
      const next = lines[i + 1] || '';
      const mm = next.match(reMsgOnly) || next.match(reMsgOnlyAlt);
      if (mm) {
        const code = mm[1];
        const message = mm[2];
        // Advance i to skip the message line
        i = i + 1;
        // collect following indented details
        const extra = [];
        let j = i + 1;
        while (j < lines.length && /^\s+/.test(lines[j])) {
          extra.push(lines[j].trim());
          j++;
        }
        if (extra.length) i = j - 1;

        entries.push({ file, line: lineNum, column: colNum, code, message, details: extra });
      }
    }
  }

  return entries;
}

function aggregate(entries) {
  const byFile = {};
  const byCode = {};

  for (const e of entries) {
    byFile[e.file] = byFile[e.file] || { file: e.file, count: 0, errors: [] };
    byFile[e.file].count++;
    byFile[e.file].errors.push(e);

    byCode[e.code] = byCode[e.code] || { code: e.code, count: 0, examples: [] };
    byCode[e.code].count++;
    if (byCode[e.code].examples.length < 5) byCode[e.code].examples.push(e);
  }

  const topFiles = Object.values(byFile).sort((a, b) => b.count - a.count).slice(0, 50);
  const codes = Object.values(byCode).sort((a, b) => b.count - a.count);

  return { total_errors: entries.length, topFiles, codes };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/aggregate_tsc_errors.js <tsc_errors.txt> <out.json>');
    process.exit(2);
  }

  const [inPath, outPath] = args;
  if (!fs.existsSync(inPath)) {
    console.error('Input file not found:', inPath);
    process.exit(2);
  }

  const text = fs.readFileSync(inPath, 'utf8');
  const entries = parseTscErrors(text);
  const agg = aggregate(entries);

  const out = { generated_at: new Date().toISOString(), input: path.basename(inPath), result: agg };
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote triage report to', outPath, 'errors_parsed=', entries.length);
}

main();
