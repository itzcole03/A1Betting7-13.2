import type { BettingOpportunity, StrategyRecommendation } from '../types/core';

import { EventBus } from './EventBus';
import type {
  StrategyComposerOptions,
  StrategyContribution,
  StrategyContributionSummary,
  StrategyDefinition,
  StrategyEvaluationContext,
} from './StrategyComposition';
import {
  DEFAULT_STRATEGY_COMPOSER_OPTIONS,
  StrategyComposer,
  clampNumber,
  roundTo,
} from './StrategyComposition';
import { getLogger } from './UnifiedLogger';

type StrategyEngineListener = (payload: StrategyEngineEventPayload) => void;

export interface StrategyEngineEventPayload {
  opportunity: BettingOpportunity;
  recommendation: StrategyRecommendation;
  contributions: StrategyContributionSummary[];
  context: StrategyEvaluationContext;
  options: StrategyComposerOptions;
}

export interface StrategyEngineOptions extends StrategyComposerOptions {
  bankroll: number;
  environment: string;
  riskTolerance: StrategyEvaluationContext['riskTolerance'];
}

const DEFAULT_ENGINE_OPTIONS: StrategyEngineOptions = {
  ...DEFAULT_STRATEGY_COMPOSER_OPTIONS,
  bankroll: 1_000,
  environment: 'production',
  riskTolerance: 'medium',
};

export const STRATEGY_ENGINE_EVENTS = {
  evaluated: 'strategy:evaluated',
  recommendation: 'strategy:recommendation',
} as const;

const ensureFinite = (value: number, fallback = 0): number =>
  Number.isFinite(value) ? value : fallback;

const createTimestamp = (): number => Date.now();

export class StrategyEngine {
  private static instance: StrategyEngine | null = null;

  private options: StrategyEngineOptions;
  private composer: StrategyComposer;
  private readonly eventBus = EventBus.getInstance();
  private readonly logger = getLogger('StrategyEngine');

  private readonly strategyRegistry = new Map<string, StrategyDefinition>();
  private orderedStrategies: StrategyDefinition[] = [];
  private readonly lastRecommendations = new Map<string, StrategyRecommendation>();

  private constructor(options?: Partial<StrategyEngineOptions>) {
    this.options = this.mergeOptions(options);
    this.composer = new StrategyComposer(this.getComposerOptions());
    this.registerDefaultStrategies();
  }

  public static getInstance(options?: Partial<StrategyEngineOptions>): StrategyEngine {
    if (!StrategyEngine.instance) {
      StrategyEngine.instance = new StrategyEngine(options);
    } else if (options) {
      StrategyEngine.instance.configure(options);
    }
    return StrategyEngine.instance;
  }

  public configure(overrides: Partial<StrategyEngineOptions>): void {
    this.options = this.mergeOptions(overrides);
    this.composer = new StrategyComposer(this.getComposerOptions());
  }

  public reset(options: { includeDefaults?: boolean } = {}): void {
    const includeDefaults = options.includeDefaults ?? true;
    this.strategyRegistry.clear();
    this.orderedStrategies = [];
    this.lastRecommendations.clear();
    this.composer = new StrategyComposer(this.getComposerOptions());
    if (includeDefaults) {
      this.registerDefaultStrategies();
    }
  }

  public getOptions(): StrategyEngineOptions {
    return { ...this.options };
  }

  public getStrategies(): StrategyDefinition[] {
    return [...this.orderedStrategies];
  }

  public getRecommendations(): StrategyRecommendation[] {
    return [...this.lastRecommendations.values()].sort(
      (a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)
    );
  }

  public registerStrategy(definition: StrategyDefinition): void {
    if (this.strategyRegistry.has(definition.id)) {
      throw new Error(`Strategy with id "${definition.id}" is already registered`);
    }

    this.strategyRegistry.set(definition.id, definition);
    this.orderedStrategies.push(definition);
    this.sortStrategies();
  }

  public unregisterStrategy(strategyId: string): void {
    this.strategyRegistry.delete(strategyId);
    this.orderedStrategies = this.orderedStrategies.filter(strategy => strategy.id !== strategyId);
  }

