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
  const [filteredPlayers, setFilteredPlayers] = useState<PropFinderPlayer[]>([]);
  
  // Admin user detection - integrate with your authentication system
  // This should check if the current user has admin privileges
  const isAdminUser = true; // TODO: Replace with actual auth check like: useAuth().user?.isAdmin
  const [favorites, setFavorites] = useState<string[]>([]);

  // PropFinder Core Analysis Functions
  const calculatePFRating = (player: PropFinderPlayer): number => {
    const propValue = parseFloat(player.prop.match(/[\d.]+/)?.[0] || '0');
    const l10Hit = player.l10Avg > propValue ? 1 : 0;
    const l5Hit = player.l5Avg > propValue ? 1 : 0;
    const recentTrend = player.l5Avg > player.l10Avg ? 10 : -10;
    const consistencyBonus = Math.abs(player.l5Avg - player.l10Avg) < 0.2 ? 5 : 0;
    
    // Base rating calculation (0-100 scale)
    let rating = 50; // Neutral base
    rating += (l10Hit * 15) + (l5Hit * 20); // Recent performance weight
    rating += recentTrend; // Trending bonus/penalty  
    rating += consistencyBonus; // Consistency bonus
    rating += (player.percentages['2024'] - 20) * 0.5; // Season performance adjustment
    
    return Math.max(1, Math.min(100, Math.round(rating)));
  };

  const analyzePropValue = (player: PropFinderPlayer, betDirection: 'OVER' | 'UNDER'): {
    recommendation: 'STRONG' | 'LEAN' | 'AVOID';
    confidence: number;
    reasoning: string[];
  } => {
    const propValue = parseFloat(player.prop.match(/[\d.]+/)?.[0] || '0');
    const reasoning: string[] = [];
    let confidence = 50;

    // L10 vs L5 trend analysis
    if (betDirection === 'OVER') {
      if (player.l5Avg > propValue && player.l10Avg > propValue) {
        confidence += 25;
        reasoning.push(`Consistently hitting OVER in recent games (L5: ${player.l5Avg}, L10: ${player.l10Avg})`);
      }
      if (player.l5Avg > player.l10Avg) {
        confidence += 15;
        reasoning.push('Trending upward in recent form');
      }
    } else {
      if (player.l5Avg < propValue && player.l10Avg < propValue) {
        confidence += 25;
        reasoning.push(`Consistently hitting UNDER in recent games (L5: ${player.l5Avg}, L10: ${player.l10Avg})`);
      }
      if (player.l5Avg < player.l10Avg) {
        confidence += 15;
        reasoning.push('Trending downward in recent form');
      }
    }

    // Season performance analysis
    if (player.percentages['2024'] > 60) {
      confidence += 10;
      reasoning.push('Strong season-long performance');
    } else if (player.percentages['2024'] < 40) {
      confidence -= 10;
      reasoning.push('Below-average season performance');
    }

    // Streak analysis
    if (Math.abs(player.streak) >= 3) {
      if ((player.streak > 0 && betDirection === 'OVER') || (player.streak < 0 && betDirection === 'UNDER')) {
        confidence += 10;
        reasoning.push(`On ${Math.abs(player.streak)}-game ${player.streak > 0 ? 'hot' : 'cold'} streak`);
      } else {
        confidence -= 5;
        reasoning.push('Current streak works against this bet');
      }
    }

    const recommendation: 'STRONG' | 'LEAN' | 'AVOID' = 
      confidence >= 75 ? 'STRONG' : confidence >= 60 ? 'LEAN' : 'AVOID';

    return { recommendation, confidence, reasoning };
  };

  const getValueBetting = (player: PropFinderPlayer): {
    impliedProbability: number;
    fairValue: number;
    edge: number;
  } => {
    const odds = player.odds;
    const isPositive = odds.startsWith('+');
    const numericOdds = parseInt(odds.replace(/[+-]/, ''));
    
    // Convert American odds to implied probability
    const impliedProbability = isPositive 
      ? 100 / (numericOdds + 100) * 100
      : numericOdds / (numericOdds + 100) * 100;

    // Calculate fair value based on recent performance
    const recentHitRate = (player.percentages.l5 + player.percentages['2024']) / 2;
    const fairValue = betType === 'OVER' ? recentHitRate : (100 - recentHitRate);
    
    // Calculate edge (positive = good bet, negative = bad bet)
    const edge = fairValue - impliedProbability;
    
    return { impliedProbability, fairValue, edge };
  };

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
    { id: '2', homeTeam: 'MIA', awayTeam: 'STL', time: 'TBD', date: '8/18', selected: false, locked: !isAdminUser },
    { id: '3', homeTeam: 'DET', awayTeam: 'HOU', time: 'TBD', date: '8/18', selected: false, locked: !isAdminUser },
    { id: '4', homeTeam: 'PIT', awayTeam: 'TOR', time: 'TBD', date: '8/18', selected: false, locked: !isAdminUser },
    { id: '5', homeTeam: 'PHI', awayTeam: 'SEA', time: 'TBD', date: '8/18', selected: false, locked: !isAdminUser },
    { id: '6', homeTeam: 'BOS', awayTeam: 'BAL', time: 'TBD', date: '8/18', selected: false, locked: !isAdminUser },
    { id: '7', homeTeam: 'ATL', awayTeam: 'CWS', time: 'TBD', date: '8/18', selected: false, locked: !isAdminUser },
  ]);
  
  // Update games when admin status changes
  useEffect(() => {
    setGames(prevGames => 
      prevGames.map(game => ({
        ...game,
        locked: !isAdminUser && game.id !== '1' // Keep first game always unlocked
      }))
    );
  }, [isAdminUser]);

  const mockPlayers: PropFinderPlayer[] = [
    {
      id: '1',
      name: 'Nico Hoerner',
      team: 'CHC',
      position: '2B',
      number: 2,
      imageUrl: 'https://www.propfinder.app/img/MLB/players/663538.png',
      pfRating: 0, // Will be calculated
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
      pfRating: 0, // Will be calculated
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
    {
      id: '3',
      name: 'Christian Yelich',
      team: 'MIL',
      position: 'LF',
      number: 22,
      imageUrl: 'https://www.propfinder.app/img/MLB/players/592885.png',
      pfRating: 0, // Will be calculated
      prop: 'o1.5 Total Bases',
      l10Avg: 1.8,
      l5Avg: 2.2,
      odds: '+110',
      streak: 3,
      matchup: 'vs LHP',
      percentages: {
        '2024': 65,
        '2025': 70,
        'h2h': 75,
        'l5': 80,
        'last': 60,
        'l4': 85,
      },
      isFavorite: true,
    },
  ];

  // Calculate PF Ratings and apply filtering
  const processedPlayers = useMemo(() => {
    let players = mockPlayers.map(player => ({
      ...player,
      pfRating: calculatePFRating(player)
    }));

    // Filter by selected categories
    const selectedCategoryIds = categories.filter(cat => cat.selected).map(cat => cat.id);
    players = players.filter(player => {
      const propType = player.prop.toLowerCase();
      return selectedCategoryIds.some(catId => {
        switch(catId) {
          case 'stolenBases': return propType.includes('stolen');
          case 'totalBases': return propType.includes('total bases');
          case 'hits': return propType.includes('hit');
          case 'homeRuns': return propType.includes('home run');
          case 'runs': return propType.includes('runs');
          case 'rbis': return propType.includes('rbi');
          default: return true;
        }
      });
    });

    // Filter by selected games
    const selectedTeams = games.filter(game => game.selected).flatMap(game => [game.homeTeam, game.awayTeam]);
    players = players.filter(player => selectedTeams.includes(player.team));

    // Sort by PF Rating (descending)
    players.sort((a, b) => b.pfRating - a.pfRating);

    return players;
  }, [mockPlayers, categories, games, betType]);

  // Update filtered players when processing changes
  useEffect(() => {
    setFilteredPlayers(processedPlayers);
  }, [processedPlayers]);

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
      if (val >= 40) return 'bg-red-600 text-white';
      if (val >= 30) return 'bg-red-500 text-white';  
      if (val >= 20) return 'bg-orange-500 text-white';
      if (val >= 10) return 'bg-yellow-500 text-black';
      if (val >= 6) return 'bg-green-600 text-white';
      if (val > 0) return 'bg-green-500 text-white';
      return 'bg-slate-600 text-slate-300';
    };

    return (
      <div className={`px-2 py-1.5 rounded text-xs font-bold text-center min-w-[55px] ${getColorClass(value)}`}>
        <div>{value}%</div>
        {showFraction && denominator > 0 && (
          <div className="text-xs opacity-90 leading-tight">
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
    setFavorites(prev => 
      prev.includes(playerId) 
        ? prev.filter(fav => fav !== playerId)
        : [...prev, playerId]
    );
  };

  const toggleBetType = () => {
    setBetType(prev => prev === 'OVER' ? 'UNDER' : 'OVER');
  };

  const getRecommendationBadge = (recommendation: string, confidence: number) => {
    const colors = {
      STRONG: 'bg-green-500/20 text-green-400 border-green-500/50',
      LEAN: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      AVOID: 'bg-red-500/20 text-red-400 border-red-500/50'
    };
    
    return (
      <div className={`px-2 py-1 rounded-full text-xs font-semibold border ${colors[recommendation as keyof typeof colors]}`}>
        {recommendation} ({confidence}%)
      </div>
    );
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
                          {game.locked && !isAdminUser ? (
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
                              {isAdminUser && game.id !== '1' && (
                                <span className="text-green-400 text-xs ml-2">ADMIN</span>
                              )}
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

          {/* Bet Type Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-slate-300 text-sm">Bet Type:</span>
            <button
              onClick={toggleBetType}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                betType === 'OVER' 
                  ? 'bg-green-600 text-white shadow-lg' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              OVER
            </button>
            <button
              onClick={toggleBetType}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                betType === 'UNDER' 
                  ? 'bg-red-600 text-white shadow-lg' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              UNDER
            </button>
          </div>

          {/* Favorites Filter Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilteredPlayers(
                favorites.length > 0 
                  ? mockPlayers.filter(p => favorites.includes(p.id))
                  : mockPlayers
              )}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filteredPlayers.some(p => favorites.includes(p.id)) && favorites.length > 0
                  ? 'bg-red-600 text-white shadow-lg' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              } flex items-center gap-2`}
            >
              <Heart className="w-4 h-4" />
              Favorites ({favorites.length})
            </button>
          </div>

          {/* Show All Lines Toggle */}
          <div className="flex items-center gap-6 ml-auto">            
            <div className="flex items-center gap-3">
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
      </div>

      {/* Action Bar */}
      <div className="bg-slate-800/80 border-b border-slate-600 px-4 py-2 flex items-center justify-between">
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
          <thead className="bg-slate-800 border-b border-slate-600">
            <tr className="text-slate-300">
              <th className="text-left p-3 text-sm font-semibold w-8"></th>
              <th className="text-left p-3 text-sm font-semibold w-20">PF Rating</th>
              <th className="text-left p-3 text-sm font-semibold w-16">Team</th>
              <th className="text-left p-3 text-sm font-semibold w-16">Pos</th>
              <th className="text-left p-3 text-sm font-semibold w-48">Player</th>
              <th className="text-left p-3 text-sm font-semibold w-32">Prop</th>
              <th className="text-left p-3 text-sm font-semibold w-24">L10 Avg</th>
              <th className="text-left p-3 text-sm font-semibold w-24">L5 Avg</th>
              <th className="text-left p-3 text-sm font-semibold w-24">Odds</th>
              <th className="text-left p-3 text-sm font-semibold w-20">Streak</th>
              <th className="text-left p-3 text-sm font-semibold w-24">Matchup</th>
              <th className="text-left p-3 text-sm font-semibold w-20">2024</th>
              <th className="text-left p-3 text-sm font-semibold w-20">2025</th>
              <th className="text-left p-3 text-sm font-semibold w-20">H2H</th>
              <th className="text-left p-3 text-sm font-semibold w-20">L5</th>
              <th className="text-left p-3 text-sm font-semibold w-20">L...</th>
              <th className="text-left p-3 text-sm font-semibold w-20">L4</th>
            </tr>
          </thead>
          <tbody>
            {processedPlayers.map((player, index) => {
              const analysis = analyzePropValue(player, betType);
              const valueAnalysis = getValueBetting(player);
              
              return (
                <motion.tr
                  key={player.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-b border-slate-600/50 hover:bg-slate-800/60 transition-colors"
                >
                  <td className="p-3">
                    <button
                      onClick={() => toggleFavorite(player.id)}
                      className={`text-slate-400 hover:text-red-500 transition-colors ${
                        favorites.includes(player.id) ? 'text-red-500' : ''
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${favorites.includes(player.id) ? 'fill-current' : ''}`} />
                    </button>
                  </td>
                  
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <CircularProgress value={player.pfRating} size={50} />
                      <div className="text-xs">
                        <div className={`font-semibold ${
                          analysis.recommendation === 'STRONG' ? 'text-green-400' :
                          analysis.recommendation === 'LEAN' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {analysis.recommendation}
                        </div>
                        <div className="text-slate-400">{analysis.confidence}%</div>
                      </div>
                    </div>
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
                    <div className="space-y-1">
                      <span className="text-white font-medium">{player.prop}</span>
                      {valueAnalysis.edge > 5 && (
                        <div className="text-green-400 text-xs font-semibold">
                          +{valueAnalysis.edge.toFixed(1)}% EDGE
                        </div>
                      )}
                    </div>
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
                    <div className="text-xs text-slate-400 mt-1">
                      {valueAnalysis.impliedProbability.toFixed(1)}% implied
                    </div>
                  </td>
                  
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <span className="text-white">{player.streak}</span>
                      {Math.abs(player.streak) >= 3 && (
                        <div className={`text-xs px-1 py-0.5 rounded ${
                          player.streak > 0 ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                        }`}>
                          {player.streak > 0 ? 'HOT' : 'COLD'}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="p-3">
                    <div className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded text-xs font-medium">
                      {player.matchup}
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
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-slate-800/80 border-t border-slate-600 p-4 flex items-center justify-between text-sm text-slate-300">
        <div>Total Rows: {mockPlayers.length}</div>
        <div className="flex items-center gap-4">
          <span>Showing 1-{mockPlayers.length} of {mockPlayers.length} results</span>
        </div>
      </div>
    </div>
  );
};

export default PropFinderKillerDashboard;
