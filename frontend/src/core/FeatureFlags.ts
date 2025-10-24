import { masterServiceRegistry } from '../services/MasterServiceRegistry';
import FeatureFlagsImpl, {
  type Experiment,
  type Feature,
  type UserContext,
} from '../utils/FeatureFlags';
import { enhancedLogger } from '../utils/enhancedLogger';

const SERVICE_NAME = 'featureFlags';

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

class FeatureFlagRuntime {
  private readonly manager = FeatureFlagsImpl.getInstance();
  private readonly listeners = new Map<string, Set<FeatureFlagListener>>();
  private readonly serviceHandle: FeatureFlagService;
  private initialized = false;

  constructor() {
    this.serviceHandle = this.createServiceHandle();
    this.ensureRegistered();
  }

  public getService(): FeatureFlagService {
    return this.serviceHandle;
  }

  public getManager(): FeatureFlagsImpl {
    return this.manager;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      await this.manager.initialize();
      this.initialized = true;
    } catch (error) {
      enhancedLogger.warn('FeatureFlags', 'initialize', 'Failed to initialize feature flags', {
        error: (error as Error)?.message,
      });
      throw error;
    }
  }

  public ensureRegistered(): void {
    try {
      masterServiceRegistry.registerService(SERVICE_NAME, this.serviceHandle);
    } catch (error) {
      enhancedLogger.warn(
        'FeatureFlags',
        'registerService',
        'Failed to register feature flag service with MasterServiceRegistry',
        { error: (error as Error)?.message }
      );
    }
  }

  public registerFeature(feature: Feature): void {
    const existing = this.manager.getFeature(feature.id);
    if (existing) {
      this.manager.updateFeature(feature.id, feature);
    } else {
      this.manager.registerFeature(feature);
    }
    this.notify(feature.id);
  }

  public updateFeature(featureId: string, updates: Partial<Feature>): void {
    try {
      this.manager.updateFeature(featureId, updates);
      this.notify(featureId);
    } catch (error) {
      enhancedLogger.warn(
        'FeatureFlags',
        'updateFeature',
        `Failed to update feature ${featureId}`,
        { error: (error as Error)?.message }
      );
      throw error;
    }
  }

  public subscribe(
    featureId: string | '*',
    listener: FeatureFlagListener,
    options?: { emitCurrentValue?: boolean }
  ): () => void {
    const key = featureId ?? '*';
    const bucket = this.listeners.get(key) ?? new Set<FeatureFlagListener>();
    bucket.add(listener);
    this.listeners.set(key, bucket);

    const shouldEmit = options?.emitCurrentValue ?? true;
    if (shouldEmit) {
      if (key === '*') {
        for (const feature of this.manager.getAllFeatures()) {
          listener(this.buildEvent(feature.id, feature));
        }
      } else {
        const feature = this.manager.getFeature(key);
        if (feature) {
          listener(this.buildEvent(key, feature));
        }
      }
    }

    return () => {
      const listeners = this.listeners.get(key);
      if (!listeners) return;
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(key);
      }
    };
  }

  public notify(
    featureId: string,
    source: FeatureFlagEventSource = 'runtime'
  ): FeatureFlagEvent | null {
    const feature = this.manager.getFeature(featureId);
    if (!feature) return null;
    const event = this.buildEvent(featureId, feature, source);

    this.emitToListeners(featureId, event);
    this.emitToListeners('*', event);

    return event;
  }

  private emitToListeners(key: string, event: FeatureFlagEvent): void {
    const listeners = this.listeners.get(key);
    if (!listeners || listeners.size === 0) return;

    for (const listener of listeners) {
      try {
        listener(event);
      } catch (error) {
        enhancedLogger.warn(
          'FeatureFlags',
          'listener',
          'Feature flag listener threw during notification',
          {
            featureId: event.featureId,
            key,
            error: (error as Error)?.message,
          }
        );
      }
    }
  }

  private buildEvent(
    featureId: string,
    feature: Feature,
    source: FeatureFlagEventSource = 'runtime'
  ): FeatureFlagEvent {
    return {
      featureId,
      feature,
      enabled: Boolean(feature.enabled),
      source,
      timestamp: Date.now(),
    };
  }

  private createServiceHandle(): FeatureFlagService {
    return {
      getManager: () => this.manager,
      initialize: () => this.initialize(),
      isFeatureEnabled: (featureId, context) => this.manager.isFeatureEnabled(featureId, context),
      getFeature: featureId => this.manager.getFeature(featureId),
      getAllFeatures: () => this.manager.getAllFeatures(),
      registerFeature: feature => this.registerFeature(feature),
      updateFeature: (featureId, updates) => this.updateFeature(featureId, updates),
      registerExperiment: experiment => this.manager.registerExperiment(experiment),
      updateExperiment: (experimentId, updates) =>
        this.manager.updateExperiment(experimentId, updates),
      assignUserToVariant: (userId, experimentId, variantId) =>
        this.manager.assignUserToVariant(userId, experimentId, variantId),
      getUserAssignments: userId => this.manager.getUserAssignments(userId),
      clearUserAssignments: userId => this.manager.clearUserAssignments(userId),
      subscribe: (featureId, listener, options) => this.subscribe(featureId, listener, options),
      notify: (featureId, source) => this.notify(featureId, source),
    };
  }
}

const runtime = new FeatureFlagRuntime();

export const FeatureFlags = FeatureFlagsImpl;

export const ensureFeatureFlagServiceRegistered = (): void => {
  runtime.ensureRegistered();
};

export const getFeatureFlagService = (): FeatureFlagService => runtime.getService();

export const getFeatureFlagManager = (): FeatureFlagsImpl => runtime.getManager();

export const initializeFeatureFlags = (): Promise<void> => runtime.initialize();

export const isFeatureEnabled = (featureId: string, context?: UserContext): boolean => {
  return runtime.getService().isFeatureEnabled(featureId, context);
};

export const getFeature = (featureId: string): Feature | undefined => {
  return runtime.getService().getFeature(featureId);
};

export const getAllFeatures = (): Feature[] => {
  return runtime.getService().getAllFeatures();
};

export const registerFeature = (feature: Feature): void => {
  runtime.getService().registerFeature(feature);
};

export const updateFeature = (featureId: string, updates: Partial<Feature>): void => {
  runtime.getService().updateFeature(featureId, updates);
};

export const subscribeToFeature = (
  featureId: string | '*',
  listener: FeatureFlagListener,
  options?: { emitCurrentValue?: boolean }
): (() => void) => {
  return runtime.getService().subscribe(featureId, listener, options);
};

export type { Experiment, Feature, UserContext } from '../utils/FeatureFlags';

export default FeatureFlagsImpl;
