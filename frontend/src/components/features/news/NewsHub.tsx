import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Clock,
  TrendingUp,
  AlertTriangle,
  Eye,
  RefreshCw,
  Filter,
  Search,
  ExternalLink,
  BookOpen,
  Users,
  Target,
  Zap,
  BarChart3,
  MessageSquare,
  Share2,
} from 'lucide-react';
import { Layout } from '../../core/Layout';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  source: string;
  publishedAt: Date;
  category: 'injury' | 'trade' | 'performance' | 'weather' | 'betting' | 'general';
  sentiment: number;
  importance: 'low' | 'medium' | 'high' | 'critical';
  relevantGames: string[];
  relevantPlayers: string[];
  marketImpact: number;
  tags: string[];
  url: string;
  imageUrl?: string;
  readTime: number;
}

interface TrendingStory {
  id: string;
  headline: string;
  summary: string;
  trend: 'rising' | 'falling' | 'stable';
  engagement: number;
  mentions: number;
  timeframe: string;
  category: string;
  impact: 'high' | 'medium' | 'low';
}

interface MarketAlert {
  id: string;
  type: 'breaking' | 'injury' | 'weather' | 'line_movement';
  title: string;
  description: string;
  timestamp: Date;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  affectedMarkets: string[];
  expectedImpact: string;
}

