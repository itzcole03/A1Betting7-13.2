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

const UnifiedResearchDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'propfinder' | 'player' | 'props' | 'matchups' | 'injuries' | 'lookup'>('propfinder');

// Mock data
const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'Mike Trout',
    team: 'LAA',
    position: 'OF',
    number: 27,
    stats: {
      season: { avg: 0.283, hr: 15, rbi: 44, ops: 0.875 },
      last5: { avg: 0.350, hr: 3, rbi: 8, ops: 1.100 },
      trends: [],
      advanced: {}
    },
    recentForm: [],
    upcomingGame: { opponent: 'HOU', time: '7:05 PM', venue: 'home' },
    injuryStatus: { status: 'healthy', lastUpdate: new Date() },
    props: [
      { id: '1', type: 'hits', market: 'Over 1.5', line: 1.5, odds: -110, confidence: 78, value: 12, sportsbook: 'DraftKings', lastUpdate: new Date(), trend: 'up' },
      { id: '2', type: 'rbis', market: 'Over 0.5', line: 0.5, odds: +125, confidence: 65, value: 8, sportsbook: 'FanDuel', lastUpdate: new Date(), trend: 'stable' }
    ],
    marketValue: 95,
    hotness: 8.7
  },
  {
    id: '2',
    name: 'Mookie Betts',
    team: 'LAD',
    position: 'OF',
    number: 50,
    stats: {
      season: { avg: 0.292, hr: 18, rbi: 52, ops: 0.912 },
      last5: { avg: 0.278, hr: 1, rbi: 3, ops: 0.820 },
      trends: [],
      advanced: {}
    },
    recentForm: [],
    upcomingGame: { opponent: 'SD', time: '10:10 PM', venue: 'away' },
    injuryStatus: { status: 'healthy', lastUpdate: new Date() },
    props: [
      { id: '3', type: 'hits', market: 'Over 1.5', line: 1.5, odds: -115, confidence: 82, value: 15, sportsbook: 'BetMGM', lastUpdate: new Date(), trend: 'up' },
      { id: '4', type: 'runs', market: 'Over 0.5', line: 0.5, odds: -105, confidence: 71, value: 10, sportsbook: 'Caesars', lastUpdate: new Date(), trend: 'down' }
    ],
    marketValue: 92,
    hotness: 7.9
  }
];

const mockInjuries: InjuryReport[] = [
  {
    playerId: '3',
    playerName: 'Fernando Tatis Jr.',
    team: 'SD',
    injury: 'Shoulder Inflammation',
    severity: 'questionable',
    status: 'day-to-day',
    lastUpdate: new Date(),
    expectedReturn: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    impact: 6
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Research Dashboard</h1>
              <p className="text-slate-400">Choose your preferred research interface</p>
            </div>
          </div>

          {/* Interface Style Notice */}
          <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">PropFinder-Style Interface Available!</h3>
                <p className="text-slate-300 text-sm">Experience the familiar game and category selection interface that you know and love</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'propfinder' | 'player' | 'props' | 'matchups' | 'injuries' | 'lookup')}
                  className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all text-sm sm:text-base ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg'
                      : 'bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                  {tab.badge && (
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-cyan-500 text-white'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'propfinder' && (
              <div>
                <PropFinderKillerDashboard />
              </div>
            )}
            {activeTab !== 'propfinder' && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Interface Coming Soon</h3>
                <p className="text-slate-400 mb-4">This research interface is being developed. Try the PropFinder-style interface for now!</p>
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
