export declare class UnifiedMetrics {
  private static instance;
  private metrics;
  private operations;
  private constructor();
  static getInstance(): UnifiedMetrics;
  startOperation(operationName: string): void;
  endOperation(operationName: string, error?: unknown): void;
  recordMetric(name: string, value: number): void;
  getMetrics(): Map<string, number>;
  resetMetrics(): void;
}
