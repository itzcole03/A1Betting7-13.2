import { motion } from 'framer-motion';
import { Bell, Database, Palette, RefreshCw, Save, Shield, User } from 'lucide-react';
import React, { useState } from 'react';
// @ts-expect-error TS(6142): Module '../contexts/AppContext' was resolved to 'C... Remove this comment to see the full error message
import { useAppContext } from '../contexts/AppContext';

interface SettingsProps {
  className?: string;
}

/**
 * Settings Component
 *
 * Comprehensive settings interface for the A1Betting platform.
 * Includes user preferences, notifications, security, and system configuration.
 *
 * @param className - Additional CSS classes
 */
export const Settings: React.FC<SettingsProps> = ({ className = '' }) => {
  const { setNotification } = useAppContext();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      theme: 'dark',
      language: 'en',
      timezone: 'UTC',
      autoSave: true,
    },
    notifications: {
      email: true,
      push: true,
      sms: false,
      betAlerts: true,
      priceAlerts: true,
      newsAlerts: false,
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
      loginNotifications: true,
      ipWhitelist: false,
    },
    betting: {
      defaultStake: 100,
      maxStake: 1000,
      autoConfirm: false,
      riskLevel: 'medium',
      stopLoss: 500,
    },
  });

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'betting', label: 'Betting', icon: Database },
  ];

  const handleSave = () => {
    // Simulate save operation
    setNotification('Settings saved successfully!');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleReset = () => {
    // Reset to defaults
    setNotification('Settings reset to defaults');
    setTimeout(() => setNotification(null), 3000);
  };

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value,
      },
    }));
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`}>
      {/* Header */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='p-6 border-b border-gray-700'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <h2 className='text-2xl font-bold text-white flex items-center gap-3'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Palette className='w-7 h-7 text-cyan-400' />
          Settings
        </h2>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <p className='text-gray-400 mt-2'>
          Configure your A1Betting platform preferences and security settings
        </p>
      </div>

      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex'>
        {/* Sidebar */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='w-64 bg-gray-800 border-r border-gray-700'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <nav className='p-4 space-y-2'>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Icon className='w-5 h-5' />
                  {tab.label}
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex-1 p-6'>
          {activeTab === 'general' && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h3 className='text-xl font-semibold text-white'>General Settings</h3>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <label
                    htmlFor='theme-select'
                    className='block text-sm font-medium text-gray-300 mb-2'
                  >
                    Theme
                  </label>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <select
                    id='theme-select'
                    value={settings.general.theme}
                    onChange={e => updateSetting('general', 'theme', e.target.value)}
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500'
                  >
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <option value='dark'>Dark</option>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <option value='light'>Light</option>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <option value='auto'>Auto</option>
                  </select>
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <label
                    htmlFor='language-select'
                    className='block text-sm font-medium text-gray-300 mb-2'
                  >
                    Language
                  </label>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <select
                    id='language-select'
                    value={settings.general.language}
                    onChange={e => updateSetting('general', 'language', e.target.value)}
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500'
                  >
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <option value='en'>English</option>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <option value='es'>Spanish</option>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <option value='fr'>French</option>
                  </select>
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <label
                    htmlFor='timezone-select'
                    className='block text-sm font-medium text-gray-300 mb-2'
                  >
                    Timezone
                  </label>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <select
                    id='timezone-select'
                    value={settings.general.timezone}
                    onChange={e => updateSetting('general', 'timezone', e.target.value)}
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500'
                  >
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <option value='UTC'>UTC</option>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <option value='EST'>Eastern</option>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <option value='PST'>Pacific</option>
                  </select>
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-center'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <input
                    type='checkbox'
                    id='autoSave'
                    checked={settings.general.autoSave}
                    onChange={e => updateSetting('general', 'autoSave', e.target.checked)}
                    className='w-4 h-4 text-cyan-600 bg-gray-800 border-gray-600 rounded focus:ring-cyan-500'
                  />
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <label htmlFor='autoSave' className='ml-2 text-sm text-gray-300'>
                    Auto-save settings
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h3 className='text-xl font-semibold text-white'>Notification Settings</h3>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='space-y-4'>
                {Object.entries(settings.notifications).map(([key, value]) => (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div key={key} className='flex items-center justify-between'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <label
                        htmlFor={`notification-${key}`}
                        className='text-sm font-medium text-gray-300 capitalize'
                      >
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <p className='text-xs text-gray-400'>
                        {key === 'email' && 'Receive notifications via email'}
                        {key === 'push' && 'Browser push notifications'}
                        {key === 'sms' && 'SMS notifications for critical alerts'}
                        {key === 'betAlerts' && 'Notifications for bet outcomes'}
                        {key === 'priceAlerts' && 'Price movement alerts'}
                        {key === 'newsAlerts' && 'Breaking news notifications'}
                      </p>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <input
                      id={`notification-${key}`}
                      type='checkbox'
                      checked={value}
                      onChange={e => updateSetting('notifications', key, e.target.checked)}
                      className='w-4 h-4 text-cyan-600 bg-gray-800 border-gray-600 rounded focus:ring-cyan-500'
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h3 className='text-xl font-semibold text-white'>Security Settings</h3>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='space-y-4'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-center justify-between'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <label
                      htmlFor='twoFactor-checkbox'
                      className='text-sm font-medium text-gray-300'
                    >
                      Two-Factor Authentication
                    </label>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <p className='text-xs text-gray-400'>
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <input
                    id='twoFactor-checkbox'
                    type='checkbox'
                    checked={settings.security.twoFactor}
                    onChange={e => updateSetting('security', 'twoFactor', e.target.checked)}
                    className='w-4 h-4 text-cyan-600 bg-gray-800 border-gray-600 rounded focus:ring-cyan-500'
                  />
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <label
                    htmlFor='sessionTimeout-input'
                    className='block text-sm font-medium text-gray-300 mb-2'
                  >
                    Session Timeout (minutes)
                  </label>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <input
                    id='sessionTimeout-input'
                    type='number'
                    value={settings.security.sessionTimeout}
                    onChange={e =>
                      updateSetting('security', 'sessionTimeout', parseInt(e.target.value))
                    }
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500'
                    min='5'
                    max='120'
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'betting' && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h3 className='text-xl font-semibold text-white'>Betting Settings</h3>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <label
                    htmlFor='defaultStake-input'
                    className='block text-sm font-medium text-gray-300 mb-2'
                  >
                    Default Stake ($)
                  </label>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <input
                    id='defaultStake-input'
                    type='number'
                    value={settings.betting.defaultStake}
                    onChange={e =>
                      updateSetting('betting', 'defaultStake', parseInt(e.target.value))
                    }
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500'
                    min='1'
                  />
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <label
                    htmlFor='maxStake-input'
                    className='block text-sm font-medium text-gray-300 mb-2'
                  >
                    Maximum Stake ($)
                  </label>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <input
                    id='maxStake-input'
                    type='number'
                    value={settings.betting.maxStake}
                    onChange={e => updateSetting('betting', 'maxStake', parseInt(e.target.value))}
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500'
                    min='1'
                  />
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <label
                    htmlFor='riskLevel-select'
                    className='block text-sm font-medium text-gray-300 mb-2'
                  >
                    Risk Level
                  </label>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <select
                    id='riskLevel-select'
                    value={settings.betting.riskLevel}
                    onChange={e => updateSetting('betting', 'riskLevel', e.target.value)}
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500'
                  >
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <option value='low'>Low</option>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <option value='medium'>Medium</option>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <option value='high'>High</option>
                  </select>
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <label
                    htmlFor='stopLoss-input'
                    className='block text-sm font-medium text-gray-300 mb-2'
                  >
                    Stop Loss ($)
                  </label>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <input
                    id='stopLoss-input'
                    type='number'
                    value={settings.betting.stopLoss}
                    onChange={e => updateSetting('betting', 'stopLoss', parseInt(e.target.value))}
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500'
                    min='0'
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex gap-4 mt-8 pt-6 border-t border-gray-700'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <motion.button
              onClick={handleSave}
              className='flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Save className='w-4 h-4' />
              Save Changes
            </motion.button>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <motion.button
              onClick={handleReset}
              className='flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <RefreshCw className='w-4 h-4' />
              Reset to Defaults
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
