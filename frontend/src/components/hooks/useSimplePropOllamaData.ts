/**
 * Simple PropOllama Data Hook
 * Bypasses all complex services and managers for debugging
 */

import { useCallback, useEffect } from 'react';
import { fetchPropsSimple } from '../../services/SimplePropsService';
import { PropOllamaActions, PropOllamaState } from './usePropOllamaState';

interface UseSimplePropOllamaDataProps {
  state: PropOllamaState;
  actions: PropOllamaActions;
}

export function useSimplePropOllamaData({ state, actions }: UseSimplePropOllamaDataProps) {
  console.log(
    '[useSimplePropOllamaData] Hook initialized with sport:',
    state.filters.selectedSport
  );

  const fetchData = useCallback(async () => {
    if (state.isLoading) return; // Prevent multiple concurrent requests

    console.log('[useSimplePropOllamaData] Starting data fetch...');
    actions.setIsLoading(true);
    actions.setError(null);
    actions.setLoadingMessage('Fetching props...');

    try {
      const sport = state.filters.selectedSport;

      // Skip fetching for 'All' sport
      if (sport === 'All') {
        actions.setProjections([]);
        return;
      }

      console.log('[useSimplePropOllamaData] Fetching props for sport:', sport);

      const props = await fetchPropsSimple(sport, 'player', {
        limit: 20, // Start with smaller number for testing
        offset: 0,
      });

      console.log('[useSimplePropOllamaData] ✅ Fetched props:', props.length);

      // Convert SimpleFeaturedProp to the format expected by the state
      const convertedProps = props.map(prop => ({
        ...prop,
        overOdds: prop.overOdds,
        underOdds: prop.underOdds,
      }));

      actions.setProjections(convertedProps as any);
      actions.setLoadingMessage('Complete!');
    } catch (error) {
      console.error('[useSimplePropOllamaData] ❌ Error:', error);
      actions.setError(error instanceof Error ? error.message : 'Failed to fetch props');
    } finally {
      actions.setIsLoading(false);
      actions.setLoadingMessage('');
    }
  }, [state.filters.selectedSport, state.isLoading, actions]);

  // Effect to trigger data fetching when sport changes
  useEffect(() => {
    console.log('[useSimplePropOllamaData] Sport changed to:', state.filters.selectedSport);
    fetchData().catch(error => {
      console.error('[useSimplePropOllamaData] useEffect fetchData failed:', error);
    });
  }, [state.filters.selectedSport, fetchData]);

  return {
    fetchData,
  };
}
