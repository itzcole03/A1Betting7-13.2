import { useQuery } from '@tanstack/react-query';
import unifiedApiService from '../services/unifiedApiService';

export function usePortfolioOptimization(
  params: {
    sport?: string;
    min_confidence?: number;
    max_positions?: number;
  } = {}
) {
  return useQuery({
    queryKey: ['portfolioOptimization', params],
    queryFn: () => unifiedApiService.getPortfolioOptimization(params),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
