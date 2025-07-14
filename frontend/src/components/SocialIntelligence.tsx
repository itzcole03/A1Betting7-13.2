import { motion } from 'framer-motion';
import { Activity, BarChart3, Heart, MessageSquare, Share2, TrendingUp, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

interface SocialPost {
  id: string;
  platform: 'twitter' | 'reddit' | 'instagram' | 'tiktok' | 'facebook';
  author: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
  };
  timestamp: string;
  relevance: number;
  influence: number;
  sport: string;
  team?: string;
  player?: string;
}

interface SentimentTrend {
  timestamp: string;
  positive: number;
  negative: number;
  neutral: number;
  volume: number;
}

interface MarketSignal {
  id: string;
  type: 'sentiment_shift' | 'viral_content' | 'influencer_opinion' | 'trending_topic';
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  sport: string;
  timestamp: string;
  actionable: boolean;
}

interface InfluencerMetrics {
  name: string;
  platform: string;
  followers: number;
  engagement: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  influence: number;
  recentPosts: number;
}

export const SocialIntelligence: React.FC = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [sentimentTrends, setSentimentTrends] = useState<SentimentTrend[]>([]);
  const [marketSignals, setMarketSignals] = useState<MarketSignal[]>([]);
  const [influencers, setInfluencers] = useState<InfluencerMetrics[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [timeframe, setTimeframe] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [isMonitoring, setIsMonitoring] = useState(true);

  // Generate mock social posts
  const generateSocialPosts = (): SocialPost[] => {
    const platforms = ['twitter', 'reddit', 'instagram', 'tiktok', 'facebook'] as const;
    const sports = ['NBA', 'NFL', 'MLB', 'NHL', 'Soccer'];
    const teams = {
      NBA: ['Lakers', 'Warriors', 'Celtics', 'Heat'],
      NFL: ['Chiefs', 'Bills', 'Cowboys', 'Patriots'],
      MLB: ['Yankees', 'Red Sox', 'Dodgers', 'Astros'],
      NHL: ['Rangers', 'Lightning', 'Bruins', 'Kings'],
      Soccer: ['Man City', 'Barcelona', 'Real Madrid', 'Liverpool'],
    };

    const content = [
      'This team is looking unstoppable right now! 🔥',
      'Not sure about their defense tonight...',
      "Best lineup I've seen all season",
      'Weather might be a factor in this game',
      "Injury report doesn't look good",
      'This player has been on fire lately!',
      'Sharp money moving on the underdog',
      'Public all over the favorite here',
      'Line movement suggests something big',
      'Fade the public on this one',
    ];

    return Array.from({ length: 20 }, (_, index) => {
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const sport = sports[Math.floor(Math.random() * sports.length)];
      const team = teams[sport][Math.floor(Math.random() * teams[sport].length)];
      const sentiment =
        Math.random() > 0.6 ? 'positive' : Math.random() > 0.3 ? 'neutral' : 'negative';

      return {
        id: `post-${index}`,
        platform,
        author: `@user${Math.floor(Math.random() * 1000)}`,
        content: content[Math.floor(Math.random() * content.length)],
        sentiment,
        sentimentScore:
          sentiment === 'positive'
            ? 0.3 + Math.random() * 0.7
            : sentiment === 'negative'
              ? -0.7 + Math.random() * 0.4
              : -0.2 + Math.random() * 0.4,
        engagement: {
          likes: Math.floor(Math.random() * 5000),
          shares: Math.floor(Math.random() * 1000),
          comments: Math.floor(Math.random() * 500),
        },
        timestamp: `${Math.floor(Math.random() * 12) + 1}h ago`,
        relevance: Math.random(),
        influence: Math.random(),
        sport,
        team,
        player: Math.random() > 0.5 ? `Player ${Math.floor(Math.random() * 100)}` : undefined,
      };
    });
  };

  // Generate sentiment trends
  const generateSentimentTrends = (): SentimentTrend[] => {
    return Array.from({ length: 24 }, (_, index) => {
      const total = 100;
      const positive = 20 + Math.random() * 40;
      const negative = 10 + Math.random() * 30;
      const neutral = total - positive - negative;

      return {
        timestamp: `${23 - index}h ago`,
        positive,
        negative,
        neutral,
        volume: Math.floor(Math.random() * 1000 + 500),
      };
    });
  };

  // Generate market signals
  const generateMarketSignals = (): MarketSignal[] => {
    const signalTypes = [
      'sentiment_shift',
      'viral_content',
      'influencer_opinion',
      'trending_topic',
    ] as const;

    const descriptions = {
      sentiment_shift: 'Sudden sentiment shift detected on social media',
      viral_content: 'Viral content affecting public perception',
      influencer_opinion: 'Major influencer shared strong opinion',
      trending_topic: 'Topic trending across multiple platforms',
    };

    return Array.from({ length: 8 }, (_, index) => {
      const type = signalTypes[Math.floor(Math.random() * signalTypes.length)];
      return {
        id: `signal-${index}`,
        type,
        description: descriptions[type],
        impact: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low',
        confidence: 70 + Math.random() * 25,
        sport: ['NBA', 'NFL', 'MLB', 'NHL'][Math.floor(Math.random() * 4)],
        timestamp: `${Math.floor(Math.random() * 6) + 1}h ago`,
        actionable: Math.random() > 0.4,
      };
    });
  };

  // Generate influencer metrics
  const generateInfluencers = (): InfluencerMetrics[] => {
    const names = [
      'SportsGuru_',
      'BettingPro_',
      'AnalyticsKing_',
      'SharpMoney_',
      'LineMovement_',
      'PublicFade_',
      'ValueBet_',
      'SportsCapper_',
    ];

    const platforms = ['Twitter', 'YouTube', 'Instagram', 'TikTok'];

    return names.map((name, index) => ({
      name: `${name}${Math.floor(Math.random() * 100)}`,
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      followers: Math.floor(Math.random() * 500000 + 50000),
      engagement: Math.random() * 10 + 2,
      sentiment: Math.random() > 0.5 ? 'positive' : Math.random() > 0.5 ? 'neutral' : 'negative',
      influence: Math.random() * 100,
      recentPosts: Math.floor(Math.random() * 10 + 1),
    }));
  };

  useEffect(() => {
    setPosts(generateSocialPosts());
    setSentimentTrends(generateSentimentTrends());
    setMarketSignals(generateMarketSignals());
    setInfluencers(generateInfluencers());
  }, []);

  // Filter posts by sport
  const filteredPosts =
    selectedSport === 'All' ? posts : posts.filter(post => post.sport === selectedSport);

  // Calculate aggregate sentiment
  const aggregateSentiment = filteredPosts.reduce(
    (acc, post) => {
      acc[post.sentiment]++;
      return acc;
    },
    { positive: 0, negative: 0, neutral: 0 }
  );

  const totalPosts = filteredPosts.length;
  const sentimentPercentages = {
    positive: (aggregateSentiment.positive / totalPosts) * 100,
    negative: (aggregateSentiment.negative / totalPosts) * 100,
    neutral: (aggregateSentiment.neutral / totalPosts) * 100,
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return '🐦';
      case 'reddit':
        return '📱';
      case 'instagram':
        return '📷';
      case 'tiktok':
        return '🎵';
      case 'facebook':
        return '👥';
      default:
        return '💬';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-400 border-green-400';
      case 'negative':
        return 'text-red-400 border-red-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-400 border-red-400';
      case 'medium':
        return 'text-yellow-400 border-yellow-400';
      default:
        return 'text-green-400 border-green-400';
    }
  };

  return (
    <div className='space-y-8'>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center'
      >
        <Card className='p-12 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border-blue-500/30'>
          <h1 className='text-5xl font-black bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent mb-4'>
            SOCIAL INTELLIGENCE
          </h1>
          <p className='text-xl text-gray-300 mb-8'>Market Sentiment & Social Media Analysis</p>

          <div className='flex items-center justify-center gap-8'>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className='text-blue-500'
            >
              <MessageSquare className='w-12 h-12' />
            </motion.div>

            <div className='grid grid-cols-4 gap-8 text-center'>
              <div>
                <div className='text-3xl font-bold text-blue-400'>{totalPosts}</div>
                <div className='text-gray-400'>Social Posts</div>
              </div>
              <div>
                <div className='text-3xl font-bold text-green-400'>
                  {sentimentPercentages.positive.toFixed(0)}%
                </div>
                <div className='text-gray-400'>Positive</div>
              </div>
              <div>
                <div className='text-3xl font-bold text-yellow-400'>
                  {marketSignals.filter(s => s.actionable).length}
                </div>
                <div className='text-gray-400'>Actionable Signals</div>
              </div>
              <div>
                <div className='text-3xl font-bold text-purple-400'>{influencers.length}</div>
                <div className='text-gray-400'>Tracked Influencers</div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Controls */}
      <Card className='p-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2'>
              <span className='text-sm text-gray-400'>Sport:</span>
              <select
                value={selectedSport}
                onChange={e => setSelectedSport(e.target.value)}
                className='px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg'
                aria-label='Select sport'
              >
                <option value='All'>All Sports</option>
                <option value='NBA'>NBA</option>
                <option value='NFL'>NFL</option>
                <option value='MLB'>MLB</option>
                <option value='NHL'>NHL</option>
                <option value='Soccer'>Soccer</option>
              </select>
            </div>

            <div className='flex items-center gap-2'>
              <span className='text-sm text-gray-400'>Timeframe:</span>
              <select
                value={timeframe}
                onChange={e => setTimeframe(e.target.value as any)}
                className='px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg'
                aria-label='Select timeframe'
              >
                <option value='1h'>1 Hour</option>
                <option value='6h'>6 Hours</option>
                <option value='24h'>24 Hours</option>
                <option value='7d'>7 Days</option>
              </select>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <Badge
              variant='outline'
              className={
                isMonitoring ? 'text-green-400 border-green-400' : 'text-red-400 border-red-400'
              }
            >
              <Activity className='w-3 h-3 mr-1' />
              {isMonitoring ? 'Monitoring' : 'Paused'}
            </Badge>

            <Button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={
                isMonitoring
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : 'bg-gradient-to-r from-green-500 to-green-600'
              }
            >
              {isMonitoring ? 'Pause' : 'Resume'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      <div className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
        {/* Social Feed */}
        <div className='xl:col-span-2 space-y-6'>
          {/* Sentiment Overview */}
          <Card className='p-6'>
            <h3 className='text-xl font-bold text-white mb-4'>Sentiment Analysis</h3>

            <div className='grid grid-cols-3 gap-4 mb-6'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-400'>
                  {sentimentPercentages.positive.toFixed(1)}%
                </div>
                <div className='text-sm text-gray-400'>Positive</div>
                <div className='w-full bg-gray-700 rounded-full h-2 mt-2'>
                  <motion.div
                    className='bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full'
                    animate={{ width: `${sentimentPercentages.positive}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>

              <div className='text-center'>
                <div className='text-2xl font-bold text-gray-400'>
                  {sentimentPercentages.neutral.toFixed(1)}%
                </div>
                <div className='text-sm text-gray-400'>Neutral</div>
                <div className='w-full bg-gray-700 rounded-full h-2 mt-2'>
                  <motion.div
                    className='bg-gradient-to-r from-gray-400 to-gray-500 h-2 rounded-full'
                    animate={{ width: `${sentimentPercentages.neutral}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>

              <div className='text-center'>
                <div className='text-2xl font-bold text-red-400'>
                  {sentimentPercentages.negative.toFixed(1)}%
                </div>
                <div className='text-sm text-gray-400'>Negative</div>
                <div className='w-full bg-gray-700 rounded-full h-2 mt-2'>
                  <motion.div
                    className='bg-gradient-to-r from-red-400 to-red-500 h-2 rounded-full'
                    animate={{ width: `${sentimentPercentages.negative}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Social Posts */}
          <Card className='p-6'>
            <h3 className='text-xl font-bold text-white mb-4'>Live Social Feed</h3>

            <div className='space-y-4 max-h-96 overflow-y-auto'>
              {filteredPosts.slice(0, 10).map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className='p-4 bg-slate-800/50 rounded-lg border border-slate-700/50'
                >
                  <div className='flex items-start justify-between mb-3'>
                    <div className='flex items-center gap-3'>
                      <span className='text-2xl'>{getPlatformIcon(post.platform)}</span>
                      <div>
                        <div className='font-bold text-white text-sm'>{post.author}</div>
                        <div className='text-xs text-gray-400'>
                          {post.platform} • {post.timestamp}
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      <Badge variant='outline' className={getSentimentColor(post.sentiment)}>
                        {post.sentiment}
                      </Badge>
                      <Badge variant='outline' className='text-gray-400 border-gray-600'>
                        {post.sport}
                      </Badge>
                    </div>
                  </div>

                  <p className='text-gray-300 text-sm mb-3'>{post.content}</p>

                  <div className='flex items-center justify-between text-xs'>
                    <div className='flex items-center gap-4'>
                      <div className='flex items-center gap-1'>
                        <Heart className='w-3 h-3 text-red-400' />
                        <span className='text-gray-400'>
                          {post.engagement.likes.toLocaleString()}
                        </span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Share2 className='w-3 h-3 text-blue-400' />
                        <span className='text-gray-400'>
                          {post.engagement.shares.toLocaleString()}
                        </span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <MessageSquare className='w-3 h-3 text-green-400' />
                        <span className='text-gray-400'>
                          {post.engagement.comments.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      <span className='text-gray-400'>Influence:</span>
                      <span className='text-purple-400 font-bold'>
                        {(post.influence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* Side Panel */}
        <div className='space-y-6'>
          {/* Market Signals */}
          <Card className='p-6'>
            <h4 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
              <TrendingUp className='w-5 h-5 text-yellow-400' />
              Market Signals
            </h4>

            <div className='space-y-3'>
              {marketSignals.slice(0, 5).map((signal, index) => (
                <motion.div
                  key={signal.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className='p-3 bg-slate-800/50 rounded-lg border border-slate-700/50'
                >
                  <div className='flex items-start justify-between mb-2'>
                    <Badge variant='outline' className={getImpactColor(signal.impact)}>
                      {signal.impact.toUpperCase()}
                    </Badge>
                    <span className='text-xs text-gray-400'>{signal.timestamp}</span>
                  </div>

                  <p className='text-white text-sm font-medium mb-2'>{signal.description}</p>

                  <div className='flex items-center justify-between text-xs'>
                    <span className='text-gray-400'>{signal.sport}</span>
                    <div className='flex items-center gap-2'>
                      <span className='text-gray-400'>Confidence:</span>
                      <span className='text-green-400 font-bold'>
                        {signal.confidence.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {signal.actionable && (
                    <Badge variant='outline' className='text-blue-400 border-blue-400 mt-2'>
                      Actionable
                    </Badge>
                  )}
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Top Influencers */}
          <Card className='p-6'>
            <h4 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
              <Users className='w-5 h-5 text-purple-400' />
              Key Influencers
            </h4>

            <div className='space-y-3'>
              {influencers.slice(0, 5).map((influencer, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className='p-3 bg-slate-800/50 rounded-lg border border-slate-700/50'
                >
                  <div className='flex items-start justify-between mb-2'>
                    <div>
                      <div className='font-bold text-white text-sm'>{influencer.name}</div>
                      <div className='text-xs text-gray-400'>{influencer.platform}</div>
                    </div>
                    <Badge variant='outline' className={getSentimentColor(influencer.sentiment)}>
                      {influencer.sentiment}
                    </Badge>
                  </div>

                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    <div>
                      <span className='text-gray-400'>Followers:</span>
                      <div className='text-blue-400 font-bold'>
                        {(influencer.followers / 1000).toFixed(0)}k
                      </div>
                    </div>
                    <div>
                      <span className='text-gray-400'>Engagement:</span>
                      <div className='text-green-400 font-bold'>
                        {influencer.engagement.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <span className='text-gray-400'>Influence:</span>
                      <div className='text-purple-400 font-bold'>
                        {influencer.influence.toFixed(0)}/100
                      </div>
                    </div>
                    <div>
                      <span className='text-gray-400'>Recent Posts:</span>
                      <div className='text-yellow-400 font-bold'>{influencer.recentPosts}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Sentiment Trends */}
          <Card className='p-6'>
            <h4 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
              <BarChart3 className='w-5 h-5 text-cyan-400' />
              24h Trends
            </h4>

            <div className='space-y-3'>
              {sentimentTrends.slice(0, 8).map((trend, index) => (
                <div key={index} className='flex items-center justify-between text-sm'>
                  <span className='text-gray-400'>{trend.timestamp}</span>
                  <div className='flex items-center gap-2'>
                    <div className='flex items-center gap-1'>
                      <div className='w-2 h-2 bg-green-400 rounded-full'></div>
                      <span className='text-green-400'>{trend.positive.toFixed(0)}%</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <div className='w-2 h-2 bg-red-400 rounded-full'></div>
                      <span className='text-red-400'>{trend.negative.toFixed(0)}%</span>
                    </div>
                    <span className='text-gray-400'>{trend.volume}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
