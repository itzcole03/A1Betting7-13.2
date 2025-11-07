import { useEffect, useCallback, useMemo, useRef } from 'react';
import PerformanceOptimizationService, { PerformanceMetrics, OptimizationConfig } from '../services/performance/PerformanceOptimizationService';

interface UsePerformanceOptimizationOptions {
  componentName?: string;
  enableTracking?: boolean;
  enableCaching?: boolean;
  enableVirtualization?: boolean;
  trackRenderTime?: boolean;
}

interface PerformanceHookReturn {
  metrics: PerformanceMetrics;
  config: OptimizationConfig;
  trackRender: () => () => void;
  debounce: <T extends (...args: any[]) => any>(func: T, delay?: number) => (...args: Parameters<T>) => void;
  throttle: <T extends (...args: any[]) => any>(func: T, limit?: number) => (...args: Parameters<T>) => void;
  setCache: <T>(key: string, data: T, size?: number) => void;
  getCache: <T>(key: string) => T | null;
  shouldUseVirtualization: (itemCount: number) => boolean;
  batchProcess: <T, R>(items: T[], processor: (batch: T[]) => Promise<R[]>, batchSize?: number) => Promise<R[]>;
  prefetchResource: (url: string, type?: 'script' | 'style' | 'image') => void;
  generateReport: () => any;
}

export const usePerformanceOptimization = (
  options: UsePerformanceOptimizationOptions = {}
): PerformanceHookReturn => {
  const {
    componentName = 'UnknownComponent',
    enableTracking = true,
    enableCaching = true,
    enableVirtualization = true,
    trackRenderTime = true,
  } = options;

  const serviceRef = useRef(PerformanceOptimizationService.getInstance());
  const renderTimeRef = useRef<number>(0);

  // Track component mount/unmount
  useEffect(() => {
    if (!enableTracking) return;

    const service = serviceRef.current;
    
    // Track component mount
    if (trackRenderTime) {
      service.trackRenderStart(`${componentName}_mount`);
      renderTimeRef.current = performance.now();
    }

    return () => {
      // Track component unmount
      if (trackRenderTime) {
        service.trackRenderEnd(`${componentName}_mount`);
      }
    };
  }, [componentName, enableTracking, trackRenderTime]);

  // Memoized performance utilities
  const trackRender = useCallback(() => {
    if (!trackRenderTime) return () => {};
    
    const service = serviceRef.current;
    service.trackRenderStart(`${componentName}_render`);
    
    return () => {
      service.trackRenderEnd(`${componentName}_render`);
    };
  }, [componentName, trackRenderTime]);

  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay?: number
  ) => {
    return serviceRef.current.debounce(func, delay);
  }, []);

  const throttle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    limit?: number
  ) => {
    return serviceRef.current.throttle(func, limit);
  }, []);

  const setCache = useCallback(<T>(key: string, data: T, size?: number) => {
    if (!enableCaching) return;
    serviceRef.current.setCache(key, data, size);
  }, [enableCaching]);

  const getCache = useCallback(<T>(key: string): T | null => {
    if (!enableCaching) return null;
    return serviceRef.current.getCache<T>(key);
  }, [enableCaching]);

  const shouldUseVirtualization = useCallback((itemCount: number): boolean => {
    if (!enableVirtualization) return false;
    return serviceRef.current.shouldUseVirtualization(itemCount);
  }, [enableVirtualization]);

  const batchProcess = useCallback(<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    batchSize?: number
  ): Promise<R[]> => {
    return serviceRef.current.batchProcess(items, processor, batchSize);
  }, []);

  const prefetchResource = useCallback((
    url: string,
    type: 'script' | 'style' | 'image' = 'script'
  ) => {
    serviceRef.current.prefetchResource(url, type);
  }, []);

  const generateReport = useCallback(() => {
    return serviceRef.current.generatePerformanceReport();
  }, []);

  // Memoized metrics and config
  const metrics = useMemo(() => {
    return serviceRef.current.getMetrics();
  }, []);

  const config = useMemo(() => {
    return serviceRef.current.getConfig();
  }, []);

  return {
    metrics,
    config,
    trackRender,
    debounce,
    throttle,
    setCache,
    getCache,
    shouldUseVirtualization,
    batchProcess,
    prefetchResource,
    generateReport,
  };
};

export default usePerformanceOptimization;
