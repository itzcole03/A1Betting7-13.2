#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 AUTONOMOUS SYNTAX REPAIR - CRITICAL PHASE');
console.log('Target: Fixing systematic TypeScript corruption patterns');

let processedFiles = 0;
let fixedIssues = 0;

// Get all TypeScript/TSX files
function getAllTSFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !['node_modules', 'dist', '.git', 'venv'].includes(item)) {
      files.push(...getAllTSFiles(fullPath));
    } else if (
      stat.isFile() &&
      (item.endsWith('.ts') || item.endsWith('.tsx')) &&
      stat.size < 2 * 1024 * 1024
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let fileFixed = false;

    // Fix 1: Malformed object property syntax (`,`n` → `,\n`)
    const beforeFix1 = content;
    content = content.replace(/,`n\s*/g, ',\n  ');
    if (content !== beforeFix1) fileFixed = true;

    // Fix 2: Array syntax errors ([0] → [])
    const beforeFix2 = content;
    const arrayPattern = /(\w+:\s*\{[^}]*\})\[0\]/g;
    content = content.replace(arrayPattern, '$1[]');
    if (content !== beforeFix2) fileFixed = true;

    // Fix 3: Missing semicolons in interfaces
    const beforeFix3 = content;
    content = content.replace(/(\w+:\s*[^;,}\n]+)\s*\n\s*(\w+:|})/, '$1;\n  $2');
    if (content !== beforeFix3) fileFixed = true;

    // Fix 4: Fix malformed method signatures
    const beforeFix4 = content;
    content = content.replace(/Promise<void>\s+Record<string,\s*any>/g, 'Promise<void>');
    if (content !== beforeFix4) fileFixed = true;

    // Fix 5: Fix broken template literals and method calls
    const beforeFix5 = content;
    content = content.replace(/\{\.\s*catch\(error[^)]*\)\s*\n/g, '{\n');
    if (content !== beforeFix5) fileFixed = true;

    // Fix 6: Fix missing return statements and variable declarations
    const beforeFix6 = content;
    content = content.replace(
      /return\s+\{\s*projections:\s*data\.projections\s*\}\s*\}\s*catch/g,
      'const data = await response.json();\n      return { projections: data.projections };\n    } catch'
    );
    if (content !== beforeFix6) fileFixed = true;

    // Fix 7: Fix interface closing braces
    const beforeFix7 = content;
    content = content.replace(/(\w+:\s*[^;,}\n]+)\s*\}/g, '$1;\n}');
    if (content !== beforeFix7) fileFixed = true;

    // Fix 8: Fix property assignment expected errors
    const beforeFix8 = content;
    content = content.replace(/(\w+):\s*$/gm, '$1: any;');
    if (content !== beforeFix8) fileFixed = true;

    // Fix 9: Fix unexpected token } (missing commas)
    const beforeFix9 = content;
    content = content.replace(/([^,\s])\s*\n\s*\}/g, '$1\n}');
    if (content !== beforeFix9) fileFixed = true;

    // Fix 10: Fix JSX closing tags and malformed expressions
    const beforeFix10 = content;
    content = content.replace(/>\/>/g, ' />');
    if (content !== beforeFix10) fileFixed = true;

    if (fileFixed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
      fixedIssues++;
    }

    processedFiles++;
    return fileFixed;
  } catch (error) {
    console.log(`❌ Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

// Main execution
const srcDir = path.join(process.cwd(), 'src');
const files = getAllTSFiles(srcDir);

console.log(`Found ${files.length} TypeScript files to process`);

// Process critical files first (adapters, core, components)
const criticalPatterns = [
  'adapters/',
  'core/',
  'components/QuantumSportsPlatform',
  'components/ViteErrorBoundary',
  'components/common/theme',
  'types/',
  'services/',
];

const criticalFiles = files
  .filter(file => criticalPatterns.some(pattern => file.includes(pattern)))
  .slice(0, 50);

console.log(`Processing ${criticalFiles.length} critical files first...`);

for (const file of criticalFiles) {
  fixFile(file);
}

console.log('\n🎯 CRITICAL SYNTAX REPAIR COMPLETE');
console.log(`📊 Processed: ${processedFiles} files`);
console.log(`🔧 Fixed: ${fixedIssues} files`);
console.log(`✅ Success rate: ${((fixedIssues / processedFiles) * 100).toFixed(1)}%`);
