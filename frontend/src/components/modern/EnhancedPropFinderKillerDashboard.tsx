import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, TrendingUp, Brain, Zap, Target, 
  BarChart3, DollarSign, AlertTriangle, CheckCircle,
  RefreshCw, Settings, Star, Activity, Shield,
  ChevronDown, ChevronUp, Calendar, Clock,
  User, Trophy, Flame, Eye
} from 'lucide-react';

// Enhanced interfaces for quantum AI integration
interface QuantumState {
  superposition: number;
  entanglement: number;
  interference: number;
  coherence: number;
}

interface EnhancedPlayerProp {
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
    state: QuantumState;
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

interface FilterState {
  sport: string;
  propType: string;
  confidence: number;
  expectedValue: number;
  books: string[];
  trends: {
    l5: boolean;
    l10: boolean;
    l15: boolean;
    l20: boolean;
    l25: boolean;
  };
  quantumThreshold: number;
}

const EnhancedPropFinderKillerDashboard: React.FC = () => {
  const [props, setProps] = useState<EnhancedPlayerProp[]>([]);
  const [filteredProps, setFilteredProps] = useState<EnhancedPlayerProp[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    sport: 'all',
    propType: 'all',
    confidence: 0,
    expectedValue: 0,
    books: [],
    trends: {
      l5: false,
      l10: false,
      l15: false,
      l20: false,
      l25: false
    },
    quantumThreshold: 0.5
  });
  const [sortBy, setSortBy] = useState<'confidence' | 'ev' | 'quantum' | 'kelly'>('confidence');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedProp, setSelectedProp] = useState<EnhancedPlayerProp | null>(null);
  const [advancedAnalysisActive, setAdvancedAnalysisActive] = useState(true);
  const [realTimeData, setRealTimeData] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Generate realistic enhanced prop data with quantum AI features
  const generateEnhancedProps = useCallback((): EnhancedPlayerProp[] => {
    const players = [
      { name: 'Mookie Betts', team: 'LAD', position: 'OF' },
      { name: 'Shohei Ohtani', team: 'LAA', position: 'DH/P' },
      { name: 'Ronald Acuña Jr.', team: 'ATL', position: 'OF' },
      { name: 'Juan Soto', team: 'SD', position: 'OF' },
      { name: 'Aaron Judge', team: 'NYY', position: 'OF' },
      { name: 'Mike Trout', team: 'LAA', position: 'OF' },
      { name: 'Fernando Tatis Jr.', team: 'SD', position: 'SS' },
      { name: 'Vladimir Guerrero Jr.', team: 'TOR', position: '1B' },
      { name: 'Bo Bichette', team: 'TOR', position: 'SS' },
      { name: 'Jose Altuve', team: 'HOU', position: '2B' }
    ];

    const propTypes = ['Hits', 'RBIs', 'Runs', 'Home Runs', 'Strikeouts', 'Total Bases'];
    const books = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'BetRivers'];

    return Array.from({ length: 50 }, (_, i) => {
      const player = players[Math.floor(Math.random() * players.length)];
      const propType = propTypes[Math.floor(Math.random() * propTypes.length)];
      const line = Math.random() * 3 + 0.5;
      const overOdds = -110 + Math.random() * 40 - 20;
      const underOdds = -110 + Math.random() * 40 - 20;
      
      // Quantum AI state simulation
      const quantumState: QuantumState = {
        superposition: Math.random(),
        entanglement: Math.random() * 0.8 + 0.1,
        interference: Math.random() * 0.6 + 0.2,
        coherence: Math.random() * 0.9 + 0.1
      };

      // Model ensemble predictions
      const xgboost = Math.random() * 0.4 + 0.3;
      const neuralNet = Math.random() * 0.4 + 0.3;
      const lstm = Math.random() * 0.4 + 0.3;
      const randomForest = Math.random() * 0.4 + 0.3;
      const consensus = (xgboost + neuralNet + lstm + randomForest) / 4;

      const confidence = consensus * quantumState.coherence * 100;
      const expectedValue = (Math.random() - 0.5) * 20;
      const kellySize = Math.max(0, expectedValue / 100) * 0.1;

      return {
        id: `prop-${i}`,
        player: {
          name: player.name,
          team: player.team,
          position: player.position,
          fantasyPoints: Math.random() * 20 + 10,
          injuryStatus: Math.random() > 0.9 ? 'Questionable' : 'Healthy'
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
          state: quantumState,
          prediction: consensus,
          modelEnsemble: {
            xgboost,
            neuralNet,
            lstm,
            randomForest,
            consensus
          },
          riskFactors: ['Weather', 'Opponent Strength'].filter(() => Math.random() > 0.7),
          confidence: confidence
        },
        matchup: {
          opponent: ['WSH', 'NYM', 'PHI', 'MIA', 'BOS'][Math.floor(Math.random() * 5)],
          venue: Math.random() > 0.5 ? 'Home' : 'Away',
          weather: Math.random() > 0.7 ? 'Rain' : 'Clear',
          pace: Math.random() * 10 + 95,
          totalPace: Math.random() * 20 + 90
        },
        trends: {
          l5: Math.random() * 2 + 1,
          l10: Math.random() * 2 + 1,
          l15: Math.random() * 2 + 1,
          l20: Math.random() * 2 + 1,
          l25: Math.random() * 2 + 1,
          vs_opponent: Math.random() * 2 + 1,
          home_away: Math.random() * 2 + 1
        },
        analytics: {
          usage_rate: Math.random() * 30 + 15,
          pace_adjusted: Math.random() * 5 + 20,
          ceiling: Math.random() * 10 + 30,
          floor: Math.random() * 5 + 5,
          consistency: Math.random() * 30 + 70
        }
      };
    });
  }, []);

  // Initialize data
  useEffect(() => {
    const initialProps = generateEnhancedProps();
    setProps(initialProps);
    setFilteredProps(initialProps);
  }, [generateEnhancedProps]);

  // Filter and search logic
  useEffect(() => {
    let filtered = props.filter(prop => {
      const matchesSearch = prop.player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           prop.prop.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           prop.player.team.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesConfidence = prop.prop.confidence >= filters.confidence;
      const matchesEV = prop.prop.expectedValue >= filters.expectedValue;
      const matchesQuantum = prop.quantumAI.state.coherence >= filters.quantumThreshold;

      return matchesSearch && matchesConfidence && matchesEV && matchesQuantum;
    });

    // Sort
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
          aValue = a.quantumAI.state.coherence;
          bValue = b.quantumAI.state.coherence;
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

    setFilteredProps(filtered);
  }, [props, searchTerm, filters, sortBy, sortDirection]);

  // Real-time data simulation
  useEffect(() => {
    if (!realTimeData) return;

    const interval = setInterval(() => {
      setProps(prevProps => 
        prevProps.map(prop => ({
          ...prop,
          prop: {
            ...prop.prop,
            confidence: Math.max(0, Math.min(100, prop.prop.confidence + (Math.random() - 0.5) * 2))
          },
          quantumAI: {
            ...prop.quantumAI,
            state: {
              ...prop.quantumAI.state,
              coherence: Math.max(0, Math.min(1, prop.quantumAI.state.coherence + (Math.random() - 0.5) * 0.1))
            }
          }
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [realTimeData]);

  const QuantumIndicator: React.FC<{ state: QuantumState }> = ({ state }) => (
    <div className="flex items-center space-x-1">
      <div className="w-2 h-2 rounded-full bg-purple-500" 
           style={{ opacity: state.superposition }} />
      <div className="w-2 h-2 rounded-full bg-blue-500" 
           style={{ opacity: state.entanglement }} />
      <div className="w-2 h-2 rounded-full bg-green-500" 
           style={{ opacity: state.interference }} />
      <div className="w-2 h-2 rounded-full bg-yellow-500" 
           style={{ opacity: state.coherence }} />
    </div>
  );

  const ConfidenceBar: React.FC<{ confidence: number; quantum?: boolean }> = ({ confidence, quantum = false }) => (
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
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-8 h-8 text-purple-500" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  PropFinder Killer
                </h1>
                {advancedAnalysisActive && (
                  <div className="flex items-center space-x-1 text-purple-400">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm">Advanced AI</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAdvancedAnalysisActive(!advancedAnalysisActive)}
                  className={`p-2 rounded-lg transition-all ${
                    advancedAnalysisActive ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  <Brain className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRealTimeData(!realTimeData)}
                  className={`p-2 rounded-lg transition-all ${
                    realTimeData ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <div className="flex items-center space-x-1 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span>{filteredProps.length} Props</span>
              </div>
              {realTimeData && (
                <div className="flex items-center space-x-1 text-blue-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Live</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search players, props, teams..."
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

            {/* Advanced Filters Toggle */}
            <div>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                <Filter className="w-5 h-5" />
                <span>Advanced Filters</span>
                {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-700"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Min Expected Value: {filters.expectedValue}%
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Quantum Threshold: {(filters.quantumThreshold * 100).toFixed(0)}%
                  </label>
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

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sport</label>
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Props Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProps.map((prop) => (
            <motion.div
              key={prop.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-800/60 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all cursor-pointer backdrop-blur-sm"
              onClick={() => setSelectedProp(prop)}
            >
              {/* Player Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold">{prop.player.name}</div>
                    <div className="text-sm text-gray-400">{prop.player.team} • {prop.player.position}</div>
                  </div>
                </div>
                {advancedAnalysisActive && <QuantumIndicator state={prop.quantumAI.state} />}
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
                  <div className="font-semibold">{prop.prop.odds.over > 0 ? '+' : ''}{prop.prop.odds.over}</div>
                </div>
                <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-2 text-center">
                  <div className="text-xs text-red-400">UNDER</div>
                  <div className="font-semibold">{prop.prop.odds.under > 0 ? '+' : ''}{prop.prop.odds.under}</div>
                </div>
              </div>

              {/* Confidence and EV */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-400">
                      {quantumAnalysisActive ? 'Quantum Confidence' : 'Confidence'}
                    </span>
                    <span className="text-sm font-semibold">{prop.prop.confidence.toFixed(1)}%</span>
                  </div>
                  <ConfidenceBar confidence={prop.prop.confidence} quantum={quantumAnalysisActive} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Expected Value</span>
                  </div>
                  <span className={`text-sm font-semibold ${prop.prop.expectedValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {prop.prop.expectedValue >= 0 ? '+' : ''}{prop.prop.expectedValue.toFixed(2)}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Kelly Size</span>
                  </div>
                  <span className="text-sm font-semibold text-purple-400">
                    {(prop.prop.kellySize * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Quantum AI Ensemble (if enabled) */}
              {quantumAnalysisActive && (
                <div className="mt-4 pt-3 border-t border-gray-700">
                  <div className="text-sm text-gray-400 mb-2">AI Model Ensemble</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span>XGBoost:</span>
                      <span>{(prop.quantumAI.modelEnsemble.xgboost * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Neural Net:</span>
                      <span>{(prop.quantumAI.modelEnsemble.neuralNet * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>LSTM:</span>
                      <span>{(prop.quantumAI.modelEnsemble.lstm * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Random Forest:</span>
                      <span>{(prop.quantumAI.modelEnsemble.randomForest * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-600 flex justify-between text-sm font-semibold">
                    <span>Consensus:</span>
                    <span className="text-purple-400">{(prop.quantumAI.modelEnsemble.consensus * 100).toFixed(0)}%</span>
                  </div>
                </div>
              )}

              {/* Risk Factors */}
              {prop.quantumAI.riskFactors.length > 0 && (
                <div className="mt-3 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <div className="flex flex-wrap gap-1">
                    {prop.quantumAI.riskFactors.map((risk, index) => (
                      <span key={index} className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded">
                        {risk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {filteredProps.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No props found</h3>
            <p className="text-gray-500">Try adjusting your search terms or filters</p>
          </div>
        )}
      </div>

      {/* Detailed Modal */}
      <AnimatePresence>
        {selectedProp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProp(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Detailed Analysis</h2>
                <button
                  onClick={() => setSelectedProp(null)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Detailed content would go here */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Player Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Name:</span>
                        <span>{selectedProp.player.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Team:</span>
                        <span>{selectedProp.player.team}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Position:</span>
                        <span>{selectedProp.player.position}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Fantasy Points:</span>
                        <span>{selectedProp.player.fantasyPoints?.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Trends Analysis</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">L5:</span>
                        <span>{selectedProp.trends.l5.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">L10:</span>
                        <span>{selectedProp.trends.l10.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">L15:</span>
                        <span>{selectedProp.trends.l15.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">L20:</span>
                        <span>{selectedProp.trends.l20.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">L25:</span>
                        <span>{selectedProp.trends.l25.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">vs Opp:</span>
                        <span>{selectedProp.trends.vs_opponent.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {quantumAnalysisActive && (
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Quantum AI Analysis</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-400">Superposition</span>
                            <span>{(selectedProp.quantumAI.state.superposition * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="h-2 bg-purple-500 rounded-full"
                              style={{ width: `${selectedProp.quantumAI.state.superposition * 100}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-400">Entanglement</span>
                            <span>{(selectedProp.quantumAI.state.entanglement * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="h-2 bg-blue-500 rounded-full"
                              style={{ width: `${selectedProp.quantumAI.state.entanglement * 100}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-400">Coherence</span>
                            <span>{(selectedProp.quantumAI.state.coherence * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="h-2 bg-green-500 rounded-full"
                              style={{ width: `${selectedProp.quantumAI.state.coherence * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Analytics</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Usage Rate:</span>
                        <span>{selectedProp.analytics.usage_rate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Pace Adjusted:</span>
                        <span>{selectedProp.analytics.pace_adjusted.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ceiling:</span>
                        <span>{selectedProp.analytics.ceiling.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Floor:</span>
                        <span>{selectedProp.analytics.floor.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Consistency:</span>
                        <span>{selectedProp.analytics.consistency.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedPropFinderKillerDashboard;
