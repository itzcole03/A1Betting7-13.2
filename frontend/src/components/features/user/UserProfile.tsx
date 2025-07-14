import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Settings,
  Bell,
  Shield,
  CreditCard,
  Activity,
  TrendingUp,
  Target,
  Award,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Percent,
  BarChart3,
  LineChart,
  PieChart,
  Zap,
  Lock,
  Smartphone,
  Globe,
  Clock,
  Star,
  Trophy,
  Crown,
} from 'lucide-react';
import { Layout } from '../../core/Layout';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  phone: string;
  location: string;
  timezone: string;
  language: string;
  bio: string;
  createdAt: Date;
  lastLogin: Date;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  subscription: {
    plan: 'free' | 'pro' | 'elite';
    status: 'active' | 'expired' | 'cancelled';
    expiresAt: Date;
    autoRenew: boolean;
    paymentMethod: string;
    features: string[];
  };
  preferences: {
    theme: 'dark' | 'light' | 'auto';
    notifications: boolean;
    marketing: boolean;
    analytics: boolean;
  };
}

interface UserStats {
  totalBets: number;
  winRate: number;
  profit: number;
  roi: number;
  avgBetSize: number;
  totalVolume: number;
  biggestWin: number;
  longestStreak: number;
  favoriteLeague: string;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
}

interface ActivityData {
  date: string;
  bets: number;
  profit: number;
  winRate: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress?: number;
  total?: number;
}

const UserProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadUserProfile(),
        loadUserStats(),
        loadActivityData(),
        loadAchievements(),
      ]);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockProfile: UserProfile = {
      id: 'user-001',
      username: 'pro_bettor_2024',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      avatar: 'https://via.placeholder.com/150',
      phone: '+1 (555) 123-4567',
      location: 'New York, NY',
      timezone: 'America/New_York',
      language: 'en',
      bio: 'Professional sports bettor with 5+ years of experience. Specializing in NBA props and NFL spreads.',
      createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
      emailVerified: true,
      phoneVerified: true,
      twoFactorEnabled: true,
      subscription: {
        plan: 'pro',
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        paymentMethod: '**** 4567',
        features: ['Advanced Analytics', 'API Access', 'Priority Support', 'Real-time Alerts'],
      },
      preferences: {
        theme: 'dark',
        notifications: true,
        marketing: false,
        analytics: true,
      },
    };

    setUserProfile(mockProfile);
  };

  const loadUserStats = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockStats: UserStats = {
      totalBets: 1247,
      winRate: 67.3,
      profit: 8420.5,
      roi: 23.7,
      avgBetSize: 127.45,
      totalVolume: 158934.5,
      biggestWin: 2847.3,
      longestStreak: 12,
      favoriteLeague: 'NBA',
      riskProfile: 'moderate',
    };

    setUserStats(mockStats);
  };

  const loadActivityData = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));

    const mockActivity: ActivityData[] = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      bets: Math.floor(Math.random() * 20) + 1,
      profit: (Math.random() - 0.4) * 500,
      winRate: Math.random() * 40 + 40,
    }));

    setActivityData(mockActivity);
  };

  const loadAchievements = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 400));

    const mockAchievements: Achievement[] = [
      {
        id: 'first-win',
        name: 'First Win',
        description: 'Win your first bet',
        icon: '🎯',
        unlockedAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
        rarity: 'common',
      },
      {
        id: 'hot-streak',
        name: 'Hot Streak',
        description: 'Win 10 bets in a row',
        icon: '🔥',
        unlockedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        rarity: 'rare',
      },
      {
        id: 'big-winner',
        name: 'Big Winner',
        description: 'Win a bet worth $1000+',
        icon: '💰',
        unlockedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        rarity: 'epic',
      },
      {
        id: 'master-predictor',
        name: 'Master Predictor',
        description: 'Achieve 80% win rate over 100 bets',
        icon: '🏆',
        unlockedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        rarity: 'legendary',
      },
      {
        id: 'volume-trader',
        name: 'Volume Trader',
        description: 'Place 1000 bets',
        icon: '📈',
        unlockedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        rarity: 'epic',
        progress: 1247,
        total: 1000,
      },
    ];

    setAchievements(mockAchievements);
  };

  const saveProfile = async () => {
    setIsLoading(true);
    setSaveStatus('saving');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSaveStatus('saved');
      setIsEditing(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'text-gray-400 border-gray-400/20 bg-gray-400/10';
      case 'rare':
        return 'text-blue-400 border-blue-400/20 bg-blue-400/10';
      case 'epic':
        return 'text-purple-400 border-purple-400/20 bg-purple-400/10';
      case 'legendary':
        return 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10';
      default:
        return 'text-gray-400 border-gray-400/20 bg-gray-400/10';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'elite':
        return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'pro':
        return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      case 'free':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  const renderOverview = () => (
    <div className='space-y-6'>
      {/* Profile Header */}
      <motion.div
        className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0'>
          <div className='flex items-center space-x-6'>
            <div className='relative'>
              <div className='w-24 h-24 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center'>
                <User className='w-12 h-12 text-white' />
              </div>
              {userProfile?.subscription.plan === 'elite' && (
                <div className='absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1'>
                  <Crown className='w-4 h-4 text-white' />
                </div>
              )}
            </div>
            <div>
              <div className='flex items-center space-x-3 mb-2'>
                <h2 className='text-2xl font-bold text-white'>
                  {userProfile?.firstName} {userProfile?.lastName}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getPlanColor(userProfile?.subscription.plan || '')}`}
                >
                  {userProfile?.subscription.plan?.toUpperCase()}
                </span>
              </div>
              <p className='text-gray-400 mb-1'>@{userProfile?.username}</p>
              <div className='flex items-center space-x-4 text-sm text-gray-400'>
                <div className='flex items-center space-x-1'>
                  <MapPin className='w-4 h-4' />
                  <span>{userProfile?.location}</span>
                </div>
                <div className='flex items-center space-x-1'>
                  <Calendar className='w-4 h-4' />
                  <span>Joined {userProfile?.createdAt.toLocaleDateString()}</span>
                </div>
                <div className='flex items-center space-x-1'>
                  <Clock className='w-4 h-4' />
                  <span>Last active {userProfile?.lastLogin.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
          <div className='flex items-center space-x-3'>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className='bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors flex items-center space-x-2'
            >
              <Edit className='w-4 h-4' />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {userProfile?.bio && (
          <div className='mt-4 pt-4 border-t border-slate-700/50'>
            <p className='text-gray-300'>{userProfile.bio}</p>
          </div>
        )}
      </motion.div>

      {/* Quick Stats */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <motion.div
          className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>Total Bets</p>
              <p className='text-3xl font-bold text-white'>
                {userStats?.totalBets.toLocaleString()}
              </p>
              <p className='text-green-400 text-sm mt-1'>This month: +47</p>
            </div>
            <div className='bg-blue-500/10 p-3 rounded-lg'>
              <Target className='w-6 h-6 text-blue-400' />
            </div>
          </div>
        </motion.div>

        <motion.div
          className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>Win Rate</p>
              <p className='text-3xl font-bold text-white'>{userStats?.winRate}%</p>
              <p className='text-green-400 text-sm mt-1'>+2.3% this month</p>
            </div>
            <div className='bg-green-500/10 p-3 rounded-lg'>
              <Percent className='w-6 h-6 text-green-400' />
            </div>
          </div>
        </motion.div>

        <motion.div
          className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>Total Profit</p>
              <p className='text-3xl font-bold text-green-400'>
                ${userStats?.profit.toLocaleString()}
              </p>
              <p className='text-green-400 text-sm mt-1'>+$1,247 this month</p>
            </div>
            <div className='bg-green-500/10 p-3 rounded-lg'>
              <DollarSign className='w-6 h-6 text-green-400' />
            </div>
          </div>
        </motion.div>

        <motion.div
          className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>ROI</p>
              <p className='text-3xl font-bold text-cyan-400'>{userStats?.roi}%</p>
              <p className='text-green-400 text-sm mt-1'>+4.2% this month</p>
            </div>
            <div className='bg-cyan-500/10 p-3 rounded-lg'>
              <TrendingUp className='w-6 h-6 text-cyan-400' />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Account Status */}
      <motion.div
        className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className='text-xl font-bold text-white mb-6'>Account Status</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='space-y-3'>
            <h4 className='text-white font-medium'>Verification Status</h4>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <Mail className='w-4 h-4 text-gray-400' />
                  <span className='text-gray-300'>Email</span>
                </div>
                {userProfile?.emailVerified ? (
                  <CheckCircle className='w-4 h-4 text-green-400' />
                ) : (
                  <AlertTriangle className='w-4 h-4 text-yellow-400' />
                )}
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <Phone className='w-4 h-4 text-gray-400' />
                  <span className='text-gray-300'>Phone</span>
                </div>
                {userProfile?.phoneVerified ? (
                  <CheckCircle className='w-4 h-4 text-green-400' />
                ) : (
                  <AlertTriangle className='w-4 h-4 text-yellow-400' />
                )}
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <Shield className='w-4 h-4 text-gray-400' />
                  <span className='text-gray-300'>2FA</span>
                </div>
                {userProfile?.twoFactorEnabled ? (
                  <CheckCircle className='w-4 h-4 text-green-400' />
                ) : (
                  <AlertTriangle className='w-4 h-4 text-yellow-400' />
                )}
              </div>
            </div>
          </div>

          <div className='space-y-3'>
            <h4 className='text-white font-medium'>Subscription</h4>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-gray-300'>Plan</span>
                <span className='text-cyan-400 font-medium'>
                  {userProfile?.subscription.plan?.toUpperCase()}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-300'>Status</span>
                <span className='text-green-400 font-medium'>
                  {userProfile?.subscription.status}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-300'>Expires</span>
                <span className='text-gray-400'>
                  {userProfile?.subscription.expiresAt.toLocaleDateString()}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-300'>Auto-Renew</span>
                <span
                  className={
                    userProfile?.subscription.autoRenew ? 'text-green-400' : 'text-gray-400'
                  }
                >
                  {userProfile?.subscription.autoRenew ? 'On' : 'Off'}
                </span>
              </div>
            </div>
          </div>

          <div className='space-y-3'>
            <h4 className='text-white font-medium'>Recent Activity</h4>
            <div className='space-y-2 text-sm'>
              <div className='text-gray-300'>
                Last login: {userProfile?.lastLogin.toLocaleString()}
              </div>
              <div className='text-gray-300'>Bets this week: 23</div>
              <div className='text-gray-300'>Profit this week: +$847</div>
              <div className='text-gray-300'>Win rate this week: 73.9%</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderStats = () => (
    <div className='space-y-6'>
      <h3 className='text-2xl font-bold text-white'>Detailed Statistics</h3>

      {/* Performance Metrics */}
      <motion.div
        className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h4 className='text-xl font-bold text-white mb-6'>Performance Metrics</h4>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {[
            {
              label: 'Average Bet Size',
              value: `$${userStats?.avgBetSize.toFixed(2)}`,
              icon: DollarSign,
              color: 'text-cyan-400',
            },
            {
              label: 'Total Volume',
              value: `$${userStats?.totalVolume.toLocaleString()}`,
              icon: BarChart3,
              color: 'text-blue-400',
            },
            {
              label: 'Biggest Win',
              value: `$${userStats?.biggestWin.toFixed(2)}`,
              icon: Trophy,
              color: 'text-yellow-400',
            },
            {
              label: 'Longest Streak',
              value: `${userStats?.longestStreak} wins`,
              icon: Zap,
              color: 'text-purple-400',
            },
            {
              label: 'Favorite League',
              value: userStats?.favoriteLeague || 'NBA',
              icon: Star,
              color: 'text-green-400',
            },
            {
              label: 'Risk Profile',
              value: userStats?.riskProfile || 'Moderate',
              icon: Shield,
              color: 'text-orange-400',
            },
          ].map((metric, index) => (
            <div key={index} className='bg-slate-900/50 rounded-lg p-4'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-gray-400 text-sm'>{metric.label}</span>
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
              </div>
              <div className={`text-xl font-bold ${metric.color}`}>{metric.value}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Monthly Performance Chart */}
      <motion.div
        className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h4 className='text-xl font-bold text-white mb-6'>Monthly Performance</h4>
        <div className='h-64 bg-slate-900/50 rounded-lg flex items-center justify-center'>
          <div className='text-center'>
            <LineChart className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <p className='text-gray-400'>Performance chart will be displayed here</p>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderActivity = () => (
    <div className='space-y-6'>
      <h3 className='text-2xl font-bold text-white'>Activity History</h3>

      <motion.div
        className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h4 className='text-xl font-bold text-white mb-6'>Recent Activity (Last 30 Days)</h4>
        <div className='space-y-4'>
          {activityData.slice(0, 10).map((activity, index) => (
            <div
              key={index}
              className='flex items-center justify-between p-4 bg-slate-900/50 rounded-lg'
            >
              <div className='flex items-center space-x-4'>
                <div className='w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center'>
                  <Calendar className='w-5 h-5 text-white' />
                </div>
                <div>
                  <p className='text-white font-medium'>{activity.date}</p>
                  <p className='text-gray-400 text-sm'>{activity.bets} bets placed</p>
                </div>
              </div>
              <div className='text-right'>
                <p
                  className={`font-medium ${activity.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {activity.profit >= 0 ? '+' : ''}${activity.profit.toFixed(2)}
                </p>
                <p className='text-gray-400 text-sm'>{activity.winRate.toFixed(1)}% win rate</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderAchievements = () => (
    <div className='space-y-6'>
      <h3 className='text-2xl font-bold text-white'>Achievements</h3>

      <motion.div
        className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              className={`p-4 rounded-lg border ${getRarityColor(achievement.rarity)}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className='flex items-center space-x-3 mb-3'>
                <div className='text-2xl'>{achievement.icon}</div>
                <div>
                  <h4 className='text-white font-medium'>{achievement.name}</h4>
                  <p className='text-gray-400 text-sm'>{achievement.description}</p>
                </div>
              </div>
              <div className='flex items-center justify-between text-sm'>
                <span className={`font-medium ${getRarityColor(achievement.rarity).split(' ')[0]}`}>
                  {achievement.rarity.toUpperCase()}
                </span>
                <span className='text-gray-400'>{achievement.unlockedAt.toLocaleDateString()}</span>
              </div>
              {achievement.progress && achievement.total && (
                <div className='mt-3'>
                  <div className='flex justify-between text-xs text-gray-400 mb-1'>
                    <span>Progress</span>
                    <span>
                      {achievement.progress}/{achievement.total}
                    </span>
                  </div>
                  <div className='w-full bg-slate-700 rounded-full h-2'>
                    <div
                      className='h-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full'
                      style={{
                        width: `${Math.min((achievement.progress / achievement.total) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderSettings = () => (
    <div className='space-y-6'>
      <h3 className='text-2xl font-bold text-white'>Account Settings</h3>

      {/* Edit Profile Form */}
      {isEditing && (
        <motion.div
          className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className='flex items-center justify-between mb-6'>
            <h4 className='text-xl font-bold text-white'>Edit Profile</h4>
            <button
              onClick={() => setIsEditing(false)}
              className='text-gray-400 hover:text-white transition-colors'
            >
              <X className='w-5 h-5' />
            </button>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>First Name</label>
              <input
                type='text'
                value={userProfile?.firstName || ''}
                onChange={e =>
                  setUserProfile(prev => (prev ? { ...prev, firstName: e.target.value } : null))
                }
                className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>Last Name</label>
              <input
                type='text'
                value={userProfile?.lastName || ''}
                onChange={e =>
                  setUserProfile(prev => (prev ? { ...prev, lastName: e.target.value } : null))
                }
                className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>Email</label>
              <input
                type='email'
                value={userProfile?.email || ''}
                onChange={e =>
                  setUserProfile(prev => (prev ? { ...prev, email: e.target.value } : null))
                }
                className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>Phone</label>
              <input
                type='tel'
                value={userProfile?.phone || ''}
                onChange={e =>
                  setUserProfile(prev => (prev ? { ...prev, phone: e.target.value } : null))
                }
                className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
              />
            </div>

            <div className='md:col-span-2'>
              <label className='block text-sm font-medium text-gray-300 mb-2'>Bio</label>
              <textarea
                value={userProfile?.bio || ''}
                onChange={e =>
                  setUserProfile(prev => (prev ? { ...prev, bio: e.target.value } : null))
                }
                rows={3}
                className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
              />
            </div>
          </div>

          <div className='flex items-center justify-end space-x-3 mt-6'>
            <button
              onClick={() => setIsEditing(false)}
              className='bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={saveProfile}
              disabled={isLoading}
              className='bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-colors disabled:opacity-50 flex items-center space-x-2'
            >
              {isLoading ? (
                <RefreshCw className='w-4 h-4 animate-spin' />
              ) : (
                <Save className='w-4 h-4' />
              )}
              <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Security Settings */}
      <motion.div
        className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h4 className='text-xl font-bold text-white mb-6'>Security Settings</h4>
        <div className='space-y-4'>
          <div className='flex items-center justify-between p-4 bg-slate-900/50 rounded-lg'>
            <div className='flex items-center space-x-3'>
              <Lock className='w-5 h-5 text-gray-400' />
              <div>
                <p className='text-white font-medium'>Two-Factor Authentication</p>
                <p className='text-gray-400 text-sm'>Add an extra layer of security</p>
              </div>
            </div>
            <button className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm'>
              {userProfile?.twoFactorEnabled ? 'Enabled' : 'Enable'}
            </button>
          </div>

          <div className='flex items-center justify-between p-4 bg-slate-900/50 rounded-lg'>
            <div className='flex items-center space-x-3'>
              <Smartphone className='w-5 h-5 text-gray-400' />
              <div>
                <p className='text-white font-medium'>SMS Verification</p>
                <p className='text-gray-400 text-sm'>Verify your phone number</p>
              </div>
            </div>
            <button className='bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors text-sm'>
              {userProfile?.phoneVerified ? 'Verified' : 'Verify'}
            </button>
          </div>

          <div className='flex items-center justify-between p-4 bg-slate-900/50 rounded-lg'>
            <div className='flex items-center space-x-3'>
              <Eye className='w-5 h-5 text-gray-400' />
              <div>
                <p className='text-white font-medium'>Show Sensitive Data</p>
                <p className='text-gray-400 text-sm'>Display earnings and personal info</p>
              </div>
            </div>
            <button
              onClick={() => setShowSensitiveData(!showSensitiveData)}
              className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                showSensitiveData
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
              }`}
            >
              {showSensitiveData ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderBilling = () => (
    <div className='space-y-6'>
      <h3 className='text-2xl font-bold text-white'>Billing & Subscription</h3>

      <motion.div
        className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h4 className='text-xl font-bold text-white mb-6'>Current Plan</h4>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <div className='flex items-center space-x-3'>
              <div
                className={`p-3 rounded-lg ${getPlanColor(userProfile?.subscription.plan || '')
                  .replace('text-', 'bg-')
                  .replace('bg-', 'bg-')
                  .replace('/10', '/20')}`}
              >
                <Crown
                  className={`w-6 h-6 ${getPlanColor(userProfile?.subscription.plan || '').split(' ')[0]}`}
                />
              </div>
              <div>
                <h5 className='text-white font-medium text-lg'>
                  {userProfile?.subscription.plan?.toUpperCase()} Plan
                </h5>
                <p className='text-gray-400'>Premium features and priority support</p>
              </div>
            </div>

            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Status</span>
                <span className='text-green-400 font-medium'>
                  {userProfile?.subscription.status}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Next billing</span>
                <span className='text-white'>
                  {userProfile?.subscription.expiresAt.toLocaleDateString()}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Auto-renew</span>
                <span
                  className={
                    userProfile?.subscription.autoRenew ? 'text-green-400' : 'text-gray-400'
                  }
                >
                  {userProfile?.subscription.autoRenew ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Payment method</span>
                <span className='text-white'>{userProfile?.subscription.paymentMethod}</span>
              </div>
            </div>
          </div>

          <div className='space-y-4'>
            <h5 className='text-white font-medium'>Included Features</h5>
            <div className='space-y-2'>
              {userProfile?.subscription.features.map((feature, index) => (
                <div key={index} className='flex items-center space-x-2'>
                  <CheckCircle className='w-4 h-4 text-green-400' />
                  <span className='text-gray-300 text-sm'>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='flex items-center space-x-3 mt-6 pt-6 border-t border-slate-700/50'>
          <button className='bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-colors'>
            Upgrade Plan
          </button>
          <button className='bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors'>
            Manage Billing
          </button>
          <button className='bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors'>
            Download Invoice
          </button>
        </div>
      </motion.div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'stats':
        return renderStats();
      case 'activity':
        return renderActivity();
      case 'achievements':
        return renderAchievements();
      case 'settings':
        return renderSettings();
      case 'billing':
        return renderBilling();
      default:
        return renderOverview();
    }
  };

  if (!userProfile) {
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <RefreshCw className='w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4' />
            <p className='text-gray-400'>Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='space-y-8'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-4xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent'>
              User Profile
            </h1>
            <p className='text-gray-400 mt-2'>
              Manage your account settings and view your performance
            </p>
          </div>
          {saveStatus === 'saved' && (
            <div className='bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20'>
              <div className='flex items-center space-x-2'>
                <CheckCircle className='w-4 h-4 text-green-400' />
                <span className='text-green-400 text-sm font-medium'>
                  Changes saved successfully
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className='flex space-x-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 overflow-x-auto'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <tab.icon className='w-4 h-4' />
              <span className='font-medium'>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>
      </div>
    </Layout>
  );
};

export default UserProfile;
