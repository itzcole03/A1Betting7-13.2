/**
 * Reliability Monitoring Orchestrator
 * Coordinates all monitoring systems and implements iterative improvements
 * Based on A1Betting_App_Issues_Report(4).md recommendations
 */

import { logger } from '../utils/logger';
import DataPipelineStabilityMonitor from './dataPipelineStabilityMonitor';
import LiveDemoPerformanceMonitor, {
  DemoHealthReport,
  PerformanceMetrics,
} from './liveDemoPerformanceMonitor';

interface ReliabilityReport {
  timestamp: Date;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  performanceGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

  // Component Health Scores
  demoPerformance: {
    score: number;
    grade: string;
    issues: string[];
    recommendations: string[];
  };

  dataPipeline: {
    score: number;
    servicesHealthy: number;
    totalServices: number;
    criticalIssues: string[];
    degradedServices: string[];
  };

  // Reliability Metrics
  reliability: {
    uptime: number;
    errorRate: number;
    recoveryTime: number;
    userExperience: number;
  };

  // Continuous Improvement Insights
  improvements: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    automation: string[];
  };

  // Trend Analysis
  trends: {
    performance: 'improving' | 'stable' | 'declining';
    reliability: 'improving' | 'stable' | 'declining';
    userSatisfaction: 'improving' | 'stable' | 'declining';
  };
}

interface MonitoringConfiguration {
  performanceMonitoringInterval: number;
  dataPipelineCheckInterval: number;
  reliabilityReportInterval: number;
  alertThresholds: {
    performanceScore: number;
    errorRate: number;
    responseTime: number;
    serviceDowntime: number;
  };
  autoRecovery: boolean;
  continuousImprovement: boolean;
}

class ReliabilityMonitoringOrchestrator {
  /**
   * Compatibility: initialize monitoring (alias for startMonitoring)
   */
  async initialize(): Promise<void> {
    return this.startMonitoring();
  }

  /**
   * Compatibility: cleanup monitoring (alias for stopMonitoring)
   */
  cleanup(): void {
    this.stopMonitoring();
  }
  private static instance: ReliabilityMonitoringOrchestrator;
  private isActive = false;
  private config: MonitoringConfiguration;
  private reports: ReliabilityReport[] = [];
  private lastReport: ReliabilityReport | null = null;

  // Monitoring Components
  private performanceMonitor: LiveDemoPerformanceMonitor;
  private pipelineMonitor: DataPipelineStabilityMonitor;

  // Monitoring Intervals
  private performanceInterval: NodeJS.Timeout | null = null;
  private pipelineInterval: NodeJS.Timeout | null = null;
  private reportInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.performanceMonitor = LiveDemoPerformanceMonitor.getInstance();
    this.pipelineMonitor = DataPipelineStabilityMonitor.getInstance();

