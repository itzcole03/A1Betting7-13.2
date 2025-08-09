import React, { useState, useEffect, useMemo, useCallback, useTransition, useDeferredValue, startTransition } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, TrendingUp, Brain, Zap, Target, 
  BarChart3, DollarSign, AlertTriangle, CheckCircle,
  RefreshCw, Settings, Star, Activity, Shield,
  ChevronDown, ChevronUp, Calendar, Clock,
  User, Trophy, Flame, Eye, Layers, Database
} from 'lucide-react';

// Enhanced interfaces for React 19 concurrent features
interface OptimizedPlayerProp {
  id: string;
  player: {
    name: string;
    team: string;
    position: string;
    image?: string;
    fantasyPoints?: number;
    injuryStatus?: string;
  };
  prop: {
    type: string;
    line: number;
    odds: {
      over: number;
      under: number;
    };
    book: string;
    confidence: number;
    expectedValue: number;
    kellySize: number;
  };
  quantumAI: {
    superposition: number;
    entanglement: number;
    interference: number;
    coherence: number;
    prediction: number;
    modelEnsemble: {
      xgboost: number;
      neuralNet: number;
      lstm: number;
      randomForest: number;
      consensus: number;
    };
    riskFactors: string[];
    confidence: number;
  };
  matchup: {
    opponent: string;
    venue: string;
    weather?: string;
    pace: number;
    totalPace: number;
  };
  trends: {
    l5: number;
    l10: number;
    l15: number;
    l20: number;
    l25: number;
    vs_opponent: number;
    home_away: number;
  };
  analytics: {
    usage_rate: number;
    pace_adjusted: number;
    ceiling: number;
    floor: number;
    consistency: number;
  };
}

interface VirtualizedFilterState {
  sport: string;
  propType: string;
  confidence: number;
  expectedValue: number;
  books: string[];
  quantumThreshold: number;
  showTopOnly: boolean;
  batchSize: number;
}

interface PerformanceMetrics {
  renderTime: number;
  itemsRendered: number;
  virtualItemsCount: number;
  cacheHitRate: number;
  memoryUsage: number;
}

