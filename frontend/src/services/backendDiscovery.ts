/**
 * Backend Discovery Service
 * Automatically finds and connects to available A1Betting backend
 * Searches ports 8000-8010 for active backend instances
 */

const _COMMON_PORTS = [8000, 8001];
const _HEALTH_PATH = '/api/health/status';

export async function discoverBackend(): Promise<string | null> {
  for (const _port of _COMMON_PORTS) {
    const _url = `http://localhost:${_port}${_HEALTH_PATH}`;
    try {
      const _res = await fetch(_url, { method: 'GET' });
      if (_res.ok) {
        console.log(`[A1BETTING DISCOVERY] Found backend at ${_url}`);
        return `http://localhost:${_port}`;
      }
    } catch {
      // Ignore errors, try next port
    }
  }
  return null;
}
