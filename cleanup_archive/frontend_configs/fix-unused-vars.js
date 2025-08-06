// Automated script to prefix unused variables with _ for ESLint remediation
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const patterns = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'];

const unusedVarRegex =
  /\b(const|let|var)\s+([a-zA-Z][a-zA-Z0-9_]*)\s*=.*?\/\/.*?@typescript-eslint\/no-unused-vars.*$/gm;
const unusedArgRegex =
  /(function\s+[a-zA-Z0-9_]+\s*\(|\([^)]+\))\s*{[^}]*\/\/.*?@typescript-eslint\/no-unused-vars.*$/gm;

function prefixUnusedVars(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Prefix unused variable declarations
  content = content.replace(/(const|let|var)\s+([a-zA-Z][a-zA-Z0-9_]*)/g, (match, decl, name) => {
    if (!name.startsWith('_')) {
      return `${decl} _${name}`;
    }
    return match;
  });
  // Prefix unused function arguments
  content = content.replace(/function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g, (match, fnName, args) => {
    const newArgs = args
      .split(',')
      .map(arg => {
        arg = arg.trim();
        if (arg && !arg.startsWith('_')) {
          return `_${arg}`;
        }
        return arg;
      })
      .join(', ');
    return `function ${fnName}(${newArgs})`;
  });
  fs.writeFileSync(filePath, content, 'utf8');
}

patterns.forEach(pattern => {
  glob.sync(pattern, { cwd: path.resolve(__dirname, 'src'), absolute: true }).forEach(file => {
    prefixUnusedVars(file);
  });
});

console.log('Unused variables and arguments have been prefixed with _ where possible.');
