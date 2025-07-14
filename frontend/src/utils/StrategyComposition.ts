import { EventBus } from '../core/EventBus';
import { PerformanceMonitor } from './PerformanceMonitor';

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

export class StrategyRegistry {
  private static instance: StrategyRegistry;
  private readonly strategies: Map<string, StrategyComponent<unknown, unknown>>;
  private readonly eventBus: EventBus;
  private readonly performanceMonitor: PerformanceMonitor;

  private constructor() {
    this.strategies = new Map();
    this.eventBus = EventBus.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  static getInstance(): StrategyRegistry {
    if (!StrategyRegistry.instance) {
      StrategyRegistry.instance = new StrategyRegistry();
    }
    return StrategyRegistry.instance;
  }

  registerStrategy<T, U>(strategy: StrategyComponent<T, U>): void {
    if (this.strategies.has(strategy.id)) {
      throw new Error(`Strategy with ID ${strategy.id} is already registered`);
    }

    // Validate dependencies;
    for (const depId of strategy.dependencies) {
      if (!this.strategies.has(depId)) {
        throw new Error(`Dependency ${depId} not found for strategy ${strategy.id}`);
      }
    }

    this.strategies.set(strategy.id, strategy);
    this.eventBus.emit('strategy:registered', {
      strategyId: strategy.id,
      name: strategy.name,
      version: strategy.version,
      timestamp: Date.now(),
    });
  }

  async evaluate<T, U>(
    strategyId: string,
    input: T,
    context: StrategyContext
  ): Promise<StrategyResult<U>> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found`);
    }
    const traceId = this.performanceMonitor.startTrace(`strategy-${strategy.id}`);

    try {
      if (!strategy.canHandle(input)) {
        throw new Error(`Strategy ${strategy.id} cannot handle the provided input`);
      }

      if (strategy.validate && !(await strategy.validate(input))) {
        throw new Error(`Input validation failed for strategy ${strategy.id}`);
      }

      const startTime = Date.now();
      const result = await strategy.evaluate(input, context);
      const duration = Date.now() - startTime;

      // Type guard: ensure result is of type U before assignment
      let typedResult: U;
      if (this.isType<U>(result)) {
        typedResult = result as U;
      } else {
        throw new Error(`Result type does not match expected type for strategy ${strategy.id}`);
      }

      const strategyResult: StrategyResult<U> = {
        id: `${strategy.id}-${startTime}`,
        timestamp: startTime,
        duration,
        data: typedResult,
        confidence: this.calculateConfidence(result),
        metadata: {
          strategy: strategy.id,
          version: strategy.version,
          parameters: context.parameters,
        },
        metrics: this.calculateMetrics(result),
      };

      this.eventBus.emit('strategy:evaluated', {
        strategyId: strategy.id,
        resultId: strategyResult.id,
        duration,
        metrics: strategyResult.metrics,
        timestamp: Date.now(),
      });

      this.performanceMonitor.endTrace(traceId);
      return strategyResult;
    } catch (error) {
      this.performanceMonitor.endTrace(traceId, error as Error);
      throw error;
    }
  }

  async evaluateWithPipeline<T, U>(
    strategies: string[],
    input: T,
    context: StrategyContext
  ): Promise<StrategyResult<U>> {
    const sortedStrategies = this.sortStrategiesByDependencies(strategies);
    let currentInput: unknown = input;
    let lastResult: StrategyResult<unknown> | null = null;
    for (const strategyId of sortedStrategies) {
      lastResult = await this.evaluate(strategyId, currentInput as T, {
        ...context,
        parameters: {
          ...context.parameters,
          previousResults: lastResult ? [lastResult] : [],
        },
      });
      currentInput = lastResult.data;
    }
    // Type guard: ensure lastResult is StrategyResult<U>
    if (lastResult && typeof lastResult === 'object' && 'data' in lastResult) {
      // Cast data to U for type safety
      return { ...lastResult, data: lastResult.data as U } as StrategyResult<U>;
    }
    throw new Error('Pipeline did not produce a valid result');
  }

  private sortStrategiesByDependencies(strategyIds: string[]): string[] {
    const graph = new Map<string, Set<string>>();
    const visited = new Set<string>();
    const sorted: string[] = [];
    for (const id of strategyIds) {
      const strategy = this.strategies.get(id);
      if (!strategy) continue;
      graph.set(id, new Set(strategy.dependencies.filter(dep => strategyIds.includes(dep))));
    }
    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      const deps = graph.get(id) || new Set();
      for (const dep of deps) {
        visit(dep);
      }
      sorted.push(id);
    };
    for (const id of strategyIds) {
      visit(id);
    }
    return sorted;
  }

  private calculateConfidence(result: unknown): number {
    if (typeof result === 'object' && result !== null) {
      if ('confidence' in result && typeof (result as any).confidence === 'number')
        return (result as any).confidence;
      if ('probability' in result && typeof (result as any).probability === 'number')
        return (result as any).probability;
      if ('score' in result && typeof (result as any).score === 'number')
        return (result as any).score;
    }
    return 1;
  }

  private calculateMetrics(result: unknown): StrategyResult<unknown>['metrics'] {
    return {
      accuracy: this.calculateAccuracy(result),
      reliability: this.calculateReliability(result),
      performance: this.calculatePerformance(result),
    };
  }

  private calculateAccuracy(result: unknown): number {
    if (typeof result === 'object' && result !== null) {
      if ('accuracy' in result && typeof (result as any).accuracy === 'number')
        return (result as any).accuracy;
      if ('confidence' in result && typeof (result as any).confidence === 'number')
        return (result as any).confidence;
    }
    return 1;
  }

  private calculateReliability(result: unknown): number {
    if (typeof result === 'object' && result !== null) {
      if ('reliability' in result && typeof (result as any).reliability === 'number')
        return (result as any).reliability;
      if ('stability' in result && typeof (result as any).stability === 'number')
        return (result as any).stability;
    }
    return 1;
  }

  private calculatePerformance(result: unknown): number {
    if (typeof result === 'object' && result !== null) {
      if ('performance' in result && typeof (result as any).performance === 'number')
        return (result as any).performance;
      if ('efficiency' in result && typeof (result as any).efficiency === 'number')
        return (result as any).efficiency;
    }
    return 1;
  }

  getStrategy<T, U>(strategyId: string): StrategyComponent<T, U> | undefined {
    return this.strategies.get(strategyId) as StrategyComponent<T, U>;
  }

  listStrategies(): Array<{ id: string; name: string; version: string }> {
    return Array.from(this.strategies.values()).map(s => ({
      id: s.id,
      name: s.name,
      version: s.version,
    }));
  }

  // Add a generic type guard helper
  private isType<T>(value: unknown): value is T {
    // This is a runtime stub; in production, provide a more robust check if possible
    return true;
  }
}

export class ComposableStrategy<T, U> implements StrategyComponent<T, U> {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly version: string,
    public readonly priority: number,
    public readonly dependencies: string[],
    private readonly evaluator: (input: T, context: StrategyContext) => Promise<U>,
    private readonly validator?: (input: T) => Promise<boolean>,
    private readonly handler?: (input: T) => boolean
  ) {}

  async evaluate(input: T, context: StrategyContext): Promise<U> {
    return this.evaluator(input, context);
  }

  async validate(input: T): Promise<boolean> {
    if (this.validator) {
      return this.validator(input);
    }
    return true;
  }

  canHandle(input: T): boolean {
    if (this.handler) {
      return this.handler(input);
    }
    return true;
  }

  compose<V>(next: StrategyComponent<U, V>): StrategyComponent<T, V> {
    return new ComposableStrategy(
      `${this.id}->${next.id}`,
      `${this.name} -> ${next.name}`,
      `${this.version}+${next.version}`,
      Math.max(this.priority, next.priority),
      [...this.dependencies, ...next.dependencies],
      async (input: T, context: StrategyContext) => {
        const intermediate = await this.evaluate(input, context);
        return next.evaluate(intermediate, context);
      },
      undefined,
      undefined
    );
  }
}
