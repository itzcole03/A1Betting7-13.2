import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Brain,
  Zap,
  Trophy,
  Target,
  Activity,
  BarChart3,
  Clock,
  AlertTriangle,
  Cpu,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Calculator,
  MessageSquare,
  Heart,
  Share2,
  Twitter,
  Users,
  ThumbsUp,
  ThumbsDown,
  Eye,
} from 'lucide-react';
import { Layout } from '../../core/Layout';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { HolographicText, CyberButton, GlowCard, LoadingWave, GlassCard } from '../../ui';

interface MetricCard {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  description: string;
  gradient: string;
}

interface LiveOpportunity {
  id: string;
  game: string;
  type: string;
  confidence: number;
  roi: number;
  stake: number;
  expectedProfit: number;
}

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

interface AutoBetRule {
  id: string;
  name: string;
  sport: string;
  condition: {
    type: 'confidence' | 'odds' | 'value' | 'composite';
    operator: '>' | '<' | '=' | '>=' | '<=';
    threshold: number;
  };
  action: {
    betType: 'moneyline' | 'spread' | 'total' | 'prop';
    stakeType: 'fixed' | 'percentage' | 'kelly';
    amount: number;
    maxStake: number;
  };
  filters: {
    minOdds: number;
    maxOdds: number;
    leagues: string[];
    timeWindow: string;
  };
  isActive: boolean;
  safetyLimits: {
    maxDailyStake: number;
    maxConsecutiveLosses: number;
    cooldownPeriod: number;
  };
}

interface AutoBetExecution {
  id: string;
  ruleId: string;
  game: string;
  betType: string;
  stake: number;
  odds: string;
  confidence: number;
  status: 'pending' | 'placed' | 'failed' | 'cancelled';
  timestamp: string;
  reasoning: string;
}

interface AutoPilotStats {
  isActive: boolean;
  rulesActive: number;
  betsToday: number;
  totalStaked: number;
  profitLoss: number;
  winRate: number;
  lastExecuted: string;
  safetyStatus: 'safe' | 'warning' | 'critical';
}

interface BankrollData {
  currentBalance: number;
  startingBalance: number;
  totalProfit: number;
  totalWagered: number;
  winRate: number;
  roi: number;
  sharpeRatio: number;
  maxDrawdown: number;
  streakData: {
    currentStreak: number;
    longestWinStreak: number;
    longestLossStreak: number;
  };
}

interface BetAllocation {
  id: string;
  game: string;
  type: string;
  confidence: number;
  kellyPercent: number;
  recommendedStake: number;
  maxStake: number;
  expectedValue: number;
  risk: 'low' | 'medium' | 'high';
}

interface RiskMetrics {
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  maxBetSize: number;
  diversificationScore: number;
  volatility: number;
  valueAtRisk: number;
}

