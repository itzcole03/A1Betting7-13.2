import { useQuery } from '@tanstack/react-query';
import { createUnifiedApiService } from '../services/unifiedApiService';

export function useEnhancedBets(
  _params: {
    sport?: string;
    min_confidence?: number;
    include_ai_insights?: boolean;
    include_portfolio_optimization?: boolean;
    max_results?: number;
  } = {}
) {
  // eslint-disable-next-line no-console
  console.log('[HOOK] useEnhancedBets called', _params);
  return useQuery({
    queryKey: ['enhancedBets', _params],
    queryFn: () => {
      // eslint-disable-next-line no-console
      console.log('[HOOK] useEnhancedBets queryFn');
      return createUnifiedApiService().getEnhancedBets(_params);
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
    onSuccess: data => {
      // eslint-disable-next-line no-console
      console.log('[HOOK] useEnhancedBets onSuccess', data);
    },
    onError: err => {
      // eslint-disable-next-line no-console
      console.log('[HOOK] useEnhancedBets onError', err, JSON.stringify(err));
    },
  });
}
