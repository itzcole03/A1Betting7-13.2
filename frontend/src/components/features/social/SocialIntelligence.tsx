import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  TrendingUp,
  Users,
  Heart,
  Share2,
  Twitter,
  BarChart3,
  Brain,
  Zap,
  Clock,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Target,
  Eye,
} from 'lucide-react';
import { Layout } from '../../core/Layout';

interface SentimentData {
  overall: number;
  positive: number;
  negative: number;
  neutral: number;
  confidence: number;
  volume: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

interface SocialPost {
  id: string;
  platform: 'twitter' | 'reddit' | 'discord' | 'telegram';
  author: string;
  content: string;
  sentiment: number;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
  };
  influence: number;
  timestamp: Date;
  gameId?: string;
  players?: string[];
  keywords: string[];
}

interface InfluencerInsight {
  id: string;
  name: string;
  platform: string;
  followers: number;
  accuracy: number;
  recentPicks: Array<{
    game: string;
    pick: string;
    outcome?: 'won' | 'lost' | 'pending';
    confidence: number;
  }>;
  sentiment: number;
  influence: number;
}

interface TrendingTopic {
  id: string;
  keyword: string;
  volume: number;
  sentiment: number;
  growth: number;
  category: string;
  relevantGames: string[];
  impact: 'high' | 'medium' | 'low';
}

