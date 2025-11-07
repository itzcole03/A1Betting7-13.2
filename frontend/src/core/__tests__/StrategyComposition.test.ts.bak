import { describe, expect, it, jest } from '@jest/globals';

import type { BettingOpportunity, StrategyRecommendation } from '../../types/core';
import {
  DEFAULT_STRATEGY_COMPOSER_OPTIONS,
  StrategyComposer,
  type StrategyContribution,
  type StrategyEvaluationContext,
} from '../StrategyComposition';

describe('StrategyComposer', () => {
  const baseOpportunity: BettingOpportunity = {
    id: 'opp-1',
    sport: 'MLB',
    player: 'Test Player',
    team: 'Example Team',
    opponent: 'Other Team',
    type: 'OVER',
    confidence: 0.62,
    expectedValue: 0.12,
    edge: 0.08,
    timestamp: Date.now(),
    line: 7.5,
    odds: -110,
    book: 'ExampleBook',
    analysis: {
      riskFactors: ['line movement'],
      historicalTrends: [],
      marketSignals: [],
    },
  };

  const recommendation = (partial: Partial<StrategyRecommendation>): StrategyRecommendation => {
    const timestamp = Date.now();
    return {
      id: 'rec-1',
      type: 'OVER',
      confidence: 0.65,
      timestamp,
      status: 'active',
      lastUpdate: timestamp,
      strategyId: partial.strategyId ?? 'strategy-1',
      recommendedStake: 40,
      opportunityId: baseOpportunity.id,
      parameters: {
        stake: 40,
        expectedValue: 0.1,
      },
      metadata: {
        createdAt: timestamp,
        updatedAt: timestamp,
        version: '1.0.0',
      },
      riskAssessment: {
        id: 'risk-1',
        timestamp,
        riskLevel: 0.45,
        confidenceScore: 0.65,
        maxExposure: 50,
        volatilityScore: 0.4,
        correlationFactors: ['line movement'],
      },
      ...partial,
    };
  };

  const context: StrategyEvaluationContext = {
    bankroll: 1_000,
    environment: 'test',
    riskTolerance: 'medium',
    timestamp: Date.now(),
  };

  it('combines strategy contributions into a unified recommendation', () => {
    const composer = new StrategyComposer({
      ...DEFAULT_STRATEGY_COMPOSER_OPTIONS,
      minStake: 10,
      maxStake: 120,
    });

    const contributions: StrategyContribution[] = [
      {
        id: 's1',
        name: 'Strategy A',
        priority: 10,
        weight: 1,
        recommendation: recommendation({
          id: 'rec-a',
          confidence: 0.68,
          parameters: { stake: 45, expectedValue: 0.14 },
          riskAssessment: {
            id: 'risk-a',
            timestamp: Date.now(),
            riskLevel: 0.42,
            confidenceScore: 0.68,
            maxExposure: 55,
            volatilityScore: 0.35,
            correlationFactors: ['line movement'],
          },
        }),
      },
      {
        id: 's2',
        name: 'Strategy B',
        priority: 20,
        weight: 0.8,
        recommendation: recommendation({
          id: 'rec-b',
          confidence: 0.62,
          parameters: { stake: 35, expectedValue: 0.09 },
          riskAssessment: {
            id: 'risk-b',
            timestamp: Date.now(),
            riskLevel: 0.5,
            confidenceScore: 0.62,
            maxExposure: 48,
            volatilityScore: 0.45,
            correlationFactors: ['weather'],
          },
          hedgingRecommendations: ['Hedge using alt line'],
        }),
      },
    ];

    const result = composer.combine(baseOpportunity, context, contributions);

    expect(result).not.toBeNull();

    const recommendationResult = result!.recommendation;

    expect(recommendationResult.confidence).toBeGreaterThanOrEqual(0.55);
    expect(recommendationResult.parameters?.stake).toBeGreaterThanOrEqual(10);
    expect(recommendationResult.parameters?.stake).toBeLessThanOrEqual(120);
    expect(recommendationResult.hedgingRecommendations).toContain('Hedge using alt line');
    expect(recommendationResult.riskAssessment?.correlationFactors).toEqual(
      expect.arrayContaining(['line movement', 'weather'])
    );
    expect(result!.contributions.length).toBe(2);
    const totalWeight = result!.contributions.reduce(
      (sum, entry) => sum + entry.normalizedWeight,
      0
    );
    expect(totalWeight).toBeCloseTo(1, 5);
  });

  it('returns null when no contributions are provided', () => {
    const composer = new StrategyComposer();
    const result = composer.combine(baseOpportunity, context, []);
    expect(result).toBeNull();
  });

  it('distributes weight evenly when contributions have zero weight', () => {
    const composer = new StrategyComposer();
    const contributions: StrategyContribution[] = [
      {
        id: 'zero-1',
        name: 'Zero A',
        priority: 0,
        weight: 0,
        recommendation: recommendation({ id: 'zero-a' }),
      },
      {
        id: 'zero-2',
        name: 'Zero B',
        priority: 0,
        weight: 0,
        recommendation: recommendation({ id: 'zero-b' }),
      },
    ];

    const result = composer.combine(baseOpportunity, context, contributions);
    expect(result).not.toBeNull();
    const weights = result!.contributions.map(entry => entry.normalizedWeight);
    expect(weights[0]).toBeCloseTo(0.5, 5);
    expect(weights[1]).toBeCloseTo(0.5, 5);
  });

  it('produces deterministic aggregates regardless of contribution ordering', () => {
    const composer = new StrategyComposer({
      ...DEFAULT_STRATEGY_COMPOSER_OPTIONS,
      minStake: 10,
      maxStake: 120,
      clampConfidence: true,
    });

    const fixedNow = 1_700_000_000_500;
    const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => fixedNow);

    const aggressive: StrategyContribution = {
      id: 'aggressive',
      name: 'Aggressive',
      priority: 5,
      weight: 1.4,
      recommendation: recommendation({
        id: 'rec-aggressive',
        type: 'OVER',
        confidence: 0.72,
        parameters: { stake: 48, expectedValue: 0.16 },
        riskAssessment: {
          id: 'risk-aggressive',
          timestamp: fixedNow,
          riskLevel: 0.62,
          confidenceScore: 0.72,
          maxExposure: 60,
          volatilityScore: 0.55,
          correlationFactors: ['line movement'],
        },
      }),
    };

    const conservative: StrategyContribution = {
      id: 'conservative',
      name: 'Conservative',
      priority: 8,
      weight: 0.6,
      recommendation: recommendation({
        id: 'rec-conservative',
        type: 'UNDER',
        confidence: 0.58,
        parameters: { stake: 22, expectedValue: 0.07 },
        riskAssessment: {
          id: 'risk-conservative',
          timestamp: fixedNow,
          riskLevel: 0.38,
          confidenceScore: 0.58,
          maxExposure: 40,
          volatilityScore: 0.28,
          correlationFactors: ['weather'],
        },
        hedgingRecommendations: ['Partial hedge via alt total'],
      }),
    };

    const ordered = composer.combine(baseOpportunity, context, [aggressive, conservative]);
    const reversed = composer.combine(baseOpportunity, context, [conservative, aggressive]);

    expect(ordered).not.toBeNull();
    expect(reversed).not.toBeNull();

    const orderedRec = ordered!.recommendation;
    const reversedRec = reversed!.recommendation;

    expect(orderedRec.type).toBe('OVER');
    expect(reversedRec.type).toBe('OVER');
    expect(orderedRec.confidence).toBeCloseTo(reversedRec.confidence, 5);
    expect(orderedRec.parameters?.stake).toBeCloseTo(reversedRec.parameters?.stake ?? 0, 5);
    expect(orderedRec.parameters?.expectedValue).toBeCloseTo(
      reversedRec.parameters?.expectedValue ?? 0,
      5
    );
    expect(orderedRec.riskAssessment?.riskLevel).toBeCloseTo(
      reversedRec.riskAssessment?.riskLevel ?? 0,
      5
    );
    expect(new Set(orderedRec.hedgingRecommendations ?? [])).toEqual(
      new Set(reversedRec.hedgingRecommendations ?? [])
    );

    const orderedWeights = new Map(
      ordered!.contributions.map(entry => [entry.id, entry.normalizedWeight] as const)
    );
    const reversedWeights = new Map(
      reversed!.contributions.map(entry => [entry.id, entry.normalizedWeight] as const)
    );

    expect(orderedWeights.size).toBe(2);
    expect(reversedWeights.size).toBe(2);
    for (const [id, weight] of orderedWeights.entries()) {
      const reversedWeight = reversedWeights.get(id);
      expect(reversedWeight).toBeDefined();
      expect(weight).toBeCloseTo(reversedWeight ?? 0, 6);
    }

    nowSpy.mockRestore();
  });
});
