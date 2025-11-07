import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Brain,
  Calculator,
  CheckCircle,
  Eye,
  Lightbulb,
  RefreshCw,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

// Interfaces
interface AIPrediction {
  id: string;
  player: string;
  playerImage?: string;
  team: string;
  opponent: string;
  sport: string;
  market: string;
  line: number;
  pick: 'OVER' | 'UNDER';
  aiConfidence: number;
  modelConfidence: number;
  edge: number;
  expectedValue: number;
  recommendationStrength: 'STRONG' | 'MODERATE' | 'WEAK';
  reasoning: string[];
  keyFactors: Array<{
    factor: string;
    impact: number;
    positive: boolean;
  }>;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  predictionType: 'ML_ENSEMBLE' | 'AI_ANALYSIS' | 'HYBRID';
  lastUpdated: string;
  gameTime: string;
  odds: number;
  volume: number;
  sharpMoney: number;
  publicBetting: number;
}

// Mock AI predictions data
const mockPredictions: AIPrediction[] = [
  {
    id: '1',
    player: 'Mookie Betts',
    playerImage: '/api/placeholder/60/60',
    team: 'LAD',
    opponent: 'SF',
    sport: 'MLB',
    market: 'Total Bases',
    line: 1.5,
    pick: 'OVER',
    aiConfidence: 94,
    modelConfidence: 91,
    edge: 18.7,
    expectedValue: 12.4,
    recommendationStrength: 'STRONG',
    reasoning: [
      'Excellent recent performance vs left-handed pitching (8-for-12 L5 games)',
      'Opposing pitcher allows 1.8 total bases/game to RHB this season',
      'Favorable ballpark factors with wind conditions supporting offense',
      'Team implied run total suggests high-scoring environment',
    ],
    keyFactors: [
      { factor: 'vs LHP Performance', impact: 85, positive: true },
      { factor: 'Pitcher Matchup', impact: 78, positive: true },
      { factor: 'Park Factors', impact: 72, positive: true },
      { factor: 'Recent Form', impact: 88, positive: true },
    ],
    riskLevel: 'LOW',
    predictionType: 'HYBRID',
    lastUpdated: '2 minutes ago',
    gameTime: 'Tonight 7:10 PM PT',
    odds: -115,
    volume: 1247,
    sharpMoney: 73,
    publicBetting: 42,
  },
  {
    id: '2',
    player: 'Giannis Antetokounmpo',
    playerImage: '/api/placeholder/60/60',
    team: 'MIL',
    opponent: 'BOS',
    sport: 'NBA',
    market: 'Points',
    line: 29.5,
    pick: 'OVER',
    aiConfidence: 87,
    modelConfidence: 84,
    edge: 14.2,
    expectedValue: 8.9,
    recommendationStrength: 'STRONG',
    reasoning: [
      'Dominant performance in recent matchups vs Boston (avg 32.1 ppg L3)',
      'Boston struggles defending paint scoring (28th in paint FG% allowed)',
      'Giannis shooting 68% at the rim over last 10 games',
      'Pace of game projects to favor high scoring totals',
    ],
    keyFactors: [
      { factor: 'Matchup History', impact: 82, positive: true },
      { factor: 'Defensive Weakness', impact: 76, positive: true },
      { factor: 'Recent Shooting', impact: 89, positive: true },
      { factor: 'Game Pace', impact: 71, positive: true },
    ],
    riskLevel: 'MEDIUM',
    predictionType: 'ML_ENSEMBLE',
    lastUpdated: '4 minutes ago',
    gameTime: 'Tonight 8:00 PM ET',
    odds: -110,
    volume: 2134,
    sharpMoney: 68,
    publicBetting: 59,
  },
  {
    id: '3',
    player: 'Josh Allen',
    playerImage: '/api/placeholder/60/60',
    team: 'BUF',
    opponent: 'MIA',
    sport: 'NFL',
    market: 'Passing Yards',
    line: 267.5,
    pick: 'UNDER',
    aiConfidence: 79,
    modelConfidence: 82,
    edge: 9.3,
    expectedValue: 6.1,
    recommendationStrength: 'MODERATE',
    reasoning: [
      'Miami defense allows 3rd fewest passing yards per game (198.4)',
      'Weather conditions showing 18+ mph winds affecting passing game',
      'Buffalo likely to lean on ground game with healthy running backs',
      'Division rival familiarity limits explosive passing plays',
    ],
    keyFactors: [
      { factor: 'Defense Ranking', impact: 81, positive: false },
      { factor: 'Weather Impact', impact: 74, positive: false },
      { factor: 'Game Script', impact: 69, positive: false },
      { factor: 'Divisional Familiarity', impact: 63, positive: false },
    ],
    riskLevel: 'MEDIUM',
    predictionType: 'AI_ANALYSIS',
    lastUpdated: '7 minutes ago',
    gameTime: 'Sunday 1:00 PM ET',
    odds: +105,
    volume: 892,
    sharpMoney: 71,
    publicBetting: 34,
  },
];

