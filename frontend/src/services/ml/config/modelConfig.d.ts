import { ModelConfig, AdvancedEnsembleConfig } from '@/types.ts';
export declare function validateModelConfig(config: ModelConfig | AdvancedEnsembleConfig): void;
export declare const defaultModelConfig: AdvancedEnsembleConfig;
export declare const createModelConfig: (
  overrides?: Partial<AdvancedEnsembleConfig>
) => AdvancedEnsembleConfig;
export declare const validateRegularModelConfig: (config: ModelConfig) => boolean;
