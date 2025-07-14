const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TSX files
const tsxFiles = glob.sync('src/**/*.tsx', { cwd: __dirname });

console.log(`Found ${tsxFiles.length} TSX files`);

let fixedCount = 0;

tsxFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  const content = fs.readFileSync(fullPath, 'utf8');

  // Check if React is already imported
  const hasReactImport = content.includes('import React') || content.includes('import * as React');

  // Check if file uses JSX (contains < followed by uppercase letter)
  const usesJSX =
    /<[A-Z]/.test(content) ||
    /<\/[A-Z]/.test(content) ||
    content.includes('React.FC') ||
    content.includes('React.Component');

  if (!hasReactImport && usesJSX) {
    console.log(`Adding React import to: ${filePath}`);

    // Add React import at the top
    const lines = content.split('\n');
    let insertIndex = 0;

    // Find the first non-empty line that's not a comment
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*')) {
        insertIndex = i;
        break;
      }
    }

    lines.splice(insertIndex, 0, "import React from 'react';");

    const newContent = lines.join('\n');
    fs.writeFileSync(fullPath, newContent, 'utf8');
    fixedCount++;
  }
});

console.log(`Fixed ${fixedCount} files`);
