import { useState, useEffect, useCallback } from 'react';
// @ts-expect-error TS(2307): Cannot find module '@/services/MLSimulationService... Remove this comment to see the full error message
import { MLSimulationService } from '@/services/MLSimulationService';
import {
  Team,
  Player,
  Game,
  Prediction,
  PlayerStats,
  PlayerForm,
  //   InjuryStatus
// @ts-expect-error TS(2307): Cannot find module '@/types/betting' or its corres... Remove this comment to see the full error message
} from '@/types/betting';

export const useMLSimulation = () => {
  const [simulationService] = useState(() => new MLSimulationService());
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      simulationService.initializeSimulation();
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initialize simulation'));
    }
  }, [simulationService]);

  const generatePrediction = useCallback(
    (gameId: string, playerId: string, metric: keyof PlayerStats): Prediction => {
      if (!isInitialized) {
        throw new Error('Simulation not initialized');
      }
      return simulationService.generatePrediction(gameId, playerId, metric);
    },
    [simulationService, isInitialized]
  );

  const getTeamStats = useCallback(
    (teamId: string) => {
      if (!isInitialized) {
        throw new Error('Simulation not initialized');
      }
      return simulationService.getTeamStats(teamId);
    },
    [simulationService, isInitialized]
  );

  const getPlayerStats = useCallback(
    (playerId: string) => {
      if (!isInitialized) {
        throw new Error('Simulation not initialized');
      }
      return simulationService.getPlayerStats(playerId);
    },
    [simulationService, isInitialized]
  );

  const getGamePredictions = useCallback(
    (gameId: string) => {
      if (!isInitialized) {
        throw new Error('Simulation not initialized');
      }
      return simulationService.getGamePredictions(gameId);
    },
    [simulationService, isInitialized]
  );

  const updatePlayerForm = useCallback(
    (playerId: string, form: PlayerForm) => {
      if (!isInitialized) {
        throw new Error('Simulation not initialized');
      }
      simulationService.updatePlayerForm(playerId, form);
    },
    [simulationService, isInitialized]
  );

  const updateInjuryStatus = useCallback(
    // @ts-expect-error TS(2304): Cannot find name 'InjuryStatus'.
    (playerId: string, status: InjuryStatus) => {
      if (!isInitialized) {
        throw new Error('Simulation not initialized');
      }
      simulationService.updateInjuryStatus(playerId, status);
    },
    [simulationService, isInitialized]
  );

  return {
    isInitialized,
    error,
    generatePrediction,
    getTeamStats,
    getPlayerStats,
    getGamePredictions,
    updatePlayerForm,
    //     updateInjuryStatus
  };
};
