import { useCallback, useEffect, useState } from 'react';
import type { Player } from '../components/player/PlayerDashboardContainer';
import MasterServiceRegistry from '../services/MasterServiceRegistry';
import { UnifiedLogger } from '../services/unified/UnifiedLogger';

interface UsePlayerDashboardStateProps {
  playerId: string;
  sport?: string;
}

export function usePlayerDashboardState({ playerId, sport = 'MLB' }: UsePlayerDashboardStateProps) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [playerDataService, setPlayerDataService] = useState<any>(null);

  const logger = UnifiedLogger.getInstance();
  const serviceRegistry = MasterServiceRegistry;

  useEffect(() => {
    const init = async () => {
      try {
        console.log('[usePlayerDashboardState] Initializing service registry...');

        if (typeof serviceRegistry.initialize === 'function') {
          await serviceRegistry.initialize();
          console.log('[usePlayerDashboardState] Service registry initialized successfully');
        } else {
          console.warn('[usePlayerDashboardState] Service registry has no initialize method');
        }

        const service = serviceRegistry.getService('playerData');
        console.log('[usePlayerDashboardState] PlayerData service retrieved:', !!service);

        setPlayerDataService(service);
        setInitialized(true);
      } catch (initError) {
        console.error('[usePlayerDashboardState] Service initialization failed:', initError);

        // Check if this is the "item is not defined" error
        if (initError instanceof ReferenceError && initError.message.includes('item')) {
          console.error('[usePlayerDashboardState] ReferenceError detected during service init:', {
            name: initError.name,
            message: initError.message,
            stack: initError.stack
          });
        }

        // Still set initialized to true to prevent infinite loops
        setInitialized(true);
      }
    };
    init();
  }, [serviceRegistry]);

  const loadPlayer = useCallback(
    async (id: string) => {
      if (!playerDataService || typeof playerDataService.getPlayer !== 'function') return;
      setLoading(true);
      setError(null);
      const corrId = `${id}-${Date.now()}`;
      setCorrelationId(corrId);
      try {
        logger.info(`usePlayerDashboardState: Loading player: ${id} [correlationId=${corrId}]`);

        // Add extra safety checks
        if (!playerDataService || typeof playerDataService.getPlayer !== 'function') {
          throw new Error('PlayerDataService not available or getPlayer method missing');
        }

        const playerData = await playerDataService.getPlayer(id, sport);

        // Validate player data
        if (!playerData) {
          throw new Error('No player data returned from service');
        }

        setPlayer(playerData);
        logger.info(
          `usePlayerDashboardState: Player loaded: ${playerData.name || 'Unknown'} [correlationId=${corrId}]`
        );
        setErrorId(null);
      } catch (err) {
        // Capture error information but don't spam for connectivity issues
        let errorMsg = 'Failed to load player';
        let errorDetails: any = {};

        const isConnectivityOrMissingDataError = err instanceof Error && (
          err.message.includes('Failed to fetch') ||
          err.message.includes('timeout') ||
          err.message.includes('signal timed out') ||
          err.message.includes('Network') ||
          err.message.includes('HTTP 404') ||
          err.message.includes('Not Found') ||
          err.message.includes('Player data unavailable')
        );

        if (err instanceof Error) {
          errorMsg = err.message;
          errorDetails = {
            name: err.name,
            stack: err.stack,
            message: err.message
          };

          // For connectivity/missing data errors, provide user-friendly message
          if (isConnectivityOrMissingDataError) {
            errorMsg = 'Player data not found - using sample data';
          }
        } else if (typeof err === 'string') {
          errorMsg = err;
        } else if (err && typeof err === 'object') {
          errorMsg = err.toString() || 'Unknown error object';
          errorDetails = err;
        }

        setError(errorMsg);

        // Generate errorId - skip error service for connectivity/missing data issues
        let generatedErrorId = null;
        if (!isConnectivityOrMissingDataError) {
          try {
            const { UnifiedErrorService } = await import('../services/unified/UnifiedErrorService');
            generatedErrorId = UnifiedErrorService.getInstance().reportError(errorMsg, {
              correlationId: corrId,
              context: 'usePlayerDashboardState',
              playerId: id,
              sport: sport,
              errorDetails: errorDetails
            });
          } catch (e) {
            // Fallback: generate a local errorId
            generatedErrorId = `player_error_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 6)}`;
          }
        } else {
          // For connectivity/missing data errors, just generate a simple ID
          generatedErrorId = `missing_data_${Date.now()}`;
        }
        setErrorId(generatedErrorId);

        // Log errors appropriately - minimal logging for connectivity/missing data issues
        try {
          if (isConnectivityOrMissingDataError) {
            // Just log missing data issues as info, not errors
            console.info(`[usePlayerDashboardState] Player data not found for ${id} - using sample data`);
          } else {
            // Log actual errors normally
            const logMessage = generatedErrorId
              ? `usePlayerDashboardState: ${errorMsg} [correlationId=${corrId}] errorId=${generatedErrorId}`
              : `usePlayerDashboardState: ${errorMsg} [correlationId=${corrId}] errorId=null`;

            logger.error(logMessage);
            console.error('[usePlayerDashboardState] Error details:', JSON.stringify({
              errorMsg,
              correlationId: corrId,
              errorId: generatedErrorId,
              playerId: id,
              sport: sport,
              errorDetails: errorDetails
            }, null, 2));
          }
        } catch (logError) {
          // Fallback logging if there are issues with the logger
          console.error('[usePlayerDashboardState] Logging error:', logError);
          console.error('[usePlayerDashboardState] Original error:', errorMsg);
        }
      } finally {
        setLoading(false);
      }
    },
    [playerDataService, sport, logger]
  );

  useEffect(() => {
    if (playerId && playerId.trim() !== '' && playerDataService && initialized) {
      // Wrap in additional try-catch to catch any ReferenceErrors
      try {
        loadPlayer(playerId).catch(err => {
          console.error('[usePlayerDashboardState] useEffect loadPlayer failed:', err);
          // Log additional details if it's a ReferenceError
          if (err instanceof ReferenceError) {
            console.error('[usePlayerDashboardState] ReferenceError details:', {
              name: err.name,
              message: err.message,
              stack: err.stack
            });
          }
        });
      } catch (syncError) {
        console.error('[usePlayerDashboardState] Synchronous error in useEffect:', syncError);
      }
    }
  }, [playerId, playerDataService, initialized, loadPlayer]);

  return {
    player,
    loading,
    error,
    errorId,
    correlationId,
    reload: () => loadPlayer(playerId),
  };
}
