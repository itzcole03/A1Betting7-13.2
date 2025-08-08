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
        // Capture detailed error information
        let errorMsg = 'Failed to load player';
        let errorDetails: any = {};

        if (err instanceof Error) {
          errorMsg = err.message;
          errorDetails = {
            name: err.name,
            stack: err.stack,
            message: err.message
          };
        } else if (typeof err === 'string') {
          errorMsg = err;
        } else if (err && typeof err === 'object') {
          errorMsg = err.toString() || 'Unknown error object';
          errorDetails = err;
        }

        setError(errorMsg);

        // Generate errorId using UnifiedErrorService if available
        let generatedErrorId = null;
        try {
          const { UnifiedErrorService } = require('../services/unified/UnifiedErrorService');
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
        setErrorId(generatedErrorId);

        // Safer error logging to prevent template issues
        try {
          const logMessage = generatedErrorId
            ? `usePlayerDashboardState: ${errorMsg} [correlationId=${corrId}] errorId=${generatedErrorId}`
            : `usePlayerDashboardState: ${errorMsg} [correlationId=${corrId}] errorId=null`;

          logger.error(logMessage);

          // Also log to console for immediate debugging
          console.error('[usePlayerDashboardState] Detailed error info:', {
            errorMsg,
            correlationId: corrId,
            errorId: generatedErrorId,
            playerId: id,
            sport: sport,
            errorType: err?.constructor?.name,
            errorDetails: errorDetails
          });

        } catch (logError) {
          // Fallback logging if there are issues with the logger
          console.error('[usePlayerDashboardState] Logging error:', logError);
          console.error('[usePlayerDashboardState] Original error:', errorMsg);
          console.error('[usePlayerDashboardState] Error details:', errorDetails);
        }
      } finally {
        setLoading(false);
      }
    },
    [playerDataService, sport, logger]
  );

  useEffect(() => {
    if (playerId && playerDataService && initialized) {
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
