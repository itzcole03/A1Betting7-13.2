import {
  isPredictionResult,
  normalizePrediction,
  validatePrediction,
} from '../PredictionValidator';
import { getLogger } from '../UnifiedLogger';

function createLoggerSpies() {
  const logger = getLogger('test/prediction-validator');
  const warn = jest.spyOn(logger, 'warn').mockImplementation(() => {});
  jest.spyOn(logger, 'info').mockImplementation(() => {});
  jest.spyOn(logger, 'error').mockImplementation(() => {});
  jest.spyOn(logger, 'debug').mockImplementation(() => {});
  return { logger, warn } as const;
}

describe('PredictionValidator', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('normalizes numeric strings and percent confidence while preserving context', () => {
    const { logger, warn } = createLoggerSpies();
    const now = jest.fn(() => 1_692_000_000_000);

    const raw = {
      value: '12.5',
      confidence: 87,
      model: 'transformer-v2',
      provider: 'modern-ml',
      reasons: ['model-consensus', 42],
      analysis: 'High leverage at-bat',
      explanation: ['Hot streak'],
      metadata: { extra: 'field' },
      data: { context: 'mlb' },
    };

    const result = validatePrediction(raw, {
      source: 'unit-test',
      logger,
      now,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual(['confidence_scaled_from_percent']);
    expect(now).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledWith('PredictionValidator normalization applied', {
      source: 'unit-test',
      errors: [],
      warnings: ['confidence_scaled_from_percent'],
    });

    const { normalized } = result;
    expect(normalized.value).toBe(12.5);
    expect(normalized.confidence).toBeCloseTo(0.87, 5);
    expect(normalized.data).toEqual({ context: 'mlb' });
    expect(normalized.metadata).toMatchObject({
      model: 'transformer-v2',
      provider: 'modern-ml',
      reasons: ['model-consensus'],
      analysis: ['High leverage at-bat'],
      explanation: ['Hot streak'],
      extra: 'field',
    });

    const validatorMeta = normalized.metadata.validator as Record<string, unknown>;
    expect(validatorMeta).toMatchObject({
      source: 'unit-test',
      errors: [],
      warnings: ['confidence_scaled_from_percent'],
    });
    expect(validatorMeta.normalizedAt).toBe(now.mock.results[1]?.value);
    expect(normalized.timestamp).toBe(now.mock.results[0]?.value);
  });

  it('falls back to defaults when value is missing and clamps invalid confidence', () => {
    const { logger, warn } = createLoggerSpies();
    const now = jest.fn(() => 1_692_500_000_000);

    const raw = {
      confidence: -5,
      metadata: { previous: 'entry' },
    };

    const result = validatePrediction(raw, {
      defaultValue: 42,
      defaultConfidence: 0.6,
      source: 'unit-test',
      logger,
      now,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(['value_missing_or_invalid']);
    expect(result.warnings).toEqual(['confidence_clamped']);
    expect(now).toHaveBeenCalledTimes(2);
    expect(result.normalized.value).toBe(42);
    expect(result.normalized.confidence).toBe(0);
    expect(result.normalized.timestamp).toBe(now.mock.results[0].value);

    expect(warn).toHaveBeenCalledWith('PredictionValidator normalization applied', {
      source: 'unit-test',
      errors: ['value_missing_or_invalid'],
      warnings: ['confidence_clamped'],
    });
  });

  it('normalizes primitive payloads via normalizePrediction', () => {
    const now = jest.fn(() => 1_692_800_000_000);
    const normalized = normalizePrediction(15.25, { now });

    expect(normalized.value).toBe(15.25);
    expect(normalized.confidence).toBe(0);
    expect(normalized.timestamp).toBe(now.mock.results[0].value);
    expect(normalized.metadata.validator).toMatchObject({
      errors: [],
      warnings: ['confidence_missing'],
    });
  });

  it('type guard accepts normalized predictions only', () => {
    const normalized = normalizePrediction({ value: '7.5', confidence: 0.5 });
    expect(isPredictionResult(normalized)).toBe(true);

    expect(isPredictionResult(null)).toBe(false);
    expect(isPredictionResult({ value: 3, confidence: NaN, timestamp: Date.now() })).toBe(false);
    expect(
      isPredictionResult({
        value: 3,
        confidence: 0.5,
        timestamp: Date.now(),
        metadata: {},
        data: {},
      })
    ).toBe(true);
  });
});
