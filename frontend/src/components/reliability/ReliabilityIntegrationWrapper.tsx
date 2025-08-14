import React, { useEffect, useState, useMemo } from 'react';
import { reliabilityMonitoringOrchestrator } from '../../services/reliabilityMonitoringOrchestrator';
import type { ReliabilityReport } from '../../services/reliabilityMonitoringOrchestrator';

interface ReliabilityIntegrationWrapperProps {
  children: React.ReactNode;
  enableMonitoring?: boolean;
  monitoringLevel?: 'minimal' | 'standard' | 'comprehensive';
  onCriticalIssue?: (issue: string) => void;
}

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
      console.log('[ReliabilityIntegration] Lean mode enabled - monitoring disabled');
      return;
    }

    let monitoringInterval: NodeJS.Timeout;
    let isComponentMounted = true;

    const initializeMonitoring = async () => {
      try {
        // Initialize orchestrator silently
        await reliabilityMonitoringOrchestrator.initialize({
          performanceMonitoring: currentConfig.enablePerformanceTracking,
          dataPipelineMonitoring: currentConfig.enableDataPipelineMonitoring,
          serviceHealthMonitoring: currentConfig.enableServiceHealthChecks,
          autoRecovery: currentConfig.enableAutoRecovery,
          trendAnalysis: currentConfig.enableTrendAnalysis || false,
          predictiveAlerts: currentConfig.enablePredictiveAlerts || false
        });

        if (isComponentMounted) {
          setIsMonitoringActive(true);
        }

        // Start non-blocking monitoring cycle
        monitoringInterval = setInterval(async () => {
          if (!isComponentMounted) return;

          try {
            const report = await reliabilityMonitoringOrchestrator.generateReport();
            
            if (isComponentMounted) {
              setReliabilityReport(report);

              // Handle critical issues without disrupting user experience
              if (report.overallHealth === 'CRITICAL' && onCriticalIssue) {
                // Use requestIdleCallback to ensure non-blocking execution
                if ('requestIdleCallback' in window) {
                  window.requestIdleCallback(() => {
                    onCriticalIssue(`Critical system health issue detected: ${report.alerts?.[0]?.message || 'Unknown issue'}`);
                  });
                } else {
                  // Fallback for browsers without requestIdleCallback
                  setTimeout(() => {
                    onCriticalIssue(`Critical system health issue detected: ${report.alerts?.[0]?.message || 'Unknown issue'}`);
                  }, 0);
                }
              }
            }
          } catch (error) {
            // Silent error handling - don't disrupt user experience
            console.warn('[ReliabilityIntegration] Monitoring error (non-critical):', error);
          }
        }, currentConfig.checkInterval);

      } catch (error) {
        // Silent initialization failure - continue without monitoring
        console.warn('[ReliabilityIntegration] Failed to initialize monitoring (continuing without):', error);
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
        console.warn('[ReliabilityIntegration] Cleanup warning (non-critical):', error);
      }
    };
  }, []);

  // Development-only: Log reliability status in console (non-intrusive)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && reliabilityReport) {
      console.groupCollapsed(`🔧 Reliability Status: ${reliabilityReport.overallHealth}`);
      console.log('Performance Score:', reliabilityReport.performanceMetrics?.overallScore || 'N/A');
      console.log('Service Health:', reliabilityReport.serviceHealth?.overallStatus || 'N/A');
      console.log('Active Alerts:', reliabilityReport.alerts?.length || 0);
      console.log('Auto-Recovery Actions:', reliabilityReport.autoRecoveryActions?.length || 0);
      console.groupEnd();
    }
  }, [reliabilityReport]);

  // Render children without any visual modifications
  // Monitoring operates completely in the background
  return (
    <>
      {children}
      {/* Optional: Invisible monitoring indicator for development */}
      {process.env.NODE_ENV === 'development' && isMonitoringActive && (
        <div 
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: reliabilityReport?.overallHealth === 'HEALTHY' ? '#10b981' : 
                            reliabilityReport?.overallHealth === 'WARNING' ? '#f59e0b' :
                            reliabilityReport?.overallHealth === 'CRITICAL' ? '#ef4444' : '#6b7280',
            zIndex: 9999,
            opacity: 0.7,
            pointerEvents: 'none'
          }}
          title={`Reliability Monitoring: ${reliabilityReport?.overallHealth || 'INITIALIZING'}`}
        />
      )}
    </>
  );
};

export default ReliabilityIntegrationWrapper;
