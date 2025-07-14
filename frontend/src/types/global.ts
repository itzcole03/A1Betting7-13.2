export {};

// EngineeredFeatures: Structure for engineered features
export interface EngineeredFeatures {
  numerical: number[];
  categorical: string[];
  temporal: number[];
  metadata: {
    timestamp: number;
    version: string;
    source: string;
  };
}

// FeatureConfig: Configuration for feature engineering
export interface FeatureConfig {
  version: string;
  features: {
    numerical: boolean;
    categorical: boolean;
    temporal: boolean;
  };
}

// RawPlayerData: Raw input data for feature engineering
export interface RawPlayerData {
  id: string;
  name: string;
  team: string;
  position: string;
  stats: Record<string, number>;
  [key: string]: unknown;
}
