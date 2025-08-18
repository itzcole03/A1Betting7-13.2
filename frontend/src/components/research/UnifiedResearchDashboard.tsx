import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Target,
  Eye,
  Shield,
  User,
  Settings,
} from 'lucide-react';
import PropFinderKillerDashboard from '../modern/PropFinderKillerDashboard';

// Types for the dashboard
interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  salary?: number;
  projectedPoints?: number;
}

interface InjuryReport {
  playerId: string;
  playerName: string;
  team: string;
  injury: string;
  severity: 'minor' | 'moderate' | 'major';
  status: 'questionable' | 'doubtful' | 'out';
  lastUpdate: Date;
  expectedReturn?: Date;
  impact: number; // 1-10 scale
}

// Mock data
const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'Mike Trout',
    team: 'LAA',
    position: 'OF',
    salary: 12000,
    projectedPoints: 18.5
  },
  {
    id: '2',
    name: 'Mookie Betts',
    team: 'LAD',
    position: 'OF',
    salary: 12200,
    projectedPoints: 19.2
  },
  {
    id: '3',
    name: 'Freddie Freeman',
    team: 'ATL',
    position: '1B',
    salary: 10800,
    projectedPoints: 16.8
  }
];

const mockInjuries: InjuryReport[] = [
  {
    playerId: '1',
    playerName: 'Fernando Tatis Jr.',
    team: 'SD',
    injury: 'Shoulder Inflammation',
    severity: 'minor',
    status: 'questionable',
    lastUpdate: new Date(),
    expectedReturn: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    impact: 5
  },
  {
    playerId: '2',
    playerName: 'Ronald Acuña Jr.',
    team: 'ATL',
    injury: 'Knee Contusion',
    severity: 'moderate',
    status: 'doubtful',
    lastUpdate: new Date(),
    expectedReturn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    impact: 7
  },
  {
    playerId: '3',
    playerName: 'Gerrit Cole',
    team: 'NYY',
    injury: 'Hamstring Strain',
    severity: 'major',
    status: 'out',
    lastUpdate: new Date(),
    expectedReturn: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    impact: 9
  },
  {
    playerId: '4',
    playerName: 'Jacob deGrom',
    team: 'TEX',
    injury: 'Elbow Soreness',
    severity: 'moderate',
    status: 'out',
    lastUpdate: new Date(),
    expectedReturn: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    impact: 8
  }
];

const UnifiedResearchDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'propfinder' | 'player' | 'props' | 'matchups' | 'injuries' | 'lookup'>('propfinder');
  
  const tabs = [
    { id: 'propfinder', name: 'PropFinder Style', icon: Target, description: 'Exact PropFinder replica', badge: 'NEW' },
    { id: 'player', name: 'Player Research', icon: User, description: 'Deep player analytics' },
    { id: 'props', name: 'Prop Scanner', icon: Eye, description: 'Real-time opportunities', badge: 'BETA' },
    { id: 'matchups', name: 'Matchup Analyzer', icon: Target, description: 'Advanced breakdowns' },
    { id: 'injuries', name: 'Injury Tracker', icon: Shield, description: 'Live injury reports', badge: '2' },
    { id: 'lookup', name: 'Player Lookup', icon: Search, description: 'Sub-second search', badge: 'UPDATED' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">
                Research Dashboard
              </h1>
              <p className="text-slate-400 text-sm sm:text-base">
                Comprehensive sports analysis & betting intelligence
              </p>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Settings className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Advanced Mode</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap gap-2 sm:gap-4 bg-slate-800/50 p-2 sm:p-3 rounded-xl border border-slate-700/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all relative ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <div className="hidden sm:block">
                    <span>{tab.name}</span>
                    {tab.description && (
                      <div className="text-xs opacity-75 mt-0.5">
                        {tab.description}
                      </div>
                    )}
                  </div>
                  <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                  {tab.badge && (
                    <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold rounded-full ${
                      tab.badge === 'NEW' ? 'bg-green-500 text-white' :
                      tab.badge === 'BETA' ? 'bg-yellow-500 text-black' :
                      tab.badge === 'UPDATED' ? 'bg-blue-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-[60vh]"
          >
            {activeTab === 'propfinder' && (
              <PropFinderKillerDashboard />
            )}
            
            {activeTab === 'player' && (
              <div className="text-center text-white bg-slate-800/30 rounded-xl p-8 border border-slate-700/50">
                <User className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <h3 className="text-xl font-semibold mb-2">Player Research Tool</h3>
                <p className="text-slate-400 mb-6">Advanced player analytics and performance tracking</p>
                <button
                  onClick={() => setActiveTab('propfinder')}
                  className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                >
                  <Target className="w-4 h-4" />
                  <span>Try PropFinder Style</span>
                </button>
              </div>
            )}

            {activeTab === 'props' && (
              <div className="text-center text-white bg-slate-800/30 rounded-xl p-8 border border-slate-700/50">
                <Eye className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <h3 className="text-xl font-semibold mb-2">Prop Scanner</h3>
                <p className="text-slate-400 mb-6">Real-time prop betting opportunities</p>
                <button
                  onClick={() => setActiveTab('propfinder')}
                  className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                >
                  <Target className="w-4 h-4" />
                  <span>Try PropFinder Style</span>
                </button>
              </div>
            )}

            {activeTab === 'matchups' && (
              <div className="text-center text-white bg-slate-800/30 rounded-xl p-8 border border-slate-700/50">
                <Target className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <h3 className="text-xl font-semibold mb-2">Matchup Analyzer</h3>
                <p className="text-slate-400 mb-6">Advanced matchup breakdowns and predictions</p>
                <button
                  onClick={() => setActiveTab('propfinder')}
                  className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                >
                  <Target className="w-4 h-4" />
                  <span>Try PropFinder Style</span>
                </button>
              </div>
            )}

            {activeTab === 'injuries' && (
              <div className="text-center text-white bg-slate-800/30 rounded-xl p-8 border border-slate-700/50">
                <Shield className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <h3 className="text-xl font-semibold mb-2">Injury Tracker</h3>
                <p className="text-slate-400 mb-6">Live injury reports and impact analysis</p>
                <button
                  onClick={() => setActiveTab('propfinder')}
                  className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                >
                  <Target className="w-4 h-4" />
                  <span>Try PropFinder Style</span>
                </button>
              </div>
            )}

            {activeTab === 'lookup' && (
              <div className="text-center text-white bg-slate-800/30 rounded-xl p-8 border border-slate-700/50">
                <Search className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <h3 className="text-xl font-semibold mb-2">Player Lookup</h3>
                <p className="text-slate-400 mb-6">Sub-second player search and analysis</p>
                <button
                  onClick={() => setActiveTab('propfinder')}
                  className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                >
                  <Target className="w-4 h-4" />
                  <span>Try PropFinder Style</span>
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UnifiedResearchDashboard;