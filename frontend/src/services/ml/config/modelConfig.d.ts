import { ModelConfig, AdvancedEnsembleConfig } from '@/types.ts';
export declare function validateModelConfig(_config: ModelConfig | AdvancedEnsembleConfig): void;
export declare const _defaultModelConfig: AdvancedEnsembleConfig;
export declare const _createModelConfig: (
  overrides?: Partial<AdvancedEnsembleConfig>
) => AdvancedEnsembleConfig;
export declare const _validateRegularModelConfig: (config: ModelConfig) => boolean;
