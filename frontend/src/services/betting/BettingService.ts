/**
 * Betting Service - Core betting operations for A1Betting Platform
 * Handles Kelly Criterion, portfolio optimization, and bet tracking
 */

import ApiService from '../unified/ApiService';
import MLService, { EnsemblePrediction } from '../ml/MLService';

export interface BettingOpportunity {
  id: string;
  gameId: string;
  sport: string;
  league: string;
  teams: string[];
  market: string;
  odds: number;
  bookmaker: string;
  prediction: EnsemblePrediction;
  kellyStake: number;
  expectedROI: number;
  expectedProfit: number;
  confidence: number;
  risk: 'low' | 'medium' | 'high';
  value: number;
  impliedProbability: number;
  modelProbability: number;
  edge: number;
  timestamp: Date;
  expiresAt: Date;
}

export interface BetPlacement {
  id: string;
  opportunityId: string;
  stake: number;
  odds: number;
  potentialPayout: number;
  bookmaker: string;
  status: 'pending' | 'placed' | 'won' | 'lost' | 'void' | 'cashed_out';
  placedAt: Date;
  settledAt?: Date;
  profit?: number;
  metadata?: Record<string, any>;
}

export interface KellyCriterion {
  optimalStake: number;
  kellyFraction: number;
  fractionalKelly: number;
  expectedGrowth: number;
  riskAdjustedStake: number;
  maxStake: number;
  confidence: number;
}

export interface PortfolioStats {
  totalStaked: number;
  totalReturns: number;
  netProfit: number;
  roi: number;
  winRate: number;
  avgOdds: number;
  avgStake: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalBets: number;
  activeBets: number;
  variance: number;
}

export interface RiskProfile {
  maxBankrollPercentage: number;
  kellyMultiplier: number;
  maxSingleBet: number;
  maxDailyRisk: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  diversificationRequired: boolean;
  maxCorrelatedBets: number;
}

class BettingService {
  private opportunities: Map<string, BettingOpportunity> = new Map();
  private activeBets: Map<string, BetPlacement> = new Map();
  private riskProfile: RiskProfile = {
    maxBankrollPercentage: 0.25,
    kellyMultiplier: 0.25,
    maxSingleBet: 5000,
    maxDailyRisk: 0.1,
    riskTolerance: 'moderate',
    diversificationRequired: true,
    maxCorrelatedBets: 3,
  };

  async initialize(): Promise<void> {
    try {
      await this.loadOpportunities();
      await this.loadActiveBets();
      await this.loadRiskProfile();
    } catch (error) {
      console.error('BettingService initialization failed:', error);
      throw error;
    }
  }

  async loadOpportunities(): Promise<BettingOpportunity[]> {
    try {
      const response = await ApiService.get<BettingOpportunity[]>('/betting/opportunities');

      this.opportunities.clear();
      response.data.forEach(opportunity => {
        this.opportunities.set(opportunity.id, opportunity);
      });

      return response.data;
    } catch (error) {
      console.error('Failed to load betting opportunities:', error);
      return [];
    }
  }

  async getOpportunities(filters?: {
    sport?: string;
    league?: string;
    market?: string;
    minConfidence?: number;
    maxRisk?: string;
    minValue?: number;
  }): Promise<BettingOpportunity[]> {
    let opportunities = Array.from(this.opportunities.values());

    // Filter expired opportunities
    const now = new Date();
    opportunities = opportunities.filter(opp => opp.expiresAt > now);

    if (filters) {
      if (filters.sport) opportunities = opportunities.filter(o => o.sport === filters.sport);
      if (filters.league) opportunities = opportunities.filter(o => o.league === filters.league);
      if (filters.market) opportunities = opportunities.filter(o => o.market === filters.market);
      if (filters.minConfidence)
        opportunities = opportunities.filter(o => o.confidence >= filters.minConfidence);
      if (filters.maxRisk) {
        const riskLevels = { low: 1, medium: 2, high: 3 };
        const maxLevel = riskLevels[filters.maxRisk as keyof typeof riskLevels];
        opportunities = opportunities.filter(o => riskLevels[o.risk] <= maxLevel);
      }
      if (filters.minValue) opportunities = opportunities.filter(o => o.value >= filters.minValue);
    }

    return opportunities.sort((a, b) => b.expectedROI - a.expectedROI);
  }

  calculateKellyCriterion(
    probability: number,
    odds: number,
    bankroll: number,
    riskMultiplier: number = 0.25
  ): KellyCriterion {
    const q = 1 - probability; // Probability of losing
    const b = odds - 1; // Net odds (profit ratio)

    // Standard Kelly
    const kellyFraction = (probability * b - q) / b;

    // Fractional Kelly based on risk tolerance
    const fractionalKelly = kellyFraction * riskMultiplier;

    // Maximum bet size (based on risk profile)
    const maxStake = Math.min(
      bankroll * this.riskProfile.maxBankrollPercentage,
      this.riskProfile.maxSingleBet
    );

    // Optimal stake
    const optimalStake = Math.max(0, Math.min(bankroll * fractionalKelly, maxStake));

    // Risk-adjusted stake
    const riskAdjustedStake = optimalStake * this.riskProfile.kellyMultiplier;

    // Expected growth rate
    const expectedGrowth =
      probability * Math.log(1 + b * fractionalKelly) + q * Math.log(1 - fractionalKelly);

    return {
      optimalStake: riskAdjustedStake,
      kellyFraction,
      fractionalKelly,
      expectedGrowth,
      riskAdjustedStake,
      maxStake,
      confidence: probability,
    };
  }

