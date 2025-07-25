import { UnifiedConfigManager } from '../../core/UnifiedConfigManager';
import { UnifiedMonitor } from '../../core/UnifiedMonitor';
import { EventBus } from '../../unified/EventBus';

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
    const _trace = this.monitor.startTrace('feature-flags-init');

    try {
      const _config = await this.configManager.getConfig();

      // Initialize features
      if (_config.features) {
        const _featuresArray = Array.isArray(_config.features)
          ? _config.features
          : Object.values(_config.features);
        for (const _feature of _featuresArray) {
          this.features.set(_feature.id, _feature);
        }
      }

      // Initialize experiments
      if (_config.experiments) {
        const _experimentsArray = Array.isArray(_config.experiments)
          ? _config.experiments
          : Object.values(_config.experiments);
        for (const _experiment of _experimentsArray) {
          this.experiments.set(_experiment.id, _experiment);
        }
      }

      this.monitor.endTrace(_trace);
      this.monitor.recordMetric('feature_flags_initialized', 1);
    } catch (error) {
      this.monitor.endTrace(_trace, error as Error);
      this.monitor.recordMetric('feature_flags_init_error', 1);
      throw error;
    }
  }

  public isFeatureEnabled(featureId: string, context?: UserContext): boolean {
    const _feature = this.features.get(featureId);
    if (!_feature) return false;

    // 1. Check dependencies
    if (_feature.dependencies && _feature.dependencies.length > 0) {
      for (const _depId of _feature.dependencies) {
        const _dep = this.features.get(_depId);
        if (!_dep || !_dep.enabled) {
          return false;
        }
      }
    }

    // 2. Check rollout percentage (deterministic by userId)
    if (_feature.rolloutPercentage < 100 && context?.userId) {
      const _hash = this.hashString(context.userId);
      if (_hash >= _feature.rolloutPercentage) {
        return false;
      }
    }

    // 3. (Optional) Check tags vs userGroups (if feature has tags and context has userGroups)
    if (
      _feature.tags &&
      _feature.tags.length > 0 &&
      context?.userGroups &&
      context.userGroups.length > 0
    ) {
      const _hasMatchingGroup = _feature.tags.some(tag => context.userGroups.includes(tag));
      if (!_hasMatchingGroup) {
        return false;
      }
    }

    // 4. Feature enabled flag
    return _feature.enabled;
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
    const _experiment = this.experiments.get(experimentId);
    if (!_experiment) {
      throw new Error('Experiment ' + experimentId + ' not found');
    }
    this.experiments.set(experimentId, {
      ..._experiment,
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
    const _userAssignments = this.userAssignments.get(userId)!;
    _userAssignments[experimentId] = variantId;
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
    const _feature = this.features.get(featureId);
    if (!_feature) {
      throw new Error('Feature ' + featureId + ' not found');
    }
    this.features.set(featureId, {
      ..._feature,
      ...updates,
    });
    this.monitor.recordMetric('feature_updated', 1, {
      feature_id: featureId,
      timestamp: Date.now(),
    });
  }

  private hashString(str: string): number {
    let _hash = 0;
    for (let _i = 0; _i < str.length; _i++) {
      const _char = str.charCodeAt(_i);
      _hash = (_hash << 5) - _hash + _char;
      _hash = _hash & _hash; // Convert to 32-bit integer
    }
    return Math.abs(_hash);
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
