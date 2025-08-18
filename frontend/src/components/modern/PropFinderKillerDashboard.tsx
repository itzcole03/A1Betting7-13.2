import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ChevronDown,
  Search,
  User,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Settings,
  Star,
} from 'lucide-react';

// Types matching PropFinder interface exactly
interface PropFinderPlayer {
  id: string;
  name: string;
  team: string;
  position: string;
  number: number;
  imageUrl?: string;
  pfRating: number;
  prop: string;
  l10Avg: number;
  l5Avg: number;
  odds: string;
  streak: number;
  matchup: string;
  percentages: {
    '2024': number;
    '2025': number;
    'h2h': number;
    'l5': number;
    'last': number;
    'l4': number;
  };
  isFavorite: boolean;
}

interface PropCategory {
  id: string;
  name: string;
  selected: boolean;
}

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  time: string;
  date: string;
  selected: boolean;
  locked?: boolean;
}

const PropFinderKillerDashboard: React.FC = () => {
  const [betType, setBetType] = useState<'OVER' | 'UNDER'>('OVER');
  const [searchPlayer, setSearchPlayer] = useState('Search Player');
  const [showAllLines, setShowAllLines] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showGamesDropdown, setShowGamesDropdown] = useState(false);

  const [categories, setCategories] = useState<PropCategory[]>([
    { id: 'hits', name: 'Hits', selected: true },
    { id: 'totalBases', name: 'Total Bases', selected: true },
    { id: 'homeRuns', name: 'Home Runs', selected: true },
    { id: 'singles', name: 'Singles', selected: true },
    { id: 'doubles', name: 'Doubles', selected: true },
    { id: 'triples', name: 'Triples', selected: true },
    { id: 'battingStrikeouts', name: 'Batting Strikeouts', selected: true },
    { id: 'runs', name: 'Runs', selected: true },
    { id: 'rbis', name: 'RBIs', selected: true },
    { id: 'hitsRunsRbis', name: 'Hits + Runs + RBIs', selected: true },
    { id: 'stolenBases', name: 'Stolen Bases', selected: true },
    { id: 'walks', name: 'Walks', selected: true },
    { id: 'strikeouts', name: 'Strikeouts', selected: true },
    { id: 'outs', name: 'Outs', selected: true },
    { id: 'hitsAllowed', name: 'Hits Allowed', selected: true },
    { id: 'walksAllowed', name: 'Walks Allowed', selected: true },
    { id: 'earnedRuns', name: 'Earned Runs', selected: true },
  ]);

  const [games, setGames] = useState<Game[]>([
    { id: '1', homeTeam: 'CHC', awayTeam: 'MIL', time: '1:20 PM', date: '8/18', selected: true },
    { id: '2', homeTeam: 'MIA', awayTeam: 'STL', time: 'TBD', date: '8/18', selected: false, locked: true },
    { id: '3', homeTeam: 'DET', awayTeam: 'HOU', time: 'TBD', date: '8/18', selected: false, locked: true },
    { id: '4', homeTeam: 'PIT', awayTeam: 'TOR', time: 'TBD', date: '8/18', selected: false, locked: true },
    { id: '5', homeTeam: 'PHI', awayTeam: 'SEA', time: 'TBD', date: '8/18', selected: false, locked: true },
    { id: '6', homeTeam: 'BOS', awayTeam: 'BAL', time: 'TBD', date: '8/18', selected: false, locked: true },
    { id: '7', homeTeam: 'ATL', awayTeam: 'CWS', time: 'TBD', date: '8/18', selected: false, locked: true },
  ]);

  const mockPlayers: PropFinderPlayer[] = [
    {
      id: '1',
      name: 'Nico Hoerner',
      team: 'CHC',
      position: '2B',
      number: 2,
      imageUrl: 'https://www.propfinder.app/img/MLB/players/663538.png',
      pfRating: 65,
      prop: 'o0.5 Stolen Bases',
      l10Avg: 0.3,
      l5Avg: 0.6,
      odds: '+370',
      streak: 0,
      matchup: 'vs RHP',
      percentages: {
        '2024': 18,
        '2025': 15,
        'h2h': 6,
        'l5': 40,
        'last': 20,
        'l4': 10,
      },
      isFavorite: false,
    },
    {
      id: '2',
      name: 'Dansby Swanson',
      team: 'CHC',
      position: 'SS',
      number: 7,
      imageUrl: 'https://www.propfinder.app/img/MLB/players/621020.png',
      pfRating: 51,
      prop: 'o0.5 Stolen Bases',
      l10Avg: 0.2,
      l5Avg: 0.0,
      odds: '+800',
      streak: 0,
      matchup: 'vs RHP',
      percentages: {
        '2024': 12,
        '2025': 7,
        'h2h': 6,
        'l5': 0,
        'last': 20,
        'l4': 10,
      },
      isFavorite: false,
    },
  ];

  const selectedCategoriesCount = categories.filter(c => c.selected).length;
  const selectedGamesCount = games.filter(g => g.selected).length;

  // Circular Progress Component for PF Rating
  const CircularProgress: React.FC<{ value: number; size?: number }> = ({ value, size = 50 }) => {
    const radius = (size - 4) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    const getColor = (rating: number) => {
      if (rating >= 70) return '#22c55e'; // green-500
      if (rating >= 50) return '#eab308'; // yellow-500
      return '#ef4444'; // red-500
    };

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          <circle
            stroke="rgb(71 85 105)" // slate-600
            fill="transparent"
            strokeWidth="4"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            stroke={getColor(value)}
            fill="transparent"
            strokeWidth="4"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-white">{value}</span>
        </div>
      </div>
    );
  };

  // Performance cell component
  const PerformanceCell: React.FC<{ value: number; showFraction?: boolean; denominator?: number }> = ({ 
    value, 
    showFraction = false, 
    denominator = 0 
  }) => {
    const getColorClass = (val: number) => {
      if (val >= 30) return 'bg-red-500/80 text-white';
      if (val >= 20) return 'bg-orange-500/80 text-white';
      if (val >= 10) return 'bg-yellow-500/80 text-black';
      if (val > 0) return 'bg-green-500/80 text-white';
      return 'bg-slate-600/80 text-white';
    };

    return (
      <div className={`px-2 py-1 rounded text-xs font-medium text-center min-w-[50px] ${getColorClass(value)}`}>
        {value}%
        {showFraction && denominator > 0 && (
          <div className="text-xs opacity-75 mt-1">
            {Math.floor((value/100) * denominator)}/{denominator}
          </div>
        )}
      </div>
    );
  };

  const toggleCategory = (categoryId: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, selected: !cat.selected } : cat
    ));
  };

  const toggleAllCategories = () => {
    const allSelected = categories.every(cat => cat.selected);
    setCategories(prev => prev.map(cat => ({ ...cat, selected: !allSelected })));
  };

  const toggleGame = (gameId: string) => {
    setGames(prev => prev.map(game => 
      game.id === gameId ? { ...game, selected: !game.selected } : game
    ));
  };

  const toggleFavorite = (playerId: string) => {
    // This would update the favorite status in real app
    console.log('Toggle favorite for player:', playerId);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Top Filter Bar - Exact PropFinder Replica */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* OVER/UNDER Toggle */}
          <div className="flex bg-slate-900 rounded-lg p-1">
            <button
              onClick={() => setBetType('OVER')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                betType === 'OVER' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              OVER
            </button>
            <button
              onClick={() => setBetType('UNDER')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                betType === 'UNDER' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              UNDER
            </button>
          </div>

          {/* Search Player Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPlayerDropdown(!showPlayerDropdown)}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-white min-w-[160px] justify-between"
            >
              <User className="w-4 h-4" />
              <span>{searchPlayer}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showPlayerDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-1 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50"
                >
                  <div className="p-4">
                    <input
                      type="text"
                      placeholder="Search players..."
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Categories Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowCategoriesDropdown(!showCategoriesDropdown)}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-white min-w-[140px] justify-between"
            >
              <span>Categories</span>
              <div className="flex items-center gap-2">
                <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">
                  {selectedCategoriesCount} selected
                </span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            <AnimatePresence>
              {showCategoriesDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-1 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50"
                >
                  <div className="p-4 max-h-96 overflow-y-auto">
                    <div className="border-b border-slate-600 pb-3 mb-3">
                      <span className="text-purple-400 text-sm font-medium">Categories</span>
                      <button 
                        onClick={toggleAllCategories}
                        className="ml-2 text-sm text-purple-400 hover:text-purple-300"
                      >
                        <ChevronDown className="w-4 h-4 inline" />
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-700 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={categories.every(cat => cat.selected)}
                          onChange={toggleAllCategories}
                          className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-white font-medium">Select All</span>
                      </label>
                      
                      {categories.map((category) => (
                        <label key={category.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-700 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={category.selected}
                            onChange={() => toggleCategory(category.id)}
                            className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                          />
                          <span className="text-white">{category.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Games Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowGamesDropdown(!showGamesDropdown)}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-white min-w-[120px] justify-between"
            >
              <span>Games</span>
              <div className="flex items-center gap-2">
                <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">
                  {selectedGamesCount} selected
                </span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            <AnimatePresence>
              {showGamesDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-1 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50"
                >
                  <div className="p-4 max-h-96 overflow-y-auto">
                    <div className="border-b border-slate-600 pb-3 mb-3">
                      <span className="text-purple-400 text-sm font-medium">Games</span>
                      <button className="ml-2 text-sm text-purple-400 hover:text-purple-300">
                        <ChevronDown className="w-4 h-4 inline" />
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-700 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={games.every(g => g.selected)}
                          onChange={() => setGames(prev => prev.map(g => ({ ...g, selected: true })))}
                          className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-white font-medium">Select All</span>
                      </label>
                      
                      {games.map((game) => (
                        <div key={game.id}>
                          {game.locked ? (
                            <div className="flex items-center gap-2 p-2 rounded bg-slate-700/50">
                              <div className="w-4 h-4 bg-slate-600 rounded flex items-center justify-center">
                                <div className="w-2 h-2 bg-purple-400 rounded-full" />
                              </div>
                              <span className="text-purple-400 text-sm">
                                UNLOCK {game.awayTeam} @ {game.homeTeam}
                              </span>
                            </div>
                          ) : (
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-700 p-2 rounded">
                              <input
                                type="checkbox"
                                checked={game.selected}
                                onChange={() => toggleGame(game.id)}
                                className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                              />
                              <span className="text-white text-sm">
                                {game.date} - {game.time}
                              </span>
                              <div className="flex items-center gap-1 text-xs">
                                <span className="w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center text-black font-bold">
                                  {game.awayTeam.substring(0, 1)}
                                </span>
                                <span className="text-slate-400">@</span>
                                <span className="text-slate-400">-1</span>
                                <span className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                                  {game.homeTeam.substring(0, 1)}
                                </span>
                              </div>
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Show All Lines Toggle */}
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-slate-300 text-sm">Show All Lines:</span>
            <div className="relative">
              <input
                type="checkbox"
                id="showAllLines"
                checked={showAllLines}
                onChange={(e) => setShowAllLines(e.target.checked)}
                className="sr-only"
              />
              <label
                htmlFor="showAllLines"
                className={`flex items-center cursor-pointer w-12 h-6 rounded-full p-1 transition-all ${
                  showAllLines ? 'bg-purple-600' : 'bg-slate-600'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    showAllLines ? 'translate-x-6' : ''
                  }`}
                />
              </label>
            </div>
            <span className="text-slate-300 text-sm">2/2</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
            <Settings className="w-4 h-4" />
            View Settings
          </button>
          <button className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              <th className="text-left p-3 text-slate-300 text-sm font-medium w-8"></th>
              <th className="text-left p-3 text-slate-300 text-sm font-medium w-20">PF Rating</th>
              <th className="text-left p-3 text-slate-300 text-sm font-medium w-16">Team</th>
              <th className="text-left p-3 text-slate-300 text-sm font-medium w-16">Pos</th>
              <th className="text-left p-3 text-slate-300 text-sm font-medium w-48">Player</th>
              <th className="text-left p-3 text-slate-300 text-sm font-medium w-32">Prop</th>
              <th className="text-left p-3 text-slate-300 text-sm font-medium w-24">L10 Avg</th>
              <th className="text-left p-3 text-slate-300 text-sm font-medium w-24">L5 Avg</th>
              <th className="text-left p-3 text-slate-300 text-sm font-medium w-24">Odds</th>
              <th className="text-left p-3 text-slate-300 text-sm font-medium w-20">Streak</th>
              <th className="text-left p-3 text-slate-300 text-sm font-medium w-24">Matchup</th>
              <th className="text-left p-3 text-slate-300 text-sm font-medium w-20">2024</th>
              <th className="text-left p-3 text-slate-300 text-sm font-medium w-20">2025</th>
              <th className="text-left p-3 text-slate-300 text-sm font-medium w-20">H2H</th>
              <th className="text-left p-3 text-slate-300 text-sm font-medium w-20">L5</th>
              <th className="text-left p-3 text-slate-300 text-sm font-medium w-20">L...</th>
              <th className="text-left p-3 text-slate-300 text-sm font-medium w-20">L4</th>
            </tr>
          </thead>
          <tbody>
            {mockPlayers.map((player, index) => (
              <motion.tr
                key={player.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors"
              >
                <td className="p-3">
                  <button
                    onClick={() => toggleFavorite(player.id)}
                    className={`text-slate-400 hover:text-red-500 transition-colors ${
                      player.isFavorite ? 'text-red-500' : ''
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${player.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </td>
                
                <td className="p-3">
                  <CircularProgress value={player.pfRating} size={50} />
                </td>
                
                <td className="p-3">
                  <span className="text-white font-medium">{player.team}</span>
                </td>
                
                <td className="p-3">
                  <span className="text-slate-300">{player.position}</span>
                </td>
                
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                      {player.imageUrl ? (
                        <img 
                          src={player.imageUrl} 
                          alt={player.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '';
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <User className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium">{player.name}</div>
                      <div className="text-slate-400 text-xs">{player.position === '2B' ? 'RHB' : 'RHB'}</div>
                    </div>
                  </div>
                </td>
                
                <td className="p-3">
                  <span className="text-white">{player.prop}</span>
                </td>
                
                <td className="p-3">
                  <span className={`font-medium ${
                    player.l10Avg > 0.5 ? 'text-green-400' : 
                    player.l10Avg > 0.3 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {player.l10Avg}
                  </span>
                </td>
                
                <td className="p-3">
                  <span className={`font-medium ${
                    player.l5Avg > 0.5 ? 'text-green-400' : 
                    player.l5Avg > 0.3 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {player.l5Avg}
                  </span>
                </td>
                
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{player.odds}</span>
                    <span className="text-slate-400">¥</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                </td>
                
                <td className="p-3">
                  <span className="text-white">{player.streak}</span>
                </td>
                
                <td className="p-3">
                  <div className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded text-xs font-medium">
                    Markets
                  </div>
                </td>
                
                <td className="p-3">
                  <PerformanceCell value={player.percentages['2024']} showFraction denominator={150} />
                </td>
                
                <td className="p-3">
                  <PerformanceCell value={player.percentages['2025']} showFraction denominator={119} />
                </td>
                
                <td className="p-3">
                  <PerformanceCell value={player.percentages.h2h} showFraction denominator={32} />
                </td>
                
                <td className="p-3">
                  <PerformanceCell value={player.percentages.l5} showFraction denominator={5} />
                </td>
                
                <td className="p-3">
                  <PerformanceCell value={player.percentages.last} showFraction denominator={10} />
                </td>
                
                <td className="p-3">
                  <PerformanceCell value={player.percentages.l4} showFraction denominator={2} />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-slate-800 border-t border-slate-700 p-4 flex items-center justify-between text-sm text-slate-300">
        <div>Total Rows: {mockPlayers.length}</div>
        <div className="flex items-center gap-4">
          <span>Showing 1-{mockPlayers.length} of {mockPlayers.length} results</span>
        </div>
      </div>
    </div>
  );
};

export default PropFinderKillerDashboard;
