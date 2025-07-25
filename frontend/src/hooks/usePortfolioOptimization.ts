import { useQuery } from '@tanstack/react-query';
import { createUnifiedApiService } from '../services/unifiedApiService';

export function usePortfolioOptimization(
  _params: {
    sport?: string;
    min_confidence?: number;
    max_positions?: number;
  } = {}
) {
  return useQuery({
    queryKey: ['portfolioOptimization', _params],
    queryFn: () => createUnifiedApiService().getPortfolioOptimization(_params),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
