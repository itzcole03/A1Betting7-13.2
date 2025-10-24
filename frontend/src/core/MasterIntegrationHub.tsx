import type { ReactNode } from 'react';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { _SPORTS_CONFIG } from '../constants/sports';
import {
  masterServiceRegistry,
  type ServiceHealth,
  type ServiceMetrics,
} from '../services/MasterServiceRegistry';
import { UnifiedMonitor, type MetricSummary } from './UnifiedMonitor';

type HealthStatus = ServiceHealth['status'];

export interface ServiceHealthSnapshot extends ServiceHealth {
  name: string;
}

interface IntegrationSnapshots {
  services: ServiceHealthSnapshot[];
  metrics: MetricSummary[];
  systemStats: ReturnType<typeof masterServiceRegistry.getSystemStatistics>;
  serviceMetrics: ServiceMetrics[];
  activeSports: typeof _SPORTS_CONFIG;
}

export interface MasterIntegrationContextValue extends IntegrationSnapshots {
  loading: boolean;
  errors: string[];
  lastUpdated: number | null;
  themeId: string;
  setTheme: (themeId: string) => Promise<void>;
  refresh: (options?: { silent?: boolean }) => Promise<void>;
  syncAllSystems: () => Promise<void>;
  recordCustomMetric: (name: string, value: number, status?: HealthStatus) => void;
}

const MasterIntegrationContext = createContext<MasterIntegrationContextValue | null>(null);

const DEFAULT_THEME_ID = 'cyber-dark';
const POLLING_INTERVAL_MS = 60_000;

const getDefaultHealth = (name: string): ServiceHealthSnapshot => ({
  name,
  status: 'degraded',
  responseTime: 0,
  lastCheck: new Date(),
  errorCount: 0,
  uptime: 0,
});

const mapHealth = (name: string, health: ServiceHealth | null): ServiceHealthSnapshot => {
  if (!health) {
    return getDefaultHealth(name);
  }
  return { ...health, name };
};

const activeSportsSnapshot = _SPORTS_CONFIG.filter(sport => sport.season?.active);

export const useMasterIntegration = (): MasterIntegrationContextValue => {
  const context = useContext(MasterIntegrationContext);
  if (!context) {
    throw new Error('useMasterIntegration must be used within a MasterIntegrationProvider');
  }
  return context;
};

interface MasterIntegrationProviderProps {
  children: ReactNode;
  pollingIntervalMs?: number;
}

