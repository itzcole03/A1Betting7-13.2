import { useQuery } from '@tanstack/react-query';
import { createUnifiedApiService } from '../services/unifiedApiService';

export function useAIInsights(_params: { sport?: string; min_confidence?: number } = {}) {
  // eslint-disable-next-line no-console
  console.log('[HOOK] useAIInsights called', _params);
  return useQuery({
    queryKey: ['aiInsights', _params],
    queryFn: () => {
      // eslint-disable-next-line no-console
      console.log('[HOOK] useAIInsights queryFn');
      return createUnifiedApiService().getAIInsights(_params);
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
