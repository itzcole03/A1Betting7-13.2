// Performance monitoring utility for Jest/RTL;

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public startTrace(label: string): string {
    // In a real app, you would generate a trace ID and start timing;
    return `${label}-${Date.now()}`;
  }

  public endTrace(traceId: string, error?: Error): void {
    // In a real app, you would end timing and log/report;
    if (error) {
      // Optionally log error;
    }
  }
}

export async function measurePerformance(fn: () => Promise<void>, label: string) {
  await fn();
  // Log or report;
  // if (duration > 2000) {
  //   throw new Error(`[PERF] ${label} exceeded 2s: ${safeNumber(duration, 2)}ms`)
  // }
}
