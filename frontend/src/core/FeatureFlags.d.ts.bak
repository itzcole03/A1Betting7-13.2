import type FeatureFlagsImpl from '../utils/FeatureFlags';
import type { Experiment, Feature, UserContext } from '../utils/FeatureFlags';

export type FeatureFlagEventSource = 'runtime' | 'provider';

export interface FeatureFlagEvent {
  featureId: string;
  feature?: Feature;
  enabled: boolean;
  source: FeatureFlagEventSource;
  timestamp: number;
}

export type FeatureFlagListener = (event: FeatureFlagEvent) => void;

export interface FeatureFlagService {
  getManager(): FeatureFlagsImpl;
  initialize(): Promise<void>;
  isFeatureEnabled(featureId: string, context?: UserContext): boolean;
  getFeature(featureId: string): Feature | undefined;
  getAllFeatures(): Feature[];
  registerFeature(feature: Feature): void;
  updateFeature(featureId: string, updates: Partial<Feature>): void;
  registerExperiment(experiment: Experiment): void;
  updateExperiment(experimentId: string, updates: Partial<Experiment>): void;
  assignUserToVariant(userId: string, experimentId: string, variantId: string): void;
  getUserAssignments(userId: string): Record<string, string>;
  clearUserAssignments(userId: string): void;
  subscribe(
    featureId: string | '*',
    listener: FeatureFlagListener,
    options?: { emitCurrentValue?: boolean }
  ): () => void;
  notify(featureId: string, source?: FeatureFlagEventSource): FeatureFlagEvent | null;
}

export declare const FeatureFlags: typeof FeatureFlagsImpl;

export declare const ensureFeatureFlagServiceRegistered: () => void;
export declare const getFeatureFlagService: () => FeatureFlagService;
export declare const getFeatureFlagManager: () => FeatureFlagsImpl;
export declare const initializeFeatureFlags: () => Promise<void>;
export declare const isFeatureEnabled: (featureId: string, context?: UserContext) => boolean;
export declare const getFeature: (featureId: string) => Feature | undefined;
export declare const getAllFeatures: () => Feature[];
export declare const registerFeature: (feature: Feature) => void;
export declare const updateFeature: (featureId: string, updates: Partial<Feature>) => void;
export declare const subscribeToFeature: (
  featureId: string | '*',
  listener: FeatureFlagListener,
  options?: { emitCurrentValue?: boolean }
) => () => void;

export type { Experiment, Feature, UserContext } from '../utils/FeatureFlags';

export default FeatureFlagsImpl;
