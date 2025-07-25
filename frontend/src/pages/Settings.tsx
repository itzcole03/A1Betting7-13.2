// Settings.tsx
// Enhanced settings page with admin features and multiple sections
// Integrates with ThemeProvider/useTheme for global theme switching

import {
  Activity,
  Bell,
  Code,
  Database,
  Palette,
  Server,
  Settings as SettingsIcon,
  Shield,
  Users,
} from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { _useTheme as useTheme } from '../components/common/theme/ThemeProvider';

// Mock admin check - in real app, this would come from auth context
const _isAdmin = true; // For demonstration

const _themes = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System (Auto)' },
];

const _settingSections = [
  { id: 'appearance', label: 'Appearance', icon: <Palette className='w-5 h-5' /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className='w-5 h-5' /> },
  { id: 'monitoring', label: 'Monitoring', icon: <Activity className='w-5 h-5' /> },
  ...(_isAdmin
    ? [
        { id: 'users', label: 'User Management', icon: <Users className='w-5 h-5' /> },
        { id: 'database', label: 'Database', icon: <Database className='w-5 h-5' /> },
        { id: 'security', label: 'Security', icon: <Shield className='w-5 h-5' /> },
        { id: 'api', label: 'API Settings', icon: <Server className='w-5 h-5' /> },
        { id: 'advanced', label: 'Advanced', icon: <Code className='w-5 h-5' /> },
      ]
    : []),
];

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('appearance');
  const [isPending, startTransition] = React.useTransition();
  const deferredThemes = React.useDeferredValue(_themes);
  const deferredSettingSections = React.useDeferredValue(_settingSections);

  // Memoized handler for section change
  const handleSectionChange = useCallback((id: string) => {
    startTransition(() => setActiveSection(id));
  }, []);

  // Memoized row renderer for react-window
  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const section = deferredSettingSections[index];
      return (
        <div style={style} key={section.id}>
          <button
            onClick={() => handleSectionChange(section.id)}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              activeSection === section.id
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold'
                : 'bg-transparent text-slate-700 dark:text-slate-200'
            }`}
            disabled={isPending}
          >
            {section.icon}
            <span className='ml-3'>{section.label}</span>
            {_isAdmin &&
              ['users', 'database', 'security', 'api', 'advanced'].includes(section.id) && (
                <span className='ml-auto px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded'>
                  Admin
                </span>
              )}
          </button>
        </div>
      );
    },
    [activeSection, isPending, handleSectionChange, deferredSettingSections]
  );

  // Memoized theme change handler
  const handleThemeChange = useCallback(
    (value: string) => {
      setTheme(value as unknown);
    },
    [setTheme]
  );

  // Section render logic
  const renderSection = useCallback(() => {
    switch (activeSection) {
      case 'appearance':
        return (
          <section>
            <h3 className='text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200'>Theme</h3>
            <div className='flex flex-col space-y-3'>
              {deferredThemes.map(t => {
                const _inputId = `theme-radio-${t.value}`;
                return (
                  <label
                    key={t.value}
                    className='flex items-center cursor-pointer'
                    htmlFor={_inputId}
                  >
                    <input
                      type='radio'
                      name='theme'
                      id={_inputId}
                      value={t.value}
                      checked={theme === t.value}
                      onChange={() => handleThemeChange(t.value)}
                      className='form-radio h-5 w-5 text-blue-600 dark:text-blue-400'
                    />
                    <span className='ml-3 text-slate-800 dark:text-slate-100'>{t.label}</span>
                    {theme === t.value && (
                      <span className='ml-2 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium'>
                        Selected
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </section>
        );
      case 'notifications':
        return (
          <section>
            <h3 className='text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200'>
              Notifications
            </h3>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-slate-800 dark:text-slate-100'>Email Notifications</span>
                <input
                  type='checkbox'
                  className='form-checkbox h-5 w-5 text-blue-600'
                  aria-label='Email Notifications'
                />
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-slate-800 dark:text-slate-100'>Push Notifications</span>
                <input
                  type='checkbox'
                  className='form-checkbox h-5 w-5 text-blue-600'
                  aria-label='Push Notifications'
                />
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-slate-800 dark:text-slate-100'>Betting Alerts</span>
                <input
                  type='checkbox'
                  className='form-checkbox h-5 w-5 text-blue-600'
                  defaultChecked
                  aria-label='Betting Alerts'
                />
              </div>
            </div>
          </section>
        );
      case 'monitoring':
        return (
          <section>
            <h3 className='text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200'>
              System Monitoring
            </h3>
            <div className='space-y-4'>
              <div className='p-4 bg-green-50 dark:bg-green-900/20 rounded-lg'>
                <div className='flex items-center mb-2'>
                  <div className='w-3 h-3 bg-green-500 rounded-full mr-2'></div>
                  <span className='font-medium text-green-800 dark:text-green-300'>
                    Backend Health
                  </span>
                </div>
                <p className='text-sm text-green-700 dark:text-green-400'>
                  All services operational
                </p>
              </div>
              <div className='p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                <div className='flex items-center mb-2'>
                  <div className='w-3 h-3 bg-blue-500 rounded-full mr-2'></div>
                  <span className='font-medium text-blue-800 dark:text-blue-300'>
                    PrizePicks Scraper
                  </span>
                </div>
                <p className='text-sm text-blue-700 dark:text-blue-400'>Health monitoring active</p>
              </div>
            </div>
          </section>
        );
      case 'users':
        return (
          <section>
            <h3 className='text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200'>
              User Management
            </h3>
            <div className='space-y-4'>
              <div className='p-4 bg-slate-50 dark:bg-slate-800 rounded-lg'>
                <p className='text-slate-700 dark:text-slate-300'>
                  Admin-only section for user management
                </p>
                <button className='mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors'>
                  Manage Users
                </button>
              </div>
            </div>
          </section>
        );
      case 'database':
        return (
          <section>
            <h3 className='text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200'>
              Database Settings
            </h3>
            <div className='space-y-4'>
              <div className='p-4 bg-slate-50 dark:bg-slate-800 rounded-lg'>
                <p className='text-slate-700 dark:text-slate-300'>
                  Database configuration and maintenance
                </p>
                <button className='mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors'>
                  View Database Health
                </button>
              </div>
            </div>
          </section>
        );
      case 'security':
        return (
          <section>
            <h3 className='text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200'>
              Security Settings
            </h3>
            <div className='space-y-4'>
              <div className='p-4 bg-slate-50 dark:bg-slate-800 rounded-lg'>
                <p className='text-slate-700 dark:text-slate-300'>
                  Security configuration and options
                </p>
                <button className='mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors'>
                  Update Security
                </button>
              </div>
            </div>
          </section>
        );
      case 'api':
        return (
          <section>
            <h3 className='text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200'>
              API Settings
            </h3>
            <div className='space-y-4'>
              <div className='p-4 bg-slate-50 dark:bg-slate-800 rounded-lg'>
                <p className='text-slate-700 dark:text-slate-300'>API configuration and keys</p>
                <button className='mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors'>
                  Manage API Keys
                </button>
              </div>
            </div>
          </section>
        );
      case 'advanced':
        return (
          <section>
            <h3 className='text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200'>
              Advanced Settings
            </h3>
            <div className='space-y-4'>
              <div className='p-4 bg-slate-50 dark:bg-slate-800 rounded-lg'>
                <p className='text-slate-700 dark:text-slate-300'>Advanced configuration options</p>
                <button className='mt-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors'>
                  Edit Advanced Settings
                </button>
              </div>
            </div>
          </section>
        );
      default:
        return null;
    }
  }, [activeSection, deferredThemes, theme, handleThemeChange]);

  // Main render
  return (
    <main className='min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-8'>
      <div className='max-w-3xl mx-auto'>
        <h1 className='text-2xl font-bold mb-8 text-slate-800 dark:text-slate-100 flex items-center'>
          <SettingsIcon className='w-6 h-6 mr-2' /> Settings
        </h1>
        {isPending && <div style={{ color: 'blue', marginBottom: 8 }}>Loading...</div>}
        <div className='flex flex-col md:flex-row gap-8'>
          <nav className='md:w-1/4 mb-6 md:mb-0'>
            <List
              height={300}
              itemCount={deferredSettingSections.length}
              itemSize={56}
              width={'100%'}
            >
              {Row}
            </List>
          </nav>
          <section className='md:w-3/4'>{renderSection()}</section>
        </div>
      </div>
    </main>
  );
}
// File removed: consolidated into user-friendly/Settings.tsx
