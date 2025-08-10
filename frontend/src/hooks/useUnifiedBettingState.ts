import { useEffect, useState } from 'react';

export interface BettingOpportunity {
  id: string;
  sport: string;
  market: string;
  selection: string;
  odds: number;
  edge: number;
  confidence: number;
  recommended_stake: number;
  max_stake: number;
  expected_value: number;
  bookmaker: string;
  game_time: string;
  edgeColor?: string;
  confidenceColor?: string;
}

export interface BetSlipItem {
  opportunityId: string;
  opportunity: BettingOpportunity;
  stake: number;
  potentialPayout: number;
  addedAt: string;
}

export interface BettingFiltersState {
  sport: string;
  market: string;
  minEdge: number;
  minConfidence: number;
}

export function useUnifiedBettingState() {
  const [activeTab, setActiveTab] = useState<string>('opportunities');
  const [opportunities, setOpportunities] = useState<BettingOpportunity[]>([]);
  const [betSlip, setBetSlip] = useState<BetSlipItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BettingFiltersState>({
    sport: 'all',
    market: 'all',
    minEdge: 5,
    minConfidence: 70,
  });

  // Mock data for demonstration
  useEffect(() => {
    const mockOpportunities: BettingOpportunity[] = [
      {
        id: 'opp-1',
        sport: 'MLB',
        market: 'Player Hits',
        selection: 'Mookie Betts Over 1.5 Hits',
        odds: 2.1,
        edge: 8.5,
        confidence: 82,
        recommended_stake: 150,
        max_stake: 500,
        expected_value: 12.75,
        bookmaker: 'DraftKings',
        game_time: '2025-01-05T19:00:00Z',
        edgeColor: 'text-yellow-600 bg-yellow-100',
        confidenceColor: 'text-green-600 bg-green-100',
      },
      {
        id: 'opp-2',
        sport: 'MLB',
        market: 'Player RBIs',
        selection: 'Ronald Acuña Jr. Over 0.5 RBIs',
        odds: 1.85,
        edge: 12.3,
        confidence: 89,
        recommended_stake: 200,
        max_stake: 750,
        expected_value: 24.6,
        bookmaker: 'FanDuel',
        game_time: '2025-01-05T19:30:00Z',
        edgeColor: 'text-green-600 bg-green-100',
        confidenceColor: 'text-green-600 bg-green-100',
      },
      {
        id: 'opp-3',
        sport: 'MLB',
        market: 'Team Total',
        selection: 'Dodgers Over 4.5 Runs',
        odds: 1.92,
        edge: 6.8,
        confidence: 75,
        recommended_stake: 100,
        max_stake: 400,
        expected_value: 6.8,
        bookmaker: 'BetMGM',
        game_time: '2025-01-05T20:00:00Z',
        edgeColor: 'text-yellow-600 bg-yellow-100',
        confidenceColor: 'text-yellow-600 bg-yellow-100',
      },
    ];
    setOpportunities(mockOpportunities);
    // Patch: Add mock bet slip items with correct shape
    setBetSlip([
      {
        opportunityId: 'opp-1',
        opportunity: mockOpportunities[0],
        stake: 100,
        potentialPayout: 110,
        addedAt: new Date().toISOString(),
      },
      {
        opportunityId: 'opp-2',
        opportunity: mockOpportunities[1],
        stake: 100,
        potentialPayout: 85,
        addedAt: new Date().toISOString(),
      },
    ]);
  }, []);

  const addToBetSlip = (opportunity: BettingOpportunity) => {
    const newItem: BetSlipItem = {
      opportunityId: opportunity.id,
      opportunity,
      stake: opportunity.recommended_stake,
      potentialPayout: opportunity.recommended_stake * (opportunity.odds - 1),
      addedAt: new Date().toISOString(),
    };
    setBetSlip(prev => [...prev, newItem]);
  };

  const removeFromBetSlip = (opportunityId: string) => {
    setBetSlip(prev => prev.filter(item => item.opportunityId !== opportunityId));
  };

  const getOpportunityById = (id: string): BettingOpportunity | undefined => {
    return opportunities.find(opp => opp.id === id);
  };

  const filteredOpportunities: BettingOpportunity[] = opportunities.filter(opp => {
    if (filters.sport !== 'all' && opp.sport !== filters.sport) return false;
    if (filters.market !== 'all' && opp.market !== filters.market) return false;
    if (opp.edge < filters.minEdge) return false;
    if (opp.confidence < filters.minConfidence) return false;
    return true;
  });

  return {
    activeTab,
    setActiveTab,
    opportunities,
    betSlip,
    loading,
    error,
    setError,
    filters,
    setFilters,
    addToBetSlip,
    removeFromBetSlip,
    getOpportunityById,
    filteredOpportunities,
  };
}
