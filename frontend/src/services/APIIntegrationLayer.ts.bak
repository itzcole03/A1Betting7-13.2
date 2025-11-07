/**
 * API Integration Layer - Post-Phase 5 Migration
 * 
 * This service layer bridges existing frontend services with the consolidated API.
 * It provides compatibility adapters while migrating to the new consolidated endpoints.
 * 
 * Migration Strategy:
 * 1. Maintain existing service interfaces for backward compatibility
 * 2. Route calls to consolidated API client
 * 3. Transform responses to match expected formats
 * 4. Gradually deprecate legacy service methods
 */

import { 
  consolidatedAPIClient,
  type PrizePicksProps, 
  type MLPrediction, 
  type AdminHealthStatus,
  type AdminMetrics,
  type UserProfile,
  type AuthResponse,
} from './ConsolidatedAPIClient';

// Legacy types for backward compatibility
interface LegacyPropData {
  id?: string;
  player?: string;
  stat?: string;
  line?: number;
  odds?: number;
  confidence?: number;
  source?: string;
}

interface LegacyMLResponse {
  predictions?: MLPrediction[];
  confidence?: number;
  model_version?: string;
}

/**
 * PrizePicks Service Integration
 * Bridges existing PrizePicks service calls with consolidated API
 */
export class PrizePicksServiceIntegration {
  private static instance: PrizePicksServiceIntegration;

  public static getInstance(): PrizePicksServiceIntegration {
    if (!PrizePicksServiceIntegration.instance) {
      PrizePicksServiceIntegration.instance = new PrizePicksServiceIntegration();
    }
    return PrizePicksServiceIntegration.instance;
  }

  /**
   * Get props using consolidated API with legacy format conversion
   */
  async getProps(sport: string = 'MLB'): Promise<LegacyPropData[]> {
    try {
      const consolidatedProps = await consolidatedAPIClient.getPrizePicksProps(sport);
      
      // Transform to legacy format for existing components
      return consolidatedProps.map((prop: PrizePicksProps): LegacyPropData => ({
        id: prop.id,
        player: prop.player_name,
        stat: prop.stat_type,
        line: prop.line,
        odds: prop.odds,
        confidence: prop.confidence,
        source: prop.source,
      }));
    } catch {
      // Fallback to empty array for graceful degradation
      return [];
    }
  }

  /**
   * Enhanced props service using new consolidated API
   */
  async getEnhancedProps(sport: string = 'MLB'): Promise<PrizePicksProps[]> {
    return consolidatedAPIClient.getPrizePicksProps(sport);
  }

  /**
   * Optimize lineup with enhanced features
   */
  async optimizeLineup(propIds: string[], constraints?: {
    maxSalary?: number;
    riskTolerance?: 'low' | 'medium' | 'high';
  }) {
    const lineupConstraints = {
      max_salary: constraints?.maxSalary,
      risk_tolerance: constraints?.riskTolerance,
    };

    return consolidatedAPIClient.optimizeLineup(propIds, lineupConstraints);
  }
}

/**
 * ML Service Integration
 * Provides machine learning predictions using consolidated API
 */
export class MLServiceIntegration {
  private static instance: MLServiceIntegration;

  public static getInstance(): MLServiceIntegration {
    if (!MLServiceIntegration.instance) {
      MLServiceIntegration.instance = new MLServiceIntegration();
    }
    return MLServiceIntegration.instance;
  }

  /**
   * Get ML predictions with legacy format support
   */
  async getPredictions(sport: string, gameIds?: string[]): Promise<LegacyMLResponse> {
    try {
      const predictions = await consolidatedAPIClient.getMLPredictions(sport, gameIds);
      
      // Transform to legacy format
      return {
        predictions,
        confidence: predictions.length > 0 ? predictions[0].confidence : 0,
        model_version: predictions.length > 0 ? predictions[0].model_version : 'unknown',
      };
    } catch {
      return { predictions: [], confidence: 0, model_version: 'error' };
    }
  }

  /**
   * Enhanced predictions using new consolidated API
   */
  async getEnhancedPredictions(sport: string, gameIds?: string[]): Promise<MLPrediction[]> {
    return consolidatedAPIClient.getMLPredictions(sport, gameIds);
  }

  /**
   * Batch predictions for performance optimization
   */
  async getBatchPredictions(requests: {
    sport: string;
    player_id: string;
    stat_type: string;
  }[]): Promise<MLPrediction[]> {
    return consolidatedAPIClient.getBatchMLPredictions(requests);
  }
}

/**
 * Admin Service Integration
 * Provides admin functionality using consolidated API
 */
export class AdminServiceIntegration {
  private static instance: AdminServiceIntegration;

  public static getInstance(): AdminServiceIntegration {
    if (!AdminServiceIntegration.instance) {
      AdminServiceIntegration.instance = new AdminServiceIntegration();
    }
    return AdminServiceIntegration.instance;
  }

  /**
   * Get system health status
   */
  async getHealthStatus(): Promise<AdminHealthStatus> {
    return consolidatedAPIClient.getAdminHealthStatus();
  }

