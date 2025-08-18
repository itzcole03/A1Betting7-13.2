import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  RefreshCw,
  Lock,
  Calendar,
  Clock,
  Star,
  Settings,
  Download,
  ExternalLink,
  CheckCircle,
  Square,
  X
} from 'lucide-react';

// Types for the research dashboard
interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeAbbr: string;
  awayAbbr: string;
  date: string;
  time: string;
  spread: number;
  isSelected: boolean;
  isLocked?: boolean;
  homeLogoUrl: string;
  awayLogoUrl: string;
}

interface PropCategory {
  id: string;
  name: string;
  isSelected: boolean;
}

interface PropData {
  id: string;
  playerName: string;
  team: string;
  category: string;
  market: string;
  line: number;
  overOdds: number;
  underOdds: number;
  confidence: number;
  value: number;
  sportsbook: string;
  lastUpdate: Date;
}

// Sample MLB teams with real team data
const MLB_TEAMS = {
  'MIL': { name: 'Milwaukee Brewers', logoUrl: 'https://www.mlbstatic.com/team-logos/108.svg' },
  'CHC': { name: 'Chicago Cubs', logoUrl: 'https://www.mlbstatic.com/team-logos/112.svg' },
  'STL': { name: 'St. Louis Cardinals', logoUrl: 'https://www.mlbstatic.com/team-logos/138.svg' },
  'MIA': { name: 'Miami Marlins', logoUrl: 'https://www.mlbstatic.com/team-logos/146.svg' },
  'HOU': { name: 'Houston Astros', logoUrl: 'https://www.mlbstatic.com/team-logos/117.svg' },
  'DET': { name: 'Detroit Tigers', logoUrl: 'https://www.mlbstatic.com/team-logos/116.svg' },
  'TOR': { name: 'Toronto Blue Jays', logoUrl: 'https://www.mlbstatic.com/team-logos/141.svg' },
  'PIT': { name: 'Pittsburgh Pirates', logoUrl: 'https://www.mlbstatic.com/team-logos/134.svg' },
  'SEA': { name: 'Seattle Mariners', logoUrl: 'https://www.mlbstatic.com/team-logos/136.svg' },
  'PHI': { name: 'Philadelphia Phillies', logoUrl: 'https://www.mlbstatic.com/team-logos/143.svg' },
  'BAL': { name: 'Baltimore Orioles', logoUrl: 'https://www.mlbstatic.com/team-logos/110.svg' },
  'BOS': { name: 'Boston Red Sox', logoUrl: 'https://www.mlbstatic.com/team-logos/111.svg' },
  'LAD': { name: 'Los Angeles Dodgers', logoUrl: 'https://www.mlbstatic.com/team-logos/119.svg' },
  'COL': { name: 'Colorado Rockies', logoUrl: 'https://www.mlbstatic.com/team-logos/115.svg' },
  'CIN': { name: 'Cincinnati Reds', logoUrl: 'https://www.mlbstatic.com/team-logos/113.svg' },
  'LAA': { name: 'Los Angeles Angels', logoUrl: 'https://www.mlbstatic.com/team-logos/108.svg' },
  'CLE': { name: 'Cleveland Guardians', logoUrl: 'https://www.mlbstatic.com/team-logos/114.svg' },
  'AZ': { name: 'Arizona Diamondbacks', logoUrl: 'https://www.mlbstatic.com/team-logos/109.svg' },
  'SF': { name: 'San Francisco Giants', logoUrl: 'https://www.mlbstatic.com/team-logos/137.svg' },
  'SD': { name: 'San Diego Padres', logoUrl: 'https://www.mlbstatic.com/team-logos/135.svg' },
  'CWS': { name: 'Chicago White Sox', logoUrl: 'https://www.mlbstatic.com/team-logos/145.svg' },
  'ATL': { name: 'Atlanta Braves', logoUrl: 'https://www.mlbstatic.com/team-logos/144.svg' },
  'TEX': { name: 'Texas Rangers', logoUrl: 'https://www.mlbstatic.com/team-logos/140.svg' },
  'KC': { name: 'Kansas City Royals', logoUrl: 'https://www.mlbstatic.com/team-logos/118.svg' }
};