const SocialIntelligence: React.FC = () => {
  const [sentimentData, setSentimentData] = useState<Record<string, SentimentData>>({});
  const [recentPosts, setRecentPosts] = useState<SocialPost[]>([]);
  const [influencers, setInfluencers] = useState<InfluencerInsight[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('24h');

  useEffect(() => {
    loadSocialData();
    const interval = setInterval(loadSocialData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [selectedGame, timeRange]);

  const loadSocialData = async () => {
    setIsAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockSentiment: Record<string, SentimentData> = {
        'Lakers vs Warriors': {
          overall: 0.72,
          positive: 68,
          negative: 15,
          neutral: 17,
          confidence: 0.89,
          volume: 15234,
          trend: 'bullish',
        },
        'Chiefs vs Bills': {
          overall: 0.45,
          positive: 42,
          negative: 35,
          neutral: 23,
          confidence: 0.76,
          volume: 12890,
          trend: 'neutral',
        },
        'Celtics vs Heat': {
          overall: 0.31,
          positive: 28,
          negative: 48,
          neutral: 24,
          confidence: 0.82,
          volume: 8567,
          trend: 'bearish',
        },
      };

      const mockPosts: SocialPost[] = [
        {
          id: 'post-001',
          platform: 'twitter',
          author: '@SportsBetKing',
          content:
            "Lakers looking STRONG tonight! LeBron is locked in and they've got home court advantage. Taking the spread 🔥",
          sentiment: 0.85,
          engagement: { likes: 1247, shares: 89, comments: 156 },
          influence: 8.5,
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          gameId: 'Lakers vs Warriors',
          players: ['LeBron James'],
          keywords: ['Lakers', 'spread', 'home court'],
        },
        {
          id: 'post-002',
          platform: 'reddit',
          author: 'u/MLAnalyst',
          content:
            'Advanced stats show Chiefs defense has been vulnerable to deep passes. Josh Allen could exploit this weakness.',
          sentiment: 0.62,
          engagement: { likes: 892, shares: 45, comments: 234 },
          influence: 7.2,
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          gameId: 'Chiefs vs Bills',
          players: ['Josh Allen'],
          keywords: ['Chiefs', 'defense', 'Josh Allen', 'stats'],
        },
        {
          id: 'post-003',
          platform: 'discord',
          author: 'SharpBettor#1234',
          content:
            'Weather forecast shows heavy rain for the outdoor game. Definitely hammering the UNDER on total points.',
          sentiment: 0.41,
          engagement: { likes: 234, shares: 12, comments: 67 },
          influence: 6.8,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          keywords: ['weather', 'rain', 'under', 'total'],
        },
      ];

      const mockInfluencers: InfluencerInsight[] = [
        {
          id: 'inf-001',
          name: 'SportsBetKing',
          platform: 'Twitter',
          followers: 125000,
          accuracy: 68.4,
          recentPicks: [
            { game: 'Lakers vs Warriors', pick: 'Lakers -3.5', outcome: 'won', confidence: 0.85 },
            { game: 'Chiefs vs Bills', pick: 'Over 52.5', outcome: 'lost', confidence: 0.72 },
            { game: 'Celtics vs Heat', pick: 'Celtics ML', outcome: 'pending', confidence: 0.79 },
          ],
          sentiment: 0.75,
          influence: 8.5,
        },
        {
          id: 'inf-002',
          name: 'MLAnalyst',
          platform: 'Reddit',
          followers: 89000,
          accuracy: 71.2,
          recentPicks: [
            { game: 'Lakers vs Warriors', pick: 'Under 225.5', outcome: 'won', confidence: 0.91 },
            { game: 'Chiefs vs Bills', pick: 'Bills +3', outcome: 'pending', confidence: 0.67 },
          ],
          sentiment: 0.62,
          influence: 7.8,
        },
        {
          id: 'inf-003',
          name: 'SharpAction',
          platform: 'Telegram',
          followers: 45000,
          accuracy: 74.8,
          recentPicks: [
            { game: 'Celtics vs Heat', pick: 'Heat +6.5', outcome: 'won', confidence: 0.83 },
            { game: 'Lakers vs Warriors', pick: 'Warriors ML', outcome: 'lost', confidence: 0.58 },
          ],
          sentiment: 0.71,
          influence: 8.1,
        },
      ];

      const mockTrending: TrendingTopic[] = [
        {
          id: 'trend-001',
          keyword: 'LeBron injury concern',
          volume: 8945,
          sentiment: -0.34,
          growth: 235,
          category: 'Player News',
          relevantGames: ['Lakers vs Warriors'],
          impact: 'high',
        },
        {
          id: 'trend-002',
          keyword: 'Weather impact',
          volume: 5672,
          sentiment: -0.12,
          growth: 156,
          category: 'Game Conditions',
          relevantGames: ['Chiefs vs Bills'],
          impact: 'medium',
        },
        {
          id: 'trend-003',
          keyword: 'Referee assignments',
          volume: 3234,
          sentiment: 0.08,
          growth: 89,
          category: 'Officials',
          relevantGames: ['Celtics vs Heat'],
          impact: 'low',
        },
      ];

      setSentimentData(mockSentiment);
      setRecentPosts(mockPosts);
      setInfluencers(mockInfluencers);
      setTrendingTopics(mockTrending);
    } catch (error) {
      console.error('Failed to load social data:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.6) return 'text-green-400';
    if (sentiment > 0.4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return <Twitter className='w-4 h-4 text-blue-400' />;
      case 'reddit':
        return <MessageSquare className='w-4 h-4 text-orange-400' />;
      case 'discord':
        return <Users className='w-4 h-4 text-purple-400' />;
      case 'telegram':
        return <Share2 className='w-4 h-4 text-cyan-400' />;
      default:
        return <MessageSquare className='w-4 h-4 text-gray-400' />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-400 bg-red-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'low':
        return 'text-green-400 bg-green-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const games = Object.keys(sentimentData);

  return (
    <Layout
      title='Social Intelligence'
      subtitle='Social Sentiment Analysis • Influencer Tracking • Market Psychology'
      headerActions={
        <div className='flex items-center space-x-3'>
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value)}
            className='px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
          >
            <option value='1h'>Last Hour</option>
            <option value='24h'>Last 24 Hours</option>
            <option value='7d'>Last 7 Days</option>
          </select>

          <select
            value={selectedGame}
            onChange={e => setSelectedGame(e.target.value)}
            className='px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
          >
            <option value='all'>All Games</option>
            {games.map(game => (
              <option key={game} value={game}>
                {game}
              </option>
            ))}
          </select>

          <button
            onClick={loadSocialData}
            disabled={isAnalyzing}
            className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all disabled:opacity-50'
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing...' : 'Refresh'}</span>
          </button>
        </div>
      }
    >
      {/* Sentiment Overview */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        {Object.entries(sentimentData).map(([game, data], index) => (
          <motion.div
            key={game}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
          >
            <div className='flex items-center justify-between mb-4'>
              <h3 className='font-bold text-white'>{game}</h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  data.trend === 'bullish'
                    ? 'bg-green-500/20 text-green-400'
                    : data.trend === 'bearish'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-gray-500/20 text-gray-400'
                }`}
              >
                {data.trend.toUpperCase()}
              </span>
            </div>

            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-gray-400 text-sm'>Overall Sentiment</span>
                <span className={`font-bold ${getSentimentColor(data.overall)}`}>
                  {(data.overall * 100).toFixed(0)}%
                </span>
              </div>

              <div className='space-y-2'>
                <div className='flex justify-between text-xs'>
                  <span className='text-green-400'>Positive: {data.positive}%</span>
                  <span className='text-gray-400'>Neutral: {data.neutral}%</span>
                  <span className='text-red-400'>Negative: {data.negative}%</span>
                </div>

                <div className='w-full bg-slate-700 rounded-full h-2 flex overflow-hidden'>
                  <div className='bg-green-400 h-full' style={{ width: `${data.positive}%` }} />
                  <div className='bg-gray-400 h-full' style={{ width: `${data.neutral}%` }} />
                  <div className='bg-red-400 h-full' style={{ width: `${data.negative}%` }} />
                </div>
              </div>

              <div className='flex justify-between text-xs text-gray-400'>
                <span>Volume: {data.volume.toLocaleString()}</span>
                <span>Confidence: {(data.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trending Topics and Influencers */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
        {/* Trending Topics */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-white'>Trending Topics</h3>
              <p className='text-gray-400 text-sm'>Hot discussion topics affecting markets</p>
            </div>
            <TrendingUp className='w-5 h-5 text-purple-400' />
          </div>

          <div className='space-y-4'>
            {trendingTopics.map((topic, index) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className='p-4 bg-slate-900/50 rounded-lg'
              >
                <div className='flex items-start justify-between mb-2'>
                  <div>
                    <h4 className='font-medium text-white'>{topic.keyword}</h4>
                    <div className='flex items-center space-x-2 text-xs text-gray-400'>
                      <span>{topic.category}</span>
                      <span>•</span>
                      <span>{topic.relevantGames.join(', ')}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(topic.impact)}`}
                  >
                    {topic.impact.toUpperCase()}
                  </span>
                </div>

                <div className='grid grid-cols-3 gap-3 text-sm'>
                  <div>
                    <div className='text-gray-400'>Volume</div>
                    <div className='text-white font-medium'>{topic.volume.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className='text-gray-400'>Growth</div>
                    <div className='text-green-400 font-medium'>+{topic.growth}%</div>
                  </div>
                  <div>
                    <div className='text-gray-400'>Sentiment</div>
                    <div className={`font-medium ${getSentimentColor(Math.abs(topic.sentiment))}`}>
                      {topic.sentiment > 0 ? '+' : ''}
                      {(topic.sentiment * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Top Influencers */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-white'>Top Influencers</h3>
              <p className='text-gray-400 text-sm'>High-influence social media accounts</p>
            </div>
            <Users className='w-5 h-5 text-cyan-400' />
          </div>

          <div className='space-y-4'>
            {influencers.map((influencer, index) => (
              <motion.div
                key={influencer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className='p-4 bg-slate-900/50 rounded-lg'
              >
                <div className='flex items-center justify-between mb-3'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center'>
                      <Users className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <h4 className='font-bold text-white'>{influencer.name}</h4>
                      <div className='flex items-center space-x-2 text-xs text-gray-400'>
                        <span>{influencer.platform}</span>
                        <span>•</span>
                        <span>{influencer.followers.toLocaleString()} followers</span>
                      </div>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-lg font-bold text-green-400'>{influencer.accuracy}%</div>
                    <div className='text-xs text-gray-400'>accuracy</div>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-3 text-sm mb-3'>
                  <div>
                    <div className='text-gray-400'>Influence Score</div>
                    <div className='text-purple-400 font-medium'>{influencer.influence}/10</div>
                  </div>
                  <div>
                    <div className='text-gray-400'>Sentiment</div>
                    <div className={`font-medium ${getSentimentColor(influencer.sentiment)}`}>
                      {(influencer.sentiment * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div className='text-xs text-gray-400'>
                  Recent:{' '}
                  {influencer.recentPicks
                    .slice(0, 2)
                    .map(pick => `${pick.pick} (${pick.outcome || 'pending'})`)
                    .join(', ')}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Social Posts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Recent Social Posts</h3>
            <p className='text-gray-400 text-sm'>High-influence posts affecting market sentiment</p>
          </div>
          <MessageSquare className='w-5 h-5 text-green-400' />
        </div>

        <div className='space-y-4'>
          {recentPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              className='p-4 bg-slate-900/50 rounded-lg border border-slate-700/50'
            >
              <div className='flex items-start justify-between mb-3'>
                <div className='flex items-center space-x-3'>
                  {getPlatformIcon(post.platform)}
                  <div>
                    <span className='font-medium text-white'>{post.author}</span>
                    <div className='text-xs text-gray-400'>
                      {post.timestamp.toLocaleTimeString()} • Influence: {post.influence}/10
                    </div>
                  </div>
                </div>
                <div className='text-right'>
                  <div
                    className={`text-sm font-medium ${getSentimentColor(Math.abs(post.sentiment))}`}
                  >
                    Sentiment: {(post.sentiment * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <p className='text-gray-300 mb-3'>{post.content}</p>

              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-4 text-xs text-gray-400'>
                  <span className='flex items-center space-x-1'>
                    <Heart className='w-3 h-3' />
                    <span>{post.engagement.likes}</span>
                  </span>
                  <span className='flex items-center space-x-1'>
                    <Share2 className='w-3 h-3' />
                    <span>{post.engagement.shares}</span>
                  </span>
                  <span className='flex items-center space-x-1'>
                    <MessageSquare className='w-3 h-3' />
                    <span>{post.engagement.comments}</span>
                  </span>
                </div>

                <div className='flex flex-wrap gap-1'>
                  {post.keywords.slice(0, 3).map((keyword, idx) => (
                    <span
                      key={idx}
                      className='px-2 py-1 bg-slate-700/50 text-xs text-gray-300 rounded'
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </Layout>
  );
};

export default SocialIntelligence;
