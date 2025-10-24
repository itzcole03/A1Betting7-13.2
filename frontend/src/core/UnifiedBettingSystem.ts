import { MasterServiceRegistry, masterServiceRegistry } from '../services/MasterServiceRegistry';

type RegistryLike = Pick<
  MasterServiceRegistry,
  'registerService' | 'getService' | 'unregister' | 'has'
> & {
  registerService(name: string, service: unknown): void;
  getService<T = unknown>(name: string): T | null;
  unregister(name: string): boolean;
  has(name: string): boolean;
};

export interface BettingSystemOpportunity {
  id: string;
  sport: string;
  market: string;
  offeredOdds: number;
  modelProbability: number; // 0-1 probability of success from internal models
  confidence?: number; // 0-1 confidence weight
  sampleSize?: number; // number of historical samples underpinning projection
  bookmaker?: string;
  metadata?: Record<string, unknown>;
}

export interface OddsEvaluation {
  decimalOdds: number;
  impliedProbability: number;
  modelProbability: number;
  edge: number;
  fairOdds: number;
  expectedValue: number;
}

export interface StrategyRankedOpportunity {
  opportunity: BettingSystemOpportunity;
  odds: OddsEvaluation;
  score: number;
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high';
  recommendedStake: number;
  maxStake: number;
  notes?: string;
}

export interface EvaluatedBettingDecision {
  id: string;
  sport: string;
  market: string;
  bookmaker?: string;
  edge: number;
  fairOdds: number;
  impliedProbability: number;
  modelProbability: number;
  score: number;
  rank: number;
  risk: RiskAssessment;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface EvaluateOptions {
  bankroll?: number;
  limit?: number;
  minimumEdge?: number;
  timestamp?: Date;
}

export interface BettingOddsService {
  evaluate(opportunity: BettingSystemOpportunity, context: { timestamp: Date }): OddsEvaluation;
}

export interface BettingStrategyService {
  rank(
    opportunities: ReadonlyArray<{ opportunity: BettingSystemOpportunity; odds: OddsEvaluation }>,
    context: { limit?: number; bankroll: number; timestamp: Date }
  ): StrategyRankedOpportunity[];
}

export interface BettingRiskService {
  assess(
    opportunity: StrategyRankedOpportunity,
    context: { bankroll: number; timestamp: Date }
  ): RiskAssessment;
}

export interface UnifiedBettingSystemOptions {
  registry?: RegistryLike;
  oddsService?: BettingOddsService;
  strategyService?: BettingStrategyService;
  riskService?: BettingRiskService;
  registerWithRegistry?: boolean;
  defaultBankroll?: number;
}

const DEFAULT_BANKROLL = 1000;

class DefaultOddsService implements BettingOddsService {
  evaluate(opportunity: BettingSystemOpportunity, context: { timestamp: Date }): OddsEvaluation {
    const decimalOdds = this.toDecimalOdds(opportunity.offeredOdds);
    const impliedProbability = decimalOdds > 0 ? 1 / decimalOdds : 0;
    const modelProbability = this.clampProbability(opportunity.modelProbability);
    const edge = modelProbability - impliedProbability;
    const fairOdds = modelProbability > 0 ? 1 / modelProbability : Number.POSITIVE_INFINITY;
    const expectedValue = decimalOdds * modelProbability - 1;

    return {
      decimalOdds,
      impliedProbability,
      modelProbability,
      edge,
      fairOdds,
      expectedValue,
    };
  }

  private toDecimalOdds(odds: number): number {
    if (!Number.isFinite(odds)) {
      return 0;
    }
    if (odds >= 1.01) {
      return odds;
    }
    if (Math.abs(odds) >= 100) {
      return odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1;
    }
    return Math.max(1.01, 1 / Math.max(odds, 0.0001));
  }

  private clampProbability(value: number): number {
    if (!Number.isFinite(value)) return 0;
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }
}

class DefaultStrategyService implements BettingStrategyService {
  rank(
    opportunities: ReadonlyArray<{ opportunity: BettingSystemOpportunity; odds: OddsEvaluation }>,
    context: { limit?: number; bankroll: number; timestamp: Date }
  ): StrategyRankedOpportunity[] {
    const ranked = opportunities.map(({ opportunity, odds }) => {
      const confidence = this.deriveConfidence(opportunity);
      const sampleAdjustment = this.sampleAdjustment(opportunity.sampleSize);
      const score = odds.edge * 100 + confidence * 25 - sampleAdjustment;
      return {
        opportunity,
        odds,
        score,
      };
    });

    ranked.sort((a, b) => {
      if (b.score === a.score) {
        return b.odds.modelProbability - a.odds.modelProbability;
      }
      return b.score - a.score;
    });

    if (typeof context.limit === 'number') {
      return ranked.slice(0, Math.max(0, context.limit));
    }

    return ranked;
  }

  private deriveConfidence(opportunity: BettingSystemOpportunity): number {
    if (typeof opportunity.confidence === 'number') {
      return Math.min(Math.max(opportunity.confidence, 0), 1);
    }
    return Math.min(Math.max(opportunity.modelProbability, 0), 1);
  }