// Mock games data
const mockGames: Game[] = [
  {
    id: '1',
    homeTeam: 'Chicago Cubs',
    awayTeam: 'Milwaukee Brewers',
    homeAbbr: 'CHC',
    awayAbbr: 'MIL',
    date: '8/18',
    time: '1:20 PM',
    spread: -1,
    isSelected: true,
    homeLogoUrl: MLB_TEAMS.CHC.logoUrl,
    awayLogoUrl: MLB_TEAMS.MIL.logoUrl
  },
  {
    id: '2',
    homeTeam: 'Miami Marlins',
    awayTeam: 'St. Louis Cardinals',
    homeAbbr: 'MIA',
    awayAbbr: 'STL',
    date: '8/18',
    time: '1:10 PM',
    spread: 1.5,
    isSelected: false,
    isLocked: true,
    homeLogoUrl: MLB_TEAMS.MIA.logoUrl,
    awayLogoUrl: MLB_TEAMS.STL.logoUrl
  },
  {
    id: '3',
    homeTeam: 'Detroit Tigers',
    awayTeam: 'Houston Astros',
    homeAbbr: 'DET',
    awayAbbr: 'HOU',
    date: '8/18',
    time: '7:10 PM',
    spread: 2,
    isSelected: false,
    isLocked: true,
    homeLogoUrl: MLB_TEAMS.DET.logoUrl,
    awayLogoUrl: MLB_TEAMS.HOU.logoUrl
  },
  {
    id: '4',
    homeTeam: 'Pittsburgh Pirates',
    awayTeam: 'Toronto Blue Jays',
    homeAbbr: 'PIT',
    awayAbbr: 'TOR',
    date: '8/18',
    time: '7:05 PM',
    spread: -1.5,
    isSelected: false,
    isLocked: true,
    homeLogoUrl: MLB_TEAMS.PIT.logoUrl,
    awayLogoUrl: MLB_TEAMS.TOR.logoUrl
  },
  {
    id: '5',
    homeTeam: 'Philadelphia Phillies',
    awayTeam: 'Seattle Mariners',
    homeAbbr: 'PHI',
    awayAbbr: 'SEA',
    date: '8/18',
    time: '7:05 PM',
    spread: -1,
    isSelected: false,
    isLocked: true,
    homeLogoUrl: MLB_TEAMS.PHI.logoUrl,
    awayLogoUrl: MLB_TEAMS.SEA.logoUrl
  }
];

// Mock prop categories
const mockCategories: PropCategory[] = [
  { id: 'hits', name: 'Hits', isSelected: true },
  { id: 'total-bases', name: 'Total Bases', isSelected: true },
  { id: 'home-runs', name: 'Home Runs', isSelected: true },
  { id: 'singles', name: 'Singles', isSelected: true },
  { id: 'doubles', name: 'Doubles', isSelected: true },
  { id: 'triples', name: 'Triples', isSelected: true },
  { id: 'batting-strikeouts', name: 'Batting Strikeouts', isSelected: true },
  { id: 'runs', name: 'Runs', isSelected: true },
  { id: 'rbis', name: 'RBIs', isSelected: true },
  { id: 'hits-runs-rbis', name: 'Hits + Runs + RBIs', isSelected: true },
  { id: 'stolen-bases', name: 'Stolen Bases', isSelected: true },
  { id: 'walks', name: 'Walks', isSelected: true },
  { id: 'strikeouts', name: 'Strikeouts', isSelected: true },
  { id: 'outs', name: 'Outs', isSelected: true },
  { id: 'hits-allowed', name: 'Hits Allowed', isSelected: true },
  { id: 'walks-allowed', name: 'Walks Allowed', isSelected: true },
  { id: 'earned-runs', name: 'Earned Runs', isSelected: true }
];

