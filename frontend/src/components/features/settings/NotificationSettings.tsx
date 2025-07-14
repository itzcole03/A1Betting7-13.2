import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Volume2,
  VolumeX,
  Clock,
  Target,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Activity,
  Users,
  Globe,
  Zap,
  Shield,
  Settings,
  Save,
  RefreshCw,
  CheckCircle,
  X,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Layout } from '../../core/Layout';

interface NotificationChannel {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  enabled: boolean;
  description: string;
  testable: boolean;
}

interface NotificationCategory {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  settings: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean;
  };
  customizable: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface CustomAlert {
  id: string;
  name: string;
  condition: string;
  trigger: string;
  channels: string[];
  enabled: boolean;
  createdAt: Date;
  lastTriggered?: Date;
}

interface NotificationHistory {
  id: string;
  type: string;
  title: string;
  message: string;
  channel: string;
  timestamp: Date;
  read: boolean;
  actionTaken?: boolean;
}

const NotificationSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('channels');
  const [channels, setChannels] = useState<NotificationChannel[]>([
    {
      id: 'email',
      name: 'Email',
      icon: Mail,
      enabled: true,
      description: 'Receive notifications via email',
      testable: true,
    },
    {
      id: 'push',
      name: 'Push Notifications',
      icon: Bell,
      enabled: true,
      description: 'Browser and mobile push notifications',
      testable: true,
    },
    {
      id: 'sms',
      name: 'SMS',
      icon: Smartphone,
      enabled: false,
      description: 'Text message notifications',
      testable: true,
    },
    {
      id: 'inApp',
      name: 'In-App',
      icon: MessageSquare,
      enabled: true,
      description: 'Notifications within the application',
      testable: false,
    },
  ]);

  const [categories, setCategories] = useState<NotificationCategory[]>([
    {
      id: 'arbitrage',
      name: 'Arbitrage Opportunities',
      icon: Target,
      description: 'New arbitrage betting opportunities detected',
      settings: { email: true, push: true, sms: false, inApp: true },
      customizable: true,
      priority: 'high',
    },
    {
      id: 'predictions',
      name: 'Prediction Updates',
      icon: TrendingUp,
      description: 'ML model predictions and confidence updates',
      settings: { email: true, push: true, sms: false, inApp: true },
      customizable: true,
      priority: 'medium',
    },
    {
      id: 'betting',
      name: 'Betting Alerts',
      icon: DollarSign,
      description: 'Bet confirmations, wins, losses, and deadlines',
      settings: { email: true, push: true, sms: true, inApp: true },
      customizable: false,
      priority: 'high',
    },
    {
      id: 'lineup',
      name: 'Lineup Deadlines',
      icon: Clock,
      description: 'DFS lineup submission deadlines approaching',
      settings: { email: true, push: true, sms: false, inApp: true },
      customizable: true,
      priority: 'critical',
    },
    {
      id: 'injuries',
      name: 'Injury Reports',
      icon: AlertTriangle,
      description: 'Player injury updates and lineup changes',
      settings: { email: true, push: true, sms: false, inApp: true },
      customizable: true,
      priority: 'high',
    },
    {
      id: 'performance',
      name: 'Performance Reports',
      icon: Activity,
      description: 'Weekly and monthly performance summaries',
      settings: { email: true, push: false, sms: false, inApp: true },
      customizable: true,
      priority: 'low',
    },
    {
      id: 'social',
      name: 'Social Intelligence',
      icon: Users,
      description: 'Social sentiment and trending discussions',
      settings: { email: false, push: true, sms: false, inApp: true },
      customizable: true,
      priority: 'medium',
    },
    {
      id: 'system',
      name: 'System Updates',
      icon: Settings,
      description: 'Platform updates, maintenance, and security alerts',
      settings: { email: true, push: true, sms: false, inApp: true },
      customizable: false,
      priority: 'medium',
    },
  ]);

  const [customAlerts, setCustomAlerts] = useState<CustomAlert[]>([
    {
      id: 'roi-threshold',
      name: 'ROI Above 15%',
      condition: 'ROI >= 15%',
      trigger: 'Daily calculation',
      channels: ['email', 'push'],
      enabled: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      lastTriggered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'arbitrage-profit',
      name: 'High Profit Arbitrage',
      condition: 'Profit Margin > 5%',
      trigger: 'Real-time scanning',
      channels: ['push', 'sms'],
      enabled: true,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      lastTriggered: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
  ]);

  const [notificationHistory, setNotificationHistory] = useState<NotificationHistory[]>([
    {
      id: '1',
      type: 'arbitrage',
      title: 'New Arbitrage Opportunity',
      message: 'Found 4.2% profit margin on Lakers vs Warriors',
      channel: 'push',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      read: false,
    },
    {
      id: '2',
      type: 'prediction',
      title: 'High Confidence Prediction',
      message: 'ML model shows 87% confidence for Over 215.5 points',
      channel: 'email',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true,
      actionTaken: true,
    },
    {
      id: '3',
      type: 'injury',
      title: 'Player Injury Update',
      message: 'LeBron James listed as questionable for tonight',
      channel: 'push',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      read: true,
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showCustomAlertModal, setShowCustomAlertModal] = useState(false);

  const saveSettings = async () => {
    setIsLoading(true);
    setSaveStatus('saving');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = async (channelId: string) => {
    try {
      // Simulate sending test notification
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add to history
      const testNotification: NotificationHistory = {
        id: Date.now().toString(),
        type: 'test',
        title: 'Test Notification',
        message: `This is a test notification sent via ${channelId}`,
        channel: channelId,
        timestamp: new Date(),
        read: false,
      };

      setNotificationHistory(prev => [testNotification, ...prev]);
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  const updateChannelStatus = (channelId: string, enabled: boolean) => {
    setChannels(prev =>
      prev.map(channel => (channel.id === channelId ? { ...channel, enabled } : channel))
    );
  };

  const updateCategorySettings = (
    categoryId: string,
    channelType: keyof NotificationCategory['settings'],
    enabled: boolean
  ) => {
    setCategories(prev =>
      prev.map(category =>
        category.id === categoryId
          ? {
              ...category,
              settings: { ...category.settings, [channelType]: enabled },
            }
          : category
      )
    );
  };

  const toggleCustomAlert = (alertId: string) => {
    setCustomAlerts(prev =>
      prev.map(alert => (alert.id === alertId ? { ...alert, enabled: !alert.enabled } : alert))
    );
  };

  const deleteCustomAlert = (alertId: string) => {
    setCustomAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const markAsRead = (notificationId: string) => {
    setNotificationHistory(prev =>
      prev.map(notification =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      )
    );
  };

  const getPriorityColor = (priority: NotificationCategory['priority']) => {
    switch (priority) {
      case 'critical':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'high':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'low':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
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

  const tabs = [
    { id: 'channels', label: 'Channels', icon: Bell },
    { id: 'categories', label: 'Categories', icon: Target },
    { id: 'custom', label: 'Custom Alerts', icon: Zap },
    { id: 'history', label: 'History', icon: Clock },
  ];

  const renderChannels = () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-2xl font-bold text-white mb-2'>Notification Channels</h3>
        <p className='text-gray-400'>Configure how you want to receive notifications</p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {channels.map(channel => (
          <motion.div
            key={channel.id}
            className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-3'>
                <div
                  className={`p-3 rounded-lg ${channel.enabled ? 'bg-cyan-500/20' : 'bg-gray-500/20'}`}
                >
                  <channel.icon
                    className={`w-6 h-6 ${channel.enabled ? 'text-cyan-400' : 'text-gray-400'}`}
                  />
                </div>
                <div>
                  <h4 className='text-white font-medium'>{channel.name}</h4>
                  <p className='text-gray-400 text-sm'>{channel.description}</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={channel.enabled}
                onChange={enabled => updateChannelStatus(channel.id, enabled)}
              />
            </div>

            {channel.testable && channel.enabled && (
              <button
                onClick={() => testNotification(channel.id)}
                className='w-full bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors text-sm'
              >
                Send Test Notification
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderCategories = () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-2xl font-bold text-white mb-2'>Notification Categories</h3>
        <p className='text-gray-400'>Choose which types of notifications to receive and how</p>
      </div>

      <div className='space-y-4'>
        {categories.map(category => (
          <motion.div
            key={category.id}
            className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-3'>
                <div className='p-3 rounded-lg bg-slate-700/50'>
                  <category.icon className='w-6 h-6 text-cyan-400' />
                </div>
                <div>
                  <div className='flex items-center space-x-2'>
                    <h4 className='text-white font-medium'>{category.name}</h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(category.priority)}`}
                    >
                      {category.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className='text-gray-400 text-sm'>{category.description}</p>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              {Object.entries(category.settings).map(([channelType, enabled]) => {
                const channelInfo = channels.find(c => c.id === channelType) || {
                  id: channelType,
                  name: channelType,
                  enabled: true,
                };

                return (
                  <div
                    key={channelType}
                    className='flex items-center justify-between p-3 bg-slate-900/50 rounded-lg'
                  >
                    <span className='text-gray-300 text-sm capitalize'>{channelInfo.name}</span>
                    <ToggleSwitch
                      enabled={enabled && channelInfo.enabled}
                      onChange={newEnabled =>
                        updateCategorySettings(category.id, channelType as any, newEnabled)
                      }
                      disabled={!channelInfo.enabled || !category.customizable}
                    />
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderCustomAlerts = () => (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-2xl font-bold text-white mb-2'>Custom Alerts</h3>
          <p className='text-gray-400'>Create personalized alerts based on specific conditions</p>
        </div>
        <button
          onClick={() => setShowCustomAlertModal(true)}
          className='bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-colors flex items-center space-x-2'
        >
          <Plus className='w-4 h-4' />
          <span>Create Alert</span>
        </button>
      </div>

      <div className='space-y-4'>
        {customAlerts.map(alert => (
          <motion.div
            key={alert.id}
            className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className='flex items-center justify-between mb-4'>
              <div>
                <div className='flex items-center space-x-3'>
                  <h4 className='text-white font-medium'>{alert.name}</h4>
                  <ToggleSwitch
                    enabled={alert.enabled}
                    onChange={() => toggleCustomAlert(alert.id)}
                  />
                </div>
                <p className='text-gray-400 text-sm mt-1'>{alert.condition}</p>
              </div>
              <div className='flex items-center space-x-2'>
                <button
                  onClick={() => {
                    /* Edit alert */
                  }}
                  className='text-cyan-400 hover:text-cyan-300 transition-colors'
                >
                  <Edit className='w-4 h-4' />
                </button>
                <button
                  onClick={() => deleteCustomAlert(alert.id)}
                  className='text-red-400 hover:text-red-300 transition-colors'
                >
                  <Trash2 className='w-4 h-4' />
                </button>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
              <div>
                <span className='text-gray-400'>Trigger: </span>
                <span className='text-white'>{alert.trigger}</span>
              </div>
              <div>
                <span className='text-gray-400'>Channels: </span>
                <span className='text-white'>{alert.channels.join(', ')}</span>
              </div>
              <div>
                <span className='text-gray-400'>Last Triggered: </span>
                <span className='text-white'>
                  {alert.lastTriggered ? alert.lastTriggered.toLocaleDateString() : 'Never'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-2xl font-bold text-white mb-2'>Notification History</h3>
        <p className='text-gray-400'>Recent notifications and their delivery status</p>
      </div>

      <div className='space-y-3'>
        {notificationHistory.map(notification => (
          <motion.div
            key={notification.id}
            className={`bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 ${
              !notification.read ? 'border-cyan-500/30' : ''
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <div
                  className={`w-2 h-2 rounded-full ${
                    notification.read ? 'bg-gray-500' : 'bg-cyan-400'
                  }`}
                />
                <div>
                  <h4 className='text-white font-medium'>{notification.title}</h4>
                  <p className='text-gray-400 text-sm'>{notification.message}</p>
                  <div className='flex items-center space-x-4 mt-2 text-xs text-gray-500'>
                    <span>{notification.timestamp.toLocaleString()}</span>
                    <span className='capitalize'>{notification.channel}</span>
                    {notification.actionTaken && (
                      <span className='text-green-400'>Action Taken</span>
                    )}
                  </div>
                </div>
              </div>
              {!notification.read && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  className='text-cyan-400 hover:text-cyan-300 transition-colors'
                >
                  <Eye className='w-4 h-4' />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'channels':
        return renderChannels();
      case 'categories':
        return renderCategories();
      case 'custom':
        return renderCustomAlerts();
      case 'history':
        return renderHistory();
      default:
        return renderChannels();
    }
  };

  return (
    <Layout>
      <div className='space-y-8'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-4xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent'>
              Notification Settings
            </h1>
            <p className='text-gray-400 mt-2'>Manage how and when you receive notifications</p>
          </div>
          <button
            onClick={saveSettings}
            disabled={isLoading}
            className='bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-colors disabled:opacity-50 flex items-center space-x-2'
          >
            {isLoading ? (
              <RefreshCw className='w-4 h-4 animate-spin' />
            ) : (
              <Save className='w-4 h-4' />
            )}
            <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className='flex space-x-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all ${
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

        {/* Status Indicator */}
        {saveStatus !== 'idle' && (
          <div
            className={`p-4 rounded-lg border ${
              saveStatus === 'saved'
                ? 'bg-green-500/10 border-green-500/20'
                : saveStatus === 'error'
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-blue-500/10 border-blue-500/20'
            }`}
          >
            <div className='flex items-center space-x-2'>
              {saveStatus === 'saving' && (
                <RefreshCw className='w-4 h-4 text-blue-400 animate-spin' />
              )}
              {saveStatus === 'saved' && <CheckCircle className='w-4 h-4 text-green-400' />}
              {saveStatus === 'error' && <X className='w-4 h-4 text-red-400' />}
              <span
                className={`text-sm font-medium ${
                  saveStatus === 'saved'
                    ? 'text-green-400'
                    : saveStatus === 'error'
                      ? 'text-red-400'
                      : 'text-blue-400'
                }`}
              >
                {saveStatus === 'saving' && 'Saving notification settings...'}
                {saveStatus === 'saved' && 'Notification settings saved successfully'}
                {saveStatus === 'error' && 'Failed to save notification settings'}
              </span>
            </div>
          </div>
        )}

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

export default NotificationSettings;
