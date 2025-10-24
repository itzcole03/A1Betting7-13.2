import type {
  BettingOpportunity,
  RiskAssessment,
  RiskTolerance,
  StrategyRecommendation,
} from '../types/core';

export interface StrategyComposerOptions {
  minConfidence: number;
  minStake: number;
  maxStake: number;
  maxStakeFraction: number;
  maxExposureFraction: number;
  clampConfidence?: boolean;
}

export interface StrategyEvaluationContext {
  bankroll: number;
  riskTolerance: RiskTolerance;
  environment: string;
  timestamp: number;
}

export type StrategyGuard = (
  opportunity: BettingOpportunity,
  context: StrategyEvaluationContext,
  options: StrategyComposerOptions
) => boolean;

export interface StrategyDefinition {
  id: string;
  name: string;
  description?: string;
  priority?: number;
  weight?: number;
  minConfidence?: number;
  guard?: StrategyGuard;
  evaluate: (
    opportunity: BettingOpportunity,
    context: StrategyEvaluationContext,
    options: StrategyComposerOptions
  ) => StrategyRecommendation | null;
}

export interface StrategyContribution {
  id: string;
  name: string;
  priority: number;
  weight: number;
  recommendation: StrategyRecommendation;
}

export interface StrategyContributionSummary extends StrategyContribution {
  normalizedWeight: number;
  confidence: number;
  stake: number;
  expectedValue: number;
}

export interface StrategyCompositionResult {
  recommendation: StrategyRecommendation;
  contributions: StrategyContributionSummary[];
}

export const DEFAULT_STRATEGY_COMPOSER_OPTIONS: StrategyComposerOptions = {
  minConfidence: 0.55,
  minStake: 5,
  maxStake: 100,
  maxStakeFraction: 0.05,
  maxExposureFraction: 0.1,
  clampConfidence: true,
};

const RISK_TOLERANCE_SCORE: Record<RiskTolerance, number> = {
  low: 0.35,
  medium: 0.6,
  high: 0.85,
};

const SCORE_TO_RISK_TOLERANCE: Array<{ upper: number; value: RiskTolerance }> = [
  { upper: 0.45, value: 'low' },
  { upper: 0.75, value: 'medium' },
  { upper: 1, value: 'high' },
];

const roundTo = (value: number, precision = 2): number => {
  const factor = 10 ** precision;
  return Math.round((Number.isFinite(value) ? value : 0) * factor) / factor;
};

const clampNumber = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const uniqueStrings = (values: Array<string | undefined>): string[] => {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
};

const toRiskTolerance = (score: number): RiskTolerance => {
  const normalized = clampNumber(score, 0, 1);
  const found = SCORE_TO_RISK_TOLERANCE.find(entry => normalized <= entry.upper);
  return found ? found.value : 'high';
};

const extractStake = (recommendation: StrategyRecommendation): number => {
  if (recommendation.parameters?.stake != null) {
    return recommendation.parameters.stake;
  }
  if (recommendation.recommendedStake != null) {
    return recommendation.recommendedStake;
  }
  return 0;
};

const extractExpectedValue = (recommendation: StrategyRecommendation, fallback: number): number => {
  if (recommendation.parameters?.expectedValue != null) {
    return recommendation.parameters.expectedValue;
  }
  return fallback;
};

const extractVolatility = (recommendation: StrategyRecommendation, fallback = 0.5): number => {
  const vol = recommendation.riskAssessment?.volatilityScore;
  if (typeof vol === 'number') {
    return clampNumber(vol, 0, 1);
  }
  return fallback;
};

const extractCorrelationFactors = (recommendation: StrategyRecommendation): string[] =>
  recommendation.riskAssessment?.correlationFactors ?? [];

const extractRiskScore = (
  recommendation: StrategyRecommendation,
  fallback: RiskTolerance
): number => {
  const assessment = recommendation.riskAssessment;
  if (assessment && typeof assessment.riskLevel === 'number') {
    return clampNumber(assessment.riskLevel, 0, 1);
  }
  return RISK_TOLERANCE_SCORE[fallback];
};

export class StrategyComposer {
  constructor(
    private readonly options: StrategyComposerOptions = DEFAULT_STRATEGY_COMPOSER_OPTIONS
  ) {}

