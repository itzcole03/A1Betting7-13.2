import { EventBus } from '../../core/EventBus';
import { PerformanceMonitor } from './PerformanceMonitor';

export interface FeatureMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  dependencies: string[];
  category: string;
  tags: string[];
}

export interface FeatureContext {
  timestamp: number;
  environment: string;
  userId?: string;
  sessionId?: string;
  metadata: Record<string, string | number | boolean | object>;
}

export interface FeatureComponent<T, U> {
  metadata: FeatureMetadata;
  process(input: T, context: FeatureContext): Promise<U>;
  combine<V>(next: FeatureComponent<U, V>): FeatureComponent<T, V>;
  validate(input: T): Promise<boolean>;
  rollback(input: T, error: Error): Promise<void>;
}

export class ComposableFeature<T, U> implements FeatureComponent<T, U> {
  private readonly eventBus: EventBus;
  private readonly performanceMonitor: PerformanceMonitor;

  constructor(
    public readonly metadata: FeatureMetadata,
    private readonly processor: (input: T, context: FeatureContext) => Promise<U>,
    private readonly validator?: (input: T) => Promise<boolean>,
    private readonly rollbackHandler?: (input: T, error: Error) => Promise<void>
  ) {
    this.eventBus = EventBus.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  async process(input: T, context: FeatureContext): Promise<U> {
    const _traceId = this.performanceMonitor.startTrace(`feature-${this.metadata.id}`);

    try {
      if (this.validator && !(await this.validate(input))) {
        throw new Error(`Input validation failed for feature ${this.metadata.id}`);
      }
      // Process the input
      // ...implementation...
      // Emit success event
      // this.eventBus.publish({
      //   type: 'feature:executed',
      //   payload: {
      //     featureId: this.metadata.id,
      //     // duration,
      //     success: true,
      //     timestamp: Date.now(),
      //     context
      //   }
      // });
      this.performanceMonitor.endTrace(_traceId);
      // return result;
      return {} as U;
    } catch (error) {
      this.performanceMonitor.endTrace(_traceId, error as Error);
      if (this.rollbackHandler) {
        await this.rollbackHandler(input, error as Error);
      }
      // this.eventBus.publish({
      //   type: 'feature:error',
      //   payload: {
      //     featureId: this.metadata.id,
      //     error: error as Error,
      //     timestamp: Date.now(),
      //     context
      //   }
      // });
      throw error;
    }
  }

  combine<V>(next: FeatureComponent<U, V>): FeatureComponent<T, V> {
    return new ComposableFeature<T, V>(
      {
        id: `${this.metadata.id}->${next.metadata.id}`,
        name: `${this.metadata.name} -> ${next.metadata.name}`,
        description: `Composed feature: ${this.metadata.description} -> ${next.metadata.description}`,
        version: `${this.metadata.version}+${next.metadata.version}`,
        dependencies: [...this.metadata.dependencies, ...next.metadata.dependencies],
        category: this.metadata.category,
        tags: [...new Set([...this.metadata.tags, ...next.metadata.tags])],
      },
      async (input: T, context: FeatureContext) => {
        // ...implementation...
        // return next.process(intermediate, context)
        return {} as V;
      }
    );
  }

  async validate(input: T): Promise<boolean> {
    if (this.validator) {
      return this.validator(input);
    }
    return true;
  }

  async rollback(input: T, error: Error): Promise<void> {
    if (this.rollbackHandler) {
      await this.rollbackHandler(input, error);
    }
  }
}

export class FeatureRegistry {
  private static instance: FeatureRegistry;
  private readonly features: Map<string, FeatureComponent<unknown, unknown>>;
  private readonly eventBus: EventBus;

  private constructor() {
    this.features = new Map();
    this.eventBus = EventBus.getInstance();
  }

  static getInstance(): FeatureRegistry {
    if (!FeatureRegistry.instance) {
      FeatureRegistry.instance = new FeatureRegistry();
    }
    return FeatureRegistry.instance;
  }

  registerFeature<T, U>(feature: FeatureComponent<T, U>): void {
    if (this.features.has(feature.metadata.id)) {
      throw new Error(`Feature with ID ${feature.metadata.id} is already registered`);
    }
    this.features.set(feature.metadata.id, feature);
    // this.eventBus.publish({
    //   type: 'feature:registered',
    //   payload: {
    //     featureId: feature.metadata.id,
    //     metadata: feature.metadata,
    //     timestamp: Date.now()
    //   }
    // });
  }

  getFeature<T, U>(featureId: string): FeatureComponent<T, U> | undefined {
    return this.features.get(featureId) as FeatureComponent<T, U>;
  }

  listFeatures(): FeatureMetadata[] {
    return Array.from(this.features.values()).map(f => f.metadata);
  }

  composeFeatures<T, U, V>(
    firstFeatureId: string,
    secondFeatureId: string
  ): FeatureComponent<T, V> | undefined {
    const _first = this.getFeature<unknown, unknown>(firstFeatureId);
    const _second = this.getFeature<unknown, unknown>(secondFeatureId);
    if (!_first || !_second) {
      return undefined;
    }
    return _first.combine(_second) as FeatureComponent<T, V>;
  }

  async executeFeature<T, U>(featureId: string, input: T, context: FeatureContext): Promise<U> {
    const _feature = this.getFeature<T, U>(featureId);
    if (!_feature) {
      throw new Error(`Feature ${featureId} not found`);
    }
    return _feature.process(input, context);
  }
}