const OptimizedPropFinderKillerDashboard: React.FC = () => {
  // React 19 concurrent features
  const [isPending, startTransition] = useTransition();
  const [allProps, setAllProps] = useState<OptimizedPlayerProp[]>([]);
  const [filteredProps, setFilteredProps] = useState<OptimizedPlayerProp[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [filters, setFilters] = useState<VirtualizedFilterState>({
    sport: 'all',
    propType: 'all',
    confidence: 0,
    expectedValue: 0,
    books: [],
    quantumThreshold: 0.5,
    showTopOnly: false,
    batchSize: 100
  });
  
  // Virtual scrolling state
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [selectedProp, setSelectedProp] = useState<OptimizedPlayerProp | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    itemsRendered: 0,
    virtualItemsCount: 0,
    cacheHitRate: 0,
    memoryUsage: 0
  });

  // Advanced state management
  const [sortBy, setSortBy] = useState<'confidence' | 'ev' | 'quantum' | 'kelly'>('confidence');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [quantumAnalysisActive, setQuantumAnalysisActive] = useState(true);
  const [realTimeData, setRealTimeData] = useState(true);
  const [virtualScrollEnabled, setVirtualScrollEnabled] = useState(true);
  const [showPerformancePanel, setShowPerformancePanel] = useState(false);

  // Generate massive dataset for performance testing
  const generateMassiveDataset = useCallback((count: number = 10000): OptimizedPlayerProp[] => {
    const players = [
      'Mookie Betts', 'Shohei Ohtani', 'Ronald Acuña Jr.', 'Juan Soto', 'Aaron Judge',
      'Mike Trout', 'Fernando Tatis Jr.', 'Vladimir Guerrero Jr.', 'Bo Bichette', 'Jose Altuve',
      'Francisco Lindor', 'Trea Turner', 'Manny Machado', 'Freddie Freeman', 'Paul Goldschmidt',
      'Pete Alonso', 'Kyle Tucker', 'George Springer', 'Rafael Devers', 'Jose Ramirez',
      'Yordan Alvarez', 'Salvador Perez', 'Tim Anderson', 'Carlos Correa', 'Xander Bogaerts',
      'Gleyber Torres', 'Anthony Rizzo', 'Matt Olson', 'Austin Riley', 'Ozzie Albies'
    ];

    const teams = ['LAD', 'LAA', 'ATL', 'SD', 'NYY', 'TOR', 'HOU', 'NYM', 'BOS', 'CLE', 'MIA', 'MIL', 'PHI', 'CHC', 'STL'];
    const positions = ['OF', 'DH', 'SS', '1B', '2B', '3B', 'C', 'P'];
    const propTypes = ['Hits', 'RBIs', 'Runs', 'Home Runs', 'Strikeouts', 'Total Bases', 'Stolen Bases', 'Doubles'];
    const books = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'BetRivers', 'PointsBet', 'WynnBet', 'Barstool'];

    return Array.from({ length: count }, (_, i) => {
      const player = players[Math.floor(Math.random() * players.length)];
      const team = teams[Math.floor(Math.random() * teams.length)];
      const position = positions[Math.floor(Math.random() * positions.length)];
      const propType = propTypes[Math.floor(Math.random() * propTypes.length)];
      const line = Math.random() * 5 + 0.5;
      const overOdds = -110 + Math.random() * 40 - 20;
      const underOdds = -110 + Math.random() * 40 - 20;
      
      // Quantum AI simulation with more realistic distributions
      const superposition = Math.random();
      const entanglement = Math.random() * 0.8 + 0.1;
      const interference = Math.random() * 0.6 + 0.2;
      const coherence = Math.random() * 0.9 + 0.1;

      // Model ensemble predictions
      const xgboost = Math.random() * 0.4 + 0.3;
      const neuralNet = Math.random() * 0.4 + 0.3;
      const lstm = Math.random() * 0.4 + 0.3;
      const randomForest = Math.random() * 0.4 + 0.3;
      const consensus = (xgboost + neuralNet + lstm + randomForest) / 4;

      const confidence = consensus * coherence * 100;
      const expectedValue = (Math.random() - 0.5) * 20;
      const kellySize = Math.max(0, expectedValue / 100) * 0.1;

      return {
        id: `prop-${i}`,
        player: {
          name: player,
          team: team,
          position: position,
          fantasyPoints: Math.random() * 25 + 5,
          injuryStatus: Math.random() > 0.95 ? 'Questionable' : 'Healthy'
        },
        prop: {
          type: propType,
          line: Math.round(line * 10) / 10,
          odds: {
            over: Math.round(overOdds),
            under: Math.round(underOdds)
          },
          book: books[Math.floor(Math.random() * books.length)],
          confidence: Math.round(confidence * 10) / 10,
          expectedValue: Math.round(expectedValue * 100) / 100,
          kellySize: Math.round(kellySize * 1000) / 1000
        },
        quantumAI: {
          superposition,
          entanglement,
          interference,
          coherence,
          prediction: consensus,
          modelEnsemble: {
            xgboost,
            neuralNet,
            lstm,
            randomForest,
            consensus
          },
          riskFactors: ['Weather', 'Opponent Strength', 'Rest Days', 'Venue'].filter(() => Math.random() > 0.8),
          confidence: confidence
        },
        matchup: {
          opponent: teams[Math.floor(Math.random() * teams.length)],
          venue: Math.random() > 0.5 ? 'Home' : 'Away',
          weather: Math.random() > 0.8 ? 'Rain' : 'Clear',
          pace: Math.random() * 15 + 90,
          totalPace: Math.random() * 25 + 85
        },
        trends: {
          l5: Math.random() * 3 + 0.5,
          l10: Math.random() * 3 + 0.5,
          l15: Math.random() * 3 + 0.5,
          l20: Math.random() * 3 + 0.5,
          l25: Math.random() * 3 + 0.5,
          vs_opponent: Math.random() * 3 + 0.5,
          home_away: Math.random() * 3 + 0.5
        },
        analytics: {
          usage_rate: Math.random() * 35 + 10,
          pace_adjusted: Math.random() * 8 + 18,
          ceiling: Math.random() * 15 + 25,
          floor: Math.random() * 8 + 2,
          consistency: Math.random() * 40 + 60
        }
      };
    });
  }, []);

  // Memoized filtering and sorting with React 19 optimizations
  const processedProps = useMemo(() => {
    const startTime = performance.now();
    
    let filtered = allProps.filter(prop => {
      const matchesSearch = prop.player.name.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
                           prop.prop.type.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
                           prop.player.team.toLowerCase().includes(deferredSearchTerm.toLowerCase());

      const matchesConfidence = prop.prop.confidence >= filters.confidence;
      const matchesEV = prop.prop.expectedValue >= filters.expectedValue;
      const matchesQuantum = prop.quantumAI.coherence >= filters.quantumThreshold;

      return matchesSearch && matchesConfidence && matchesEV && matchesQuantum;
    });

    // Advanced sorting
    filtered.sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (sortBy) {
        case 'confidence':
          aValue = a.prop.confidence;
          bValue = b.prop.confidence;
          break;
        case 'ev':
          aValue = a.prop.expectedValue;
          bValue = b.prop.expectedValue;
          break;
        case 'quantum':
          aValue = a.quantumAI.coherence;
          bValue = b.quantumAI.coherence;
          break;
        case 'kelly':
          aValue = a.prop.kellySize;
          bValue = b.prop.kellySize;
          break;
        default:
          aValue = a.prop.confidence;
          bValue = b.prop.confidence;
      }

      return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
    });

    if (filters.showTopOnly) {
      filtered = filtered.slice(0, 100);
    }

    const renderTime = performance.now() - startTime;
    setPerformanceMetrics(prev => ({
      ...prev,
      renderTime,
      itemsRendered: filtered.length
    }));

    return filtered;
  }, [allProps, deferredSearchTerm, filters, sortBy, sortDirection]);

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: virtualScrollEnabled ? processedProps.length : Math.min(processedProps.length, 50),
    getScrollElement: () => containerRef,
    estimateSize: () => 320,
    overscan: 10,
    enableSmoothScroll: true
  });

  // Update virtualized metrics
  useEffect(() => {
    setPerformanceMetrics(prev => ({
      ...prev,
      virtualItemsCount: virtualizer.getVirtualItems().length,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
    }));
  }, [virtualizer.getVirtualItems().length]);

  // Initialize massive dataset
  useEffect(() => {
    startTransition(() => {
      const props = generateMassiveDataset(10000);
      setAllProps(props);
      setFilteredProps(props);
    });
  }, [generateMassiveDataset]);

  // Update filtered props with concurrent features
  useEffect(() => {
    startTransition(() => {
      setFilteredProps(processedProps);
    });
  }, [processedProps]);

  // Real-time data updates with batching
  useEffect(() => {
    if (!realTimeData) return;

    const interval = setInterval(() => {
      startTransition(() => {
        setAllProps(prevProps => 
          prevProps.map(prop => ({
            ...prop,
            prop: {
              ...prop.prop,
              confidence: Math.max(0, Math.min(100, prop.prop.confidence + (Math.random() - 0.5) * 1))
            },
            quantumAI: {
              ...prop.quantumAI,
              coherence: Math.max(0, Math.min(1, prop.quantumAI.coherence + (Math.random() - 0.5) * 0.05))
            }
          }))
        );
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [realTimeData]);

  // Memoized components for performance
  const QuantumIndicator = React.memo<{ quantum: OptimizedPlayerProp['quantumAI'] }>(({ quantum }) => (
    <div className="flex items-center space-x-1">
      <div className="w-2 h-2 rounded-full bg-purple-500" 
           style={{ opacity: quantum.superposition }} />
      <div className="w-2 h-2 rounded-full bg-blue-500" 
           style={{ opacity: quantum.entanglement }} />
      <div className="w-2 h-2 rounded-full bg-green-500" 
           style={{ opacity: quantum.interference }} />
      <div className="w-2 h-2 rounded-full bg-yellow-500" 
           style={{ opacity: quantum.coherence }} />
    </div>
  ));

  const ConfidenceBar = React.memo<{ confidence: number; quantum?: boolean }>(({ confidence, quantum = false }) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-300 ${
          quantum ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 
          confidence >= 80 ? 'bg-green-500' :
          confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
        }`}
        style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
      />
    </div>
  ));

  const PropCard = React.memo<{ prop: OptimizedPlayerProp; index: number }>(({ prop, index }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.01 }}
      className="bg-gray-800/60 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all cursor-pointer backdrop-blur-sm h-80"
      onClick={() => setSelectedProp(prop)}
    >
      {/* Player Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-sm">{prop.player.name}</div>
            <div className="text-xs text-gray-400">{prop.player.team} • {prop.player.position}</div>
          </div>
        </div>
        {quantumAnalysisActive && <QuantumIndicator quantum={prop.quantumAI} />}
      </div>

      {/* Prop Details */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold">{prop.prop.type}</span>
          <span className="text-2xl font-bold text-purple-400">{prop.prop.line}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>vs {prop.matchup.opponent}</span>
          <span>{prop.prop.book}</span>
        </div>
      </div>

      {/* Odds */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-2 text-center">
          <div className="text-xs text-green-400">OVER</div>
          <div className="font-semibold text-sm">{prop.prop.odds.over > 0 ? '+' : ''}{prop.prop.odds.over}</div>
        </div>
        <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-2 text-center">
          <div className="text-xs text-red-400">UNDER</div>
          <div className="font-semibold text-sm">{prop.prop.odds.under > 0 ? '+' : ''}{prop.prop.odds.under}</div>
        </div>
      </div>

      {/* Confidence and EV */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-400">
              {quantumAnalysisActive ? 'Quantum' : 'Confidence'}
            </span>
            <span className="text-sm font-semibold">{prop.prop.confidence.toFixed(1)}%</span>
          </div>
          <ConfidenceBar confidence={prop.prop.confidence} quantum={quantumAnalysisActive} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">EV</span>
          </div>
          <span className={`text-sm font-semibold ${prop.prop.expectedValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {prop.prop.expectedValue >= 0 ? '+' : ''}{prop.prop.expectedValue.toFixed(2)}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Kelly</span>
          </div>
          <span className="text-sm font-semibold text-purple-400">
            {(prop.prop.kellySize * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Risk Factors */}
      {prop.quantumAI.riskFactors.length > 0 && (
        <div className="mt-3 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <div className="flex flex-wrap gap-1">
            {prop.quantumAI.riskFactors.slice(0, 2).map((risk, index) => (
              <span key={index} className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded">
                {risk}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  ));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Header with Performance Metrics */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Layers className="w-8 h-8 text-purple-500" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Optimized PropFinder Killer
                </h1>
                {isPending && (
                  <div className="flex items-center space-x-1 text-blue-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Processing</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setQuantumAnalysisActive(!quantumAnalysisActive)}
                  className={`p-2 rounded-lg transition-all ${
                    quantumAnalysisActive ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  <Brain className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setVirtualScrollEnabled(!virtualScrollEnabled)}
                  className={`p-2 rounded-lg transition-all ${
                    virtualScrollEnabled ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  <Database className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowPerformancePanel(!showPerformancePanel)}
                  className={`p-2 rounded-lg transition-all ${
                    showPerformancePanel ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span>{processedProps.length.toLocaleString()} Props</span>
              </div>
              {virtualScrollEnabled && (
                <div className="flex items-center space-x-1 text-purple-400">
                  <Layers className="w-4 h-4" />
                  <span>Virtual: {virtualizer.getVirtualItems().length}</span>
                </div>
              )}
              <div className="flex items-center space-x-1 text-blue-400">
                <Clock className="w-4 h-4" />
                <span>{performanceMetrics.renderTime.toFixed(1)}ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Panel */}
      <AnimatePresence>
        {showPerformancePanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-900/90 border-b border-gray-700"
          >
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-gray-400">Render Time</div>
                  <div className="text-lg font-semibold text-green-400">{performanceMetrics.renderTime.toFixed(1)}ms</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-gray-400">Items Rendered</div>
                  <div className="text-lg font-semibold text-blue-400">{performanceMetrics.itemsRendered.toLocaleString()}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-gray-400">Virtual Items</div>
                  <div className="text-lg font-semibold text-purple-400">{performanceMetrics.virtualItemsCount}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-gray-400">Total Dataset</div>
                  <div className="text-lg font-semibold text-yellow-400">{allProps.length.toLocaleString()}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-gray-400">Memory Usage</div>
                  <div className="text-lg font-semibold text-orange-400">
                    {(performanceMetrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-gray-400">Virtual Mode</div>
                  <div className={`text-lg font-semibold ${virtualScrollEnabled ? 'text-green-400' : 'text-red-400'}`}>
                    {virtualScrollEnabled ? 'ON' : 'OFF'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search 10,000+ props..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 text-white"
              >
                <option value="confidence">Confidence</option>
                <option value="ev">Expected Value</option>
                <option value="quantum">Quantum Score</option>
                <option value="kelly">Kelly Size</option>
              </select>
            </div>

            {/* Quantum Threshold */}
            <div>
              <div className="mb-1">
                <label className="block text-sm text-gray-400">
                  Quantum: {(filters.quantumThreshold * 100).toFixed(0)}%
                </label>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={filters.quantumThreshold}
                onChange={(e) => setFilters({...filters, quantumThreshold: Number(e.target.value)})}
                className="w-full"
              />
            </div>

            {/* Performance Toggle */}
            <div>
              <button
                onClick={() => setFilters({...filters, showTopOnly: !filters.showTopOnly})}
                className={`w-full p-3 rounded-lg transition-all ${
                  filters.showTopOnly ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                {filters.showTopOnly ? 'Top 100' : 'All Props'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Min Confidence: {filters.confidence}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.confidence}
                onChange={(e) => setFilters({...filters, confidence: Number(e.target.value)})}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Min EV: {filters.expectedValue}%
              </label>
              <input
                type="range"
                min="-10"
                max="20"
                step="0.1"
                value={filters.expectedValue}
                onChange={(e) => setFilters({...filters, expectedValue: Number(e.target.value)})}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Sport</label>
              <select
                value={filters.sport}
                onChange={(e) => setFilters({...filters, sport: e.target.value})}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="all">All Sports</option>
                <option value="mlb">MLB</option>
                <option value="nba">NBA</option>
                <option value="nfl">NFL</option>
                <option value="nhl">NHL</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Virtual Scrolling Container */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {virtualScrollEnabled ? (
          <div
            ref={setContainerRef}
            className="h-[800px] overflow-auto"
            style={{ contain: 'strict' }}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => (
                <div
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className="p-2">
                    <PropCard prop={processedProps[virtualItem.index]} index={virtualItem.index} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {processedProps.slice(0, 50).map((prop, index) => (
              <PropCard key={prop.id} prop={prop} index={index} />
            ))}
          </div>
        )}

        {processedProps.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No props found</h3>
            <p className="text-gray-500">Try adjusting your search terms or filters</p>
          </div>
        )}
      </div>

      {/* Performance Stats Footer */}
      <div className="border-t border-gray-800 bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center space-x-4">
              <span>React 19 Concurrent Features Active</span>
              <span>Virtual Scrolling: {virtualScrollEnabled ? 'Enabled' : 'Disabled'}</span>
              <span>Render Time: {performanceMetrics.renderTime.toFixed(1)}ms</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Dataset: {allProps.length.toLocaleString()} props</span>
              <span>Visible: {virtualScrollEnabled ? virtualizer.getVirtualItems().length : Math.min(50, processedProps.length)}</span>
              <span>Filtered: {processedProps.length.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizedPropFinderKillerDashboard;
