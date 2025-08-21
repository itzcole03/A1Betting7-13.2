import React, { useEffect, useState, useMemo } from 'react';
import { reliabilityMonitoringOrchestrator } from '../../services/reliabilityMonitoringOrchestrator';
import type { ReliabilityReport } from '../../services/reliabilityMonitoringOrchestrator';
import { enhancedLogger } from '../../utils/enhancedLogger';

interface ReliabilityIntegrationWrapperProps {
  children: React.ReactNode;
  enableMonitoring?: boolean;
  monitoringLevel?: 'minimal' | 'standard' | 'comprehensive';
  onCriticalIssue?: (issue: string) => void;
}

type MonitoringConfig = {
  checkInterval: number;
  enablePerformanceTracking?: boolean;
  enableDataPipelineMonitoring?: boolean;
  enableServiceHealthChecks?: boolean;
  enableAutoRecovery?: boolean;
  enableTrendAnalysis?: boolean;
  enablePredictiveAlerts?: boolean;
};

/**
 * Non-intrusive wrapper that integrates reliability monitoring without
 * affecting core application functionality. Operates silently in the background.
 */
export const ReliabilityIntegrationWrapper: React.FC<ReliabilityIntegrationWrapperProps> = ({
  children,
  enableMonitoring = true,
  monitoringLevel = 'standard',
  onCriticalIssue
}) => {
  const [reliabilityReport, setReliabilityReport] = useState<ReliabilityReport | null>(null);
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);

  // Configuration based on monitoring level
  const monitoringConfig = useMemo(() => ({
    minimal: {
      checkInterval: 30000, // 30 seconds
      enablePerformanceTracking: false,
      enableDataPipelineMonitoring: false,
      enableServiceHealthChecks: true,
      enableAutoRecovery: false
    },
    standard: {
      checkInterval: 15000, // 15 seconds
      enablePerformanceTracking: true,
      enableDataPipelineMonitoring: true,
      enableServiceHealthChecks: true,
      enableAutoRecovery: true
    },
    comprehensive: {
      checkInterval: 5000, // 5 seconds
      enablePerformanceTracking: true,
      enableDataPipelineMonitoring: true,
      enableServiceHealthChecks: true,
      enableAutoRecovery: true,
      enableTrendAnalysis: true,
      enablePredictiveAlerts: true
    }
  }), []);

  const currentConfig = monitoringConfig[monitoringLevel];

  // Initialize monitoring without blocking main thread
  useEffect(() => {
    if (!enableMonitoring) return;

    // Stabilization: Check for lean mode
    const devLeanMode = localStorage.getItem('DEV_LEAN_MODE') === 'true' || 
                        new URLSearchParams(window.location.search).get('lean') === 'true';
    
    if (devLeanMode) {
      enhancedLogger.info('ReliabilityIntegration', 'initialize', 'Lean mode enabled - monitoring disabled');
      return;
    }

    let monitoringInterval: NodeJS.Timeout;
    let isComponentMounted = true;

    const initializeMonitoring = async () => {
      try {
        // Initialize orchestrator silently. If the orchestrator expects no args, fall back to that.
        if (typeof reliabilityMonitoringOrchestrator.initialize === 'function') {
              try {
                const initConfig: MonitoringConfig = {
                  checkInterval: (currentConfig as MonitoringConfig).checkInterval,
                  enablePerformanceTracking: (currentConfig as MonitoringConfig).enablePerformanceTracking,
                  enableDataPipelineMonitoring: (currentConfig as MonitoringConfig).enableDataPipelineMonitoring,
                  enableServiceHealthChecks: (currentConfig as MonitoringConfig).enableServiceHealthChecks,
                  enableAutoRecovery: (currentConfig as MonitoringConfig).enableAutoRecovery,
                  enableTrendAnalysis: (currentConfig as MonitoringConfig).enableTrendAnalysis || false,
                  enablePredictiveAlerts: (currentConfig as MonitoringConfig).enablePredictiveAlerts || false,
                };

                // Try to initialize with a typed config, fallback to no-arg call
                try {
                  // Try calling initialize with the typed config. If it fails, try a no-arg call.
                  await (reliabilityMonitoringOrchestrator.initialize as unknown as (...args: unknown[]) => Promise<unknown>)(initConfig as unknown);
                } catch {
                  try {
                    await (reliabilityMonitoringOrchestrator.initialize as unknown as () => Promise<unknown>)();
                  } catch (e2) {
                    enhancedLogger.warn('ReliabilityIntegration', 'initialize', 'Orchestrator initialize fallback failed', undefined, e2 as Error);
                  }
                }
              } catch (_) {
                // Fallback handled above - continue
              }
        }

        if (isComponentMounted) {
          setIsMonitoringActive(true);
        }

        // Start non-blocking monitoring cycle
        monitoringInterval = setInterval(async () => {
          if (!isComponentMounted) return;

          try {
            // Generate report if the orchestrator exposes the method, otherwise skip
            const generateFn = (reliabilityMonitoringOrchestrator as unknown as Record<string, unknown>)?.generateReport as
              | undefined
              | ((...args: unknown[]) => Promise<unknown>);
            const report = typeof generateFn === 'function' ? await generateFn.call(reliabilityMonitoringOrchestrator) : null;

            if (isComponentMounted) {
              // store as any to avoid strict shape coupling during incremental typing fixes
              setReliabilityReport(report as unknown as ReliabilityReport | null);

              // Handle critical issues without disrupting user experience
              const rawHealth = (report as unknown as Record<string, unknown>)?.overallHealth;
              const overallHealth = typeof rawHealth === 'string' ? rawHealth.toUpperCase() : undefined;

              if (overallHealth === 'CRITICAL' && onCriticalIssue) {
                const alerts = (report as unknown as Record<string, unknown>)?.alerts as Array<Record<string, unknown>> | undefined;
                const alertMsg = (alerts && alerts[0] && (alerts[0].message as string)) || 'Unknown issue';
                // Use requestIdleCallback to ensure non-blocking execution
                if ('requestIdleCallback' in window && typeof (window as unknown as Record<string, unknown>).requestIdleCallback === 'function') {
                  (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
                    onCriticalIssue(`Critical system health issue detected: ${alertMsg}`);
                  });
                } else {
                  // Fallback for browsers without requestIdleCallback
                  setTimeout(() => {
                    onCriticalIssue(`Critical system health issue detected: ${alertMsg}`);
                  }, 0);
                }
              }
            }
          } catch (error) {
            // Silent error handling - don't disrupt user experience
            enhancedLogger.warn('ReliabilityIntegration', 'monitoringCycle', 'Monitoring error (non-critical)', undefined, error as Error);
          }
        }, currentConfig.checkInterval);

      } catch (error) {
        // Silent initialization failure - continue without monitoring
        enhancedLogger.warn('ReliabilityIntegration', 'initialize', 'Failed to initialize monitoring (continuing without)', undefined, error as Error);
      }
    };

    // Use requestIdleCallback for non-blocking initialization
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(initializeMonitoring);
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(initializeMonitoring, 100);
    }

    return () => {
      isComponentMounted = false;
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, [enableMonitoring, monitoringLevel, currentConfig, onCriticalIssue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        reliabilityMonitoringOrchestrator.cleanup();
      } catch (error) {
        // Silent cleanup failure
        enhancedLogger.warn('ReliabilityIntegration', 'cleanup', 'Cleanup warning (non-critical)', undefined, error as Error);
      }
    };
  }, []);

  // Development-only: Log reliability status in console (non-intrusive)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && reliabilityReport) {
      const reportObj = reliabilityReport as unknown as Record<string, unknown>;
      const rawHealth = reportObj?.overallHealth;
      const overallHealth = typeof rawHealth === 'string' ? rawHealth.toString() : String(rawHealth);
      enhancedLogger.debug(
        'ReliabilityIntegration',
        'status',
        `Reliability Status: ${overallHealth}`,
        {
          performanceScore: typeof reportObj?.performanceMetrics === 'object'
            ? (reportObj?.performanceMetrics as Record<string, unknown>)['overallScore'] ?? 'N/A'
            : 'N/A',
          serviceHealth: typeof reportObj?.serviceHealth === 'object'
            ? (reportObj?.serviceHealth as Record<string, unknown>)['overallStatus'] ?? 'N/A'
            : 'N/A',
          activeAlerts: Array.isArray(reportObj?.alerts) ? (reportObj?.alerts as unknown[]).length : 0,
          autoRecoveryActions: Array.isArray(reportObj?.autoRecoveryActions) ? (reportObj?.autoRecoveryActions as unknown[]).length : 0,
        }
      );
    }
  }, [reliabilityReport]);

  // Render children without any visual modifications
  // Monitoring operates completely in the background
  return (
    <>
      {children}
      {/* Optional: Invisible monitoring indicator for development */}
      {process.env.NODE_ENV === 'development' && isMonitoringActive && (() => {
  const reportObj = reliabilityReport as unknown as Record<string, unknown> | null;
  const rawHealth = reportObj?.overallHealth;
  const normalized = typeof rawHealth === 'string' ? rawHealth.toUpperCase() : undefined;
        const backgroundColor = normalized === 'HEALTHY' ? '#10b981' :
                                normalized === 'WARNING' ? '#f59e0b' :
                                normalized === 'CRITICAL' ? '#ef4444' : '#6b7280';

        const title = `Reliability Monitoring: ${normalized || 'INITIALIZING'}`;

        return (
          <div
            style={{
              position: 'fixed',
              bottom: '10px',
              right: '10px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor,
              zIndex: 9999,
              opacity: 0.7,
              pointerEvents: 'none'
            }}
            title={title}
          />
        );
      })()}
    </>
  );
};

export default ReliabilityIntegrationWrapper;
