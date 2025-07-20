/**
 * Backend Discovery Service
 * Automatically finds and connects to available A1Betting backend
 * Searches ports 8000-8010 for active backend instances
 */

const COMMON_PORTS = [8000, 8001];
const HEALTH_PATH = '/api/health/status';

export async function discoverBackend(): Promise<string | null> {
  for (const port of COMMON_PORTS) {
    const url = `http://localhost:${port}${HEALTH_PATH}`;
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) {
        console.log(`[A1BETTING DISCOVERY] Found backend at ${url}`);
        return `http://localhost:${port}`;
      }
    } catch {
      // Ignore errors, try next port
    }
  }
  return null;
}
