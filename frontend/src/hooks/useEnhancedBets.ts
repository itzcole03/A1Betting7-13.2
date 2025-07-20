import { useQuery } from '@tanstack/react-query';
import unifiedApiService from '../services/unifiedApiService';

export function useEnhancedBets(
  params: {
    sport?: string;
    min_confidence?: number;
    include_ai_insights?: boolean;
    include_portfolio_optimization?: boolean;
    max_results?: number;
  } = {}
) {
  return useQuery({
    queryKey: ['enhancedBets', params],
    queryFn: () => unifiedApiService.getEnhancedBets(params),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
