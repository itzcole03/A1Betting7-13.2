import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Target, 
  Brain, 
  Star, 
  Trophy, 
  Activity, 
  RefreshCw,
  Search,
  Filter,
  Plus,
  Minus,
  CheckCircle,
  DollarSign
} from 'lucide-react';

interface PropProjection {
  id: string;
  player: string;
  team: string;
  sport: string;
  statType: string;
  line: number;
  overOdds: number;
  underOdds: number;
  confidence: number;
  value: number;
  reasoning: string;
}

interface SelectedProp {
  id: string;
  player: string;
  statType: string;
  line: number;
  choice: 'over' | 'under';
  odds: number;
}

const PropOllamaUnified: React.FC = () => {
  const [projections, setProjections] = useState<PropProjection[]>([]);
  const [selectedProps, setSelectedProps] = useState<SelectedProp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSport, setSelectedSport] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('confidence');
  const [entryAmount, setEntryAmount] = useState(25);

  // Mock data for demonstration
  const mockProjections: PropProjection[] = [
    {
      id: '1',
      player: 'LeBron James',
      team: 'LAL',
      sport: 'NBA',
      statType: 'Points',
      line: 25.5,
      overOdds: -110,
      underOdds: -110,
      confidence: 87,
      value: 8.2,
      reasoning: 'Strong recent scoring form, favorable matchup vs weak defense'
    },
    {
      id: '2',
      player: 'Josh Allen',
      team: 'BUF',
      sport: 'NFL',
      statType: 'Passing Yards',
      line: 287.5,
      overOdds: -105,
      underOdds: -115,
      confidence: 82,
      value: 7.5,
      reasoning: 'Elite passing offense, dome game conditions favor high passing volume'
    },
    {
      id: '3',
      player: 'Connor McDavid',
      team: 'EDM',
      sport: 'NHL',
      statType: 'Points',
      line: 1.5,
      overOdds: -120,
      underOdds: +100,
      confidence: 78,
      value: 6.8,
      reasoning: 'Leading scorer, home ice advantage against struggling defense'
    },
    {
      id: '4',
      player: 'Mookie Betts',
      team: 'LAD',
      sport: 'MLB',
      statType: 'Hits',
      line: 1.5,
      overOdds: -130,
      underOdds: +110,
      confidence: 75,
      value: 6.2,
      reasoning: 'Good matchup vs left-handed pitching, hitting well at home'
    },
    {
      id: '5',
      player: 'Jayson Tatum',
      team: 'BOS',
      sport: 'NBA',
      statType: 'Rebounds',
      line: 8.5,
      overOdds: -110,
      underOdds: -110,
      confidence: 71,
      value: 5.9,
      reasoning: 'Increased rebounding role with team injuries'
    },
    {
      id: '6',
      player: 'Patrick Mahomes',
      team: 'KC',
      sport: 'NFL',
      statType: 'TD Passes',
      line: 2.5,
      overOdds: +115,
      underOdds: -135,
      confidence: 84,
      value: 7.8,
      reasoning: 'Red zone efficiency leader, facing weak secondary'
    }
  ];

  useEffect(() => {
    setProjections(mockProjections);
  }, []);

  const refreshProjections = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setProjections(mockProjections);
    setIsLoading(false);
  };

  const filteredProjections = projections
    .filter(p => selectedSport === 'All' || p.sport === selectedSport)
    .filter(p => searchTerm === '' || 
      p.player.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.team.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      if (sortBy === 'value') return b.value - a.value;
      return a.player.localeCompare(b.player);
    });

  const sports = ['All', 'NBA', 'NFL', 'NHL', 'MLB'];

  const addProp = (projection: PropProjection, choice: 'over' | 'under') => {
    if (selectedProps.length >= 6) return;
    
    // Remove if already selected
    const existingIndex = selectedProps.findIndex(p => p.id === projection.id);
    if (existingIndex !== -1) {
      setSelectedProps(prev => prev.filter(p => p.id !== projection.id));
      return;
    }

    const newProp: SelectedProp = {
      id: projection.id,
      player: projection.player,
      statType: projection.statType,
      line: projection.line,
      choice,
      odds: choice === 'over' ? projection.overOdds : projection.underOdds
    };
    
    setSelectedProps(prev => [...prev, newProp]);
  };

  const removeProp = (id: string) => {
    setSelectedProps(prev => prev.filter(p => p.id !== id));
  };

  const calculatePayout = () => {
    const count = selectedProps.length;
    const multipliers: Record<number, number> = { 2: 3, 3: 5, 4: 10, 5: 20, 6: 50 };
    return count >= 2 ? entryAmount * (multipliers[count] || 0) : 0;
  };

  const isSelected = (projectionId: string) => {
    return selectedProps.some(p => p.id === projectionId);
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
            <div className="p-3 bg-yellow-500/20 rounded-xl">
              <Brain className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">PropOllama</h1>
              <p className="text-gray-400">AI-Powered Sports Prop Analysis</p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Sport Filter */}
            <div className="relative">
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                {sports.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search players or teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="confidence">Sort by Confidence</option>
                <option value="value">Sort by Value</option>
                <option value="player">Sort by Player</option>
              </select>
            </div>

            {/* Refresh */}
            <motion.button
              onClick={refreshProjections}
              disabled={isLoading}
              className="flex items-center gap-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg px-4 py-2 text-yellow-400 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Props List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Available Props</h2>
              <div className="text-sm text-gray-400">{filteredProjections.length} props found</div>
            </div>

            <AnimatePresence>
              {filteredProjections.map((projection, index) => (
                <motion.div
                  key={projection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-slate-800/50 backdrop-blur-lg border rounded-xl p-6 transition-colors ${
                    isSelected(projection.id) 
                      ? 'border-yellow-500/50 bg-yellow-500/10' 
                      : 'border-slate-700/50 hover:border-yellow-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-white">{projection.player}</h3>
                      <span className="bg-slate-700 text-gray-300 px-2 py-1 rounded text-sm">
                        {projection.team}
                      </span>
                      <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-sm">
                        {projection.sport}
                      </span>
                      {isSelected(projection.id) && (
                        <CheckCircle className="w-5 h-5 text-yellow-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-center">
                        <div className="text-sm text-gray-400">Confidence</div>
                        <div className="text-white font-semibold">{projection.confidence}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-400">Value</div>
                        <div className="text-yellow-400 font-semibold">{projection.value}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-2xl font-bold text-white mb-1">
                      {projection.statType}: {projection.line}
                    </div>
                    <p className="text-gray-400 text-sm">{projection.reasoning}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      onClick={() => addProp(projection, 'over')}
                      className="flex items-center justify-between bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg p-3 text-green-400 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="font-semibold">OVER {projection.line}</span>
                      <span className="text-sm">{projection.overOdds > 0 ? '+' : ''}{projection.overOdds}</span>
                    </motion.button>
                    
                    <motion.button
                      onClick={() => addProp(projection, 'under')}
                      className="flex items-center justify-between bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg p-3 text-red-400 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="font-semibold">UNDER {projection.line}</span>
                      <span className="text-sm">{projection.underOdds > 0 ? '+' : ''}{projection.underOdds}</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredProjections.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl text-gray-400 mb-2">No projections found</h3>
                <p className="text-gray-500">Try adjusting your filters or refresh the data</p>
              </motion.div>
            )}
          </div>

          {/* Bet Slip Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 sticky top-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Bet Slip
              </h3>

              {selectedProps.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Select props to build your lineup</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {selectedProps.map((prop) => (
                      <div key={prop.id} className="bg-slate-700/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-white">{prop.player}</div>
                          <button
                            onClick={() => removeProp(prop.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-sm text-gray-300">
                          {prop.choice.toUpperCase()} {prop.line} {prop.statType}
                        </div>
                        <div className="text-sm text-gray-400">
                          {prop.odds > 0 ? '+' : ''}{prop.odds}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-700 pt-4">
                    <div className="mb-4">
                      <label className="block text-sm text-gray-400 mb-2">Entry Amount</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          value={entryAmount}
                          onChange={(e) => setEntryAmount(Number(e.target.value))}
                          min="5"
                          max="1000"
                          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Picks:</span>
                        <span className="text-white">{selectedProps.length}/6</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white">
                          {selectedProps.length >= 2 ? `${selectedProps.length}-Pick` : 'Select 2+ props'}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span className="text-gray-300">Potential Payout:</span>
                        <span className="text-yellow-400">${calculatePayout()}</span>
                      </div>
                    </div>

                    <motion.button
                      disabled={selectedProps.length < 2}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black disabled:text-gray-400 font-semibold py-3 rounded-lg transition-colors"
                      whileHover={{ scale: selectedProps.length >= 2 ? 1.02 : 1 }}
                      whileTap={{ scale: selectedProps.length >= 2 ? 0.98 : 1 }}
                    >
                      {selectedProps.length < 2 ? 'Select 2+ Props' : 'Place Bet'}
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropOllamaUnified;
