import { useState, useEffect, useCallback, useRef } from 'react';
import { masterServiceRegistry } from '../services/MasterServiceRegistry';

interface BettingState {
  isConnected: boolean;
  opportunities: BettingOpportunity[];
  activeBets: ActiveBet[];
  balance: number;
  dailyProfit: number;
  settings: BettingSettings;
}

interface BettingOpportunity {
  id: string;
  sport: string;
  game: string;
  market: string;
  side: string;
  odds: number;
  impliedProbability: number;
  trueProbability: number;
  value: number;
  confidence: number;
  recommendedStake: number;
  maxStake: number;
  bookmaker: string;
  timestamp: Date;
  expiresAt: Date;
}

interface ActiveBet {
  id: string;
  sport: string;
  game: string;
  market: string;
  side: string;
  odds: number;
  stake: number;
  potentialWin: number;
  placedAt: Date;
  status: 'pending' | 'won' | 'lost' | 'cancelled' | 'pushed';
  currentOdds?: number;
  cashoutValue?: number;
}

interface BettingSettings {
  bankroll: number;
  maxStakePercentage: number;
  minValue: number;
  minConfidence: number;
  autoPlaceBets: boolean;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  sports: string[];
  markets: string[];
  bookmakers: string[];
}

export const useUnifiedBetting = () => {
  const [state, setState] = useState<BettingState>({
    isConnected: false,
    opportunities: [],
    activeBets: [],
    balance: 0,
    dailyProfit: 0,
    settings: {
      bankroll: 1000,
      maxStakePercentage: 0.05,
      minValue: 0.03,
      minConfidence: 0.6,
      autoPlaceBets: false,
      riskLevel: 'moderate',
      sports: ['nfl', 'nba', 'mlb', 'nhl'],
      markets: ['spread', 'total', 'moneyline'],
      bookmakers: [],
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsSubscriptions = useRef<string[]>([]);

  const initializeBetting = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const bettingService = masterServiceRegistry.getService('betting');
      if (!bettingService) {
        throw new Error('Betting service not available');
      }

      // Get initial data
      const [opportunities, activeBets, metrics, config] = await Promise.all([
        bettingService.getBettingOpportunities(),
        bettingService.getActiveBets?.() || [],
        bettingService.getBettingMetrics(),
        bettingService.getConfig(),
      ]);

      setState(prev => ({
        ...prev,
        opportunities: opportunities || [],
        activeBets: activeBets || [],
        balance: metrics?.balance || 0,
        dailyProfit: metrics?.dailyProfit || 0,
        settings: { ...prev.settings, ...config },
        isConnected: true,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize betting';
      setError(errorMessage);
      console.error('Betting initialization error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const placeBet = useCallback(async (opportunity: BettingOpportunity, customStake?: number) => {
    try {
      const bettingService = masterServiceRegistry.getService('betting');
      if (!bettingService) {
        throw new Error('Betting service not available');
      }

      const stake = customStake || opportunity.recommendedStake;

      const betData = {
        opportunityId: opportunity.id,
        sport: opportunity.sport,
        game: opportunity.game,
        market: opportunity.market,
        side: opportunity.side,
        odds: opportunity.odds,
        stake,
        bookmaker: opportunity.bookmaker,
      };

      const success = await bettingService.placeBet(betData);

      if (success) {
        // Remove opportunity from list
        setState(prev => ({
          ...prev,
          opportunities: prev.opportunities.filter(opp => opp.id !== opportunity.id),
        }));

        // Refresh active bets
        await refreshActiveBets();
      }

      return success;
    } catch (err) {
      console.error('Failed to place bet:', err);
      throw err;
    }
  }, []);

  const cancelBet = useCallback(async (betId: string) => {
    try {
      const bettingService = masterServiceRegistry.getService('betting');
      if (!bettingService?.cancelBet) {
        throw new Error('Bet cancellation not available');
      }

      const success = await bettingService.cancelBet(betId);

      if (success) {
        setState(prev => ({
          ...prev,
          activeBets: prev.activeBets.filter(bet => bet.id !== betId),
        }));
      }

      return success;
    } catch (err) {
      console.error('Failed to cancel bet:', err);
      throw err;
    }
  }, []);

  const cashoutBet = useCallback(async (betId: string) => {
    try {
      const bettingService = masterServiceRegistry.getService('betting');
      if (!bettingService?.cashoutBet) {
        throw new Error('Bet cashout not available');
      }

      const result = await bettingService.cashoutBet(betId);

      if (result.success) {
        setState(prev => ({
          ...prev,
          activeBets: prev.activeBets.map(bet =>
            bet.id === betId ? { ...bet, status: 'won' as const, potentialWin: result.amount } : bet
          ),
          balance: prev.balance + result.amount,
        }));
      }

      return result;
    } catch (err) {
      console.error('Failed to cashout bet:', err);
      throw err;
    }
  }, []);

  const updateSettings = useCallback(
    async (newSettings: Partial<BettingSettings>) => {
      try {
        const bettingService = masterServiceRegistry.getService('betting');
        if (!bettingService) {
          return false;
        }

        const updatedSettings = { ...state.settings, ...newSettings };
        bettingService.setConfig(updatedSettings);

        setState(prev => ({
          ...prev,
          settings: updatedSettings,
        }));

        return true;
      } catch (err) {
        console.error('Failed to update betting settings:', err);
        return false;
      }
    },
    [state.settings]
  );

  const refreshOpportunities = useCallback(async () => {
    try {
      const bettingService = masterServiceRegistry.getService('betting');
      if (!bettingService) return;

      const opportunities = await bettingService.getBettingOpportunities();
      setState(prev => ({
        ...prev,
        opportunities: opportunities || [],
      }));
    } catch (err) {
      console.error('Failed to refresh opportunities:', err);
    }
  }, []);

  const refreshActiveBets = useCallback(async () => {
    try {
      const bettingService = masterServiceRegistry.getService('betting');
      if (!bettingService?.getActiveBets) return;

      const activeBets = await bettingService.getActiveBets();
      setState(prev => ({
        ...prev,
        activeBets: activeBets || [],
      }));
    } catch (err) {
      console.error('Failed to refresh active bets:', err);
    }
  }, []);

  const subscribeToUpdates = useCallback(() => {
    try {
      const wsService = masterServiceRegistry.getService('websocket');
      if (!wsService) return;

      // Subscribe to betting opportunities
      const oppSub = wsService.subscribe('betting_opportunities', (data: BettingOpportunity[]) => {
        setState(prev => ({
          ...prev,
          opportunities: data || [],
        }));
      });

      // Subscribe to bet updates
      const betSub = wsService.subscribe('bet_update', (data: any) => {
        setState(prev => ({
          ...prev,
          activeBets: prev.activeBets.map(bet =>
            bet.id === data.betId ? { ...bet, ...data.updates } : bet
          ),
        }));
      });

      // Subscribe to balance updates
      const balanceSub = wsService.subscribe('balance_update', (data: any) => {
        setState(prev => ({
          ...prev,
          balance: data.balance,
          dailyProfit: data.dailyProfit,
        }));
      });

      wsSubscriptions.current = [oppSub, betSub, balanceSub];
    } catch (err) {
      console.error('Failed to subscribe to betting updates:', err);
    }
  }, []);

  const unsubscribeFromUpdates = useCallback(() => {
    try {
      const wsService = masterServiceRegistry.getService('websocket');
      if (wsService && wsSubscriptions.current.length > 0) {
        wsSubscriptions.current.forEach(sub => wsService.unsubscribe(sub));
        wsSubscriptions.current = [];
      }
    } catch (err) {
      console.error('Failed to unsubscribe from betting updates:', err);
    }
  }, []);

  const calculateOptimalStake = useCallback(
    (opportunity: BettingOpportunity, customBankroll?: number) => {
      const bankroll = customBankroll || state.settings.bankroll;
      const maxStake = bankroll * state.settings.maxStakePercentage;

      // Kelly Criterion calculation
      const edge = opportunity.value;
      const odds = opportunity.odds;
      const kellyStake = (edge * bankroll) / (odds - 1);

      // Apply conservative factor based on risk level
      const riskFactors = {
        conservative: 0.25,
        moderate: 0.5,
        aggressive: 0.75,
      };

      const conservativeKelly = kellyStake * riskFactors[state.settings.riskLevel];

      return Math.min(conservativeKelly, maxStake, opportunity.maxStake);
    },
    [state.settings]
  );

  const getFilteredOpportunities = useCallback(
    (filters?: { sport?: string; market?: string; minValue?: number; minConfidence?: number }) => {
      return state.opportunities.filter(opp => {
        if (filters?.sport && opp.sport !== filters.sport) return false;
        if (filters?.market && opp.market !== filters.market) return false;
        if (filters?.minValue && opp.value < filters.minValue) return false;
        if (filters?.minConfidence && opp.confidence < filters.minConfidence) return false;
        return true;
      });
    },
    [state.opportunities]
  );

  useEffect(() => {
    initializeBetting();
    subscribeToUpdates();

    return () => {
      unsubscribeFromUpdates();
    };
  }, [initializeBetting, subscribeToUpdates, unsubscribeFromUpdates]);

  return {
    ...state,
    loading,
    error,
    placeBet,
    cancelBet,
    cashoutBet,
    updateSettings,
    refreshOpportunities,
    refreshActiveBets,
    calculateOptimalStake,
    getFilteredOpportunities,
    initializeBetting,
  };
};

export default useUnifiedBetting;
