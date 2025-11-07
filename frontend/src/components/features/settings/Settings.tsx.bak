import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  ChevronRight,
  Database,
  DollarSign,
  Download,
  Info,
  Mail,
  Palette,
  RefreshCw,
  Save,
  Shield,
  Smartphone,
  Upload,
  User,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
// @ts-expect-error TS(6142): Module '../../core/Layout' was resolved to 'C:/Use... Remove this comment to see the full error message
import { getLocation } from '../../../utils/location';
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

const _Settings: React.FC = () => {
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
    _loadUserProfile();
  }, []);

  const _loadUserProfile = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const _mockProfile: UserProfile = {
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

      setUserProfile(_mockProfile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const _saveSettings = async () => {
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

  const _exportSettings = async () => {
    try {
      const _settings = {
        notifications: notificationSettings,
        privacy: privacySettings,
        platform: platformSettings,
        betting: bettingSettings,
        api: apiSettings,
      };

      const _dataStr = JSON.stringify(_settings, null, 2);
      const _dataBlob = new Blob([_dataStr], { type: 'application/json' });
      const _url = URL.createObjectURL(_dataBlob);

      const _link = document.createElement('a');
      _link.href = _url;
      _link.download = 'a1betting-settings.json';
      _link.click();

      URL.revokeObjectURL(_url);
    } catch (error) {
      console.error('Failed to export settings:', error);
    }
  };

  const _importSettings = async (file: File) => {
    try {
      const _text = await file.text();
      const _settings = JSON.parse(_text);

      if (_settings.notifications) setNotificationSettings(_settings.notifications);
      if (_settings.privacy) setPrivacySettings(_settings.privacy);
      if (_settings.platform) setPlatformSettings(_settings.platform);
      if (_settings.betting) setBettingSettings(_settings.betting);
      if (_settings.api) setAPISettings(_settings.api);

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to import settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const _baseTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'platform', label: 'Platform', icon: Palette },
    { id: 'betting', label: 'Betting', icon: DollarSign },
    { id: 'api', label: 'API & Data', icon: Database },
  ];

  // Add admin tab only for verified admin users (memoized for performance)
  const _tabs = useMemo(() => {
    // @ts-expect-error TS(2304): Cannot find name 'checkAdminStatus'.
    return checkAdminStatus()
      ? // @ts-expect-error TS(2304): Cannot find name 'Crown'.
        [...baseTabs, { id: 'admin', label: 'Admin Mode', icon: Crown }]
      : baseTabs;
    // @ts-expect-error TS(2304): Cannot find name 'checkAdminStatus'.
  }, [checkAdminStatus]);

  const _getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <RefreshCw className='w-4 h-4 animate-spin' />;
      case 'saved':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <CheckCircle className='w-4 h-4 text-green-400' />;
      case 'error':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <AlertTriangle className='w-4 h-4 text-red-400' />;
      default:
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <Save className='w-4 h-4' />;
    }
  };

  const _getSaveStatusText = () => {
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

  const _ToggleSwitch: React.FC<{
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
  }> = ({ enabled, onChange, disabled = false }) => (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-800 ${
        enabled ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'bg-slate-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const _renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-6'>
            {userProfile && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div className='flex items-center space-x-6'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <User className='w-12 h-12 text-white' />
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <h3 className='text-xl font-bold text-white'>
                      {userProfile.firstName} {userProfile.lastName}
                    </h3>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <p className='text-gray-400'>@{userProfile.username}</p>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='flex items-center space-x-2 mt-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
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
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <span className='text-xs text-gray-500'>
                        Expires {userProfile.subscription.expiresAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <label
                      htmlFor='settings-first-name'
                      className='block text-sm font-medium text-gray-300 mb-2'
                    >
                      First Name
                    </label>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <input
                      id='settings-first-name'
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
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <label
                      htmlFor='settings-last-name'
                      className='block text-sm font-medium text-gray-300 mb-2'
                    >
                      Last Name
                    </label>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <input
                      id='settings-last-name'
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
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <label
                      htmlFor='settings-email'
                      className='block text-sm font-medium text-gray-300 mb-2'
                    >
                      Email
                    </label>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <input
                      id='settings-email'
                      type='email'
                      value={userProfile.email}
                      onChange={e =>
                        setUserProfile(prev => (prev ? { ...prev, email: e.target.value } : null))
                      }
                      className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                    />
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <label
                      htmlFor='settings-username'
                      className='block text-sm font-medium text-gray-300 mb-2'
                    >
                      Username
                    </label>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <input
                      id='settings-username'
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
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <label
                      htmlFor='settings-timezone'
                      className='block text-sm font-medium text-gray-300 mb-2'
                    >
                      Timezone
                    </label>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <select
                      id='settings-timezone'
                      value={userProfile.timezone}
                      onChange={e =>
                        setUserProfile(prev =>
                          prev ? { ...prev, timezone: e.target.value } : null
                        )
                      }
                      className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                    >
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <option value='America/New_York'>Eastern Time</option>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <option value='America/Chicago'>Central Time</option>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <option value='America/Denver'>Mountain Time</option>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <option value='America/Los_Angeles'>Pacific Time</option>
                    </select>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <label
                      htmlFor='settings-language'
                      className='block text-sm font-medium text-gray-300 mb-2'
                    >
                      Language
                    </label>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <select
                      id='settings-language'
                      value={userProfile.language}
                      onChange={e =>
                        setUserProfile(prev =>
                          prev ? { ...prev, language: e.target.value } : null
                        )
                      }
                      className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                    >
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <option value='en'>English</option>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <option value='es'>Spanish</option>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <option value='fr'>French</option>
                    </select>
                  </div>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div className='bg-slate-800/50 rounded-lg p-4'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <h4 className='font-medium text-white mb-3'>Subscription Features</h4>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                    {userProfile.subscription.features.map((feature, index) => (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div key={index} className='flex items-center space-x-2'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message
                        <CheckCircle className='w-4 h-4 text-green-400' />
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message
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
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-8'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <h3 className='text-lg font-bold text-white mb-4 flex items-center space-x-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <Mail className='w-5 h-5' />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <span>Email Notifications</span>
              </h3>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='space-y-4'>
                {Object.entries(notificationSettings.email).map(([key, value]) => (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div
                    key={key}
                    className='flex items-center justify-between p-3 bg-slate-800/50 rounded-lg'
                  >
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <span className='text-white font-medium'>
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                      </span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
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
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
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
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <h3 className='text-lg font-bold text-white mb-4 flex items-center space-x-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <Smartphone className='w-5 h-5' />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <span>Push Notifications</span>
              </h3>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='space-y-4'>
                {Object.entries(notificationSettings.push).map(([key, value]) => (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div
                    key={key}
                    className='flex items-center justify-between p-3 bg-slate-800/50 rounded-lg'
                  >
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <span className='text-white font-medium'>
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                      </span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <p className='text-sm text-gray-400'>
                        {key === 'enabled' && 'Enable all push notifications'}
                        {key === 'gameStartReminders' && 'Notifications before games start'}
                        {key === 'lineupDeadlines' && 'Reminders for lineup submission deadlines'}
                        {key === 'injuryAlerts' && 'Immediate injury status updates'}
                        {key === 'arbitrageOpportunities' && 'Real-time arbitrage opportunities'}
                        {key === 'bigWins' && 'Notifications for significant wins'}
                      </p>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
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
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='flex items-start space-x-3'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <Info className='w-5 h-5 text-yellow-400 mt-0.5' />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <h4 className='font-medium text-yellow-400'>Privacy Notice</h4>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <p className='text-sm text-yellow-300/80 mt-1'>
                    Your privacy is important to us. These settings control how your data is
                    collected, used, and shared.
                  </p>
                </div>
              </div>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='space-y-4'>
              {Object.entries(privacySettings).map(([key, value]) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div
                  key={key}
                  className='flex items-center justify-between p-4 bg-slate-800/50 rounded-lg'
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-white font-medium'>
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    </span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
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
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <select
                      value={value as string}
                      onChange={e =>
                        // @ts-expect-error TS(2345): Argument of type '(prev: PrivacySettings) => { pro... Remove this comment to see the full error message
                        setPrivacySettings(prev => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      className='px-3 py-1 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm focus:outline-none focus:border-cyan-400'
                    >
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <option value='public'>Public</option>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <option value='private'>Private</option>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <option value='friends'>Friends Only</option>
                    </select>
                  ) : (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <label
                  htmlFor='settings-theme-select'
                  className='block text-sm font-medium text-gray-300 mb-2'
                >
                  Theme
                </label>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <select
                  id='settings-theme-select'
                  value={platformSettings.theme}
                  onChange={e =>
                    setPlatformSettings(prev => ({
                      ...prev,
                      theme: e.target.value as unknown,
                    }))
                  }
                  className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <option value='dark'>Dark</option>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <option value='light'>Light</option>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <option value='auto'>Auto</option>
                </select>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <label
                  htmlFor='settings-default-sport-select'
                  className='block text-sm font-medium text-gray-300 mb-2'
                >
                  Default Sport
                </label>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <select
                  id='settings-default-sport-select'
                  value={platformSettings.defaultSport}
                  onChange={e =>
                    setPlatformSettings(prev => ({
                      ...prev,
                      defaultSport: e.target.value,
                    }))
                  }
                  className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <option value='NFL'>NFL</option>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <option value='NBA'>NBA</option>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <option value='MLB'>MLB</option>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <option value='NHL'>NHL</option>
                </select>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <label
                  htmlFor='settings-refresh-interval'
                  className='block text-sm font-medium text-gray-300 mb-2'
                >
                  Refresh Interval (seconds)
                </label>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <input
                  id='settings-refresh-interval'
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
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <label
                  htmlFor='settings-accent-color'
                  className='block text-sm font-medium text-gray-300 mb-2'
                >
                  Accent Color
                </label>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <input
                  id='settings-accent-color'
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
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
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
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div
                  key={key}
                  className='flex items-center justify-between p-4 bg-slate-800/50 rounded-lg'
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-white font-medium'>{label}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <p className='text-sm text-gray-400 mt-1'>{desc}</p>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
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
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <label
                  htmlFor='settings-bankroll'
                  className='block text-sm font-medium text-gray-300 mb-2'
                >
                  Default Bankroll ($)
                </label>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <input
                  id='settings-bankroll'
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
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <label
                  htmlFor='settings-max-bet-size'
                  className='block text-sm font-medium text-gray-300 mb-2'
                >
                  Max Bet Size ($)
                </label>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <input
                  id='settings-max-bet-size'
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
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <label
                  htmlFor='settings-kelly-fraction'
                  className='block text-sm font-medium text-gray-300 mb-2'
                >
                  Kelly Fraction
                </label>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <input
                  id='settings-kelly-fraction'
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
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <label
                  htmlFor='settings-risk-tolerance'
                  className='block text-sm font-medium text-gray-300 mb-2'
                >
                  Risk Tolerance
                </label>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <select
                  id='settings-risk-tolerance'
                  value={bettingSettings.riskTolerance}
                  onChange={e =>
                    setBettingSettings(prev => ({
                      ...prev,
                      riskTolerance: e.target.value as unknown,
                    }))
                  }
                  className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <option value='conservative'>Conservative</option>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <option value='moderate'>Moderate</option>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <option value='aggressive'>Aggressive</option>
                </select>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <label
                  htmlFor='settings-arbitrage-threshold'
                  className='block text-sm font-medium text-gray-300 mb-2'
                >
                  Arbitrage Threshold (%)
                </label>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <input
                  id='settings-arbitrage-threshold'
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
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <label
                  htmlFor='settings-min-edge'
                  className='block text-sm font-medium text-gray-300 mb-2'
                >
                  Minimum Edge (%)
                </label>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <input
                  id='settings-min-edge'
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
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
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
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div
                  key={key}
                  className='flex items-center justify-between p-4 bg-slate-800/50 rounded-lg'
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-white font-medium'>{label}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <p className='text-sm text-gray-400 mt-1'>{desc}</p>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
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
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <h3 className='text-lg font-bold text-white mb-4'>API Providers</h3>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='space-y-4'>
                {Object.entries(apiSettings.providers).map(([provider, settings]) => (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div key={provider} className='p-4 bg-slate-800/50 rounded-lg'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='flex items-center justify-between mb-3'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <span className='font-medium text-white'>{provider}</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
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
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message
                        <label
                          htmlFor={`settings-api-key-${provider}`}
                          className='block text-xs text-gray-400 mb-1'
                        >
                          API Key
                        </label>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message
                        <input
                          id={`settings-api-key-${provider}`}
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
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message
                        <label
                          htmlFor={`settings-rate-limit-${provider}`}
                          className='block text-xs text-gray-400 mb-1'
                        >
                          Rate Limit
                        </label>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message
                        <input
                          id={`settings-rate-limit-${provider}`}
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
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message
                        <label
                          htmlFor={`settings-priority-${provider}`}
                          className='block text-xs text-gray-400 mb-1'
                        >
                          Priority
                        </label>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                        provided... Remove this comment to see the full error message
                        <input
                          id={`settings-priority-${provider}`}
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
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <h3 className='text-lg font-bold text-white mb-4'>Caching & Performance</h3>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <label
                    htmlFor='settings-cache-ttl'
                    className='block text-sm font-medium text-gray-300 mb-2'
                  >
                    Cache TTL (seconds)
                  </label>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <input
                    id='settings-cache-ttl'
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
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <label
                    htmlFor='settings-cache-max-size'
                    className='block text-sm font-medium text-gray-300 mb-2'
                  >
                    Max Cache Size (MB)
                  </label>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <input
                    id='settings-cache-max-size'
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
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <label
                    htmlFor='settings-retry-attempts'
                    className='block text-sm font-medium text-gray-300 mb-2'
                  >
                    Retry Attempts
                  </label>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <input
                    id='settings-retry-attempts'
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
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/50 rounded-lg p-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='flex items-start space-x-4'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div className='w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <Crown className='w-6 h-6 text-white' />
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div className='flex-1'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <h3 className='text-xl font-bold text-white mb-2'>Admin Mode Access</h3>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <p className='text-gray-300 mb-4'>
                    Admin mode provides access to advanced dashboard features, system controls, and
                    administrative tools. This mode is only available to verified administrators.
                  </p>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between p-4 bg-slate-800/50 rounded-lg'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <span className='text-white font-medium'>Enable Admin Dashboard</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <p className='text-sm text-gray-400 mt-1'>
                        Switch to the comprehensive admin dashboard with full feature access
                      </p>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <ToggleSwitch
                      // @ts-expect-error TS(2304): Cannot find name 'adminModeEnabled'.
                      enabled={adminModeEnabled}
                      onChange={enabled => {
                        // @ts-expect-error TS(2304): Cannot find name 'setAdminModeEnabled'.
                        setAdminModeEnabled(enabled);
                        if (enabled) {
                          // Navigate to admin dashboard
                          getLocation().assign('/admin');
                        }
                      }}
                    />
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <div className='flex items-center space-x-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <Info className='w-4 h-4 text-blue-400' />
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                      provided... Remove this comment to see the full error message
                      <span className='text-sm text-blue-300 font-medium'>
                        Admin Privileges Active
                      </span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <p className='text-xs text-blue-200/80 mt-1'>
                      You have verified admin access. The admin dashboard includes advanced
                      analytics, system monitoring, user management, and configuration tools.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='p-4 bg-slate-800/50 rounded-lg'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <h4 className='font-medium text-white mb-2'>Admin Features</h4>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <ul className='space-y-2 text-sm text-gray-300'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <li>• Advanced Analytics Dashboard</li>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <li>• System Monitoring & Logs</li>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <li>• User Management Interface</li>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <li>• Configuration Controls</li>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <li>• Real-time Data Management</li>
                </ul>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='p-4 bg-slate-800/50 rounded-lg'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <h4 className='font-medium text-white mb-2'>Current Status</h4>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div className='space-y-2 text-sm'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='flex justify-between flex-wrap gap-1'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>User Role:</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-purple-400 font-medium'>{user?.role || 'admin'}</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='flex justify-between flex-wrap gap-1'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Admin Access:</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-green-400 font-medium'>Verified</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='flex justify-between flex-wrap gap-1'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Permissions:</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <span className='text-cyan-400 font-medium break-all'>
                      // @ts-expect-error TS(2552): Cannot find name 'user'. Did you mean 'User'?
                      {user?.permissions?.join(', ') || 'admin, user'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <div>Select a tab</div>;
    }
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Layout
      title='Settings'
      subtitle='Platform Configuration • Account Management • Privacy Controls'
      headerActions={
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-3'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <button
            onClick={exportSettings}
            className='flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-white text-sm transition-all'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <Download className='w-4 h-4' />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <span>Export</span>
          </button>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <label className='flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-white text-sm transition-all cursor-pointer'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <Upload className='w-4 h-4' />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <span>Import</span>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <input
              type='file'
              accept='.json'
              className='hidden'
              onChange={e => {
                const _file = e.target.files?.[0];
                if (file) importSettings(file);
              }}
            />
          </label>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <button
            onClick={saveSettings}
            disabled={isLoading}
            className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 rounded-lg text-white font-medium transition-all disabled:opacity-50'
          >
            {getSaveStatusIcon()}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <span>{getSaveStatusText()}</span>
          </button>
        </div>
      }
    >
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
        {/* Settings Navigation */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='lg:col-span-1'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h3 className='text-lg font-bold text-white mb-4'>Settings</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <nav className='space-y-2'>
              {tabs.map(tab => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/50 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <tab.icon className='w-4 h-4' />
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <span>{tab.label}</span>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  {activeTab === tab.id && <ChevronRight className='w-4 h-4 ml-auto' />}
                </button>
              ))}
            </nav>
          </motion.div>
        </div>
        {/* Settings Content */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='lg:col-span-3'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='flex items-center space-x-3 mb-6'>
              {(() => {
                const _currentTab = tabs.find(tab => tab.id === activeTab);
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                return currentTab ? <currentTab.icon className='w-6 h-6 text-cyan-400' /> : null;
              })()}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
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
// Removed: consolidated into user-friendly/Settings.tsx
