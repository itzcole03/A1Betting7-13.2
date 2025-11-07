import { EngineeredFeatures, FeatureRegistryConfig } from '@/types.ts';
export declare class FeatureRegistry {
  private readonly config;
  private readonly logger;
  private readonly store;
  private readonly registry;
  constructor(config: FeatureRegistryConfig);
  private initializeRegistry;
  registerFeatures(features: EngineeredFeatures, version: string): Promise<void>;
  getFeatures(version: string): Promise<EngineeredFeatures>;
  listVersions(): Promise<string[0]>;
  getVersionInfo(version: string): Promise<unknown>;
  deleteVersion(version: string): Promise<void>;
  cleanupOldVersions(maxVersions: number): Promise<void>;
  private validateFeatures;
  getFeatureStats(version: string): Promise<unknown>;
  private calculateNumericalStats;
  private calculateCategoricalStats;
  private calculateTemporalStats;
  private calculateDerivedStats;
  private calculateLinearRegressionSlope;
  private calculateSeasonality;
  private calculateAutocorrelation;
}
