// Minimal headless smoke script
// Usage: node scripts/headless_smoke.js

const http = require('http');

function fetchJson(path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port: 8000,
      path,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (err) {
          reject(new Error(`Invalid JSON response from ${path}: ${err.message}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

(async function main() {
  try {
    console.log('Checking /api/health');
    const h = await fetchJson('/api/health');
    console.log(`/api/health -> ${h.status}`);

    console.log('Checking /mlb/comprehensive-props/1');
    const p = await fetchJson('/mlb/comprehensive-props/1');
    console.log(`/mlb/comprehensive-props/1 -> ${p.status}`);
    if (!p.body || typeof p.body.success === 'undefined') {
      console.error('Comprehensive props: unexpected response shape');
      process.exitCode = 2;
      return;
    }

    console.log('Checking /api/arbitrage-opportunities');
    const a = await fetchJson('/api/arbitrage-opportunities');
    console.log(`/api/arbitrage-opportunities -> ${a.status}`);
    if (!a.body || !Array.isArray(a.body.data) && !(Array.isArray(a.body))) {
      // some endpoints return an envelope {success,data,...} while others return direct array in `data`
      console.warn('Arbitrage endpoint returned unexpected shape; printing sample');
      console.log(JSON.stringify(a.body, null, 2));
    }

    console.log('\nSummary: All reachable endpoints responded.');
    process.exitCode = 0;
  } catch (err) {
    console.error('Smoke check failed:', err.message);
    process.exitCode = 1;
  }
})();
