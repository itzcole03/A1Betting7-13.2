/**
 * PropOllama Data Fetching Hook
 *
 * Handles all data fetching logic for PropOllama components.
 * Extracted from PropOllamaUnified to work with the new modular architecture.
 */

import { useCallback, useEffect, useRef } from 'react';
import {
  FeaturedProp,
  fetchBatchPredictions,
  fetchFeaturedProps,
} from '../../services/unified/FeaturedPropsService';
import { EnhancedApiClient } from '../../utils/enhancedApiClient';
import { PropOllamaActions, PropOllamaState } from './usePropOllamaState';

const apiClient = new EnhancedApiClient();

// MLB stat types configuration
const mlbStatTypes = [
  { key: 'Popular', label: 'Popular', statTypes: ['hits', 'home_runs', 'rbis'] },
  { key: 'Hitting', label: 'Hitting', statTypes: ['hits', 'home_runs', 'rbis', 'runs'] },
  { key: 'Pitching', label: 'Pitching', statTypes: ['strikeouts', 'walks', 'earned_runs'] },
];

interface UsePropOllamaDataProps {
  state: PropOllamaState;
  actions: PropOllamaActions;
}

export function usePropOllamaData({ state, actions }: UsePropOllamaDataProps) {
  // IMMEDIATE TEST - This should log if the hook is called at all
  console.error('[PropOllamaData] *** HOOK FUNCTION CALLED *** - START OF FUNCTION EXECUTION');

  const previousSportRef = useRef<string | null>(null);

  console.error(
    '[PropOllamaData] *** HOOK INITIALIZED *** with sport:',
    state.filters.selectedSport
  );

  // TEST: Make a simple API call to verify the hook is running
  useEffect(() => {
    console.error('[PropOllamaData] *** IMMEDIATE TEST CALL TO VERIFY HOOK WORKS ***');
    fetch('/api/health')
      .then(() => console.error('[PropOllamaData] *** HOOK TEST CALL SUCCESS ***'))
      .catch(error => console.error('[PropOllamaData] *** HOOK TEST CALL ERROR ***', error));
  }, []);

  // Fetch upcoming games for MLB
  const fetchUpcomingGames = useCallback(async () => {
    try {
      console.log("[PropOllamaData] Fetching today's games for MLB...");
      const response = await apiClient.get('/mlb/todays-games');

      if (response.data && Array.isArray(response.data)) {
        console.log(`[PropOllamaData] Found ${response.data.length} upcoming games`);
        actions.setUpcomingGames(response.data);
      } else {
        console.warn('[PropOllamaData] No upcoming games data received');
        actions.setUpcomingGames([]);
      }
    } catch (error) {
      console.error('[PropOllamaData] Error fetching upcoming games:', error);
      actions.setUpcomingGames([]);
    }
  }, [actions]);

  // Main data fetching function
  const activateSportAndFetchData = useCallback(
    async (retryCount = 0) => {
      console.log(`[PropOllamaData] Starting data fetch for sport: ${state.filters.selectedSport}`);

      actions.setIsLoading(true);
      actions.setPropLoadingProgress(0);
      actions.setError(null);
      actions.setLoadingStage({ stage: 'fetching', progress: 0, message: 'Initializing...' });
      actions.setLoadingMessage('Initializing...');
      try {
        const selectedSport = state.filters.selectedSport;

        // Step 0: Cleanup previous sport if switching sports
        const previousSport = previousSportRef.current;
        if (previousSport && previousSport !== selectedSport && previousSport !== 'All') {
          try {
            console.log(`[PropOllamaData] Cleaning up previous sport: ${previousSport}`);
            const deactivationResponse = await fetch(`/api/sports/deactivate/${previousSport}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });

            if (deactivationResponse.ok) {
              console.log(`[PropOllamaData] ${previousSport} service deactivated successfully`);
              actions.updateSportActivationStatus(previousSport, { [previousSport]: 'ready' });
            }
          } catch (cleanupError) {
            console.warn(`[PropOllamaData] Error deactivating ${previousSport}:`, cleanupError);
          }
        }

        previousSportRef.current = selectedSport;

        // Step 1: Activate the sport service
        if (selectedSport !== 'All') {
          actions.setLoadingStage({
            stage: 'fetching',
            progress: 10,
            message: `Activating ${selectedSport} service...`,
          });
          actions.updateSportActivationStatus(selectedSport, { [selectedSport]: 'loading' });
          actions.setLoadingMessage(`Activating ${selectedSport} service...`);

          try {
            const activationResponse = await fetch(`/api/sports/activate/${selectedSport}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });

            if (activationResponse.ok) {
              const activationData = await activationResponse.json();
              console.log(`[PropOllamaData] ${selectedSport} service activation:`, activationData);

              actions.updateSportActivationStatus(selectedSport, { [selectedSport]: 'ready' });

              if (activationData.newly_loaded) {
                console.log(
                  `[PropOllamaData] ${selectedSport} models loaded in ${activationData.load_time.toFixed(
                    2
                  )}s`
                );
              }
            } else {
              console.warn(`[PropOllamaData] Sport activation failed for ${selectedSport}`);
              actions.updateSportActivationStatus(selectedSport, { [selectedSport]: 'error' });
            }
          } catch (activationError) {
            console.warn(
              `[PropOllamaData] Sport activation error for ${selectedSport}:`,
              activationError
            );
            actions.updateSportActivationStatus(selectedSport, { [selectedSport]: 'error' });
          }
        }

        // Step 2: Fetch props data
        actions.setLoadingStage({
          stage: 'fetching',
          progress: 20,
          message: 'Fetching props data...',
        });
        actions.setLoadingMessage('Fetching props data...');
        actions.setPropLoadingProgress(10);

        // Get stat types for server-side filtering
        let statTypesForFiltering: string[] = [];
        if (selectedSport === 'MLB') {
          const statTypeConfig = mlbStatTypes.find(st => st.key === state.filters.selectedStatType);
          if (statTypeConfig && statTypeConfig.statTypes.length > 0) {
            statTypesForFiltering = statTypeConfig.statTypes;
            console.log(
              `[PropOllamaData] Using server-side filtering for ${state.filters.selectedStatType}:`,
              statTypesForFiltering
            );
          }
        }

        // Fetch all props with pagination
        let allProps: FeaturedProp[] = [];
        let offset = 0;
        const batchSize = 500;
        let hasMoreProps = true;

        console.log('[PropOllamaData] Fetching props with pagination...');

        while (hasMoreProps && offset < 3000) {
          try {
            actions.setLoadingMessage(
              `Fetching props batch ${Math.floor(offset / batchSize) + 1}...`
            );
            actions.setPropLoadingProgress(20 + (offset / 3000) * 30);

            const batchProps = await fetchFeaturedProps(selectedSport, state.filters.propType, {
              limit: batchSize,
              offset: offset,
              statTypes: statTypesForFiltering,
              useCache: true,
              realtime: false,
              priority: 'high',
            });

            if (batchProps && batchProps.length > 0) {
              allProps = [...allProps, ...batchProps];
              offset += batchSize;
              console.log(
                `[PropOllamaData] Fetched ${batchProps.length} props, total: ${allProps.length}`
              );

              if (batchProps.length < batchSize) {
                hasMoreProps = false;
              }
            } else {
              hasMoreProps = false;
            }
          } catch (batchError) {
            console.error(
              `[PropOllamaData] Error fetching props batch at offset ${offset}:`,
              batchError
            );
            hasMoreProps = false;
          }
        }

        console.log(`[PropOllamaData] Total props fetched: ${allProps.length}`);

        // Step 3: Filter props for upcoming games if MLB
        if (
          selectedSport === 'MLB' &&
          state.filters.showUpcomingGames &&
          state.upcomingGames.length > 0
        ) {
          actions.setLoadingMessage('Filtering props for upcoming games...');

          const upcomingTeamNames = new Set<string>();
          state.upcomingGames.forEach(game => {
            const matchupParts = game.event_name.split(' @ ');
            if (matchupParts.length === 2) {
              upcomingTeamNames.add(matchupParts[0].trim());
              upcomingTeamNames.add(matchupParts[1].trim());
            }
            upcomingTeamNames.add(game.away);
            upcomingTeamNames.add(game.home);
          });

          allProps = allProps.filter(prop => {
            const propTeamName = prop.matchup || prop._originalData?.team_name || '';
            return Array.from(upcomingTeamNames).some(
              teamName =>
                propTeamName.toLowerCase().includes(teamName.toLowerCase()) ||
                teamName.toLowerCase().includes(propTeamName.toLowerCase())
            );
          });

          console.log(`[PropOllamaData] Filtered to ${allProps.length} props for upcoming games`);
        }

        // Step 4: Process batch predictions if we have props
        if (allProps.length > 0) {
          actions.setLoadingStage({
            stage: 'filtering',
            progress: 60,
            message: 'Processing predictions...',
          });
          actions.setLoadingMessage('Processing predictions...');
          actions.setPropLoadingProgress(60);

          try {
            const candidateProps = allProps.slice(0, 200); // Limit for performance
            console.log(
              `[PropOllamaData] Processing ${candidateProps.length} props for batch predictions`
            );

            const batchResults = await fetchBatchPredictions(candidateProps);

            if (batchResults && batchResults.length > 0) {
              console.log(
                `[PropOllamaData] Received ${batchResults.length} batch prediction results`
              );
              actions.setProjections(batchResults);
            } else {
              console.log('[PropOllamaData] No batch predictions, using original props');
              actions.setProjections(allProps);
            }
          } catch (batchError) {
            console.error('[PropOllamaData] Error processing batch predictions:', batchError);
            actions.setProjections(allProps);
          }
        } else {
          console.log('[PropOllamaData] No props found, setting empty array');
          actions.setProjections([]);
        }

        actions.setPropLoadingProgress(100);
        actions.setLoadingMessage('Complete!');
        actions.setInitialLoadingComplete(true);

        console.log(`[PropOllamaData] Data loading complete for ${selectedSport}`);
      } catch (error) {
        console.error('[PropOllamaData] Error in data fetching:', error);
        actions.setError(error instanceof Error ? error.message : 'Unknown error occurred');

        // Retry logic
        if (retryCount < 2) {
          console.log(`[PropOllamaData] Retrying data fetch (attempt ${retryCount + 1})`);
          setTimeout(() => activateSportAndFetchData(retryCount + 1), 2000);
          return;
        }
      } finally {
        actions.setIsLoading(false);
        actions.setLoadingStage(null);
        actions.setLoadingMessage('');
      }
    },
    [
      state.filters.selectedSport,
      state.filters.propType,
      state.filters.selectedStatType,
      state.filters.showUpcomingGames,
      state.upcomingGames,
      actions,
    ]
  );

  // Effect to fetch data when filters change
  // Effect to fetch data when sport or filters change (main trigger)
  useEffect(() => {
    console.error(
      `[PropOllamaData] *** MAIN USEEFFECT TRIGGERED *** - sport: ${state.filters.selectedSport}, propType: ${state.filters.propType}, statType: ${state.filters.selectedStatType}`
    );

    let cancelled = false;

    const fetchData = async () => {
      console.error('[PropOllamaData] *** About to call activateSportAndFetchData... ***');
      if (!cancelled) {
        await activateSportAndFetchData();
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [
    state.filters.selectedSport,
    state.filters.propType,
    state.filters.selectedStatType,
    activateSportAndFetchData,
  ]);

  // Effect to fetch upcoming games when MLB is selected
  useEffect(() => {
    if (state.filters.selectedSport === 'MLB') {
      fetchUpcomingGames();
    }
  }, [state.filters.selectedSport, fetchUpcomingGames]);

  return {
    fetchUpcomingGames,
    activateSportAndFetchData,
  };
}
