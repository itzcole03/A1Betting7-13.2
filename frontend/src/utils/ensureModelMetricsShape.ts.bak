/**
 * Model metrics normalization to prevent "Cannot read properties of undefined (reading 'optimization_level')" errors
 * Provides shape normalization and legacy field mapping for AI/ML model metrics
 * 
 * @module ensureModelMetricsShape
 */

// Guard to prevent multiple logging
let hasLoggedMissingFields = false;

export interface ModelMetricsShape {
  model: {
    name: string;
    provider: string;
    version?: string;
    optimization_level: string;
    optimization_mode?: string;
  };
  performance: {
    throughput_rps: number;
    avg_latency_ms: number;
    p95_latency_ms: number;
    success_rate: number;
  };
  usage: {
    total_requests: number;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    cache_hits?: number;
    cache_hit_rate?: number;
  };
  tuning?: {
    temperature: number;
    top_p?: number;
    max_tokens?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
  };
  originFlags?: {
    mappedLegacy?: boolean;
    partialPayload?: boolean;
  };
}

/**
 * Legacy key mapping table for reference
 * 
 * optimizationLevel -> model.optimization_level
 * opt_level -> model.optimization_level  
 * optimization_mode -> model.optimization_mode
 * optimizationTier -> model.optimization_level
 * modelName -> model.name
 * model_name -> model.name
 * avg_latency -> performance.avg_latency_ms
 * latency_ms -> performance.avg_latency_ms
 * throughput -> performance.throughput_rps
 * throughput_per_second -> performance.throughput_rps
 * success_requests -> derived success_rate
 * total_inferences -> usage.total_requests
 */

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
 * Safely coerce value to number with fallback
 */
