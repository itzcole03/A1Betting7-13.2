import React, { Suspense, lazy } from 'react';
import { RefreshCw } from 'lucide-react';

// Lazy load the optimized dashboard for better performance
const OptimizedPropFinderKillerDashboard = lazy(() => import('./OptimizedPropFinderKillerDashboard'));

// Enhanced interfaces with advanced predictive features
interface PropOpportunity {
  id: string;
  player: string;
  playerImage?: string;
  team: string;
  teamLogo?: string;
  opponent: string;
  opponentLogo?: string;
  sport: 'NBA' | 'NFL' | 'MLB' | 'NHL';
  market: string;
  line: number;
  pick: 'over' | 'under';
  odds: number;
  impliedProbability: number;
  aiProbability: number;
  edge: number;
  confidence: number;
  projectedValue: number;
  volume: number;
  trend: 'up' | 'down' | 'stable';
  trendStrength: number;
  timeToGame: string;
  venue: 'home' | 'away';
  weather?: string;
  injuries: string[];
  recentForm: number[];
  matchupHistory: {
    games: number;
    average: number;
    hitRate: number;
  };
  lineMovement: {
    open: number;
    current: number;
    direction: 'up' | 'down' | 'stable';
    steam: boolean;
    sharpAction: number;
  };
  bookmakers: Array<{
    name: string;
    odds: number;
    line: number;
    volume: number;
    lastUpdate: string;
  }>;
  isBookmarked: boolean;
  tags: string[];
  socialSentiment: number;
  sharpMoney: 'heavy' | 'moderate' | 'light' | 'public';
  // Enhanced predictive features
  aiModels: {
    ensemble: number;
    xgboost: number;
    neuralNet: number;
    lstm: number;
    consensus: number;
  };
  marketEfficiency: number;
  volatility: number;
  momentum: number;
  streakData: {
    current: number;
    direction: 'over' | 'under';
    significance: number;
  };
  advancedMetrics: {
    kellyCriterion: number;
    expectedValue: number;
    riskAdjustedReturn: number;
    sharpeRatio: number;
  };
  dataQuality: {
    score: number;
    sources: number;
    freshness: number;
    reliability: number;
  };
  realTimeUpdates: {
    lastUpdate: string;
    frequency: number;
    isLive: boolean;
  };
}

interface DataFeed {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  latency: number;
  updates: number;
  reliability: number;
  lastUpdate: string;
}

interface PredictiveModel {
  id: string;
  name: string;
  accuracy: number;
  predictions: number;
  status: 'active' | 'training' | 'offline';
  confidence: number;
  lastTrained: string;
}

interface FilterState {
  sport: string[];
  confidence: [number, number];
  edge: [number, number];
  timeToGame: string;
  market: string[];
  venue: string[];
  sharpMoney: string[];
  showBookmarked: boolean;
  sortBy: 'confidence' | 'edge' | 'time' | 'volume' | 'trend' | 'kelly' | 'expectedValue';
  sortOrder: 'asc' | 'desc';
  aiModel: string;
  dataQualityMin: number;
  volatilityMax: number;
}

