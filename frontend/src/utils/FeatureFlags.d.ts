export interface Feature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  dependencies: string[];
  tags: string[];
  metadata: Record<string, unknown>;
}
export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'completed';
  variants: Array<{
    id: string;
    name: string;
    weight: number;
  }>;
  audience: {
    percentage: number;
    filters?: Record<string, unknown>;
  };
  startDate: number;
  endDate?: number;
  metadata: Record<string, unknown>;
}
export interface UserContext {
  userId: string;
  userGroups: string[];
  attributes: Record<string, unknown>;
}
export declare class FeatureFlags {
  private static instance;
  private readonly eventBus;
  private readonly performanceMonitor;
  private readonly configManager;
  private readonly features;
  private readonly experiments;
  private readonly userAssignments;
  private constructor();
  static getInstance(): FeatureFlags;
  initialize(): Promise<void>;
  isFeatureEnabled(featureId: string, context?: UserContext): boolean;
  getFeature(featureId: string): Feature | undefined;
  getAllFeatures(): Feature[];
  featuresIterator(): IterableIterator<Feature>;
  experimentsIterator(): IterableIterator<Experiment>;
  getExperiment(experimentId: string): Experiment | undefined;
  getAllExperiments(): Experiment[];
  updateExperiment(experimentId: string, updates: Partial<Experiment>): void;
  assignUserToVariant(userId: string, experimentId: string, variantId: string): void;
  getUserAssignments(userId: string): Record<string, string>;
  clearUserAssignments(userId: string): void;
  updateFeature(featureId: string, updates: Partial<Feature>): void;
  private isUserInRollout;
  private isUserInAudience;
  private assignVariant;
  getExperimentVariant(experimentId: string, context: UserContext): string | null;
  private hashString;
  registerFeature(feature: Feature): void;
  registerExperiment(experiment: Experiment): void;
}
export default FeatureFlags;
