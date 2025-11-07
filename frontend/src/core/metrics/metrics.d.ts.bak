import type {
  UnifiedMetrics as MetricsContract,
  MetricsSnapshot,
  PrometheusExportOptions,
} from './types';

export interface MetricsController extends MetricsContract {
  exportPrometheus(options?: PrometheusExportOptions): string;
}

export declare function getMetrics(): MetricsController;
export declare function getSnapshot(): MetricsSnapshot;
export declare function reset(): void;
export declare function exportPrometheus(options?: PrometheusExportOptions): string;

export type { MetricsSnapshot, PrometheusExportOptions } from './types';

export default getMetrics;