const coerceToNumber = (value: unknown, fallback: number = 0): number => {
  if (typeof value === 'number') {
    if (!isFinite(value)) {
      return fallback;
    }
    return value;
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

/**
 * Safely coerce value to string with fallback
 */
const coerceToString = (value: unknown, fallback: string = ''): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return fallback;
};

/**
 * Extract nested value using path segments
 */
const extractNestedValue = (obj: Record<string, unknown>, path: string[]): unknown => {
  let current: unknown = obj;
  for (const segment of path) {
    if (current && typeof current === 'object' && segment in current) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  return current;
};

/**
 * Get value with legacy fallback mapping
 */
const getValueWithLegacyFallback = (
  rawObj: Record<string, unknown>, 
  canonicalPath: string[], 
  legacyPaths: string[][], 
  type: 'number' | 'string',
  defaultValue: string | number
): { value: string | number; usedLegacy: boolean } => {
  
  // Try canonical path first
  const canonicalValue = extractNestedValue(rawObj, canonicalPath);
  if (canonicalValue !== undefined) {
    const coerced = type === 'number' 
      ? coerceToNumber(canonicalValue, defaultValue as number)
      : coerceToString(canonicalValue, defaultValue as string);
    return { value: coerced, usedLegacy: false };
  }
  
  // Try legacy paths
  for (const legacyPath of legacyPaths) {
    const legacyValue = extractNestedValue(rawObj, legacyPath);
    if (legacyValue !== undefined) {
      const coerced = type === 'number' 
        ? coerceToNumber(legacyValue, defaultValue as number)
        : coerceToString(legacyValue, defaultValue as string);
      return { value: coerced, usedLegacy: true };
    }
  }
  
  return { value: defaultValue, usedLegacy: false };
};

/**
 * Derive total_tokens if missing
 */
const deriveTotalTokens = (usage: Record<string, unknown>): number => {
  const inputTokens = coerceToNumber(usage.input_tokens || usage.inputTokens, 0);
  const outputTokens = coerceToNumber(usage.output_tokens || usage.outputTokens, 0);
  return inputTokens + outputTokens;
};

/**
 * Derive success_rate if missing but success/total available
 */
const deriveSuccessRate = (rawObj: Record<string, unknown>): number => {
  const successRequests = coerceToNumber(rawObj.success_requests || rawObj.successful_requests, 0);
  const totalRequests = coerceToNumber(rawObj.total_requests || rawObj.total_inferences, 0);
  
  if (totalRequests > 0) {
    return successRequests / totalRequests;
  }
  
  return 0;
};

/**
 * Ensures model metrics data conforms to ModelMetricsShape with safe defaults
 * 
 * Features:
 * - Normalizes missing nested objects to safe defaults
 * - Maps legacy fields to canonical structure  
 * - Coerces numeric fields to numbers and strings to strings
 * - Derives computed fields (total_tokens, success_rate)
 * - Adds development metadata in originFlags
 * - One-time logging for missing fields and legacy usage
 */
export function ensureModelMetricsShape(raw: unknown): ModelMetricsShape {
  const originFlags: ModelMetricsShape['originFlags'] = {};
  
  // Type guard for raw data
  const rawObj = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};

  let usedLegacyFields = false;

  // Build model section with legacy mapping
  const modelName = getValueWithLegacyFallback(
    rawObj, 
    ['model', 'name'], 
    [['modelName'], ['model_name'], ['name']], 
    'string', 
    'Unknown Model'
  );
  if (modelName.usedLegacy) usedLegacyFields = true;

  const provider = getValueWithLegacyFallback(
    rawObj, 
    ['model', 'provider'], 
    [['provider'], ['model_provider'], ['modelProvider']], 
    'string', 
    'Unknown Provider'
  );
  if (provider.usedLegacy) usedLegacyFields = true;

  const optimizationLevel = getValueWithLegacyFallback(
    rawObj, 
    ['model', 'optimization_level'], 
    [
      ['optimizationLevel'], 
      ['opt_level'], 
      ['optimization_mode'],
      ['system_info', 'optimization_level'],
      ['optimizationTier'],
      ['optTier']
    ], 
    'string', 
    'Basic'
  );
  if (optimizationLevel.usedLegacy) usedLegacyFields = true;

  const version = getValueWithLegacyFallback(
    rawObj, 
    ['model', 'version'], 
    [['version'], ['model_version']], 
    'string', 
    ''
  );

  const optimizationMode = getValueWithLegacyFallback(
    rawObj, 
    ['model', 'optimization_mode'], 
    [['optimization_mode'], ['optimizationMode']], 
    'string', 
    ''
  );

  // Build performance section
  const throughputRps = getValueWithLegacyFallback(
    rawObj, 
    ['performance', 'throughput_rps'], 
    [['throughput'], ['throughput_per_second'], ['rps']], 
    'number', 
    0
  );
  if (throughputRps.usedLegacy) usedLegacyFields = true;

  const avgLatencyMs = getValueWithLegacyFallback(
    rawObj, 
    ['performance', 'avg_latency_ms'], 
    [['avg_latency'], ['latency_ms'], ['avg_latency_ms']], 
    'number', 
    0
  );
  if (avgLatencyMs.usedLegacy) usedLegacyFields = true;

  const p95LatencyMs = getValueWithLegacyFallback(
    rawObj, 
    ['performance', 'p95_latency_ms'], 
    [['p95_latency'], ['p95_latency_ms']], 
    'number', 
    0
  );
  if (p95LatencyMs.usedLegacy) usedLegacyFields = true;

  // Try to derive success_rate or use direct value
  let successRate: number;
  const directSuccessRate = extractNestedValue(rawObj, ['performance', 'success_rate']);
  if (directSuccessRate !== undefined) {
    successRate = coerceToNumber(directSuccessRate, 0);
  } else {
    successRate = deriveSuccessRate(rawObj);
    if (successRate > 0) usedLegacyFields = true;
  }

  // Build usage section
  const totalRequests = getValueWithLegacyFallback(
    rawObj, 
    ['usage', 'total_requests'], 
    [['total_requests'], ['total_inferences'], ['totalRequests']], 
    'number', 
    0
  );
  if (totalRequests.usedLegacy) usedLegacyFields = true;

  const inputTokens = getValueWithLegacyFallback(
    rawObj, 
    ['usage', 'input_tokens'], 
    [['input_tokens'], ['inputTokens']], 
    'number', 
    0
  );
  if (inputTokens.usedLegacy) usedLegacyFields = true;

  const outputTokens = getValueWithLegacyFallback(
    rawObj, 
    ['usage', 'output_tokens'], 
    [['output_tokens'], ['outputTokens']], 
    'number', 
    0
  );
  if (outputTokens.usedLegacy) usedLegacyFields = true;

  // Derive total_tokens
  let totalTokens = getValueWithLegacyFallback(
    rawObj, 
    ['usage', 'total_tokens'], 
    [['total_tokens'], ['totalTokens']], 
    'number', 
    0
  ).value as number;

  if (totalTokens === 0 && ((inputTokens.value as number) > 0 || (outputTokens.value as number) > 0)) {
    totalTokens = deriveTotalTokens({
      input_tokens: inputTokens.value,
      output_tokens: outputTokens.value
    });
  }

  const cacheHits = getValueWithLegacyFallback(
    rawObj, 
    ['usage', 'cache_hits'], 
    [['cache_hits'], ['cacheHits']], 
    'number', 
    0
  );

  const cacheHitRate = getValueWithLegacyFallback(
    rawObj, 
    ['usage', 'cache_hit_rate'], 
    [['cache_hit_rate'], ['cacheHitRate']], 
    'number', 
    0
  );

  // Build optional tuning section
  let tuning: ModelMetricsShape['tuning'] | undefined;
  const temperature = extractNestedValue(rawObj, ['tuning', 'temperature']) || rawObj.temperature;
  if (temperature !== undefined || rawObj.top_p !== undefined || rawObj.max_tokens !== undefined) {
    tuning = {
      temperature: coerceToNumber(temperature, 0.7),
      top_p: rawObj.top_p !== undefined ? coerceToNumber(rawObj.top_p, undefined) : undefined,
      max_tokens: rawObj.max_tokens !== undefined ? coerceToNumber(rawObj.max_tokens, undefined) : undefined,
      presence_penalty: rawObj.presence_penalty !== undefined ? coerceToNumber(rawObj.presence_penalty, undefined) : undefined,
      frequency_penalty: rawObj.frequency_penalty !== undefined ? coerceToNumber(rawObj.frequency_penalty, undefined) : undefined,
    };
  }

  // Set origin flags
  if (usedLegacyFields) {
    originFlags.mappedLegacy = true;
  }

  const hasModelSection = rawObj.model && typeof rawObj.model === 'object';
  const hasPerformanceSection = rawObj.performance && typeof rawObj.performance === 'object';
  const hasUsageSection = rawObj.usage && typeof rawObj.usage === 'object';

  if (!hasModelSection || !hasPerformanceSection || !hasUsageSection) {
    originFlags.partialPayload = true;
  }

  // One-time development logging
  const missingFields: string[] = [];
  if (!raw) missingFields.push('entire model metrics object');
  if (!hasModelSection) missingFields.push('model section');
  if (!hasPerformanceSection) missingFields.push('performance section');
  if (!hasUsageSection) missingFields.push('usage section');

  if ((process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === 'test' ||
        typeof jest !== 'undefined') &&
      (missingFields.length > 0 || originFlags.mappedLegacy) &&
      !hasLoggedMissingFields) {
    hasLoggedMissingFields = true;
    
    if (missingFields.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        '[ModelMetricsGuard] Missing model metrics fields detected:',
        missingFields.join(', '),
        '\nRaw data sample:',
        safeStringify(rawObj)?.substring(0, 500) + '...'
      );
    }
    
    if (originFlags.mappedLegacy) {
      // eslint-disable-next-line no-console
      console.warn(
        '[ModelMetricsGuard] Using legacy model metrics fields:',
        'optimizationLevel, opt_level, model_name, throughput_per_second, etc.',
        'Consider migrating to canonical structure'
      );
    }
  }

  // Build normalized model metrics object
  const normalized: ModelMetricsShape = {
    model: {
      name: modelName.value as string,
      provider: provider.value as string,
      optimization_level: optimizationLevel.value as string,
      ...(version.value && version.value !== '' ? { version: version.value as string } : {}),
      ...(optimizationMode.value && optimizationMode.value !== '' ? { optimization_mode: optimizationMode.value as string } : {}),
    },
    performance: {
      throughput_rps: throughputRps.value as number,
      avg_latency_ms: avgLatencyMs.value as number,
      p95_latency_ms: p95LatencyMs.value as number,
      success_rate: successRate,
    },
    usage: {
      total_requests: totalRequests.value as number,
      input_tokens: inputTokens.value as number,
      output_tokens: outputTokens.value as number,
      total_tokens: totalTokens,
      ...((cacheHits.value as number) > 0 ? { cache_hits: cacheHits.value as number } : {}),
      ...((cacheHitRate.value as number) > 0 ? { cache_hit_rate: cacheHitRate.value as number } : {}),
    },
    ...(tuning ? { tuning } : {}),
    originFlags,
  };

  return normalized;
}