// SportsService.ts - v2 sports activation and related endpoints
import { httpFetch } from './HttpClient';

export interface ActivateSportResponse {
  success: boolean;
  message: string;
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
    if (v2resp.ok || v2resp.status === 405) {
      return 'v2';
    }
  } catch {}
  // Try v1 endpoint
  try {
    const v1resp = await httpFetch('/api/sports/activate/MLB', {
      method: 'OPTIONS',
      logLabel: 'SportsService',
    });
    if (v1resp.ok || v1resp.status === 405) {
      return 'v1';
    }
  } catch {}
  return 'none';
}

/**
 * Activates a sport using the best available API version.
 * Tries v2, falls back to v1 with warning and logs deprecated usage.
 * Throws standardized error on version mismatch or failure.
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
    logApiEvent('v1 activation error', { error: (err as Error).message, sport });
    throw new Error(
      `Failed to activate sport: ${sport}. No compatible API version found. Please check backend version.`
    );
  }
}

/**
 * Checks API version compatibility at app startup. Logs and throws if no compatible version is found.
 */
export async function checkApiVersionCompatibility() {
  const version = await detectSportsApiVersion();
  if (version === 'none') {
    logApiEvent('no compatible sports activation API found', {});
    throw new Error('No compatible sports activation API found. Please update backend.');
  }
  if (version === 'v1') {
    logApiEvent('using deprecated v1 sports activation API', {});
  }
  return version;
}
