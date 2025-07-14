// Post-build script to copy package.json to output directory for Electron
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../package.json');
const dest = path.resolve(__dirname, '../electron-dist/win-unpacked/package.json');

try {
  fs.copyFileSync(src, dest);
  console.log('Copied package.json to electron-dist/win-unpacked');
} catch (e) {
  console.error('Failed to copy package.json:', e);
  process.exit(1);
}
