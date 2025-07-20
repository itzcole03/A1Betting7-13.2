import { useQuery } from '@tanstack/react-query';
import unifiedApiService from '../services/unifiedApiService';

export function useAIInsights(params: { sport?: string; min_confidence?: number } = {}) {
  return useQuery({
    queryKey: ['aiInsights', params],
    queryFn: () => unifiedApiService.getAIInsights(params),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
