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
export declare class ComposableFeature<T, U> implements FeatureComponent<T, U> {
  readonly metadata: FeatureMetadata;
  private readonly processor;
  private readonly validator?;
  private readonly rollbackHandler?;
  private readonly eventBus;
  private readonly performanceMonitor;
  constructor(
    metadata: FeatureMetadata,
    processor: (input: T, context: FeatureContext) => Promise<U>,
    validator?: ((input: T) => Promise<boolean>) | undefined,
    rollbackHandler?: ((input: T, error: Error) => Promise<void>) | undefined
  );
  process(input: T, context: FeatureContext): Promise<U>;
  combine<V>(next: FeatureComponent<U, V>): FeatureComponent<T, V>;
  validate(input: T): Promise<boolean>;
  rollback(input: T, error: Error): Promise<void>;
}
export declare class FeatureRegistry {
  private static instance;
  private readonly features;
  private readonly eventBus;
  private constructor();
  static getInstance(): FeatureRegistry;
  registerFeature<T, U>(feature: FeatureComponent<T, U>): void;
  getFeature<T, U>(featureId: string): FeatureComponent<T, U> | undefined;
  listFeatures(): FeatureMetadata[];
  composeFeatures<T, U, V>(
    firstFeatureId: string,
    secondFeatureId: string
  ): FeatureComponent<T, V> | undefined;
  executeFeature<T, U>(featureId: string, input: T, context: FeatureContext): Promise<U>;
}
