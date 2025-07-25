import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Clock, 
  Star,
  Activity,
  RefreshCw,
  Calendar,
  ChevronRight,
  Trophy,
  AlertCircle
} from 'lucide-react';

interface GamePrediction {
  id: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  league: string;
  gameTime: string;
  homeSpread: number;
  awaySpread: number;
  overUnder: number;
  homeWinProb: number;
  awayWinProb: number;
  confidence: number;
  recommendation: 'home' | 'away' | 'over' | 'under';
  reasoning: string;
  status: 'upcoming' | 'live' | 'completed';
}

const PredictionDisplay: React.FC = () => {
  const [predictions, setPredictions] = useState<GamePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSport, setSelectedSport] = useState('All');
  const [timeFilter, setTimeFilter] = useState('today');

  // Mock data for demonstration
  const mockPredictions: GamePrediction[] = [
    {
      id: '1',
      homeTeam: 'Los Angeles Lakers',
      awayTeam: 'Boston Celtics',
      sport: 'Basketball',
      league: 'NBA',
      gameTime: '2024-01-15T20:00:00Z',
      homeSpread: -3.5,
      awaySpread: 3.5,
      overUnder: 225.5,
      homeWinProb: 62,
      awayWinProb: 38,
      confidence: 87,
      recommendation: 'home',
      reasoning: 'Lakers have strong home court advantage and favorable matchup against Celtics defense',
      status: 'upcoming'
    },
    {
      id: '2',
      homeTeam: 'Buffalo Bills',
      awayTeam: 'Miami Dolphins',
      sport: 'Football',
      league: 'NFL',
      gameTime: '2024-01-16T18:00:00Z',
      homeSpread: -7.5,
      awaySpread: 7.5,
      overUnder: 47.5,
      homeWinProb: 74,
      awayWinProb: 26,
      confidence: 82,
      recommendation: 'over',
      reasoning: 'High-powered offenses and favorable weather conditions suggest high scoring game',
      status: 'upcoming'
    },
    {
      id: '3',
      homeTeam: 'Edmonton Oilers',
      awayTeam: 'Calgary Flames',
      sport: 'Hockey',
      league: 'NHL',
      gameTime: '2024-01-15T22:00:00Z',
      homeSpread: -1.5,
      awaySpread: 1.5,
      overUnder: 6.5,
      homeWinProb: 68,
      awayWinProb: 32,
      confidence: 79,
      recommendation: 'home',
      reasoning: 'Oilers strong at home with McDavid leading elite offense',
      status: 'live'
    }
  ];

  useEffect(() => {
    setPredictions(mockPredictions);
  }, []);

  const refreshPredictions = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setPredictions(mockPredictions);
    setIsLoading(false);
  };

  const filteredPredictions = predictions
    .filter(p => selectedSport === 'All' || p.sport === selectedSport)
    .filter(p => {
      if (timeFilter === 'today') {
        const today = new Date().toDateString();
        return new Date(p.gameTime).toDateString() === today;
      }
      return true;
    })
    .sort((a, b) => b.confidence - a.confidence);

  const sports = ['All', 'Basketball', 'Football', 'Hockey', 'Baseball'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'text-red-400 bg-red-500/20';
      case 'upcoming': return 'text-green-400 bg-green-500/20';
      case 'completed': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'home': return 'text-blue-400 bg-blue-500/20';
      case 'away': return 'text-purple-400 bg-purple-500/20';
      case 'over': return 'text-green-400 bg-green-500/20';
      case 'under': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <BarChart3 className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Game Predictions</h1>
              <p className="text-gray-400">AI-Powered Sports Game Analysis</p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Sport Filter */}
            <div className="relative">
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sports.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>

            {/* Time Filter */}
            <div className="relative">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="week">This Week</option>
                <option value="all">All Games</option>
              </select>
            </div>

            {/* Refresh */}
            <motion.button
              onClick={refreshPredictions}
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg px-4 py-2 text-blue-400 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Total Games</p>
                <p className="text-xl font-bold text-white">{filteredPredictions.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Avg Confidence</p>
                <p className="text-xl font-bold text-white">
                  {filteredPredictions.length > 0 ? 
                    Math.round(filteredPredictions.reduce((sum, p) => sum + p.confidence, 0) / filteredPredictions.length) : 0}%
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-red-400" />
              <div>
                <p className="text-sm text-gray-400">Live Games</p>
                <p className="text-xl font-bold text-white">
                  {filteredPredictions.filter(p => p.status === 'live').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">High Confidence</p>
                <p className="text-xl font-bold text-white">
                  {filteredPredictions.filter(p => p.confidence > 80).length}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Predictions List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredPredictions.map((prediction, index) => (
              <motion.div
                key={prediction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/30 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Game Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">
                        {prediction.awayTeam} @ {prediction.homeTeam}
                      </h3>
                      <span className={`px-2 py-1 rounded text-sm ${getStatusColor(prediction.status)}`}>
                        {prediction.status.toUpperCase()}
                      </span>
                      <span className="bg-slate-700 text-gray-300 px-2 py-1 rounded text-sm">
                        {prediction.league}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">
                          {new Date(prediction.gameTime).toLocaleDateString()} {new Date(prediction.gameTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-400 text-sm">{prediction.reasoning}</p>
                  </div>

                  {/* Prediction Details */}
                  <div className="flex flex-col gap-4">
                    {/* Win Probabilities */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-400 mb-1">{prediction.homeTeam}</p>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${prediction.homeWinProb}%` }}
                            />
                          </div>
                          <span className="text-white text-sm font-semibold">{prediction.homeWinProb}%</span>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-400 mb-1">{prediction.awayTeam}</p>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-purple-400 to-purple-500 h-2 rounded-full transition-all"
                              style={{ width: `${prediction.awayWinProb}%` }}
                            />
                          </div>
                          <span className="text-white text-sm font-semibold">{prediction.awayWinProb}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Betting Lines */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-400">Spread</p>
                        <p className="text-white font-semibold">{prediction.homeSpread > 0 ? '+' : ''}{prediction.homeSpread}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">O/U</p>
                        <p className="text-white font-semibold">{prediction.overUnder}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Confidence</p>
                        <p className="text-white font-semibold">{prediction.confidence}%</p>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="flex items-center justify-center">
                      <span className={`px-3 py-2 rounded-lg text-sm font-semibold ${getRecommendationColor(prediction.recommendation)}`}>
                        PICK: {prediction.recommendation.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredPredictions.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl text-gray-400 mb-2">No predictions found</h3>
            <p className="text-gray-500">Try adjusting your filters or refresh the data</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PredictionDisplay;
