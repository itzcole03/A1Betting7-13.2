export interface AnalysisContext {
  timestamp: number;
  streamConfidence: number;
  modelDiversity: number;
  predictionStability: number;
  metadata?: Record<string, any>;
}

export interface AnalysisPlugin<TInput, TOutput> {
  id: string;
  name: string;
  version: string;
  analyze(input: TInput, context: AnalysisContext): Promise<TOutput>;
  confidence: number;
  metadata: {
    description: string;
    author: string;
    dependencies: string[];
    tags: string[];
  };
}

export declare class AnalysisRegistry {
  private static instance;
  private readonly eventBus;
  private readonly performanceMonitor;
  private readonly monitor;
  private readonly plugins;
  private readonly pluginDependencies;
  private readonly pluginConfidence;
  private constructor();
  static getInstance(): AnalysisRegistry;
  registerPlugin<TInput, TOutput>(plugin: AnalysisPlugin<TInput, TOutput>): void;
  unregisterPlugin(pluginId: string): void;
  getPlugin<TInput, TOutput>(pluginId: string): AnalysisPlugin<TInput, TOutput> | undefined;
  analyze<TInput, TOutput>(
    pluginId: string,
    input: TInput,
    context: AnalysisContext
  ): Promise<TOutput>;
  analyzeWithFallback<TInput, TOutput>(
    primaryPluginId: string,
    fallbackPluginId: string,
    input: TInput,
    context: AnalysisContext
  ): Promise<TOutput>;
  getPluginsByTag(tag: string): AnalysisPlugin<any, any>[];
  getPluginConfidence(pluginId: string): number;
  private validateDependencies;
  private updatePluginConfidence;
  private calculatePluginConfidence;
}
