import React from 'react';
import PropFinderRow from './PropFinderRow';
import OddsCompareDrawer from './OddsCompareDrawer';
import { useOddsComparison } from '../hooks/useOddsComparison';

interface PropFinderDashboardProps {
  opportunities: Array<{
    id: string;
    player: string;
    sport: string;
    market: string;
    line: number;
    odds: number;
    confidence: number;
    edge: number;
    bestBookmaker?: string;
    numBookmakers?: number;
    hasArbitrage?: boolean;
    arbitrageProfitPct?: number;
  }>;
  loading?: boolean;
  error?: string;
  onBookmark?: (id: string) => void;
  onPlaceBet?: (opportunity: PropFinderDashboardProps['opportunities'][0]) => void;
}

const PropFinderDashboardExample: React.FC<PropFinderDashboardProps> = ({
  opportunities,
  loading = false,
  error,
  onBookmark,
  onPlaceBet
}) => {
  const {
    isDrawerOpen,
    currentComparison,
    openOddsComparison,
    closeOddsComparison
  } = useOddsComparison({
    onOddsCompare: (sport, player, market) => {
      // Analytics tracking for odds comparison views
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(`Opening odds comparison for ${player} ${market} in ${sport}`);
      }
      // Additional analytics tracking could go here
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading opportunities...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-semibold text-red-800 mb-2">Error Loading Opportunities</h3>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          PropFinder Opportunities
        </h2>
        <div className="text-sm text-gray-500">
          {opportunities.length} opportunities found
        </div>
      </div>

      {/* Opportunities List */}
      <div className="space-y-4">
        {opportunities.map((opportunity) => (
          <PropFinderRow
            key={opportunity.id}
            opportunity={opportunity}
            onOddsCompare={openOddsComparison}
            onBookmark={onBookmark}
            onPlaceBet={onPlaceBet}
          />
        ))}
      </div>

      {/* Odds Comparison Drawer */}
      <OddsCompareDrawer
        isOpen={isDrawerOpen}
        onClose={closeOddsComparison}
        sport={currentComparison?.sport || ''}
        player={currentComparison?.player || ''}
        market={currentComparison?.market || ''}
      />
    </div>
  );
};

export default PropFinderDashboardExample;