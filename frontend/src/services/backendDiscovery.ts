// [DEBUG] Top of real backendDiscovery.ts loaded
/**
 * Backend Discovery Service
 * Automatically finds and connects to available A1Betting backend
 * Searches ports 8000-8010 for active backend instances
 */

const _COMMON_PORTS = [8000, 8001];
const _HEALTH_PATH = '/health';

export async function discoverBackend(): Promise<string | null> {
  // Debug log to check if real discoverBackend is called
  // eslint-disable-next-line no-console
  console.log('[REAL] discoverBackend called');

  // In development mode, try the proxy first
  // Use Vite environment variables directly
  const getEnvVar = (key: string, fallback: string) => {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key] || fallback;
    }
    return fallback;
  };
  if (getEnvVar('DEV', '') === 'true') {
    try {
      const res = await fetch('/health', { method: 'GET' });
      if (res.ok) {
        console.log('[A1BETTING DISCOVERY] Found backend via proxy');
        return ''; // Empty string means use relative URLs (proxy)
      }
    } catch {
      // Proxy failed, continue with direct port discovery
    }
  }

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
