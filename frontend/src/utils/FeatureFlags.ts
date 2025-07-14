import { UnifiedConfigManager } from '@/core/UnifiedConfigManager';
import { UnifiedMonitor } from '@/core/UnifiedMonitor';
import { EventBus } from '@/unified/EventBus';

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

export class FeatureFlags {
  private static instance: FeatureFlags;
  private readonly eventBus: EventBus;
  private readonly monitor: UnifiedMonitor;
  private readonly configManager: UnifiedConfigManager;
  private readonly features: Map<string, Feature>;
  private readonly experiments: Map<string, Experiment>;
  private readonly userAssignments: Map<string, Record<string, string>>;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.monitor = UnifiedMonitor.getInstance();
    this.configManager = UnifiedConfigManager.getInstance();
    this.features = new Map();
    this.experiments = new Map();
    this.userAssignments = new Map();
  }

  public static getInstance(): FeatureFlags {
    if (!FeatureFlags.instance) {
      FeatureFlags.instance = new FeatureFlags();
    }
    return FeatureFlags.instance;
  }

  public async initialize(): Promise<void> {
    const trace = this.monitor.startTrace('feature-flags-init');

    try {
      const config = await this.configManager.getConfig();

      // Initialize features
      if (config.features) {
        const featuresArray = Array.isArray(config.features)
          ? config.features
          : Object.values(config.features);
        for (const feature of featuresArray) {
          this.features.set(feature.id, feature);
        }
      }

      // Initialize experiments
      if (config.experiments) {
        const experimentsArray = Array.isArray(config.experiments)
          ? config.experiments
          : Object.values(config.experiments);
        for (const experiment of experimentsArray) {
          this.experiments.set(experiment.id, experiment);
        }
      }

      this.monitor.endTrace(trace);
      this.monitor.recordMetric('feature_flags_initialized', 1);
    } catch (error) {
      this.monitor.endTrace(trace, error as Error);
      this.monitor.recordMetric('feature_flags_init_error', 1);
      throw error;
    }
  }

  public isFeatureEnabled(featureId: string, context?: UserContext): boolean {
    const feature = this.features.get(featureId);
    if (!feature) return false;

    // 1. Check dependencies
    if (feature.dependencies && feature.dependencies.length > 0) {
      for (const depId of feature.dependencies) {
        const dep = this.features.get(depId);
        if (!dep || !dep.enabled) {
          return false;
        }
      }
    }

    // 2. Check rollout percentage (deterministic by userId)
    if (feature.rolloutPercentage < 100 && context?.userId) {
      const hash = this.hashString(context.userId);
      if (hash >= feature.rolloutPercentage) {
        return false;
      }
    }

    // 3. (Optional) Check tags vs userGroups (if feature has tags and context has userGroups)
    if (
      feature.tags &&
      feature.tags.length > 0 &&
      context?.userGroups &&
      context.userGroups.length > 0
    ) {
      const hasMatchingGroup = feature.tags.some(tag => context.userGroups.includes(tag));
      if (!hasMatchingGroup) {
        return false;
      }
    }

    // 4. Feature enabled flag
    return feature.enabled;
  }

  public getFeature(featureId: string): Feature | undefined {
    return this.features.get(featureId);
  }

  public getAllFeatures(): Feature[] {
    return Array.from(this.features.values());
  }

  public *featuresIterator(): IterableIterator<Feature> {
    yield* this.features.values();
  }

  public *experimentsIterator(): IterableIterator<Experiment> {
    yield* this.experiments.values();
  }

  public getExperiment(experimentId: string): Experiment | undefined {
    return this.experiments.get(experimentId);
  }

  public getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  public updateExperiment(experimentId: string, updates: Partial<Experiment>): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error('Experiment ' + experimentId + ' not found');
    }
    this.experiments.set(experimentId, {
      ...experiment,
      ...updates,
    });
    this.monitor.recordMetric('experiment_updated', 1, {
      experiment_id: experimentId,
      timestamp: Date.now(),
    });
  }

  public assignUserToVariant(userId: string, experimentId: string, variantId: string): void {
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, {});
    }
    const userAssignments = this.userAssignments.get(userId)!;
    userAssignments[experimentId] = variantId;
    this.monitor.recordMetric('user_assigned_to_variant', 1, {
      user_id: userId,
      experiment_id: experimentId,
      variant_id: variantId,
    });
  }

  public getUserAssignments(userId: string): Record<string, string> {
    return this.userAssignments.get(userId) || {};
  }

  public clearUserAssignments(userId: string): void {
    this.userAssignments.delete(userId);
    this.monitor.recordMetric('user_assignments_cleared', 1, {
      user_id: userId,
    });
  }

  public updateFeature(featureId: string, updates: Partial<Feature>): void {
    const feature = this.features.get(featureId);
    if (!feature) {
      throw new Error('Feature ' + featureId + ' not found');
    }
    this.features.set(featureId, {
      ...feature,
      ...updates,
    });
    this.monitor.recordMetric('feature_updated', 1, {
      feature_id: featureId,
      timestamp: Date.now(),
    });
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  public registerFeature(feature: Feature): void {
    if (this.features.has(feature.id)) {
      throw new Error('Feature ' + feature.id + ' already exists');
    }
    this.features.set(feature.id, feature);
  }

  public registerExperiment(experiment: Experiment): void {
    if (this.experiments.has(experiment.id)) {
      throw new Error('Experiment ' + experiment.id + ' already exists');
    }
    this.experiments.set(experiment.id, experiment);
  }
}

export default FeatureFlags;
