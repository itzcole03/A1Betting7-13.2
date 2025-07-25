
import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import './A1BettingPreview.css';
import AnalyticsTab from './AnalyticsTab';
import ArbitrageTab from './ArbitrageTab';
import BacktestingTab from './BacktestingTab';
import DashboardTab from './DashboardTab';
import InjuriesTab from './InjuriesTab';
import LiveBettingTab from './LiveBettingTab';
import MoneyMakerTab from './MoneyMakerTab';
import NewsTab from './NewsTab';
import PredictionsTab from './PredictionsTab';
import PrizePicksTab from './PrizePicksTab';
import QuantumAITab from './QuantumAITab';
import SHAPTab from './SHAPTab';
import SettingsTab from './SettingsTab';
import SocialTab from './SocialTab';
import StreamingTab from './StreamingTab';
import WeatherTab from './WeatherTab';

/**
const _A1BettingPreview: React.FC = () => {
 *
 * Main enterprise betting dashboard preview for A1Betting platform.
 * Renders header, sidebar navigation, and tabbed content area.
 *
 * Accessibility: All sidebar and tab navigation buttons have ARIA labels and roles for screen readers.
 *
 * @returns {JSX.Element} The preview UI.
 */
const _TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'moneymaker', label: 'Money Maker', icon: '💎' },
  { id: 'arbitrage', label: 'Arbitrage', icon: '⚡' },
  { id: 'livebetting', label: 'Live Betting', icon: '🔴' },
  { id: 'prizepicks', label: 'PrizePicks Pro', icon: '🎯' },
  { id: 'analytics', label: 'ML Analytics', icon: '🧠' },
  { id: 'predictions', label: 'AI Predictions', icon: '🔮' },
  { id: 'revolutionary', label: 'Quantum AI', icon: '⚛️' },
  { id: 'shap', label: 'SHAP Analysis', icon: '📈' },
  { id: 'historical', label: 'Historical Data', icon: '📚' },
  { id: 'social', label: 'Social Intel', icon: '🌐' },
  { id: 'news', label: 'News Hub', icon: '📰' },
  { id: 'weather', label: 'Weather Station', icon: '🌤️' },
  { id: 'injuries', label: 'Injury Tracker', icon: '🏥' },
  { id: 'streaming', label: 'Live Stream', icon: '📺' },
  { id: 'backtesting', label: 'Backtesting', icon: '🔬' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const _A1BettingPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const _sidebarRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { notification, setNotification } = useAppContext();
  // Mock user profile (replace with real user data integration)
  const _user = {
    name: 'Jane Doe',
    role: 'Pro Member',
    avatar: '\ud83d\udc64',
  };

  // Responsive: close sidebar on small screens by default
  useEffect(() => {
    const _handleResize = () => {
      const _mobile = window.innerWidth < 900;
      setIsMobile(mobile);

                style={{
                  background: 'none',
                  border: 'none',
  return (
    <div className='a1betting-preview-root'>
      {notification && (
        <div
          className='global-notification'
          role='alert'
          aria-live='assertive'
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.85)',
            color: '#fff',
            padding: '1rem 2rem',
            borderRadius: 8,
            zIndex: 2000,
            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span>{notification}</span>
          <button
            onClick={() => setNotification(null)}
            aria-label='Close notification'
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 20,
              cursor: 'pointer',
            }}
          >
            ✖️
          </button>
        </div>
      )}
      <div className='cyber-bg' />
      <div className='container'>
        <div className='header glass-card'>
          <div className='logo'>A1BETTING</div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--cyber-primary)', fontWeight: 'bold' }}>$18,420.73</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                Portfolio Value
              </div>
            </div>
            <div className='status-indicator status-online' />
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>47 AI Models Active</span>
            {isMobile && (
              <button
                className='sidebar-toggle-btn'
                aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                aria-controls='main-sidebar'
                aria-expanded={sidebarOpen ? 'true' : 'false'}
                onClick={() => setSidebarOpen(open => !open)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: 24,
                  cursor: 'pointer',
                }}
              >
                {sidebarOpen ? '✖️' : '☰'}
              </button>
            )}
          </div>
        </div>
        {isMobile && sidebarOpen && (
          <div
            className='sidebar-overlay'
            aria-hidden='true'
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1000,
            }}
          />
        )}
        {sidebarOpen && (
          <nav
            className='cyber-sidebar'
            id='main-sidebar'
            aria-label='Main sidebar navigation'
            ref={sidebarRef}
            style={
              isMobile ? { position: 'fixed', zIndex: 1001, height: '100vh', left: 0, top: 0 } : {}
            }
          >
            <div className='sidebar-header'>
              <div className='sidebar-logo'>
                <div className='logo-icon'>⚡</div>
                <div className='logo-text'>A1BETTING</div>
              </div>
              {isMobile && (
                <button
                  className='sidebar-close-btn'
                  aria-label='Close sidebar'
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: 20,
                    cursor: 'pointer',
                    marginLeft: 'auto',
                  }}
                >
                  ✖️
                </button>
              )}
            </div>
            <div
              className='sidebar-profile'
              style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                  }}
                >
                  {user.avatar}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', color: 'white' }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{user.role}</div>
                </div>
              </div>
            </div>
            <div className='sidebar-menu' role='tablist' aria-label='Main tabs'>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`menu-item${activeTab === tab.id ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  role='tab'
                  aria-selected={activeTab === tab.id ? 'true' : 'false'}
                  aria-controls={`tabpanel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  aria-label={tab.label}
                >
                  <div className='item-icon'>{tab.icon}</div>
                  <div className='item-content'>
                    <div className='item-title'>{tab.label}</div>
                  </div>
                  <div className='item-indicator' />
                </button>
              ))}
            </div>
          </nav>
        )}
        <main className='main-content'>
          <div className='tab-content'>
            {activeTab === 'dashboard' ? (
              <DashboardTab />
            ) : activeTab === 'moneymaker' ? (
              <MoneyMakerTab />
            ) : activeTab === 'arbitrage' ? (
              <ArbitrageTab />
            ) : activeTab === 'livebetting' ? (
              <LiveBettingTab />
            ) : activeTab === 'prizepicks' ? (
              <PrizePicksTab />
            ) : activeTab === 'analytics' ? (
              <AnalyticsTab />
            ) : activeTab === 'predictions' ? (
              <PredictionsTab />
            ) : activeTab === 'revolutionary' ? (
              <QuantumAITab />
            ) : activeTab === 'shap' ? (
              <SHAPTab />
            ) : activeTab === 'social' ? (
              <SocialTab />
            ) : activeTab === 'news' ? (
              <NewsTab />
            ) : activeTab === 'weather' ? (
              <WeatherTab />
            ) : activeTab === 'injuries' ? (
              <InjuriesTab />
            ) : activeTab === 'streaming' ? (
              <StreamingTab />
            ) : activeTab === 'backtesting' ? (
              <BacktestingTab />
            ) : activeTab === 'settings' ? (
              <SettingsTab />
            ) : (
              <h2 style={{ color: 'var(--cyber-primary)' }}>
                {TABS.find(t => t.id === activeTab)?.label}
              </h2>
            )}
          </div>
        </main>
      </div>
    </div>
  );
  // Sidebar profile block inside main return
  // ...existing code...
                  aria-controls={`tabpanel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  aria-label={tab.label}
                >
                  <div className='item-icon'>{tab.icon}</div>
                  <div className='item-content'>
                    <div className='item-title'>{tab.label}</div>
                  </div>
                  <div className='item-indicator' />
                </button>
              ))}
            </div>
          </nav>
        )}
        <main className='main-content'>
          <div className='tab-content'>
            {activeTab === 'dashboard' ? (
              <DashboardTab />
            ) : activeTab === 'moneymaker' ? (
              <MoneyMakerTab />
            ) : activeTab === 'arbitrage' ? (
              <ArbitrageTab />
            ) : activeTab === 'livebetting' ? (
              <LiveBettingTab />
            ) : activeTab === 'prizepicks' ? (
              <PrizePicksTab />
            ) : activeTab === 'analytics' ? (
              <AnalyticsTab />
            ) : activeTab === 'predictions' ? (
              <PredictionsTab />
            ) : activeTab === 'revolutionary' ? (
              <QuantumAITab />
            ) : activeTab === 'shap' ? (
              <SHAPTab />
            ) : activeTab === 'social' ? (
              <SocialTab />
            ) : activeTab === 'news' ? (
              <NewsTab />
            ) : activeTab === 'weather' ? (
              <WeatherTab />
            ) : activeTab === 'injuries' ? (
              <InjuriesTab />
            ) : activeTab === 'streaming' ? (
              <StreamingTab />
            ) : activeTab === 'backtesting' ? (
              <BacktestingTab />
            ) : activeTab === 'settings' ? (
              <SettingsTab />
            ) : (
              <h2 style={{ color: 'var(--cyber-primary)' }}>
                {TABS.find(t => t.id === activeTab)?.label}
              </h2>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
