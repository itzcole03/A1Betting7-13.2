import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Minus, ExternalLink, Star, Filter } from 'lucide-react';

interface OddsData {
  sportsbook: string;
  odds: number;
  line: number;
  last_seen: string;
  confidence: number;
}

interface OddsComparisonData {
  sport: string;
  player: string;
  market: string;
  bookmakers: OddsData[];
  best_line: number | null;
  best_odds: number | null;
  best_bookmaker: string | null;
  line_spread: number;
  odds_spread: number;
  num_bookmakers: number;
  last_updated: string;
  cached: boolean;
}

interface OddsCompareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sport: string;
  player: string;
  market: string;
}

interface BookmakerPreferences {
  favoriteBooks: string[];
  hiddenBooks: string[];
  sortOrder: 'odds' | 'line' | 'preference' | 'confidence';
}

const OddsCompareDrawer: React.FC<OddsCompareDrawerProps> = ({
  isOpen,
  onClose,
  sport,
  player,
  market
}) => {
  const [oddsData, setOddsData] = useState<OddsComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<BookmakerPreferences>(() => {
    const saved = localStorage.getItem('bookmakerPreferences');
    return saved ? JSON.parse(saved) : {
      favoriteBooks: ['DraftKings', 'FanDuel'],
      hiddenBooks: [],
      sortOrder: 'odds'
    };
  });

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('bookmakerPreferences', JSON.stringify(preferences));
  }, [preferences]);

  // Fetch odds data when drawer opens
  const fetchOddsData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        sport,
        player,
        market
      });

      const response = await fetch(`/api/odds/compare?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch odds: ${response.statusText}`);
      }

      const data = await response.json();
      setOddsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch odds data');
      // Console error for debugging (development only)
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Odds comparison error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [sport, player, market]);

  useEffect(() => {
    if (isOpen && sport && player && market) {
      fetchOddsData();
    }
  }, [isOpen, sport, player, market, fetchOddsData]);

  const formatOdds = (odds: number): string => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const getOddsColor = (odds: number, bestOdds: number | null): string => {
    if (!bestOdds) return 'text-gray-600';
    
    if (odds === bestOdds) {
      return 'text-green-600 font-bold';
    } else if (Math.abs(odds - bestOdds) <= 5) {
      return 'text-yellow-600';
    } else {
      return 'text-red-600';
    }
  };

  const getLineMovementIcon = (line: number, bestLine: number | null) => {
    if (!bestLine) return <Minus className="w-4 h-4 text-gray-400" />;
    
    if (line > bestLine) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (line < bestLine) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const sortBookmakers = (bookmakers: OddsData[]): OddsData[] => {
    const sorted = [...bookmakers];
    
    switch (preferences.sortOrder) {
      case 'odds':
        return sorted.sort((a, b) => b.odds - a.odds); // Best odds first
      case 'line':
        return sorted.sort((a, b) => b.line - a.line);
      case 'confidence':
        return sorted.sort((a, b) => b.confidence - a.confidence);
      case 'preference':
        return sorted.sort((a, b) => {
          const aFavorite = preferences.favoriteBooks.includes(a.sportsbook);
          const bFavorite = preferences.favoriteBooks.includes(b.sportsbook);
          
          if (aFavorite && !bFavorite) return -1;
          if (!aFavorite && bFavorite) return 1;
          
          // If both or neither are favorites, sort by odds
          return b.odds - a.odds;
        });
      default:
        return sorted;
    }
  };

  const toggleFavoriteBookmaker = (bookmaker: string) => {
    setPreferences(prev => ({
      ...prev,
      favoriteBooks: prev.favoriteBooks.includes(bookmaker)
        ? prev.favoriteBooks.filter(b => b !== bookmaker)
        : [...prev.favoriteBooks, bookmaker]
    }));
  };

  const _toggleHiddenBookmaker = (bookmaker: string) => {
    setPreferences(prev => ({
      ...prev,
      hiddenBooks: prev.hiddenBooks.includes(bookmaker)
        ? prev.hiddenBooks.filter(b => b !== bookmaker)
        : [...prev.hiddenBooks, bookmaker]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Odds Comparison
              </h2>
              <p className="text-sm text-gray-600">
                {player} • {market} • {sport}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Controls */}
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <select
                  value={preferences.sortOrder}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    sortOrder: e.target.value as BookmakerPreferences['sortOrder']
                  }))}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="odds">Best Odds</option>
                  <option value="line">Line Value</option>
                  <option value="confidence">Confidence</option>
                  <option value="preference">My Favorites</option>
                </select>
              </div>
              
              <button
                onClick={fetchOddsData}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                <Filter className="w-4 h-4" />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading odds comparison...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">Error Loading Odds</h3>
                <p className="text-red-600 text-sm">{error}</p>
                <button
                  onClick={fetchOddsData}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            )}

            {oddsData && !loading && (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-600 font-medium">Best Odds</div>
                    <div className="text-xl font-bold text-green-800">
                      {oddsData.best_odds ? formatOdds(oddsData.best_odds) : 'N/A'}
                    </div>
                    <div className="text-sm text-green-600">
                      {oddsData.best_bookmaker || 'Unknown'}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-blue-600 font-medium">Line Spread</div>
                    <div className="text-xl font-bold text-blue-800">
                      {oddsData.line_spread.toFixed(1)}
                    </div>
                    <div className="text-sm text-blue-600">points</div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-purple-600 font-medium">Odds Spread</div>
                    <div className="text-xl font-bold text-purple-800">
                      {oddsData.odds_spread}
                    </div>
                    <div className="text-sm text-purple-600">points</div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 font-medium">Bookmakers</div>
                    <div className="text-xl font-bold text-gray-800">
                      {oddsData.num_bookmakers}
                    </div>
                    <div className="text-sm text-gray-600">available</div>
                  </div>
                </div>

                {/* Bookmaker List */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Bookmaker Odds ({oddsData.cached ? 'Cached' : 'Live'})
                  </h3>
                  
                  {sortBookmakers(oddsData.bookmakers)
                    .filter(book => !preferences.hiddenBooks.includes(book.sportsbook))
                    .map((book) => (
                    <div
                      key={book.sportsbook}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleFavoriteBookmaker(book.sportsbook)}
                          className={`p-1 rounded ${
                            preferences.favoriteBooks.includes(book.sportsbook)
                              ? 'text-yellow-500'
                              : 'text-gray-300 hover:text-yellow-400'
                          }`}
                        >
                          <Star className="w-4 h-4" fill={
                            preferences.favoriteBooks.includes(book.sportsbook) ? 'currentColor' : 'none'
                          } />
                        </button>
                        
                        <div>
                          <div className="font-medium text-gray-900">
                            {book.sportsbook}
                          </div>
                          <div className="text-sm text-gray-500">
                            Confidence: {(book.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Line</div>
                          <div className="flex items-center gap-2">
                            {getLineMovementIcon(book.line, oddsData.best_line)}
                            <span className="font-medium">{book.line}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-gray-500">Odds</div>
                          <div className={`text-lg font-bold ${getOddsColor(book.odds, oddsData.best_odds)}`}>
                            {formatOdds(book.odds)}
                          </div>
                        </div>

                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Metadata */}
                <div className="text-xs text-gray-500 pt-4 border-t border-gray-100">
                  Last updated: {new Date(oddsData.last_updated).toLocaleString()}
                  {oddsData.cached && ' (Cached data)'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OddsCompareDrawer;