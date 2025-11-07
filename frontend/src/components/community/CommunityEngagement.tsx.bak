import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Star,
  MessageCircle,
  TrendingUp,
  Award,
  GitBranch,
  Twitter,
  Github,
  ExternalLink,
  ChevronRight,
  ThumbsUp,
  Share2,
  Crown,
  Zap,
  Trophy,
  Target,
  X,
} from 'lucide-react';

interface CommunityStats {
  githubStars: number;
  activeUsers: number;
  totalPredictions: number;
  accuracy: number;
  communityRoi: number;
}

interface TestimonialData {
  id: string;
  user: string;
  avatar: string;
  text: string;
  roi: string;
  verified: boolean;
  platform: 'twitter' | 'discord' | 'github';
}

interface LeaderboardEntry {
  rank: number;
  user: string;
  avatar: string;
  accuracy: number;
  roi: string;
  streak: number;
  badge: string;
}

const CommunityEngagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'testimonials' | 'leaderboard' | 'join'>('stats');
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Mock data based on research recommendations
  const communityStats: CommunityStats = {
    githubStars: 2847, // Growing community
    activeUsers: 15420,
    totalPredictions: 1234567,
    accuracy: 73.2,
    communityRoi: 24.8,
  };

  const testimonials: TestimonialData[] = [
    {
      id: '1',
      user: '@SportsBetKing',
      avatar: '👑',
      text: 'A1Betting is a PropFinder killer! 4x faster and the AI explainability is incredible. Saved me $348/year!',
      roi: '+32.4%',
      verified: true,
      platform: 'twitter',
    },
    {
      id: '2',
      user: 'PropsGuru',
      avatar: '🧠',
      text: 'The SHAP analysis helped me understand WHY picks win. Game changer for serious bettors.',
      roi: '+28.7%',
      verified: true,
      platform: 'discord',
    },
    {
      id: '3',
      user: 'DataDriven_Bets',
      avatar: '📊',
      text: 'Open source, free, and more accurate than PropFinder. This is the future of prop research.',
      roi: '+41.2%',
      verified: true,
      platform: 'github',
    },
    {
      id: '4',
      user: 'AIBettingPro',
      avatar: '🤖',
      text: 'Ollama LLM integration + real-time analysis = unbeatable combination. Never going back to paid tools.',
      roi: '+19.3%',
      verified: true,
      platform: 'twitter',
    },
  ];

  const leaderboard: LeaderboardEntry[] = [
    { rank: 1, user: 'PropMaster', avatar: '🏆', accuracy: 78.4, roi: '+52.1%', streak: 12, badge: 'Elite' },
    { rank: 2, user: 'AIWhisperer', avatar: '🧙', accuracy: 76.8, roi: '+44.3%', streak: 8, badge: 'Expert' },
    { rank: 3, user: 'SharpBetter', avatar: '🎯', accuracy: 75.2, roi: '+38.7%', streak: 15, badge: 'Pro' },
    { rank: 4, user: 'DataNinja', avatar: '🥷', accuracy: 74.1, roi: '+31.2%', streak: 6, badge: 'Advanced' },
    { rank: 5, user: 'PropPhD', avatar: '🎓', accuracy: 72.9, roi: '+29.8%', streak: 9, badge: 'Scholar' },
  ];

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return <Twitter className="w-4 h-4" />;
      case 'github': return <Github className="w-4 h-4" />;
      case 'discord': return <MessageCircle className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Elite': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'Expert': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'Pro': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'Advanced': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      default: return 'bg-gradient-to-r from-slate-500 to-slate-600';
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">PropFinder Killer Community</h2>
            <p className="text-sm text-gray-400">Join the revolution - free forever!</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowJoinModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-purple-600 transition-all"
        >
          Join Community
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-slate-700/50 rounded-lg p-1">
        {[
          { id: 'stats', label: 'Stats', icon: TrendingUp },
          { id: 'testimonials', label: 'Reviews', icon: Star },
          { id: 'leaderboard', label: 'Leaders', icon: Trophy },
          { id: 'join', label: 'Connect', icon: Users },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === id
                ? 'bg-cyan-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-slate-600/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                <GitBranch className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{communityStats.githubStars.toLocaleString()}</div>
                <div className="text-xs text-gray-400">GitHub Stars</div>
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                <Users className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{communityStats.activeUsers.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Active Users</div>
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                <Target className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{communityStats.totalPredictions.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Predictions</div>
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                <Award className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{communityStats.accuracy}%</div>
                <div className="text-xs text-gray-400">Accuracy</div>
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">+{communityStats.communityRoi}%</div>
                <div className="text-xs text-gray-400">Avg ROI</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <span className="font-bold text-white">PropFinder vs A1Betting</span>
              </div>
              <div className="text-sm text-gray-300">
                4x faster, $348/year savings, AI explainability, and completely free. Join thousands who made the switch!
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'testimonials' && (
          <motion.div
            key="testimonials"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50"
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{testimonial.avatar}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-bold text-white">{testimonial.user}</span>
                      {testimonial.verified && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                      <div className="text-gray-400">
                        {getPlatformIcon(testimonial.platform)}
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{testimonial.text}</p>
                    <div className="flex items-center space-x-4">
                      <span className="text-green-400 font-bold">ROI: {testimonial.roi}</span>
                      <button className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors">
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-sm">Helpful</span>
                      </button>
                      <button className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors">
                        <Share2 className="w-4 h-4" />
                        <span className="text-sm">Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            {leaderboard.map((entry, index) => (
              <motion.div
                key={entry.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      entry.rank === 1 ? 'bg-yellow-500' :
                      entry.rank === 2 ? 'bg-gray-400' :
                      entry.rank === 3 ? 'bg-amber-600' :
                      'bg-slate-600'
                    }`}>
                      {entry.rank}
                    </div>
                    <div className="text-2xl">{entry.avatar}</div>
                    <div>
                      <div className="font-bold text-white">{entry.user}</div>
                      <div className={`text-xs px-2 py-1 rounded-full text-white ${getBadgeColor(entry.badge)}`}>
                        {entry.badge}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-white">{entry.accuracy}%</div>
                      <div className="text-xs text-gray-400">Accuracy</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-400">{entry.roi}</div>
                      <div className="text-xs text-gray-400">ROI</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-orange-400">{entry.streak}</div>
                      <div className="text-xs text-gray-400">Streak</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'join' && (
          <motion.div
            key="join"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="https://discord.gg/a1betting"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#5865F2] rounded-lg p-4 hover:bg-[#4752C4] transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="w-6 h-6 text-white" />
                    <div>
                      <div className="font-bold text-white">Join Discord</div>
                      <div className="text-sm text-gray-200">Get real-time alerts & tips</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-white" />
                </div>
              </a>
              
              <a
                href="https://twitter.com/A1BettingAI"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#1DA1F2] rounded-lg p-4 hover:bg-[#1A91DA] transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Twitter className="w-6 h-6 text-white" />
                    <div>
                      <div className="font-bold text-white">Follow Twitter</div>
                      <div className="text-sm text-gray-200">Daily picks & updates</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-white" />
                </div>
              </a>
              
              <a
                href="https://github.com/itzcole03/A1Betting7-13.2"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#333] rounded-lg p-4 hover:bg-[#444] transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Github className="w-6 h-6 text-white" />
                    <div>
                      <div className="font-bold text-white">Star on GitHub</div>
                      <div className="text-sm text-gray-200">Support open source</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-white" />
                </div>
              </a>
              
              <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Crown className="w-6 h-6 text-yellow-400" />
                  <div>
                    <div className="font-bold text-white">Become a Contributor</div>
                    <div className="text-sm text-gray-300">Help improve the platform</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowJoinModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Join the Revolution</h3>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-gray-300 mb-6">
                Stop paying $348+/year for PropFinder. Get superior AI analysis, 4x faster performance, 
                and join thousands of profitable bettors using A1Betting - completely free!
              </p>
              
              <div className="space-y-3">
                <a
                  href="https://discord.gg/a1betting"
                  className="flex items-center justify-center space-x-2 w-full bg-[#5865F2] text-white rounded-lg py-3 font-medium hover:bg-[#4752C4] transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Join Discord Community</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
                
                <a
                  href="https://github.com/itzcole03/A1Betting7-13.2"
                  className="flex items-center justify-center space-x-2 w-full bg-[#333] text-white rounded-lg py-3 font-medium hover:bg-[#444] transition-colors"
                >
                  <Star className="w-5 h-5" />
                  <span>Star on GitHub</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommunityEngagement;
