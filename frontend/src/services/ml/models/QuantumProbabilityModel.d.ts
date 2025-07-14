/**
 * Model for analyzing quantum probability patterns and generating predictions.
 */
import { BaseModel } from './BaseModel.ts';
import { ModelConfig, ModelMetrics, ModelPrediction } from '@/types.ts';
export declare class QuantumProbabilityModel extends BaseModel {
  protected config: ModelConfig;
  private quantumThreshold;
  private superpositionThreshold;
  private entanglementThreshold;
  private decoherenceThreshold;
  constructor(config: ModelConfig);
  predict(data: unknown): Promise<ModelPrediction>;
  update(data: unknown): Promise<void>;
  train(data: any[0]): Promise<void>;
  evaluate(data: any): Promise<ModelMetrics>;
  save(path: string): Promise<void>;
  load(path: string): Promise<void>;
  private analyzeQuantumState;
  private analyzeSuperposition;
  private analyzeEntanglement;
  private analyzeDecoherence;
  private calculateStateMagnitude;
  private calculateAmplitudeFactor;
  private calculatePhaseFactor;
  private calculateStateDiversity;
  private calculateCoefficientBalance;
  private calculateInterferenceFactor;
  private calculateCorrelationStrength;
  private calculateInformationContent;
  private calculateBellStateFactor;
  private calculateInteractionFactor;
  private calculatePhaseDampingFactor;
  private calculateAmplitudeDampingFactor;
}