const EnhancedPropFinderKillerDashboard: React.FC = () => {
  const [opportunities, setOpportunities] = useState<PropOpportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<PropOpportunity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpp, setSelectedOpp] = useState<PropOpportunity | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [showOnlyPremium, setShowOnlyPremium] = useState(false);
  const [dataFeeds, setDataFeeds] = useState<DataFeed[]>([]);
  const [predictiveModels, setPredictiveModels] = useState<PredictiveModel[]>([]);
  const [realTimeConnected, setRealTimeConnected] = useState(true);
  const [systemHealth, setSystemHealth] = useState(98.7);

  // React 19 concurrent features for better performance
  const [isPending, startTransitionLocal] = useTransition();
  const deferredSearchQuery = useDeferredValue(searchQuery);
  
  const [filters, setFilters] = useState<FilterState>({
    sport: [],
    confidence: [75, 100],
    edge: [0, 50],
    timeToGame: 'all',
    market: [],
    venue: [],
    sharpMoney: [],
    showBookmarked: false,
    sortBy: 'confidence',
    sortOrder: 'desc',
    aiModel: 'ensemble',
    dataQualityMin: 85,
    volatilityMax: 30,
  });

  // Initialize data feeds
  useEffect(() => {
    const feeds: DataFeed[] = [
      {
        id: 'sportsradar',
        name: 'SportsRadar',
        status: 'connected',
        latency: 45,
        updates: 1247,
        reliability: 99.2,
        lastUpdate: new Date().toISOString(),
      },
      {
        id: 'oddsapi',
        name: 'The Odds API',
        status: 'connected',
        latency: 67,
        updates: 892,
        reliability: 97.8,
        lastUpdate: new Date().toISOString(),
      },
      {
        id: 'draftkings',
        name: 'DraftKings API',
        status: 'connected',
        latency: 23,
        updates: 2341,
        reliability: 98.9,
        lastUpdate: new Date().toISOString(),
      },
      {
        id: 'fanduel',
        name: 'FanDuel API',
        status: 'connected',
        latency: 31,
        updates: 1876,
        reliability: 98.4,
        lastUpdate: new Date().toISOString(),
      },
      {
        id: 'espn',
        name: 'ESPN Stats',
        status: 'connected',
        latency: 89,
        updates: 567,
        reliability: 96.7,
        lastUpdate: new Date().toISOString(),
      },
    ];
    setDataFeeds(feeds);
  }, []);

  // Initialize predictive models
  useEffect(() => {
    const models: PredictiveModel[] = [
      {
        id: 'ensemble',
        name: 'Ensemble Model',
        accuracy: 94.7,
        predictions: 15623,
        status: 'active',
        confidence: 96.2,
        lastTrained: '2h ago',
      },
      {
        id: 'xgboost',
        name: 'XGBoost Classifier',
        accuracy: 92.3,
        predictions: 12890,
        status: 'active',
        confidence: 94.1,
        lastTrained: '4h ago',
      },
      {
        id: 'neural',
        name: 'Neural Network',
        accuracy: 91.8,
        predictions: 11456,
        status: 'active',
        confidence: 93.7,
        lastTrained: '1h ago',
      },
      {
        id: 'lstm',
        name: 'LSTM Predictor',
        accuracy: 89.4,
        predictions: 8066,
        status: 'training',
        confidence: 91.2,
        lastTrained: '6h ago',
      },
    ];
    setPredictiveModels(models);
  }, []);

  // Enhanced mock data with advanced metrics
  useEffect(() => {
    const mockData: PropOpportunity[] = [
      {
        id: '1',
        player: 'LeBron James',
        playerImage: '/api/placeholder/40/40',
        team: 'LAL',
        teamLogo: '/api/placeholder/24/24',
        opponent: 'GSW',
        opponentLogo: '/api/placeholder/24/24',
        sport: 'NBA',
        market: 'Points',
        line: 25.5,
        pick: 'over',
        odds: -110,
        impliedProbability: 52.4,
        aiProbability: 73.2,
        edge: 20.8,
        confidence: 94.7,
        projectedValue: 28.4,
        volume: 847,
        trend: 'up',
        trendStrength: 85,
        timeToGame: '2h 15m',
        venue: 'home',
        weather: 'Clear',
        injuries: [],
        recentForm: [31, 28, 24, 29, 27],
        matchupHistory: { games: 12, average: 27.8, hitRate: 75 },
        lineMovement: { 
          open: 24.5, 
          current: 25.5, 
          direction: 'up',
          steam: true,
          sharpAction: 78
        },
        bookmakers: [
          { name: 'DraftKings', odds: -110, line: 25.5, volume: 234, lastUpdate: '1m ago' },
          { name: 'FanDuel', odds: -105, line: 25.5, volume: 189, lastUpdate: '2m ago' },
          { name: 'BetMGM', odds: -115, line: 25.5, volume: 156, lastUpdate: '1m ago' },
        ],
        isBookmarked: true,
        tags: ['Prime Time', 'Revenge Game', 'Sharp Play'],
        socialSentiment: 78,
        sharpMoney: 'heavy',
        aiModels: {
          ensemble: 94.7,
          xgboost: 92.1,
          neuralNet: 93.8,
          lstm: 91.4,
          consensus: 93.0,
        },
        marketEfficiency: 76.2,
        volatility: 18.4,
        momentum: 87.3,
        streakData: {
          current: 4,
          direction: 'over',
          significance: 89.2,
        },
        advancedMetrics: {
          kellyCriterion: 12.7,
          expectedValue: 18.4,
          riskAdjustedReturn: 15.2,
          sharpeRatio: 2.31,
        },
        dataQuality: {
          score: 96.8,
          sources: 8,
          freshness: 98.2,
          reliability: 95.4,
        },
        realTimeUpdates: {
          lastUpdate: new Date().toISOString(),
          frequency: 5,
          isLive: true,
        },
      },
      {
        id: '2',
        player: 'Luka Dončić',
        playerImage: '/api/placeholder/40/40',
        team: 'DAL',
        teamLogo: '/api/placeholder/24/24',
        opponent: 'PHX',
        opponentLogo: '/api/placeholder/24/24',
        sport: 'NBA',
        market: 'Assists',
        line: 8.5,
        pick: 'over',
        odds: -120,
        impliedProbability: 54.5,
        aiProbability: 79.3,
        edge: 24.8,
        confidence: 91.2,
        projectedValue: 10.1,
        volume: 632,
        trend: 'up',
        trendStrength: 92,
        timeToGame: '4h 30m',
        venue: 'away',
        injuries: ['Minor ankle'],
        recentForm: [12, 9, 8, 11, 10],
        matchupHistory: { games: 8, average: 9.8, hitRate: 88 },
        lineMovement: { 
          open: 8.5, 
          current: 8.5, 
          direction: 'stable',
          steam: false,
          sharpAction: 45
        },
        bookmakers: [
          { name: 'DraftKings', odds: -120, line: 8.5, volume: 167, lastUpdate: '30s ago' },
          { name: 'FanDuel', odds: -115, line: 8.5, volume: 203, lastUpdate: '45s ago' },
          { name: 'Caesars', odds: -125, line: 8.5, volume: 134, lastUpdate: '1m ago' },
        ],
        isBookmarked: false,
        tags: ['High Volume', 'Model Edge'],
        socialSentiment: 82,
        sharpMoney: 'moderate',
        aiModels: {
          ensemble: 91.2,
          xgboost: 89.7,
          neuralNet: 92.4,
          lstm: 88.9,
          consensus: 90.6,
        },
        marketEfficiency: 68.9,
        volatility: 22.1,
        momentum: 84.7,
        streakData: {
          current: 2,
          direction: 'over',
          significance: 72.8,
        },
        advancedMetrics: {
          kellyCriterion: 15.3,
          expectedValue: 22.1,
          riskAdjustedReturn: 18.7,
          sharpeRatio: 2.67,
        },
        dataQuality: {
          score: 94.1,
          sources: 7,
          freshness: 96.8,
          reliability: 91.4,
        },
        realTimeUpdates: {
          lastUpdate: new Date().toISOString(),
          frequency: 3,
          isLive: true,
        },
      },
    ];
    setOpportunities(mockData);
  }, []);

  // Real-time data simulation
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setOpportunities(prev => prev.map(opp => ({
        ...opp,
        confidence: Math.min(Math.max(opp.confidence + (Math.random() - 0.5) * 2, 80), 99),
        edge: Math.max(opp.edge + (Math.random() - 0.5) * 1, 0),
        volume: opp.volume + Math.floor(Math.random() * 50),
        realTimeUpdates: {
          ...opp.realTimeUpdates,
          lastUpdate: new Date().toISOString(),
        },
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Enhanced filtering with AI model selection
  const filteredAndSortedOpportunities = useMemo(() => {
    let filtered = opportunities.filter(opp => {
      if (filters.sport.length && !filters.sport.includes(opp.sport)) return false;
      if (filters.confidence[0] > opp.confidence || filters.confidence[1] < opp.confidence) return false;
      if (filters.edge[0] > opp.edge || filters.edge[1] < opp.edge) return false;
      if (filters.market.length && !filters.market.includes(opp.market)) return false;
      if (filters.venue.length && !filters.venue.includes(opp.venue)) return false;
      if (filters.sharpMoney.length && !filters.sharpMoney.includes(opp.sharpMoney)) return false;
      if (filters.showBookmarked && !opp.isBookmarked) return false;
      if (opp.dataQuality.score < filters.dataQualityMin) return false;
      if (opp.volatility > filters.volatilityMax) return false;
      
      // Search query filter
      if (deferredSearchQuery) {
        const query = deferredSearchQuery.toLowerCase();
        if (!opp.player.toLowerCase().includes(query) && 
            !opp.team.toLowerCase().includes(query) &&
            !opp.market.toLowerCase().includes(query)) return false;
      }
      
      return true;
    });

    // Enhanced sorting with AI model consideration
    filtered.sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (filters.sortBy) {
        case 'confidence':
          aValue = filters.aiModel === 'ensemble' ? a.aiModels.ensemble : a.confidence;
          bValue = filters.aiModel === 'ensemble' ? b.aiModels.ensemble : b.confidence;
          break;
        case 'edge':
          aValue = a.edge;
          bValue = b.edge;
          break;
        case 'kelly':
          aValue = a.advancedMetrics.kellyCriterion;
          bValue = b.advancedMetrics.kellyCriterion;
          break;
        case 'expectedValue':
          aValue = a.advancedMetrics.expectedValue;
          bValue = b.advancedMetrics.expectedValue;
          break;
        case 'volume':
          aValue = a.volume;
          bValue = b.volume;
          break;
        default:
          aValue = a.confidence;
          bValue = b.confidence;
      }
      
      return filters.sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    return filtered;
  }, [opportunities, filters, deferredSearchQuery]);

  useEffect(() => {
    startTransitionLocal(() => {
      setFilteredOpportunities(filteredAndSortedOpportunities);
    });
  }, [filteredAndSortedOpportunities]);

  // Utility functions
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-400 bg-green-500/20';
    if (confidence >= 80) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-orange-400 bg-orange-500/20';
  };

  const getEdgeColor = (edge: number) => {
    if (edge >= 20) return 'text-green-400';
    if (edge >= 10) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getDataQualityColor = (score: number) => {
    if (score >= 95) return 'text-green-400';
    if (score >= 90) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getFeedStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-400" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const toggleBookmark = (id: string) => {
    setOpportunities(prev =>
      prev.map(opp =>
        opp.id === id ? { ...opp, isBookmarked: !opp.isBookmarked } : opp
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Enhanced Header with Real-time Status */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                PropFinder Killer
              </h1>
              <p className="text-gray-400 text-sm">
                AI-Enhanced Prop Research • {filteredOpportunities.length} Opportunities
              </p>
            </div>

            {/* Real-time Status Indicators */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${realTimeConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
                <span className="text-sm text-gray-400">
                  {realTimeConnected ? 'Live' : 'Offline'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-white font-medium">{systemHealth}%</span>
                <span className="text-xs text-gray-400">Health</span>
              </div>

              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                  autoRefresh
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                {autoRefresh ? <Radio className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                <span className="text-sm">{autoRefresh ? 'Live' : 'Paused'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Data Feeds Monitor */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Data Feeds & AI Models</h3>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                {dataFeeds.filter(f => f.status === 'connected').length}/{dataFeeds.length} feeds active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {dataFeeds.map(feed => (
              <div key={feed.id} className="bg-slate-700/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{feed.name}</span>
                  {getFeedStatusIcon(feed.status)}
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>Latency: {feed.latency}ms</div>
                  <div>Updates: {feed.updates.toLocaleString()}</div>
                  <div>Reliability: {feed.reliability}%</div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Models Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {predictiveModels.map(model => (
              <div key={model.id} className="bg-slate-700/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{model.name}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    model.status === 'active' ? 'bg-green-400' :
                    model.status === 'training' ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>Accuracy: {model.accuracy}%</div>
                  <div>Predictions: {model.predictions.toLocaleString()}</div>
                  <div>Confidence: {model.confidence}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Controls */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search players, teams, markets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <select
                value={filters.aiModel}
                onChange={(e) => setFilters(prev => ({ ...prev, aiModel: e.target.value }))}
                className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-purple-400"
              >
                <option value="ensemble">Ensemble Model</option>
                <option value="xgboost">XGBoost</option>
                <option value="neural">Neural Network</option>
                <option value="lstm">LSTM</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  filtersOpen 
                    ? 'bg-cyan-500 text-white' 
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>

              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-400"
              >
                <option value="confidence">Confidence</option>
                <option value="edge">Edge</option>
                <option value="kelly">Kelly %</option>
                <option value="expectedValue">Expected Value</option>
                <option value="volume">Volume</option>
              </select>
            </div>
          </div>

          {/* Enhanced Filters Panel */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 pt-6 border-t border-slate-700"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Data Quality (min)
                    </label>
                    <input
                      type="range"
                      min="80"
                      max="100"
                      value={filters.dataQualityMin}
                      onChange={(e) => setFilters(prev => ({ ...prev, dataQualityMin: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="text-center text-cyan-400 text-sm font-medium mt-1">
                      {filters.dataQualityMin}%
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Max Volatility
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      value={filters.volatilityMax}
                      onChange={(e) => setFilters(prev => ({ ...prev, volatilityMax: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="text-center text-purple-400 text-sm font-medium mt-1">
                      {filters.volatilityMax}%
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Confidence Range
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={filters.confidence[0]}
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          confidence: [parseInt(e.target.value) || 0, prev.confidence[1]] 
                        }))}
                        className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                        min="0"
                        max="100"
                      />
                      <span className="text-gray-400">to</span>
                      <input
                        type="number"
                        value={filters.confidence[1]}
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          confidence: [prev.confidence[0], parseInt(e.target.value) || 100] 
                        }))}
                        className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Sharp Money
                    </label>
                    <select
                      multiple
                      value={filters.sharpMoney}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        sharpMoney: Array.from(e.target.selectedOptions, option => option.value)
                      }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    >
                      <option value="heavy">Heavy</option>
                      <option value="moderate">Moderate</option>
                      <option value="light">Light</option>
                      <option value="public">Public</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Enhanced Opportunity Cards */}
        <div className="space-y-6">
          {isPending && (
            <div className="text-center py-8">
              <div className="inline-flex items-center space-x-2 text-cyan-400">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Updating opportunities...</span>
              </div>
            </div>
          )}

          {filteredOpportunities.map((opp) => (
            <motion.div
              key={opp.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/30 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-white">
                        {opp.player.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-xs">
                      {opp.team}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{opp.player}</h3>
                    <p className="text-sm text-gray-400">{opp.team} vs {opp.opponent} • {opp.timeToGame}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {opp.realTimeUpdates.isLive && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-xs text-green-400">Live</span>
                        </div>
                      )}
                      <span className={`text-xs ${getDataQualityColor(opp.dataQuality.score)}`}>
                        Data Quality: {opp.dataQuality.score.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => toggleBookmark(opp.id)}
                    className={`p-2 rounded-lg transition-all ${
                      opp.isBookmarked 
                        ? 'text-yellow-400 bg-yellow-500/20' 
                        : 'text-gray-400 hover:text-yellow-400'
                    }`}
                  >
                    <Bookmark className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setSelectedOpp(selectedOpp?.id === opp.id ? null : opp)}
                    className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Enhanced Market Info */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Market</div>
                  <div className="font-bold text-white">{opp.market}</div>
                  <div className="text-sm text-cyan-400">
                    {opp.pick.toUpperCase()} {opp.line}
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">AI Confidence</div>
                  <div className={`font-bold text-xl ${getConfidenceColor(opp.aiModels[filters.aiModel as keyof typeof opp.aiModels] || opp.confidence).split(' ')[0]}`}>
                    {(opp.aiModels[filters.aiModel as keyof typeof opp.aiModels] || opp.confidence).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">vs {opp.impliedProbability.toFixed(1)}% implied</div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Edge</div>
                  <div className={`font-bold text-xl ${getEdgeColor(opp.edge)}`}>
                    +{opp.edge.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">Market inefficiency</div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Kelly %</div>
                  <div className="font-bold text-xl text-purple-400">
                    {opp.advancedMetrics.kellyCriterion.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">Optimal size</div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Expected Value</div>
                  <div className="font-bold text-xl text-green-400">
                    +{opp.advancedMetrics.expectedValue.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">Long-term profit</div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Volatility</div>
                  <div className="font-bold text-xl text-yellow-400">
                    {opp.volatility.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">Risk measure</div>
                </div>
              </div>

              {/* AI Models Consensus */}
              <div className="bg-slate-900/30 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-400 mb-3">AI Models Consensus</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(opp.aiModels).map(([model, confidence]) => (
                    <div key={model} className="text-center">
                      <div className={`font-bold text-lg ${
                        model === filters.aiModel ? 'text-cyan-400' : 'text-white'
                      }`}>
                        {confidence.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400 capitalize">{model}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trend & Analytics */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Trend:</span>
                    {opp.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : opp.trend === 'down' ? (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    ) : (
                      <Activity className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm text-white">{opp.trendStrength}%</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Sharp:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      opp.sharpMoney === 'heavy' ? 'bg-green-500/20 text-green-400' :
                      opp.sharpMoney === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                      opp.sharpMoney === 'light' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {opp.sharpMoney.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Streak:</span>
                    <span className="text-sm text-white">
                      {opp.streakData.current} {opp.streakData.direction}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-400">Last Update</div>
                  <div className="text-sm text-white">
                    {new Date(opp.realTimeUpdates.lastUpdate).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredOpportunities.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No opportunities found</h3>
            <p className="text-gray-400">Try adjusting your filters or search criteria</p>
          </div>
        )}

        {/* Community Engagement */}
        <div className="mt-12">
          <CommunityEngagement />
        </div>
      </div>
    </div>
  );
};

export default EnhancedPropFinderKillerDashboard;
