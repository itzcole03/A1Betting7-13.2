import { BetSlipComponent } from '@/components/betting/BetSlipComponent';
import { BettingFilters } from '@/components/filters/BettingFilters';
import { BarChart3, DollarSign, Plus, Settings, Target, TrendingUp } from 'lucide-react';
const UnifiedBettingInterface = props => {
  const {
    error = null,
    loading = false,
    onRetry = () => {},
    filters = {},
    setFilters = () => {},
    filteredOpportunities = [],
    betSlip = [],
    entryAmount = 0,
    removeFromBetSlip = () => {},
    setEntryAmount = () => {},
    handleClearSlip = () => {},
    handlePlaceBet = () => {},
    addToBetSlip = () => {},
    activeTab = 'opportunities',
    setActiveTab = () => {},
  } = props;

  // Render helpers
  const renderOpportunities = () => (
    <div className='space-y-6'>
      <BettingFilters filters={filters} setFilters={setFilters} />
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
                    <span>Odds: {opportunity.odds?.toFixed(2)}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${opportunity.edgeColor}`}
                    >
                      Edge: {opportunity.edge?.toFixed(1)}%
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
                      +${opportunity.expected_value?.toFixed(2)}
                    </div>
                  </div>
                  <button
                    data-testid={`add-to-bet-slip-btn-${opportunity.id}`}
                    onClick={() => addToBetSlip(opportunity)}
                    className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2'
                    disabled={betSlip.some(item => item.opportunityId === opportunity.id)}
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
    <BetSlipComponent
      selectedProps={betSlip}
      entryAmount={entryAmount}
      onRemoveProp={removeFromBetSlip}
      onEntryAmountChange={setEntryAmount}
      onClearSlip={handleClearSlip}
      onPlaceBet={handlePlaceBet}
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

  // Main return: always render dashboard shell, header, tabs, and content
  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        <div className='mb-6'>
          <h1
            className='text-3xl font-bold text-gray-900 flex items-center space-x-3'
            data-testid='betting-interface-heading'
          >
            <Target className='w-7 h-7 text-blue-500' />
            <span>Unified Betting Interface</span>
          </h1>
          <p className='text-gray-600 mt-2'>
            Professional trading interface for institutional-grade betting and arbitrage
          </p>
        </div>
        {/* Navigation Tabs */}
        <div className='mb-6'>
          <div className='border-b border-gray-200'>
            <nav className='-mb-px flex space-x-8'>
              {[
                { id: 'opportunities', label: 'Opportunities', icon: Target },
                { id: 'betslip', label: 'Bet Slip', icon: DollarSign, badge: betSlip?.length || 0 },
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

        {/* Error/Loading overlays (not top-level returns) */}
        {error && (
          <div className='min-h-[200px] bg-red-50 p-6 rounded mb-6'>
            <div className='text-center'>
              <h2 className='text-xl font-semibold text-red-600 mb-2'>
                Oops! Something went wrong.
              </h2>
              <p className='text-gray-600 mb-2'>
                {error.message || 'An unexpected error occurred.'}
              </p>
              <p className='text-gray-500 text-sm mb-4'>
                You can try again, refresh the page, or{' '}
                <a href='mailto:support@a1betting.com' className='underline text-blue-500'>
                  report this issue
                </a>
                .
              </p>
              <button
                onClick={onRetry}
                className='mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                aria-label='Try again'
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className='mt-2 ml-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600'
                aria-label='Refresh page'
              >
                Refresh
              </button>
            </div>
          </div>
        )}
        {loading && (
          <div className='min-h-[200px] bg-slate-100 p-6 rounded mb-6 flex items-center justify-center'>
            <span className='text-slate-500'>Loading opportunities...</span>
          </div>
        )}

        {/* Main Content */}
        {!error && !loading && renderContent()}
      </div>
    </div>
  );
};

export default UnifiedBettingInterface;
