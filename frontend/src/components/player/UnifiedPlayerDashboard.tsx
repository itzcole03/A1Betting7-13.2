import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Activity,
  Calendar,
  Star,
  Brain,
  Zap,
  Eye,
  Calculator,
  Filter,
  User,
  Trophy,
  Clock,
  Globe
} from 'lucide-react';

// Interfaces
interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  sport: string;
  image?: string;
}

interface PlayerStats {
  season: Record<string, number>;
  recent: Record<string, number>;
  advanced: Record<string, number>;
  trends: Array<{
    metric: string;
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  }>;
}

interface PropPrediction {
  metric: string;
  line: number;
  prediction: number;
  confidence: number;
  recommendation: 'OVER' | 'UNDER' | 'PASS';
  reasoning: string;
  edge: number;
}

// Mock data for demonstration
const mockPlayer: Player = {
  id: 'mookie-betts',
  name: 'Mookie Betts',
  team: 'LAD',
  position: 'RF',
  sport: 'MLB',
  image: '/api/placeholder/120/120'
};

const mockStats: PlayerStats = {
  season: {
    avg: 0.307,
    hr: 39,
    rbi: 107,
    ops: 0.892,
    war: 8.3
  },
  recent: {
    avg: 0.325,
    hr: 3,
    rbi: 8,
    ops: 0.945
  },
  advanced: {
    xwOBA: 0.389,
    barrelRate: 14.2,
    hardHitRate: 48.7,
    exitVelo: 91.2
  },
  trends: [
    { metric: 'Batting Average', value: 0.325, change: 0.018, trend: 'up' },
    { metric: 'Home Runs', value: 3, change: 1.2, trend: 'up' },
    { metric: 'OPS', value: 0.945, change: 0.053, trend: 'up' },
    { metric: 'Exit Velocity', value: 91.2, change: -0.8, trend: 'down' }
  ]
};

const mockPredictions: PropPrediction[] = [
  {
    metric: 'Total Bases',
    line: 1.5,
    prediction: 2.1,
    confidence: 87,
    recommendation: 'OVER',
    reasoning: 'Strong recent performance vs. left-handed pitching',
    edge: 12.4
  },
  {
    metric: 'Hits',
    line: 0.5,
    prediction: 1.3,
    confidence: 82,
    recommendation: 'OVER',
    reasoning: 'Excellent matchup against opposing pitcher',
    edge: 8.7
  },
  {
    metric: 'Runs + RBIs',
    line: 1.5,
    prediction: 1.2,
    confidence: 73,
    recommendation: 'UNDER',
    reasoning: 'Lineup protection concerns in current batting order',
    edge: 5.3
  }
];

