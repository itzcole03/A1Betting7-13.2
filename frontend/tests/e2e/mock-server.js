#!/usr/bin/env node
// Lightweight mock API server used for local Playwright lean runs.
// This uses only Node built-ins so no extra deps are required.
const http = require('http');
const url = require('url');

const PORT = process.env.MOCK_API_PORT ? Number(process.env.MOCK_API_PORT) : 8000;
let seed = {
  props: [
    { id: 'p-alice', player: 'Alice Example', stat_type: 'points', confidence: 72 },
    { id: 'p-bob', player: 'Bob Sample', stat_type: 'rebounds', confidence: 55 },
  ],
  predictions: [{ id: 'pr-1', player: 'Alice Example', confidence: 72, source: 'mock' }],
};

function json(res, status, obj) {
  const payload = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const method = req.method || 'GET';
  const p = parsed.pathname || '/';

  // Health & readiness
  if (p === '/api/health' || p === '/api/testing/ready') {
    return json(res, 200, { success: true, env: 'mock' });
  }

  if (p === '/internal/test/seed' && method === 'POST') {
    // Collect body
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const obj = JSON.parse(body || '{}');
        // Support either full shape or just parts
        if (obj.props) seed.props = obj.props;
        if (obj.predictions) seed.predictions = obj.predictions;
        json(res, 200, { success: true, seeded: true });
      } catch (e) {
        json(res, 400, { success: false, error: 'invalid-json' });
      }
    });
    return;
  }

  // Propfinder endpoints
  if (p && p.startsWith('/api/propfinder/opportunities')) {
    // Simple paging support: ?limit=5
    const q = parsed.query || {};
    const limit = Number(q.limit) || seed.props.length;
    const data = seed.props.slice(0, limit);
    return json(res, 200, { success: true, data, count: data.length });
  }

  if (p === '/api/props') {
    return json(res, 200, { success: true, data: seed.props });
  }

  if (p === '/api/predictions') {
    return json(res, 200, { success: true, data: seed.predictions });
  }

  // Fallback - not found
  json(res, 404, { success: false, error: 'not_found', path: p });
});

server.listen(PORT, () => {
  try {
    const fs = require('fs');
    const pidPath = 'tests/e2e/mock-server.pid';
    fs.writeFileSync(pidPath, String(process.pid), 'utf8');
  } catch (e) {
    // ignore
  }
  // eslint-disable-next-line no-console
  console.log(`✅ Mock API server listening on http://localhost:${PORT}`);
});

process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());

function shutdown() {
  try {
    server.close(() => {
      // eslint-disable-next-line no-console
      console.log('🛑 Mock API server shutting down');
      try {
        const fs = require('fs');
        const pidPath = 'tests/e2e/mock-server.pid';
        if (fs.existsSync(pidPath)) fs.unlinkSync(pidPath);
      } catch (_) {}
      process.exit(0);
    });
  } catch (e) {
    process.exit(1);
  }
}
