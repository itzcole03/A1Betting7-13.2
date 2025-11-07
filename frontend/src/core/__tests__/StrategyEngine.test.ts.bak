import { describe, expect, it, jest } from '@jest/globals';

import type { BettingOpportunity, StrategyRecommendation } from '../../types/core';
import type { StrategyDefinition } from '../StrategyComposition';
import StrategyEngine, { type StrategyEngineEventPayload } from '../StrategyEngine';

const createOpportunity = (overrides: Partial<BettingOpportunity> = {}): BettingOpportunity => ({
  id: overrides.id ?? `opp-${Math.random().toString(16).slice(2)}`,
  type: overrides.type ?? 'OVER',
  confidence: overrides.confidence ?? 0.65,
  expectedValue: overrides.expectedValue ?? 0.12,
  timestamp: overrides.timestamp ?? Date.now(),
  edge: overrides.edge ?? 0.08,
  analysis: overrides.analysis ?? {
    riskFactors: ['line movement'],
    historicalTrends: [],
    marketSignals: [],
  },
  ...overrides,
});

describe('StrategyEngine', () => {
  beforeEach(() => {
    const engine = StrategyEngine.getInstance();
    engine.reset();
    engine.configure({
      bankroll: 1_000,
      maxStakeFraction: 0.05,
      maxExposureFraction: 0.1,
      minStake: 5,
      maxStake: 100,
      minConfidence: 0.55,
      clampConfidence: true,
    });
  });

  afterEach(() => {
    StrategyEngine.getInstance().reset();
  });

  it('clamps unsafe configuration overrides to safe defaults', () => {
    const engine = StrategyEngine.getInstance();
    engine.reset({ includeDefaults: false });

    engine.configure({
      bankroll: -250,
      minStake: -10,
      maxStake: -5,
      maxStakeFraction: 1.5,
      maxExposureFraction: -0.5,
      minConfidence: -0.2,
    });

    const options = engine.getOptions();
    expect(options.bankroll).toBe(1_000);
    expect(options.minStake).toBeCloseTo(0.01, 5);
    expect(options.maxStake).toBeCloseTo(options.minStake, 5);
    expect(options.maxStakeFraction).toBeCloseTo(1, 5);
    expect(options.maxExposureFraction).toBeCloseTo(0.01, 5);
    expect(options.minConfidence).toBe(0);
  });

  it('prevents duplicate strategy registration', () => {
    const engine = StrategyEngine.getInstance();
    engine.reset({ includeDefaults: false });

    const strategy: StrategyDefinition = {
      id: 'test-strategy',
      name: 'Test Strategy',
      evaluate: () => null,
    };

    engine.registerStrategy(strategy);
    expect(() => engine.registerStrategy(strategy)).toThrow(/already registered/i);
  });

  it('evaluates opportunity and emits recommendation events', () => {
    const engine = StrategyEngine.getInstance();
    engine.reset({ includeDefaults: false });
    engine.configure({ bankroll: 1_000, maxStakeFraction: 0.1, minStake: 5, maxStake: 120 });

    const opportunity = createOpportunity({ id: 'opp-123', confidence: 0.7, expectedValue: 0.15 });

    const strategy: StrategyDefinition = {
      id: 'custom',
      name: 'Custom Strategy',
      priority: 5,
      weight: 1,
      evaluate: (opp, _context, options) => {
        const stake = opp.confidence ? opp.confidence * options.maxStake : options.minStake;
        const timestamp = Date.now();
        return {
          id: `custom:${opp.id}`,
          strategyId: 'custom',
          type: 'OVER',
          confidence: opp.confidence ?? options.minConfidence,
          timestamp,
          status: 'active',
          lastUpdate: timestamp,
          recommendedStake: stake,
          opportunityId: opp.id,
          parameters: {
            stake,
            expectedValue: opp.expectedValue ?? 0,
          },
        };
      },
    };

    engine.registerStrategy(strategy);

    const listener = jest.fn();
    const unsubscribe = engine.onRecommendation(listener);

    const recommendation = engine.evaluateOpportunity(opportunity);

    expect(recommendation).not.toBeNull();
    expect(recommendation?.opportunityId).toBe(opportunity.id);
    expect(recommendation?.parameters?.stake).toBeGreaterThan(0);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('filters out recommendations below minimum confidence', () => {
    const engine = StrategyEngine.getInstance();
    engine.reset({ includeDefaults: false });
    engine.configure({ minConfidence: 0.8, bankroll: 1_000, maxStakeFraction: 0.05 });

    const strategy: StrategyDefinition = {
      id: 'low-confidence',
      name: 'Low Confidence',
      evaluate: () => {
        const timestamp = Date.now();
        return {
          id: 'low:rec',
          strategyId: 'low-confidence',
          type: 'OVER',
          confidence: 0.6,
          timestamp,
          status: 'active',
          lastUpdate: timestamp,
          recommendedStake: 20,
          opportunityId: 'low-opp',
          parameters: {
            stake: 20,
            expectedValue: 0.05,
          },
        } as StrategyRecommendation;
      },
    };

    engine.registerStrategy(strategy);
    const result = engine.evaluateOpportunity(createOpportunity({ id: 'low-opp' }));
    expect(result).toBeNull();
  });

  it('returns stored recommendations in chronological order', () => {
    const engine = StrategyEngine.getInstance();
    engine.reset({ includeDefaults: false });
    engine.configure({ bankroll: 1_000, maxStakeFraction: 0.05, minConfidence: 0.55 });

    const timestamp = Date.now();
    const strategy: StrategyDefinition = {
      id: 'chronology',
      name: 'Chronology',
      evaluate: opp => {
        const ts = Date.now();
        return {
          id: `chronology:${opp.id}`,
          strategyId: 'chronology',
          type: 'OVER',
          confidence: opp.confidence ?? 0.6,
          timestamp: ts,
          status: 'active',
          lastUpdate: ts,
          recommendedStake: 30,
          opportunityId: opp.id,
          parameters: {
            stake: 30,
            expectedValue: opp.expectedValue ?? 0.1,
          },
        } as StrategyRecommendation;
      },
    };

    engine.registerStrategy(strategy);

    const dateSpy = jest.spyOn(Date, 'now');
    let current = timestamp - 5;
    dateSpy.mockImplementation(() => {
      current += 5;
      return current;
    });

    const first = engine.evaluateOpportunity(createOpportunity({ id: 'opp-1' }));
    expect(first).not.toBeNull();
    const second = engine.evaluateOpportunity(createOpportunity({ id: 'opp-2' }));
    expect(second).not.toBeNull();

    dateSpy.mockRestore();

    const recommendations = engine.getRecommendations();
    expect(recommendations[0]?.opportunityId).toBe('opp-2');
    expect(recommendations[1]?.opportunityId).toBe('opp-1');
  });

  it('emits deterministic recommendations using default strategies', () => {
    const engine = StrategyEngine.getInstance();
    engine.reset();
    engine.configure({
      bankroll: 1_000,
      maxStakeFraction: 0.05,
      maxExposureFraction: 0.1,
      minStake: 5,
      maxStake: 100,
      minConfidence: 0.55,
    });

    const mockedNow = 1_700_000_000_000;
    const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => mockedNow);

    const opportunity = createOpportunity({
      id: 'det-opportunity',
      confidence: 0.6,
      expectedValue: 0.12,
      edge: 0.08,
      analysis: {
        riskFactors: ['correlated-market'],
        marketSignals: [],
        historicalTrends: [],
        marketVolatility: 0.4,
      },
    });

    const evaluationListener = jest.fn();
    const recommendationListener = jest.fn();
    const unsubscribeEval = engine.onEvaluation(evaluationListener);
    const unsubscribeRec = engine.onRecommendation(recommendationListener);

    const recommendation = engine.evaluateOpportunity(opportunity);

    expect(recommendation).not.toBeNull();
    expect(recommendation?.opportunityId).toBe('det-opportunity');
    expect(recommendation?.confidence).toBeCloseTo(0.6, 3);
    expect(recommendation?.parameters?.stake).toBeCloseTo(30.04, 2);
    expect(recommendation?.parameters?.expectedValue).toBeCloseTo(0.12, 3);
    expect(recommendation?.riskAssessment?.maxExposure).toBeCloseTo(100, 2);

    expect(evaluationListener).toHaveBeenCalledTimes(1);
    expect(recommendationListener).toHaveBeenCalledTimes(1);

    const payload = evaluationListener.mock.calls[0][0] as StrategyEngineEventPayload;
    expect(payload.opportunity.id).toBe('det-opportunity');
    expect(payload.contributions).toHaveLength(2);
    expect(payload.context.bankroll).toBe(1_000);
    expect(payload.options.maxStakeFraction).toBeCloseTo(0.05, 5);
    expect(payload.recommendation).toBe(recommendation);

    unsubscribeEval();
    unsubscribeRec();
    nowSpy.mockRestore();
  });
});
