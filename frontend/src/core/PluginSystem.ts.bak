import { getLogger } from './UnifiedLogger';

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
  /** Legacy hook name support */
  activate?: PluginLifecycleHook;
  /** Legacy hook name support */
  deactivate?: PluginLifecycleHook;
}

export interface PluginRegistrationOptions {
  /** Enable plugin immediately after registration (default: true). */
  autoEnable?: boolean;
  /** Optional context for audit logging. */
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

export interface LifecycleInvokeOptions {
  source?: string;
  reason: string;
}

export class PluginSystem {
  private static instance: PluginSystem | null = null;

  private readonly plugins = new Map<string, RegisteredPlugin>();

  private readonly logger = getLogger('core/PluginSystem');

  private constructor() {}

  public static getInstance(): PluginSystem {
    if (!PluginSystem.instance) PluginSystem.instance = new PluginSystem();
    return PluginSystem.instance;
  }

  public register(
    plugin: PluginDefinition,
    options?: PluginRegistrationOptions
  ): RegisteredPlugin | null {
    if (!plugin || typeof plugin.id !== 'string' || plugin.id.trim() === '') {
      this.logger.warn('PluginSystem register called without id', { plugin });
      return null;
    }

    const now = Date.now();
    const existing = this.plugins.get(plugin.id);
    const entry: RegisteredPlugin = {
      ...existing,
      ...plugin,
      id: plugin.id,
      metadata: {
        ...(existing?.metadata ?? {}),
        ...(plugin.metadata ?? {}),
      },
      enabled: existing?.enabled ?? false,
      registeredAt: existing?.registeredAt ?? now,
      lastEnabledAt: existing?.lastEnabledAt,
      lastDisabledAt: existing?.lastDisabledAt,
      state: existing?.state ?? 'registered',
      lastError: existing?.lastError ?? null,
    };

    this.plugins.set(plugin.id, entry);
    this.audit('plugin_register', plugin.id, {
      name: plugin.name,
      source: options?.source,
    });

    this.invokeLifecycle(entry, 'setup', {
      reason: existing ? 'reconfigure' : 'register',
      source: options?.source,
    });

    if (entry.state !== 'error' && options?.autoEnable !== false) {
      this.enable(plugin.id, { source: options?.source, skipAuditIfActive: true });
    }

    return this.getPlugin(plugin.id) ?? null;
  }

  public unregister(id: string, context?: { source?: string }): boolean {
    const entry = this.plugins.get(id);
    if (!entry) {
      this.logger.warn('PluginSystem unregister called for missing plugin', { id });
      return false;
    }

    if (entry.enabled) {
      this.disable(id, { source: context?.source, skipAuditIfInactive: true });
    }

    this.invokeLifecycle(entry, 'teardown', { reason: 'unregister', source: context?.source });
    this.plugins.delete(id);
    this.audit('plugin_unregister', id, { source: context?.source });
    return true;
  }

  public enable(id: string, context?: { source?: string; skipAuditIfActive?: boolean }): boolean {
    const entry = this.plugins.get(id);
    if (!entry) {
      this.logger.warn('PluginSystem enable called for missing plugin', { id });
      return false;
    }
    if (entry.enabled) {
      if (!context?.skipAuditIfActive) {
        this.audit('plugin_enable_skip', id, {
          reason: 'already_enabled',
          source: context?.source,
        });
      }
      return true;
    }

    if (entry.state === 'error') {
      this.audit('plugin_enable_skip', id, { reason: 'error_state', source: context?.source });
      return false;
    }

    entry.enabled = true;
    entry.lastEnabledAt = Date.now();
    this.plugins.set(id, entry);
    this.invokeLifecycle(entry, 'onEnable', { reason: 'enable', source: context?.source });
    this.audit('plugin_enable', id, { source: context?.source });
    return true;
  }

  public disable(
    id: string,
    context?: { source?: string; skipAuditIfInactive?: boolean }
  ): boolean {
    const entry = this.plugins.get(id);
    if (!entry) {
      this.logger.warn('PluginSystem disable called for missing plugin', { id });
      return false;
    }
    if (!entry.enabled) {
      if (!context?.skipAuditIfInactive) {
        this.audit('plugin_disable_skip', id, {
          reason: 'already_disabled',
          source: context?.source,
        });
      }
      return true;
    }

    entry.enabled = false;
    entry.lastDisabledAt = Date.now();
    this.plugins.set(id, entry);
    this.invokeLifecycle(entry, 'onDisable', { reason: 'disable', source: context?.source });
    this.audit('plugin_disable', id, { source: context?.source });
    return true;
  }

