import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Star,
  Clock,
  Target,
  Brain,
  Zap,
  Activity,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Share2,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  X,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';

interface MobilePropOpportunity {
  id: string;
  player: string;
  team: string;
  opponent: string;
  market: string;
  line: number;
  pick: 'over' | 'under';
  odds: number;
  confidence: number;
  edge: number;
  projection: number;
  timeToGame: string;
  trend: 'up' | 'down' | 'stable';
  isBookmarked: boolean;
  form: number[];
  volume: number;
  sharpMoney: 'heavy' | 'moderate' | 'light';
}

const MobilePropResearch: React.FC = () => {
  const [opportunities, setOpportunities] = useState<MobilePropOpportunity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSort, setSelectedSort] = useState<'confidence' | 'edge' | 'time'>('confidence');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Mock data optimized for mobile
  useEffect(() => {
    const mockData: MobilePropOpportunity[] = [
      {
        id: '1',
        player: 'LeBron James',
        team: 'LAL',
        opponent: 'GSW',
        market: 'Points',
        line: 25.5,
        pick: 'over',
        odds: -110,
        confidence: 94.7,
        edge: 20.8,
        projection: 28.4,
        timeToGame: '2h 15m',
        trend: 'up',
        isBookmarked: true,
        form: [31, 28, 24, 29, 27],
        volume: 847,
        sharpMoney: 'heavy',
      },
      {
        id: '2',
        player: 'Luka Dončić',
        team: 'DAL',
        opponent: 'PHX',
        market: 'Assists',
        line: 8.5,
        pick: 'over',
        odds: -120,
        confidence: 91.2,
        edge: 24.8,
        projection: 10.1,
        timeToGame: '4h 30m',
        trend: 'up',
        isBookmarked: false,
        form: [12, 9, 8, 11, 10],
        volume: 632,
        sharpMoney: 'heavy',
      },
      {
        id: '3',
        player: 'Jayson Tatum',
        team: 'BOS',
        opponent: 'MIA',
        market: 'Rebounds',
        line: 7.5,
        pick: 'under',
        odds: +105,
        confidence: 87.1,
        edge: 19.6,
        projection: 6.2,
        timeToGame: '1h 45m',
        trend: 'down',
        isBookmarked: false,
        form: [6, 5, 8, 6, 7],
        volume: 423,
        sharpMoney: 'moderate',
      },
    ];
    setOpportunities(mockData);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const toggleBookmark = (id: string) => {
    setOpportunities(prev =>
      prev.map(opp =>
        opp.id === id ? { ...opp, isBookmarked: !opp.isBookmarked } : opp
      )
    );
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-500';
    if (confidence >= 80) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getSharpMoneyColor = (sharpMoney: string) => {
    switch (sharpMoney) {
      case 'heavy': return 'bg-red-500';
      case 'moderate': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const filteredOpportunities = opportunities.filter(opp =>
    opp.player.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.market.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    switch (selectedSort) {
      case 'confidence':
        return b.confidence - a.confidence;
      case 'edge':
        return b.edge - a.edge;
      case 'time':
        return a.timeToGame.localeCompare(b.timeToGame);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-white">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-lg border-b border-slate-800">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Brain className="w-6 h-6 text-cyan-400" />
              <h1 className="text-lg font-bold">Prop Research</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search players, teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-800 overflow-hidden"
            >
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Sort by:</span>
                  <div className="flex space-x-2">
                    {[
                      { key: 'confidence', label: 'Confidence' },
                      { key: 'edge', label: 'Edge' },
                      { key: 'time', label: 'Time' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setSelectedSort(key as any)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          selectedSort === key
                            ? 'bg-cyan-500 text-white'
                            : 'bg-slate-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Bar */}
      <div className="px-4 py-3 bg-slate-900/50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-gray-400">Live</span>
            </div>
            <span className="text-gray-400">{filteredOpportunities.length} opportunities</span>
          </div>
          <div className="text-cyan-400 font-medium">
            Avg: {(filteredOpportunities.reduce((sum, opp) => sum + opp.confidence, 0) / filteredOpportunities.length || 0).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Opportunities List */}
      <div className="px-4 py-2 space-y-3">
        <AnimatePresence>
          {filteredOpportunities.map((opp, index) => (
            <motion.div
              key={opp.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {opp.player.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{opp.player}</h3>
                      <p className="text-xs text-gray-400">{opp.team} vs {opp.opponent}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getSharpMoneyColor(opp.sharpMoney)}`}></div>
                    <button
                      onClick={() => toggleBookmark(opp.id)}
                      className={`p-1.5 rounded-lg transition-all ${
                        opp.isBookmarked 
                          ? 'text-yellow-400 bg-yellow-500/20' 
                          : 'text-gray-400 hover:text-yellow-400'
                      }`}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Market Info */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">{opp.market}</span>
                    <div className="flex items-center space-x-1 bg-slate-700 px-2 py-1 rounded-full">
                      <span className="text-xs text-cyan-400 font-medium">
                        {opp.pick.toUpperCase()} {opp.line}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{opp.odds > 0 ? '+' : ''}{opp.odds}</div>
                    <div className="text-xs text-gray-400">{opp.timeToGame}</div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                    <div className={`text-lg font-bold ${getConfidenceColor(opp.confidence)}`}>
                      {opp.confidence.toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-400">Confidence</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-green-400">
                      +{opp.edge.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">Edge</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-white">
                      {opp.projection.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-400">Projection</div>
                  </div>
                </div>

                {/* Trend & Form */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">Trend:</span>
                    {opp.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : opp.trend === 'down' ? (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    ) : (
                      <Minus className="w-4 h-4 text-gray-400" />
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-400">Form:</span>
                    <div className="flex space-x-0.5">
                      {opp.form.slice(-5).map((value, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-4 rounded-sm ${
                            value > opp.line ? 'bg-green-400' : 'bg-red-400'
                          }`}
                          style={{ opacity: 0.6 + (i * 0.1) }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedCard(expandedCard === opp.id ? null : opp.id)}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    {expandedCard === opp.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedCard === opp.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-700 px-4 py-3 bg-slate-900/30"
                  >
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Volume</div>
                        <div className="text-sm font-medium text-white">{opp.volume.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Sharp Money</div>
                        <div className="text-sm font-medium text-white capitalize">{opp.sharpMoney}</div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[0.98]">
                        View Details
                      </button>
                      <button className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-slate-600">
                        <Share2 className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredOpportunities.length === 0 && (
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No opportunities found</h3>
          <p className="text-gray-400 mb-4">Try adjusting your search criteria</p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Bottom Padding for Mobile */}
      <div className="h-16"></div>
    </div>
  );
};

export default MobilePropResearch;