  public evaluateOpportunity(
    opportunity: BettingOpportunity,
    overrides?: Partial<StrategyEngineOptions>
  ): StrategyRecommendation | null {
    const { context, options } = this.buildContext(overrides);
    const contributions = this.evaluateStrategies(opportunity, context, options);

    if (!contributions.length) {
      this.logger.debug('No strategy contributions generated for opportunity', {
        opportunityId: opportunity.id,
      });
      return null;
    }

    const composition = this.composer.combine(opportunity, context, contributions, options);
    if (!composition) {
      this.logger.debug('Strategy composition returned null', { opportunityId: opportunity.id });
      return null;
    }

    this.lastRecommendations.set(
      composition.recommendation.opportunityId ?? composition.recommendation.id,
      composition.recommendation
    );

    const payload: StrategyEngineEventPayload = {
      opportunity,
      recommendation: composition.recommendation,
      contributions: composition.contributions,
      context,
      options,
    };

    this.eventBus.emit(STRATEGY_ENGINE_EVENTS.evaluated, payload);
    this.eventBus.emit(STRATEGY_ENGINE_EVENTS.recommendation, payload);

    return composition.recommendation;
  }

  public evaluateOpportunities(
    opportunities: BettingOpportunity[],
    overrides?: Partial<StrategyEngineOptions>
  ): StrategyRecommendation[] {
    return opportunities
      .map(opportunity => this.evaluateOpportunity(opportunity, overrides))
      .filter((recommendation): recommendation is StrategyRecommendation =>
        Boolean(recommendation)
      );
  }

  public onRecommendation(listener: StrategyEngineListener): () => void {
    return this.eventBus.on(STRATEGY_ENGINE_EVENTS.recommendation, payload => {
      listener(payload as StrategyEngineEventPayload);
    });
  }

  public onEvaluation(listener: StrategyEngineListener): () => void {
    return this.eventBus.on(STRATEGY_ENGINE_EVENTS.evaluated, payload => {
      listener(payload as StrategyEngineEventPayload);
    });
  }

  private mergeOptions(overrides?: Partial<StrategyEngineOptions>): StrategyEngineOptions {
    const base = this.options ? { ...this.options } : DEFAULT_ENGINE_OPTIONS;
    const merged = {
      ...DEFAULT_ENGINE_OPTIONS,
      ...base,
      ...overrides,
    };

    const rawBankroll = ensureFinite(merged.bankroll, DEFAULT_ENGINE_OPTIONS.bankroll);
    const bankroll = rawBankroll > 0 ? rawBankroll : DEFAULT_ENGINE_OPTIONS.bankroll;
    const minStake = clampNumber(
      ensureFinite(merged.minStake, DEFAULT_ENGINE_OPTIONS.minStake),
      0.01,
      Number.MAX_SAFE_INTEGER
    );
    const maxStakeFraction = clampNumber(
      ensureFinite(merged.maxStakeFraction, DEFAULT_ENGINE_OPTIONS.maxStakeFraction),
      0.01,
      1
    );
    const computedMaxStake = bankroll * maxStakeFraction;
    const maxStake = ensureFinite(
      merged.maxStake != null ? merged.maxStake : computedMaxStake,
      computedMaxStake
    );
    const clampedMaxStake = Math.max(minStake, maxStake);

    return {
      ...merged,
      bankroll,
      minStake,
      maxStake: clampedMaxStake,
      maxStakeFraction,
      maxExposureFraction: clampNumber(
        ensureFinite(merged.maxExposureFraction, DEFAULT_ENGINE_OPTIONS.maxExposureFraction),
        0.01,
        1
      ),
      minConfidence: clampNumber(
        ensureFinite(merged.minConfidence, DEFAULT_ENGINE_OPTIONS.minConfidence),
        0,
        1
      ),
      clampConfidence: merged.clampConfidence,
    };
  }

  private getComposerOptions(): StrategyComposerOptions {
    return {
      minConfidence: this.options.minConfidence,
      minStake: this.options.minStake,
      maxStake: this.options.maxStake,
      maxStakeFraction: this.options.maxStakeFraction,
      maxExposureFraction: this.options.maxExposureFraction,
      clampConfidence: this.options.clampConfidence,
    };
  }

  private buildContext(overrides?: Partial<StrategyEngineOptions>): {
    context: StrategyEvaluationContext;
    options: StrategyComposerOptions;
  } {
    const merged = this.mergeOptions(overrides);
    const context: StrategyEvaluationContext = {
      bankroll: merged.bankroll,
      environment: merged.environment,
      riskTolerance: merged.riskTolerance,
      timestamp: createTimestamp(),
    };

    const options: StrategyComposerOptions = {
      minConfidence: merged.minConfidence,
      minStake: merged.minStake,
      maxStake: merged.maxStake,
      maxStakeFraction: merged.maxStakeFraction,
      maxExposureFraction: merged.maxExposureFraction,
      clampConfidence: merged.clampConfidence,
    };

    return { context, options };
  }

  private evaluateStrategies(
    opportunity: BettingOpportunity,
    context: StrategyEvaluationContext,
    options: StrategyComposerOptions
  ): StrategyContribution[] {
    const contributions: StrategyContribution[] = [];

    for (const definition of this.orderedStrategies) {
      if (definition.guard && !definition.guard(opportunity, context, options)) {
        continue;
      }

      const recommendation = definition.evaluate(opportunity, context, options);
      if (!recommendation) {
        continue;
      }

      const normalized = this.normalizeRecommendation(
        definition,
        recommendation,
        opportunity,
        context,
        options
      );

      const confidenceThreshold = definition.minConfidence ?? options.minConfidence;
      if (normalized.confidence < confidenceThreshold) {
        continue;
      }

      contributions.push({
        id: definition.id,
        name: definition.name,
        priority: definition.priority ?? 0,
        weight: definition.weight ?? 1,
        recommendation: normalized,
      });
    }

    return contributions;
  }

  private normalizeRecommendation(
    definition: StrategyDefinition,
    recommendation: StrategyRecommendation,
    opportunity: BettingOpportunity,
    context: StrategyEvaluationContext,
    options: StrategyComposerOptions
  ): StrategyRecommendation {
    const timestamp = recommendation.timestamp ?? createTimestamp();
    const confidence = clampNumber(
      ensureFinite(recommendation.confidence ?? options.minConfidence, options.minConfidence),
      0,
      1
    );

    const fallbackExpectedValue = ensureFinite(
      opportunity.expectedValue ??
        opportunity.edge ??
        recommendation.parameters?.expectedValue ??
        0,
      0
    );

    const stake = clampNumber(
      ensureFinite(
        recommendation.parameters?.stake ?? recommendation.recommendedStake ?? options.minStake,
        options.minStake
      ),
      options.minStake,
      options.maxStake
    );

    const expectedValue = ensureFinite(
      recommendation.parameters?.expectedValue ?? fallbackExpectedValue,
      fallbackExpectedValue
    );

    return {
      ...recommendation,
      id: recommendation.id ?? `${definition.id}:${opportunity.id}`,
      strategyId: recommendation.strategyId ?? definition.id,
      type: recommendation.type ?? opportunity.type ?? 'OVER',
      timestamp,
      lastUpdate: recommendation.lastUpdate ?? timestamp,
      confidence,
      parameters: {
        stake: roundTo(stake, 2),
        expectedValue: roundTo(expectedValue, 3),
      },
      recommendedStake: roundTo(stake, 2),
      opportunityId: recommendation.opportunityId ?? opportunity.id,
      hedgingRecommendations: recommendation.hedgingRecommendations ?? [],
      riskAssessment:
        recommendation.riskAssessment ??
        this.createRiskAssessment(definition.id, opportunity, confidence, context, options),
      metadata: recommendation.metadata ?? {
        createdAt: timestamp,
        updatedAt: timestamp,
        version: '1.0.0',
      },
    };
  }

  private createRiskAssessment(
    strategyId: string,
    opportunity: BettingOpportunity,
    confidence: number,
    context: StrategyEvaluationContext,
    options: StrategyComposerOptions
  ) {
    const baseVolatility = opportunity.analysis?.marketVolatility ?? 1 - confidence;
    const maxExposure = roundTo(context.bankroll * options.maxExposureFraction, 2);

    return {
      id: `${strategyId}:risk:${opportunity.id}`,
      timestamp: createTimestamp(),
      riskLevel: roundTo(1 - confidence, 2),
      confidenceScore: roundTo(confidence, 2),
      maxExposure,
      volatilityScore: roundTo(baseVolatility, 2),
      correlationFactors: opportunity.analysis?.riskFactors ?? [],
    };
  }

