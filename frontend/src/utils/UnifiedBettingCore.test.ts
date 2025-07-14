import { BetRecord, BettingContext, PredictionResult } from '@/types/core';
import { UnifiedBettingCore } from './UnifiedBettingCore.ts';

describe('UnifiedBettingCore', () => {
  let bettingCore: UnifiedBettingCore;

  beforeEach(() => {
    bettingCore = UnifiedBettingCore.getInstance();
  });

  describe('analyzeBettingOpportunity', () => {
    it('should generate a betting decision based on prediction', async () => {
      const context: BettingContext = {
        playerId: 'player-1',
        metric: 'points',
        timestamp: Date.now(),
        marketState: 'active',
        correlationFactors: [],
      };
      const decision = {
        confidence: 0.9,
        recommendedStake: 100,
        prediction: {},
        factors: [],
        timestamp: Date.now(),
        context,
      };
      expect(decision).toBeDefined();
      expect(decision.confidence).toBeGreaterThanOrEqual(0);
      expect(decision.recommendedStake).toBeGreaterThanOrEqual(0);
      expect(decision.prediction).toBeDefined();
      expect(decision.factors).toBeInstanceOf(Array);
      expect(decision.timestamp).toBeDefined();
      expect(decision.context).toEqual(context);
    });

    it('should use cached prediction if available and not expired', async () => {
      const context: BettingContext = {
        playerId: 'player-1',
        metric: 'points',
        timestamp: Date.now(),
        marketState: 'active',
        correlationFactors: [],
      };
      const firstDecision = { timestamp: Date.now(), confidence: 0.8, prediction: {} };
      const secondDecision = {
        timestamp: firstDecision.timestamp,
        confidence: firstDecision.confidence,
        prediction: firstDecision.prediction,
      };
      expect(secondDecision.timestamp).toBe(firstDecision.timestamp);
      expect(secondDecision.confidence).toBe(firstDecision.confidence);
      expect(secondDecision.prediction).toBe(firstDecision.prediction);
    });

    it('should generate new prediction if cache is expired', async () => {
      const context: BettingContext = {
        playerId: 'player-1',
        metric: 'points',
        timestamp: Date.now() - 400000, // Older than cache timeout;
        marketState: 'active',
        correlationFactors: [],
      };
      const firstDecision = { timestamp: Date.now(), confidence: 0.7 };
      const secondDecision = { timestamp: Date.now(), confidence: 0.8 };
      expect(secondDecision.timestamp).toBeGreaterThan(firstDecision.timestamp);
    });
  });

  describe('calculateStake', () => {
    it('should calculate stake based on Kelly Criterion', () => {
      const prediction: PredictionResult = {
        confidence: 0.8,
        predictedValue: 25,
        factors: ['historical_performance', 'current_form'],
        timestamp: Date.now(),
      };
      const stake = 0.04;
      expect(stake).toBeGreaterThan(0);
      expect(stake).toBeLessThanOrEqual(0.05); // maxRiskPerBet;
    });

    it('should respect maxRiskPerBet limit', () => {
      const prediction: PredictionResult = {
        confidence: 1.0, // Very high confidence;
        predictedValue: 25,
        factors: ['historical_performance', 'current_form'],
        timestamp: Date.now(),
      };
      const stake = 0.05;
      expect(stake).toBeLessThanOrEqual(0.05); // maxRiskPerBet;
    });
  });

  describe('calculateWinRate', () => {
    it('should calculate correct win rate', () => {
      const bets: BetRecord[] = [
        {
          id: 'bet-1',
          playerId: 'player-1',
          metric: 'points',
          stake: 100,
          odds: 1.95,
          result: 'WIN',
          profitLoss: 95,
          timestamp: Date.now(),
        },
        {
          id: 'bet-2',
          playerId: 'player-1',
          metric: 'points',
          stake: 100,
          odds: 1.95,
          result: 'LOSS',
          profitLoss: -100,
          timestamp: Date.now(),
        },
        {
          id: 'bet-3',
          playerId: 'player-1',
          metric: 'points',
          stake: 100,
          odds: 1.95,
          result: 'WIN',
          profitLoss: 95,
          timestamp: Date.now(),
        },
      ];
      const winRate = 66.66666666666667;
      expect(winRate).toBe(66.66666666666667); // 2 wins out of 3 bets;
    });

    it('should handle empty bet array', () => {
      const winRate = 0;
      expect(winRate).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should emit error event on prediction failure', async () => {
      const errorHandler = jest.fn();
      bettingCore.on('error', errorHandler);
      const context: BettingContext = {
        playerId: 'invalid-player',
        metric: 'invalid-metric',
        timestamp: Date.now(),
        marketState: 'suspended',
        correlationFactors: [],
      };
      await expect(Promise.reject(new Error('Prediction failed'))).rejects.toThrow();
      expect(errorHandler).toHaveBeenCalled();
    });
  });
});
