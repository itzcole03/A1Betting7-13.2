/**
 * Reliability response validation utility
 * Validates reliability report data from /api/v2/diagnostics/reliability
 */

import { ValidatedReliabilityPayload, ReliabilityReport, Anomaly, DiagnosticsError } from '../types/diagnostics';
import { oneTimeLog } from './oneTimeLog';

/**
 * Safe stringify for logging
 */
const safeStringify = (obj: unknown): string => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
};

/**
 * Normalize status to expected values
 */
const normalizeStatus = (status: unknown): 'ok' | 'degraded' | 'down' => {
  if (typeof status === 'string') {
    const normalized = status.toLowerCase();
    if (normalized === 'ok' || normalized === 'healthy') return 'ok';
    if (normalized === 'degraded' || normalized === 'warning') return 'degraded';
    if (normalized === 'down' || normalized === 'error' || normalized === 'unhealthy') return 'down';
  }
  return 'down'; // Default to down for unknown states
};

/**
 * Normalize anomaly severity to expected values
 */
const normalizeAnomaly = (severity: unknown): 'info' | 'warning' | 'critical' => {
  if (typeof severity === 'string') {
    const normalized = severity.toLowerCase();
    if (normalized === 'info' || normalized === 'low') return 'info';
    if (normalized === 'warning' || normalized === 'warn' || normalized === 'medium') return 'warning';
    if (normalized === 'critical' || normalized === 'error' || normalized === 'high') return 'critical';
  }
  return 'warning'; // Default to warning for unknown severities
};

/**
 * Safely coerce value to number with fallback
 */
const coerceToNumber = (value: unknown, fallback: number = 0): number => {
  if (typeof value === 'number' && isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

/**
 * Validates and normalizes reliability response data
 * Checks critical keys: overall_status, anomalies[], timestamp
 * 
 * @param raw - Raw response data from backend
 * @returns Validated reliability payload
 * @throws DiagnosticsError if critical structure is missing
 */
export function validateReliabilityResponse(raw: unknown): ValidatedReliabilityPayload {
  // Type guard for raw data
  if (!raw || typeof raw !== 'object') {
    const error: DiagnosticsError = new Error('Reliability response is not an object') as DiagnosticsError;
    error.code = 'RELIABILITY_FETCH_FAILED';
    error.context = { raw };
    throw error;
  }

  const rawObj = raw as Record<string, unknown>;

  // Check for mandatory top-level keys
  const mandatoryKeys = ['overall_status', 'anomalies', 'timestamp'];
  const missingKeys = mandatoryKeys.filter(key => !(key in rawObj));

  if (missingKeys.length > 0) {
    oneTimeLog(
      'reliability-validation-missing-keys',
      () => {
        // eslint-disable-next-line no-console
        console.warn(
          '[Reliability Validator] Missing mandatory fields:',
          missingKeys.join(', '),
          '\nRaw data:',
          safeStringify(raw)
        );
      },
      missingKeys.join(',')
    );

    const error: DiagnosticsError = new Error(`Missing mandatory reliability fields: ${missingKeys.join(', ')}`) as DiagnosticsError;
    error.code = 'RELIABILITY_FETCH_FAILED';
    error.context = { missingKeys, raw };
    throw error;
  }

  // Extract and validate anomalies array
  const anomaliesRaw = rawObj.anomalies;
  let anomalies: Anomaly[] = [];
  
  if (Array.isArray(anomaliesRaw)) {
    anomalies = anomaliesRaw.map((anomaly, index) => {
      if (!anomaly || typeof anomaly !== 'object') {
        oneTimeLog(
          'reliability-validation-invalid-anomaly',
          // eslint-disable-next-line no-console
          () => console.warn(`[Reliability Validator] Invalid anomaly at index ${index}:`, anomaly),
          `index-${index}`
        );
        return {
          code: `unknown-anomaly-${index}`,
          severity: 'warning' as const,
          message: 'Invalid anomaly data',
        };
      }
      
      const anomalyObj = anomaly as Record<string, unknown>;
      return {
        code: typeof anomalyObj.code === 'string' ? anomalyObj.code : `anomaly-${index}`,
        severity: normalizeAnomaly(anomalyObj.severity),
        message: typeof anomalyObj.message === 'string' ? anomalyObj.message : undefined,
        context: anomalyObj.context && typeof anomalyObj.context === 'object' 
          ? anomalyObj.context as Record<string, unknown> 
          : undefined,
        timestamp: typeof anomalyObj.timestamp === 'string' ? anomalyObj.timestamp : undefined,
        category: typeof anomalyObj.category === 'string' ? anomalyObj.category : undefined,
      };
    });
  } else {
    oneTimeLog(
      'reliability-validation-anomalies-not-array',
      // eslint-disable-next-line no-console
      () => console.warn('[Reliability Validator] Anomalies field is not an array:', anomaliesRaw)
    );
  }

  // Extract optional metric trends
  const trendsRaw = rawObj.metric_trends;
  let metric_trends: ReliabilityReport['metric_trends'] = undefined;
  
  if (Array.isArray(trendsRaw)) {
    metric_trends = trendsRaw.map((trend, index) => {
      if (!trend || typeof trend !== 'object') {
        return {
          metric: `metric-${index}`,
          current_value: 0,
          trend: 'stable' as const,
          change_percent: 0,
        };
      }
      
      const trendObj = trend as Record<string, unknown>;
      const trendDirection = typeof trendObj.trend === 'string' && 
        ['improving', 'stable', 'degrading'].includes(trendObj.trend.toLowerCase())
        ? (trendObj.trend.toLowerCase() as 'improving' | 'stable' | 'degrading')
        : 'stable';
        
      return {
        metric: typeof trendObj.metric === 'string' ? trendObj.metric : `metric-${index}`,
        current_value: coerceToNumber(trendObj.current_value),
        trend: trendDirection,
        change_percent: coerceToNumber(trendObj.change_percent),
      };
    });
  }

  // Build validated reliability object
  const validated: ValidatedReliabilityPayload = {
    overall_status: normalizeStatus(rawObj.overall_status),
    anomalies,
    timestamp: typeof rawObj.timestamp === 'string' ? rawObj.timestamp : new Date().toISOString(),
    metric_trends,
    prediction_accuracy: coerceToNumber(rawObj.prediction_accuracy),
    system_stability: coerceToNumber(rawObj.system_stability),
    data_quality_score: coerceToNumber(rawObj.data_quality_score),
    traces: Array.isArray(rawObj.traces) ? rawObj.traces : undefined, // Pass through as-is for optional detailed traces
    __validated: true,
    // Preserve other fields for extensibility
    ...Object.fromEntries(
      Object.entries(rawObj).filter(([key]) => 
        !['overall_status', 'anomalies', 'timestamp', 'metric_trends', 'prediction_accuracy', 'system_stability', 'data_quality_score', 'traces'].includes(key)
      )
    ),
  };

  return validated;
}