import React from 'react';
import { TrendingUp, BarChart3, ExternalLink } from 'lucide-react';

interface PropFinderRowProps {
  opportunity: {
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
  };
  onOddsCompare: (sport: string, player: string, market: string) => void;
  onBookmark?: (id: string) => void;
  onPlaceBet?: (opportunity: PropFinderRowProps['opportunity']) => void;
}

const PropFinderRow: React.FC<PropFinderRowProps> = ({
  opportunity,
  onOddsCompare,
  onBookmark,
  onPlaceBet
}) => {
  const formatOdds = (odds: number): string => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return 'text-green-600 bg-green-50';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getEdgeColor = (edge: number): string => {
    if (edge >= 8) return 'text-green-700';
    if (edge >= 5) return 'text-yellow-700';
    return 'text-gray-700';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900">
            {opportunity.player}
          </h3>
          <span className="text-sm text-gray-500">
            {opportunity.sport}
          </span>
          {opportunity.hasArbitrage && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
              Arbitrage {opportunity.arbitrageProfitPct?.toFixed(1)}%
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(opportunity.confidence)}`}>
            {opportunity.confidence.toFixed(0)}% confidence
          </div>
        </div>
      </div>

      {/* Prop Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Market</div>
          <div className="font-medium text-gray-900">{opportunity.market}</div>
        </div>
        
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Line</div>
          <div className="font-medium text-gray-900">{opportunity.line}</div>
        </div>
        
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Odds</div>
          <div className="font-medium text-gray-900">{formatOdds(opportunity.odds)}</div>
        </div>
        
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Edge</div>
          <div className={`font-medium ${getEdgeColor(opportunity.edge)}`}>
            {opportunity.edge.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Best Bookmaker Info */}
      {opportunity.bestBookmaker && (
        <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-700">
              Best at <strong>{opportunity.bestBookmaker}</strong>
            </span>
          </div>
          
          {opportunity.numBookmakers && (
            <span className="text-sm text-gray-500">
              {opportunity.numBookmakers} bookmakers compared
            </span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOddsCompare(opportunity.sport, opportunity.player, opportunity.market)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Compare Odds
          </button>
          
          {onBookmark && (
            <button
              onClick={() => onBookmark(opportunity.id)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Bookmark
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onPlaceBet && (
            <button
              onClick={() => onPlaceBet(opportunity)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Place Bet
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropFinderRow;