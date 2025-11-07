/**
 * Documentation Hub Component
 * Comprehensive help and documentation system
 */

import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Search,
  ChevronRight,
  ChevronDown,
  Video,
  FileText,
  Code,
  HelpCircle,
  ExternalLink,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Download,
  Filter,
  Tag,
  Clock,
  Users,
  Lightbulb,
  Zap,
  Shield,
  BarChart3,
  Settings,
  Rocket
} from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  articles: DocArticle[];
}

interface DocArticle {
  id: string;
  title: string;
  type: 'guide' | 'tutorial' | 'reference' | 'faq';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readTime: number;
  rating: number;
  views: number;
  lastUpdated: string;
  tags: string[];
  excerpt: string;
  content?: string;
}

const DocumentationHub: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<DocArticle | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  const docSections: DocSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Rocket,
      description: 'Quick start guides and basic concepts',
      articles: [
        {
          id: 'welcome',
          title: 'Welcome to A1Betting',
          type: 'guide',
          difficulty: 'beginner',
          readTime: 5,
          rating: 4.8,
          views: 15420,
          lastUpdated: '2024-01-17',
          tags: ['basics', 'introduction'],
          excerpt: 'Learn the fundamentals of A1Betting and how to get started with AI-powered sports betting analytics.',
          content: `# Welcome to A1Betting

A1Betting is the world's most advanced AI-powered sports betting analytics platform. This guide will help you understand the core concepts and get started with making smarter betting decisions.

## What makes A1Betting unique?

- **Advanced AI Models**: Our ensemble of machine learning models provides predictions with 94%+ accuracy
- **Quantum Optimization**: Unique quantum-inspired algorithms for portfolio optimization
- **Real-time Analytics**: Live data processing and instant insights
- **SHAP Explainability**: Understand exactly why our AI makes specific recommendations

## Getting Started

1. **Complete the onboarding** - Tell us about your experience and preferences
2. **Explore the dashboard** - See personalized recommendations and key metrics
3. **Try the prediction system** - Get AI-powered betting recommendations
4. **Use research tools** - Dive deep into player stats and matchup analysis
5. **Optimize your portfolio** - Use quantum algorithms for risk management`
        },
        {
          id: 'dashboard-overview',
          title: 'Dashboard Overview',
          type: 'guide',
          difficulty: 'beginner',
          readTime: 8,
          rating: 4.7,
          views: 12380,
          lastUpdated: '2024-01-16',
          tags: ['dashboard', 'navigation'],
          excerpt: 'Understand your personalized dashboard and how to navigate the main features.',
          content: `# Dashboard Overview

Your A1Betting dashboard is your command center for sports betting analytics. Here's what you'll find:

## Main Sections

### Quick Predictions
Get instant AI recommendations for today's games with confidence scores and reasoning.

### Performance Tracking  
Monitor your betting performance, ROI, and strategy effectiveness over time.

### Portfolio Overview
See your current positions, risk levels, and optimization recommendations.

### Market Insights
Real-time market analysis and value opportunities across different sportsbooks.`
        }
      ]
    },
    {
      id: 'ai-predictions',
      title: 'AI Predictions',
      icon: Zap,
      description: 'Understanding and using AI-powered recommendations',
      articles: [
        {
          id: 'how-predictions-work',
          title: 'How AI Predictions Work',
          type: 'guide',
          difficulty: 'intermediate',
          readTime: 12,
          rating: 4.9,
          views: 8920,
          lastUpdated: '2024-01-15',
          tags: ['ai', 'machine-learning', 'predictions'],
          excerpt: 'Deep dive into our AI prediction system and how to interpret confidence scores.',
          content: `# How AI Predictions Work

Our AI prediction system uses an ensemble of advanced machine learning models to generate betting recommendations.

## Model Architecture

- **XGBoost & LightGBM**: Gradient boosting for pattern recognition
- **Neural Networks**: Deep learning for complex relationships  
- **Transformer Models**: Natural language processing for news sentiment
- **Time Series Models**: Prophet and NeuralProphet for temporal patterns

## Confidence Scores

Confidence scores range from 0-100% and indicate how certain our models are about a prediction:

- **90-100%**: Extremely high confidence, rare opportunities
- **80-89%**: High confidence, strong recommendations
- **70-79%**: Good confidence, solid opportunities
- **60-69%**: Moderate confidence, proceed with caution
- **Below 60%**: Low confidence, generally not recommended`
        },
        {
          id: 'shap-explanations',
          title: 'Understanding SHAP Explanations',
          type: 'tutorial',
          difficulty: 'advanced',
          readTime: 15,
          rating: 4.6,
          views: 5240,
          lastUpdated: '2024-01-14',
          tags: ['shap', 'explainability', 'interpretability'],
          excerpt: 'Learn how to interpret SHAP explanations and understand why the AI makes specific recommendations.'
        }
      ]
    },
    {
      id: 'research-tools',
      title: 'Research Tools',
      icon: BarChart3,
      description: 'Advanced analysis and research capabilities',
      articles: [
        {
          id: 'player-analysis',
          title: 'Player Analysis Tools',
          type: 'guide',
          difficulty: 'intermediate',
          readTime: 10,
          rating: 4.5,
          views: 7560,
          lastUpdated: '2024-01-13',
          tags: ['research', 'players', 'statistics'],
          excerpt: 'Comprehensive guide to analyzing player performance and trends.'
        },
        {
          id: 'matchup-analysis',
          title: 'Matchup Analysis',
          type: 'tutorial',
          difficulty: 'intermediate',
          readTime: 14,
          rating: 4.7,
          views: 6180,
          lastUpdated: '2024-01-12',
          tags: ['matchups', 'analysis', 'head-to-head'],
          excerpt: 'Learn how to analyze team and player matchups for better betting decisions.'
        }
      ]
    },
    {
      id: 'portfolio-optimization',
      title: 'Portfolio Optimization',
      icon: Shield,
      description: 'Risk management and portfolio optimization',
      articles: [
        {
          id: 'quantum-optimization',
          title: 'Quantum Portfolio Optimization',
          type: 'guide',
          difficulty: 'advanced',
          readTime: 18,
          rating: 4.8,
          views: 4320,
          lastUpdated: '2024-01-11',
          tags: ['quantum', 'optimization', 'portfolio'],
          excerpt: 'Understanding our quantum-inspired optimization algorithms for portfolio management.'
        },
        {
          id: 'risk-management',
          title: 'Risk Management Strategies',
          type: 'guide',
          difficulty: 'intermediate',
          readTime: 12,
          rating: 4.6,
          views: 5890,
          lastUpdated: '2024-01-10',
          tags: ['risk', 'bankroll', 'kelly-criterion'],
          excerpt: 'Learn effective risk management strategies and bankroll management techniques.'
        }
      ]
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      icon: Code,
      description: 'Technical documentation for developers',
      articles: [
        {
          id: 'api-overview',
          title: 'API Overview',
          type: 'reference',
          difficulty: 'advanced',
          readTime: 8,
          rating: 4.4,
          views: 2150,
          lastUpdated: '2024-01-09',
          tags: ['api', 'developers', 'integration'],
          excerpt: 'Complete API reference for integrating with A1Betting services.'
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: HelpCircle,
      description: 'Common issues and solutions',
      articles: [
        {
          id: 'common-issues',
          title: 'Common Issues & Solutions',
          type: 'faq',
          difficulty: 'beginner',
          readTime: 6,
          rating: 4.3,
          views: 3420,
          lastUpdated: '2024-01-08',
          tags: ['troubleshooting', 'faq', 'support'],
          excerpt: 'Solutions to frequently encountered issues and problems.'
        }
      ]
    }
  ];

  const allArticles = docSections.flatMap(section => section.articles);

  const filteredArticles = allArticles.filter(article => {
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === 'all' || article.type === filterType;
    const matchesDifficulty = filterDifficulty === 'all' || article.difficulty === filterDifficulty;
    
    return matchesSearch && matchesType && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-500/20';
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/20';
      case 'advanced': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'guide': return BookOpen;
      case 'tutorial': return Video;
      case 'reference': return Code;
      case 'faq': return HelpCircle;
      default: return FileText;
    }
  };

  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        {/* Article Header */}
        <div className="bg-slate-800/50 backdrop-blur-lg border-b border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedArticle(null)}
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span>Back to Documentation</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm">{selectedArticle.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-sm">{selectedArticle.views.toLocaleString()} views</span>
              </div>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">{selectedArticle.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-slate-400">
              <span className={`px-2 py-1 rounded-full ${getDifficultyColor(selectedArticle.difficulty)}`}>
                {selectedArticle.difficulty}
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{selectedArticle.readTime} min read</span>
              </span>
              <span>Updated {selectedArticle.lastUpdated}</span>
            </div>
          </div>

          <div className="prose prose-invert prose-slate max-w-none">
            <div className="bg-slate-800/30 rounded-lg p-6 border border-slate-700 whitespace-pre-wrap">
              {selectedArticle.content || 'Content coming soon...'}
            </div>
          </div>

          {/* Article Actions */}
          <div className="mt-8 flex items-center justify-between bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center space-x-4">
              <span className="text-slate-400">Was this helpful?</span>
              <button className="flex items-center space-x-1 text-green-400 hover:text-green-300 transition-colors">
                <ThumbsUp className="w-4 h-4" />
                <span>Yes</span>
              </button>
              <button className="flex items-center space-x-1 text-red-400 hover:text-red-300 transition-colors">
                <ThumbsDown className="w-4 h-4" />
                <span>No</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-1 text-slate-400 hover:text-white transition-colors">
                <MessageCircle className="w-4 h-4" />
                <span>Feedback</span>
              </button>
              <button className="flex items-center space-x-1 text-slate-400 hover:text-white transition-colors">
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
          Documentation Hub
        </h1>
        <p className="text-slate-400 text-lg">
          Everything you need to master A1Betting's advanced features
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">All Types</option>
            <option value="guide">Guides</option>
            <option value="tutorial">Tutorials</option>
            <option value="reference">Reference</option>
            <option value="faq">FAQ</option>
          </select>

          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Categories */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold text-white mb-4">Categories</h2>
          <div className="space-y-2">
            {docSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(selectedSection === section.id ? null : section.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedSection === section.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{section.title}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${
                      selectedSection === section.id ? 'rotate-180' : ''
                    }`} />
                  </div>
                  {selectedSection === section.id && (
                    <p className="text-sm mt-2 text-blue-200">{section.description}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content - Articles */}
        <div className="lg:col-span-3">
          <div className="space-y-6">
            {selectedSection ? (
              // Show articles for selected section
              docSections
                .find(section => section.id === selectedSection)
                ?.articles.map((article) => {
                  const TypeIcon = getTypeIcon(article.type);
                  return (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all cursor-pointer"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <TypeIcon className="w-5 h-5 text-blue-400" />
                            <h3 className="text-xl font-semibold text-white">{article.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(article.difficulty)}`}>
                              {article.difficulty}
                            </span>
                          </div>
                          
                          <p className="text-slate-400 mb-4">{article.excerpt}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-slate-500">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{article.readTime} min</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Star className="w-4 h-4" />
                              <span>{article.rating}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{article.views.toLocaleString()}</span>
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            {article.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-slate-700 text-slate-300 rounded-full text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <ChevronRight className="w-5 h-5 text-slate-400 ml-4" />
                      </div>
                    </motion.div>
                  );
                })
            ) : (
              // Show filtered articles
              filteredArticles.map((article) => {
                const TypeIcon = getTypeIcon(article.type);
                return (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all cursor-pointer"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <TypeIcon className="w-5 h-5 text-blue-400" />
                          <h3 className="text-xl font-semibold text-white">{article.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(article.difficulty)}`}>
                            {article.difficulty}
                          </span>
                        </div>
                        
                        <p className="text-slate-400 mb-4">{article.excerpt}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{article.readTime} min</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Star className="w-4 h-4" />
                            <span>{article.rating}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{article.views.toLocaleString()}</span>
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          {article.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-slate-700 text-slate-300 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-slate-400 ml-4" />
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationHub;