  private sampleAdjustment(sampleSize?: number): number {
    if (!sampleSize || sampleSize <= 0) {
      return 10;
    }
    if (sampleSize >= 1000) {
      return 0;
    }
    return Math.max(1, 10 - Math.log10(sampleSize + 1) * 2);
  }
}

class DefaultRiskService implements BettingRiskService {
  assess(
    opportunity: StrategyRankedOpportunity,
    context: { bankroll: number; timestamp: Date }
  ): RiskAssessment {
    const bankroll = context.bankroll > 0 ? context.bankroll : DEFAULT_BANKROLL;
    const edge = opportunity.odds.edge;
    const confidence = this.deriveConfidence(opportunity.opportunity);

    let level: RiskAssessment['level'] = 'medium';
    if (edge >= 0.07 && confidence >= 0.6) {
      level = 'low';
    } else if (edge <= 0.02 || confidence < 0.45) {
      level = 'high';
    }

    const baseFraction = Math.min(0.05, Math.max(edge, 0.005));
    const confidenceMultiplier = 0.5 + confidence * 0.75;
    const recommendedStake = Math.max(
      1,
      Math.round(bankroll * baseFraction * confidenceMultiplier)
    );
    const maxStake = Math.max(recommendedStake, Math.round(bankroll * 0.1));

    return {
      level,
      recommendedStake,
      maxStake,
      notes: `edge=${edge.toFixed(3)} confidence=${confidence.toFixed(2)}`,
    };
  }

  private deriveConfidence(opportunity: BettingSystemOpportunity): number {
    if (typeof opportunity.confidence === 'number') {
      return Math.min(Math.max(opportunity.confidence, 0), 1);
    }
    return Math.min(Math.max(opportunity.modelProbability, 0), 1);
  }
}

export class UnifiedBettingSystem {
  private readonly registry: RegistryLike;
  private readonly oddsService: BettingOddsService;
  private readonly strategyService: BettingStrategyService;
  private readonly riskService: BettingRiskService;
  private readonly registeredServiceNames: Set<string> = new Set();
  private readonly registerWithRegistry: boolean;
  private readonly defaultBankroll: number;
  private initialized = false;

  constructor(options?: UnifiedBettingSystemOptions) {
    this.registry = options?.registry ?? masterServiceRegistry;
    this.oddsService = options?.oddsService ?? new DefaultOddsService();
    this.strategyService = options?.strategyService ?? new DefaultStrategyService();
    this.riskService = options?.riskService ?? new DefaultRiskService();
    this.registerWithRegistry = options?.registerWithRegistry ?? true;
    this.defaultBankroll = options?.defaultBankroll ?? DEFAULT_BANKROLL;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.registerWithRegistry) {
      this.registerService('betting.odds', this.oddsService);
      this.registerService('betting.strategy', this.strategyService);
      this.registerService('betting.risk', this.riskService);
      this.registerService('betting.system', this);
    }

    this.initialized = true;
  }

  dispose(): void {
    if (!this.initialized) {
      return;
    }

    for (const name of this.registeredServiceNames) {
      try {
        this.registry.unregister(name);
      } catch {
        // Swallow errors to keep disposal resilient in tests
      }
    }
    this.registeredServiceNames.clear();
    this.initialized = false;
  }

  getServices(): {
    odds: BettingOddsService;
    strategy: BettingStrategyService;
    risk: BettingRiskService;
  } {
    return {
      odds: this.oddsService,
      strategy: this.strategyService,
      risk: this.riskService,
    };
  }

  evaluateOpportunities(
    opportunities: ReadonlyArray<BettingSystemOpportunity>,
    options?: EvaluateOptions
  ): EvaluatedBettingDecision[] {
    if (!this.initialized) {
      throw new Error('UnifiedBettingSystem must be initialized before use');
    }

    if (!opportunities.length) {
      return [];
    }

    const evaluationTimestamp = options?.timestamp ?? new Date();
    const bankroll = options?.bankroll ?? this.defaultBankroll;
    const minimumEdge = options?.minimumEdge ?? 0;

    const normalized = opportunities
      .map(opportunity => {
        const odds = this.oddsService.evaluate(opportunity, { timestamp: evaluationTimestamp });
        return { opportunity, odds };
      })
      .filter(item => item.odds.edge >= minimumEdge);

    if (!normalized.length) {
      return [];
    }

    const ranked = this.strategyService.rank(normalized, {
      bankroll,
      limit: options?.limit,
      timestamp: evaluationTimestamp,
    });

    const limited =
      typeof options?.limit === 'number' ? ranked.slice(0, Math.max(0, options.limit)) : ranked;

    return limited.map((entry, index) => {
      const risk = this.riskService.assess(entry, {
        bankroll,
        timestamp: evaluationTimestamp,
      });
      const confidence = this.deriveConfidence(entry.opportunity);
      return {
        id: entry.opportunity.id,
        sport: entry.opportunity.sport,
        market: entry.opportunity.market,
        bookmaker: entry.opportunity.bookmaker,
        edge: entry.odds.edge,
        fairOdds: entry.odds.fairOdds,
        impliedProbability: entry.odds.impliedProbability,
        modelProbability: entry.odds.modelProbability,
        score: entry.score,
        rank: index + 1,
        risk,
        confidence,
        metadata: entry.opportunity.metadata,
      };
    });
  }

  private registerService(name: string, service: unknown): void {
    try {
      this.registry.registerService(name, service);
      this.registeredServiceNames.add(name);
    } catch {
      // If the registry rejects registration we simply skip tracking it.
    }
  }

  private deriveConfidence(opportunity: BettingSystemOpportunity): number {
    if (typeof opportunity.confidence === 'number') {
      return Math.min(Math.max(opportunity.confidence, 0), 1);
    }
    return Math.min(Math.max(opportunity.modelProbability, 0), 1);
  }
}

export function createUnifiedBettingSystem(
  options?: UnifiedBettingSystemOptions
): UnifiedBettingSystem {
  return new UnifiedBettingSystem(options);
}

export { DefaultOddsService, DefaultRiskService, DefaultStrategyService };

export default UnifiedBettingSystem;