const PropFinderStyleResearchDashboard: React.FC = () => {
  const [games, setGames] = useState<Game[]>(mockGames);
  const [categories, setCategories] = useState<PropCategory[]>(mockCategories);
  const [isLoading, setIsLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  // Handle game selection
  const toggleGameSelection = (gameId: string) => {
    setGames(prev => prev.map(game => 
      game.id === gameId ? { ...game, isSelected: !game.isSelected } : game
    ));
  };

  // Handle category selection
  const toggleCategorySelection = (categoryId: string) => {
    setCategories(prev => prev.map(category => 
      category.id === categoryId ? { ...category, isSelected: !category.isSelected } : category
    ));
  };

  // Handle select all for categories
  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setCategories(prev => prev.map(category => ({ 
      ...category, 
      isSelected: newSelectAll 
    })));
  };

  // Update select all state based on individual selections
  useEffect(() => {
    const allSelected = categories.every(cat => cat.isSelected);
    const someSelected = categories.some(cat => cat.isSelected);
    setSelectAll(allSelected);
  }, [categories]);

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <div className="bg-[#1e1e1e] border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Research Dashboard</h1>
              <p className="text-gray-400 text-sm">PropFinder-style interface</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#9b62b6] hover:bg-[#8a4ba5] rounded-lg text-white transition-colors">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors">
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Games Selection Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Select Games</h2>
              <div className="text-sm text-gray-400">
                {games.filter(g => g.isSelected).length} selected
              </div>
            </div>
            
            <div className="bg-[#1e1e1e] rounded-lg">
              <ul 
                role="listbox" 
                tabIndex={-1} 
                aria-labelledby="game-checkbox-label" 
                aria-multiselectable="true" 
                className="py-2 relative w-full"
              >
                {/* Select All Option */}
                <li 
                  tabIndex={-1} 
                  role="option" 
                  aria-selected={selectAll}
                  className="flex items-center max-h-10 py-1.5 px-4 relative cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => {/* Could implement select all for games */}}
                >
                  <span className="flex items-center justify-center relative p-2">
                    <input 
                      type="checkbox" 
                      className="absolute opacity-0 w-full h-full cursor-pointer z-10"
                      readOnly
                    />
                    <div className="w-5 h-5 flex items-center justify-center">
                      {false ? ( // Set to false for now since we don't have select all for games
                        <CheckCircle className="w-5 h-5 text-[#9b62b6] fill-current" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400 border border-gray-400 rounded" />
                      )}
                    </div>
                  </span>
                  <div className="flex-1 cursor-pointer text-white">
                    <span>Select All</span>
                  </div>
                </li>

                {/* Game Items */}
                {games.map((game) => (
                  <li 
                    key={game.id}
                    tabIndex={-1} 
                    role="option" 
                    aria-selected={game.isSelected}
                    className={`flex items-center max-h-15 py-1.5 px-4 pr-4 relative cursor-pointer transition-colors ${
                      game.isSelected ? 'bg-[#9b62b6]/16' : 'hover:bg-gray-800'
                    }`}
                    onClick={() => !game.isLocked && toggleGameSelection(game.id)}
                  >
                    {/* Checkbox */}
                    <span className="flex items-center justify-center relative p-2">
                      <input 
                        type="checkbox" 
                        checked={game.isSelected}
                        className="absolute opacity-0 w-full h-full cursor-pointer z-10"
                        onChange={() => !game.isLocked && toggleGameSelection(game.id)}
                        disabled={game.isLocked}
                      />
                      <div className="w-5 h-5 flex items-center justify-center">
                        {game.isSelected ? (
                          <CheckCircle className="w-5 h-5 text-[#9b62b6] fill-current" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400 border border-gray-400 rounded" />
                        )}
                      </div>
                    </span>

                    {/* Game Content */}
                    {game.isLocked ? (
                      <a 
                        href="#" 
                        className="flex-1 flex items-center justify-center border border-[#9b62b6]/50 rounded-lg px-4 py-2 mx-2 text-[#9b62b6] hover:bg-[#9b62b6]/10 transition-colors text-sm font-medium uppercase tracking-wide"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        <span>Unlock {game.awayAbbr} @ {game.homeAbbr}</span>
                      </a>
                    ) : (
                      <div className="flex flex-col flex-1">
                        <p className="text-xs text-gray-400 mb-1">
                          <span>{game.date}</span>
                          <span> - </span>
                          <span>{game.time}</span>
                        </p>
                        <div className="flex items-center gap-1 text-sm font-medium">
                          {/* Away Team */}
                          <div className="flex items-center border-radius-50% border border-white rounded-full w-10 h-10 flex-shrink-0 mr-1 relative overflow-hidden">
                            <img
                              src={game.awayLogoUrl}
                              alt={`${game.awayTeam} logo`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to team abbreviation if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector('.team-fallback')) {
                                  const fallback = document.createElement('div');
                                  fallback.className = 'team-fallback w-full h-full bg-gray-600 flex items-center justify-center text-xs font-bold text-white';
                                  fallback.textContent = game.awayAbbr;
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                          </div>
                          <span className="text-white">{game.awayAbbr}</span>
                          
                          {/* @ symbol and spread */}
                          <span className="text-[#c69ede] text-xs">@</span>
                          <span className="text-[#c69ede]">{game.spread > 0 ? '+' : ''}{game.spread}</span>
                          
                          <span className="text-white">{game.homeAbbr}</span>
                          
                          {/* Home Team */}
                          <div className="flex items-center border-radius-50% border border-white rounded-full w-10 h-10 flex-shrink-0 ml-1 relative overflow-hidden">
                            <img
                              src={game.homeLogoUrl}
                              alt={`${game.homeTeam} logo`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to team abbreviation if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector('.team-fallback')) {
                                  const fallback = document.createElement('div');
                                  fallback.className = 'team-fallback w-full h-full bg-gray-600 flex items-center justify-center text-xs font-bold text-white';
                                  fallback.textContent = game.homeAbbr;
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Categories Selection Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Select Categories</h2>
              <div className="text-sm text-gray-400">
                {categories.filter(c => c.isSelected).length} selected
              </div>
            </div>
            
            <div className="bg-[#1e1e1e] rounded-lg">
              <ul 
                role="listbox" 
                tabIndex={-1} 
                aria-labelledby="cat-checkbox-label" 
                aria-multiselectable="true" 
                className="py-2 relative w-full max-h-96 overflow-y-auto"
              >
                {/* Select All Option */}
                <li 
                  tabIndex={-1} 
                  role="option" 
                  aria-selected={selectAll}
                  className="flex items-center max-h-10 py-1.5 px-4 relative cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={toggleSelectAll}
                >
                  <span className="flex items-center justify-center relative p-2">
                    <input 
                      type="checkbox" 
                      checked={selectAll}
                      className="absolute opacity-0 w-full h-full cursor-pointer z-10"
                      onChange={toggleSelectAll}
                    />
                    <div className="w-5 h-5 flex items-center justify-center">
                      {selectAll ? (
                        <CheckCircle className="w-5 h-5 text-[#9b62b6] fill-current" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400 border border-gray-400 rounded" />
                      )}
                    </div>
                  </span>
                  <div className="flex-1 cursor-pointer text-white">
                    <span>Select All</span>
                  </div>
                </li>

                {/* Category Items */}
                {categories.map((category) => (
                  <li 
                    key={category.id}
                    tabIndex={-1} 
                    role="option" 
                    aria-selected={category.isSelected}
                    className={`flex items-center max-h-10 py-1.5 px-4 pr-4 relative cursor-pointer transition-colors ${
                      category.isSelected ? 'bg-[#9b62b6]/16' : 'hover:bg-gray-800'
                    }`}
                    onClick={() => toggleCategorySelection(category.id)}
                  >
                    <span className="flex items-center justify-center relative p-2">
                      <input 
                        type="checkbox" 
                        checked={category.isSelected}
                        className="absolute opacity-0 w-full h-full cursor-pointer z-10"
                        onChange={() => toggleCategorySelection(category.id)}
                      />
                      <div className="w-5 h-5 flex items-center justify-center">
                        {category.isSelected ? (
                          <CheckCircle className="w-5 h-5 text-[#9b62b6] fill-current" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400 border border-gray-400 rounded" />
                        )}
                      </div>
                    </span>
                    <div className="flex-1 cursor-pointer text-white">
                      <span>{category.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            className="flex items-center justify-center gap-2 px-8 py-3 bg-[#9b62b6] hover:bg-[#8a4ba5] rounded-lg text-white font-medium transition-colors"
            disabled={!games.some(g => g.isSelected) || !categories.some(c => c.isSelected)}
          >
            <Search className="w-5 h-5" />
            Search Props
          </button>
          
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors">
            <Filter className="w-4 h-4" />
            Advanced Filters
          </button>
          
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors">
            <Star className="w-4 h-4" />
            Save Search
          </button>
        </div>

        {/* Status/Results Area */}
        <div className="mt-8 bg-[#1e1e1e] rounded-lg p-6">
          <div className="text-center py-8">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Ready to Search</h3>
            <p className="text-gray-400 mb-4">
              Select your games and categories, then click "Search Props" to find opportunities
            </p>
            <div className="flex justify-center gap-8 text-sm text-gray-500">
              <div>
                <span className="font-medium text-[#9b62b6]">{games.filter(g => g.isSelected).length}</span> games selected
              </div>
              <div>
                <span className="font-medium text-[#9b62b6]">{categories.filter(c => c.isSelected).length}</span> categories selected
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropFinderStyleResearchDashboard;
