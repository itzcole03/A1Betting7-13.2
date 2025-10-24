import type { PredictionResult } from '../types/global';

export interface PredictionValidatorOptions {
  source?: string;
  defaultValue?: number;
  defaultConfidence?: number;
  now?: () => number;
  logger?: ReturnType<typeof import('./UnifiedLogger').getLogger>;
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

export declare function normalizePrediction(
  raw: unknown,
  options?: PredictionValidatorOptions
): NormalizedPrediction;

export declare function validatePrediction(
  raw: unknown,
  options?: PredictionValidatorOptions
): PredictionValidationResult;

export declare function isPredictionResult(value: unknown): value is NormalizedPrediction;

declare const PredictionValidator: {
  validatePrediction: typeof validatePrediction;
  normalizePrediction: typeof normalizePrediction;
  isPredictionResult: typeof isPredictionResult;
};

export default PredictionValidator;
