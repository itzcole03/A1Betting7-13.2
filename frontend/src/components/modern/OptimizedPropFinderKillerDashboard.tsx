import React, { 
  useState, 
  useEffect, 
  useMemo, 
  useCallback, 
  memo, 
  lazy, 
  Suspense,
  useTransition, 
  useDeferredValue,
  startTransition 
} from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { FixedSizeList as List } from 'react-window';
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Zap,
  Brain,
  Target,
  Clock,
  DollarSign,
  BarChart3,
  Activity,
  Star,
  ChevronDown,
  ChevronUp,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Maximize2,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Info,
  Bookmark,
  Share2,
  Download,
  Trophy,
  Flame,
  Shield,
  Calculator,
  Wifi,
  WifiOff,
  Database,
  Cpu,
  Radio,
  Gauge,
} from 'lucide-react';

// Lazy loaded components for better code splitting
const CommunityEngagement = lazy(() => import('../community/CommunityEngagement'));
const AdvancedAnalyticsPanel = lazy(() => import('./AdvancedAnalyticsPanel'));
const DataQualityMonitor = lazy(() => import('./DataQualityMonitor'));

// Enhanced interfaces with optimized structure
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

interface PerformanceConfig {
  virtualizedListHeight: number;
  itemSize: number;
  overscan: number;
  debounceDelay: number;
  maxVisibleItems: number;
  enableVirtualization: boolean;
  enableMemoryOptimization: boolean;
  enablePrefetching: boolean;
}