  async optimizePortfolio(
    bankroll: number,
    availableOpportunities: BettingOpportunity[]
  ): Promise<{
    selectedBets: Array<{ opportunity: BettingOpportunity; stake: number }>;
    totalStake: number;
    expectedReturn: number;
    expectedROI: number;
    portfolioRisk: number;
  }> {
    try {
      const response = await ApiService.post('/betting/optimize-portfolio', {
        bankroll,
        opportunities: availableOpportunities,
        riskProfile: this.riskProfile,
      });

      return response.data;
    } catch (error) {
      console.error('Failed to optimize portfolio:', error);

      // Fallback to simple Kelly-based selection
      const sorted = availableOpportunities
        .filter(opp => opp.value > 0 && opp.confidence > 0.6)
        .sort((a, b) => b.expectedROI - a.expectedROI)
        .slice(0, 5);

      const selectedBets = sorted.map(opportunity => {
        const kelly = this.calculateKellyCriterion(
          opportunity.modelProbability,
          opportunity.odds,
          bankroll
        );

        return {
          opportunity,
          stake: kelly.optimalStake,
        };
      });

      const totalStake = selectedBets.reduce((sum, bet) => sum + bet.stake, 0);
      const expectedReturn = selectedBets.reduce(
        (sum, bet) => sum + (bet.stake * bet.opportunity.expectedROI) / 100,
        0
      );

      return {
        selectedBets,
        totalStake,
        expectedReturn,
        expectedROI: totalStake > 0 ? (expectedReturn / totalStake) * 100 : 0,
        portfolioRisk: 0.15, // Default risk estimate
      };
    }
  }

  async placeBet(
    opportunityId: string,
    stake: number,
    bookmaker?: string
  ): Promise<BetPlacement | null> {
    try {
      const opportunity = this.opportunities.get(opportunityId);
      if (!opportunity) {
        throw new Error('Opportunity not found');
      }

      // Validate stake against risk limits
      if (stake > this.riskProfile.maxSingleBet) {
        throw new Error('Stake exceeds maximum bet size');
      }

      const response = await ApiService.post<BetPlacement>('/betting/place-bet', {
        opportunityId,
        stake,
        bookmaker: bookmaker || opportunity.bookmaker,
      });

      this.activeBets.set(response.data.id, response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to place bet:', error);
      return null;
    }
  }

  async loadActiveBets(): Promise<BetPlacement[]> {
    try {
      const response = await ApiService.get<BetPlacement[]>('/betting/active-bets');

      this.activeBets.clear();
      response.data.forEach(bet => {
        this.activeBets.set(bet.id, bet);
      });

      return response.data;
    } catch (error) {
      console.error('Failed to load active bets:', error);
      return [];
    }
  }

  async getPortfolioStats(): Promise<PortfolioStats> {
    try {
      const response = await ApiService.get<PortfolioStats>('/betting/portfolio-stats');
      return response.data;
    } catch (error) {
      console.error('Failed to get portfolio stats:', error);

      // Return default stats
      return {
        totalStaked: 0,
        totalReturns: 0,
        netProfit: 0,
        roi: 0,
        winRate: 0,
        avgOdds: 0,
        avgStake: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        totalBets: 0,
        activeBets: this.activeBets.size,
        variance: 0,
      };
    }
  }

  async loadRiskProfile(): Promise<void> {
    try {
      const response = await ApiService.get<RiskProfile>('/betting/risk-profile');
      this.riskProfile = { ...this.riskProfile, ...response.data };
    } catch (error) {
      console.error('Failed to load risk profile:', error);
    }
  }

  async updateRiskProfile(updates: Partial<RiskProfile>): Promise<boolean> {
    try {
      const updatedProfile = { ...this.riskProfile, ...updates };
      await ApiService.put('/betting/risk-profile', updatedProfile);
      this.riskProfile = updatedProfile;
      return true;
    } catch (error) {
      console.error('Failed to update risk profile:', error);
      return false;
    }
  }

  getRiskProfile(): RiskProfile {
    return { ...this.riskProfile };
  }

  async cashOut(betId: string): Promise<boolean> {
    try {
      await ApiService.post(`/betting/bets/${betId}/cash-out`);

      // Update local bet status
      const bet = this.activeBets.get(betId);
      if (bet) {
        bet.status = 'cashed_out';
      }

      return true;
    } catch (error) {
      console.error('Failed to cash out bet:', error);
      return false;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await ApiService.get('/betting/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  getStats(): {
    totalOpportunities: number;
    activeBets: number;
    avgConfidence: number;
    riskProfile: RiskProfile;
  } {
    const opportunities = Array.from(this.opportunities.values());
    const avgConfidence =
      opportunities.reduce((sum, o) => sum + o.confidence, 0) / opportunities.length;

    return {
      totalOpportunities: opportunities.length,
      activeBets: this.activeBets.size,
      avgConfidence: avgConfidence || 0,
      riskProfile: this.riskProfile,
    };
  }
}

export default new BettingService();
