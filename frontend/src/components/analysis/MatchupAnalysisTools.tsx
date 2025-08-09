import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Star,
  Zap,
  Shield,
  Clock,
  MapPin,
  Calendar,
  Users,
  Trophy,
  Flame,
  Eye,
  Brain,
  Calculator,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Filter,
  ArrowRight,
  ArrowLeftRight,
  Plus,
  AlertTriangle,
  CheckCircle,
  Info,
  DollarSign,
} from 'lucide-react';

interface PlayerComparison {
  playerA: PlayerMatchupData;
  playerB: PlayerMatchupData;
  directMatchups: DirectMatchupHistory[];
  contextualFactors: ContextualFactor[];
  recommendations: MatchupRecommendation[];
  overallAdvantage: 'playerA' | 'playerB' | 'even';
  confidenceScore: number;
}

interface PlayerMatchupData {
  id: string;
  name: string;
  team: string;
  position: string;
  image?: string;
  stats: MatchupStats;
  trends: TrendAnalysis;
  advantages: string[];
  weaknesses: string[];
  form: FormMetrics;
  situationalPerformance: SituationalStats;
}

interface MatchupStats {
  season: Record<string, number>;
  vsPosition: Record<string, number>;
  vsTeam: Record<string, number>;
  recent: Record<string, number>;
  clutch: Record<string, number>;
}

interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  momentum: number;
  consistency: number;
  peakPerformance: number;
  volatility: number;
}

interface DirectMatchupHistory {
  date: string;
  playerAStats: Record<string, number>;
  playerBStats: Record<string, number>;
  winner: 'playerA' | 'playerB';
  gameContext: GameContext;
  significance: number;
}

interface GameContext {
  venue: 'home' | 'away' | 'neutral';
  gameType: 'regular' | 'playoff' | 'tournament';
  restDays: number;
  injuries: string[];
  weather?: string;
}

interface ContextualFactor {
  factor: string;
  impact: number;
  favors: 'playerA' | 'playerB' | 'neutral';
  description: string;
  confidence: number;
}

interface MatchupRecommendation {
  market: string;
  player: 'playerA' | 'playerB';
  recommendation: 'over' | 'under' | 'first_to' | 'most';
  line?: number;
  confidence: number;
  reasoning: string[];
  edge: number;
}

interface FormMetrics {
  current: number;
  peak: number;
  consistency: number;
  trend: 'improving' | 'declining' | 'stable';
  hotStreak: boolean;
}

interface SituationalStats {
  home: Record<string, number>;
  away: Record<string, number>;
  primetime: Record<string, number>;
  backToBack: Record<string, number>;
  rest: Record<string, number>;
  clutch: Record<string, number>;
}

