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
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [playerDataService, setPlayerDataService] = useState<any>(null);

  const logger = UnifiedLogger.getInstance();
  const serviceRegistry = MasterServiceRegistry;

  useEffect(() => {
    const init = async () => {
      if (typeof serviceRegistry.initialize === 'function') {
        await serviceRegistry.initialize();
      }
      const service = serviceRegistry.getService('playerData');
      setPlayerDataService(service);
      setInitialized(true);
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
        const playerData = await playerDataService.getPlayer(id, sport);
        setPlayer(playerData);
        logger.info(
          `usePlayerDashboardState: Player loaded: ${playerData.name} [correlationId=${corrId}]`
        );
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load player';
        setError(errorMsg);
        logger.error(`usePlayerDashboardState: ${errorMsg} [correlationId=${corrId}]`);
      } finally {
        setLoading(false);
      }
    },
    [playerDataService, sport, logger]
  );

  useEffect(() => {
    if (playerId && playerDataService && initialized) {
      loadPlayer(playerId);
    }
  }, [playerId, playerDataService, initialized, loadPlayer]);

  return {
    player,
    loading,
    error,
    correlationId,
    reload: () => loadPlayer(playerId),
  };
}
