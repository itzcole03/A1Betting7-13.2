// Branded type for plugin IDs
export type PluginId = string & { readonly brand: unique symbol };
import { UnifiedMonitor } from '../core/UnifiedMonitor';
import { EventBus } from '../unified/EventBus';

export interface AnalysisContext {
  timestamp: number;
  streamConfidence: number;
  modelDiversity: number;
  predictionStability: number;
  metadata?: Record<string, unknown>;
}

export interface AnalysisPlugin<TInput, TOutput> {
  id: PluginId;
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

export class AnalysisRegistry {
  private static instance: AnalysisRegistry;
  private readonly eventBus: EventBus;
  private readonly monitor: UnifiedMonitor;
  private readonly plugins: Map<PluginId, AnalysisPlugin<any, any>>;
  private readonly pluginDependencies: Map<PluginId, Set<PluginId>>;
  private readonly pluginConfidence: Map<PluginId, number>;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.monitor = UnifiedMonitor.getInstance();
    this.plugins = new Map();
    this.pluginDependencies = new Map();
    this.pluginConfidence = new Map();
  }

  static getInstance(): AnalysisRegistry {
    if (!AnalysisRegistry.instance) {
      AnalysisRegistry.instance = new AnalysisRegistry();
    }
    return AnalysisRegistry.instance;
  }

  public registerPlugin<TInput, TOutput>(plugin: AnalysisPlugin<TInput, TOutput>): void {
    // Branded type guard for plugin ID
    if (typeof plugin.id !== 'string' || !(plugin.id as PluginId)) {
      throw new Error('Invalid plugin ID type');
    }
    if (this.plugins.has(plugin.id)) {
      throw new Error('Plugin with ID ' + plugin.id + ' already registered');
    }
    // Validate plugin dependencies
    this.validateDependencies(plugin);
    // Runtime type guard for plugin
    if (
      typeof plugin.name === 'string' &&
      typeof plugin.version === 'string' &&
      typeof plugin.analyze === 'function'
    ) {
      this.plugins.set(plugin.id, plugin);
      this.pluginDependencies.set(plugin.id, new Set(plugin.metadata.dependencies as PluginId[]));
      this.pluginConfidence.set(plugin.id, plugin.confidence);
      // Record metric
      this.monitor.recordMetric('plugin_registered', 1, {
        plugin_id: plugin.id,
        plugin_name: plugin.name,
        plugin_version: plugin.version,
      });
    } else {
      throw new Error('Invalid plugin type');
    }
  }

  public unregisterPlugin(pluginId: PluginId): void {
    if (!this.plugins.has(pluginId)) {
      return;
    }
    // Check if any other plugins depend on this one
    for (const [id, dependencies] of this.pluginDependencies.entries()) {
      if (dependencies.has(pluginId)) {
        throw new Error(
          'Cannot unregister plugin ' + pluginId + ' as it is required by plugin ' + id
        );
      }
    }
    this.plugins.delete(pluginId);
    this.pluginDependencies.delete(pluginId);
    this.pluginConfidence.delete(pluginId);
    // Record metric
    this.monitor.recordMetric('plugin_unregistered', 1, {
      plugin_id: pluginId,
    });
  }

  public getPlugin<TInput, TOutput>(
    pluginId: PluginId
  ): AnalysisPlugin<TInput, TOutput> | undefined {
    const plugin = this.plugins.get(pluginId);
    if (
      plugin &&
      typeof plugin.name === 'string' &&
      typeof plugin.version === 'string' &&
      typeof plugin.analyze === 'function'
    ) {
      return plugin as AnalysisPlugin<TInput, TOutput>;
    }
    return undefined;
  }

  public async analyze<TInput, TOutput>(
    pluginId: PluginId,
    input: TInput,
    context: AnalysisContext
  ): Promise<TOutput> {
    const _plugin = this.getPlugin<TInput, TOutput>(pluginId);
    if (!_plugin) {
      throw new Error('Plugin ' + pluginId + ' not found');
    }
    const _trace = this.monitor.startTrace('plugin-analysis');
    try {
      // Run analysis
      const _result = await _plugin.analyze(input, context);
      // Update plugin confidence based on result
      this.updatePluginConfidence(pluginId, context);
      this.monitor.endTrace(_trace);
      return _result;
    } catch (error) {
      this.monitor.endTrace(_trace, error as Error);
      throw error;
    }
  }

  public async analyzeWithFallback<TInput, TOutput>(
    primaryPluginId: PluginId,
    fallbackPluginId: PluginId,
    input: TInput,
    context: AnalysisContext
  ): Promise<TOutput> {
    try {
      return await this.analyze<TInput, TOutput>(primaryPluginId, input, context);
    } catch (error) {
      // Log error for fallback analysis
      this.monitor.recordMetric('plugin_analysis_error', 1, {
        error: (error as Error).message,
        primaryPluginId,
        fallbackPluginId,
      });
      return await this.analyze<TInput, TOutput>(fallbackPluginId, input, context);
    }
  }

  public getPluginsByTag<TInput, TOutput>(tag: string): AnalysisPlugin<TInput, TOutput>[] {
    return Array.from(this.plugins.values()).filter(plugin =>
      plugin.metadata.tags.includes(tag)
    ) as AnalysisPlugin<TInput, TOutput>[];
  }

  public getPluginConfidence(pluginId: PluginId): number {
    return this.pluginConfidence.get(pluginId) || 0;
  }

  private validateDependencies<TInput, TOutput>(plugin: AnalysisPlugin<TInput, TOutput>): void {
    for (const _dependency of plugin.metadata.dependencies as PluginId[]) {
      if (!this.plugins.has(_dependency)) {
        throw new Error('Plugin ' + plugin.id + ' requires missing dependency ' + _dependency);
      }
    }
  }

  private updatePluginConfidence(pluginId: PluginId, context: AnalysisContext): void {
    const _plugin = this.plugins.get(pluginId);
    const _currentConfidence = this.pluginConfidence.get(pluginId) || 0;
    if (!_plugin) return;
    // Update confidence based on context and stability
    const _newConfidence = this.calculatePluginConfidence(_currentConfidence, _plugin, context);
    this.pluginConfidence.set(pluginId, _newConfidence);
    // Record metric
    this.monitor.recordMetric('plugin_confidence', _newConfidence, {
      plugin_id: pluginId,
      plugin_name: _plugin.name,
    });
  }

  private calculatePluginConfidence<TInput, TOutput>(
    currentConfidence: number,
    plugin: AnalysisPlugin<TInput, TOutput>,
    context: AnalysisContext
  ): number {
    const _weights = {
      streamConfidence: 0.3,
      modelDiversity: 0.2,
      predictionStability: 0.3,
      historicalConfidence: 0.2,
    };
    const _newConfidence =
      context.streamConfidence * _weights.streamConfidence +
      context.modelDiversity * _weights.modelDiversity +
      context.predictionStability * _weights.predictionStability +
      currentConfidence * _weights.historicalConfidence;
    return Math.max(0, Math.min(1, _newConfidence));
  }
}
