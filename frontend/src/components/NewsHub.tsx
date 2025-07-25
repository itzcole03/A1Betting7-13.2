import { motion } from 'framer-motion';
import { Clock, ExternalLink, Filter, Newspaper, Search, Star, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
// @ts-expect-error TS(6142): Module '../components/ui/badge' was resolved to 'C... Remove this comment to see the full error message
import { Badge } from '../components/ui/badge';
// @ts-expect-error TS(6142): Module '../components/ui/button' was resolved to '... Remove this comment to see the full error message
import { Button } from '../components/ui/button';
// @ts-expect-error TS(6142): Module '../components/ui/card' was resolved to 'C:... Remove this comment to see the full error message
import { Card } from '../components/ui/card';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  author: string;
  timestamp: string;
  category: 'breaking' | 'injury' | 'trade' | 'analysis' | 'prediction';
  sport: string;
  team?: string;
  player?: string;
  impact: 'high' | 'medium' | 'low';
  credibility: number;
  engagement: number;
  url: string;
  imageUrl?: string;
}

interface TrendingTopic {
  topic: string;
  mentions: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  growth: number;
}

export const _NewsHub: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'impact' | 'credibility' | 'engagement'>(
    'timestamp'
  );

  // Generate mock news articles
  const _generateNewsArticles = (): NewsArticle[] => {
    const _sports = ['NBA', 'NFL', 'MLB', 'NHL', 'Soccer'];
    const _categories = ['breaking', 'injury', 'trade', 'analysis', 'prediction'] as const;
    const _sources = [
      'ESPN',
      'The Athletic',
      'Bleacher Report',
      'Yahoo Sports',
      'CBS Sports',
      'NBC Sports',
    ];

    const _sampleNews = [
      {
        title: "Star Player Questionable for Tonight's Game",
        summary:
          'Team officials report that the All-Star player is dealing with a minor injury that could affect availability for the crucial matchup tonight.',
      },
      {
        title: 'Trade Deadline Approaching: Teams Making Final Moves',
        summary:
          'Multiple teams are reportedly in talks for last-minute trades that could reshape the playoff picture.',
      },
      {
        title: 'Weather Forecast Could Impact Outdoor Games',
        summary:
          'Meteorologists predict adverse conditions that may affect several games scheduled for this weekend.',
      },
      {
        title: 'Record-Breaking Performance Lights Up Social Media',
        summary:
          "Fans and analysts are buzzing about a historic achievement that happened in last night's game.",
      },
      {
        title: 'Coaching Change Rumored After Poor Start',
        summary:
          'Sources close to the organization suggest management is considering major changes following recent struggles.',
      },
      {
        title: 'Rookie Sensation Continues Impressive Campaign',
        summary:
          'The first-year player has exceeded all expectations and is now in the conversation for major awards.',
      },
      {
        title: 'Vegas Lines Moving Significantly on Upcoming Matchup',
        summary:
          'Sharp money appears to be influencing odds on what was expected to be a straightforward game.',
      },
      {
        title: 'International Player Visa Issues Cause Uncertainty',
        summary:
          'Administrative complications could sideline key international talent for several games.',
      },
    ];

    return Array.from({ length: 15 }, (_, index) => {
      const _category = categories[Math.floor(Math.random() * categories.length)];
      const _sport = sports[Math.floor(Math.random() * sports.length)];
      const _newsItem = sampleNews[Math.floor(Math.random() * sampleNews.length)];

      return {
        id: `news-${index}`,
        title: newsItem.title,
        summary: newsItem.summary,
        source: sources[Math.floor(Math.random() * sources.length)],
        author: `Reporter ${Math.floor(Math.random() * 100)}`,
        timestamp: `${Math.floor(Math.random() * 12) + 1}h ago`,
        category,
        sport,
        team: Math.random() > 0.5 ? `Team ${Math.floor(Math.random() * 30) + 1}` : undefined,
        player: Math.random() > 0.6 ? `Player ${Math.floor(Math.random() * 100) + 1}` : undefined,
        impact: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        credibility: 70 + Math.random() * 30,
        engagement: Math.floor(Math.random() * 10000),
        url: `https://example.com/article-${index}`,
        imageUrl: Math.random() > 0.5 ? `https://picsum.photos/300/200?random=${index}` : undefined,
      };
    });
  };

  // Generate trending topics
  const _generateTrendingTopics = (): TrendingTopic[] => {
    const _topics = [
      'Trade Deadline',
      'Playoff Race',
      'MVP Candidates',
      'Injury Updates',
      'Rookie Records',
      'Coaching Changes',
      'Contract Extensions',
      'Draft Prospects',
    ];

    return topics.map(topic => ({
      topic,
      mentions: Math.floor(Math.random() * 5000 + 1000),
      sentiment: Math.random() > 0.5 ? 'positive' : Math.random() > 0.5 ? 'neutral' : 'negative',
      growth: (Math.random() - 0.5) * 200,
    }));
  };

  useEffect(() => {
    setArticles(generateNewsArticles());
    setTrendingTopics(generateTrendingTopics());
  }, []);

  // Filter and sort articles
  const _filteredArticles = articles
    .filter(article => {
      if (selectedCategory !== 'all' && article.category !== selectedCategory) return false;
      if (selectedSport !== 'all' && article.sport !== selectedSport) return false;
      if (
        searchQuery &&
        !article.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !article.summary.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'impact':
          const _impactOrder = { high: 3, medium: 2, low: 1 };
          return impactOrder[b.impact] - impactOrder[a.impact];
        case 'credibility':
          return b.credibility - a.credibility;
        case 'engagement':
          return b.engagement - a.engagement;
        default:
          return 0; // Keep original order for timestamp
      }
    });

  const _getCategoryColor = (category: string) => {
    switch (category) {
      case 'breaking':
        return 'text-red-400 border-red-400';
      case 'injury':
        return 'text-orange-400 border-orange-400';
      case 'trade':
        return 'text-blue-400 border-blue-400';
      case 'analysis':
        return 'text-purple-400 border-purple-400';
      case 'prediction':
        return 'text-green-400 border-green-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const _getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-400 border-red-400';
      case 'medium':
        return 'text-yellow-400 border-yellow-400';
      case 'low':
        return 'text-green-400 border-green-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const _getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-400';
      case 'negative':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='space-y-8'>
      {/* Header */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Card className='p-12 bg-gradient-to-r from-pink-900/20 to-red-900/20 border-pink-500/30'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h1 className='text-5xl font-black bg-gradient-to-r from-pink-400 to-red-500 bg-clip-text text-transparent mb-4'>
            NEWS HUB
          </h1>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p className='text-xl text-gray-300 mb-8'>Real-Time Sports News & Intelligence</p>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-center gap-8'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              className='text-pink-500'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Newspaper className='w-12 h-12' />
            </motion.div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='grid grid-cols-4 gap-8 text-center'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-3xl font-bold text-pink-400'>{articles.length}</div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-gray-400'>Articles</div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-3xl font-bold text-red-400'>
                  {articles.filter(a => a.category === 'breaking').length}
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-gray-400'>Breaking</div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-3xl font-bold text-blue-400'>{trendingTopics.length}</div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-gray-400'>Trending</div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-3xl font-bold text-purple-400'>
                  {articles.filter(a => a.impact === 'high').length}
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-gray-400'>High Impact</div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Filters */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Card className='p-6'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-1 lg:grid-cols-5 gap-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <label className='block text-sm text-gray-400 mb-2' htmlFor='news-category'>Category</label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <select
              id='news-category'
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className='w-full p-2 bg-gray-800 border border-gray-700 rounded-lg'
              aria-label='Select category'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='all'>All Categories</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='breaking'>Breaking</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='injury'>Injury</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='trade'>Trade</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='analysis'>Analysis</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='prediction'>Prediction</option>
            </select>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <label className='block text-sm text-gray-400 mb-2' htmlFor='news-sport'>Sport</label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <select
              id='news-sport'
              value={selectedSport}
              onChange={e => setSelectedSport(e.target.value)}
              className='w-full p-2 bg-gray-800 border border-gray-700 rounded-lg'
              aria-label='Select sport'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='all'>All Sports</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='NBA'>NBA</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='NFL'>NFL</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='MLB'>MLB</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='NHL'>NHL</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='Soccer'>Soccer</option>
            </select>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <label className='block text-sm text-gray-400 mb-2' htmlFor='news-sort-by'>Sort By</label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <select
              id='news-sort-by'
              value={sortBy}
              onChange={e => setSortBy(e.target.value as unknown)}
              className='w-full p-2 bg-gray-800 border border-gray-700 rounded-lg'
              aria-label='Sort by'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='timestamp'>Latest</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='impact'>Impact</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='credibility'>Credibility</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='engagement'>Engagement</option>
            </select>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <label className='block text-sm text-gray-400 mb-2' htmlFor='news-search'>Search</label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='relative'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <input
                id='news-search'
                type='text'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder='Search news...'
                className='w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg'
                aria-label='Search news'
              />
            </div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-end'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Button className='w-full bg-gradient-to-r from-pink-500 to-red-600 hover:from-pink-600 hover:to-red-700'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Filter className='w-4 h-4 mr-2' />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid grid-cols-1 xl:grid-cols-4 gap-8'>
        {/* News Articles */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='xl:col-span-3'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white'>Latest News</h3>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-4'>
              {filteredArticles.map((article, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Card className='p-6 hover:border-pink-500/30 transition-all cursor-pointer'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-start gap-4'>
                      {article.imageUrl && (
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className='w-24 h-24 object-cover rounded-lg flex-shrink-0'
                        />
                      )}

                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='flex-1'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex items-start justify-between mb-3'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='flex items-center gap-2'>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <Badge variant='outline' className={getCategoryColor(article.category)}>
                              {article.category}
                            </Badge>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <Badge variant='outline' className={getImpactColor(article.impact)}>
                              {article.impact}
                            </Badge>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <Badge variant='outline' className='text-gray-400 border-gray-600'>
                              {article.sport}
                            </Badge>
                          </div>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='flex items-center gap-2 text-xs text-gray-400'>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <Clock className='w-3 h-3' />
                            {article.timestamp}
                          </div>
                        </div>

                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <h4 className='text-lg font-bold text-white mb-2 hover:text-pink-400 transition-colors'>
                          {article.title}
                        </h4>

                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <p className='text-gray-300 text-sm mb-3 line-clamp-2'>{article.summary}</p>

                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex items-center justify-between'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='flex items-center gap-4 text-xs text-gray-400'>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <span>{article.source}</span>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <span>by {article.author}</span>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div className='flex items-center gap-1'>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <Star className='w-3 h-3 text-yellow-400' />
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <span>{article.credibility.toFixed(0)}%</span>
                            </div>
                          </div>

                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='flex items-center gap-2'>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <span className='text-xs text-gray-400'>
                              {article.engagement.toLocaleString()} views
                            </span>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <Button size='sm' variant='outline'>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <ExternalLink className='w-3 h-3' />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Trending Topics */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Card className='p-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h4 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <TrendingUp className='w-5 h-5 text-pink-400' />
              Trending Topics
            </h4>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-3'>
              {trendingTopics.map((topic, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className='p-3 bg-slate-800/50 rounded-lg border border-slate-700/50'
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-start justify-between mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <h5 className='font-bold text-white text-sm'>{topic.topic}</h5>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Badge
                      variant='outline'
                      className={`${topic.growth > 0 ? 'text-green-400 border-green-400' : 'text-red-400 border-red-400'}`}
                    >
                      {topic.growth > 0 ? '+' : ''}
                      {topic.growth.toFixed(0)}%
                    </Badge>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between text-xs'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>
                      {topic.mentions.toLocaleString()} mentions
                    </span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className={getSentimentColor(topic.sentiment)}>{topic.sentiment}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