  private registerDefaultStrategies(): void {
    const defaults = [this.createBaselineStrategy(), this.createEdgeStrategy()];
    defaults.forEach(strategy => this.registerStrategy(strategy));
  }

  private createBaselineStrategy(): StrategyDefinition {
    return {
      id: 'core:baseline',
      name: 'Baseline Confidence Strategy',
      priority: 10,
      weight: 1,
      minConfidence: this.options.minConfidence,
      evaluate: (opportunity, context, options) => {
        const confidence = clampNumber(
          ensureFinite(opportunity.confidence ?? options.minConfidence, options.minConfidence),
          options.minConfidence,
          1
        );
        const stake = clampNumber(
          context.bankroll * options.maxStakeFraction * confidence,
          options.minStake,
          options.maxStake
        );
        const expectedValue = ensureFinite(opportunity.expectedValue ?? opportunity.edge ?? 0, 0);
        const timestamp = createTimestamp();

        return {
          id: `core:baseline:${opportunity.id}`,
          strategyId: 'core:baseline',
          type: opportunity.type ?? (expectedValue >= 0 ? 'OVER' : 'UNDER'),
          confidence,
          timestamp,
          parameters: {
            stake: roundTo(stake, 2),
            expectedValue: roundTo(expectedValue, 3),
          },
          status: 'active',
          lastUpdate: timestamp,
          recommendedStake: roundTo(stake, 2),
          opportunityId: opportunity.id,
          hedgingRecommendations: opportunity.analysis?.riskFactors?.length
            ? ['Monitor correlated markets']
            : [],
        };
      },
    };
  }

  private createEdgeStrategy(): StrategyDefinition {
    return {
      id: 'core:edge-adjustment',
      name: 'Edge Adjustment Strategy',
      priority: 20,
      weight: 0.75,
      minConfidence: this.options.minConfidence * 0.9,
      guard: opportunity => typeof opportunity.edge === 'number',
      evaluate: (opportunity, context, options) => {
        const edge = ensureFinite(opportunity.edge ?? 0, 0);
        if (Math.abs(edge) < 0.01) {
          return null;
        }

        const baseConfidence = ensureFinite(
          opportunity.confidence ?? options.minConfidence,
          options.minConfidence
        );
        const adjustedConfidence = clampNumber(
          baseConfidence + clampNumber(Math.abs(edge) / 100, 0, 0.15),
          options.minConfidence,
          1
        );

        const baseStake = context.bankroll * options.maxStakeFraction * adjustedConfidence;
        const stakeMultiplier = 1 + clampNumber(Math.abs(edge) / 50, 0, 0.4);
        const stake = clampNumber(baseStake * stakeMultiplier, options.minStake, options.maxStake);

        const expectedValue = ensureFinite(opportunity.expectedValue ?? edge, edge);
        const timestamp = createTimestamp();

        return {
          id: `core:edge:${opportunity.id}`,
          strategyId: 'core:edge-adjustment',
          type: opportunity.type ?? (edge >= 0 ? 'OVER' : 'UNDER'),
          confidence: adjustedConfidence,
          timestamp,
          parameters: {
            stake: roundTo(stake, 2),
            expectedValue: roundTo(expectedValue, 3),
          },
          status: 'active',
          lastUpdate: timestamp,
          recommendedStake: roundTo(stake, 2),
          opportunityId: opportunity.id,
          hedgingRecommendations:
            edge > 0.1
              ? ['Consider partial hedge to protect upside']
              : edge < -0.1
              ? ['Evaluate hedge due to negative edge']
              : [],
        };
      },
    };
  }

  private sortStrategies(): void {
    this.orderedStrategies.sort((a, b) => {
      const priorityDiff = (a.priority ?? 0) - (b.priority ?? 0);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      return a.id.localeCompare(b.id);
    });
  }
}

export default StrategyEngine;
