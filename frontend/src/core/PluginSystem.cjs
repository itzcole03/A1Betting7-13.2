const { getLogger } = require('./UnifiedLogger.cjs');

const logger = getLogger('core/PluginSystem');

function clonePlugin(entry) {
  if (!entry) return undefined;
  return {
    ...entry,
    metadata: { ...(entry.metadata || {}) },
  };
}

class PluginSystem {
  constructor() {
    this.plugins = new Map();
  }

  register(plugin, options) {
    if (!plugin || typeof plugin.id !== 'string' || plugin.id.trim() === '') {
      logger.warn('PluginSystem register called without id', { plugin });
      return null;
    }

    const now = Date.now();
    const existing = this.plugins.get(plugin.id);
    const entry = {
      ...existing,
      ...plugin,
      id: plugin.id,
      metadata: {
        ...(existing && existing.metadata ? existing.metadata : {}),
        ...(plugin.metadata || {}),
      },
      enabled: existing ? existing.enabled : false,
      registeredAt: existing ? existing.registeredAt : now,
      lastEnabledAt: existing ? existing.lastEnabledAt : undefined,
      lastDisabledAt: existing ? existing.lastDisabledAt : undefined,
      state: existing ? existing.state : 'registered',
      lastError: existing ? existing.lastError : null,
    };

    this.plugins.set(plugin.id, entry);
    this.audit('plugin_register', plugin.id, {
      name: plugin.name,
      source: options && options.source,
    });

    this.invokeLifecycle(entry, 'setup', {
      reason: existing ? 'reconfigure' : 'register',
      source: options && options.source,
    });

    if (entry.state !== 'error') {
      const autoEnable = !options || options.autoEnable !== false;
      if (autoEnable) {
        this.enable(plugin.id, { source: options && options.source, skipAuditIfActive: true });
      }
    }

    return clonePlugin(this.plugins.get(plugin.id));
  }

  unregister(id, context) {
    const entry = this.plugins.get(id);
    if (!entry) {
      logger.warn('PluginSystem unregister called for missing plugin', { id });
      return false;
    }

    if (entry.enabled) {
      this.disable(id, { source: context && context.source, skipAuditIfInactive: true });
    }

    this.invokeLifecycle(entry, 'teardown', {
      reason: 'unregister',
      source: context && context.source,
    });
    this.plugins.delete(id);
    this.audit('plugin_unregister', id, { source: context && context.source });
    return true;
  }

  enable(id, context) {
    const entry = this.plugins.get(id);
    if (!entry) {
      logger.warn('PluginSystem enable called for missing plugin', { id });
      return false;
    }
    if (entry.enabled) {
      if (!context || !context.skipAuditIfActive) {
        this.audit('plugin_enable_skip', id, {
          reason: 'already_enabled',
          source: context && context.source,
        });
      }
      return true;
    }

    if (entry.state === 'error') {
      this.audit('plugin_enable_skip', id, {
        reason: 'error_state',
        source: context && context.source,
      });
      return false;
    }

    entry.enabled = true;
    entry.lastEnabledAt = Date.now();
    this.plugins.set(id, entry);
    this.invokeLifecycle(entry, 'onEnable', {
      reason: 'enable',
      source: context && context.source,
    });
    this.audit('plugin_enable', id, { source: context && context.source });
    return true;
  }

  disable(id, context) {
    const entry = this.plugins.get(id);
    if (!entry) {
      logger.warn('PluginSystem disable called for missing plugin', { id });
      return false;
    }
    if (!entry.enabled) {
      if (!context || !context.skipAuditIfInactive) {
        this.audit('plugin_disable_skip', id, {
          reason: 'already_disabled',
          source: context && context.source,
        });
      }
      return true;
    }

    entry.enabled = false;
    entry.lastDisabledAt = Date.now();
    this.plugins.set(id, entry);
    this.invokeLifecycle(entry, 'onDisable', {
      reason: 'disable',
      source: context && context.source,
    });
    this.audit('plugin_disable', id, { source: context && context.source });
    return true;
  }

