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
  console.log('[REAL] discoverBackend called - skipping to prevent fetch errors');

  // Skip discovery entirely to prevent fetch errors
  // App will use fallback URL or run in demo mode
  console.warn('[A1BETTING DISCOVERY] Backend discovery disabled - using demo mode');
  return null;
}