  /**
   * Get admin dashboard metrics
   */
  async getMetrics(): Promise<AdminMetrics> {
    return consolidatedAPIClient.getAdminMetrics();
  }

  /**
   * Authenticate user
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    return consolidatedAPIClient.login(email, password);
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<UserProfile> {
    return consolidatedAPIClient.getCurrentUser();
  }
}

/**
 * Health Monitoring Integration
 * Tests connectivity across all consolidated API services
 */
export class HealthMonitoringIntegration {
  private static instance: HealthMonitoringIntegration;

  public static getInstance(): HealthMonitoringIntegration {
    if (!HealthMonitoringIntegration.instance) {
      HealthMonitoringIntegration.instance = new HealthMonitoringIntegration();
    }
    return HealthMonitoringIntegration.instance;
  }

  /**
   * Comprehensive connectivity test
   */
  async testAllServices(): Promise<{
    consolidated_api: {
      prizepicks: boolean;
      ml: boolean;
      admin: boolean;
      overall_health: boolean;
    };
    fallback_status: {
      can_fallback_to_legacy: boolean;
      legacy_endpoints_available: boolean;
    };
    performance_metrics: {
      response_time_ms: number;
      error_rate: number;
    };
  }> {
    const startTime = Date.now();

    try {
      // Test consolidated API connectivity
      const consolidatedResults = await consolidatedAPIClient.testConnectivity();
      
      // Test legacy endpoints for fallback capability
      const legacyResults = await this.testLegacyEndpoints();

      const responseTime = Date.now() - startTime;
      const totalTests = 4; // Number of services tested
      const failedTests = Object.values(consolidatedResults).filter(v => !v).length;
      const errorRate = (failedTests / totalTests) * 100;

      return {
        consolidated_api: consolidatedResults,
        fallback_status: {
          can_fallback_to_legacy: legacyResults.prizepicks || legacyResults.ml,
          legacy_endpoints_available: legacyResults.prizepicks && legacyResults.ml,
        },
        performance_metrics: {
          response_time_ms: responseTime,
          error_rate: errorRate,
        },
      };
    } catch {
      return {
        consolidated_api: {
          prizepicks: false,
          ml: false,
          admin: false,
          overall_health: false,
        },
        fallback_status: {
          can_fallback_to_legacy: false,
          legacy_endpoints_available: false,
        },
        performance_metrics: {
          response_time_ms: Date.now() - startTime,
          error_rate: 100,
        },
      };
    }
  }

  /**
   * Test legacy endpoints for fallback capability
   */
  private async testLegacyEndpoints(): Promise<{
    prizepicks: boolean;
    ml: boolean;
  }> {
    const results = { prizepicks: false, ml: false };

    try {
      // Test legacy PrizePicks endpoint
      const response = await fetch('/api/prizepicks/props');
      results.prizepicks = response.ok;
    } catch {
      // Legacy PrizePicks not available
    }

    try {
      // Test legacy ML endpoint
      const response = await fetch('/api/ml/predictions');
      results.ml = response.ok;
    } catch {
      // Legacy ML not available
    }

    return results;
  }
}

/**
 * Migration Progress Tracker
 * Tracks the progress of migrating services to consolidated API
 */
export class MigrationProgressTracker {
  private static instance: MigrationProgressTracker;
  private migrationStatus: Map<string, boolean> = new Map();

  public static getInstance(): MigrationProgressTracker {
    if (!MigrationProgressTracker.instance) {
      MigrationProgressTracker.instance = new MigrationProgressTracker();
    }
    return MigrationProgressTracker.instance;
  }

  /**
   * Mark a service as migrated to consolidated API
   */
  markAsMigrated(serviceName: string): void {
    this.migrationStatus.set(serviceName, true);
  }

  /**
   * Check if a service has been migrated
   */
  isMigrated(serviceName: string): boolean {
    return this.migrationStatus.get(serviceName) || false;
  }

  /**
   * Get overall migration progress
   */
  getMigrationProgress(): {
    total_services: number;
    migrated_services: number;
    progress_percentage: number;
    remaining_services: string[];
  } {
    const allServices = [
      'PrizePicksService',
      'MLService', 
      'AdminService',
      'AuthService',
      'HealthService',
      'MetricsService',
    ];

    const migratedServices = allServices.filter(service => this.isMigrated(service));
    const remainingServices = allServices.filter(service => !this.isMigrated(service));

    return {
      total_services: allServices.length,
      migrated_services: migratedServices.length,
      progress_percentage: Math.round((migratedServices.length / allServices.length) * 100),
      remaining_services: remainingServices,
    };
  }
}

// Export service integrations for use in components
export const prizePicksIntegration = PrizePicksServiceIntegration.getInstance();
export const mlServiceIntegration = MLServiceIntegration.getInstance();
export const adminServiceIntegration = AdminServiceIntegration.getInstance();
export const healthMonitoringIntegration = HealthMonitoringIntegration.getInstance();
export const migrationProgressTracker = MigrationProgressTracker.getInstance();