    // Default configuration optimized for transparency and reliability
    this.config = {
      performanceMonitoringInterval: 30000, // 30 seconds
      dataPipelineCheckInterval: 60000, // 1 minute
      reliabilityReportInterval: 300000, // 5 minutes
      alertThresholds: {
        performanceScore: 80, // Alert if below 80
        errorRate: 0.05, // Alert if above 5%
        responseTime: 3000, // Alert if above 3 seconds
        serviceDowntime: 30000, // Alert if service down for 30 seconds
      },
      autoRecovery: true,
      continuousImprovement: true,
    };
  }

  static getInstance(): ReliabilityMonitoringOrchestrator {
    if (!ReliabilityMonitoringOrchestrator.instance) {
      ReliabilityMonitoringOrchestrator.instance = new ReliabilityMonitoringOrchestrator();
    }
    return ReliabilityMonitoringOrchestrator.instance;
  }

  /**
   * Start comprehensive monitoring as recommended in Issues Report
   */
  async startMonitoring(): Promise<void> {
    if (this.isActive) {
      logger.warn('Reliability monitoring already active', undefined, 'ReliabilityOrchestrator');
      return;
    }

    this.isActive = true;
    logger.info(
      'Starting comprehensive reliability monitoring...',
      {
        config: this.config,
        timestamp: new Date().toISOString(),
      },
      'ReliabilityOrchestrator'
    );

    try {
      // Initialize performance monitoring
      await this.performanceMonitor.startMonitoring(this.config.performanceMonitoringInterval);

      // Initialize data pipeline monitoring
      await this.pipelineMonitor.startMonitoring(this.config.dataPipelineCheckInterval);

      // Set up periodic reliability reports
      this.reportInterval = setInterval(() => {
        this.generateReliabilityReport().catch(error => {
          logger.error(
            'Failed to generate reliability report',
            { error },
            'ReliabilityOrchestrator'
          );
        });
      }, this.config.reliabilityReportInterval);

      // Generate initial report
      await this.generateReliabilityReport();

      logger.info(
        'Comprehensive reliability monitoring started successfully',
        undefined,
        'ReliabilityOrchestrator'
      );
    } catch (error) {
      this.isActive = false;
      logger.error('Failed to start reliability monitoring', { error }, 'ReliabilityOrchestrator');
      throw error;
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isActive) return;

    this.isActive = false;

    // Stop component monitors
    this.performanceMonitor.stopMonitoring();
    this.pipelineMonitor.stopMonitoring();

    // Clear intervals
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }

    logger.info('Reliability monitoring stopped', undefined, 'ReliabilityOrchestrator');
  }

  /**
   * Generate comprehensive reliability report
   */
  private async generateReliabilityReport(): Promise<ReliabilityReport> {
    const timestamp = new Date();

    try {
      // Get performance health report
      const demoHealth = this.performanceMonitor.generateHealthReport();
      const pipelineHealth = this.pipelineMonitor.getHealthReport();

      // Calculate overall health metrics
      const performanceScore = demoHealth.overallScore;
      const pipelineScore = this.calculatePipelineScore(pipelineHealth);
      const overallScore = (performanceScore + pipelineScore) / 2;

      // Determine overall health status
      const overallHealth = this.determineOverallHealth(overallScore);
      const performanceGrade = this.calculatePerformanceGrade(overallScore);

      // Analyze trends
      const trends = this.analyzeTrends();

      // Generate improvement recommendations
      const improvements = this.generateImprovementRecommendations(demoHealth, pipelineHealth);

      const report: ReliabilityReport = {
        timestamp,
        overallHealth,
        performanceGrade,

        demoPerformance: {
          score: performanceScore,
          grade: demoHealth.performanceGrade,
          issues: demoHealth.criticalIssues,
          recommendations: demoHealth.recommendations,
        },

        dataPipeline: {
          score: pipelineScore,
          servicesHealthy: this.countHealthyServices(pipelineHealth),
          totalServices: Object.keys(pipelineHealth).length,
          criticalIssues: this.extractCriticalIssues(pipelineHealth),
          degradedServices: this.extractDegradedServices(pipelineHealth),
        },

        reliability: {
          uptime: this.calculateUptime(),
          errorRate: this.calculateErrorRate(demoHealth.metrics),
          recoveryTime: this.calculateRecoveryTime(),
          userExperience: this.calculateUserExperienceScore(demoHealth.metrics),
        },

        improvements,
        trends,
      };

      // Store report
      this.reports.push(report);
      this.lastReport = report;

      // Keep only last 100 reports for memory efficiency
      if (this.reports.length > 100) {
        this.reports = this.reports.slice(-100);
      }

      // Check for alerts
      await this.checkAlertsAndAutoRecover(report);

      // Log report summary
      logger.info(
        'Reliability report generated',
        {
          overallHealth,
          performanceGrade,
          overallScore,
          timestamp: timestamp.toISOString(),
        },
        'ReliabilityOrchestrator'
      );

      return report;
    } catch (error) {
      logger.error('Failed to generate reliability report', { error }, 'ReliabilityOrchestrator');
      throw error;
    }
  }

  /**
   * Calculate pipeline health score
   */
  private calculatePipelineScore(healthReport: Record<string, any>): number {
    const services = Object.values(healthReport);
    if (services.length === 0) return 0;

    let totalScore = 0;
    services.forEach((service: any) => {
      if (service.status === 'healthy') totalScore += 100;
      else if (service.status === 'degraded') totalScore += 60;
      else totalScore += 0;
    });

    return totalScore / services.length;
  }

  /**
   * Determine overall health status
   */
  private determineOverallHealth(
    score: number
  ): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (score >= 95) return 'excellent';
    if (score >= 85) return 'good';
    if (score >= 70) return 'fair';
    if (score >= 50) return 'poor';
    return 'critical';
  }

  /**
   * Calculate performance grade
   */
  private calculatePerformanceGrade(score: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 97) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 85) return 'B';
    if (score >= 75) return 'C';
    if (score >= 65) return 'D';
    return 'F';
  }

  /**
   * Analyze trends for continuous improvement
   */
  private analyzeTrends(): ReliabilityReport['trends'] {
    if (this.reports.length < 3) {
      return {
        performance: 'stable',
        reliability: 'stable',
        userSatisfaction: 'stable',
      };
    }

    const recent = this.reports.slice(-3);
    const older = this.reports.slice(-6, -3);

    if (older.length === 0) {
      return {
        performance: 'stable',
        reliability: 'stable',
        userSatisfaction: 'stable',
      };
    }

    const recentAvgPerf =
      recent.reduce((sum, r) => sum + r.demoPerformance.score, 0) / recent.length;
    const olderAvgPerf = older.reduce((sum, r) => sum + r.demoPerformance.score, 0) / older.length;

    const perfTrend =
      recentAvgPerf > olderAvgPerf + 2
        ? 'improving'
        : recentAvgPerf < olderAvgPerf - 2
        ? 'declining'
        : 'stable';

    return {
      performance: perfTrend,
      reliability: perfTrend, // Simplified for now
      userSatisfaction: perfTrend, // Simplified for now
    };
  }

  /**
   * Generate improvement recommendations based on current state
   */
  private generateImprovementRecommendations(
    demoHealth: DemoHealthReport,
    pipelineHealth: Record<string, any>
  ): ReliabilityReport['improvements'] {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];
    const automation: string[] = [];

    // Performance-based recommendations
    if (demoHealth.overallScore < 80) {
      immediate.push('Investigate performance degradation immediately');
      immediate.push('Check for memory leaks and optimize critical rendering paths');
    }

    if (demoHealth.metrics.pageLoadTime > 3000) {
      shortTerm.push('Implement code splitting and lazy loading');
      shortTerm.push('Optimize bundle size and reduce JavaScript payload');
    }

    // Pipeline-based recommendations
    const unhealthyServices = Object.values(pipelineHealth).filter(
      (s: any) => s.status !== 'healthy'
    );
    if (unhealthyServices.length > 0) {
      immediate.push(`Address ${unhealthyServices.length} unhealthy service(s)`);
      automation.push('Implement automated service recovery mechanisms');
    }

    // Proactive improvements
    longTerm.push('Implement predictive analytics for proactive issue detection');
    longTerm.push('Enhance error recovery mechanisms with circuit breakers');
    longTerm.push('Develop automated performance optimization');

    automation.push('Set up automated alerting for critical thresholds');
    automation.push('Implement self-healing infrastructure components');

    return { immediate, shortTerm, longTerm, automation };
  }

  /**
   * Check alerts and implement auto-recovery
   */
  private async checkAlertsAndAutoRecover(report: ReliabilityReport): Promise<void> {
    const alerts: string[] = [];

    // Performance alerts
    if (report.demoPerformance.score < this.config.alertThresholds.performanceScore) {
      alerts.push(`Performance score below threshold: ${report.demoPerformance.score}`);
    }

    // Error rate alerts
    if (report.reliability.errorRate > this.config.alertThresholds.errorRate) {
      alerts.push(
        `Error rate above threshold: ${(report.reliability.errorRate * 100).toFixed(2)}%`
      );
    }

    // Service health alerts
    if (report.dataPipeline.criticalIssues.length > 0) {
      alerts.push(
        `Critical data pipeline issues: ${report.dataPipeline.criticalIssues.join(', ')}`
      );
    }

    // Log alerts
    if (alerts.length > 0) {
      logger.warn(
        'Reliability alerts triggered',
        {
          alerts,
          report: {
            overallHealth: report.overallHealth,
            performanceGrade: report.performanceGrade,
            timestamp: report.timestamp,
          },
        },
        'ReliabilityOrchestrator'
      );

      // Auto-recovery if enabled
      if (this.config.autoRecovery) {
        await this.attemptAutoRecovery(report, alerts);
      }
    }
  }

  /**
   * Attempt automatic recovery for common issues
   */
  private async attemptAutoRecovery(report: ReliabilityReport, alerts: string[]): Promise<void> {
    logger.info('Attempting automatic recovery', { alerts }, 'ReliabilityOrchestrator');

    // Clear browser cache if performance is degraded
    if (report.demoPerformance.score < 70) {
      try {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
        }
        logger.info(
          'Cleared service worker cache for performance recovery',
          undefined,
          'ReliabilityOrchestrator'
        );
      } catch (error) {
        logger.warn('Failed to clear service worker cache', { error }, 'ReliabilityOrchestrator');
      }
    }

    // Restart monitoring components if they're degraded
    if (report.dataPipeline.degradedServices.length > 0) {
      try {
        this.pipelineMonitor.stopMonitoring();
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.pipelineMonitor.startMonitoring(this.config.dataPipelineCheckInterval);
        logger.info(
          'Restarted pipeline monitoring for recovery',
          undefined,
          'ReliabilityOrchestrator'
        );
      } catch (error) {
        logger.error('Failed to restart pipeline monitoring', { error }, 'ReliabilityOrchestrator');
      }
    }
  }

  // Helper methods
  private countHealthyServices(healthReport: Record<string, any>): number {
    return Object.values(healthReport).filter((s: any) => s.status === 'healthy').length;
  }

  private extractCriticalIssues(healthReport: Record<string, any>): string[] {
    const issues: string[] = [];
    Object.entries(healthReport).forEach(([service, health]: [string, any]) => {
      if (health.status === 'unhealthy') {
        issues.push(`${service}: ${health.errors?.join(', ') || 'Service unhealthy'}`);
      }
    });
    return issues;
  }

  private extractDegradedServices(healthReport: Record<string, any>): string[] {
    return Object.entries(healthReport)
      .filter(([_, health]: [string, any]) => health.status === 'degraded')
      .map(([service, _]) => service);
  }

  private calculateUptime(): number {
    // Simplified uptime calculation - in production would track actual downtime
    if (this.reports.length === 0) return 100;

    const healthyReports = this.reports.filter(r => r.overallHealth !== 'critical').length;
    return (healthyReports / this.reports.length) * 100;
  }

  private calculateErrorRate(metrics: PerformanceMetrics): number {
    const totalInteractions = Math.max(metrics.userInteractions, 1);
    return metrics.errorCount / totalInteractions;
  }

  private calculateRecoveryTime(): number {
    // Simplified - would track actual recovery times in production
    return 30; // Average 30 seconds recovery time
  }

  private calculateUserExperienceScore(metrics: PerformanceMetrics): number {
    let score = 100;

    // Penalize based on performance metrics
    if (metrics.pageLoadTime > 3000) score -= 20;
    if (metrics.firstContentfulPaint > 1800) score -= 15;
    if (metrics.cumulativeLayoutShift > 0.1) score -= 25;
    if (metrics.errorCount > 0) score -= metrics.errorCount * 10;

    return Math.max(0, score);
  }

  // Public API
  getLatestReport(): ReliabilityReport | null {
    return this.lastReport;
  }

  getReportsHistory(): ReliabilityReport[] {
    return [...this.reports];
  }

  isMonitoringActive(): boolean {
    return this.isActive;
  }

  updateConfiguration(newConfig: Partial<MonitoringConfiguration>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info(
      'Reliability monitoring configuration updated',
      { config: this.config },
      'ReliabilityOrchestrator'
    );
  }
}

// Export singleton instance for easy importing
export const reliabilityMonitoringOrchestrator = ReliabilityMonitoringOrchestrator.getInstance();

export default ReliabilityMonitoringOrchestrator;
export type { MonitoringConfiguration, ReliabilityReport };