export const MasterIntegrationProvider: React.FC<MasterIntegrationProviderProps> = ({
  children,
  pollingIntervalMs = POLLING_INTERVAL_MS,
}) => {
  const monitorRef = useRef(UnifiedMonitor.getInstance());
  const integrationsLoadedRef = useRef(false);

  const [snapshots, setSnapshots] = useState<IntegrationSnapshots>({
    services: [],
    metrics: [],
    systemStats: masterServiceRegistry.getSystemStatistics(),
    serviceMetrics: (masterServiceRegistry.getServiceMetrics() as ServiceMetrics[]) ?? [],
    activeSports: activeSportsSnapshot,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME_ID);
  const themeModuleRef = useRef<{
    applyCSSVariables: (theme: unknown) => void;
    getThemeById: (themeId: string) => unknown;
    themes: Array<{ id: string }>;
  } | null>(null);

  const appendError = useCallback((message: string) => {
    setErrors(prev => (prev.length > 10 ? [...prev.slice(-9), message] : [...prev, message]));
  }, []);

  const loadThemeModule = useCallback(async () => {
    if (themeModuleRef.current) {
      return themeModuleRef.current;
    }

    try {
      const module = (await import('../theme/index')) as Record<string, unknown>;
      const applyCSSVariables =
        typeof module._applyCSSVariables === 'function'
          ? (module._applyCSSVariables as (theme: unknown) => void)
          : () => undefined;
      const getThemeById =
        typeof module._getThemeById === 'function'
          ? (module._getThemeById as (themeId: string) => unknown)
          : () => undefined;
      const themes = Array.isArray(module._THEMES) ? (module._THEMES as Array<{ id: string }>) : [];

      themeModuleRef.current = {
        applyCSSVariables,
        getThemeById,
        themes,
      };
    } catch (error) {
      themeModuleRef.current = {
        applyCSSVariables: () => undefined,
        getThemeById: () => undefined,
        themes: [],
      };
      appendError(`Theme module load failed: ${(error as Error).message}`);
    }

    return themeModuleRef.current!;
  }, [appendError]);

  const ensureThemeApplied = useCallback(
    async (nextThemeId: string) => {
      const module = await loadThemeModule();
      const resolved =
        (module.getThemeById(nextThemeId) as { id: string } | undefined) ??
        (module.getThemeById(DEFAULT_THEME_ID) as { id: string } | undefined) ??
        module.themes[0];

      if (!resolved) {
        setThemeId(nextThemeId);
        return;
      }

      try {
        module.applyCSSVariables(resolved);
        const resolvedRecord = resolved as { id?: string };
        setThemeId(resolvedRecord?.id ?? nextThemeId);
      } catch (error) {
        appendError(`Theme application failed: ${(error as Error).message}`);
      }
    },
    [appendError, loadThemeModule]
  );

  useEffect(() => {
    ensureThemeApplied(DEFAULT_THEME_ID).catch(() => {
      /* handled via appendError */
    });
  }, [ensureThemeApplied]);

  const ensureIntegrationsLoaded = useCallback(async () => {
    if (integrationsLoadedRef.current) {
      return;
    }
    integrationsLoadedRef.current = true;

    try {
      const registryAdapter = masterServiceRegistry.toUnifiedRegistry();
      const loadPromises = [
        import('../services/unified/UnifiedAnalyticsService'),
        import('../services/unified/UnifiedBettingService'),
        import('../services/unified/UnifiedPredictionService'),
        import('../services/unified/UnifiedDataService'),
      ] as const;

      const results = await Promise.allSettled(loadPromises);

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const mod = result.value as Record<string, unknown>;

          const analytics = (mod.UnifiedAnalyticsService ?? mod.default) as
            | {
                getInstance?: (...args: unknown[]) => unknown;
              }
            | undefined;
          if (analytics?.getInstance) {
            try {
              analytics.getInstance(registryAdapter);
            } catch (error) {
              appendError(`Analytics integration failed: ${(error as Error).message}`);
            }
          }

          const betting = mod.UnifiedBettingService as
            | {
                getInstance?: () => unknown;
              }
            | undefined;
          if (betting?.getInstance) {
            try {
              betting.getInstance();
            } catch (error) {
              appendError(`Betting integration failed: ${(error as Error).message}`);
            }
          }

          const prediction = mod.UnifiedPredictionService as
            | {
                getInstance?: (...args: unknown[]) => unknown;
              }
            | undefined;
          if (prediction?.getInstance) {
            try {
              prediction.getInstance(registryAdapter);
            } catch (error) {
              appendError(`Prediction integration failed: ${(error as Error).message}`);
            }
          }

          const dataService = mod.UnifiedDataService as
            | {
                getInstance?: (...args: unknown[]) => unknown;
              }
            | undefined;
          if (dataService?.getInstance) {
            try {
              dataService.getInstance(registryAdapter);
            } catch (error) {
              appendError(`Data integration failed: ${(error as Error).message}`);
            }
          }
        }
      });
    } catch (error) {
      integrationsLoadedRef.current = false;
      appendError(`Integration load failure: ${(error as Error).message}`);
    }
  }, [appendError]);

  const captureSnapshots = useCallback(() => {
    const services = masterServiceRegistry.getAllServices();
    const serviceNames = Array.from(services.keys());

    const healthSnapshots = serviceNames
      .map(name => mapHealth(name, masterServiceRegistry.getServiceHealth(name)))
      .sort((a, b) => a.name.localeCompare(b.name));

    const metrics = monitorRef.current.getMetricsSnapshot();
    const systemStats = masterServiceRegistry.getSystemStatistics();
    const serviceMetrics = (masterServiceRegistry.getServiceMetrics() as ServiceMetrics[]) ?? [];

    setSnapshots({
      services: healthSnapshots,
      metrics,
      systemStats,
      serviceMetrics,
      activeSports: activeSportsSnapshot,
    });
  }, []);

  const refresh = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) {
        setLoading(true);
      }
      const refreshStart = typeof performance !== 'undefined' ? performance.now() : Date.now();

      try {
        await masterServiceRegistry.initialize();
        await ensureIntegrationsLoaded();
        captureSnapshots();
        setLastUpdated(Date.now());

        monitorRef.current.recordMetric('master_integration_refresh_success', 1, {
          type: 'counter',
        });
      } catch (error) {
        const message = `Refresh error: ${(error as Error).message}`;
        appendError(message);
        monitorRef.current.recordMetric('master_integration_refresh_failure', 1, {
          type: 'counter',
          labels: { reason: (error as Error).name ?? 'unknown' },
        });
      } finally {
        const duration =
          (typeof performance !== 'undefined' ? performance.now() : Date.now()) - refreshStart;
        monitorRef.current.recordMetric('master_integration_refresh_duration_ms', duration, {
          type: 'gauge',
        });

        if (!silent) {
          setLoading(false);
        }
      }
    },
    [appendError, captureSnapshots, ensureIntegrationsLoaded]
  );

  const syncAllSystems = useCallback(async () => {
    const syncStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
    try {
      await ensureIntegrationsLoaded();
      await masterServiceRegistry.refreshAllData();
      monitorRef.current.recordMetric('master_integration_sync_success', 1, { type: 'counter' });
      await refresh({ silent: true });
    } catch (error) {
      appendError(`Sync error: ${(error as Error).message}`);
      monitorRef.current.recordMetric('master_integration_sync_failure', 1, {
        type: 'counter',
        labels: { reason: (error as Error).name ?? 'unknown' },
      });
      throw error;
    } finally {
      const duration =
        (typeof performance !== 'undefined' ? performance.now() : Date.now()) - syncStart;
      monitorRef.current.recordMetric('master_integration_sync_duration_ms', duration, {
        type: 'gauge',
      });
    }
  }, [appendError, ensureIntegrationsLoaded, refresh]);

  const recordCustomMetric = useCallback(
    (name: string, value: number, status?: HealthStatus) => {
      monitorRef.current.recordMetric(name, value, {
        type: 'gauge',
        labels: status ? { status } : undefined,
      });
      captureSnapshots();
    },
    [captureSnapshots]
  );

  useEffect(() => {
    let cancelled = false;
    const scheduleRefresh = () => {
      if (cancelled) return;
      refresh({ silent: true }).catch(() => {
        /* errors captured via appendError */
      });
    };

    refresh().catch(() => {
      /* handled */
    });

    if (pollingIntervalMs > 0) {
      const intervalId = window.setInterval(scheduleRefresh, pollingIntervalMs);
      return () => {
        cancelled = true;
        window.clearInterval(intervalId);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [pollingIntervalMs, refresh]);

  const contextValue = useMemo<MasterIntegrationContextValue>(
    () => ({
      ...snapshots,
      loading,
      errors,
      lastUpdated,
      themeId,
      setTheme: ensureThemeApplied,
      refresh,
      syncAllSystems,
      recordCustomMetric,
    }),
    [
      ensureThemeApplied,
      errors,
      lastUpdated,
      loading,
      recordCustomMetric,
      refresh,
      snapshots,
      syncAllSystems,
      themeId,
    ]
  );

  return (
    <MasterIntegrationContext.Provider value={contextValue}>
      {children}
    </MasterIntegrationContext.Provider>
  );
};

export default MasterIntegrationProvider;
