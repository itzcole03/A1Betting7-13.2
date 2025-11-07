export declare class PerformanceMonitor {
  private static instance;
  private constructor();
  static getInstance(): PerformanceMonitor;
  startTrace(label: string): string;
  endTrace(traceId: string, error?: Error): void;
}
export declare function measurePerformance(_fn: () => Promise<void>, label: string): Promise<void>;