const MatchupAnalysisTools: React.FC = () => {
  const [selectedPlayerA, setSelectedPlayerA] = useState<string>('tatum-1');
  const [selectedPlayerB, setSelectedPlayerB] = useState<string>('durant-1');
  const [analysisType, setAnalysisType] = useState<'head2head' | 'statistical' | 'situational' | 'predictive'>('head2head');
  const [timeframe, setTimeframe] = useState<'season' | 'l10' | 'l5' | 'career'>('season');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Mock player database
  const playerDatabase = [
    { id: 'tatum-1', name: 'Jayson Tatum', team: 'BOS', position: 'SF', image: '🏀' },
    { id: 'durant-1', name: 'Kevin Durant', team: 'PHX', position: 'PF', image: '🏀' },
    { id: 'lebron-1', name: 'LeBron James', team: 'LAL', position: 'SF', image: '🏀' },
    { id: 'curry-1', name: 'Stephen Curry', team: 'GSW', position: 'PG', image: '🏀' },
    { id: 'giannis-1', name: 'Giannis Antetokounmpo', team: 'MIL', position: 'PF', image: '🏀' },
  ];

  // Mock analysis data
  const mockAnalysis: PlayerComparison = {
    playerA: {
      id: 'tatum-1',
      name: 'Jayson Tatum',
      team: 'Boston Celtics',
      position: 'SF',
      image: '🏀',
      stats: {
        season: { points: 27.8, rebounds: 8.4, assists: 4.9, fg_pct: 0.468, threes: 3.1 },
        vsPosition: { points: 29.2, rebounds: 8.9, assists: 5.1, fg_pct: 0.485, threes: 3.4 },
        vsTeam: { points: 32.1, rebounds: 9.8, assists: 5.7, fg_pct: 0.512, threes: 4.1 },
        recent: { points: 31.2, rebounds: 9.1, assists: 5.4, fg_pct: 0.492, threes: 3.8 },
        clutch: { points: 6.8, fg_pct: 0.445, usage: 0.328 },
      },
      trends: {
        direction: 'up',
        momentum: 0.78,
        consistency: 0.82,
        peakPerformance: 0.91,
        volatility: 0.24,
      },
      advantages: [
        'Shooting efficiency vs SF (48.5% vs 45.2% avg)',
        'Rebounding advantage (8.9 vs 7.1 avg)',
        'Improved 3PT shooting (3.4 vs 2.8 avg)',
        'Strong recent form (+3.4 PPG over L10)',
      ],
      weaknesses: [
        'Turnover prone vs elite defenders',
        'Defensive rating drops in high-pace games',
        'Free throw rate below position average',
      ],
      form: {
        current: 0.89,
        peak: 0.94,
        consistency: 0.82,
        trend: 'improving',
        hotStreak: true,
      },
      situationalPerformance: {
        home: { points: 29.1, rebounds: 8.9, assists: 5.2 },
        away: { points: 26.5, rebounds: 7.9, assists: 4.6 },
        primetime: { points: 30.8, rebounds: 9.4, assists: 5.8 },
        backToBack: { points: 25.2, rebounds: 7.8, assists: 4.2 },
        rest: { points: 28.9, rebounds: 8.7, assists: 5.1 },
        clutch: { points: 6.8, fg_pct: 0.445 },
      },
    },
    playerB: {
      id: 'durant-1',
      name: 'Kevin Durant',
      team: 'Phoenix Suns',
      position: 'PF',
      image: '🏀',
      stats: {
        season: { points: 29.1, rebounds: 6.8, assists: 5.2, fg_pct: 0.523, threes: 2.3 },
        vsPosition: { points: 31.4, rebounds: 7.2, assists: 5.8, fg_pct: 0.538, threes: 2.6 },
        vsTeam: { points: 26.8, rebounds: 6.1, assists: 4.7, fg_pct: 0.498, threes: 2.1 },
        recent: { points: 27.9, rebounds: 6.5, assists: 5.0, fg_pct: 0.515, threes: 2.2 },
        clutch: { points: 7.2, fg_pct: 0.472, usage: 0.315 },
      },
      trends: {
        direction: 'stable',
        momentum: 0.65,
        consistency: 0.91,
        peakPerformance: 0.96,
        volatility: 0.18,
      },
      advantages: [
        'Elite shooting efficiency (52.3% FG)',
        'Clutch performance (47.2% in 4th quarter)',
        'Veteran experience in big games',
        'Height advantage in most matchups',
      ],
      weaknesses: [
        'Lower rebounding rate vs PFs',
        'Aging concerns with minute load',
        'Team chemistry adjustment period',
      ],
      form: {
        current: 0.84,
        peak: 0.96,
        consistency: 0.91,
        trend: 'stable',
        hotStreak: false,
      },
      situationalPerformance: {
        home: { points: 30.2, rebounds: 7.1, assists: 5.5 },
        away: { points: 28.0, rebounds: 6.5, assists: 4.9 },
        primetime: { points: 31.8, rebounds: 7.8, assists: 6.1 },
        backToBack: { points: 26.4, rebounds: 6.2, assists: 4.6 },
        rest: { points: 29.8, rebounds: 7.0, assists: 5.4 },
        clutch: { points: 7.2, fg_pct: 0.472 },
      },
    },
    directMatchups: [
      {
        date: '2023-12-15',
        playerAStats: { points: 34, rebounds: 11, assists: 6, fg_pct: 0.522 },
        playerBStats: { points: 31, rebounds: 8, assists: 5, fg_pct: 0.485 },
        winner: 'playerA',
        gameContext: {
          venue: 'home',
          gameType: 'regular',
          restDays: 1,
          injuries: [],
        },
        significance: 0.85,
      },
      {
        date: '2023-10-28',
        playerAStats: { points: 28, rebounds: 7, assists: 5, fg_pct: 0.457 },
        playerBStats: { points: 35, rebounds: 9, assists: 7, fg_pct: 0.542 },
        winner: 'playerB',
        gameContext: {
          venue: 'away',
          gameType: 'regular',
          restDays: 2,
          injuries: [],
        },
        significance: 0.78,
      },
    ],
    contextualFactors: [
      {
        factor: 'Current Form',
        impact: 0.25,
        favors: 'playerA',
        description: 'Tatum in better recent form with hot shooting streak',
        confidence: 0.87,
      },
      {
        factor: 'Matchup History',
        impact: 0.15,
        favors: 'playerA',
        description: 'Slight edge in recent head-to-head meetings',
        confidence: 0.72,
      },
      {
        factor: 'Shooting Efficiency',
        impact: 0.20,
        favors: 'playerB',
        description: 'Durant maintains elite shooting percentage',
        confidence: 0.91,
      },
      {
        factor: 'Home Court',
        impact: 0.12,
        favors: 'playerA',
        description: 'Game in Boston favors Tatum historically',
        confidence: 0.83,
      },
    ],
    recommendations: [
      {
        market: 'Points',
        player: 'playerA',
        recommendation: 'over',
        line: 27.5,
        confidence: 84,
        reasoning: [
          'Strong recent form (+3.4 PPG over L10)',
          'Favorable matchup vs Durant defensively',
          'Home court advantage worth +2.1 PPG',
        ],
        edge: 11.2,
      },
      {
        market: 'Shooting Efficiency',
        player: 'playerB',
        recommendation: 'over',
        confidence: 89,
        reasoning: [
          'Elite career shooter (52.3% this season)',
          'Historically performs well in Boston',
          'Tatum\'s defense allows higher FG%',
        ],
        edge: 8.7,
      },
    ],
    overallAdvantage: 'playerA',
    confidenceScore: 73.5,
  };

  const analysisTypes = [
    { id: 'head2head', label: 'Head-to-Head', icon: ArrowLeftRight },
    { id: 'statistical', label: 'Statistical', icon: BarChart3 },
    { id: 'situational', label: 'Situational', icon: Clock },
    { id: 'predictive', label: 'Predictive', icon: Brain },
  ];

  const timeframes = [
    { id: 'season', label: 'Season' },
    { id: 'l10', label: 'Last 10' },
    { id: 'l5', label: 'Last 5' },
    { id: 'career', label: 'Career' },
  ];

  const getAdvantageColor = (advantage: string) => {
    switch (advantage) {
      case 'playerA': return 'text-green-400';
      case 'playerB': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate analysis
    setIsAnalyzing(false);
  };

  useEffect(() => {
    runAnalysis();
  }, [selectedPlayerA, selectedPlayerB, analysisType, timeframe]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Matchup Analysis Tools
          </h1>
          <p className="text-gray-400">Advanced head-to-head player vs player comparisons</p>
        </div>

        {/* Controls */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Player A Selection */}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-3 block">Player A</label>
              <select
                value={selectedPlayerA}
                onChange={(e) => setSelectedPlayerA(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              >
                {playerDatabase.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.team})
                  </option>
                ))}
              </select>
            </div>

            {/* Player B Selection */}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-3 block">Player B</label>
              <select
                value={selectedPlayerB}
                onChange={(e) => setSelectedPlayerB(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              >
                {playerDatabase.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.team})
                  </option>
                ))}
              </select>
            </div>

            {/* Analysis Type */}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-3 block">Analysis Type</label>
              <div className="grid grid-cols-2 gap-2">
                {analysisTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setAnalysisType(type.id as any)}
                    className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      analysisType === type.id
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    <type.icon className="w-3 h-3" />
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Timeframe */}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-3 block">Timeframe</label>
              <div className="grid grid-cols-2 gap-2">
                {timeframes.map(frame => (
                  <button
                    key={frame.id}
                    onClick={() => setTimeframe(frame.id as any)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      timeframe === frame.id
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    {frame.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-purple-600 transition-all disabled:opacity-50"
              >
                {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                <span>{isAnalyzing ? 'Analyzing...' : 'Run Analysis'}</span>
              </button>
              
              <div className={`text-sm font-medium ${getAdvantageColor(mockAnalysis.overallAdvantage)}`}>
                Overall Advantage: {mockAnalysis.overallAdvantage === 'playerA' ? mockAnalysis.playerA.name : 
                                   mockAnalysis.overallAdvantage === 'playerB' ? mockAnalysis.playerB.name : 'Even'}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-lg font-bold text-cyan-400">{mockAnalysis.confidenceScore.toFixed(1)}%</div>
              <div className="text-sm text-gray-400">Confidence</div>
            </div>
          </div>
        </div>

        {!isAnalyzing && (
          <div className="space-y-8">
            {/* Player Comparison Overview */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Player Comparison</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Player A */}
                <div className="bg-slate-700/30 rounded-lg p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="text-3xl">{mockAnalysis.playerA.image}</div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{mockAnalysis.playerA.name}</h3>
                      <p className="text-gray-400">{mockAnalysis.playerA.team} • {mockAnalysis.playerA.position}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Form:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-600 rounded-full h-2">
                          <div
                            className="bg-green-400 h-2 rounded-full"
                            style={{ width: `${mockAnalysis.playerA.form.current * 100}%` }}
                          />
                        </div>
                        <span className="text-green-400 text-sm font-bold">
                          {(mockAnalysis.playerA.form.current * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-gray-400">Recent Stats (L10):</div>
                      {Object.entries(mockAnalysis.playerA.stats.recent).map(([stat, value]) => (
                        <div key={stat} className="flex justify-between text-sm">
                          <span className="capitalize text-gray-300">{stat.replace('_', ' ')}:</span>
                          <span className="text-white font-medium">
                            {typeof value === 'number' ? value.toFixed(1) : value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* VS indicator */}
                <div className="flex items-center justify-center">
                  <div className="bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full p-4">
                    <ArrowLeftRight className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Player B */}
                <div className="bg-slate-700/30 rounded-lg p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="text-3xl">{mockAnalysis.playerB.image}</div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{mockAnalysis.playerB.name}</h3>
                      <p className="text-gray-400">{mockAnalysis.playerB.team} • {mockAnalysis.playerB.position}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Form:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-600 rounded-full h-2">
                          <div
                            className="bg-blue-400 h-2 rounded-full"
                            style={{ width: `${mockAnalysis.playerB.form.current * 100}%` }}
                          />
                        </div>
                        <span className="text-blue-400 text-sm font-bold">
                          {(mockAnalysis.playerB.form.current * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-gray-400">Recent Stats (L10):</div>
                      {Object.entries(mockAnalysis.playerB.stats.recent).map(([stat, value]) => (
                        <div key={stat} className="flex justify-between text-sm">
                          <span className="capitalize text-gray-300">{stat.replace('_', ' ')}:</span>
                          <span className="text-white font-medium">
                            {typeof value === 'number' ? value.toFixed(1) : value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contextual Factors */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-xl font-bold text-white mb-6">Contextual Factors</h3>
              
              <div className="space-y-4">
                {mockAnalysis.contextualFactors.map((factor, index) => (
                  <div key={index} className="bg-slate-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          factor.favors === 'playerA' ? 'bg-green-400' :
                          factor.favors === 'playerB' ? 'bg-blue-400' : 'bg-gray-400'
                        }`} />
                        <div>
                          <div className="font-medium text-white">{factor.factor}</div>
                          <div className="text-sm text-gray-400">{factor.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">{(factor.impact * 100).toFixed(0)}%</div>
                        <div className="text-xs text-gray-400">Impact</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Matchup History */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-xl font-bold text-white mb-6">Recent Head-to-Head</h3>
              
              <div className="space-y-4">
                {mockAnalysis.directMatchups.map((matchup, index) => (
                  <div key={index} className="bg-slate-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-white font-medium">{matchup.date}</span>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          matchup.winner === 'playerA' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          Winner: {matchup.winner === 'playerA' ? mockAnalysis.playerA.name : mockAnalysis.playerB.name}
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        {matchup.gameContext.venue.toUpperCase()} • {matchup.gameContext.gameType.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-green-400 font-medium mb-2">{mockAnalysis.playerA.name}</div>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          {Object.entries(matchup.playerAStats).map(([stat, value]) => (
                            <div key={stat} className="text-center">
                              <div className="text-white font-bold">{typeof value === 'number' ? value.toFixed(1) : value}</div>
                              <div className="text-gray-400 text-xs capitalize">{stat.replace('_', ' ')}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-blue-400 font-medium mb-2">{mockAnalysis.playerB.name}</div>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          {Object.entries(matchup.playerBStats).map(([stat, value]) => (
                            <div key={stat} className="text-center">
                              <div className="text-white font-bold">{typeof value === 'number' ? value.toFixed(1) : value}</div>
                              <div className="text-gray-400 text-xs capitalize">{stat.replace('_', ' ')}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Betting Recommendations */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-xl font-bold text-white mb-6">Betting Recommendations</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockAnalysis.recommendations.map((rec, index) => (
                  <div key={index} className="bg-slate-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-yellow-400" />
                        <span className="font-bold text-white">{rec.market}</span>
                        <span className={`text-sm font-medium ${
                          rec.player === 'playerA' ? 'text-green-400' : 'text-blue-400'
                        }`}>
                          ({rec.player === 'playerA' ? mockAnalysis.playerA.name : mockAnalysis.playerB.name})
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-cyan-400">{rec.confidence}%</div>
                        <div className="text-xs text-gray-400">Confidence</div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-sm text-gray-400 mb-1">Recommendation:</div>
                      <div className="text-white font-medium">
                        {rec.recommendation.toUpperCase()} {rec.line} 
                        <span className="text-green-400 ml-2">(+{rec.edge.toFixed(1)}% edge)</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-sm text-gray-400">Reasoning:</div>
                      {rec.reasoning.map((reason, i) => (
                        <div key={i} className="flex items-start space-x-2">
                          <CheckCircle className="w-3 h-3 text-green-400 mt-1" />
                          <span className="text-sm text-gray-300">{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isAnalyzing && (
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-12 text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
              <Brain className="absolute inset-0 w-8 h-8 text-purple-400 m-auto" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">AI Analysis in Progress</h3>
            <p className="text-gray-400">Processing matchup data, statistical models, and contextual factors...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchupAnalysisTools;