const NewsHub: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [trendingStories, setTrendingStories] = useState<TrendingStory[]>([]);
  const [marketAlerts, setMarketAlerts] = useState<MarketAlert[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);

  useEffect(() => {
    loadNewsData();
    const interval = setInterval(loadNewsData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [selectedCategory, searchQuery]);

  const loadNewsData = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockArticles: NewsArticle[] = [
        {
          id: 'news-001',
          title: 'LeBron James Expected to Rest Against Warriors',
          summary:
            "Lakers star LeBron James will likely sit out tonight's game against Golden State Warriors due to load management.",
          content:
            "Los Angeles Lakers superstar LeBron James is expected to rest during tonight's crucial matchup against the Golden State Warriors, according to team sources. The decision comes as part of the team's load management strategy to keep the 39-year-old fresh for the playoffs...",
          author: 'Adrian Wojnarowski',
          source: 'ESPN',
          publishedAt: new Date(Date.now() - 30 * 60 * 1000),
          category: 'injury',
          sentiment: -0.65,
          importance: 'critical',
          relevantGames: ['Lakers vs Warriors'],
          relevantPlayers: ['LeBron James'],
          marketImpact: 8.5,
          tags: ['Lakers', 'Warriors', 'Rest', 'Load Management'],
          url: 'https://espn.com/example',
          imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400',
          readTime: 3,
        },
        {
          id: 'news-002',
          title: 'Heavy Rain Expected for Chiefs vs Bills Game',
          summary:
            "Weather forecasts show heavy rainfall and wind gusts up to 35 mph for Sunday's AFC Championship game.",
          content:
            "Meteorologists are predicting severe weather conditions for Sunday's highly anticipated AFC Championship game between the Kansas City Chiefs and Buffalo Bills. Heavy rainfall and strong wind gusts could significantly impact the passing game...",
          author: 'Field Yates',
          source: 'ESPN',
          publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          category: 'weather',
          sentiment: -0.45,
          importance: 'high',
          relevantGames: ['Chiefs vs Bills'],
          relevantPlayers: ['Patrick Mahomes', 'Josh Allen'],
          marketImpact: 7.2,
          tags: ['Weather', 'Rain', 'Wind', 'AFC Championship'],
          url: 'https://espn.com/weather-example',
          imageUrl: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=400',
          readTime: 4,
        },
        {
          id: 'news-003',
          title: 'Celtics Acquire Star Player in Blockbuster Trade',
          summary:
            'Boston Celtics complete a major trade to bolster their championship aspirations.',
          content:
            "The Boston Celtics have completed a blockbuster trade that brings All-Star talent to their roster just before the playoff push. The move is seen as a clear signal of the team's championship intentions...",
          author: 'Shams Charania',
          source: 'The Athletic',
          publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          category: 'trade',
          sentiment: 0.78,
          importance: 'high',
          relevantGames: ['Celtics vs Heat'],
          relevantPlayers: ['Jayson Tatum', 'Jaylen Brown'],
          marketImpact: 6.8,
          tags: ['Trade', 'Celtics', 'Championship', 'Playoffs'],
          url: 'https://theathletic.com/trade-example',
          imageUrl: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=400',
          readTime: 5,
        },
      ];

      const mockTrending: TrendingStory[] = [
        {
          id: 'trend-001',
          headline: 'MVP Race Heating Up',
          summary: "Multiple candidates emerge as frontrunners for this year's MVP award",
          trend: 'rising',
          engagement: 15234,
          mentions: 8947,
          timeframe: 'Last 24 hours',
          category: 'Performance',
          impact: 'high',
        },
        {
          id: 'trend-002',
          headline: 'Betting Line Movements',
          summary: 'Unusual betting patterns detected across multiple games',
          trend: 'rising',
          engagement: 12456,
          mentions: 5632,
          timeframe: 'Last 6 hours',
          category: 'Betting',
          impact: 'medium',
        },
        {
          id: 'trend-003',
          headline: 'Injury Report Updates',
          summary: 'Several key players listed as questionable for upcoming games',
          trend: 'stable',
          engagement: 9876,
          mentions: 4321,
          timeframe: 'Last 12 hours',
          category: 'Injury',
          impact: 'high',
        },
      ];

      const mockAlerts: MarketAlert[] = [
        {
          id: 'alert-001',
          type: 'breaking',
          title: 'Breaking: Star Player Injury Update',
          description:
            "Major player ruled out for tonight's game, significant line movement expected",
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          urgency: 'critical',
          affectedMarkets: ['Player Props', 'Team Totals', 'Spreads'],
          expectedImpact: 'Lines moving 3-5 points',
        },
        {
          id: 'alert-002',
          type: 'weather',
          title: 'Weather Alert: Game Conditions',
          description: 'Heavy rain and wind expected to impact outdoor game',
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          urgency: 'high',
          affectedMarkets: ['Totals', 'Passing Props'],
          expectedImpact: 'Total dropping 3-6 points',
        },
      ];

      setArticles(mockArticles);
      setTrendingStories(mockTrending);
      setMarketAlerts(mockAlerts);
    } catch (error) {
      console.error('Failed to load news data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-green-400';
    if (sentiment > -0.3) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical':
        return 'text-red-400 bg-red-500/20';
      case 'high':
        return 'text-orange-400 bg-orange-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'low':
        return 'text-green-400 bg-green-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'injury':
        return <AlertTriangle className='w-4 h-4' />;
      case 'trade':
        return <Users className='w-4 h-4' />;
      case 'performance':
        return <TrendingUp className='w-4 h-4' />;
      case 'weather':
        return <Cloud className='w-4 h-4' />;
      case 'betting':
        return <Target className='w-4 h-4' />;
      default:
        return <BookOpen className='w-4 h-4' />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className='w-4 h-4 text-green-400' />;
      case 'falling':
        return <TrendingDown className='w-4 h-4 text-red-400' />;
      case 'stable':
        return <BarChart3 className='w-4 h-4 text-gray-400' />;
      default:
        return <BarChart3 className='w-4 h-4 text-gray-400' />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'border-red-500/50 bg-red-500/10';
      case 'high':
        return 'border-orange-500/50 bg-orange-500/10';
      case 'medium':
        return 'border-yellow-500/50 bg-yellow-500/10';
      case 'low':
        return 'border-blue-500/50 bg-blue-500/10';
      default:
        return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categories = ['all', 'injury', 'trade', 'performance', 'weather', 'betting', 'general'];

  return (
    <Layout
      title='News Hub'
      subtitle='Real-Time Sports News • Market Intelligence • Breaking Updates'
      headerActions={
        <div className='flex items-center space-x-3'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input
              type='text'
              placeholder='Search news...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
            />
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className='px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>

          <button
            onClick={loadNewsData}
            disabled={isLoading}
            className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 rounded-lg text-white font-medium transition-all disabled:opacity-50'
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      {/* Market Alerts */}
      {marketAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <h3 className='text-lg font-bold text-white mb-4 flex items-center space-x-2'>
            <AlertTriangle className='w-5 h-5 text-red-400' />
            <span>Breaking Market Alerts</span>
          </h3>

          <div className='space-y-3'>
            {marketAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${getUrgencyColor(alert.urgency)}`}
              >
                <div className='flex items-start justify-between mb-2'>
                  <div>
                    <h4 className='font-bold text-white'>{alert.title}</h4>
                    <p className='text-sm text-gray-300'>{alert.description}</p>
                  </div>
                  <span className='text-xs text-gray-400'>
                    {alert.timestamp.toLocaleTimeString()}
                  </span>
                </div>

                <div className='flex items-center justify-between mt-3'>
                  <div className='flex flex-wrap gap-1'>
                    {alert.affectedMarkets.map((market, idx) => (
                      <span
                        key={idx}
                        className='px-2 py-1 bg-slate-700/50 text-xs text-gray-300 rounded'
                      >
                        {market}
                      </span>
                    ))}
                  </div>
                  <div className='text-xs text-gray-400'>Impact: {alert.expectedImpact}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Trending Stories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mb-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Trending Stories</h3>
            <p className='text-gray-400 text-sm'>Most discussed topics in sports betting</p>
          </div>
          <TrendingUp className='w-5 h-5 text-green-400' />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {trendingStories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className='p-4 bg-slate-900/50 rounded-lg border border-slate-700/50'
            >
              <div className='flex items-start justify-between mb-3'>
                <h4 className='font-bold text-white text-sm'>{story.headline}</h4>
                {getTrendIcon(story.trend)}
              </div>

              <p className='text-xs text-gray-300 mb-3'>{story.summary}</p>

              <div className='flex justify-between items-center text-xs'>
                <span className='text-gray-400'>{story.timeframe}</span>
                <div className='flex items-center space-x-2'>
                  <span className='text-gray-400'>{story.mentions.toLocaleString()}</span>
                  <MessageSquare className='w-3 h-3 text-gray-400' />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* News Articles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Latest News</h3>
            <p className='text-gray-400 text-sm'>Breaking news and market-moving updates</p>
          </div>
          <Award className='w-5 h-5 text-yellow-400' />
        </div>

        <div className='space-y-6'>
          {filteredArticles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className='border border-slate-700/50 rounded-lg overflow-hidden hover:border-slate-600/50 transition-all'
            >
              <div className='p-6'>
                <div className='flex items-start space-x-4'>
                  {article.imageUrl && (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className='w-24 h-24 object-cover rounded-lg flex-shrink-0'
                    />
                  )}

                  <div className='flex-1'>
                    <div className='flex items-start justify-between mb-3'>
                      <div>
                        <h4 className='font-bold text-white text-lg mb-2'>{article.title}</h4>
                        <p className='text-gray-300 text-sm line-clamp-2'>{article.summary}</p>
                      </div>

                      <div className='flex flex-col items-end space-y-2'>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getImportanceColor(article.importance)}`}
                        >
                          {article.importance.toUpperCase()}
                        </span>
                        <div className='flex items-center space-x-1'>
                          {getCategoryIcon(article.category)}
                          <span className='text-xs text-gray-400'>{article.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center justify-between mb-4'>
                      <div className='flex items-center space-x-4 text-sm text-gray-400'>
                        <span>
                          {article.author} • {article.source}
                        </span>
                        <span>{article.publishedAt.toLocaleTimeString()}</span>
                        <span>{article.readTime} min read</span>
                      </div>

                      <div className='flex items-center space-x-3'>
                        <div className='text-sm'>
                          <span className='text-gray-400'>Sentiment: </span>
                          <span className={getSentimentColor(article.sentiment)}>
                            {article.sentiment > 0 ? '+' : ''}
                            {(article.sentiment * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className='text-sm'>
                          <span className='text-gray-400'>Impact: </span>
                          <span className='text-orange-400'>{article.marketImpact}/10</span>
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='flex flex-wrap gap-2'>
                        {article.tags.slice(0, 4).map((tag, idx) => (
                          <span
                            key={idx}
                            className='px-2 py-1 bg-slate-700/50 text-xs text-gray-300 rounded'
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className='flex items-center space-x-2'>
                        <button
                          onClick={() =>
                            setSelectedArticle(selectedArticle === article.id ? null : article.id)
                          }
                          className='flex items-center space-x-1 px-3 py-1 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm text-gray-300 transition-colors'
                        >
                          <Eye className='w-4 h-4' />
                          <span>Read More</span>
                        </button>

                        <button
                          onClick={() => window.open(article.url, '_blank')}
                          className='flex items-center space-x-1 px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg text-sm text-cyan-400 transition-colors'
                        >
                          <ExternalLink className='w-4 h-4' />
                          <span>Source</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedArticle === article.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className='mt-6 pt-6 border-t border-slate-700/50'
                  >
                    <div className='prose prose-invert max-w-none'>
                      <p className='text-gray-300 leading-relaxed'>{article.content}</p>
                    </div>

                    {(article.relevantGames.length > 0 || article.relevantPlayers.length > 0) && (
                      <div className='mt-4 p-4 bg-slate-900/50 rounded-lg'>
                        <h5 className='font-medium text-white mb-2'>Related Information</h5>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                          {article.relevantGames.length > 0 && (
                            <div>
                              <span className='text-gray-400'>Affected Games:</span>
                              <div className='mt-1'>
                                {article.relevantGames.map((game, idx) => (
                                  <span
                                    key={idx}
                                    className='inline-block px-2 py-1 bg-slate-800/50 text-gray-300 rounded mr-2 mb-1'
                                  >
                                    {game}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {article.relevantPlayers.length > 0 && (
                            <div>
                              <span className='text-gray-400'>Key Players:</span>
                              <div className='mt-1'>
                                {article.relevantPlayers.map((player, idx) => (
                                  <span
                                    key={idx}
                                    className='inline-block px-2 py-1 bg-slate-800/50 text-gray-300 rounded mr-2 mb-1'
                                  >
                                    {player}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className='text-center py-12'>
            <BookOpen className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h4 className='text-xl font-bold text-gray-400 mb-2'>No Articles Found</h4>
            <p className='text-gray-500'>Try adjusting your filters or search terms</p>
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default NewsHub;
