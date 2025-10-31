#!/usr/bin/env node
// Lightweight mock API server (CommonJS) used for local Playwright lean runs.
const http = require('http');
const url = require('url');

// Allow multiple env vars for compatibility with different runners
const path = require('path');
const fs = require('fs');
const PORT =
  (process.env.MOCK_API_PORT && Number(process.env.MOCK_API_PORT)) ||
  (process.env.E2E_MOCK_PORT && Number(process.env.E2E_MOCK_PORT)) ||
  (process.env.PORT && Number(process.env.PORT)) ||
  8000;

// Repo-level tests/e2e paths so PID and seed files are visible to repo consumers
const repoLevelTestsE2E = path.resolve(__dirname, '../../../tests/e2e');
const pidPath = path.resolve(repoLevelTestsE2E, 'mock-server.pid');
const seedPath = path.resolve(repoLevelTestsE2E, 'mock-seed.json');

// Load persisted seed if present so mock server restarts keep state for local dev
try {
  if (fs.existsSync(seedPath)) {
    const content = fs.readFileSync(seedPath, 'utf8');
    if (content) {
      const persisted = JSON.parse(content);
      if (persisted && typeof persisted === 'object') {
        seed = Object.assign({}, seed, persisted);
        seed.props = seed.props || [];
        seed.predictions = seed.predictions || [];
        seed.lineups = seed.lineups || [];
        // eslint-disable-next-line no-console
        console.log('Loaded persisted mock seed from', seedPath);
      }
    }
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('Could not read persisted mock seed:', e && e.message);
}
let seed = {
  props: [
    {
      id: 'p-alice',
      player: 'Alice Example',
      team: 'ALC',
      stat_type: 'points',
      market: 'player_points',
      start_time: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      confidence: 72,
      line: 24.5,
      books: [{ name: 'MockBook', line: 24.5, probability: 0.6 }],
      metadata: { source: 'mock', note: 'seed' },
    },
    {
      id: 'p-bob',
      player: 'Bob Sample',
      team: 'BSP',
      stat_type: 'rebounds',
      market: 'player_rebounds',
      start_time: new Date(Date.now() + 1000 * 60 * 120).toISOString(),
      confidence: 55,
      line: 8.5,
      books: [{ name: 'MockBook', line: 8.5, probability: 0.52 }],
      metadata: { source: 'mock', note: 'seed' },
    },
  ],
  predictions: [
    {
      id: 'pr-1',
      prop_id: 'p-alice',
      player: 'Alice Example',
      predicted_value: 25,
      line: 24.5,
      source: 'mock',
      confidence: 72,
      created_at: new Date().toISOString(),
    },
  ],
  // In-memory lineup store for CRUD operations
  lineups: [
    {
      id: 'l-1',
      user_id: 'u-1',
      name: 'sample-lineup',
      selections: ['p-alice'],
      created_at: new Date().toISOString(),
    },
  ],
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
  // Enable permissive CORS for local E2E stub + runner convenience.
  // This mock server is only used in developer/test contexts.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (method === 'OPTIONS') {
    return json(res, 204, { success: true });
  }

  // Health & readiness
  if (p === '/api/health' || p === '/api/testing/ready') {
    return json(res, 200, { success: true, env: 'mock' });
  }

  // Simple auth/login endpoint for tests that expect a token
  if (p === '/api/auth/login' && method === 'POST') {
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', () => {
      try {
        const obj = JSON.parse(body || '{}');
        const username = obj.username || 'testuser';
        const token = `mock-token-${username}`;
        return json(res, 200, { success: true, token, user: { id: 'u-1', username } });
      } catch (e) {
        return json(res, 400, { success: false, error: 'invalid-json' });
      }
    });
    return;
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
        // Persist seed to disk for developer convenience
        try {
          fs.mkdirSync(repoLevelTestsE2E, { recursive: true });
          fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), 'utf8');
        } catch (writeErr) {
          // ignore write errors
        }
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

  // Prop details: /api/props/:id
  const propDetailMatch = p.match(/^\/api\/props\/(.+)$/);
  if (propDetailMatch && method === 'GET') {
    const pid = propDetailMatch[1];
    const prop = seed.props.find(pp => pp.id === pid);
    if (!prop) return json(res, 404, { success: false, error: 'not_found' });
    return json(res, 200, { success: true, data: prop });
  }

  if (p === '/api/predictions') {
    return json(res, 200, { success: true, data: seed.predictions });
  }

  // Market/books endpoint - returns books for a given prop or market
  if (p && p.startsWith('/api/markets')) {
    // Example: /api/markets?prop_id=p-alice
    const q = parsed.query || {};
    const propId = q.prop_id;
    const books = (seed.props.find(pp => pp.id === propId) || { books: [] }).books || [];
    return json(res, 200, { success: true, data: books });
  }

  // Lineup endpoints - support GET list, POST create, PUT/PATCH update, DELETE
  if (p === '/api/lineup') {
    if (method === 'GET') {
      return json(res, 200, { success: true, data: seed.lineups });
    }

    if (method === 'POST') {
      let body = '';
      req.on('data', c => (body += c));
      req.on('end', () => {
        try {
          const obj = JSON.parse(body || '{}');
          const id = obj.id || `l-${Date.now()}`;
          const newLineup = Object.assign({ id, created_at: new Date().toISOString() }, obj);
          seed.lineups.push(newLineup);
          return json(res, 201, { success: true, data: newLineup });
        } catch (e) {
          return json(res, 400, { success: false, error: 'invalid-json' });
        }
      });
      return;
    }
  }

  // PUT/PATCH/DELETE for /api/lineup/:id
  const lineupIdMatch = p.match(/^\/api\/lineup\/(.+)$/);
  if (lineupIdMatch) {
    const lid = lineupIdMatch[1];
    if (method === 'PUT' || method === 'PATCH') {
      let body = '';
      req.on('data', c => (body += c));
      req.on('end', () => {
        try {
          const obj = JSON.parse(body || '{}');
          const idx = seed.lineups.findIndex(l => l.id === lid);
          if (idx === -1) return json(res, 404, { success: false, error: 'not_found' });
          seed.lineups[idx] = Object.assign(seed.lineups[idx], obj, {
            updated_at: new Date().toISOString(),
          });
          return json(res, 200, { success: true, data: seed.lineups[idx] });
        } catch (e) {
          return json(res, 400, { success: false, error: 'invalid-json' });
        }
      });
      return;
    }

    if (method === 'DELETE') {
      const idx = seed.lineups.findIndex(l => l.id === lid);
      if (idx === -1) return json(res, 404, { success: false, error: 'not_found' });
      const removed = seed.lineups.splice(idx, 1)[0];
      return json(res, 200, { success: true, data: removed });
    }
  }

  // Analytics/events endpoint collects posted events (no-op)
  if (p === '/api/analytics/events' && method === 'POST') {
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', () => {
      try {
        const obj = JSON.parse(body || '[]');
        // In a real server we'd persist, here we just echo count
        const count = Array.isArray(obj) ? obj.length : 1;
        return json(res, 200, { success: true, received: count });
      } catch (e) {
        return json(res, 400, { success: false, error: 'invalid-json' });
      }
    });
    return;
  }

  // Fallback - not found
  json(res, 404, { success: false, error: 'not_found', path: p });
});

server.listen(PORT, () => {
  try {
    fs.mkdirSync(repoLevelTestsE2E, { recursive: true });
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
        if (fs.existsSync(pidPath)) fs.unlinkSync(pidPath);
      } catch (_) {}
      process.exit(0);
    });
  } catch (e) {
    process.exit(1);
  }
}
