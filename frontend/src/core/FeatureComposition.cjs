// Lightweight runtime helpers for composing alternative props in CommonJS environments.
function mergeAlternativeProps(base, alternatives = [], options = {}) {
  const preferIncoming = options.preferIncoming !== false;
  const normalizedBaseAlternatives = Array.isArray(base && base.alternativeProps)
    ? base.alternativeProps
    : [];

  const map = new Map();

  const register = (source, prefer) => {
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

  const result = Object.assign(structuredCloneSafe(base), {
    alternativeProps: mergedAlternatives,
    topConfidence: computeTopConfidence([base].concat(mergedAlternatives)),
  });

  return result;
}

function computeTopConfidence(items, fallback = 0) {
  if (!Array.isArray(items) || items.length === 0) {
    return clampConfidence(fallback);
  }

  let best = clampConfidence(fallback);
  for (const item of items) {
    const candidate =
      typeof item === 'number'
        ? item
        : item && typeof item === 'object'
        ? item.confidence
        : undefined;
    const normalized = clampConfidence(candidate, best);
    if (normalized > best) {
      best = normalized;
    }
  }
  return best;
}

function normalizeAlternativeProp(source, base) {
  const fallbackStat = base && base.stat ? base.stat : 'Unknown';
  const normalizedStat =
    typeof source.stat === 'string' && source.stat.trim() !== '' ? source.stat : fallbackStat;
  const normalizedId = deriveIdentifier(
    source.id,
    base && base.id ? base.id : 'feature',
    normalizedStat
  );

  const normalizedLine = toNumber(
    source.line !== undefined ? source.line : base && base.line !== undefined ? base.line : 0,
    0
  );
  const normalizedConfidence = clampConfidence(
    source.confidence,
    clampConfidence(base && base.confidence)
  );

  const overOdds = sanitizeOptionalNumber(source.overOdds);
  const underOdds = sanitizeOptionalNumber(source.underOdds);

  const extras = {};
  for (const key of Object.keys(source)) {
    if (key === 'id' || key === 'stat' || key === 'line' || key === 'confidence') continue;
    if (key === 'overOdds' || key === 'underOdds') continue;
    extras[key] = source[key];
  }

  const normalized = Object.assign({}, extras, {
    id: normalizedId,
    stat: normalizedStat,
    line: normalizedLine,
    confidence: normalizedConfidence,
  });

  if (typeof overOdds === 'number') normalized.overOdds = overOdds;
  if (typeof underOdds === 'number') normalized.underOdds = underOdds;

  return normalized;
}

function structuredCloneSafe(value) {
  if (typeof globalThis.structuredClone === 'function') {
    try {
      return globalThis.structuredClone(value);
    } catch (error) {
      // Fall through to manual clone.
    }
  }
  if (Array.isArray(value)) {
    return value.map(item => structuredCloneSafe(item));
  }
  if (value && typeof value === 'object') {
    const clone = {};
    for (const key of Object.keys(value)) {
      const val = value[key];
      if (key === 'alternativeProps' && Array.isArray(val)) {
        clone[key] = val.slice();
      } else {
        clone[key] = structuredCloneSafe(val);
      }
    }
    return clone;
  }
  return value;
}

function deriveIdentifier(id, baseId, stat) {
  if (id && String(id).trim() !== '') {
    return String(id);
  }
  return `${baseId}:${stat}`;
}

function clampConfidence(value, fallback = 0) {
  const numeric = toNumber(value, fallback);
  if (!Number.isFinite(numeric)) return clampConfidence(fallback, 0);
  const scaled = numeric >= 0 && numeric <= 1 ? numeric * 100 : numeric;
  const clamped = Math.min(Math.max(scaled, 0), 100);
  return Math.round(clamped * 100) / 100;
}

function sanitizeOptionalNumber(value) {
  const numeric = toNumber(value, Number.NaN);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function toNumber(value, fallback = 0) {
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

module.exports = {
  mergeAlternativeProps,
  computeTopConfidence,
  // Expose helpers for advanced callers (mostly for tests in legacy bundles).
  _internal: {
    normalizeAlternativeProp,
    clampConfidence,
    toNumber,
  },
};