  public isEnabled(id: string): boolean {
    return this.plugins.get(id)?.enabled ?? false;
  }

  public getPlugin(id: string): RegisteredPlugin | undefined {
    const entry = this.plugins.get(id);
    return entry ? { ...entry, metadata: { ...entry.metadata } } : undefined;
  }

  public list(): RegisteredPlugin[] {
    return Array.from(this.plugins.values()).map(entry => this.getPlugin(entry.id)!) ?? [];
  }

  public getRegisteredIds(): string[] {
    return Array.from(this.plugins.keys());
  }

  public reset(context?: { source?: string; reason?: string }): void {
    const reason = context?.reason ?? 'system_reset';
    Array.from(this.plugins.values()).forEach(entry => {
      if (entry.enabled) {
        this.disable(entry.id, { source: context?.source, skipAuditIfInactive: true });
      }
      this.invokeLifecycle(entry, 'onReset', { reason, source: context?.source });
      this.invokeLifecycle(entry, 'teardown', { reason, source: context?.source });
    });
    this.plugins.clear();
    this.audit('plugin_reset', '*', { reason, source: context?.source });
  }

  private invokeLifecycle(
    entry: RegisteredPlugin,
    phase: 'setup' | 'teardown' | 'onEnable' | 'onDisable' | 'onReset',
    context: LifecycleInvokeOptions
  ) {
    const hook = this.getLifecycleHook(entry, phase);
    if (!hook) {
      if (phase === 'setup' && phase in entry) {
        // Maintain legacy activate/deactivate hooks when present
        this.invokeLegacyLifecycle(entry, phase, context);
      }
      return;
    }

    try {
      const result = hook({ pluginId: entry.id, reason: context.reason, source: context.source });
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        (result as Promise<void>)
          .then(() => {
            if (phase === 'setup') {
              entry.state = 'ready';
              entry.lastError = null;
              this.plugins.set(entry.id, entry);
            }
          })
          .catch(error => {
            this.handleLifecycleError(entry, phase, error);
          });
      } else if (phase === 'setup') {
        entry.state = 'ready';
        entry.lastError = null;
        this.plugins.set(entry.id, entry);
      }
    } catch (error) {
      this.handleLifecycleError(entry, phase, error);
    }
  }

  private invokeLegacyLifecycle(
    entry: RegisteredPlugin,
    phase: 'setup' | 'teardown',
    context: LifecycleInvokeOptions
  ) {
    const legacyHook = phase === 'setup' ? entry.activate : entry.deactivate;
    if (!legacyHook) return;

    try {
      const result = legacyHook({
        pluginId: entry.id,
        reason: context.reason,
        source: context.source,
      });
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        (result as Promise<void>).catch(error => this.handleLifecycleError(entry, phase, error));
      }
    } catch (error) {
      this.handleLifecycleError(entry, phase, error);
    }
  }

  private getLifecycleHook(
    entry: RegisteredPlugin,
    phase: 'setup' | 'teardown' | 'onEnable' | 'onDisable' | 'onReset'
  ): PluginLifecycleHook | undefined {
    switch (phase) {
      case 'setup':
        return entry.setup;
      case 'teardown':
        return entry.teardown;
      case 'onEnable':
        return entry.onEnable ?? entry.activate;
      case 'onDisable':
        return entry.onDisable ?? entry.deactivate;
      case 'onReset':
        return entry.onReset;
      default:
        return undefined;
    }
  }

  private handleLifecycleError(entry: RegisteredPlugin, phase: string, error: unknown) {
    this.logger.warn('PluginSystem lifecycle hook failed', {
      pluginId: entry.id,
      phase,
      error: this.serializeError(error),
    });

    if (phase === 'setup') {
      entry.state = 'error';
      entry.lastError = this.serializeError(error) as { message: string; stack?: string };
      this.plugins.set(entry.id, entry);
    }
  }

  private audit(event: string, id: string, extra?: Record<string, unknown>) {
    this.logger.info('PluginSystem audit event', {
      event,
      pluginId: id,
      timestamp: Date.now(),
      ...(extra ?? {}),
    });
  }

  private serializeError(error: unknown): Record<string, unknown> {
    if (error instanceof Error) {
      return { message: error.message, stack: error.stack ?? undefined };
    }
    if (typeof error === 'object' && error !== null) {
      return { ...(error as Record<string, unknown>) };
    }
    return { message: String(error) };
  }
}

export const pluginSystem = PluginSystem.getInstance();

export default pluginSystem;
