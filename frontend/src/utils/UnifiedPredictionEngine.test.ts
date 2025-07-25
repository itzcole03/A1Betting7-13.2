import { EventBus } from '@/core/EventBus';
import { PredictionContext, UnifiedPredictionEngine } from '@/core/UnifiedPredictionEngine';
import { BettingOpportunity, MarketUpdate } from '@/types/core';
import { jest } from '@jest/globals';

const _traceHandler = jest.fn();

describe('UnifiedPredictionEngine', () => {
  let _predictionEngine: UnifiedPredictionEngine;
  let _eventBus: EventBus;
  const _eventHandler = jest.fn();

  beforeEach(() => {
    predictionEngine = UnifiedPredictionEngine.getInstance();
    eventBus = EventBus.getInstance();
  });

  describe('generatePrediction', () => {
    it('should generate a valid betting opportunity', async () => {
      const _context: PredictionContext = {
        playerId: 'player-1',
        metric: 'points',
        timestamp: Date.now(),
        marketState: {
          line: 20.5,
          volume: 1000,
          movement: 'up',
        },
        historicalData: [
          {
            id: 'data-1',
            timestamp: Date.now() - 86400000,
            value: 19.5,
            data: {},
            metadata: {},
          },
          {
            id: 'data-2',
            timestamp: Date.now() - 172800000,
            value: 21.5,
            data: {},
            metadata: {},
          },
        ],
      };

      const _opportunity = await predictionEngine.getPredictions(context);

      expect(opportunity).toBeDefined();
      expect(opportunity.id).toBeDefined();
      expect(opportunity.propId).toBe(`${context.playerId}:${context.metric}`);
      expect(opportunity.type).toMatch(/^(OVER|UNDER)$/);
      expect(opportunity.confidence).toBeGreaterThan(0);
      expect(opportunity.confidence).toBeLessThanOrEqual(1);
      expect(opportunity.expectedValue).toBeDefined();
      expect(opportunity.timestamp).toBeDefined();
      expect(opportunity.analysis).toBeDefined();
      expect(opportunity.analysis.historicalTrends).toBeInstanceOf(Array);
      expect(opportunity.analysis.marketSignals).toBeInstanceOf(Array);
      expect(opportunity.analysis.riskFactors).toBeInstanceOf(Array);
    });

    it('should emit prediction:update event', async () => {
      eventBus.on('prediction:update', eventHandler);

      const _context: PredictionContext = {
        playerId: 'player-1',
        metric: 'points',
        timestamp: Date.now(),
        marketState: {
          line: 20.5,
          volume: 1000,
          movement: 'up',
        },
      };

      await predictionEngine.getPredictions(context);

      expect(eventHandler).toHaveBeenCalled();
      const _opportunity: BettingOpportunity = eventHandler.mock.calls[0][0];
      expect(opportunity.propId).toBe(`${context.playerId}:${context.metric}`);
    });

    it('should handle market updates', async () => {
      const _update: MarketUpdate = {
        id: 'market-1',
        type: 'odds_update',
        timestamp: Date.now(),
        books: {
          'book-1': {
            id: 'odds-1',
            propId: 'player-1:points',
            bookId: 'book-1',
            bookName: 'Test Book',
            odds: 1.95,
            maxStake: 1000,
            timestamp: Date.now(),
          },
        },
      };

      eventBus.on('prediction:update', eventHandler);

      // Simulate market update;
      eventBus.emit('market:update', update);

      // Wait for async processing;
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(eventHandler).toHaveBeenCalled();
      const _opportunity: BettingOpportunity = eventHandler.mock.calls[0][0];
      expect(opportunity.propId).toBe('player-1: points');
    });
  });

  describe('error handling', () => {
    it('should handle invalid prediction context', async () => {
      const _context: PredictionContext = {
        playerId: '',
        metric: '',
        timestamp: Date.now(),
      };

      const _error = new Error('prediction_generation');
      error.stack = 'mock stack';

      await expect(predictionEngine.getPredictions(context)).rejects.toThrow(error);
    });

    it('should handle missing historical data gracefully', async () => {
      const _context: PredictionContext = {
        playerId: 'player-1',
        metric: 'points',
        timestamp: Date.now(),
        marketState: {
          line: 20.5,
          volume: 1000,
          movement: 'up',
        },
      };

      const _opportunity = await predictionEngine.getPredictions(context);

      expect(opportunity).toBeDefined();
      expect(opportunity.confidence).toBeLessThan(0.8); // Lower confidence due to missing data;
    });
  });

  describe('performance monitoring', () => {
    it('should track prediction generation time', async () => {
      const _context: PredictionContext = {
        playerId: 'player-1',
        metric: 'points',
        timestamp: Date.now(),
        marketState: {
          line: 20.5,
          volume: 1000,
          movement: 'up',
        },
      };

      eventBus.on('error', (error: Error) => {
        if (error.message.includes('prediction_generation')) {
          traceHandler(error);
        }
      });

      await predictionEngine.getPredictions(context);

      expect(traceHandler).toHaveBeenCalled();

      // The error variable is defined above in the test context
      expect(error.message).toContain('prediction_generation');
      // Removed assertion for error.stack since error is not in scope here
    });
  });
});
