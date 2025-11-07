import type { PredictionResult } from '../types/global';
import { getLogger } from './UnifiedLogger';

const DEFAULT_VALUE = 0;
const DEFAULT_CONFIDENCE = 0;

const logger = getLogger('core/PredictionValidator');

export interface PredictionValidatorOptions {
  /** Human readable context to surface in warnings */
  source?: string;
  /** Value used when the payload omits a numeric prediction */
  defaultValue?: number;
  /** Confidence applied when missing or invalid */
  defaultConfidence?: number;
  /** Overrideable clock for deterministic tests */
  now?: () => number;
  /** Optional custom logger (falls back to UnifiedLogger) */
  logger?: ReturnType<typeof getLogger>;
}

export interface NormalizedPrediction extends PredictionResult {
  metadata: Record<string, unknown>;
  data: Record<string, unknown>;
}

export interface PredictionValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  normalized: NormalizedPrediction;
  original: unknown;
}

interface NormalizationReport {
  normalized: NormalizedPrediction;
  errors: string[];
  warnings: string[];
}

type RecordLike = Record<string, unknown>;

function isRecord(value: unknown): value is RecordLike {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function findFirstNumber(values: unknown[]): number | null {
  for (const candidate of values) {
    const numeric = toFiniteNumber(candidate);
    if (numeric !== null) return numeric;
  }
  return null;
}

function findTimestamp(record: RecordLike, fallbackNow: () => number): number {
  const candidates = [
    record.timestamp,
    record.createdAt,
    record.created_at,
    record.generatedAt,
    record.generated_at,
    record.updatedAt,
  ];

  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) continue;
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate;
    if (typeof candidate === 'string' && candidate.trim() !== '') {
      const parsed = Date.parse(candidate);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }

  return fallbackNow();
}

function clampConfidence(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return DEFAULT_CONFIDENCE;
  }
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function ensureRecord(value: unknown): RecordLike {
  if (isRecord(value)) return { ...value };
  return {};
}

function collectStringList(value: unknown): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    const strings = value.filter(item => typeof item === 'string');
    return strings.length ? strings : undefined;
  }
  if (typeof value === 'string') return [value];
  return undefined;
}

function normalizeInternal(
  raw: unknown,
  options: PredictionValidatorOptions = {}
): NormalizationReport {
  const cfg = {
    defaultValue: options.defaultValue ?? DEFAULT_VALUE,
    defaultConfidence: options.defaultConfidence ?? DEFAULT_CONFIDENCE,
    now: options.now ?? Date.now,
    source: options.source ?? 'unknown',
    logger: options.logger ?? logger,
  } as const;

  const errors: string[] = [];
  const warnings: string[] = [];

  const record = isRecord(raw) ? (raw as RecordLike) : {};

  const valueCandidates: unknown[] = [
    raw,
    record.value,
    record.prediction,
    record.predicted,
    record.result,
    record.output,
    record.score,
    record.data && isRecord(record.data) ? (record.data as RecordLike).value : undefined,
    record.data && isRecord(record.data) ? (record.data as RecordLike).prediction : undefined,
    record.metadata && isRecord(record.metadata)
      ? (record.metadata as RecordLike).value
      : undefined,
  ];

  let value = findFirstNumber(valueCandidates);
  if (value === null) {
    errors.push('value_missing_or_invalid');
    value = cfg.defaultValue;
  }

  const confidenceCandidates: unknown[] = [
    record.confidence,
    record.probability,
    record.score,
    record.data && isRecord(record.data) ? (record.data as RecordLike).confidence : undefined,
    record.metadata && isRecord(record.metadata)
      ? (record.metadata as RecordLike).confidence
      : undefined,
  ];

  let confidence = findFirstNumber(confidenceCandidates);
  if (confidence === null) {
    warnings.push('confidence_missing');
    confidence = cfg.defaultConfidence;
  } else if (confidence > 1 && confidence <= 100) {
    warnings.push('confidence_scaled_from_percent');
    confidence = confidence / 100;
  }

  if (confidence < 0 || confidence > 1) {
    warnings.push('confidence_clamped');
    confidence = clampConfidence(confidence);
  }

  const timestamp = findTimestamp(record, cfg.now);

  const data: RecordLike = ensureRecord(record.data);
  if (!('prediction' in data) && record.prediction !== undefined)
    data.prediction = record.prediction;
  if (!('result' in data) && record.result !== undefined) data.result = record.result;
  if (!('raw' in data) && !isRecord(record.data) && raw && typeof raw !== 'number') data.raw = raw;

  const metadata: RecordLike = ensureRecord(record.metadata);
  if (record.model && typeof record.model === 'string') metadata.model = record.model;
  if (record.provider && typeof record.provider === 'string') metadata.provider = record.provider;
  if (record.source && typeof record.source === 'string') metadata.upstreamSource = record.source;

  const reasons = collectStringList(record.reasons) ?? collectStringList(record.reasoning);
  if (reasons) metadata.reasons = reasons;

  const analysis = collectStringList(record.analysis);
  if (analysis) metadata.analysis = analysis;

  const explanation = collectStringList(record.explanation);
  if (explanation) metadata.explanation = explanation;

  const normalized: NormalizedPrediction = {
    value,
    confidence,
    data,
    metadata: {
      ...metadata,
      validator: {
        errors,
        warnings,
        source: cfg.source,
        normalizedAt: cfg.now(),
      },
    },
    timestamp,
  };

  return { normalized, errors, warnings };
}

export function normalizePrediction(
  raw: unknown,
  options?: PredictionValidatorOptions
): NormalizedPrediction {
  return normalizeInternal(raw, options).normalized;
}

export function validatePrediction(
  raw: unknown,
  options?: PredictionValidatorOptions
): PredictionValidationResult {
  const { normalized, errors, warnings } = normalizeInternal(raw, options);
  const log = options?.logger ?? logger;

  if (errors.length || warnings.length) {
    log.warn('PredictionValidator normalization applied', {
      source: options?.source ?? 'unknown',
      errors,
      warnings,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    normalized,
    original: raw,
  };
}

export function isPredictionResult(value: unknown): value is NormalizedPrediction {
  return (
    isRecord(value) &&
    typeof value.value === 'number' &&
    Number.isFinite(value.value) &&
    typeof value.confidence === 'number' &&
    !Number.isNaN(value.confidence) &&
    typeof value.timestamp === 'number' &&
    isRecord((value as RecordLike).data) &&
    isRecord((value as RecordLike).metadata)
  );
}

export default {
  validatePrediction,
  normalizePrediction,
  isPredictionResult,
};
