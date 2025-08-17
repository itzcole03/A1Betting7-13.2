/**
 * @deprecated This module is deprecated. Use validateHealthResponse from './validateHealthResponse' instead.
 * Guards against runtime errors when accessing health.performance.cache_hit_rate
 * and other critical health metrics by normalizing API responses to a safe shape.
 * 
 * @module ensureHealthShape
 */

import { validateHealthResponse } from './validateHealthResponse';
import { oneTimeLog } from './oneTimeLog';

export interface SystemHealth {
  status: string;
  services: {
    api: string;
    cache: string;
    database: string;
  };
  performance: {
    cache_hit_rate: number;
    cache_type: string;
  };
  uptime_seconds: number;
  originFlags?: {
    hadCacheHitRate?: boolean;
    mappedHitRate?: boolean;
    usedMock?: boolean;
  };
}

/**
 * @deprecated Use validateHealthResponse from './validateHealthResponse' instead.
 * Ensures health data conforms to SystemHealth shape with safe defaults
 * 
 * This function now acts as a compatibility shim that converts new health format
 * to the legacy SystemHealth format for backward compatibility.
 */
export function ensureHealthShape(raw: unknown, options?: { usedMock?: boolean }): SystemHealth {
  // Log deprecation notice once per session
  oneTimeLog(
    'ensureHealthShape-deprecated',
    // eslint-disable-next-line no-console
    () => console.info('[DEPRECATED] ensureHealthShape is deprecated. Use validateHealthResponse instead.')
  );

  try {
    // Try the new validator first
    const validated = validateHealthResponse(raw);
    
    // Convert new format to legacy SystemHealth format
    return {
      status: validated.overall_status,
      services: {
        api: validated.services?.find(s => s.name === 'api')?.status || 'unknown',
        cache: validated.infrastructure?.cache?.status || 'unknown',
        database: validated.infrastructure?.database?.status || 'unknown',
      },
      performance: {
        cache_hit_rate: validated.performance?.cache_hit_rate || validated.cache?.hit_rate || 0,
        cache_type: typeof validated.cache === 'object' ? 'unified' : 'unknown',
      },
      uptime_seconds: validated.uptime_seconds || 0,
      originFlags: {
        hadCacheHitRate: !!(validated.performance?.cache_hit_rate || validated.cache?.hit_rate),
        mappedHitRate: false, // New validator handles mapping internally
        usedMock: options?.usedMock || false,
      },
    };
  } catch (error) {
    // Fallback to mock data if validation fails
    oneTimeLog(
      'ensureHealthShape-fallback',
      // eslint-disable-next-line no-console
      () => console.warn('[ensureHealthShape] Validation failed, using fallback data:', error)
    );

    return {
      status: 'unknown',
      services: {
        api: 'unknown',
        cache: 'unknown',
        database: 'unknown',
      },
      performance: {
        cache_hit_rate: 0,
        cache_type: 'unknown',
      },
      uptime_seconds: 0,
      originFlags: {
        hadCacheHitRate: false,
        mappedHitRate: false,
        usedMock: options?.usedMock || true, // Indicate fallback was used
      },
    };
  }
}