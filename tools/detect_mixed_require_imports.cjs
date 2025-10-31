#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TARGET = path.join(ROOT, "frontend", "src");
const SUGGEST_DIR = path.join(__dirname, "suggestions");

function walk(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const res = path.join(dir, e.name);
    if (e.isDirectory()) {
      // only descend into __tests__ directories or usual src tree
      if (
        res.includes(path.sep + "__tests__" + path.sep) ||
        res.endsWith(path.sep + "__tests__")
      ) {
        walk(res, fileList);
      } else if (!res.includes(path.sep + "node_modules" + path.sep)) {
        walk(res, fileList);
      }
    } else if (e.isFile()) {
      const lower = e.name.toLowerCase();
      if (
        lower.endsWith(".test.ts") ||
        lower.endsWith(".test.tsx") ||
        lower.endsWith(".test.js") ||
        lower.endsWith(".test.jsx") ||
        lower.endsWith(".spec.ts") ||
        lower.endsWith(".spec.tsx")
      ) {
        fileList.push(res);
      }
    }
  }
  return fileList;
}

function parseImports(content) {
  const imports = [];
  const importRE = /^\s*import\s+([^\n]+?)\s+from\s+['"]([^'"]+)['"];?/gm;
  let m;
  while ((m = importRE.exec(content)) !== null) {
    imports.push({ full: m[0], clause: m[1].trim(), from: m[2] });
  }
  return imports;
}

function hasRequire(content) {
  return /\brequire\s*\(/.test(content);
}

function makeReplacement(importObj) {
  const { clause, from } = importObj;
  // only suggest fixes for relative imports
  if (!from.startsWith(".")) return null;

  // named imports: { a, b as c }
  if (clause.startsWith("{")) {
    return `const ${clause} = require('${from}');`;
  }

  // namespace import: * as X
  const nsMatch = clause.match(/^\*\s+as\s+(\w+)$/);
  if (nsMatch) {
    return `const ${nsMatch[1]} = require('${from}');`;
  }

  // default import: Foo
  const defaultNameMatch = clause.match(/^[A-Za-z0-9_$]+$/);
  if (defaultNameMatch) {
    // try to prefer .default when present at runtime
    return `const ${clause} = (function(){ const m = require('${from}'); return (m && m.__esModule && m.default) ? m.default : m; })();`;
  }

  // fallback: return a simple require
  return `const ${clause.replace(
    /[^A-Za-z0-9_$]/g,
    "_"
  )} = require('${from}');`;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function generateSuggestion(filePath, content, imports) {
  const rel = path.relative(ROOT, filePath);
  const suggestions = [];
  for (const imp of imports) {
    const repl = makeReplacement(imp);
    if (repl) suggestions.push({ original: imp.full, replacement: repl });
  }
  if (suggestions.length === 0) return null;

  const lines = [
    `# Suggestions for ${rel}`,
    "---",
    "Replace the following import lines with require() equivalents to avoid mixing require+import in the same test file.",
    "",
  ];
  for (const s of suggestions) {
    lines.push("--- original ---");
    lines.push(s.original);
    lines.push("--- replacement ---");
    lines.push(s.replacement);
    lines.push("");
  }
  return lines.join("\n");
}

function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const files = walk(TARGET, []);
  ensureDir(SUGGEST_DIR);
  const report = [];
  for (const f of files) {
    try {
      const content = fs.readFileSync(f, "utf8");
      if (!hasRequire(content)) continue;
      const imports = parseImports(content);
      if (!imports.length) continue;
      // determine whether any import is relative and overlaps with require targets
      // conservative: if file has any import AND any require, report
      report.push({ file: path.relative(ROOT, f), imports });
      const suggestion = generateSuggestion(
        f,
        content,
        imports.filter((i) => i.from.startsWith("."))
      );
      if (suggestion) {
        const outFile = path.join(
          SUGGEST_DIR,
          path.relative(path.join(ROOT, "frontend"), f).replace(/[\\/]/g, "_") +
            ".suggest.txt"
        );
        fs.writeFileSync(outFile, suggestion, "utf8");
        console.log(`Wrote suggestion: ${outFile}`);
        if (apply) {
          // apply replacements in-place (conservative single-line replacements)
          let updated = content;
          for (const imp of imports) {
            const repl = makeReplacement(imp);
            if (repl && imp.from.startsWith(".")) {
              updated = updated.replace(imp.full, repl);
            }
          }
          fs.writeFileSync(f, updated, "utf8");
          console.log(`Applied replacements to ${f}`);
        }
      }
    } catch (e) {
      console.error("Error processing", f, e.message);
    }
  }

  console.log(
    "Scan complete. Files with both require() and import statements:"
  );
  for (const r of report) console.log(" -", r.file);
  console.log(
    `Suggestions written to ${SUGGEST_DIR} (use --apply to apply simple replacements).`
  );
}

if (require.main === module) main();
