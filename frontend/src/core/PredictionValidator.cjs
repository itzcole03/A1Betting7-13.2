// Lightweight CommonJS mirror of the TypeScript PredictionValidator shim.

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toFiniteNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function findFirstNumber(values) {
  for (const candidate of values) {
    const numeric = toFiniteNumber(candidate);
    if (numeric !== null) return numeric;
  }
  return null;
}

function collectStringList(value) {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    const filtered = value.filter(item => typeof item === 'string');
    return filtered.length ? filtered : undefined;
  }
  if (typeof value === 'string') return [value];
  return undefined;
}

function findTimestamp(record) {
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

  return Date.now();
}

function clampConfidence(value) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function normalizePrediction(raw, options) {
  const cfg = {
    defaultValue: options && typeof options.defaultValue === 'number' ? options.defaultValue : 0,
    defaultConfidence:
      options && typeof options.defaultConfidence === 'number' ? options.defaultConfidence : 0,
    source: options && options.source ? options.source : 'unknown',
  };

  const record = isRecord(raw) ? raw : {};
  const errors = [];
  const warnings = [];

  const valueCandidates = [
    raw,
    record.value,
    record.prediction,
    record.predicted,
    record.result,
    record.output,
    record.score,
    record.data && isRecord(record.data) ? record.data.value : undefined,
  ];

  let value = findFirstNumber(valueCandidates);
  if (value === null) {
    errors.push('value_missing_or_invalid');
    value = cfg.defaultValue;
  }

  const confidenceCandidates = [
    record.confidence,
    record.probability,
    record.score,
    record.data && isRecord(record.data) ? record.data.confidence : undefined,
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

  const timestamp = findTimestamp(record);

  const data = isRecord(record.data) ? { ...record.data } : {};
  if (!('prediction' in data) && record.prediction !== undefined)
    data.prediction = record.prediction;
  if (!('result' in data) && record.result !== undefined) data.result = record.result;

  const metadata = isRecord(record.metadata) ? { ...record.metadata } : {};
  if (record.model && typeof record.model === 'string') metadata.model = record.model;
  if (record.provider && typeof record.provider === 'string') metadata.provider = record.provider;
  if (record.source && typeof record.source === 'string') metadata.upstreamSource = record.source;

  const reasons = collectStringList(record.reasons) || collectStringList(record.reasoning);
  if (reasons) metadata.reasons = reasons;
  const analysis = collectStringList(record.analysis);
  if (analysis) metadata.analysis = analysis;

  metadata.validator = {
    errors,
    warnings,
    source: cfg.source,
    normalizedAt: Date.now(),
  };

  return {
    normalized: {
      value,
      confidence,
      data,
      metadata,
      timestamp,
    },
    errors,
    warnings,
  };
}

function validatePrediction(raw, options) {
  const { normalized, errors, warnings } = normalizePrediction(raw, options);
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    normalized,
    original: raw,
  };
}

module.exports = {
  normalizePrediction: (raw, options) => normalizePrediction(raw, options).normalized,
  validatePrediction,
  normalizePredictionWithReport: normalizePrediction,
};
