/**
 * TypeScript interfaces for diagnostics system
 * Aligned with backend /api/v2/diagnostics/* endpoints
 */

export interface ServiceStatus {
  name: string;
  status: 'ok' | 'degraded' | 'down';
  latency_ms?: number;
  details?: Record<string, unknown>;
}

export interface PerformanceMetrics {
  cpu_percent?: number;
  memory_usage_mb?: number;
  p95_latency_ms?: number;
  cache_hit_rate?: number;
  active_connections?: number;
  requests_per_minute?: number;
}

export interface CacheMetrics {
  hit_rate?: number;
  miss_rate?: number;
  evictions?: number;
  total_keys?: number;
  memory_usage?: number;
}

export interface InfrastructureStatus {
  database?: ServiceStatus;
  cache?: ServiceStatus & { hit_rate_percent?: number };
  external_apis?: ServiceStatus[];
  active_edges?: number;
}

export interface HealthData {
  overall_status: 'ok' | 'degraded' | 'down';
  services: ServiceStatus[];
  performance: PerformanceMetrics;
  cache: CacheMetrics;
  infrastructure: InfrastructureStatus;
  timestamp: string;
  uptime_seconds?: number;
  version?: string;
  // Allow additional unknown fields for backward compatibility
  [key: string]: unknown;
}

export interface Anomaly {
  code: string;
  severity: 'info' | 'warning' | 'critical';
  message?: string;
  context?: Record<string, unknown>;
  timestamp?: string;
  category?: string;
}

export interface MetricTrend {
  metric: string;
  current_value: number;
  trend: 'improving' | 'stable' | 'degrading';
  change_percent: number;
}

export interface ReliabilityReport {
  overall_status: 'ok' | 'degraded' | 'down';
  anomalies: Anomaly[];
  timestamp: string;
  metric_trends?: MetricTrend[];
  prediction_accuracy?: number;
  system_stability?: number;
  data_quality_score?: number;
  traces?: unknown[]; // Optional detailed traces
  // Allow additional unknown fields for extensibility
  [key: string]: unknown;
}

// Store state interfaces
export interface HealthStoreState {
  health: HealthData | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

export interface ReliabilityStoreState {
  report: ReliabilityReport | null;
  loading: boolean;
  error: string | null;
  anomalies: Anomaly[];
  lastFetched: number | null;
}

// Validated response types
export interface ValidatedHealthPayload extends HealthData {
  __validated: true;
}

export interface ValidatedReliabilityPayload extends ReliabilityReport {
  __validated: true;
}

// Error types
export interface DiagnosticsError extends Error {
  code: 'HEALTH_SHAPE_MISMATCH' | 'RELIABILITY_FETCH_FAILED' | 'DIAGNOSTICS_UNAVAILABLE';
  context?: Record<string, unknown>;
}