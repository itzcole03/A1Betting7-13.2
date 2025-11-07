import type { PredictionWithConfidence } from '@/types/confidence.ts';
import type { ContextualInput } from '@/types/filters.ts';
export declare class PredictionService {
  private static instance;
  private constructor();
  static getInstance(): PredictionService;
  getPredictionWithConfidence(
    eventId: string,
    model: string,
    market: string,
    context?: ContextualInput
  ): Promise<PredictionWithConfidence>;
}
