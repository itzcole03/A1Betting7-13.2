import { BetSlipComponent } from '@/components/betting/BetSlipComponent';
import { BettingFilters } from '@/components/filters/BettingFilters';
import { useUnifiedBettingState } from '@/hooks/useUnifiedBettingState';
import {
  AlertTriangle,
  BarChart3,
  DollarSign,
  Plus,
  Settings,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';
import React from 'react';

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
  const {
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
  } = useUnifiedBettingState();

  const renderOpportunities = () => (
    <div className='space-y-6'>
      <BettingFilters filters={filters} setFilters={setFilters} />
      {/* Opportunities List */}
      <div className='bg-white rounded-lg shadow-md'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h3 className='text-lg font-semibold text-gray-900'>
            Betting Opportunities ({filteredOpportunities.length})
          </h3>
        </div>
        <div className='divide-y divide-gray-200'>
          {filteredOpportunities.map(
            (opportunity: import('../../hooks/useUnifiedBettingState').BettingOpportunity) => (
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
                        className={`px-2 py-1 rounded-full text-xs font-medium ${opportunity.edgeColor}`}
                      >
                        Edge: {opportunity.edge.toFixed(1)}%
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${opportunity.confidenceColor}`}
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
                      disabled={betSlip.some(
                        (item: import('../../hooks/useUnifiedBettingState').BetSlipItem) =>
                          item.opportunity_id === opportunity.id
                      )}
                    >
                      <Plus className='w-4 h-4' />
                      <span>Add to Bet Slip</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );

  const renderBetSlip = () => (
    <BetSlipComponent
      betSlip={betSlip}
      getOpportunityById={getOpportunityById}
      removeFromBetSlip={removeFromBetSlip}
    />
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
          <h1
            className='text-3xl font-bold text-gray-900 flex items-center space-x-3'
            data-testid='betting-interface-heading'
          >
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