const Dashboard: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [liveOpportunities, setLiveOpportunities] = useState<LiveOpportunity[]>([]);

  // Social Intelligence state
  const [sentimentData, setSentimentData] = useState<Record<string, SentimentData>>({});
  const [recentPosts, setRecentPosts] = useState<SocialPost[]>([]);
  const [influencers, setInfluencers] = useState<InfluencerInsight[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // AutoPilot state
  const [autoPilotRules, setAutoPilotRules] = useState<AutoBetRule[]>([]);
  const [autoPilotExecutions, setAutoPilotExecutions] = useState<AutoBetExecution[]>([]);
  const [autoPilotStats, setAutoPilotStats] = useState<AutoPilotStats | null>(null);
  const [isGlobalAutoPilotActive, setIsGlobalAutoPilotActive] = useState(false);

  // Bankroll Manager state
  const [bankrollData, setBankrollData] = useState<BankrollData | null>(null);
  const [betAllocations, setBetAllocations] = useState<BetAllocation[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [riskLevel, setRiskLevel] = useState<'conservative' | 'moderate' | 'aggressive'>(
    'moderate'
  );
  const [kellyFraction, setKellyFraction] = useState<number>(0.25);

  // Mock data - replace with real API calls
  const keyMetrics: MetricCard[] = [
    {
      id: 'win-rate',
      title: 'Win Rate',
      value: '73.8%',
      change: '+2.3%',
      changeType: 'positive',
      icon: <Trophy className='w-6 h-6' />,
      description: 'Current prediction accuracy',
      gradient: 'from-green-400 to-green-600',
    },
    {
      id: 'total-profit',
      title: 'Total Profit',
      value: '$18,420',
      change: '+$1,240',
      changeType: 'positive',
      icon: <DollarSign className='w-6 h-6' />,
      description: 'Total realized profits',
      gradient: 'from-purple-400 to-purple-600',
    },
    {
      id: 'ai-accuracy',
      title: 'AI Accuracy',
      value: '96.4%',
      change: '+0.8%',
      changeType: 'positive',
      icon: <Brain className='w-6 h-6' />,
      description: 'ML model performance',
      gradient: 'from-cyan-400 to-cyan-600',
    },
    {
      id: 'live-opportunities',
      title: 'Live Opportunities',
      value: '23',
      change: '+7',
      changeType: 'positive',
      icon: <Zap className='w-6 h-6' />,
      description: 'Active betting opportunities',
      gradient: 'from-yellow-400 to-yellow-600',
    },
    {
      id: 'roi',
      title: 'ROI',
      value: '847%',
      change: '+12%',
      changeType: 'positive',
      icon: <TrendingUp className='w-6 h-6' />,
      description: 'Return on investment',
      gradient: 'from-pink-400 to-pink-600',
    },
    {
      id: 'sharpe-ratio',
      title: 'Sharpe Ratio',
      value: '1.42',
      change: '+0.08',
      changeType: 'positive',
      icon: <BarChart3 className='w-6 h-6' />,
      description: 'Risk-adjusted return',
      gradient: 'from-indigo-400 to-indigo-600',
    },
  ];

  const mlModelStats = [
    { name: 'XGBoost Ensemble', accuracy: '97.2%', status: 'active', weight: '35%' },
    { name: 'Neural Network', accuracy: '96.8%', status: 'active', weight: '30%' },
    { name: 'LSTM Predictor', accuracy: '95.1%', status: 'active', weight: '20%' },
    { name: 'Random Forest', accuracy: '94.6%', status: 'active', weight: '15%' },
  ];

  useEffect(() => {
    loadSocialData();
    loadAutoPilotData();
    loadBankrollData();

    // Simulate live opportunities
    const mockOpportunities: LiveOpportunity[] = [
      {
        id: '1',
        game: 'Lakers vs Warriors',
        type: 'Over 225.5 Points',
        confidence: 94.2,
        roi: 23.4,
        stake: 2500,
        expectedProfit: 585,
      },
      {
        id: '2',
        game: 'Chiefs vs Bills',
        type: 'Mahomes 300+ Yards',
        confidence: 89.7,
        roi: 18.2,
        stake: 1800,
        expectedProfit: 327,
      },
      {
        id: '3',
        game: 'Celtics vs Heat',
        type: 'Tatum Over 28.5 Pts',
        confidence: 92.1,
        roi: 15.8,
        stake: 2200,
        expectedProfit: 347,
      },
    ];
    setLiveOpportunities(mockOpportunities);

    // Run functionality test in development
    if (process.env.NODE_ENV === 'development') {
      import('../../../utils/testFunctionality').then(({ logFunctionalityTest }) => {
        logFunctionalityTest();
      });
    }
  }, []);

  const loadSocialData = async () => {
    setIsAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockSentiment: Record<string, SentimentData> = {
        'Lakers vs Warriors': {
          overall: 0.72,
          positive: 0.68,
          negative: 0.12,
          neutral: 0.2,
          confidence: 0.89,
          volume: 2847,
          trend: 'bullish',
        },
        'Celtics vs Heat': {
          overall: 0.45,
          positive: 0.34,
          negative: 0.31,
          neutral: 0.35,
          confidence: 0.76,
          volume: 1923,
          trend: 'neutral',
        },
      };

      const mockPosts: SocialPost[] = [
        {
          id: 'post-1',
          platform: 'twitter',
          author: '@SportsBetExpert',
          content: 'LeBron looking unstoppable tonight. Over 25.5 points is free money 🚀',
          sentiment: 0.85,
          engagement: { likes: 247, shares: 89, comments: 34 },
          influence: 0.78,
          timestamp: new Date(Date.now() - 300000),
          gameId: 'lakers-warriors',
          players: ['LeBron James'],
          keywords: ['LeBron', 'over', 'points'],
        },
        {
          id: 'post-2',
          platform: 'reddit',
          author: 'u/NBAPropKing',
          content: 'Warriors defense has been leaky lately. Expecting high scoring game.',
          sentiment: 0.62,
          engagement: { likes: 156, shares: 23, comments: 67 },
          influence: 0.65,
          timestamp: new Date(Date.now() - 600000),
          gameId: 'lakers-warriors',
          keywords: ['Warriors', 'defense', 'high scoring'],
        },
      ];

      const mockInfluencers: InfluencerInsight[] = [
        {
          id: 'inf-1',
          name: 'Sharp Sports Analyst',
          platform: 'Twitter',
          followers: 125000,
          accuracy: 0.73,
          recentPicks: [
            { game: 'Lakers vs Warriors', pick: 'Lakers +2.5', outcome: 'won', confidence: 0.85 },
            { game: 'Celtics vs Heat', pick: 'Under 218.5', outcome: 'pending', confidence: 0.72 },
          ],
          sentiment: 0.68,
          influence: 0.82,
        },
      ];

      const mockTrending: TrendingTopic[] = [
        {
          id: 'trend-1',
          keyword: 'LeBron injury concern',
          volume: 1240,
          sentiment: -0.32,
          growth: 0.89,
          category: 'injury',
          relevantGames: ['lakers-warriors'],
          impact: 'high',
        },
        {
          id: 'trend-2',
          keyword: 'Warriors defense struggles',
          volume: 856,
          sentiment: 0.45,
          growth: 0.67,
          category: 'team_analysis',
          relevantGames: ['lakers-warriors'],
          impact: 'medium',
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

  const loadAutoPilotData = async () => {
    try {
      const mockRules: AutoBetRule[] = [
        {
          id: 'rule-1',
          name: 'High Confidence NBA Totals',
          sport: 'NBA',
          condition: {
            type: 'confidence',
            operator: '>=',
            threshold: 85,
          },
          action: {
            betType: 'total',
            stakeType: 'kelly',
            amount: 2.5,
            maxStake: 250,
          },
          filters: {
            minOdds: -120,
            maxOdds: 120,
            leagues: ['NBA'],
            timeWindow: '2h',
          },
          isActive: true,
          safetyLimits: {
            maxDailyStake: 500,
            maxConsecutiveLosses: 3,
            cooldownPeriod: 30,
          },
        },
        {
          id: 'rule-2',
          name: 'NFL Value Spreads',
          sport: 'NFL',
          condition: {
            type: 'value',
            operator: '>',
            threshold: 3.5,
          },
          action: {
            betType: 'spread',
            stakeType: 'percentage',
            amount: 1.5,
            maxStake: 200,
          },
          filters: {
            minOdds: -115,
            maxOdds: 115,
            leagues: ['NFL'],
            timeWindow: '24h',
          },
          isActive: true,
          safetyLimits: {
            maxDailyStake: 400,
            maxConsecutiveLosses: 2,
            cooldownPeriod: 60,
          },
        },
      ];

      const mockExecutions: AutoBetExecution[] = Array.from({ length: 8 }, (_, index) => ({
        id: `exec-${index}`,
        ruleId: `rule-${Math.floor(Math.random() * 2) + 1}`,
        game: ['Lakers vs Warriors', 'Chiefs vs Bills', 'Yankees vs Red Sox'][
          Math.floor(Math.random() * 3)
        ],
        betType: ['total', 'spread', 'moneyline', 'prop'][Math.floor(Math.random() * 4)],
        stake: Math.floor(Math.random() * 200) + 50,
        odds:
          Math.random() > 0.5
            ? `+${Math.floor(Math.random() * 150) + 100}`
            : `-${Math.floor(Math.random() * 150) + 100}`,
        confidence: 70 + Math.random() * 25,
        status: ['placed', 'pending', 'failed'][Math.floor(Math.random() * 3)] as any,
        timestamp: `${Math.floor(Math.random() * 6) + 1}h ago`,
        reasoning: 'High confidence prediction with favorable value proposition',
      }));

      const mockStats: AutoPilotStats = {
        isActive: isGlobalAutoPilotActive,
        rulesActive: 2,
        betsToday: 7,
        totalStaked: 850,
        profitLoss: 125,
        winRate: 65.5,
        lastExecuted: '15 min ago',
        safetyStatus: 'safe',
      };

      setAutoPilotRules(mockRules);
      setAutoPilotExecutions(mockExecutions);
      setAutoPilotStats(mockStats);
    } catch (error) {
      console.error('Failed to load AutoPilot data:', error);
    }
  };

  const loadBankrollData = async () => {
    try {
      const startingBalance = 10000;
      const currentBalance = startingBalance + (Math.random() * 15000 - 2500);
      const totalProfit = currentBalance - startingBalance;

      const mockBankrollData: BankrollData = {
        currentBalance,
        startingBalance,
        totalProfit,
        totalWagered: Math.floor(Math.random() * 50000 + 20000),
        winRate: 55 + Math.random() * 20,
        roi: (totalProfit / startingBalance) * 100,
        sharpeRatio: 1.2 + Math.random() * 0.8,
        maxDrawdown: Math.random() * 15 + 5,
        streakData: {
          currentStreak: Math.floor(Math.random() * 10) - 5,
          longestWinStreak: Math.floor(Math.random() * 15) + 5,
          longestLossStreak: Math.floor(Math.random() * 8) + 2,
        },
      };

      const games = [
        { game: 'Lakers vs Warriors', type: 'Spread' },
        { game: 'Chiefs vs Bills', type: 'Total' },
        { game: 'Yankees vs Red Sox', type: 'Moneyline' },
        { game: 'Celtics vs Heat', type: 'Player Props' },
        { game: 'Rangers vs Lightning', type: 'Puck Line' },
      ];

      const mockAllocations: BetAllocation[] = games.map((g, index) => {
        const confidence = 60 + Math.random() * 35;
        const kellyPercent = ((confidence - 50) / 10) * kellyFraction;

        return {
          id: `allocation-${index}`,
          ...g,
          confidence,
          kellyPercent: Math.max(0, Math.min(kellyPercent, 5)),
          recommendedStake: Math.max(0, (kellyPercent / 100) * currentBalance),
          maxStake: (kellyPercent / 100) * currentBalance * 2,
          expectedValue: confidence > 65 ? Math.random() * 8 + 2 : Math.random() * 4,
          risk: confidence > 80 ? 'low' : confidence > 65 ? 'medium' : 'high',
        };
      });

      const mockRiskMetrics: RiskMetrics = {
        riskLevel,
        maxBetSize: riskLevel === 'conservative' ? 2 : riskLevel === 'moderate' ? 5 : 8,
        diversificationScore: 75 + Math.random() * 20,
        volatility:
          riskLevel === 'conservative'
            ? 8 + Math.random() * 5
            : riskLevel === 'moderate'
              ? 12 + Math.random() * 8
              : 18 + Math.random() * 12,
        valueAtRisk: Math.random() * 15 + 5,
      };

      setBankrollData(mockBankrollData);
      setBetAllocations(mockAllocations);
      setRiskMetrics(mockRiskMetrics);
    } catch (error) {
      console.error('Failed to load bankroll data:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log('✅ Refresh button clicked - functionality working!');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);

    console.log('✅ Refresh completed - async functionality working!');
  };

  const getChangeIcon = (changeType: string) => {
    if (changeType === 'positive') return <ChevronUp className='w-4 h-4 text-green-400' />;
    if (changeType === 'negative') return <ChevronDown className='w-4 h-4 text-red-400' />;
    return null;
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

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.6) return 'text-green-400';
    if (sentiment > 0.4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSentimentBg = (sentiment: number) => {
    if (sentiment > 0.6) return 'bg-green-500/20';
    if (sentiment > 0.4) return 'bg-yellow-500/20';
    return 'bg-red-500/20';
  };

  const getExecutionStatusColor = (status: string) => {
    switch (status) {
      case 'placed':
        return 'text-green-400 border-green-400';
      case 'pending':
        return 'text-yellow-400 border-yellow-400';
      case 'failed':
        return 'text-red-400 border-red-400';
      case 'cancelled':
        return 'text-gray-400 border-gray-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const getSafetyStatusColor = (status: string) => {
    switch (status) {
      case 'safe':
        return 'text-green-400 border-green-400';
      case 'warning':
        return 'text-yellow-400 border-yellow-400';
      case 'critical':
        return 'text-red-400 border-red-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const getConditionText = (rule: AutoBetRule) => {
    const { condition } = rule;
    const typeText = {
      confidence: 'Confidence',
      odds: 'Odds',
      value: 'Expected Value',
      composite: 'Composite Score',
    }[condition.type];

    return `${typeText} ${condition.operator} ${condition.threshold}${condition.type === 'confidence' || condition.type === 'composite' ? '%' : ''}`;
  };

  const toggleAutoPilotRule = (ruleId: string) => {
    setAutoPilotRules(prev =>
      prev.map(rule => (rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule))
    );
  };

  const getBankrollRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-400 border-green-400';
      case 'medium':
        return 'text-yellow-400 border-yellow-400';
      case 'high':
        return 'text-red-400 border-red-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak > 0) return 'text-green-400';
    if (streak < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'conservative':
        return 'text-green-400 border-green-400';
      case 'moderate':
        return 'text-yellow-400 border-yellow-400';
      case 'aggressive':
        return 'text-red-400 border-red-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  return (
    <Layout
      title='Command Center'
      subtitle='Platform Overview & Performance Metrics'
      headerActions={
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 rounded-lg text-white font-medium transition-all disabled:opacity-50'
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      }
    >
      {/* Key Metrics Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {keyMetrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className='group relative overflow-hidden'
          >
            <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 hover:border-slate-600/50 transition-all'>
              {/* Background Gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-5 group-hover:opacity-10 transition-opacity`}
              />

              <div className='relative flex items-start justify-between'>
                <div className='flex-1'>
                  <p className='text-gray-400 text-sm font-medium'>{metric.title}</p>
                  <p className='text-2xl font-bold text-white mt-1'>{metric.value}</p>
                  <div className='flex items-center space-x-1 mt-2'>
                    {getChangeIcon(metric.changeType)}
                    <span
                      className={`text-sm font-medium ${
                        metric.changeType === 'positive'
                          ? 'text-green-400'
                          : metric.changeType === 'negative'
                            ? 'text-red-400'
                            : 'text-gray-400'
                      }`}
                    >
                      {metric.change}
                    </span>
                    <span className='text-xs text-gray-500'>this week</span>
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>{metric.description}</p>
                </div>
                <div
                  className={`p-3 rounded-lg bg-gradient-to-br ${metric.gradient} bg-opacity-20`}
                >
                  {metric.icon}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Live Opportunities & ML Models */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Live Opportunities */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-white'>Live Opportunities</h3>
              <p className='text-gray-400 text-sm'>Real-time betting recommendations</p>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-3 h-3 bg-green-400 rounded-full animate-pulse'></div>
              <span className='text-green-400 text-sm font-medium'>Live</span>
            </div>
          </div>

          <div className='space-y-4'>
            {liveOpportunities.map(opportunity => (
              <div
                key={opportunity.id}
                className='bg-slate-900/30 border border-slate-700/30 rounded-lg p-4 hover:border-cyan-500/30 transition-all'
              >
                <div className='flex items-center justify-between mb-2'>
                  <div className='font-medium text-white'>{opportunity.game}</div>
                  <div className='text-cyan-400 font-bold'>+{opportunity.roi}% ROI</div>
                </div>
                <div className='text-sm text-gray-300 mb-2'>{opportunity.type}</div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-400'>
                    Stake: ${opportunity.stake.toLocaleString()} • Profit: +$
                    {opportunity.expectedProfit}
                  </span>
                  <span className='text-green-400 font-medium'>
                    {opportunity.confidence}% confidence
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ML Model Performance */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-white'>ML Model Performance</h3>
              <p className='text-gray-400 text-sm'>47+ active machine learning models</p>
            </div>
            <div className='flex items-center space-x-2'>
              <Cpu className='w-5 h-5 text-purple-400' />
              <span className='text-purple-400 text-sm font-medium'>Ensemble</span>
            </div>
          </div>

          <div className='space-y-4'>
            {mlModelStats.map((model, index) => (
              <motion.div
                key={model.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className='bg-slate-900/30 border border-slate-700/30 rounded-lg p-4'
              >
                <div className='flex items-center justify-between mb-2'>
                  <div className='font-medium text-white'>{model.name}</div>
                  <div className='flex items-center space-x-2'>
                    <span className='text-green-400 text-sm font-medium'>{model.accuracy}</span>
                    <div className='w-2 h-2 bg-green-400 rounded-full'></div>
                  </div>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-400'>Weight: {model.weight}</span>
                  <span className='text-purple-400'>Active</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* What-If Simulation Engine */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>What-If Simulation Engine</h3>
            <p className='text-gray-400 text-sm'>Test scenarios and optimize strategies</p>
          </div>
          <Calculator className='w-6 h-6 text-purple-400' />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-400 mb-2'>
                Scenario Settings
              </label>
              <div className='space-y-3'>
                <div className='flex items-center justify-between bg-slate-900/50 rounded-lg p-3'>
                  <span className='text-white'>Bankroll Size</span>
                  <select className='bg-slate-700 text-white rounded px-2 py-1 text-sm'>
                    <option>$10,000</option>
                    <option>$25,000</option>
                    <option>$50,000</option>
                    <option>$100,000</option>
                  </select>
                </div>
                <div className='flex items-center justify-between bg-slate-900/50 rounded-lg p-3'>
                  <span className='text-white'>Risk Level</span>
                  <select className='bg-slate-700 text-white rounded px-2 py-1 text-sm'>
                    <option>Conservative</option>
                    <option>Moderate</option>
                    <option>Aggressive</option>
                  </select>
                </div>
                <div className='flex items-center justify-between bg-slate-900/50 rounded-lg p-3'>
                  <span className='text-white'>Time Horizon</span>
                  <select className='bg-slate-700 text-white rounded px-2 py-1 text-sm'>
                    <option>1 Week</option>
                    <option>1 Month</option>
                    <option>3 Months</option>
                    <option>1 Year</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-400 mb-2'>
                Simulation Results
              </label>
              <div className='space-y-3'>
                <div className='bg-slate-900/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-gray-400 text-sm'>Expected Return</span>
                    <span className='text-green-400 font-bold'>+24.7%</span>
                  </div>
                  <div className='w-full bg-slate-700 rounded-full h-2'>
                    <div
                      className='bg-gradient-to-r from-green-400 to-cyan-400 h-2 rounded-full'
                      style={{ width: '75%' }}
                    ></div>
                  </div>
                </div>
                <div className='bg-slate-900/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-gray-400 text-sm'>Win Probability</span>
                    <span className='text-cyan-400 font-bold'>78.3%</span>
                  </div>
                  <div className='w-full bg-slate-700 rounded-full h-2'>
                    <div
                      className='bg-gradient-to-r from-cyan-400 to-purple-400 h-2 rounded-full'
                      style={{ width: '78%' }}
                    ></div>
                  </div>
                </div>
                <div className='bg-slate-900/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-gray-400 text-sm'>Max Drawdown</span>
                    <span className='text-yellow-400 font-bold'>-5.2%</span>
                  </div>
                  <div className='w-full bg-slate-700 rounded-full h-2'>
                    <div
                      className='bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full'
                      style={{ width: '25%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='mt-6 flex space-x-3'>
          <button className='flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all'>
            Run Simulation
          </button>
          <button className='px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors'>
            Export Results
          </button>
        </div>
      </motion.div>

      {/* Live Portfolio Optimization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Live Portfolio Optimization</h3>
            <p className='text-gray-400 text-sm'>AI-powered real-time portfolio adjustments</p>
          </div>
          <Brain className='w-6 h-6 text-cyan-400' />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Current Allocation</h4>
            <div className='space-y-2'>
              {[
                { category: 'NBA Props', allocation: 35, change: '+2%' },
                { category: 'NFL Spreads', allocation: 25, change: '-1%' },
                { category: 'Arbitrage', allocation: 20, change: '+3%' },
                { category: 'Live Betting', allocation: 15, change: '0%' },
                { category: 'Cash', allocation: 5, change: '-4%' },
              ].map((item, index) => (
                <div key={index} className='flex items-center justify-between'>
                  <span className='text-gray-300 text-sm'>{item.category}</span>
                  <div className='flex items-center space-x-2'>
                    <span className='text-white font-medium'>{item.allocation}%</span>
                    <span
                      className={`text-xs ${
                        item.change.startsWith('+')
                          ? 'text-green-400'
                          : item.change.startsWith('-')
                            ? 'text-red-400'
                            : 'text-gray-400'
                      }`}
                    >
                      {item.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>AI Recommendations</h4>
            <div className='space-y-2'>
              {[
                { action: 'Increase NBA Props', confidence: 92, impact: '+3.2%' },
                { action: 'Reduce NFL Exposure', confidence: 87, impact: '-1.8%' },
                { action: 'Add MLB Arbitrage', confidence: 85, impact: '+2.1%' },
              ].map((rec, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-2'>
                  <div className='flex items-center justify-between mb-1'>
                    <span className='text-white text-sm font-medium'>{rec.action}</span>
                    <span className='text-cyan-400 text-xs'>{rec.confidence}%</span>
                  </div>
                  <div className='text-green-400 text-xs'>{rec.impact} impact</div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Risk Metrics</h4>
            <div className='space-y-3'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-400'>1.47</div>
                <div className='text-xs text-gray-400'>Sharpe Ratio</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-yellow-400'>2.3%</div>
                <div className='text-xs text-gray-400'>VaR (95%)</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-purple-400'>0.89</div>
                <div className='text-xs text-gray-400'>Beta</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
      >
        <h3 className='text-xl font-bold text-white mb-4'>System Status</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='text-center'>
            <div className='w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3'>
              <Activity className='w-8 h-8 text-green-400' />
            </div>
            <div className='text-2xl font-bold text-green-400'>100%</div>
            <div className='text-sm text-gray-400'>System Uptime</div>
          </div>
          <div className='text-center'>
            <div className='w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3'>
              <Clock className='w-8 h-8 text-cyan-400' />
            </div>
            <div className='text-2xl font-bold text-cyan-400'>1.2s</div>
            <div className='text-sm text-gray-400'>Avg Response Time</div>
          </div>
          <div className='text-center'>
            <div className='w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3'>
              <Target className='w-8 h-8 text-purple-400' />
            </div>
            <div className='text-2xl font-bold text-purple-400'>47</div>
            <div className='text-sm text-gray-400'>Active Models</div>
          </div>
        </div>
      </motion.div>

      {/* Strategy Automation Engine */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Strategy Automation Engine</h3>
            <p className='text-gray-400 text-sm'>
              Automated strategy execution with adaptive risk management
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <div className='w-3 h-3 bg-yellow-400 rounded-full animate-pulse'></div>
            <span className='text-yellow-400 text-sm font-medium'>Auto-Trading</span>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Active Strategies</h4>
            <div className='space-y-3'>
              {[
                {
                  name: 'Momentum Arbitrage',
                  status: 'Running',
                  trades: 23,
                  pnl: '+$2,847',
                  winRate: 89.1,
                  active: true,
                },
                {
                  name: 'Value Line Hunter',
                  status: 'Running',
                  trades: 18,
                  pnl: '+$1,923',
                  winRate: 83.3,
                  active: true,
                },
                {
                  name: 'Correlation Fade',
                  status: 'Paused',
                  trades: 7,
                  pnl: '+$456',
                  winRate: 71.4,
                  active: false,
                },
                {
                  name: 'Live Betting Edge',
                  status: 'Running',
                  trades: 31,
                  pnl: '+$3,122',
                  winRate: 87.1,
                  active: true,
                },
              ].map((strategy, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <div className='flex items-center space-x-2'>
                      <div
                        className={`w-2 h-2 rounded-full ${strategy.active ? 'bg-green-400' : 'bg-gray-400'}`}
                      ></div>
                      <span className='text-white font-medium text-sm'>{strategy.name}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        strategy.status === 'Running'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {strategy.status}
                    </span>
                  </div>
                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    <div className='text-gray-400'>
                      Trades: <span className='text-white'>{strategy.trades}</span>
                    </div>
                    <div className='text-gray-400'>
                      P&L: <span className='text-green-400'>{strategy.pnl}</span>
                    </div>
                    <div className='text-gray-400'>
                      Win Rate: <span className='text-cyan-400'>{strategy.winRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Risk Controls</h4>
            <div className='space-y-3'>
              {[
                {
                  control: 'Max Position Size',
                  current: '$2,500',
                  limit: '$5,000',
                  status: 'Safe',
                },
                { control: 'Daily Drawdown', current: '-1.2%', limit: '-5%', status: 'Safe' },
                { control: 'Correlation Limit', current: '0.23', limit: '0.40', status: 'Safe' },
                { control: 'Volatility Filter', current: '18.4%', limit: '25%', status: 'Safe' },
              ].map((control, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-white font-medium text-sm'>{control.control}</span>
                    <span className='text-green-400 text-xs'>{control.status}</span>
                  </div>
                  <div className='flex items-center justify-between text-xs'>
                    <span className='text-gray-400'>
                      Current: <span className='text-white'>{control.current}</span>
                    </span>
                    <span className='text-gray-400'>
                      Limit: <span className='text-red-400'>{control.limit}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Performance Metrics</h4>
            <div className='space-y-3'>
              <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                <div className='text-2xl font-bold text-green-400 mb-1'>+18.7%</div>
                <div className='text-xs text-gray-400'>Total Return (MTD)</div>
              </div>
              <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                <div className='text-2xl font-bold text-cyan-400 mb-1'>2.34</div>
                <div className='text-xs text-gray-400'>Sharpe Ratio</div>
              </div>
              <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                <div className='text-2xl font-bold text-purple-400 mb-1'>-3.2%</div>
                <div className='text-xs text-gray-400'>Max Drawdown</div>
              </div>
              <div className='space-y-2'>
                {[
                  { metric: 'Win Rate', value: '84.2%' },
                  { metric: 'Avg Trade', value: '+$247' },
                  { metric: 'Profit Factor', value: '2.86' },
                ].map((item, index) => (
                  <div key={index} className='flex items-center justify-between text-xs'>
                    <span className='text-gray-400'>{item.metric}</span>
                    <span className='text-white font-medium'>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Portfolio Intelligence Hub */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Portfolio Intelligence Hub</h3>
            <p className='text-gray-400 text-sm'>
              AI-driven portfolio optimization and rebalancing recommendations
            </p>
          </div>
          <Brain className='w-6 h-6 text-purple-400' />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-lg font-medium text-white mb-4'>Optimization Signals</h4>
            <div className='space-y-3'>
              {[
                {
                  signal: 'Rebalance NBA Exposure',
                  priority: 'HIGH',
                  action: 'Reduce by 5%',
                  reason: 'Season ending, volatility increasing',
                  impact: '+2.3% expected return',
                  confidence: 91,
                },
                {
                  signal: 'Increase Arbitrage Allocation',
                  priority: 'MEDIUM',
                  action: 'Add $2,500',
                  reason: 'Market inefficiencies detected',
                  impact: '+1.8% expected return',
                  confidence: 87,
                },
                {
                  signal: 'Diversify Sport Exposure',
                  priority: 'LOW',
                  action: 'Add NHL props',
                  reason: 'Low correlation to current holdings',
                  impact: '+0.9% risk reduction',
                  confidence: 73,
                },
              ].map((signal, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-white font-medium text-sm'>{signal.signal}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        signal.priority === 'HIGH'
                          ? 'bg-red-500/20 text-red-400'
                          : signal.priority === 'MEDIUM'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {signal.priority}
                    </span>
                  </div>
                  <div className='text-cyan-400 text-sm mb-2'>{signal.action}</div>
                  <div className='text-gray-400 text-xs mb-2'>{signal.reason}</div>
                  <div className='flex items-center justify-between'>
                    <span className='text-green-400 text-xs'>{signal.impact}</span>
                    <span className='text-purple-400 text-xs'>{signal.confidence}% confidence</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-lg font-medium text-white mb-4'>Smart Alerts</h4>
            <div className='space-y-3'>
              {[
                {
                  type: 'Market Opportunity',
                  message: 'Lakers-Warriors line movement creating arbitrage',
                  timestamp: '2 minutes ago',
                  severity: 'info',
                  action: 'Execute arbitrage strategy',
                },
                {
                  type: 'Risk Warning',
                  message: 'Correlation spike detected in NBA props',
                  timestamp: '5 minutes ago',
                  severity: 'warning',
                  action: 'Reduce position sizing',
                },
                {
                  type: 'Performance Alert',
                  message: 'Value strategy outperforming by 15%',
                  timestamp: '12 minutes ago',
                  severity: 'success',
                  action: 'Consider increasing allocation',
                },
                {
                  type: 'System Update',
                  message: 'New ML model deployed successfully',
                  timestamp: '1 hour ago',
                  severity: 'info',
                  action: 'Review model performance',
                },
              ].map((alert, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span
                      className={`text-sm font-medium ${
                        alert.severity === 'success'
                          ? 'text-green-400'
                          : alert.severity === 'warning'
                            ? 'text-yellow-400'
                            : alert.severity === 'error'
                              ? 'text-red-400'
                              : 'text-cyan-400'
                      }`}
                    >
                      {alert.type}
                    </span>
                    <span className='text-gray-400 text-xs'>{alert.timestamp}</span>
                  </div>
                  <div className='text-white text-sm mb-2'>{alert.message}</div>
                  <div className='text-purple-400 text-xs'>{alert.action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Advanced Betting Analytics Hub */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Advanced Betting Analytics Hub</h3>
            <p className='text-gray-400 text-sm'>
              Real-time betting metrics with opportunity tracking and risk analysis
            </p>
          </div>
          <BarChart3 className='w-6 h-6 text-cyan-400' />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            <div className='text-2xl font-bold text-green-400 mb-1'>47</div>
            <div className='text-sm text-gray-400'>Active Bets</div>
            <div className='text-xs text-green-300 mt-1'>+12 today</div>
          </div>
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            <div className='text-2xl font-bold text-purple-400 mb-1'>2.47</div>
            <div className='text-sm text-gray-400'>Avg Odds</div>
            <div className='text-xs text-purple-300 mt-1'>optimal range</div>
          </div>
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            <div className='text-2xl font-bold text-yellow-400 mb-1'>$347</div>
            <div className='text-sm text-gray-400'>Avg Stake</div>
            <div className='text-xs text-yellow-300 mt-1'>Kelly sized</div>
          </div>
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            <div className='text-2xl font-bold text-cyan-400 mb-1'>$1,247</div>
            <div className='text-sm text-gray-400'>Best Win</div>
            <div className='text-xs text-cyan-300 mt-1'>this month</div>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Live Opportunities</h4>
            <div className='space-y-3'>
              {[
                {
                  id: 'opp-001',
                  sport: 'NBA',
                  game: 'Lakers vs Warriors',
                  market: 'LeBron Over 25.5 Pts',
                  odds: 1.87,
                  value: 8.4,
                  confidence: 89.7,
                  stake: 420,
                  bookmaker: 'DraftKings',
                },
                {
                  id: 'opp-002',
                  sport: 'NFL',
                  game: 'Chiefs vs Bills',
                  market: 'Under 47.5 Total',
                  odds: 1.95,
                  value: 6.2,
                  confidence: 84.3,
                  stake: 315,
                  bookmaker: 'FanDuel',
                },
                {
                  id: 'opp-003',
                  sport: 'NBA',
                  game: 'Celtics vs Heat',
                  market: 'Tatum Over 27.5 Pts',
                  odds: 2.1,
                  value: 12.1,
                  confidence: 92.4,
                  stake: 525,
                  bookmaker: 'BetMGM',
                },
              ].map((opp, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-white font-medium text-sm'>{opp.sport}</span>
                    <span className='text-green-400 text-sm'>+{opp.value}% value</span>
                  </div>
                  <div className='text-gray-300 text-sm mb-2'>{opp.market}</div>
                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    <div className='text-gray-400'>
                      Odds: <span className='text-white'>{opp.odds}</span>
                    </div>
                    <div className='text-gray-400'>
                      Confidence: <span className='text-cyan-400'>{opp.confidence}%</span>
                    </div>
                    <div className='text-gray-400'>
                      Stake: <span className='text-yellow-400'>${opp.stake}</span>
                    </div>
                    <div className='text-gray-400'>
                      Book: <span className='text-purple-400'>{opp.bookmaker}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Recent Performance</h4>
            <div className='space-y-3'>
              {[
                { period: 'Last 24 Hours', profit: '+$847', bets: 23, winRate: 87.0 },
                { period: 'Last 7 Days', profit: '+$3,120', bets: 89, winRate: 84.3 },
                { period: 'Last 30 Days', profit: '+$8,420', bets: 247, winRate: 81.8 },
              ].map((period, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='text-white font-medium text-sm mb-2'>{period.period}</div>
                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    <div className='text-gray-400'>
                      Profit: <span className='text-green-400'>{period.profit}</span>
                    </div>
                    <div className='text-gray-400'>
                      Bets: <span className='text-white'>{period.bets}</span>
                    </div>
                    <div className='text-gray-400'>
                      Win Rate: <span className='text-cyan-400'>{period.winRate}%</span>
                    </div>
                  </div>
                </div>
              ))}

              <div className='bg-slate-800/50 rounded-lg p-3'>
                <div className='text-center'>
                  <div className='text-lg font-bold text-purple-400 mb-1'>$124,830</div>
                  <div className='text-sm text-gray-400'>Total Bankroll</div>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Risk Monitoring</h4>
            <div className='space-y-3'>
              {[
                {
                  metric: 'Portfolio Heat',
                  current: '23%',
                  limit: '25%',
                  status: 'Safe',
                  color: 'text-green-400',
                },
                {
                  metric: 'Daily Exposure',
                  current: '$4,720',
                  limit: '$5,000',
                  status: 'Safe',
                  color: 'text-green-400',
                },
                {
                  metric: 'Correlation Risk',
                  current: '0.31',
                  limit: '0.40',
                  status: 'Warning',
                  color: 'text-yellow-400',
                },
                {
                  metric: 'Volatility Index',
                  current: '18.7%',
                  limit: '20%',
                  status: 'Safe',
                  color: 'text-green-400',
                },
              ].map((risk, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-white font-medium text-sm'>{risk.metric}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        risk.status === 'Safe'
                          ? 'bg-green-500/20 text-green-400'
                          : risk.status === 'Warning'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {risk.status}
                    </span>
                  </div>
                  <div className='flex items-center justify-between text-xs'>
                    <span className='text-gray-400'>
                      Current: <span className={risk.color}>{risk.current}</span>
                    </span>
                    <span className='text-gray-400'>
                      Limit: <span className='text-red-400'>{risk.limit}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Strategy Composition Engine */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Strategy Composition Engine</h3>
            <p className='text-gray-400 text-sm'>
              Multi-strategy coordination with dependency management and performance evaluation
            </p>
          </div>
          <Brain className='w-6 h-6 text-purple-400' />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-lg font-medium text-white mb-4'>Strategy Pipeline</h4>
            <div className='space-y-3'>
              {[
                {
                  id: 'strat-001',
                  name: 'Value Line Hunter',
                  version: 'v2.1',
                  priority: 1,
                  dependencies: ['market-analysis', 'line-tracking'],
                  status: 'Active',
                  confidence: 94.2,
                  accuracy: 87.8,
                  reliability: 92.1,
                },
                {
                  id: 'strat-002',
                  name: 'Arbitrage Scanner',
                  version: 'v1.8',
                  priority: 2,
                  dependencies: ['cross-book', 'real-time'],
                  status: 'Active',
                  confidence: 89.7,
                  accuracy: 95.3,
                  reliability: 88.4,
                },
                {
                  id: 'strat-003',
                  name: 'Live Betting Edge',
                  version: 'v3.0',
                  priority: 3,
                  dependencies: ['momentum-tracking', 'live-feed'],
                  status: 'Evaluating',
                  confidence: 91.5,
                  accuracy: 83.2,
                  reliability: 89.7,
                },
              ].map((strategy, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <div>
                      <span className='text-white font-medium text-sm'>{strategy.name}</span>
                      <span className='text-gray-400 text-xs ml-2'>{strategy.version}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        strategy.status === 'Active'
                          ? 'bg-green-500/20 text-green-400'
                          : strategy.status === 'Evaluating'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {strategy.status}
                    </span>
                  </div>
                  <div className='text-xs text-gray-400 mb-2'>
                    Dependencies: {strategy.dependencies.join(', ')}
                  </div>
                  <div className='grid grid-cols-3 gap-2 text-xs'>
                    <div className='text-gray-400'>
                      Conf: <span className='text-cyan-400'>{strategy.confidence}%</span>
                    </div>
                    <div className='text-gray-400'>
                      Acc: <span className='text-green-400'>{strategy.accuracy}%</span>
                    </div>
                    <div className='text-gray-400'>
                      Rel: <span className='text-purple-400'>{strategy.reliability}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-lg font-medium text-white mb-4'>Evaluation Results</h4>
            <div className='space-y-3'>
              {[
                {
                  resultId: 'eval-001',
                  strategy: 'Value Line Hunter',
                  timestamp: '2 minutes ago',
                  duration: 234,
                  confidence: 92.4,
                  accuracy: 89.7,
                  reliability: 91.2,
                  performance: 94.8,
                },
                {
                  resultId: 'eval-002',
                  strategy: 'Arbitrage Scanner',
                  timestamp: '5 minutes ago',
                  duration: 187,
                  confidence: 88.9,
                  accuracy: 95.1,
                  reliability: 87.6,
                  performance: 92.3,
                },
                {
                  resultId: 'eval-003',
                  strategy: 'Live Betting Edge',
                  timestamp: '8 minutes ago',
                  duration: 312,
                  confidence: 94.1,
                  accuracy: 85.7,
                  reliability: 90.4,
                  performance: 88.9,
                },
              ].map((result, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-white font-medium text-sm'>{result.strategy}</span>
                    <span className='text-gray-400 text-xs'>{result.timestamp}</span>
                  </div>
                  <div className='text-xs text-gray-400 mb-2'>Duration: {result.duration}ms</div>
                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    <div className='text-gray-400'>
                      Confidence: <span className='text-cyan-400'>{result.confidence}%</span>
                    </div>
                    <div className='text-gray-400'>
                      Accuracy: <span className='text-green-400'>{result.accuracy}%</span>
                    </div>
                    <div className='text-gray-400'>
                      Reliability: <span className='text-purple-400'>{result.reliability}%</span>
                    </div>
                    <div className='text-gray-400'>
                      Performance: <span className='text-yellow-400'>{result.performance}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Advanced Portfolio Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Advanced Portfolio Analytics</h3>
            <p className='text-gray-400 text-sm'>
              Multi-dimensional portfolio analysis with quantum-enhanced optimization
            </p>
          </div>
          <BarChart3 className='w-6 h-6 text-cyan-400' />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            <div className='text-2xl font-bold text-green-400 mb-1'>$247,830</div>
            <div className='text-sm text-gray-400'>Total Portfolio</div>
            <div className='text-xs text-green-300 mt-1'>+18.7% YTD</div>
          </div>
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            <div className='text-2xl font-bold text-purple-400 mb-1'>0.23</div>
            <div className='text-sm text-gray-400'>Portfolio Beta</div>
            <div className='text-xs text-purple-300 mt-1'>Low correlation</div>
          </div>
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            <div className='text-2xl font-bold text-cyan-400 mb-1'>2.89</div>
            <div className='text-sm text-gray-400'>Sharpe Ratio</div>
            <div className='text-xs text-cyan-300 mt-1'>Risk-adjusted</div>
          </div>
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            <div className='text-2xl font-bold text-yellow-400 mb-1'>$3,420</div>
            <div className='text-sm text-gray-400'>Max Drawdown</div>
            <div className='text-xs text-yellow-300 mt-1'>-1.4% of portfolio</div>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>
              Asset Allocation Optimization
            </h4>
            <div className='space-y-3'>
              {[
                {
                  asset: 'NBA Player Props',
                  current: 35,
                  optimal: 38,
                  variance: 2.1,
                  expectedReturn: 24.7,
                  recommendation: 'Increase by 3%',
                },
                {
                  asset: 'NFL Spreads',
                  current: 25,
                  optimal: 22,
                  variance: 3.8,
                  expectedReturn: 18.9,
                  recommendation: 'Reduce by 3%',
                },
                {
                  asset: 'Arbitrage Positions',
                  current: 20,
                  optimal: 24,
                  variance: 1.2,
                  expectedReturn: 12.4,
                  recommendation: 'Increase by 4%',
                },
                {
                  asset: 'Live Betting',
                  current: 15,
                  optimal: 12,
                  variance: 4.7,
                  expectedReturn: 31.2,
                  recommendation: 'Reduce by 3%',
                },
                {
                  asset: 'Cash Reserve',
                  current: 5,
                  optimal: 4,
                  variance: 0.0,
                  expectedReturn: 2.1,
                  recommendation: 'Deploy 1%',
                },
              ].map((asset, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-white font-medium text-sm'>{asset.asset}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        asset.current < asset.optimal
                          ? 'bg-green-500/20 text-green-400'
                          : asset.current > asset.optimal
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {asset.current}% → {asset.optimal}%
                    </span>
                  </div>
                  <div className='grid grid-cols-2 gap-2 text-xs mb-2'>
                    <div className='text-gray-400'>
                      Return: <span className='text-green-400'>{asset.expectedReturn}%</span>
                    </div>
                    <div className='text-gray-400'>
                      Variance: <span className='text-purple-400'>{asset.variance}%</span>
                    </div>
                  </div>
                  <div className='text-cyan-400 text-xs'>{asset.recommendation}</div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Risk Decomposition Analysis</h4>
            <div className='space-y-3'>
              {[
                {
                  factor: 'Market Risk',
                  contribution: 0.234,
                  percentage: 34.7,
                  type: 'Systematic',
                  mitigation: 'Diversification across sports',
                },
                {
                  factor: 'Model Risk',
                  contribution: 0.187,
                  percentage: 27.8,
                  type: 'Systematic',
                  mitigation: 'Ensemble approach',
                },
                {
                  factor: 'Liquidity Risk',
                  contribution: 0.142,
                  percentage: 21.1,
                  type: 'Idiosyncratic',
                  mitigation: 'Limit position sizes',
                },
                {
                  factor: 'Concentration Risk',
                  contribution: 0.089,
                  percentage: 13.2,
                  type: 'Idiosyncratic',
                  mitigation: 'Correlation limits',
                },
                {
                  factor: 'Operational Risk',
                  contribution: 0.022,
                  percentage: 3.2,
                  type: 'Idiosyncratic',
                  mitigation: 'System redundancy',
                },
              ].map((risk, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-white font-medium text-sm'>{risk.factor}</span>
                    <span className='text-red-400 text-sm'>{risk.percentage.toFixed(1)}%</span>
                  </div>
                  <div className='w-full bg-slate-700 rounded-full h-2 mb-2'>
                    <div
                      className='h-2 bg-red-400 rounded-full'
                      style={{ width: `${risk.percentage}%` }}
                    />
                  </div>
                  <div className='text-xs text-gray-400 mb-1'>{risk.type} Risk</div>
                  <div className='text-xs text-cyan-400'>{risk.mitigation}</div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-400 mb-3'>Performance Attribution</h4>
            <div className='space-y-3'>
              {[
                {
                  source: 'Asset Selection',
                  contribution: 8.47,
                  benchmark: 5.23,
                  alpha: 3.24,
                  description: 'Superior prop identification',
                },
                {
                  source: 'Timing',
                  contribution: 4.29,
                  benchmark: 2.18,
                  alpha: 2.11,
                  description: 'Market entry optimization',
                },
                {
                  source: 'Risk Management',
                  contribution: 3.67,
                  benchmark: -1.84,
                  alpha: 5.51,
                  description: 'Downside protection',
                },
                {
                  source: 'Diversification',
                  contribution: 2.23,
                  benchmark: 0.89,
                  alpha: 1.34,
                  description: 'Cross-sport correlation',
                },
              ].map((attribution, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='text-white font-medium text-sm mb-2'>{attribution.source}</div>
                  <div className='grid grid-cols-2 gap-2 text-xs mb-2'>
                    <div className='text-gray-400'>
                      Return: <span className='text-green-400'>{attribution.contribution}%</span>
                    </div>
                    <div className='text-gray-400'>
                      Benchmark: <span className='text-white'>{attribution.benchmark}%</span>
                    </div>
                    <div className='text-gray-400'>
                      Alpha: <span className='text-purple-400'>{attribution.alpha}%</span>
                    </div>
                  </div>
                  <div className='text-cyan-400 text-xs'>{attribution.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quantum Trading Engine */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Quantum Trading Engine</h3>
            <p className='text-gray-400 text-sm'>
              Quantum-enhanced execution with superposition-based order optimization
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <div className='w-3 h-3 bg-purple-400 rounded-full animate-pulse'></div>
            <span className='text-purple-400 text-sm font-medium'>Quantum Trading</span>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-lg font-medium text-white mb-4'>Quantum Execution States</h4>
            <div className='space-y-3'>
              {[
                {
                  order: 'Lakers -2.5 Spread',
                  states: 'Superposition: 8 execution paths',
                  optimalPath: 'Path 3: DraftKings @ 1.91',
                  probability: 'Execution probability: 94.7%',
                  slippage: 'Expected slippage: 0.03%',
                  timing: 'Optimal window: 47s',
                },
                {
                  order: 'LeBron Over 25.5 Points',
                  states: 'Superposition: 12 execution paths',
                  optimalPath: 'Path 7: FanDuel @ 1.87',
                  probability: 'Execution probability: 89.2%',
                  slippage: 'Expected slippage: 0.07%',
                  timing: 'Optimal window: 23s',
                },
                {
                  order: 'Warriors Team Total Over',
                  states: 'Superposition: 6 execution paths',
                  optimalPath: 'Path 2: BetMGM @ 1.95',
                  probability: 'Execution probability: 91.8%',
                  slippage: 'Expected slippage: 0.05%',
                  timing: 'Optimal window: 67s',
                },
              ].map((execution, index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='text-white font-medium text-sm mb-2'>{execution.order}</div>
                  <div className='space-y-1 text-xs'>
                    <div className='text-purple-400'>{execution.states}</div>
                    <div className='text-cyan-400'>{execution.optimalPath}</div>
                    <div className='text-green-400'>{execution.probability}</div>
                    <div className='text-yellow-400'>{execution.slippage}</div>
                    <div className='text-gray-400'>{execution.timing}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-lg font-medium text-white mb-4'>Execution Performance</h4>
            <div className='space-y-3'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                  <div className='text-2xl font-bold text-green-400 mb-1'>97.3%</div>
                  <div className='text-xs text-gray-400'>Fill Rate</div>
                </div>
                <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                  <div className='text-2xl font-bold text-cyan-400 mb-1'>0.04%</div>
                  <div className='text-xs text-gray-400'>Avg Slippage</div>
                </div>
                <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                  <div className='text-2xl font-bold text-purple-400 mb-1'>234ms</div>
                  <div className='text-xs text-gray-400'>Avg Execution</div>
                </div>
                <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                  <div className='text-2xl font-bold text-yellow-400 mb-1'>$1,247</div>
                  <div className='text-xs text-gray-400'>Slippage Saved</div>
                </div>
              </div>

              <div className='space-y-2'>
                {[
                  { metric: 'Orders Executed', value: '2,847', period: 'Today' },
                  { metric: 'Quantum Advantage', value: '+12.7%', period: 'vs Classical' },
                  { metric: 'Latency Reduction', value: '-67%', period: 'Path optimization' },
                  { metric: 'Cost Savings', value: '$4,230', period: 'This month' },
                ].map((metric, index) => (
                  <div key={index} className='flex items-center justify-between text-sm'>
                    <span className='text-gray-400'>{metric.metric}</span>
                    <div className='text-right'>
                      <span className='text-white font-medium'>{metric.value}</span>
                      <div className='text-gray-400 text-xs'>{metric.period}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Social Intelligence Hub */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.7 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white flex items-center gap-2'>
              <MessageSquare className='w-6 h-6 text-blue-400' />
              Social Intelligence Hub
            </h3>
            <p className='text-gray-400 text-sm'>
              Real-time sentiment analysis and social media insights
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <div
              className={`w-3 h-3 rounded-full ${isAnalyzing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}
            ></div>
            <span
              className={`text-sm font-medium ${isAnalyzing ? 'text-yellow-400' : 'text-green-400'}`}
            >
              {isAnalyzing ? 'Analyzing' : 'Live'}
            </span>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Sentiment Overview */}
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-lg font-medium text-white mb-4'>Sentiment Overview</h4>
            <div className='space-y-3'>
              {Object.entries(sentimentData).map(([game, data], index) => (
                <div key={index} className='bg-slate-800/50 rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-3'>
                    <h5 className='font-bold text-white text-sm'>{game}</h5>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${getSentimentBg(data.overall)} ${getSentimentColor(data.overall)}`}
                    >
                      {data.trend.toUpperCase()}
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-2 text-xs mb-3'>
                    <div>
                      <span className='text-gray-400'>Overall:</span>
                      <div className={`font-bold ${getSentimentColor(data.overall)}`}>
                        {(data.overall * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <span className='text-gray-400'>Volume:</span>
                      <div className='text-white font-bold'>{data.volume.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className='text-gray-400'>Confidence:</span>
                      <div className='text-cyan-400 font-bold'>
                        {(data.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <span className='text-gray-400'>Positive:</span>
                      <div className='text-green-400 font-bold'>
                        {(data.positive * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  <div className='space-y-1'>
                    <div className='flex justify-between text-xs'>
                      <span className='text-green-400'>Positive</span>
                      <span className='text-green-400'>{(data.positive * 100).toFixed(0)}%</span>
                    </div>
                    <div className='w-full bg-gray-700 rounded-full h-1'>
                      <div
                        className='bg-green-400 h-1 rounded-full'
                        style={{ width: `${data.positive * 100}%` }}
                      />
                    </div>

                    <div className='flex justify-between text-xs'>
                      <span className='text-yellow-400'>Neutral</span>
                      <span className='text-yellow-400'>{(data.neutral * 100).toFixed(0)}%</span>
                    </div>
                    <div className='w-full bg-gray-700 rounded-full h-1'>
                      <div
                        className='bg-yellow-400 h-1 rounded-full'
                        style={{ width: `${data.neutral * 100}%` }}
                      />
                    </div>

                    <div className='flex justify-between text-xs'>
                      <span className='text-red-400'>Negative</span>
                      <span className='text-red-400'>{(data.negative * 100).toFixed(0)}%</span>
                    </div>
                    <div className='w-full bg-gray-700 rounded-full h-1'>
                      <div
                        className='bg-red-400 h-1 rounded-full'
                        style={{ width: `${data.negative * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Social Posts */}
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-lg font-medium text-white mb-4'>Recent Social Activity</h4>
            <div className='space-y-3 max-h-96 overflow-y-auto'>
              {recentPosts.map((post, index) => (
                <div
                  key={post.id}
                  className='bg-slate-800/50 rounded-lg p-3 border border-slate-700/30'
                >
                  <div className='flex items-start justify-between mb-2'>
                    <div className='flex items-center gap-2'>
                      {getPlatformIcon(post.platform)}
                      <span className='text-gray-400 text-xs font-medium'>{post.author}</span>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${getSentimentBg(post.sentiment)} ${getSentimentColor(post.sentiment)}`}
                    >
                      {(post.sentiment * 100).toFixed(0)}%
                    </div>
                  </div>

                  <p className='text-white text-sm mb-3 line-clamp-3'>{post.content}</p>

                  <div className='flex items-center justify-between text-xs text-gray-400'>
                    <div className='flex items-center gap-3'>
                      <div className='flex items-center gap-1'>
                        <Heart className='w-3 h-3' />
                        <span>{post.engagement.likes}</span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Share2 className='w-3 h-3' />
                        <span>{post.engagement.shares}</span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <MessageSquare className='w-3 h-3' />
                        <span>{post.engagement.comments}</span>
                      </div>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Eye className='w-3 h-3' />
                      <span>Influence: {(post.influence * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {post.keywords.length > 0 && (
                    <div className='mt-2 flex flex-wrap gap-1'>
                      {post.keywords.slice(0, 3).map((keyword, i) => (
                        <span
                          key={i}
                          className='px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded'
                        >
                          #{keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Influencer Insights & Trending Topics */}
          <div className='space-y-4'>
            {/* Top Influencers */}
            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-lg font-medium text-white mb-4'>Top Influencers</h4>
              <div className='space-y-3'>
                {influencers.slice(0, 3).map((influencer, index) => (
                  <div key={influencer.id} className='bg-slate-800/50 rounded-lg p-3'>
                    <div className='flex items-start justify-between mb-2'>
                      <div>
                        <h5 className='font-bold text-white text-sm'>{influencer.name}</h5>
                        <p className='text-gray-400 text-xs'>
                          {influencer.platform} • {(influencer.followers / 1000).toFixed(0)}K
                          followers
                        </p>
                      </div>
                      <div className='text-right'>
                        <div className='text-green-400 font-bold text-sm'>
                          {(influencer.accuracy * 100).toFixed(0)}%
                        </div>
                        <div className='text-xs text-gray-400'>Accuracy</div>
                      </div>
                    </div>

                    <div className='space-y-1'>
                      {influencer.recentPicks.slice(0, 2).map((pick, i) => (
                        <div key={i} className='text-xs'>
                          <div className='flex justify-between'>
                            <span className='text-gray-400'>{pick.game}</span>
                            <span
                              className={`font-medium ${
                                pick.outcome === 'won'
                                  ? 'text-green-400'
                                  : pick.outcome === 'lost'
                                    ? 'text-red-400'
                                    : 'text-yellow-400'
                              }`}
                            >
                              {pick.outcome?.toUpperCase() || 'PENDING'}
                            </span>
                          </div>
                          <div className='text-white'>{pick.pick}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Topics */}
            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-lg font-medium text-white mb-4'>Trending Topics</h4>
              <div className='space-y-2'>
                {trendingTopics.slice(0, 4).map((topic, index) => (
                  <div key={topic.id} className='bg-slate-800/50 rounded-lg p-3'>
                    <div className='flex items-start justify-between mb-1'>
                      <h5 className='font-bold text-white text-sm'>{topic.keyword}</h5>
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          topic.impact === 'high'
                            ? 'bg-red-500/20 text-red-400'
                            : topic.impact === 'medium'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {topic.impact.toUpperCase()}
                      </div>
                    </div>

                    <div className='grid grid-cols-2 gap-2 text-xs'>
                      <div>
                        <span className='text-gray-400'>Volume:</span>
                        <div className='text-white font-bold'>{topic.volume}</div>
                      </div>
                      <div>
                        <span className='text-gray-400'>Growth:</span>
                        <div className='text-cyan-400 font-bold'>
                          +{(topic.growth * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    <div className='mt-2'>
                      <div className={`flex justify-between text-xs mb-1`}>
                        <span className='text-gray-400'>Sentiment</span>
                        <span className={`font-bold ${getSentimentColor(topic.sentiment)}`}>
                          {topic.sentiment > 0 ? '+' : ''}
                          {(topic.sentiment * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className='w-full bg-gray-700 rounded-full h-1'>
                        <div
                          className={`h-1 rounded-full ${topic.sentiment > 0 ? 'bg-green-400' : 'bg-red-400'}`}
                          style={{ width: `${Math.abs(topic.sentiment) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AutoPilot Engine */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.9 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white flex items-center gap-2'>
              <Zap className='w-6 h-6 text-purple-400' />
              AutoPilot Engine
            </h3>
            <p className='text-gray-400 text-sm'>Automated betting rules and execution engine</p>
          </div>
          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-2'>
              <div
                className={`w-3 h-3 rounded-full ${isGlobalAutoPilotActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}
              ></div>
              <span
                className={`text-sm font-medium ${isGlobalAutoPilotActive ? 'text-green-400' : 'text-gray-400'}`}
              >
                {isGlobalAutoPilotActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <Button
              onClick={() => setIsGlobalAutoPilotActive(!isGlobalAutoPilotActive)}
              className={`${
                isGlobalAutoPilotActive
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
              }`}
            >
              {isGlobalAutoPilotActive ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>

        {/* AutoPilot Stats */}
        {autoPilotStats && (
          <div className='bg-slate-900/50 rounded-lg p-4 mb-6'>
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-purple-400'>
                  {autoPilotStats.rulesActive}
                </div>
                <div className='text-sm text-gray-400'>Active Rules</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-blue-400'>{autoPilotStats.betsToday}</div>
                <div className='text-sm text-gray-400'>Bets Today</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-cyan-400'>
                  ${autoPilotStats.totalStaked}
                </div>
                <div className='text-sm text-gray-400'>Total Staked</div>
              </div>
              <div className='text-center'>
                <div
                  className={`text-2xl font-bold ${autoPilotStats.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {autoPilotStats.profitLoss >= 0 ? '+' : ''}${autoPilotStats.profitLoss}
                </div>
                <div className='text-sm text-gray-400'>P&L Today</div>
              </div>
            </div>

            <div className='mt-4 flex items-center justify-between text-sm'>
              <div className='text-gray-400'>
                Win Rate:{' '}
                <span className='text-green-400 font-bold'>{autoPilotStats.winRate}%</span>
              </div>
              <div className='text-gray-400'>
                Last Executed: <span className='text-white'>{autoPilotStats.lastExecuted}</span>
              </div>
              <div className='text-gray-400'>
                Safety Status:{' '}
                <span
                  className={`font-bold ${getSafetyStatusColor(autoPilotStats.safetyStatus).split(' ')[0]}`}
                >
                  {autoPilotStats.safetyStatus.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Active Rules */}
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-lg font-medium text-white mb-4'>Betting Rules</h4>
            <div className='space-y-3'>
              {autoPilotRules.map((rule, index) => (
                <div
                  key={rule.id}
                  className='bg-slate-800/50 rounded-lg p-3 border border-slate-700/30'
                >
                  <div className='flex items-start justify-between mb-2'>
                    <div>
                      <h5 className='font-bold text-white text-sm'>{rule.name}</h5>
                      <p className='text-gray-400 text-xs'>
                        {rule.sport} • {rule.action.betType}
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant='outline'
                        className={
                          rule.isActive
                            ? 'text-green-400 border-green-400'
                            : 'text-gray-400 border-gray-400'
                        }
                      >
                        {rule.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => toggleAutoPilotRule(rule.id)}
                        className='text-xs'
                      >
                        Toggle
                      </Button>
                    </div>
                  </div>

                  <div className='text-xs space-y-1'>
                    <div className='text-gray-400'>
                      Condition: <span className='text-white'>{getConditionText(rule)}</span>
                    </div>
                    <div className='text-gray-400'>
                      Stake:{' '}
                      <span className='text-cyan-400'>
                        {rule.action.amount}% {rule.action.stakeType}
                      </span>
                    </div>
                    <div className='text-gray-400'>
                      Max Daily:{' '}
                      <span className='text-yellow-400'>${rule.safetyLimits.maxDailyStake}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Executions */}
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-lg font-medium text-white mb-4'>Recent Executions</h4>
            <div className='space-y-3 max-h-96 overflow-y-auto'>
              {autoPilotExecutions.slice(0, 6).map((execution, index) => (
                <div
                  key={execution.id}
                  className='bg-slate-800/50 rounded-lg p-3 border border-slate-700/30'
                >
                  <div className='flex items-start justify-between mb-2'>
                    <div>
                      <h5 className='font-bold text-white text-sm'>{execution.game}</h5>
                      <p className='text-gray-400 text-xs'>
                        {execution.betType} • ${execution.stake}
                      </p>
                    </div>
                    <Badge
                      variant='outline'
                      className={`text-xs ${getExecutionStatusColor(execution.status)}`}
                    >
                      {execution.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className='grid grid-cols-2 gap-2 text-xs mb-2'>
                    <div>
                      <span className='text-gray-400'>Odds:</span>
                      <div className='text-white font-bold'>{execution.odds}</div>
                    </div>
                    <div>
                      <span className='text-gray-400'>Confidence:</span>
                      <div className='text-green-400 font-bold'>
                        {execution.confidence.toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  <div className='text-xs text-gray-400'>
                    {execution.timestamp} • Rule:{' '}
                    {autoPilotRules.find(r => r.id === execution.ruleId)?.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bankroll Management Hub */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.1 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mt-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white flex items-center gap-2'>
              <DollarSign className='w-6 h-6 text-green-400' />
              Bankroll Management Hub
            </h3>
            <p className='text-gray-400 text-sm'>
              Advanced portfolio management and Kelly criterion optimization
            </p>
          </div>
          <div className='flex items-center space-x-4'>
            <select
              aria-label='Select option description for this element'
              value={riskLevel}
              onChange={e => setRiskLevel(e.target.value as any)}
              className='px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm'
            >
              <option value='conservative'>Conservative</option>
              <option value='moderate'>Moderate</option>
              <option value='aggressive'>Aggressive</option>
            </select>
            <Badge variant='outline' className={getRiskLevelColor(riskLevel)}>
              {riskLevel.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Bankroll Overview */}
        {bankrollData && (
          <div className='bg-slate-900/50 rounded-lg p-4 mb-6'>
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-400'>
                  ${bankrollData.currentBalance.toLocaleString()}
                </div>
                <div className='text-sm text-gray-400'>Current Balance</div>
              </div>
              <div className='text-center'>
                <div
                  className={`text-2xl font-bold ${bankrollData.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {bankrollData.totalProfit >= 0 ? '+' : ''}$
                  {bankrollData.totalProfit.toLocaleString()}
                </div>
                <div className='text-sm text-gray-400'>Total Profit</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-blue-400'>
                  {bankrollData.roi.toFixed(1)}%
                </div>
                <div className='text-sm text-gray-400'>ROI</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-purple-400'>
                  {bankrollData.sharpeRatio.toFixed(2)}
                </div>
                <div className='text-sm text-gray-400'>Sharpe Ratio</div>
              </div>
            </div>

            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm'>
              <div className='text-center'>
                <div className='text-cyan-400 font-bold'>{bankrollData.winRate.toFixed(1)}%</div>
                <div className='text-gray-400'>Win Rate</div>
              </div>
              <div className='text-center'>
                <div className='text-yellow-400 font-bold'>
                  {bankrollData.maxDrawdown.toFixed(1)}%
                </div>
                <div className='text-gray-400'>Max Drawdown</div>
              </div>
              <div className='text-center'>
                <div
                  className={`font-bold ${getStreakColor(bankrollData.streakData.currentStreak)}`}
                >
                  {bankrollData.streakData.currentStreak >= 0 ? '+' : ''}
                  {bankrollData.streakData.currentStreak}
                </div>
                <div className='text-gray-400'>Current Streak</div>
              </div>
              <div className='text-center'>
                <div className='text-gray-400'>Total Wagered:</div>
                <div className='text-white font-bold'>
                  ${bankrollData.totalWagered.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Bet Allocations */}
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <h4 className='text-lg font-medium text-white mb-4'>Smart Bet Allocation</h4>
            <div className='space-y-3'>
              <div className='flex items-center justify-between text-sm mb-3'>
                <span className='text-gray-400'>Kelly Fraction:</span>
                <div className='flex items-center gap-2'>
                  <input
                    type='range'
                    min='0.1'
                    max='1.0'
                    step='0.05'
                    value={kellyFraction}
                    onChange={e => setKellyFraction(parseFloat(e.target.value))}
                    className='w-20'
                  />
                  <span className='text-cyan-400 font-bold'>{kellyFraction.toFixed(2)}</span>
                </div>
              </div>

              {betAllocations.map((allocation, index) => (
                <div
                  key={allocation.id}
                  className='bg-slate-800/50 rounded-lg p-3 border border-slate-700/30'
                >
                  <div className='flex items-start justify-between mb-2'>
                    <div>
                      <h5 className='font-bold text-white text-sm'>{allocation.game}</h5>
                      <p className='text-gray-400 text-xs'>{allocation.type}</p>
                    </div>
                    <Badge variant='outline' className={getBankrollRiskColor(allocation.risk)}>
                      {allocation.risk.toUpperCase()}
                    </Badge>
                  </div>

                  <div className='grid grid-cols-2 gap-3 text-xs mb-2'>
                    <div>
                      <span className='text-gray-400'>Confidence:</span>
                      <div className='text-green-400 font-bold'>
                        {allocation.confidence.toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <span className='text-gray-400'>Kelly %:</span>
                      <div className='text-cyan-400 font-bold'>
                        {allocation.kellyPercent.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <span className='text-gray-400'>Recommended:</span>
                      <div className='text-yellow-400 font-bold'>
                        ${allocation.recommendedStake.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <span className='text-gray-400'>Expected Value:</span>
                      <div className='text-purple-400 font-bold'>
                        {allocation.expectedValue.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className='mt-2'>
                    <div className='flex justify-between text-xs mb-1'>
                      <span className='text-gray-400'>Kelly Allocation</span>
                      <span className='text-cyan-400'>{allocation.kellyPercent.toFixed(2)}%</span>
                    </div>
                    <div className='w-full bg-gray-700 rounded-full h-2'>
                      <div
                        className='bg-cyan-400 h-2 rounded-full'
                        style={{ width: `${Math.min(allocation.kellyPercent * 20, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Metrics */}
          <div className='space-y-4'>
            {/* Risk Overview */}
            <div className='bg-slate-900/50 rounded-lg p-4'>
              <h4 className='text-lg font-medium text-white mb-4'>Risk Metrics</h4>

              {riskMetrics && (
                <div className='space-y-3'>
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                      <div className='text-lg font-bold text-red-400'>
                        {riskMetrics.maxBetSize}%
                      </div>
                      <div className='text-xs text-gray-400'>Max Bet Size</div>
                    </div>
                    <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                      <div className='text-lg font-bold text-green-400'>
                        {riskMetrics.diversificationScore.toFixed(0)}
                      </div>
                      <div className='text-xs text-gray-400'>Diversification</div>
                    </div>
                    <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                      <div className='text-lg font-bold text-yellow-400'>
                        {riskMetrics.volatility.toFixed(1)}%
                      </div>
                      <div className='text-xs text-gray-400'>Volatility</div>
                    </div>
                    <div className='bg-slate-800/50 rounded-lg p-3 text-center'>
                      <div className='text-lg font-bold text-purple-400'>
                        {riskMetrics.valueAtRisk.toFixed(1)}%
                      </div>
                      <div className='text-xs text-gray-400'>Value at Risk</div>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-400'>Risk Level</span>
                      <Badge variant='outline' className={getRiskLevelColor(riskMetrics.riskLevel)}>
                        {riskMetrics.riskLevel.toUpperCase()}
                      </Badge>
                    </div>

                    <div>
                      <div className='flex justify-between text-xs mb-1'>
                        <span className='text-gray-400'>Portfolio Diversification</span>
                        <span className='text-green-400'>
                          {riskMetrics.diversificationScore.toFixed(0)}%
                        </span>
                      </div>
                      <div className='w-full bg-gray-700 rounded-full h-2'>
                        <div
                          className='bg-green-400 h-2 rounded-full'
                          style={{ width: `${riskMetrics.diversificationScore}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className='flex justify-between text-xs mb-1'>
                        <span className='text-gray-400'>Volatility Risk</span>
                        <span className='text-yellow-400'>
                          {riskMetrics.volatility.toFixed(1)}%
                        </span>
                      </div>
                      <div className='w-full bg-gray-700 rounded-full h-2'>
                        <div
                          className='bg-yellow-400 h-2 rounded-full'
                          style={{ width: `${Math.min(riskMetrics.volatility * 2, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Streak Analysis */}
            {bankrollData && (
              <div className='bg-slate-900/50 rounded-lg p-4'>
                <h4 className='text-lg font-medium text-white mb-4'>Performance Streaks</h4>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-400 text-sm'>Current Streak:</span>
                    <div
                      className={`font-bold ${getStreakColor(bankrollData.streakData.currentStreak)}`}
                    >
                      {bankrollData.streakData.currentStreak >= 0 ? '+' : ''}
                      {bankrollData.streakData.currentStreak}
                      <span className='text-xs ml-1'>
                        {bankrollData.streakData.currentStreak >= 0 ? 'wins' : 'losses'}
                      </span>
                    </div>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-gray-400 text-sm'>Best Win Streak:</span>
                    <div className='text-green-400 font-bold'>
                      +{bankrollData.streakData.longestWinStreak} wins
                    </div>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-gray-400 text-sm'>Longest Loss Streak:</span>
                    <div className='text-red-400 font-bold'>
                      -{bankrollData.streakData.longestLossStreak} losses
                    </div>
                  </div>

                  <div className='mt-3 p-3 bg-slate-800/50 rounded-lg'>
                    <h5 className='text-sm font-bold text-white mb-2'>Bankroll Recommendation</h5>
                    <p className='text-xs text-gray-400'>
                      {bankrollData.streakData.currentStreak >= 3
                        ? 'Strong winning streak detected. Consider maintaining current bet sizing.'
                        : bankrollData.streakData.currentStreak <= -2
                          ? 'Recent losses detected. Consider reducing bet sizes temporarily.'
                          : 'Normal variance detected. Continue with Kelly-optimized sizing.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Dashboard;