// Optimized opportunity card component with memoization
const OpportunityCard = memo(({ 
  opportunity, 
  isSelected, 
  onSelect, 
  onBookmark, 
  filters,
  style 
}: {
  opportunity: PropOpportunity;
  isSelected: boolean;
  onSelect: (opp: PropOpportunity | null) => void;
  onBookmark: (id: string) => void;
  filters: FilterState;
  style?: React.CSSProperties;
}) => {
  // Memoized color calculations
  const confidenceColor = useMemo(() => {
    if (opportunity.confidence >= 90) return 'text-green-400 bg-green-500/20';
    if (opportunity.confidence >= 80) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-orange-400 bg-orange-500/20';
  }, [opportunity.confidence]);

  const edgeColor = useMemo(() => {
    if (opportunity.edge >= 20) return 'text-green-400';
    if (opportunity.edge >= 10) return 'text-yellow-400';
    return 'text-orange-400';
  }, [opportunity.edge]);

  const dataQualityColor = useMemo(() => {
    if (opportunity.dataQuality.score >= 95) return 'text-green-400';
    if (opportunity.dataQuality.score >= 90) return 'text-yellow-400';
    return 'text-orange-400';
  }, [opportunity.dataQuality.score]);

  const handleBookmarkClick = useCallback(() => {
    onBookmark(opportunity.id);
  }, [opportunity.id, onBookmark]);

  const handleSelectClick = useCallback(() => {
    onSelect(isSelected ? null : opportunity);
  }, [isSelected, opportunity, onSelect]);

  return (
    <motion.div
      style={style}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/30 transition-all mx-2 my-2"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-white">
                {opportunity.player.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-xs">
              {opportunity.team}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{opportunity.player}</h3>
            <p className="text-sm text-gray-400">{opportunity.team} vs {opportunity.opponent} • {opportunity.timeToGame}</p>
            <div className="flex items-center space-x-2 mt-1">
              {opportunity.realTimeUpdates.isLive && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400">Live</span>
                </div>
              )}
              <span className={`text-xs ${dataQualityColor}`}>
                Data Quality: {opportunity.dataQuality.score.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleBookmarkClick}
            className={`p-2 rounded-lg transition-all ${
              opportunity.isBookmarked 
                ? 'text-yellow-400 bg-yellow-500/20' 
                : 'text-gray-400 hover:text-yellow-400'
            }`}
          >
            <Bookmark className="w-5 h-5" />
          </button>
          <button 
            onClick={handleSelectClick}
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
          <div className="font-bold text-white">{opportunity.market}</div>
          <div className="text-sm text-cyan-400">
            {opportunity.pick.toUpperCase()} {opportunity.line}
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">AI Confidence</div>
          <div className={`font-bold text-xl ${confidenceColor.split(' ')[0]}`}>
            {(opportunity.aiModels[filters.aiModel as keyof typeof opportunity.aiModels] || opportunity.confidence).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">vs {opportunity.impliedProbability.toFixed(1)}% implied</div>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Edge</div>
          <div className={`font-bold text-xl ${edgeColor}`}>
            +{opportunity.edge.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Market inefficiency</div>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Kelly %</div>
          <div className="font-bold text-xl text-purple-400">
            {opportunity.advancedMetrics.kellyCriterion.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Optimal size</div>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Expected Value</div>
          <div className="font-bold text-xl text-green-400">
            +{opportunity.advancedMetrics.expectedValue.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Long-term profit</div>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Volatility</div>
          <div className="font-bold text-xl text-yellow-400">
            {opportunity.volatility.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Risk measure</div>
        </div>
      </div>

      {/* AI Models Consensus */}
      <div className="bg-slate-900/30 rounded-lg p-4 mb-4">
        <div className="text-sm text-gray-400 mb-3">AI Models Consensus</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(opportunity.aiModels).map(([model, confidence]) => (
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
            {opportunity.trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : opportunity.trend === 'down' ? (
              <TrendingDown className="w-4 h-4 text-red-400" />
            ) : (
              <Activity className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm text-white">{opportunity.trendStrength}%</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Sharp:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              opportunity.sharpMoney === 'heavy' ? 'bg-green-500/20 text-green-400' :
              opportunity.sharpMoney === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
              opportunity.sharpMoney === 'light' ? 'bg-orange-500/20 text-orange-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {opportunity.sharpMoney.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Streak:</span>
            <span className="text-sm text-white">
              {opportunity.streakData.current} {opportunity.streakData.direction}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-400">Last Update</div>
          <div className="text-sm text-white">
            {new Date(opportunity.realTimeUpdates.lastUpdate).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

OpportunityCard.displayName = 'OpportunityCard';

// Virtualized list renderer
const VirtualizedOpportunityList = memo(({ 
  opportunities, 
  selectedOpp, 
  onSelect, 
  onBookmark, 
  filters,
  height,
  itemSize 
}: {
  opportunities: PropOpportunity[];
  selectedOpp: PropOpportunity | null;
  onSelect: (opp: PropOpportunity | null) => void;
  onBookmark: (id: string) => void;
  filters: FilterState;
  height: number;
  itemSize: number;
}) => {
  const renderItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const opportunity = opportunities[index];
    return (
      <OpportunityCard
        key={opportunity.id}
        opportunity={opportunity}
        isSelected={selectedOpp?.id === opportunity.id}
        onSelect={onSelect}
        onBookmark={onBookmark}
        filters={filters}
        style={style}
      />
    );
  }, [opportunities, selectedOpp, onSelect, onBookmark, filters]);

  return (
    <List
      height={height}
      itemCount={opportunities.length}
      itemSize={itemSize}
      overscanCount={5}
      width="100%"
    >
      {renderItem}
    </List>
  );
});

VirtualizedOpportunityList.displayName = 'VirtualizedOpportunityList';

// Main optimized dashboard component
const OptimizedPropFinderKillerDashboard: React.FC = () => {
  // State management with performance optimizations
  const [opportunities, setOpportunities] = useState<PropOpportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<PropOpportunity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpp, setSelectedOpp] = useState<PropOpportunity | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact' | 'virtualized'>('virtualized');
  const [showOnlyPremium, setShowOnlyPremium] = useState(false);
  const [dataFeeds, setDataFeeds] = useState<DataFeed[]>([]);
  const [predictiveModels, setPredictiveModels] = useState<PredictiveModel[]>([]);
  const [realTimeConnected, setRealTimeConnected] = useState(true);
  const [systemHealth, setSystemHealth] = useState(98.7);

  // Performance configuration
  const [performanceConfig] = useState<PerformanceConfig>({
    virtualizedListHeight: 800,
    itemSize: 400,
    overscan: 5,
    debounceDelay: 300,
    maxVisibleItems: 50,
    enableVirtualization: true,
    enableMemoryOptimization: true,
    enablePrefetching: true,
  });

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

  // Memoized feed status icon
  const getFeedStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-400" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    }
  }, []);

  // Optimized bookmark toggle with useCallback
  const toggleBookmark = useCallback((id: string) => {
    setOpportunities(prev =>
      prev.map(opp =>
        opp.id === id ? { ...opp, isBookmarked: !opp.isBookmarked } : opp
      )
    );
  }, []);

  // Optimized select handler
  const handleSelectOpportunity = useCallback((opp: PropOpportunity | null) => {
    setSelectedOpp(opp);
  }, []);

  // Initialize data feeds with performance optimization
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

  // Enhanced mock data generation with performance considerations
  useEffect(() => {
    const generateMockData = (count: number = 100): PropOpportunity[] => {
      const players = ['LeBron James', 'Luka Dončić', 'Stephen Curry', 'Kevin Durant', 'Giannis Antetokounmpo'];
      const teams = ['LAL', 'DAL', 'GSW', 'PHX', 'MIL'];
      const markets = ['Points', 'Assists', 'Rebounds', 'Threes', 'Steals'];
      
      return Array.from({ length: count }, (_, i) => ({
        id: `${i + 1}`,
        player: players[i % players.length],
        playerImage: '/api/placeholder/40/40',
        team: teams[i % teams.length],
        teamLogo: '/api/placeholder/24/24',
        opponent: teams[(i + 1) % teams.length],
        opponentLogo: '/api/placeholder/24/24',
        sport: 'NBA' as const,
        market: markets[i % markets.length],
        line: 20 + Math.random() * 20,
        pick: Math.random() > 0.5 ? 'over' as const : 'under' as const,
        odds: -120 + Math.random() * 40,
        impliedProbability: 45 + Math.random() * 20,
        aiProbability: 60 + Math.random() * 30,
        edge: Math.random() * 30,
        confidence: 80 + Math.random() * 20,
        projectedValue: 20 + Math.random() * 20,
        volume: Math.floor(Math.random() * 1000),
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any,
        trendStrength: Math.floor(Math.random() * 100),
        timeToGame: `${Math.floor(Math.random() * 8)}h ${Math.floor(Math.random() * 60)}m`,
        venue: Math.random() > 0.5 ? 'home' as const : 'away' as const,
        weather: 'Clear',
        injuries: [],
        recentForm: Array.from({ length: 5 }, () => Math.floor(Math.random() * 40)),
        matchupHistory: { 
          games: Math.floor(Math.random() * 20), 
          average: 20 + Math.random() * 20, 
          hitRate: Math.floor(Math.random() * 100) 
        },
        lineMovement: { 
          open: 20 + Math.random() * 10, 
          current: 20 + Math.random() * 10, 
          direction: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any,
          steam: Math.random() > 0.7,
          sharpAction: Math.floor(Math.random() * 100)
        },
        bookmakers: [
          { name: 'DraftKings', odds: -110, line: 25.5, volume: 234, lastUpdate: '1m ago' },
          { name: 'FanDuel', odds: -105, line: 25.5, volume: 189, lastUpdate: '2m ago' },
        ],
        isBookmarked: Math.random() > 0.8,
        tags: ['AI Pick', 'High Value'],
        socialSentiment: Math.floor(Math.random() * 100),
        sharpMoney: ['heavy', 'moderate', 'light', 'public'][Math.floor(Math.random() * 4)] as any,
        aiModels: {
          ensemble: 85 + Math.random() * 15,
          xgboost: 80 + Math.random() * 20,
          neuralNet: 80 + Math.random() * 20,
          lstm: 75 + Math.random() * 25,
          consensus: 80 + Math.random() * 20,
        },
        marketEfficiency: Math.random() * 100,
        volatility: Math.random() * 50,
        momentum: Math.random() * 100,
        streakData: {
          current: Math.floor(Math.random() * 10),
          direction: Math.random() > 0.5 ? 'over' as const : 'under' as const,
          significance: Math.random() * 100,
        },
        advancedMetrics: {
          kellyCriterion: Math.random() * 20,
          expectedValue: Math.random() * 30,
          riskAdjustedReturn: Math.random() * 25,
          sharpeRatio: Math.random() * 5,
        },
        dataQuality: {
          score: 85 + Math.random() * 15,
          sources: Math.floor(Math.random() * 10) + 3,
          freshness: 90 + Math.random() * 10,
          reliability: 85 + Math.random() * 15,
        },
        realTimeUpdates: {
          lastUpdate: new Date().toISOString(),
          frequency: Math.floor(Math.random() * 10) + 1,
          isLive: Math.random() > 0.3,
        },
      }));
    };

    setOpportunities(generateMockData(performanceConfig.maxVisibleItems));
  }, [performanceConfig.maxVisibleItems]);

  // Optimized real-time data simulation with debouncing
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (performanceConfig.enableMemoryOptimization) {
        setOpportunities(prev => {
          const updatedOpps = prev.slice(0, performanceConfig.maxVisibleItems).map(opp => ({
            ...opp,
            confidence: Math.min(Math.max(opp.confidence + (Math.random() - 0.5) * 2, 80), 99),
            edge: Math.max(opp.edge + (Math.random() - 0.5) * 1, 0),
            volume: opp.volume + Math.floor(Math.random() * 50),
            realTimeUpdates: {
              ...opp.realTimeUpdates,
              lastUpdate: new Date().toISOString(),
            },
          }));
          return updatedOpps;
        });
      } else {
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
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, performanceConfig.enableMemoryOptimization, performanceConfig.maxVisibleItems]);

  // Enhanced filtering with AI model selection and performance optimizations
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
      
      // Search query filter with performance optimization
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

  // Update filtered opportunities with transition
  useEffect(() => {
    startTransitionLocal(() => {
      setFilteredOpportunities(filteredAndSortedOpportunities);
    });
  }, [filteredAndSortedOpportunities]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Enhanced Header with Real-time Status */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                PropFinder Killer Pro
              </h1>
              <p className="text-gray-400 text-sm">
                Optimized AI-Enhanced Prop Research • {filteredOpportunities.length} Opportunities • {viewMode.toUpperCase()} Mode
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

              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white font-medium">
                  {performanceConfig.enableVirtualization ? 'Virtualized' : 'Standard'}
                </span>
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
        {/* Data Feeds Monitor with Performance Metrics */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Data Feeds & AI Models</h3>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                {dataFeeds.filter(f => f.status === 'connected').length}/{dataFeeds.length} feeds active
              </span>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-400">Mode:</span>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as any)}
                  className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                >
                  <option value="virtualized">Virtualized</option>
                  <option value="grid">Grid</option>
                  <option value="list">List</option>
                  <option value="compact">Compact</option>
                </select>
              </div>
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

        {/* Optimized Opportunity Display */}
        <div className="space-y-6">
          {isPending && (
            <div className="text-center py-8">
              <div className="inline-flex items-center space-x-2 text-cyan-400">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Updating opportunities...</span>
              </div>
            </div>
          )}

          {/* Virtualized View */}
          {viewMode === 'virtualized' && filteredOpportunities.length > 0 && (
            <div className="bg-slate-800/30 rounded-xl p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  Virtualized Opportunities ({filteredOpportunities.length})
                </h3>
                <div className="text-sm text-gray-400">
                  Performance Mode: {performanceConfig.enableVirtualization ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              <VirtualizedOpportunityList
                opportunities={filteredOpportunities}
                selectedOpp={selectedOpp}
                onSelect={handleSelectOpportunity}
                onBookmark={toggleBookmark}
                filters={filters}
                height={performanceConfig.virtualizedListHeight}
                itemSize={performanceConfig.itemSize}
              />
            </div>
          )}

          {/* Standard Grid View */}
          {viewMode !== 'virtualized' && (
            <LayoutGroup>
              {filteredOpportunities.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  isSelected={selectedOpp?.id === opp.id}
                  onSelect={handleSelectOpportunity}
                  onBookmark={toggleBookmark}
                  filters={filters}
                />
              ))}
            </LayoutGroup>
          )}
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

        {/* Lazy Loaded Components */}
        <div className="mt-12 space-y-8">
          <Suspense fallback={
            <div className="bg-slate-800/50 rounded-xl p-8 text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
              <p className="text-gray-400">Loading advanced features...</p>
            </div>
          }>
            <CommunityEngagement />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default OptimizedPropFinderKillerDashboard;