  public combine(
    opportunity: BettingOpportunity,
    context: StrategyEvaluationContext,
    contributions: StrategyContribution[],
    overrides?: Partial<StrategyComposerOptions>
  ): StrategyCompositionResult | null {
    if (!contributions.length) {
      return null;
    }

    const options: StrategyComposerOptions = {
      ...this.options,
      ...overrides,
    };

    const fallbackExpectedValue = opportunity.expectedValue ?? opportunity.edge ?? 0;
    const normalized = normalizeContributions(contributions, fallbackExpectedValue);

    const totalWeight = normalized.reduce((sum, item) => sum + item.normalizedWeight, 0) || 1;

    const aggregateConfidence = normalized.reduce(
      (sum, item) => sum + item.confidence * item.normalizedWeight,
      0
    );

    const aggregateStakeRaw = normalized.reduce(
      (sum, item) => sum + item.stake * item.normalizedWeight,
      0
    );

    const aggregateExpectedValue = normalized.reduce(
      (sum, item) => sum + item.expectedValue * item.normalizedWeight,
      0
    );

    const aggregateRiskScore = normalized.reduce(
      (sum, item) =>
        sum + extractRiskScore(item.recommendation, context.riskTolerance) * item.normalizedWeight,
      0
    );

    const aggregateVolatility = normalized.reduce(
      (sum, item) => sum + extractVolatility(item.recommendation) * item.normalizedWeight,
      0
    );

    const hedgingRecommendations = uniqueStrings(
      normalized.flatMap(entry => entry.recommendation.hedgingRecommendations ?? [])
    );

    const correlationFactors = uniqueStrings(
      normalized.flatMap(entry => extractCorrelationFactors(entry.recommendation))
    );

    const marketFactors = opportunity.analysis?.riskFactors ?? [];

    const typeWeights = new Map<string, { weight: number; priority: number }>();
    for (const entry of normalized) {
      if (!entry.recommendation.type) continue;
      const previous = typeWeights.get(entry.recommendation.type) ?? {
        weight: 0,
        priority: entry.priority,
      };
      typeWeights.set(entry.recommendation.type, {
        weight: previous.weight + entry.normalizedWeight,
        priority: Math.min(previous.priority, entry.priority),
      });
    }

    let selectedType: StrategyRecommendation['type'] = 'OVER';
    const mapType = (value: string | undefined): StrategyRecommendation['type'] =>
      value === 'UNDER' ? 'UNDER' : 'OVER';

    if (opportunity.type) {
      selectedType = mapType(opportunity.type);
    }
    if (typeWeights.size) {
      const sorted = Array.from(typeWeights.entries()).sort((a, b) => {
        const weightDiff = b[1].weight - a[1].weight;
        if (Math.abs(weightDiff) > 1e-6) return weightDiff;
        return a[1].priority - b[1].priority;
      });
      selectedType = mapType(sorted[0][0]);
    } else if (aggregateExpectedValue < 0) {
      selectedType = 'UNDER';
    }

    const stake = clampNumber(aggregateStakeRaw, options.minStake, options.maxStake);
    const confidence = options.clampConfidence
      ? clampNumber(Math.max(aggregateConfidence, options.minConfidence), 0, 1)
      : aggregateConfidence;

    const timestamp = Date.now();
    const maxExposure = roundTo(context.bankroll * options.maxExposureFraction, 2);

    const riskAssessment: RiskAssessment = {
      id: `risk:${opportunity.id}`,
      timestamp,
      riskLevel: roundTo(aggregateRiskScore, 2),
      maxExposure,
      confidenceScore: roundTo(confidence, 2),
      volatilityScore: roundTo(aggregateVolatility, 2),
      correlationFactors: uniqueStrings([...correlationFactors, ...marketFactors]),
    };

    const recommendation: StrategyRecommendation = {
      id: `unified:${opportunity.id}`,
      type: selectedType,
      confidence: roundTo(confidence, 3),
      timestamp,
      parameters: {
        stake: roundTo(stake, 2),
        expectedValue: roundTo(aggregateExpectedValue, 3),
      },
      status: 'active',
      lastUpdate: timestamp,
      strategyId: 'unified',
      recommendedStake: roundTo(stake, 2),
      opportunityId: opportunity.id,
      hedgingRecommendations,
      riskAssessment,
      metadata: {
        createdAt: timestamp,
        updatedAt: timestamp,
        version: '1.0.0',
      },
    };

    if (!recommendation.entryPoints || recommendation.entryPoints.length === 0) {
      recommendation.entryPoints = [];
    }
    if (!recommendation.exitPoints || recommendation.exitPoints.length === 0) {
      recommendation.exitPoints = [];
    }

    const summarized = normalized.map(entry => ({
      ...entry,
      normalizedWeight: entry.normalizedWeight / totalWeight,
    }));

    return {
      recommendation,
      contributions: summarized,
    };
  }
}

function normalizeContributions(
  contributions: StrategyContribution[],
  fallbackExpectedValue: number
): StrategyContributionSummary[] {
  const positiveWeights = contributions.map(item => Math.max(0, item.weight));
  const total = positiveWeights.reduce((sum, value) => sum + value, 0);
  const fallbackWeight = contributions.length ? 1 / contributions.length : 0;

  return contributions.map((item, index) => {
    const recommendation = item.recommendation;
    const confidence = clampNumber(
      recommendation.confidence ?? DEFAULT_STRATEGY_COMPOSER_OPTIONS.minConfidence,
      0,
      1
    );
    const stake = extractStake(recommendation);
    const expectedValue = extractExpectedValue(recommendation, fallbackExpectedValue);

    const normalizedWeight = total > 0 ? positiveWeights[index] / total : fallbackWeight;

    return {
      ...item,
      normalizedWeight,
      confidence,
      stake,
      expectedValue,
    };
  });
}

export { clampNumber, roundTo };
