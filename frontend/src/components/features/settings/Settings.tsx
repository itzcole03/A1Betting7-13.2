import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Database,
  Palette,
  Zap,
  DollarSign,
  Brain,
  Eye,
  Clock,
  Globe,
  Key,
  Smartphone,
  Mail,
  Lock,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Save,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronRight,
  Toggle,
} from 'lucide-react';
import { Layout } from '../../core/Layout';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  timezone: string;
  language: string;
  createdAt: Date;
  lastLogin: Date;
  subscription: {
    plan: 'free' | 'pro' | 'elite';
    status: 'active' | 'expired' | 'cancelled';
    expiresAt: Date;
    features: string[];
  };
}

interface NotificationSettings {
  email: {
    newsletters: boolean;
    promotions: boolean;
    alerts: boolean;
    weeklyReports: boolean;
    lineupUpdates: boolean;
    injuryUpdates: boolean;
    weatherAlerts: boolean;
  };
  push: {
    enabled: boolean;
    gameStartReminders: boolean;
    lineupDeadlines: boolean;
    injuryAlerts: boolean;
    arbitrageOpportunities: boolean;
    bigWins: boolean;
  };
  sms: {
    enabled: boolean;
    criticalAlerts: boolean;
    weeklyResults: boolean;
  };
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showStats: boolean;
  showWinnings: boolean;
  dataCollection: boolean;
  analyticsTracking: boolean;
  marketingCommunications: boolean;
  thirdPartySharing: boolean;
}

interface PlatformSettings {
  theme: 'dark' | 'light' | 'auto';
  accentColor: string;
  animations: boolean;
  soundEffects: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  defaultSport: string;
  defaultView: string;
  compactMode: boolean;
  expertMode: boolean;
}

interface BettingSettings {
  defaultBankroll: number;
  maxBetSize: number;
  kellyFraction: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  autoStaking: boolean;
  confirmBets: boolean;
  trackingEnabled: boolean;
  defaultSportsbooks: string[];
  arbitrageThreshold: number;
  minEdge: number;
}

