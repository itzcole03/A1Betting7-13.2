import {
  AlertTriangle,
  BarChart3,
  DollarSign,
  Filter,
  Plus,
  Settings,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

// Types and Interfaces
interface BettingOpportunity {
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
}

interface BetSlipItem {
  opportunity_id: string;
  stake: number;
  potential_win: number;
  status: 'pending' | 'placed' | 'won' | 'lost';
}

const UnifiedBettingInterface: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('opportunities');
  const [opportunities, setOpportunities] = useState<BettingOpportunity[]>([]);
  const [betSlip, setBetSlip] = useState<BetSlipItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [marketFilter, setMarketFilter] = useState<string>('all');
  const [minEdge, setMinEdge] = useState<number>(5);
  const [minConfidence, setMinConfidence] = useState<number>(70);

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
      },
    ];

    setOpportunities(mockOpportunities);
  }, []);

  const getEdgeColor = (edge: number) => {
    if (edge >= 10) return 'text-green-600 bg-green-100';
    if (edge >= 5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const addToBetSlip = (opportunity: BettingOpportunity) => {
    const newItem: BetSlipItem = {
      opportunity_id: opportunity.id,
      stake: opportunity.recommended_stake,
      potential_win: opportunity.recommended_stake * (opportunity.odds - 1),
      status: 'pending',
    };
    setBetSlip(prev => [...prev, newItem]);
  };

  const removeFromBetSlip = (opportunityId: string) => {
    setBetSlip(prev => prev.filter(item => item.opportunity_id !== opportunityId));
  };

  const getOpportunityById = (id: string) => {
    return opportunities.find(opp => opp.id === id);
  };

  const filteredOpportunities = opportunities.filter(opp => {
    if (sportFilter !== 'all' && opp.sport !== sportFilter) return false;
    if (marketFilter !== 'all' && opp.market !== marketFilter) return false;
    if (opp.edge < minEdge) return false;
    if (opp.confidence < minConfidence) return false;
    return true;
  });

  const renderOpportunities = () => (
    <div className='space-y-6'>
      {/* Filters */}
      <div className='bg-white rounded-lg shadow-md p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2'>
          <Filter className='w-5 h-5' />
          <span>Filters</span>
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Sport</label>
            <select
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
              value={sportFilter}
              onChange={e => setSportFilter(e.target.value)}
            >
              <option value='all'>All Sports</option>
              <option value='MLB'>MLB</option>
              <option value='NBA'>NBA</option>
              <option value='NFL'>NFL</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Market</label>
            <select
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
              value={marketFilter}
              onChange={e => setMarketFilter(e.target.value)}
            >
              <option value='all'>All Markets</option>
              <option value='Player Hits'>Player Hits</option>
              <option value='Player RBIs'>Player RBIs</option>
              <option value='Team Total'>Team Total</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Min Edge (%)</label>
            <input
              type='range'
              min='0'
              max='20'
              step='0.5'
              value={minEdge}
              onChange={e => setMinEdge(Number(e.target.value))}
              className='w-full'
            />
            <span className='text-sm text-gray-500'>{minEdge}%</span>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Min Confidence (%)
            </label>
            <input
              type='range'
              min='50'
              max='100'
              step='1'
              value={minConfidence}
              onChange={e => setMinConfidence(Number(e.target.value))}
              className='w-full'
            />
            <span className='text-sm text-gray-500'>{minConfidence}%</span>
          </div>
        </div>
      </div>

      {/* Opportunities List */}
      <div className='bg-white rounded-lg shadow-md'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h3 className='text-lg font-semibold text-gray-900'>
            Betting Opportunities ({filteredOpportunities.length})
          </h3>
        </div>
        <div className='divide-y divide-gray-200'>
          {filteredOpportunities.map(opportunity => (
            <div key={opportunity.id} className='p-6 hover:bg-gray-50'>
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center space-x-3 mb-2'>
                    <span className='text-sm font-medium text-blue-600'>{opportunity.sport}</span>
                    <span className='text-sm text-gray-500'>{opportunity.market}</span>
                    <span className='text-xs text-gray-400'>{opportunity.bookmaker}</span>
                  </div>
                  <h4 className='text-lg font-semibold text-gray-900 mb-2'>
                    {opportunity.selection}
                  </h4>
                  <div className='flex items-center space-x-4 text-sm text-gray-600'>
                    <span>Odds: {opportunity.odds.toFixed(2)}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getEdgeColor(
                        opportunity.edge
                      )}`}
                    >
                      Edge: {opportunity.edge.toFixed(1)}%
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(
                        opportunity.confidence
                      )}`}
                    >
                      Confidence: {opportunity.confidence}%
                    </span>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='mb-2'>
                    <span className='text-sm text-gray-500'>Recommended Stake:</span>
                    <div className='text-lg font-bold text-gray-900'>
                      ${opportunity.recommended_stake}
                    </div>
                  </div>
                  <div className='mb-3'>
                    <span className='text-sm text-gray-500'>Expected Value:</span>
                    <div className='text-sm font-semibold text-green-600'>
                      +${opportunity.expected_value.toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={() => addToBetSlip(opportunity)}
                    className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2'
                    disabled={betSlip.some(item => item.opportunity_id === opportunity.id)}
                  >
                    <Plus className='w-4 h-4' />
                    <span>Add to Bet Slip</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBetSlip = () => (
    <div className='space-y-6'>
      <div className='bg-white rounded-lg shadow-md'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h3 className='text-lg font-semibold text-gray-900'>Bet Slip ({betSlip.length} bets)</h3>
        </div>
        {betSlip.length === 0 ? (
          <div className='p-6 text-center text-gray-500'>
            <Target className='w-12 h-12 mx-auto mb-4 text-gray-300' />
            <p>No bets in your slip yet</p>
            <p className='text-sm'>Add opportunities from the Opportunities tab</p>
          </div>
        ) : (
          <div className='divide-y divide-gray-200'>
            {betSlip.map(item => {
              const opportunity = getOpportunityById(item.opportunity_id);
              if (!opportunity) return null;

              return (
                <div key={item.opportunity_id} className='p-6'>
                  <div className='flex items-center justify-between mb-3'>
                    <div>
                      <h4 className='font-semibold text-gray-900'>{opportunity.selection}</h4>
                      <p className='text-sm text-gray-500'>
                        {opportunity.sport} • {opportunity.market}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromBetSlip(item.opportunity_id)}
                      className='text-red-500 hover:text-red-700'
                    >
                      <X className='w-4 h-4' />
                    </button>
                  </div>
                  <div className='grid grid-cols-3 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Stake ($)
                      </label>
                      <input
                        type='number'
                        min='1'
                        max={opportunity.max_stake}
                        value={item.stake}
                        onChange={e => {
                          const newStake = Number(e.target.value);
                          setBetSlip(prev =>
                            prev.map(betItem =>
                              betItem.opportunity_id === item.opportunity_id
                                ? {
                                    ...betItem,
                                    stake: newStake,
                                    potential_win: newStake * (opportunity.odds - 1),
                                  }
                                : betItem
                            )
                          );
                        }}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Odds</label>
                      <div className='px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900'>
                        {opportunity.odds.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Potential Win
                      </label>
                      <div className='px-3 py-2 bg-green-50 border border-green-200 rounded-md text-green-700 font-semibold'>
                        ${item.potential_win.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className='p-6 bg-gray-50'>
              <div className='flex justify-between items-center mb-4'>
                <span className='text-lg font-semibold text-gray-900'>Total Stake:</span>
                <span className='text-lg font-bold text-gray-900'>
                  ${betSlip.reduce((sum, item) => sum + item.stake, 0).toFixed(2)}
                </span>
              </div>
              <div className='flex justify-between items-center mb-4'>
                <span className='text-lg font-semibold text-gray-900'>Potential Payout:</span>
                <span className='text-lg font-bold text-green-600'>
                  ${betSlip.reduce((sum, item) => sum + item.potential_win, 0).toFixed(2)}
                </span>
              </div>
              <button className='w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-semibold'>
                Place All Bets
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'opportunities':
        return renderOpportunities();
      case 'betslip':
        return renderBetSlip();
      default:
        return renderOpportunities();
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-gray-900 flex items-center space-x-3'>
            <TrendingUp className='w-8 h-8 text-green-600' />
            <span>Unified Betting Interface</span>
          </h1>
          <p className='text-gray-600 mt-2'>
            Professional trading interface for institutional-grade betting and arbitrage
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className='mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <AlertTriangle className='w-5 h-5 text-red-500' />
              <span className='text-red-700'>{error}</span>
            </div>
            <button onClick={() => setError(null)} className='text-red-500 hover:text-red-700'>
              <X className='w-5 h-5' />
            </button>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className='mb-6'>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className='bg-green-600 h-2 rounded-full animate-pulse'
                style={{ width: '45%' }}
              ></div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className='mb-6'>
          <div className='border-b border-gray-200'>
            <nav className='-mb-px flex space-x-8'>
              {[
                { id: 'opportunities', label: 'Opportunities', icon: Target },
                { id: 'betslip', label: 'Bet Slip', icon: DollarSign, badge: betSlip.length },
                { id: 'portfolio', label: 'Portfolio', icon: BarChart3 },
                { id: 'autotrading', label: 'Auto Trading', icon: Settings },
                { id: 'performance', label: 'Performance', icon: TrendingUp },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className='w-4 h-4' />
                    <span>{tab.label}</span>
                    {tab.badge && tab.badge > 0 && (
                      <span className='bg-green-500 text-white text-xs rounded-full px-2 py-1 ml-1'>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
};

export default UnifiedBettingInterface;
