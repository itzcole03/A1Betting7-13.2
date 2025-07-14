// Settings.tsx
// Enhanced settings page with admin features and multiple sections
// Integrates with ThemeProvider/useTheme for global theme switching

import React, { useState } from 'react';
import { useTheme } from '../components/common/theme/ThemeProvider';
import { Settings as SettingsIcon, Users, Database, Activity, Shield, Bell, Palette, Code, Server } from 'lucide-react';

// Mock admin check - in real app, this would come from auth context
const isAdmin = true; // For demonstration

const themes = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System (Auto)' },
];

const settingSections = [
  { id: 'appearance', label: 'Appearance', icon: <Palette className="w-5 h-5" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
  { id: 'monitoring', label: 'Monitoring', icon: <Activity className="w-5 h-5" /> },
  ...(isAdmin ? [
    { id: 'users', label: 'User Management', icon: <Users className="w-5 h-5" /> },
    { id: 'database', label: 'Database', icon: <Database className="w-5 h-5" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-5 h-5" /> },
    { id: 'api', label: 'API Settings', icon: <Server className="w-5 h-5" /> },
    { id: 'advanced', label: 'Advanced', icon: <Code className="w-5 h-5" /> },
  ] : [])
];

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('appearance');

  const renderSection = () => {
    switch (activeSection) {
      case 'appearance':
        return (
          <section>
            <h3 className='text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200'>Theme</h3>
            <div className='flex flex-col space-y-3'>
              {themes.map(t => (
                <label key={t.value} className='flex items-center cursor-pointer'>
                  <input
                    type='radio'
                    name='theme'
                    value={t.value}
                    checked={theme === t.value}
                    onChange={() => setTheme(t.value as any)}
                    className='form-radio h-5 w-5 text-blue-600 dark:text-blue-400'
                  />
                  <span className='ml-3 text-slate-800 dark:text-slate-100'>{t.label}</span>
                  {theme === t.value && (
                    <span className='ml-2 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium'>
                      Selected
                    </span>
                  )}
                </label>
              ))}
            </div>
          </section>
        );
      
      case 'notifications':
        return (
          <section>
            <h3 className='text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200'>Notifications</h3>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-slate-800 dark:text-slate-100'>Email Notifications</span>
                <input type='checkbox' className='form-checkbox h-5 w-5 text-blue-600' />
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-slate-800 dark:text-slate-100'>Push Notifications</span>
                <input type='checkbox' className='form-checkbox h-5 w-5 text-blue-600' />
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-slate-800 dark:text-slate-100'>Betting Alerts</span>
                <input type='checkbox' className='form-checkbox h-5 w-5 text-blue-600' defaultChecked />
              </div>
            </div>
          </section>
        );
      
      case 'monitoring':
        return (
          <section>
            <h3 className='text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200'>System Monitoring</h3>
            <div className='space-y-4'>
              <div className='p-4 bg-green-50 dark:bg-green-900/20 rounded-lg'>
                <div className='flex items-center mb-2'>
                  <div className='w-3 h-3 bg-green-500 rounded-full mr-2'></div>
                  <span className='font-medium text-green-800 dark:text-green-300'>Backend Health</span>
                </div>
                <p className='text-sm text-green-700 dark:text-green-400'>All services operational</p>
              </div>
              <div className='p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                <div className='flex items-center mb-2'>
                  <div className='w-3 h-3 bg-blue-500 rounded-full mr-2'></div>
                  <span className='font-medium text-blue-800 dark:text-blue-300'>PrizePicks Scraper</span>
                </div>
                <p className='text-sm text-blue-700 dark:text-blue-400'>Health monitoring active</p>
              </div>
            </div>
          </section>
        );
      
      default:
        if (isAdmin) {
          switch (activeSection) {
            case 'users':
              return (
                <section>
                  <h3 className='text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200'>User Management</h3>
                  <div className='space-y-4'>
                    <div className='p-4 bg-slate-50 dark:bg-slate-800 rounded-lg'>
                      <p className='text-slate-700 dark:text-slate-300'>Admin-only section for user management</p>
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
                  <h3 className='text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200'>Database Settings</h3>
                  <div className='space-y-4'>
                    <div className='p-4 bg-slate-50 dark:bg-slate-800 rounded-lg'>
                      <p className='text-slate-700 dark:text-slate-300'>Database configuration and maintenance</p>
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
                  <h3 className='text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200'>Security Settings</h3>
                  <div className='space-y-4'>
                    <div className='p-4 bg-red-50 dark:bg-red-900/20 rounded-lg'>
                      <p className='text-red-700 dark:text-red-300'>Security configuration and audit logs</p>
                      <button className='mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors'>
                        Security Audit
                      </button>
                    </div>
                  </div>
                </section>
              );
            
            case 'api':
              return (
                <section>
                  <h3 className='text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200'>API Settings</h3>
                  <div className='space-y-4'>
                    <div className='p-4 bg-slate-50 dark:bg-slate-800 rounded-lg'>
                      <p className='text-slate-700 dark:text-slate-300'>API keys and external service configuration</p>
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
                  <h3 className='text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200'>Advanced Settings</h3>
                  <div className='space-y-4'>
                    <div className='p-4 bg-slate-50 dark:bg-slate-800 rounded-lg'>
                      <p className='text-slate-700 dark:text-slate-300'>Advanced configuration and developer tools</p>
                      <button className='mt-2 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors'>
                        Developer Console
                      </button>
                    </div>
                  </div>
                </section>
              );
          }
        }
        return null;
    }
  };

  return (
    <div className='flex min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 dark:from-slate-900 dark:to-slate-800'>
      {/* Sidebar */}
      <aside className='w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6'>
        <div className='flex items-center mb-6'>
          <SettingsIcon className='w-6 h-6 mr-2 text-slate-700 dark:text-slate-200' />
          <h2 className='text-xl font-bold text-slate-800 dark:text-slate-100'>Settings</h2>
        </div>
        
        <nav>
          <ul className='space-y-2'>
            {settingSections.map(section => (
              <li key={section.id}>
                <button
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {section.icon}
                  <span className='ml-3'>{section.label}</span>
                  {isAdmin && ['users', 'database', 'security', 'api', 'advanced'].includes(section.id) && (
                    <span className='ml-auto px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded'>
                      Admin
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className='flex-1 p-10'>
        {renderSection()}
      </main>
    </div>
  );
}
