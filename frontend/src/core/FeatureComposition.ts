/**
 * Lightweight runtime helpers for composing alternate props and confidence scores.
 * These helpers intentionally avoid external dependencies so they can run in smoke tests.
 */

export interface FeatureLike {
  id: string;
  stat?: string;
  line?: number | string;
  confidence?: number | string;
  alternativeProps?: AlternativePropInput[];
  [key: string]: unknown;
}

export interface AlternativePropInput {
  id?: string;
  stat?: string;
  line?: number | string;
  confidence?: number | string;
  overOdds?: number | string;
  underOdds?: number | string;
  [key: string]: unknown;
}

export interface AlternativeProp
  extends Omit<AlternativePropInput, 'id' | 'stat' | 'line' | 'confidence'> {
  id: string;
  stat: string;
  line: number;
  confidence: number;
  overOdds?: number;
  underOdds?: number;
}

export interface MergeOptions {
  /**
   * When true (default), alternative props coming from the `alternatives` parameter override
   * previously registered alternatives that share the same `id`.
   */
  preferIncoming?: boolean;
}

export type MergeResult<T extends FeatureLike = FeatureLike> = Omit<T, 'alternativeProps'> & {
  alternativeProps: AlternativeProp[];
  /** Highest confidence value observed across the base feature and its alternatives. */
  topConfidence: number;
};

export function mergeAlternativeProps<T extends FeatureLike>(
  base: T,
  alternatives: AlternativePropInput[] = [],
  options: MergeOptions = {}
): MergeResult<T> {
  const preferIncoming = options.preferIncoming !== false;
  const normalizedBaseAlternatives = Array.isArray(base.alternativeProps)
    ? base.alternativeProps
    : [];

  const map = new Map<string, AlternativeProp>();

  const register = (source: AlternativePropInput | undefined, prefer: boolean) => {
    if (!source) return;
    const normalized = normalizeAlternativeProp(source, base);
    const key = normalized.id;
    if (!map.has(key) || prefer) {
      map.set(key, normalized);
    }
  };

  normalizedBaseAlternatives.forEach(item => register(item, false));
  alternatives.forEach(item => register(item, preferIncoming));

  const mergedAlternatives = Array.from(map.values()).sort(
    (a, b) => b.confidence - a.confidence || a.stat.localeCompare(b.stat)
  );

  const result: MergeResult<T> = {
    ...(structuredCloneSafe(base) as T),
    alternativeProps: mergedAlternatives,
    topConfidence: computeTopConfidence([base, ...mergedAlternatives]),
  };

  return result;
}

export function computeTopConfidence(
  items: Array<number | { confidence?: number | string | undefined }> | undefined,
  fallback = 0
): number {
  if (!Array.isArray(items) || items.length === 0) {
    return clampConfidence(fallback);
  }

  let best = clampConfidence(fallback);
  for (const item of items) {
    const candidate =
      typeof item === 'number' ? item : item && 'confidence' in item ? item.confidence : undefined;
    const normalized = clampConfidence(candidate, best);
    if (normalized > best) {
      best = normalized;
    }
  }
  return best;
}

function normalizeAlternativeProp(
  source: AlternativePropInput,
  base: FeatureLike
): AlternativeProp {
  const fallbackStat = base.stat ?? 'Unknown';
  const normalizedStat =
    typeof source.stat === 'string' && source.stat.trim() !== '' ? source.stat : fallbackStat;
  const normalizedId = deriveIdentifier(source.id, base.id, normalizedStat);

  const normalizedLine = toNumber(source.line ?? base.line ?? 0, 0);
  const normalizedConfidence = clampConfidence(source.confidence, clampConfidence(base.confidence));

  const overOdds = sanitizeOptionalNumber(source.overOdds);
  const underOdds = sanitizeOptionalNumber(source.underOdds);

  const extras: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    if (key === 'id' || key === 'stat' || key === 'line' || key === 'confidence') continue;
    if (key === 'overOdds' || key === 'underOdds') continue;
    extras[key] = value;
  }

  const normalized: AlternativeProp = {
    ...extras,
    id: normalizedId,
    stat: normalizedStat,
    line: normalizedLine,
    confidence: normalizedConfidence,
  };

  if (typeof overOdds === 'number') normalized.overOdds = overOdds;
  if (typeof underOdds === 'number') normalized.underOdds = underOdds;

  return normalized;
}

function structuredCloneSafe<T>(value: T): T {
  const globalClone = (globalThis as { structuredClone?: <R>(input: R) => R }).structuredClone;
  if (typeof globalClone === 'function') {
    try {
      return globalClone(value);
    } catch (error) {
      // Fall back below if structuredClone is not available (Node 16) or throws on unserializable values.
    }
  }
  if (Array.isArray(value)) {
    return value.map(item => structuredCloneSafe(item)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const clone: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (key === 'alternativeProps' && Array.isArray(v)) {
        clone[key] = v.slice();
      } else {
        clone[key] = structuredCloneSafe(v);
      }
    }
    return clone as T;
  }
  return value;
}

function deriveIdentifier(id: string | undefined, baseId: string, stat: string): string {
  if (id && String(id).trim() !== '') {
    return String(id);
  }
  return `${baseId}:${stat}`;
}

function clampConfidence(value: unknown, fallback = 0): number {
  const numeric = toNumber(value, fallback);
  if (!Number.isFinite(numeric)) return clampConfidence(fallback, 0);
  const scaled = numeric >= 0 && numeric <= 1 ? numeric * 100 : numeric;
  const clamped = Math.min(Math.max(scaled, 0), 100);
  return Math.round(clamped * 100) / 100;
}

function sanitizeOptionalNumber(value: unknown): number | undefined {
  const numeric = toNumber(value, Number.NaN);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return fallback;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export const featureComposition = {
  mergeAlternativeProps,
  computeTopConfidence,
};

export default featureComposition;
