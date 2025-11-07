import { logger } from '../utils/logger';

interface UseMonitoring { 
  logger: typeof logger;
  // Future: add metrics reporting functions here
  // reportMetric: (name: string, value: number, tags?: Record<string, string>) => void;
}

export const useMonitoring = (): UseMonitoring => {
  // In a real application, you might initialize monitoring tools here
  // For now, we just expose the logger

  return {
    logger,
    // reportMetric: (name, value, tags) => { /* implementation */ },
  };
}; 