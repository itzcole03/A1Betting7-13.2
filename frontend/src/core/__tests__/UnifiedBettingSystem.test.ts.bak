import { masterServiceRegistry } from '../../services/MasterServiceRegistry';
import {
  BettingOddsService,
  BettingRiskService,
  BettingStrategyService,
  BettingSystemOpportunity,
  createUnifiedBettingSystem,
} from '../UnifiedBettingSystem';

describe('UnifiedBettingSystem', () => {
  const REGISTERED_NAMES = ['betting.odds', 'betting.strategy', 'betting.risk', 'betting.system'];

  afterEach(() => {
    REGISTERED_NAMES.forEach(name => masterServiceRegistry.unregister(name));
  });

  it('registers subservices with the MasterServiceRegistry during initialization', async () => {
    const system = createUnifiedBettingSystem({ registry: masterServiceRegistry });

    await system.initialize();

    REGISTERED_NAMES.forEach(name => {
      expect(masterServiceRegistry.has(name)).toBe(true);
    });

    system.dispose();

    REGISTERED_NAMES.forEach(name => {
      expect(masterServiceRegistry.has(name)).toBe(false);
    });
  });

  it('produces ranked betting decisions with risk guidance', async () => {
    const opportunities: BettingSystemOpportunity[] = [
      {
        id: 'opp-1',
        sport: 'NBA',
        market: 'Points Over 27.5',
        offeredOdds: 2.1,
        modelProbability: 0.6,
        confidence: 0.68,
        sampleSize: 450,
        bookmaker: 'SharpBooks',
      },
      {
        id: 'opp-2',
        sport: 'NBA',
        market: 'Rebounds Over 11.5',
        offeredOdds: 1.9,
        modelProbability: 0.55,
        confidence: 0.62,
        sampleSize: 320,
        bookmaker: 'ValueSports',
      },
      {
        id: 'opp-3',
        sport: 'NBA',
        market: 'Assists Over 8.5',
        offeredOdds: 2.25,
        modelProbability: 0.48,
        confidence: 0.5,
        sampleSize: 180,
        bookmaker: 'OddsCo',
      },
    ];

    const system = createUnifiedBettingSystem({ registry: masterServiceRegistry });
    await system.initialize();

    const decisions = system.evaluateOpportunities(opportunities, {
      bankroll: 1500,
      limit: 2,
    });

    expect(decisions).toHaveLength(2);
    expect(decisions[0].rank).toBe(1);
    expect(decisions[1].rank).toBe(2);

    const edges = decisions.map(decision => decision.edge);
    expect(edges[0]).toBeGreaterThanOrEqual(edges[1]);

    decisions.forEach(decision => {
      expect(decision.risk.recommendedStake).toBeGreaterThan(0);
      expect(decision.risk.recommendedStake).toBeLessThanOrEqual(decision.risk.maxStake);
      expect(['low', 'medium', 'high']).toContain(decision.risk.level);
    });

    system.dispose();
  });

  it('pipes opportunities through injected subservices', async () => {
    class InMemoryRegistry {
      private services = new Map<string, unknown>();

      registerService(name: string, service: unknown) {
        this.services.set(name, service);
      }

      getService<T = unknown>(name: string): T | null {
        return (this.services.get(name) as T) ?? null;
      }

      unregister(name: string): boolean {
        return this.services.delete(name);
      }

      has(name: string): boolean {
        return this.services.has(name);
      }
    }

    const registry = new InMemoryRegistry();

    const oddsMock: BettingOddsService = {
      evaluate: jest.fn().mockReturnValue({
        decimalOdds: 2.0,
        impliedProbability: 0.5,
        modelProbability: 0.6,
        edge: 0.1,
        fairOdds: 1.6667,
        expectedValue: 0.2,
      }),
    };

    const strategyMock: BettingStrategyService = {
      rank: jest.fn(normalized =>
        normalized.map(item => ({
          ...item,
          score: 25,
        }))
      ),
    };

    const riskMock: BettingRiskService = {
      assess: jest.fn().mockReturnValue({
        level: 'low',
        recommendedStake: 50,
        maxStake: 100,
        notes: 'test-risk',
      }),
    };

    const system = createUnifiedBettingSystem({
      registry,
      oddsService: oddsMock,
      strategyService: strategyMock,
      riskService: riskMock,
      registerWithRegistry: true,
      defaultBankroll: 500,
    });

    await system.initialize();

    const opportunity: BettingSystemOpportunity = {
      id: 'custom-1',
      sport: 'NFL',
      market: 'Passing Yards Over 275.5',
      offeredOdds: +120,
      modelProbability: 0.58,
      confidence: 0.63,
      sampleSize: 220,
      bookmaker: 'TestBook',
    };

    const decisions = system.evaluateOpportunities([opportunity], { bankroll: 500 });

    expect(oddsMock.evaluate).toHaveBeenCalledTimes(1);
    expect(strategyMock.rank).toHaveBeenCalledTimes(1);
    expect(riskMock.assess).toHaveBeenCalledTimes(1);

    expect(decisions).toHaveLength(1);
    expect(decisions[0].risk.level).toBe('low');
  });
});