interface APISettings {
  providers: {
    [key: string]: {
      enabled: boolean;
      apiKey: string;
      rateLimit: number;
      priority: number;
    };
  };
  caching: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  retries: {
    enabled: boolean;
    maxAttempts: number;
    delay: number;
  };
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: {
      newsletters: true,
      promotions: false,
      alerts: true,
      weeklyReports: true,
      lineupUpdates: true,
      injuryUpdates: true,
      weatherAlerts: true,
    },
    push: {
      enabled: true,
      gameStartReminders: true,
      lineupDeadlines: true,
      injuryAlerts: true,
      arbitrageOpportunities: true,
      bigWins: true,
    },
    sms: {
      enabled: false,
      criticalAlerts: false,
      weeklyResults: false,
    },
  });
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'private',
    showStats: true,
    showWinnings: false,
    dataCollection: true,
    analyticsTracking: true,
    marketingCommunications: false,
    thirdPartySharing: false,
  });
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    theme: 'dark',
    accentColor: '#06ffa5',
    animations: true,
    soundEffects: false,
    autoRefresh: true,
    refreshInterval: 30,
    defaultSport: 'NFL',
    defaultView: 'dashboard',
    compactMode: false,
    expertMode: true,
  });
  const [bettingSettings, setBettingSettings] = useState<BettingSettings>({
    defaultBankroll: 1000,
    maxBetSize: 50,
    kellyFraction: 0.25,
    riskTolerance: 'moderate',
    autoStaking: false,
    confirmBets: true,
    trackingEnabled: true,
    defaultSportsbooks: ['DraftKings', 'FanDuel'],
    arbitrageThreshold: 2,
    minEdge: 5,
  });
  const [apiSettings, setAPISettings] = useState<APISettings>({
    providers: {
      ESPN: { enabled: true, apiKey: '', rateLimit: 100, priority: 1 },
      SportRadar: { enabled: true, apiKey: '', rateLimit: 50, priority: 2 },
      TheOddsAPI: { enabled: true, apiKey: '', rateLimit: 200, priority: 3 },
    },
    caching: { enabled: true, ttl: 300, maxSize: 100 },
    retries: { enabled: true, maxAttempts: 3, delay: 1000 },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockProfile: UserProfile = {
        id: 'user-001',
        username: 'pro_bettor_2024',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        avatar: 'https://via.placeholder.com/150',
        timezone: 'America/New_York',
        language: 'en',
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
        subscription: {
          plan: 'pro',
          status: 'active',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          features: ['Advanced Analytics', 'API Access', 'Priority Support'],
        },
      };

      setUserProfile(mockProfile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    setSaveStatus('saving');

    try {
      // Simulate API calls to save different settings
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const exportSettings = async () => {
    try {
      const settings = {
        notifications: notificationSettings,
        privacy: privacySettings,
        platform: platformSettings,
        betting: bettingSettings,
        api: apiSettings,
      };

      const dataStr = JSON.stringify(settings, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'a1betting-settings.json';
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export settings:', error);
    }
  };

  const importSettings = async (file: File) => {
    try {
      const text = await file.text();
      const settings = JSON.parse(text);

      if (settings.notifications) setNotificationSettings(settings.notifications);
      if (settings.privacy) setPrivacySettings(settings.privacy);
      if (settings.platform) setPlatformSettings(settings.platform);
      if (settings.betting) setBettingSettings(settings.betting);
      if (settings.api) setAPISettings(settings.api);

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to import settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const baseTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'platform', label: 'Platform', icon: Palette },
    { id: 'betting', label: 'Betting', icon: DollarSign },
    { id: 'api', label: 'API & Data', icon: Database },
  ];

  // Add admin tab only for verified admin users (memoized for performance)
  const tabs = useMemo(() => {
    return checkAdminStatus()
      ? [...baseTabs, { id: 'admin', label: 'Admin Mode', icon: Crown }]
      : baseTabs;
  }, [checkAdminStatus]);

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <RefreshCw className='w-4 h-4 animate-spin' />;
      case 'saved':
        return <CheckCircle className='w-4 h-4 text-green-400' />;
      case 'error':
        return <AlertTriangle className='w-4 h-4 text-red-400' />;
      default:
        return <Save className='w-4 h-4' />;
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Error';
      default:
        return 'Save Changes';
    }
  };

  const ToggleSwitch: React.FC<{
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
  }> = ({ enabled, onChange, disabled = false }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-800 ${
        enabled ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'bg-slate-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className='space-y-6'>
            {userProfile && (
              <>
                <div className='flex items-center space-x-6'>
                  <div className='w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center'>
                    <User className='w-12 h-12 text-white' />
                  </div>
                  <div>
                    <h3 className='text-xl font-bold text-white'>
                      {userProfile.firstName} {userProfile.lastName}
                    </h3>
                    <p className='text-gray-400'>@{userProfile.username}</p>
                    <div className='flex items-center space-x-2 mt-2'>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          userProfile.subscription.plan === 'elite'
                            ? 'bg-purple-500/20 text-purple-400'
                            : userProfile.subscription.plan === 'pro'
                              ? 'bg-cyan-500/20 text-cyan-400'
                              : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {userProfile.subscription.plan.toUpperCase()}
                      </span>
                      <span className='text-xs text-gray-500'>
                        Expires {userProfile.subscription.expiresAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      First Name
                    </label>
                    <input
                      type='text'
                      value={userProfile.firstName}
                      onChange={e =>
                        setUserProfile(prev =>
                          prev ? { ...prev, firstName: e.target.value } : null
                        )
                      }
                      className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Last Name
                    </label>
                    <input
                      type='text'
                      value={userProfile.lastName}
                      onChange={e =>
                        setUserProfile(prev =>
                          prev ? { ...prev, lastName: e.target.value } : null
                        )
                      }
                      className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>Email</label>
                    <input
                      type='email'
                      value={userProfile.email}
                      onChange={e =>
                        setUserProfile(prev => (prev ? { ...prev, email: e.target.value } : null))
                      }
                      className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>Username</label>
                    <input
                      type='text'
                      value={userProfile.username}
                      onChange={e =>
                        setUserProfile(prev =>
                          prev ? { ...prev, username: e.target.value } : null
                        )
                      }
                      className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>Timezone</label>
                    <select
                      value={userProfile.timezone}
                      onChange={e =>
                        setUserProfile(prev =>
                          prev ? { ...prev, timezone: e.target.value } : null
                        )
                      }
                      className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                    >
                      <option value='America/New_York'>Eastern Time</option>
                      <option value='America/Chicago'>Central Time</option>
                      <option value='America/Denver'>Mountain Time</option>
                      <option value='America/Los_Angeles'>Pacific Time</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>Language</label>
                    <select
                      value={userProfile.language}
                      onChange={e =>
                        setUserProfile(prev =>
                          prev ? { ...prev, language: e.target.value } : null
                        )
                      }
                      className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                    >
                      <option value='en'>English</option>
                      <option value='es'>Spanish</option>
                      <option value='fr'>French</option>
                    </select>
                  </div>
                </div>

                <div className='bg-slate-800/50 rounded-lg p-4'>
                  <h4 className='font-medium text-white mb-3'>Subscription Features</h4>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                    {userProfile.subscription.features.map((feature, index) => (
                      <div key={index} className='flex items-center space-x-2'>
                        <CheckCircle className='w-4 h-4 text-green-400' />
                        <span className='text-sm text-gray-300'>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 'notifications':
        return (
          <div className='space-y-8'>
            <div>
              <h3 className='text-lg font-bold text-white mb-4 flex items-center space-x-2'>
                <Mail className='w-5 h-5' />
                <span>Email Notifications</span>
              </h3>
              <div className='space-y-4'>
                {Object.entries(notificationSettings.email).map(([key, value]) => (
                  <div
                    key={key}
                    className='flex items-center justify-between p-3 bg-slate-800/50 rounded-lg'
                  >
                    <div>
                      <span className='text-white font-medium'>
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                      </span>
                      <p className='text-sm text-gray-400'>
                        {key === 'newsletters' && 'Weekly newsletters and product updates'}
                        {key === 'promotions' && 'Special offers and promotional content'}
                        {key === 'alerts' && 'Important platform alerts and notifications'}
                        {key === 'weeklyReports' && 'Weekly performance and analytics reports'}
                        {key === 'lineupUpdates' && 'Daily fantasy lineup recommendations'}
                        {key === 'injuryUpdates' && 'Player injury status changes'}
                        {key === 'weatherAlerts' && 'Weather impact notifications'}
                      </p>
                    </div>
                    <ToggleSwitch
                      enabled={value}
                      onChange={enabled =>
                        setNotificationSettings(prev => ({
                          ...prev,
                          email: { ...prev.email, [key]: enabled },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className='text-lg font-bold text-white mb-4 flex items-center space-x-2'>
                <Smartphone className='w-5 h-5' />
                <span>Push Notifications</span>
              </h3>
              <div className='space-y-4'>
                {Object.entries(notificationSettings.push).map(([key, value]) => (
                  <div
                    key={key}
                    className='flex items-center justify-between p-3 bg-slate-800/50 rounded-lg'
                  >
                    <div>
                      <span className='text-white font-medium'>
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                      </span>
                      <p className='text-sm text-gray-400'>
                        {key === 'enabled' && 'Enable all push notifications'}
                        {key === 'gameStartReminders' && 'Notifications before games start'}
                        {key === 'lineupDeadlines' && 'Reminders for lineup submission deadlines'}
                        {key === 'injuryAlerts' && 'Immediate injury status updates'}
                        {key === 'arbitrageOpportunities' && 'Real-time arbitrage opportunities'}
                        {key === 'bigWins' && 'Notifications for significant wins'}
                      </p>
                    </div>
                    <ToggleSwitch
                      enabled={value}
                      onChange={enabled =>
                        setNotificationSettings(prev => ({
                          ...prev,
                          push: { ...prev.push, [key]: enabled },
                        }))
                      }
                      disabled={key !== 'enabled' && !notificationSettings.push.enabled}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className='space-y-6'>
            <div className='bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4'>
              <div className='flex items-start space-x-3'>
                <Info className='w-5 h-5 text-yellow-400 mt-0.5' />
                <div>
                  <h4 className='font-medium text-yellow-400'>Privacy Notice</h4>
                  <p className='text-sm text-yellow-300/80 mt-1'>
                    Your privacy is important to us. These settings control how your data is
                    collected, used, and shared.
                  </p>
                </div>
              </div>
            </div>

            <div className='space-y-4'>
              {Object.entries(privacySettings).map(([key, value]) => (
                <div
                  key={key}
                  className='flex items-center justify-between p-4 bg-slate-800/50 rounded-lg'
                >
                  <div>
                    <span className='text-white font-medium'>
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    </span>
                    <p className='text-sm text-gray-400 mt-1'>
                      {key === 'profileVisibility' &&
                        'Control who can see your profile information'}
                      {key === 'showStats' && 'Display your betting statistics publicly'}
                      {key === 'showWinnings' && 'Show your winnings and performance metrics'}
                      {key === 'dataCollection' &&
                        'Allow collection of usage data for platform improvement'}
                      {key === 'analyticsTracking' &&
                        'Enable analytics tracking for personalized experience'}
                      {key === 'marketingCommunications' &&
                        'Receive marketing communications from partners'}
                      {key === 'thirdPartySharing' &&
                        'Allow sharing data with trusted third-party services'}
                    </p>
                  </div>
                  {key === 'profileVisibility' ? (
                    <select
                      value={value as string}
                      onChange={e =>
                        setPrivacySettings(prev => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      className='px-3 py-1 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm focus:outline-none focus:border-cyan-400'
                    >
                      <option value='public'>Public</option>
                      <option value='private'>Private</option>
                      <option value='friends'>Friends Only</option>
                    </select>
                  ) : (
                    <ToggleSwitch
                      enabled={value as boolean}
                      onChange={enabled =>
                        setPrivacySettings(prev => ({
                          ...prev,
                          [key]: enabled,
                        }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'platform':
        return (
          <div className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>Theme</label>
                <select
                  value={platformSettings.theme}
                  onChange={e =>
                    setPlatformSettings(prev => ({
                      ...prev,
                      theme: e.target.value as any,
                    }))
                  }
                  className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                >
                  <option value='dark'>Dark</option>
                  <option value='light'>Light</option>
                  <option value='auto'>Auto</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  Default Sport
                </label>
                <select
                  value={platformSettings.defaultSport}
                  onChange={e =>
                    setPlatformSettings(prev => ({
                      ...prev,
                      defaultSport: e.target.value,
                    }))
                  }
                  className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                >
                  <option value='NFL'>NFL</option>
                  <option value='NBA'>NBA</option>
                  <option value='MLB'>MLB</option>
                  <option value='NHL'>NHL</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  Refresh Interval (seconds)
                </label>
                <input
                  type='number'
                  min='10'
                  max='300'
                  value={platformSettings.refreshInterval}
                  onChange={e =>
                    setPlatformSettings(prev => ({
                      ...prev,
                      refreshInterval: parseInt(e.target.value),
                    }))
                  }
                  className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>Accent Color</label>
                <input
                  type='color'
                  value={platformSettings.accentColor}
                  onChange={e =>
                    setPlatformSettings(prev => ({
                      ...prev,
                      accentColor: e.target.value,
                    }))
                  }
                  className='w-full h-10 bg-slate-700/50 border border-slate-600/50 rounded-lg cursor-pointer'
                />
              </div>
            </div>

            <div className='space-y-4'>
              {[
                {
                  key: 'animations',
                  label: 'Enable Animations',
                  desc: 'Smooth transitions and micro-interactions',
                },
                {
                  key: 'soundEffects',
                  label: 'Sound Effects',
                  desc: 'Audio feedback for actions and alerts',
                },
                {
                  key: 'autoRefresh',
                  label: 'Auto Refresh',
                  desc: 'Automatically refresh data at set intervals',
                },
                {
                  key: 'compactMode',
                  label: 'Compact Mode',
                  desc: 'More dense layout with smaller components',
                },
                {
                  key: 'expertMode',
                  label: 'Expert Mode',
                  desc: 'Advanced features and detailed metrics',
                },
              ].map(({ key, label, desc }) => (
                <div
                  key={key}
                  className='flex items-center justify-between p-4 bg-slate-800/50 rounded-lg'
                >
                  <div>
                    <span className='text-white font-medium'>{label}</span>
                    <p className='text-sm text-gray-400 mt-1'>{desc}</p>
                  </div>
                  <ToggleSwitch
                    enabled={platformSettings[key as keyof PlatformSettings] as boolean}
                    onChange={enabled =>
                      setPlatformSettings(prev => ({
                        ...prev,
                        [key]: enabled,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 'betting':
        return (
          <div className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  Default Bankroll ($)
                </label>
                <input
                  type='number'
                  min='0'
                  value={bettingSettings.defaultBankroll}
                  onChange={e =>
                    setBettingSettings(prev => ({
                      ...prev,
                      defaultBankroll: parseFloat(e.target.value),
                    }))
                  }
                  className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  Max Bet Size ($)
                </label>
                <input
                  type='number'
                  min='0'
                  value={bettingSettings.maxBetSize}
                  onChange={e =>
                    setBettingSettings(prev => ({
                      ...prev,
                      maxBetSize: parseFloat(e.target.value),
                    }))
                  }
                  className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  Kelly Fraction
                </label>
                <input
                  type='number'
                  min='0'
                  max='1'
                  step='0.01'
                  value={bettingSettings.kellyFraction}
                  onChange={e =>
                    setBettingSettings(prev => ({
                      ...prev,
                      kellyFraction: parseFloat(e.target.value),
                    }))
                  }
                  className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  Risk Tolerance
                </label>
                <select
                  value={bettingSettings.riskTolerance}
                  onChange={e =>
                    setBettingSettings(prev => ({
                      ...prev,
                      riskTolerance: e.target.value as any,
                    }))
                  }
                  className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                >
                  <option value='conservative'>Conservative</option>
                  <option value='moderate'>Moderate</option>
                  <option value='aggressive'>Aggressive</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  Arbitrage Threshold (%)
                </label>
                <input
                  type='number'
                  min='0'
                  max='50'
                  step='0.1'
                  value={bettingSettings.arbitrageThreshold}
                  onChange={e =>
                    setBettingSettings(prev => ({
                      ...prev,
                      arbitrageThreshold: parseFloat(e.target.value),
                    }))
                  }
                  className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  Minimum Edge (%)
                </label>
                <input
                  type='number'
                  min='0'
                  max='100'
                  step='0.1'
                  value={bettingSettings.minEdge}
                  onChange={e =>
                    setBettingSettings(prev => ({
                      ...prev,
                      minEdge: parseFloat(e.target.value),
                    }))
                  }
                  className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                />
              </div>
            </div>

            <div className='space-y-4'>
              {[
                {
                  key: 'autoStaking',
                  label: 'Auto Staking',
                  desc: 'Automatically calculate bet sizes using Kelly Criterion',
                },
                {
                  key: 'confirmBets',
                  label: 'Confirm Bets',
                  desc: 'Require confirmation before placing bets',
                },
                {
                  key: 'trackingEnabled',
                  label: 'Bet Tracking',
                  desc: 'Track all bets and calculate performance metrics',
                },
              ].map(({ key, label, desc }) => (
                <div
                  key={key}
                  className='flex items-center justify-between p-4 bg-slate-800/50 rounded-lg'
                >
                  <div>
                    <span className='text-white font-medium'>{label}</span>
                    <p className='text-sm text-gray-400 mt-1'>{desc}</p>
                  </div>
                  <ToggleSwitch
                    enabled={bettingSettings[key as keyof BettingSettings] as boolean}
                    onChange={enabled =>
                      setBettingSettings(prev => ({
                        ...prev,
                        [key]: enabled,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 'api':
        return (
          <div className='space-y-6'>
            <div>
              <h3 className='text-lg font-bold text-white mb-4'>API Providers</h3>
              <div className='space-y-4'>
                {Object.entries(apiSettings.providers).map(([provider, settings]) => (
                  <div key={provider} className='p-4 bg-slate-800/50 rounded-lg'>
                    <div className='flex items-center justify-between mb-3'>
                      <span className='font-medium text-white'>{provider}</span>
                      <ToggleSwitch
                        enabled={settings.enabled}
                        onChange={enabled =>
                          setAPISettings(prev => ({
                            ...prev,
                            providers: {
                              ...prev.providers,
                              [provider]: { ...settings, enabled },
                            },
                          }))
                        }
                      />
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                      <div>
                        <label className='block text-xs text-gray-400 mb-1'>API Key</label>
                        <input
                          type='password'
                          value={settings.apiKey}
                          onChange={e =>
                            setAPISettings(prev => ({
                              ...prev,
                              providers: {
                                ...prev.providers,
                                [provider]: { ...settings, apiKey: e.target.value },
                              },
                            }))
                          }
                          placeholder='Enter API key...'
                          className='w-full px-2 py-1 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm focus:outline-none focus:border-cyan-400'
                        />
                      </div>

                      <div>
                        <label className='block text-xs text-gray-400 mb-1'>Rate Limit</label>
                        <input
                          type='number'
                          value={settings.rateLimit}
                          onChange={e =>
                            setAPISettings(prev => ({
                              ...prev,
                              providers: {
                                ...prev.providers,
                                [provider]: { ...settings, rateLimit: parseInt(e.target.value) },
                              },
                            }))
                          }
                          className='w-full px-2 py-1 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm focus:outline-none focus:border-cyan-400'
                        />
                      </div>

                      <div>
                        <label className='block text-xs text-gray-400 mb-1'>Priority</label>
                        <input
                          type='number'
                          value={settings.priority}
                          onChange={e =>
                            setAPISettings(prev => ({
                              ...prev,
                              providers: {
                                ...prev.providers,
                                [provider]: { ...settings, priority: parseInt(e.target.value) },
                              },
                            }))
                          }
                          className='w-full px-2 py-1 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm focus:outline-none focus:border-cyan-400'
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className='text-lg font-bold text-white mb-4'>Caching & Performance</h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    Cache TTL (seconds)
                  </label>
                  <input
                    type='number'
                    value={apiSettings.caching.ttl}
                    onChange={e =>
                      setAPISettings(prev => ({
                        ...prev,
                        caching: { ...prev.caching, ttl: parseInt(e.target.value) },
                      }))
                    }
                    className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    Max Cache Size (MB)
                  </label>
                  <input
                    type='number'
                    value={apiSettings.caching.maxSize}
                    onChange={e =>
                      setAPISettings(prev => ({
                        ...prev,
                        caching: { ...prev.caching, maxSize: parseInt(e.target.value) },
                      }))
                    }
                    className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    Retry Attempts
                  </label>
                  <input
                    type='number'
                    value={apiSettings.retries.maxAttempts}
                    onChange={e =>
                      setAPISettings(prev => ({
                        ...prev,
                        retries: { ...prev.retries, maxAttempts: parseInt(e.target.value) },
                      }))
                    }
                    className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'admin':
        return (
          <div className='space-y-6'>
            <div className='bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/50 rounded-lg p-6'>
              <div className='flex items-start space-x-4'>
                <div className='w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center'>
                  <Crown className='w-6 h-6 text-white' />
                </div>
                <div className='flex-1'>
                  <h3 className='text-xl font-bold text-white mb-2'>Admin Mode Access</h3>
                  <p className='text-gray-300 mb-4'>
                    Admin mode provides access to advanced dashboard features, system controls, and
                    administrative tools. This mode is only available to verified administrators.
                  </p>

                  <div className='flex items-center justify-between p-4 bg-slate-800/50 rounded-lg'>
                    <div>
                      <span className='text-white font-medium'>Enable Admin Dashboard</span>
                      <p className='text-sm text-gray-400 mt-1'>
                        Switch to the comprehensive admin dashboard with full feature access
                      </p>
                    </div>
                    <ToggleSwitch
                      enabled={adminModeEnabled}
                      onChange={enabled => {
                        setAdminModeEnabled(enabled);
                        if (enabled) {
                          // Navigate to admin dashboard
                          window.location.href = '/admin';
                        }
                      }}
                    />
                  </div>

                  <div className='mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg'>
                    <div className='flex items-center space-x-2'>
                      <Info className='w-4 h-4 text-blue-400' />
                      <span className='text-sm text-blue-300 font-medium'>
                        Admin Privileges Active
                      </span>
                    </div>
                    <p className='text-xs text-blue-200/80 mt-1'>
                      You have verified admin access. The admin dashboard includes advanced
                      analytics, system monitoring, user management, and configuration tools.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='p-4 bg-slate-800/50 rounded-lg'>
                <h4 className='font-medium text-white mb-2'>Admin Features</h4>
                <ul className='space-y-2 text-sm text-gray-300'>
                  <li>• Advanced Analytics Dashboard</li>
                  <li>• System Monitoring & Logs</li>
                  <li>• User Management Interface</li>
                  <li>• Configuration Controls</li>
                  <li>• Real-time Data Management</li>
                </ul>
              </div>

              <div className='p-4 bg-slate-800/50 rounded-lg'>
                <h4 className='font-medium text-white mb-2'>Current Status</h4>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between flex-wrap gap-1'>
                    <span className='text-gray-400'>User Role:</span>
                    <span className='text-purple-400 font-medium'>{user?.role || 'admin'}</span>
                  </div>
                  <div className='flex justify-between flex-wrap gap-1'>
                    <span className='text-gray-400'>Admin Access:</span>
                    <span className='text-green-400 font-medium'>Verified</span>
                  </div>
                  <div className='flex justify-between flex-wrap gap-1'>
                    <span className='text-gray-400'>Permissions:</span>
                    <span className='text-cyan-400 font-medium break-all'>
                      {user?.permissions?.join(', ') || 'admin, user'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <Layout
      title='Settings'
      subtitle='Platform Configuration • Account Management • Privacy Controls'
      headerActions={
        <div className='flex items-center space-x-3'>
          <button
            onClick={exportSettings}
            className='flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-white text-sm transition-all'
          >
            <Download className='w-4 h-4' />
            <span>Export</span>
          </button>

          <label className='flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-white text-sm transition-all cursor-pointer'>
            <Upload className='w-4 h-4' />
            <span>Import</span>
            <input
              type='file'
              accept='.json'
              className='hidden'
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) importSettings(file);
              }}
            />
          </label>

          <button
            onClick={saveSettings}
            disabled={isLoading}
            className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 rounded-lg text-white font-medium transition-all disabled:opacity-50'
          >
            {getSaveStatusIcon()}
            <span>{getSaveStatusText()}</span>
          </button>
        </div>
      }
    >
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
        {/* Settings Navigation */}
        <div className='lg:col-span-1'>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
          >
            <h3 className='text-lg font-bold text-white mb-4'>Settings</h3>
            <nav className='space-y-2'>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/50 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <tab.icon className='w-4 h-4' />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && <ChevronRight className='w-4 h-4 ml-auto' />}
                </button>
              ))}
            </nav>
          </motion.div>
        </div>

        {/* Settings Content */}
        <div className='lg:col-span-3'>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
          >
            <div className='flex items-center space-x-3 mb-6'>
              {(() => {
                const currentTab = tabs.find(tab => tab.id === activeTab);
                return currentTab ? <currentTab.icon className='w-6 h-6 text-cyan-400' /> : null;
              })()}
              <h2 className='text-2xl font-bold text-white'>
                {tabs.find(tab => tab.id === activeTab)?.label}
              </h2>
            </div>

            {renderTabContent()}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
