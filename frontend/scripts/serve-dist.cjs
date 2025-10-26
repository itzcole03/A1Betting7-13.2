#!/usr/bin/env node
// Minimal static server for E2E runs (CommonJS). Serves ./dist and falls back to index.html
// Usage: node scripts/serve-dist.cjs [port]

const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.argv[2] || process.env.PORT || 5173);
const host = '127.0.0.1';
const distDir = path.resolve(__dirname, '..', 'dist');

function contentType(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css; charset=utf-8';
  if (file.endsWith('.json')) return 'application/json; charset=utf-8';
  if (file.endsWith('.svg')) return 'image/svg+xml';
  if (file.endsWith('.png')) return 'image/png';
  if (file.endsWith('.jpg') || file.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  try {
    const decoded = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(distDir, decoded);
    // Prevent path traversal
    if (!filePath.startsWith(distDir)) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      fs.readFile(filePath, (err2, data) => {
        if (err2) {
          // Fallback to index.html for SPA routing
          const indexPath = path.join(distDir, 'index.html');
          fs.readFile(indexPath, (err3, idxData) => {
            if (err3) {
              res.statusCode = 500;
              res.end('Index not found');
              return;
            }
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(idxData);
          });
          return;
        }
        res.setHeader('Content-Type', contentType(filePath));
        res.end(data);
      });
    });
  } catch (e) {
    res.statusCode = 500;
    res.end(String(e));
  }
});

server.listen(port, host, () => {
  console.log(`✅ Serving ./dist at http://${host}:${port}`);
});

// Graceful shutdown
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
