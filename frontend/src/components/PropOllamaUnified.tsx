import React from 'react';
import PrizePicksPro from './user-friendly/PrizePicksPro';

interface PropProjection {
  id: string;
  player: string;
  team: string;
  sport: string;
  statType: string;
  line: number;
  prediction: 'over' | 'under';
  confidence: number;
  value: number;
  reasoning: string;
}

const PropOllamaUnified: React.FC = () => {
  const [projections, setProjections] = useState<PropProjection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSport, setSelectedSport] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('confidence');

  // Mock data for demonstration
  const mockProjections: PropProjection[] = [
    {
      id: '1',
      player: 'LeBron James',
      team: 'LAL',
      sport: 'NBA',
      statType: 'Points',
      line: 25.5,
      prediction: 'over',
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
      prediction: 'over',
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
      prediction: 'over',
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
      prediction: 'over',
      confidence: 75,
      value: 6.2,
      reasoning: 'Good matchup vs left-handed pitching, hitting well at home'
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

        {/* Stats Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Total Props</p>
                <p className="text-xl font-bold text-white">{filteredProjections.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">Avg Confidence</p>
                <p className="text-xl font-bold text-white">
                  {filteredProjections.length > 0 ? 
                    Math.round(filteredProjections.reduce((sum, p) => sum + p.confidence, 0) / filteredProjections.length) : 0}%
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6 text-purple-400" />
              <div>
                <p className="text-sm text-gray-400">High Value</p>
                <p className="text-xl font-bold text-white">
                  {filteredProjections.filter(p => p.value > 7).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-orange-400" />
              <div>
                <p className="text-sm text-gray-400">High Confidence</p>
                <p className="text-xl font-bold text-white">
                  {filteredProjections.filter(p => p.confidence > 80).length}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Projections Grid */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredProjections.map((projection, index) => (
              <motion.div
                key={projection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 hover:border-yellow-500/30 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Player Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">{projection.player}</h3>
                      <span className="bg-slate-700 text-gray-300 px-2 py-1 rounded text-sm">
                        {projection.team}
                      </span>
                      <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-sm">
                        {projection.sport}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{projection.reasoning}</p>
                  </div>

                  {/* Prop Details */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Stat</p>
                      <p className="text-white font-semibold">{projection.statType}</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Line</p>
                      <p className="text-white font-semibold">{projection.line}</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Pick</p>
                      <p className={`font-semibold ${
                        projection.prediction === 'over' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {projection.prediction.toUpperCase()}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Confidence</p>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-yellow-400 to-green-400 h-2 rounded-full transition-all"
                            style={{ width: `${projection.confidence}%` }}
                          />
                        </div>
                        <span className="text-white font-semibold">{projection.confidence}%</span>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Value</p>
                      <p className="text-yellow-400 font-semibold">{projection.value}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

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
    </div>
  );
};

export default PropOllamaUnified;
