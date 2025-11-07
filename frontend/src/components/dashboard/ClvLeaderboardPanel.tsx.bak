/**
 * CLV Leaderboard Panel - Lightweight Side Panel
 * Shows "Top 5 CLV Movers" as collapsible side panel
 */

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { formatClvPercent, clvColor, clvDescription } from '../../utils/clvFormatting';

interface ClvLeaderboardItem {
  prop_id: string;
  player: string;
  market: string;
  current_clv: number;
  closing_line?: number;
  closing_odds?: number;
}

interface ClvLeaderboardPanelProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

const ClvLeaderboardPanel: React.FC<ClvLeaderboardPanelProps> = ({
  isVisible = false,
  onToggle: _onToggle
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<ClvLeaderboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch CLV leaderboard data
  useEffect(() => {
    if (!isVisible) return;

    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/clv/leaderboard?limit=10');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Sort by absolute CLV and take top 5
            const topMovers = data.data
              .sort((a: ClvLeaderboardItem, b: ClvLeaderboardItem) => 
                Math.abs(b.current_clv) - Math.abs(a.current_clv)
              )
              .slice(0, 5);
            setLeaderboardData(topMovers);
          }
        }
      } catch {
        // Silently handle error - CLV leaderboard is optional feature
        setLeaderboardData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Panel Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <h3 className="font-medium text-white">Top CLV Movers</h3>
          {leaderboardData.length > 0 && (
            <span className="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded">
              {leaderboardData.length}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </div>

      {/* Panel Content */}
      {isExpanded && (
        <div className="border-t border-gray-700">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">
              <div className="animate-spin w-4 h-4 border-2 border-gray-600 border-t-green-400 rounded-full mx-auto mb-2"></div>
              Loading CLV data...
            </div>
          ) : leaderboardData.length > 0 ? (
            <div className="divide-y divide-gray-700">
              {leaderboardData.map((item, index) => (
                <div key={item.prop_id} className="p-3 hover:bg-gray-750 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">
                        {item.player}
                      </div>
                      <div className="text-sm text-gray-400 truncate">
                        {item.market}
                        {item.closing_line && (
                          <span className="ml-2">
                            @ {item.closing_line}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <div className="flex items-center gap-1">
                        {item.current_clv > 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-400" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-400" />
                        )}
                        <span 
                          className="font-bold text-sm"
                          style={{ color: clvColor(item.current_clv) }}
                        >
                          {formatClvPercent(item.current_clv)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        #{index + 1}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {clvDescription(item.current_clv)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-400">
              <TrendingUp className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <div className="text-sm">No CLV data available</div>
              <div className="text-xs text-gray-500 mt-1">
                Enable CLV column to see top movers
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClvLeaderboardPanel;