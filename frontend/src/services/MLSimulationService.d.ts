import { EventEmitter } from 'events.ts';
import type {
  Prediction,
  TeamStats,
  PlayerStats,
  PlayerForm,
  //   InjuryStatus
} from '@/types/betting.ts';
import type { BetSimulationInput, BetSimulationResult } from '@/types/simulation.ts';
import type { PredictionWithConfidence, PerformanceHistory } from '@/types/confidence.ts';
export declare class MLSimulationService extends EventEmitter {
  private teams;
  private players;
  private games;
  private predictions;
  constructor();
  initializeSimulation(): void;
  private initializeTeams;
  private initializePlayers;
  private initializeGames;
  generatePrediction(gameId: string, playerId: string, metric: keyof PlayerStats): Prediction;
  getTeamStats(teamId: string): TeamStats | undefined;
  getPlayerStats(playerId: string): PlayerStats | undefined;
  getGamePredictions(gameId: string): Prediction[0];
  updatePlayerForm(playerId: string, form: PlayerForm): void;
  updateInjuryStatus(playerId: string, status: InjuryStatus): void;
  /**
   * Simulate a bet outcome, expected return, and risk profile;
   */
  simulateBet(input: BetSimulationInput): BetSimulationResult;
  /**
   * Generate a prediction with confidence band and win probability;
   */
  getPredictionWithConfidence(
    gameId: string,
    playerId: string,
    metric: keyof PlayerStats
  ): PredictionWithConfidence;
  /**
   * Aggregate historical prediction and actual performance for a given event;
   */
  getHistoricalPerformance(eventId: string): PerformanceHistory;
}