const UnifiedPlayerDashboard: React.FC = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player>(mockPlayer);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'trends' | 'predictions' | 'matchups'>('overview');
  const [timeframe, setTimeframe] = useState<'season' | 'l30' | 'l15' | 'l7'>('l15');
  const [searchQuery, setSearchQuery] = useState('');

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  // Main tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'predictions', label: 'AI Predictions', icon: Brain },
    { id: 'matchups', label: 'Matchups', icon: Target }
  ];

  const timeframeOptions = [
    { value: 'season', label: 'Season' },
    { value: 'l30', label: 'L30' },
    { value: 'l15', label: 'L15' },
    { value: 'l7', label: 'L7' }
  ];

  return (
    <motion.div 
      className="unified-player-dashboard min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <motion.div variants={itemVariants} className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 p-0.5">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                <img 
                  src={selectedPlayer.image} 
                  alt={selectedPlayer.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-slate-900"></div>
          </div>
          
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              {selectedPlayer.name}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm font-medium">
                {selectedPlayer.team} - {selectedPlayer.position}
              </span>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium">
                {selectedPlayer.sport}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 w-64"
            />
          </div>

          {/* Timeframe Selector */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            {timeframeOptions.map(option => (
              <option key={option.value} value={option.value} className="bg-slate-900">
                {option.label}
              </option>
            ))}
          </select>
        </motion.div>
      </div>

      {/* Navigation Tabs */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2 mb-8">
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                selectedTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {selectedTab === 'overview' && <OverviewTab stats={mockStats} />}
          {selectedTab === 'trends' && <TrendsTab stats={mockStats} timeframe={timeframe} />}
          {selectedTab === 'predictions' && <PredictionsTab predictions={mockPredictions} />}
          {selectedTab === 'matchups' && <MatchupsTab />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ stats: PlayerStats }> = ({ stats }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Season Stats */}
    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-400" />
        Season Stats
      </h3>
      <div className="space-y-3">
        {Object.entries(stats.season).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center">
            <span className="text-slate-300 uppercase text-sm">{key}</span>
            <span className="font-semibold text-cyan-300">{value}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Recent Performance */}
    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-green-400" />
        Recent (L15)
      </h3>
      <div className="space-y-3">
        {Object.entries(stats.recent).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center">
            <span className="text-slate-300 uppercase text-sm">{key}</span>
            <span className="font-semibold text-green-300">{value}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Advanced Metrics */}
    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-purple-400" />
        Advanced
      </h3>
      <div className="space-y-3">
        {Object.entries(stats.advanced).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center">
            <span className="text-slate-300 text-sm">{key}</span>
            <span className="font-semibold text-purple-300">{value}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Trends Tab Component
const TrendsTab: React.FC<{ stats: PlayerStats; timeframe: string }> = ({ stats, timeframe }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {stats.trends.map((trend, index) => (
      <div key={trend.metric} className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{trend.metric}</h3>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            trend.trend === 'up' ? 'bg-green-500/20 text-green-300' :
            trend.trend === 'down' ? 'bg-red-500/20 text-red-300' :
            'bg-slate-500/20 text-slate-300'
          }`}>
            <TrendingUp className={`w-4 h-4 ${trend.trend === 'down' ? 'rotate-180' : ''}`} />
            {trend.change > 0 ? '+' : ''}{trend.change}
          </div>
        </div>
        
        <div className="text-3xl font-bold text-cyan-300 mb-2">
          {trend.value}
        </div>
        
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full"
            style={{ width: `${Math.min(100, (trend.value / (trend.value + Math.abs(trend.change))) * 100)}%` }}
          ></div>
        </div>
      </div>
    ))}
  </div>
);

// Predictions Tab Component
const PredictionsTab: React.FC<{ predictions: PropPrediction[] }> = ({ predictions }) => (
  <div className="space-y-6">
    {predictions.map((prediction, index) => (
      <div key={prediction.metric} className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
          <div>
            <h3 className="text-xl font-semibold">{prediction.metric}</h3>
            <p className="text-slate-400 text-sm mt-1">{prediction.reasoning}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-lg font-semibold ${
              prediction.recommendation === 'OVER' ? 'bg-green-500/20 text-green-300' :
              prediction.recommendation === 'UNDER' ? 'bg-red-500/20 text-red-300' :
              'bg-slate-500/20 text-slate-300'
            }`}>
              {prediction.recommendation}
            </div>
            
            <div className="text-right">
              <div className="text-sm text-slate-400">Confidence</div>
              <div className="text-lg font-semibold text-cyan-300">{prediction.confidence}%</div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-slate-400">Line</div>
            <div className="text-lg font-semibold">{prediction.line}</div>
          </div>
          <div>
            <div className="text-sm text-slate-400">Prediction</div>
            <div className="text-lg font-semibold text-cyan-300">{prediction.prediction}</div>
          </div>
          <div>
            <div className="text-sm text-slate-400">Edge</div>
            <div className="text-lg font-semibold text-green-300">{prediction.edge}%</div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Matchups Tab Component
const MatchupsTab: React.FC = () => (
  <div className="bg-slate-800/30 rounded-xl p-8 border border-slate-700 text-center">
    <Globe className="w-16 h-16 text-slate-400 mx-auto mb-4" />
    <h3 className="text-xl font-semibold mb-2">Matchup Analysis</h3>
    <p className="text-slate-400">Historical matchup data and opponent analysis coming soon...</p>
  </div>
);

export default UnifiedPlayerDashboard;
