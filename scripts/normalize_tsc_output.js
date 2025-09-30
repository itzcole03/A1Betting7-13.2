#!/usr/bin/env node
// Normalize tsc output file where multiple errors may be concatenated on one line.
// Usage: node scripts/normalize_tsc_output.js <in.txt> <out.txt>
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node scripts/normalize_tsc_output.js <in.txt> <out.txt>');
  process.exit(2);
}
const [inPath, outPath] = args;
if (!fs.existsSync(inPath)) {
  console.error('Input file not found:', inPath);
  process.exit(2);
}
let text = fs.readFileSync(inPath, 'utf8');

// Heuristic: insert newline before each occurrence of typical project path fragment
// e.g., "frontend/src/" or other absolute path patterns like "src/"
text = text.replace(/(\s|^)(frontend\/src\/|src\/)(?=[^\s])/g, '\n$2');

// Ensure each 'error TS' starts a new line
text = text.replace(/\s+(?=[^\n]*error TS)/g, '\n');

// Normalize CRLF
text = text.replace(/\r\n/g, '\n');
fs.writeFileSync(outPath, text, 'utf8');
console.log('Wrote normalized tsc output to', outPath);
