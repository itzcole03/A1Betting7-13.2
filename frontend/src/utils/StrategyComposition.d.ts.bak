export interface StrategyContext {
  timestamp: number;
  environment: string;
  parameters: StrategyParameters;
}
type StrategyParameters = Record<string, string | number | boolean | object>;
export interface StrategyComponent<T, U> {
  id: string;
  name: string;
  version: string;
  priority: number;
  dependencies: string[];
  evaluate(input: T, context: StrategyContext): Promise<U>;
  validate?(input: T): Promise<boolean>;
  canHandle(input: T): boolean;
}
export interface StrategyResult<T> {
  id: string;
  timestamp: number;
  duration: number;
  data: T;
  confidence: number;
  metadata: {
    strategy: string;
    version: string;
    parameters: Record<string, string | number | boolean | object>;
  };
  metrics: {
    accuracy: number;
    reliability: number;
    performance: number;
  };
}
export declare class StrategyRegistry {
  private static instance: StrategyRegistry;
  private readonly strategies: Map<string, StrategyComponent<unknown, unknown>>;
  private readonly eventBus;
  private readonly performanceMonitor;
  private constructor();
  static getInstance(): StrategyRegistry;
  registerStrategy<T, U>(strategy: StrategyComponent<T, U>): void;
  evaluate<T, U>(
    strategyId: string,
    input: T,
    context: StrategyContext
  ): Promise<StrategyResult<U>>;
  evaluateWithPipeline<T, U>(
    strategies: string[],
    input: T,
    context: StrategyContext
  ): Promise<StrategyResult<U>>;
  private sortStrategiesByDependencies;
  private calculateConfidence;
  private calculateMetrics;
  private calculateAccuracy;
  private calculateReliability;
  private calculatePerformance;
  getStrategy<T, U>(strategyId: string): StrategyComponent<T, U> | undefined;
  listStrategies(): Array<{
    id: string;
    name: string;
    version: string;
  }>;
}
export declare class ComposableStrategy<T, U> implements StrategyComponent<T, U> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly priority: number;
  readonly dependencies: string[];
  private readonly evaluator;
  private readonly validator?;
  private readonly handler?;
  constructor(
    id: string,
    name: string,
    version: string,
    priority: number,
    dependencies: string[],
    evaluator: (input: T, context: StrategyContext) => Promise<U>,
    validator?: ((input: T) => Promise<boolean>) | undefined,
    handler?: ((input: T) => boolean) | undefined
  );
  evaluate(input: T, context: StrategyContext): Promise<U>;
  validate(input: T): Promise<boolean>;
  canHandle(input: T): boolean;
  compose<V>(next: StrategyComponent<U, V>): StrategyComponent<T, V>;
}