  list() {
    return Array.from(this.plugins.values()).map(p => clonePlugin(p));
  }

  getPlugin(id) {
    return clonePlugin(this.plugins.get(id));
  }

  isEnabled(id) {
    const entry = this.plugins.get(id);
    return entry ? Boolean(entry.enabled) : false;
  }

  getRegisteredIds() {
    return Array.from(this.plugins.keys());
  }

  reset(context) {
    const reason = (context && context.reason) || 'system_reset';
    Array.from(this.plugins.values()).forEach(entry => {
      if (entry.enabled) {
        this.disable(entry.id, { source: context && context.source, skipAuditIfInactive: true });
      }
      this.invokeLifecycle(entry, 'onReset', { reason, source: context && context.source });
      this.invokeLifecycle(entry, 'teardown', { reason, source: context && context.source });
    });
    this.plugins.clear();
    this.audit('plugin_reset', '*', { reason, source: context && context.source });
  }

  invokeLifecycle(entry, phase, context) {
    const hook = this.getLifecycleHook(entry, phase);
    if (!hook) {
      if (phase === 'setup') {
        this.invokeLegacyLifecycle(entry, phase, context);
      }
      return;
    }

    try {
      const result = hook({ pluginId: entry.id, reason: context.reason, source: context.source });
      if (result && typeof result.then === 'function') {
        result
          .then(() => {
            if (phase === 'setup') {
              entry.state = 'ready';
              entry.lastError = null;
              this.plugins.set(entry.id, entry);
            }
          })
          .catch(error => this.handleLifecycleError(entry, phase, error));
      } else if (phase === 'setup') {
        entry.state = 'ready';
        entry.lastError = null;
        this.plugins.set(entry.id, entry);
      }
    } catch (error) {
      this.handleLifecycleError(entry, phase, error);
    }
  }

  invokeLegacyLifecycle(entry, phase, context) {
    const legacyHook = phase === 'setup' ? entry.activate : entry.deactivate;
    if (!legacyHook) return;

    try {
      const result = legacyHook({
        pluginId: entry.id,
        reason: context.reason,
        source: context.source,
      });
      if (result && typeof result.then === 'function') {
        result.catch(error => this.handleLifecycleError(entry, phase, error));
      }
    } catch (error) {
      this.handleLifecycleError(entry, phase, error);
    }
  }

  getLifecycleHook(entry, phase) {
    switch (phase) {
      case 'setup':
        return entry.setup;
      case 'teardown':
        return entry.teardown;
      case 'onEnable':
        return entry.onEnable || entry.activate;
      case 'onDisable':
        return entry.onDisable || entry.deactivate;
      case 'onReset':
        return entry.onReset;
      default:
        return undefined;
    }
  }

  handleLifecycleError(entry, phase, error) {
    logger.warn('PluginSystem lifecycle hook failed', {
      pluginId: entry.id,
      phase,
      error: this.serializeError(error),
    });

    if (phase === 'setup') {
      entry.state = 'error';
      entry.lastError = this.serializeError(error);
      this.plugins.set(entry.id, entry);
    }
  }

  audit(event, id, extra) {
    logger.info('PluginSystem audit event', {
      event,
      pluginId: id,
      timestamp: Date.now(),
      ...(extra || {}),
    });
  }

  serializeError(error) {
    if (error instanceof Error) {
      return { message: error.message, stack: error.stack || undefined };
    }
    if (error && typeof error === 'object') {
      return { ...error };
    }
    return { message: String(error) };
  }
}

const system = new PluginSystem();

module.exports = Object.assign(system, {
  PluginSystem,
  register: system.register.bind(system),
  unregister: system.unregister.bind(system),
  enable: system.enable.bind(system),
  disable: system.disable.bind(system),
  list: system.list.bind(system),
  getPlugin: system.getPlugin.bind(system),
  isEnabled: system.isEnabled.bind(system),
  getRegisteredIds: system.getRegisteredIds.bind(system),
  reset: system.reset.bind(system),
  registered: system.list.bind(system),
});
