/**
 * BackoffStrategy Tests
 * 
 * Tests for the adaptive backoff strategy including:
 * - Deterministic jitter with seeded RNG
 * - Capped backoff sequence
 * - Reset functionality
 * - Edge cases and configuration validation
 */

import { BackoffStrategy } from '../BackoffStrategy';

describe('BackoffStrategy', () => {
  describe('Basic backoff sequence', () => {
    it('generates correct base delay sequence', () => {
      const strategy = new BackoffStrategy({
        baseDelaysMs: [1000, 2000, 4000],
        jitterRatio: 0,
        maxAttempts: 5
      });

      expect(strategy.nextDelay()).toBe(1000);
      expect(strategy.nextDelay()).toBe(2000);
      expect(strategy.nextDelay()).toBe(4000);
      expect(strategy.nextDelay()).toBe(4000); // Repeats last delay
      expect(strategy.nextDelay()).toBe(4000);
    });

    it('respects delay cap', () => {
      const strategy = new BackoffStrategy({
        baseDelaysMs: [1000, 5000, 10000],
        capDelayMs: 6000,
        jitterRatio: 0,
        maxAttempts: 5
      });

      expect(strategy.nextDelay()).toBe(1000);
      expect(strategy.nextDelay()).toBe(5000);
      expect(strategy.nextDelay()).toBe(6000); // Capped at 6000
    });

    it('returns null when max attempts exceeded', () => {
      const strategy = new BackoffStrategy({
        baseDelaysMs: [1000],
        maxAttempts: 2
      });

      expect(strategy.nextDelay()).toBe(1000);
      expect(strategy.nextDelay()).toBe(1000);
      expect(strategy.nextDelay()).toBeNull();
      expect(strategy.hasExceededMaxAttempts()).toBe(true);
    });
  });

  describe('Jitter functionality', () => {
    it('applies deterministic jitter with seeded RNG', () => {
      const strategy = new BackoffStrategy({
        baseDelaysMs: [1000],
        jitterRatio: 0.2,
        seed: 12345,
        maxAttempts: 3
      });

      const delay1 = strategy.nextDelay();
      const delay2 = strategy.nextDelay();
      const delay3 = strategy.nextDelay();

      // With same seed, should get same sequence
      const strategy2 = new BackoffStrategy({
        baseDelaysMs: [1000],
        jitterRatio: 0.2,
        seed: 12345,
        maxAttempts: 3
      });

      expect(strategy2.nextDelay()).toBe(delay1);
      expect(strategy2.nextDelay()).toBe(delay2);
      expect(strategy2.nextDelay()).toBe(delay3);
    });

    it('keeps jittered values within expected bounds', () => {
      const baseDelay = 2000;
      const jitterRatio = 0.3;
      const strategy = new BackoffStrategy({
        baseDelaysMs: [baseDelay],
        jitterRatio,
        seed: 42,
        maxAttempts: 100
      });

      const { min, max } = BackoffStrategy.calculateJitterBounds(baseDelay, jitterRatio);

      // Test multiple values to ensure they're all within bounds
      for (let i = 0; i < 50; i++) {
        const delay = strategy.nextDelay();
        expect(delay).not.toBeNull();
        expect(delay!).toBeGreaterThanOrEqual(min);
        expect(delay!).toBeLessThanOrEqual(max);
      }
    });

    it('enforces minimum delay of 100ms', () => {
      const strategy = new BackoffStrategy({
        baseDelaysMs: [200],
        jitterRatio: 0.9, // High jitter could theoretically go below 100ms
        seed: 999,
        maxAttempts: 10
      });

      for (let i = 0; i < 5; i++) {
        const delay = strategy.nextDelay();
        expect(delay).toBeGreaterThanOrEqual(100);
      }
    });
  });

  describe('Reset functionality', () => {
    it('resets attempt counter and allows new sequence', () => {
      const strategy = new BackoffStrategy({
        baseDelaysMs: [1000, 2000],
        jitterRatio: 0,
        maxAttempts: 3
      });

      // Use up attempts
      expect(strategy.nextDelay()).toBe(1000);
      expect(strategy.nextDelay()).toBe(2000);
      expect(strategy.nextDelay()).toBe(2000);
      expect(strategy.nextDelay()).toBeNull(); // Max exceeded

      // Reset and try again
      strategy.reset();
      expect(strategy.getCurrentAttempt()).toBe(0);
      expect(strategy.hasExceededMaxAttempts()).toBe(false);
      expect(strategy.nextDelay()).toBe(1000);
    });
  });

  describe('Preview functionality', () => {
    it('peeks at next delay without consuming attempt', () => {
      const strategy = new BackoffStrategy({
        baseDelaysMs: [1000, 2000, 4000],
        jitterRatio: 0,
        maxAttempts: 5
      });

      expect(strategy.peekNextDelay()).toBe(1000);
      expect(strategy.getCurrentAttempt()).toBe(0); // No attempt consumed

      expect(strategy.nextDelay()).toBe(1000);
      expect(strategy.getCurrentAttempt()).toBe(1);

      expect(strategy.peekNextDelay()).toBe(2000);
      expect(strategy.getCurrentAttempt()).toBe(1); // Still 1
    });
  });

  describe('Configuration validation', () => {
    it('uses default configuration when no options provided', () => {
      const strategy = new BackoffStrategy();
      const config = strategy.getConfig();

      expect(config.baseDelays).toEqual([1000, 2000, 4000, 8000, 12000]);
      expect(config.capDelay).toBe(12000);
      expect(config.jitterRatio).toBe(0.2);
      expect(config.maxAttempts).toBe(8);
    });

    it('clamps jitter ratio to valid range', () => {
      const strategy1 = new BackoffStrategy({ jitterRatio: -0.5 });
      expect(strategy1.getConfig().jitterRatio).toBe(0);

      const strategy2 = new BackoffStrategy({ jitterRatio: 1.5 });
      expect(strategy2.getConfig().jitterRatio).toBe(1);
    });

    it('provides configuration summary', () => {
      const options = {
        baseDelaysMs: [500, 1000],
        capDelayMs: 5000,
        jitterRatio: 0.1,
        maxAttempts: 3
      };
      const strategy = new BackoffStrategy(options);
      const config = strategy.getConfig();

      expect(config.baseDelays).toEqual(options.baseDelaysMs);
      expect(config.capDelay).toBe(options.capDelayMs);
      expect(config.jitterRatio).toBe(options.jitterRatio);
      expect(config.maxAttempts).toBe(options.maxAttempts);
      expect(config.currentAttempt).toBe(0);
    });
  });

  describe('Static factory methods', () => {
    it('creates immediate strategy for testing', () => {
      const strategy = BackoffStrategy.createImmediateStrategy();
      const config = strategy.getConfig();

      expect(config.baseDelays).toEqual([100, 100, 100]);
      expect(config.capDelay).toBe(100);
      expect(config.jitterRatio).toBe(0);
      expect(config.maxAttempts).toBe(3);
    });

    it('creates aggressive strategy', () => {
      const strategy = BackoffStrategy.createAggressiveStrategy();
      const config = strategy.getConfig();

      expect(config.baseDelays).toEqual([500, 1000, 2000, 4000]);
      expect(config.capDelay).toBe(4000);
      expect(config.jitterRatio).toBe(0.1);
      expect(config.maxAttempts).toBe(10);
    });

    it('creates production strategy', () => {
      const strategy = BackoffStrategy.createProductionStrategy();
      const config = strategy.getConfig();

      expect(config.baseDelays).toEqual([1000, 2000, 4000, 8000, 12000]);
      expect(config.capDelay).toBe(12000);
      expect(config.jitterRatio).toBe(0.2);
      expect(config.maxAttempts).toBe(8);
    });
  });

  describe('Jitter bounds calculation', () => {
    it('calculates correct jitter bounds', () => {
      const bounds1 = BackoffStrategy.calculateJitterBounds(1000, 0.2);
      expect(bounds1.min).toBe(800); // 1000 - (1000 * 0.2)
      expect(bounds1.max).toBe(1200); // 1000 + (1000 * 0.2)

      const bounds2 = BackoffStrategy.calculateJitterBounds(500, 0.5);
      expect(bounds2.min).toBe(250); // 500 - (500 * 0.5)
      expect(bounds2.max).toBe(750); // 500 + (500 * 0.5)
    });

    it('enforces minimum delay in bounds calculation', () => {
      const bounds = BackoffStrategy.calculateJitterBounds(150, 0.8);
      expect(bounds.min).toBe(100); // Should be clamped to minimum
      expect(bounds.max).toBe(270); // 150 + (150 * 0.8)
    });
  });
});