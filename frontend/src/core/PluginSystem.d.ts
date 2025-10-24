export interface PluginLifecycleContext {
  pluginId: string;
  reason: string;
  source?: string;
}

export type PluginLifecycleHook = (context: PluginLifecycleContext) => void | Promise<void>;

export interface PluginDefinition {
  id: string;
  name?: string;
  description?: string;
  version?: string;
  metadata?: Record<string, unknown>;
  setup?: PluginLifecycleHook;
  teardown?: PluginLifecycleHook;
  onEnable?: PluginLifecycleHook;
  onDisable?: PluginLifecycleHook;
  onReset?: PluginLifecycleHook;
  activate?: PluginLifecycleHook;
  deactivate?: PluginLifecycleHook;
}

export interface PluginRegistrationOptions {
  autoEnable?: boolean;
  source?: string;
}

export interface RegisteredPlugin extends PluginDefinition {
  enabled: boolean;
  registeredAt: number;
  lastEnabledAt?: number;
  lastDisabledAt?: number;
  state: 'registered' | 'ready' | 'error';
  lastError?: { message: string; stack?: string } | null;
  metadata: Record<string, unknown>;
}

export declare class PluginSystem {
  private static instance;
  private readonly plugins;
  private readonly logger;
  private constructor();
  static getInstance(): PluginSystem;
  register(plugin: PluginDefinition, options?: PluginRegistrationOptions): RegisteredPlugin | null;
  unregister(id: string, context?: { source?: string }): boolean;
  enable(id: string, context?: { source?: string; skipAuditIfActive?: boolean }): boolean;
  disable(id: string, context?: { source?: string; skipAuditIfInactive?: boolean }): boolean;
  isEnabled(id: string): boolean;
  getPlugin(id: string): RegisteredPlugin | undefined;
  list(): RegisteredPlugin[];
  getRegisteredIds(): string[];
  reset(context?: { source?: string; reason?: string }): void;
}

export declare const pluginSystem: PluginSystem;
export default pluginSystem;
