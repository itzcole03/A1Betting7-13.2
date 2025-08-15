// SportsService.ts - v2 sports activation and related endpoints
import { httpFetch } from './HttpClient';

export interface ActivateSportResponse {
  status: string; // e.g. 'success'
  message?: string;
  error_code?: string;
  current_version?: string;
  migration_guide?: string;
  version_used?: string;
  newly_loaded?: boolean;
  load_time?: number;
}

/**
 * Logs API versioning and migration events for diagnostics.
 */
function logApiEvent(event: string, details: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.console) {
    // eslint-disable-next-line no-console
    console.warn(`[SportsService] ${event}:`, details);
  }
}

/**
 * Checks which sports activation API version is available.
 * Returns 'v2', 'v1', or 'none'.
 */
export async function detectSportsApiVersion(): Promise<'v2' | 'v1' | 'none'> {
  // Try v2 endpoint with OPTIONS (safe, no side effects)
  try {
    const v2resp = await httpFetch('/api/v2/sports/activate', {
      method: 'OPTIONS',
      logLabel: 'SportsService',
    });
    if (v2resp.ok) {
      // Successful preflight indicates v2 is available and CORS is properly configured
      // eslint-disable-next-line no-console
      console.debug('[SportsService] v2 API detected via OPTIONS preflight');
      return 'v2';
    } else if (v2resp.status === 405) {
      // 405 can indicate endpoint exists but OPTIONS not explicitly handled  
      // eslint-disable-next-line no-console
      console.debug('[SportsService] v2 API detected via 405 (method not allowed for OPTIONS)');
      return 'v2';
    }
  } catch (error) {
    // Handle network errors gracefully
    if (error instanceof Error && (error.message.includes('Failed to fetch') || error.name === 'TypeError')) {
      // eslint-disable-next-line no-console
      console.warn('[SportsService] Backend unavailable, falling back to demo mode');
      return 'none';
    }
    // eslint-disable-next-line no-console
    console.debug('[SportsService] v2 OPTIONS check failed:', error);
  }
  // Try v1 endpoint
  try {
    const v1resp = await httpFetch('/api/sports/activate/MLB', {
      method: 'OPTIONS',
      logLabel: 'SportsService',
    });
    if (v1resp.ok || v1resp.status === 405) {
      return 'v1';
    }
  } catch (error) {
    // Handle network errors gracefully
    if (error instanceof Error && (error.message.includes('Failed to fetch') || error.name === 'TypeError')) {
      console.warn('[SportsService] Backend unavailable, falling back to demo mode');
      return 'none';
    }
  }
  return 'none';
}

/**
 * Activates a sport using the best available API version.
 * Tries v2, falls back to v1 with warning and logs deprecated usage.
 * Returns demo mode response if backend unavailable instead of throwing.
 */
export async function activateSport(sport: string): Promise<ActivateSportResponse> {
  // Try v2 first
  try {
    const v2resp = await httpFetch(`/api/v2/sports/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sport }),
      logLabel: 'SportsService',
      version: 'v2',
    });
    if (v2resp.ok) {
      const data = await v2resp.json();
      logApiEvent('v2 activation success', {
        sport,
        requestId: v2resp.headers.get('X-Request-ID'),
      });
      return { ...data, version_used: 'v2' };
    } else if (v2resp.status === 404 || v2resp.status === 410) {
      logApiEvent('v2 endpoint unavailable', {
        status: v2resp.status,
        sport,
        requestId: v2resp.headers.get('X-Request-ID'),
      });
      // Fall through to v1
    } else {
      const data = await v2resp.json().catch(() => ({}));
      throw new Error(
        data?.message || `Failed to activate sport (v2): ${sport} (status ${v2resp.status})`
      );
    }
  } catch (err) {
    // Handle network errors gracefully
    if (err instanceof Error && (err.message.includes('Failed to fetch') || err.name === 'TypeError')) {
      console.warn('[SportsService] Backend unavailable, returning demo mode activation');
      return {
        status: 'success',
        message: `${sport} activated in demo mode`,
        version_used: 'demo',
        newly_loaded: true,
      };
    }
    logApiEvent('v2 activation error', { error: (err as Error).message, sport });
    // Fall through to v1
  }
  // Try v1 as fallback
  try {
    const v1resp = await httpFetch(`/api/sports/activate/${sport}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      logLabel: 'SportsService',
      version: 'v1',
    });
    if (v1resp.ok) {
      const data = await v1resp.json();
      logApiEvent('deprecated v1 endpoint used', {
        sport,
        requestId: v1resp.headers.get('X-Request-ID'),
      });
      return { ...data, version_used: 'v1' };
    } else {
      const data = await v1resp.json().catch(() => ({}));
      throw new Error(
        data?.message || `Failed to activate sport (v1): ${sport} (status ${v1resp.status})`
      );
    }
  } catch (err) {
    // Handle network errors gracefully
    if (err instanceof Error && (err.message.includes('Failed to fetch') || err.name === 'TypeError')) {
      console.warn('[SportsService] Backend unavailable, returning demo mode activation');
      return {
        status: 'success',
        message: `${sport} activated in demo mode`,
        version_used: 'demo',
        newly_loaded: true,
      };
    }
    logApiEvent('v1 activation error', { error: (err as Error).message, sport });
    // Return demo mode instead of throwing
    console.warn(`[SportsService] All activation attempts failed for ${sport}, falling back to demo mode`);
    return {
      status: 'success',
      message: `${sport} activated in demo mode (backend unavailable)`,
      version_used: 'demo',
      newly_loaded: true,
    };
  }
}

/**
 * Checks API version compatibility at app startup. Logs and falls back to demo mode if no backend available.
 */
export async function checkApiVersionCompatibility() {
  try {
    const version = await detectSportsApiVersion();
    if (version === 'none') {
      logApiEvent('no compatible sports activation API found - using demo mode', {});
      console.warn('[SportsService] Backend unavailable, application will run in demo mode');
      return 'demo'; // Return demo mode instead of throwing
    }
    if (version === 'v1') {
      logApiEvent('using deprecated v1 sports activation API', {});
    }
    return version;
  } catch (error) {
    console.warn('[SportsService] API compatibility check failed, falling back to demo mode:', error);
    return 'demo';
  }
}