const UnifiedAIPredictionsDashboard: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState<'ALL' | 'MLB' | 'NBA' | 'NFL' | 'NHL'>('ALL');
  const [selectedStrength, setSelectedStrength] = useState<'ALL' | 'STRONG' | 'MODERATE' | 'WEAK'>(
    'ALL'
  );
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Filter predictions based on selected filters
  const filteredPredictions = useMemo(() => {
    let filtered = mockPredictions;

    if (selectedSport !== 'ALL') {
      filtered = filtered.filter(pred => pred.sport === selectedSport);
    }

    if (selectedStrength !== 'ALL') {
      filtered = filtered.filter(pred => pred.recommendationStrength === selectedStrength);
    }

    return filtered.sort((a, b) => b.aiConfidence - a.aiConfidence);
  }, [selectedSport, selectedStrength]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // In a real app, this would trigger a data refresh
      console.log('Auto-refreshing AI predictions...');
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div
      className='unified-ai-predictions min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6'
      data-testid='ai-predictions-dashboard'
    >
      {/* Header */}
      <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4'>
        <div>
          <h1 className='text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2 flex items-center gap-3'>
            <Brain className='w-10 h-10 text-cyan-400' />
            AI Predictions Hub
          </h1>
          <p className='text-slate-400'>
            Advanced AI-powered sports betting predictions with confidence scoring
          </p>
        </div>

        <div className='flex items-center gap-4'>
          {/* Auto-refresh toggle */}
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className='rounded'
            />
            <RefreshCw className='w-4 h-4' />
            Auto-refresh
          </label>

          <div className='flex items-center gap-2 text-sm text-slate-400'>
            <Activity className='w-4 h-4 text-green-400' />
            Live AI Analysis
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className='flex flex-wrap gap-4 mb-8'>
        {/* Sport Filter */}
        <div>
          <label className='block text-sm font-medium text-slate-300 mb-2'>Sport</label>
          <select
            value={selectedSport}
            onChange={e => setSelectedSport(e.target.value as any)}
            className='px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500'
          >
            <option value='ALL'>All Sports</option>
            <option value='MLB'>MLB</option>
            <option value='NBA'>NBA</option>
            <option value='NFL'>NFL</option>
            <option value='NHL'>NHL</option>
          </select>
        </div>

        {/* Strength Filter */}
        <div>
          <label className='block text-sm font-medium text-slate-300 mb-2'>Strength</label>
          <select
            value={selectedStrength}
            onChange={e => setSelectedStrength(e.target.value as any)}
            className='px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500'
          >
            <option value='ALL'>All Strengths</option>
            <option value='STRONG'>Strong Only</option>
            <option value='MODERATE'>Moderate</option>
            <option value='WEAK'>Weak</option>
          </select>
        </div>
      </div>

      {/* AI Predictions List */}
      <div className='space-y-6'>
        {filteredPredictions.map(prediction => (
          <motion.div
            key={prediction.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden hover:border-cyan-500/50 transition-all duration-200'
            data-testid='ai-prediction-card'
          >
            {/* Main Prediction Card */}
            <div className='p-6'>
              <div className='flex flex-col lg:flex-row justify-between items-start gap-6'>
                {/* Player Info */}
                <div className='flex items-center gap-4'>
                  <div className='relative'>
                    <img
                      src={prediction.playerImage}
                      alt={prediction.player}
                      className='w-16 h-16 rounded-full object-cover border-2 border-slate-600'
                    />
                    <div
                      className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 ${
                        prediction.riskLevel === 'LOW'
                          ? 'bg-green-500'
                          : prediction.riskLevel === 'MEDIUM'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    ></div>
                  </div>

                  <div>
                    <h3 className='text-xl font-semibold text-white'>{prediction.player}</h3>
                    <p className='text-slate-400'>
                      {prediction.team} vs {prediction.opponent}
                    </p>
                    <div className='flex items-center gap-2 mt-1'>
                      <span className='px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-xs font-medium'>
                        {prediction.sport}
                      </span>
                      <span className='text-slate-500 text-xs'>{prediction.gameTime}</span>
                      <span
                        data-testid='real-time-update-indicator'
                        className='ml-2 text-xs text-cyan-400 font-mono bg-slate-900/40 px-2 py-1 rounded'
                      >
                        Updated: {prediction.lastUpdated}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Prediction Details */}
                <div className='flex-1 max-w-md'>
                  <div className='flex justify-between items-center mb-2'>
                    <span className='text-lg font-semibold text-white'>
                      {prediction.market} {prediction.pick} {prediction.line}
                    </span>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        prediction.recommendationStrength === 'STRONG'
                          ? 'bg-green-500/20 text-green-300'
                          : prediction.recommendationStrength === 'MODERATE'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-slate-500/20 text-slate-300'
                      }`}
                    >
                      {prediction.recommendationStrength}
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-2 text-sm mb-3'>
                    <div>
                      <span className='text-slate-400'>Odds:</span>
                      <span className='text-white ml-2'>
                        {prediction.odds > 0 ? '+' : ''}
                        {prediction.odds}
                      </span>
                    </div>
                    <div>
                      <span className='text-slate-400'>Edge:</span>
                      <span className='text-green-300 ml-2'>{prediction.edge}%</span>
                    </div>
                  </div>

                  <p className='text-slate-300 text-sm leading-relaxed'>
                    {prediction.reasoning[0]}
                  </p>
                </div>

                {/* Confidence Scores */}
                <div className='flex flex-col items-center gap-4'>
                  <div className='text-center'>
                    <div className='relative w-24 h-24'>
                      <svg className='w-24 h-24 transform -rotate-90' viewBox='0 0 100 100'>
                        <circle
                          cx='50'
                          cy='50'
                          r='40'
                          stroke='currentColor'
                          strokeWidth='8'
                          fill='transparent'
                          className='text-slate-700'
                        />
                        <circle
                          cx='50'
                          cy='50'
                          r='40'
                          stroke='currentColor'
                          strokeWidth='8'
                          fill='transparent'
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${
                            2 * Math.PI * 40 * (1 - prediction.aiConfidence / 100)
                          }`}
                          className='text-cyan-400'
                          strokeLinecap='round'
                        />
                      </svg>
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <span className='text-2xl font-bold text-cyan-400'>
                          {prediction.aiConfidence}%
                        </span>
                      </div>
                    </div>
                    <p className='text-xs text-slate-400 mt-2'>AI Confidence</p>
                  </div>

                  <div className='flex gap-4 text-center'>
                    <div>
                      <div className='text-lg font-semibold text-purple-300'>
                        {prediction.modelConfidence}%
                      </div>
                      <div className='text-xs text-slate-400'>Model</div>
                    </div>
                    <div>
                      <div className='text-lg font-semibold text-green-300'>
                        {prediction.expectedValue}
                      </div>
                      <div className='text-xs text-slate-400'>EV</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggle Details Button */}
              <div className='mt-4 pt-4 border-t border-slate-700'>
                <button
                  onClick={() =>
                    setShowDetails(showDetails === prediction.id ? null : prediction.id)
                  }
                  className='flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors'
                >
                  <Eye className='w-4 h-4' />
                  {showDetails === prediction.id ? 'Hide' : 'Show'} Analysis Details
                </button>
              </div>
            </div>

            {/* Detailed Analysis */}
            <AnimatePresence>
              {showDetails === prediction.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='border-t border-slate-700'
                >
                  <PredictionDetails prediction={prediction} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {filteredPredictions.length === 0 && (
        <div className='text-center py-12'>
          <Brain className='w-16 h-16 text-slate-400 mx-auto mb-4' />
          <h3 className='text-xl font-semibold text-slate-300 mb-2'>No predictions found</h3>
          <p className='text-slate-400'>
            Try adjusting your filters or check back soon for new AI analysis
          </p>
        </div>
      )}
    </div>
  );
};

// Prediction Details Component
const PredictionDetails: React.FC<{ prediction: AIPrediction }> = ({ prediction }) => (
  <div className='p-6 bg-slate-900/30'>
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
      {/* Reasoning */}
      <div>
        <h4 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
          <Lightbulb className='w-5 h-5 text-yellow-400' />
          AI Reasoning
        </h4>
        <div className='space-y-3'>
          {prediction.reasoning.map((reason, index) => (
            <div key={index} className='flex items-start gap-3'>
              <CheckCircle className='w-4 h-4 text-green-400 mt-0.5 flex-shrink-0' />
              <p className='text-slate-300 text-sm'>{reason}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Factors */}
      <div>
        <h4 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
          <BarChart3 className='w-5 h-5 text-purple-400' />
          Key Factors
        </h4>
        <div className='space-y-3'>
          {prediction.keyFactors.map((factor, index) => (
            <div key={index} className='space-y-1'>
              <div className='flex justify-between items-center'>
                <span className='text-slate-300 text-sm'>{factor.factor}</span>
                <span
                  className={`text-sm font-medium ${
                    factor.positive ? 'text-green-300' : 'text-red-300'
                  }`}
                >
                  {factor.impact}%
                </span>
              </div>
              <div className='w-full bg-slate-700 rounded-full h-2'>
                <div
                  className={`h-2 rounded-full ${factor.positive ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${factor.impact}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Additional Metrics */}
    <div className='mt-6 pt-6 border-t border-slate-700'>
      <h4 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
        <Calculator className='w-5 h-5 text-cyan-400' />
        Market Intelligence
      </h4>
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='text-center'>
          <div className='text-2xl font-bold text-cyan-300'>
            {prediction.volume.toLocaleString()}
          </div>
          <div className='text-sm text-slate-400'>Volume</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-purple-300'>{prediction.sharpMoney}%</div>
          <div className='text-sm text-slate-400'>Sharp Money</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-yellow-300'>{prediction.publicBetting}%</div>
          <div className='text-sm text-slate-400'>Public</div>
        </div>
        <div className='text-center'>
          <div
            className={`text-2xl font-bold ${
              prediction.riskLevel === 'LOW'
                ? 'text-green-300'
                : prediction.riskLevel === 'MEDIUM'
                ? 'text-yellow-300'
                : 'text-red-300'
            }`}
          >
            {prediction.riskLevel}
          </div>
          <div className='text-sm text-slate-400'>Risk Level</div>
        </div>
      </div>
    </div>
  </div>
);

export default UnifiedAIPredictionsDashboard;
