#!/usr/bin/env node
// Minimal static server for E2E runs (CommonJS). Serves ./dist and falls back to index.html
// Usage: node scripts/serve-dist-fixed.cjs [port]

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const port = Number(process.argv[2] || process.env.PORT || 5173);
const host = '127.0.0.1';
// Backend to proxy API/WebSocket requests to during E2E runs.
// Can be overridden with BACKEND_URL env var (e.g. http://localhost:8000)
const BACKEND_ORIGIN = process.env.BACKEND_URL || 'http://localhost:8000';
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
    // If request is for API or websocket path, proxy to backend origin.
    // This ensures the SPA (served statically) can reach backend endpoints
    // using relative paths like /api/* when run under Playwright.
    if (decoded.startsWith('/api') || decoded.startsWith('/ws')) {
      proxyToBackend(req, res);
      return;
    }
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

function proxyToBackend(req, res) {
  try {
    // Basic request logging so Playwright trace runs capture proxy activity.
    // We also append the same logs to a file under frontend/test-results so
    // CI artifacts can be correlated with Playwright traces.
    const proxyLogPath =
      process.env.PROXY_LOG_PATH || path.resolve(__dirname, '..', 'test-results', 'proxy.log');
    function safeAppendJSON(obj) {
      try {
        fs.appendFile(proxyLogPath, JSON.stringify(obj, null, 0) + '\n', () => {});
      } catch (e) {
        // ignore
      }
    }
    const json = {
      ts: new Date().toISOString(),
      direction: 'client->proxy',
      method: req.method,
      url: req.url,
      proxy_request_id: rid,
      forward: BACKEND_ORIGIN,
    };
    console.log(
      '[proxy]',
      json.ts,
      `--> ${req.method} ${req.url} proxy_request_id=${rid} forward-> ${BACKEND_ORIGIN}`
    );
    safeAppendJSON(Object.assign({ type: 'proxy_request' }, json));
    try {
      // Prefer an explicit proxy request id header, then x-request-id, otherwise generate one.
      const incomingProxyId = req.headers['x-proxy-request-id'] || req.headers['x-request-id'];
      const rid =
        incomingProxyId ||
        (crypto && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

      // Ensure the upstream receives a canonical id header (both names for compatibility)
      try {
        req.headers['x-proxy-request-id'] = rid;
      } catch (e) {}

      const msg = `[proxy] ${new Date().toISOString()} --> ${req.method} ${
        req.url
      } proxy_request_id=${rid} forward-> ${BACKEND_ORIGIN}`;
      console.log(msg);
      safeAppend(msg);
    } catch (e) {
      // swallow logging errors
    }
    const backendUrl = new URL(BACKEND_ORIGIN);
    const options = {
      protocol: backendUrl.protocol,
      hostname: backendUrl.hostname,
      port: backendUrl.port || (backendUrl.protocol === 'https:' ? 443 : 80),
      path: req.url,
      method: req.method,
      // Clone headers and ensure canonical proxy id is forwarded upstream
      headers: Object.assign({}, req.headers),
    };

    // If we generated/normalized a proxy id above, forward it explicitly
    try {
      if (!options.headers['x-proxy-request-id'] && req.headers['x-proxy-request-id']) {
        options.headers['x-proxy-request-id'] = req.headers['x-proxy-request-id'];
      }
      // Also set x-request-id for downstream compatibility
      if (!options.headers['x-request-id'] && options.headers['x-proxy-request-id']) {
        options.headers['x-request-id'] = options.headers['x-proxy-request-id'];
      }
    } catch (e) {}

    // Remove host header so backend sees its own host
    delete options.headers.host;

    const httpModule = backendUrl.protocol === 'https:' ? require('https') : require('http');
    const proxyReq = httpModule.request(options, proxyRes => {
      // Log upstream response status for correlation with trace timestamps
      try {
        const json = {
          ts: new Date().toISOString(),
          direction: 'upstream->proxy',
          upstream: `${backendUrl.hostname}:${options.port}${options.path}`,
          status: proxyRes.statusCode,
          proxy_request_id:
            (options.headers &&
              (options.headers['x-proxy-request-id'] || options.headers['x-request-id'])) ||
            null,
        };
        console.log('[proxy]', json.ts, `<-- upstream ${json.upstream} status=${json.status}`);
        safeAppendJSON(Object.assign({ type: 'proxy_response' }, json));
      } catch (e) {}

      // Copy status and headers
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', err => {
      // Log proxy error clearly so CI/test artifacts contain the failure reason
      try {
        const json = {
          ts: new Date().toISOString(),
          direction: 'error',
          method: req.method,
          url: req.url,
          error: String(err),
          proxy_request_id:
            (req.headers && (req.headers['x-proxy-request-id'] || req.headers['x-request-id'])) ||
            null,
        };
        console.error('[proxy ERROR]', json.ts, json.error);
        safeAppendJSON(Object.assign({ type: 'proxy_error' }, json));
      } catch (e) {}
      res.statusCode = 502;
      res.end('Bad Gateway: ' + String(err));
    });

    // Pipe request body
    req.pipe(proxyReq, { end: true });
  } catch (err) {
    res.statusCode = 500;
    res.end('Proxy error: ' + String(err));
  }
}
