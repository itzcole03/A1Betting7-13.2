import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ComprehensiveAdminDashboardProps {
  onToggleUserMode?: () => void;
}

const ComprehensiveAdminDashboard: React.FC<ComprehensiveAdminDashboardProps> = ({
  onToggleUserMode,
}) => {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  // Complete styles from the comprehensive interface
  const styles = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --cyber-primary: #06ffa5;
      --cyber-secondary: #00ff88;
      --cyber-accent: #00d4ff;
      --cyber-purple: #7c3aed;
      --cyber-pink: #f72585;
      --cyber-orange: #ff6b35;
      --cyber-dark: #0f172a;
      --cyber-darker: #020617;
      --cyber-slate: #1e293b;
      --glass-bg: rgba(255, 255, 255, 0.02);
      --glass-border: rgba(255, 255, 255, 0.05);
      --quantum-blue: #4361ee;
      --neural-green: #43aa8b;
      --risk-red: #f72585;
    }

    .comprehensive-admin-root {
      font-family: 'Arial', sans-serif;
      background: linear-gradient(135deg, var(--cyber-darker) 0%, var(--cyber-dark) 50%, #1e293b 100%);
      color: white;
      min-height: 100vh;
      overflow-x: hidden;
    }

    .cyber-bg {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: 
        radial-gradient(circle at 20% 80%, rgba(6, 255, 165, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(124, 58, 237, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(0, 212, 255, 0.05) 0%, transparent 50%);
      z-index: -1;
    }

    .glass-card {
      backdrop-filter: blur(20px) saturate(180%);
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .cyber-glow {
      box-shadow: 0 0 20px rgba(6, 255, 165, 0.3);
      transition: all 0.3s ease;
    }

    .cyber-glow:hover {
      box-shadow: 0 0 30px rgba(6, 255, 165, 0.5);
      transform: translateY(-2px);
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding: 20px;
    }

    .logo {
      font-size: 2.5rem;
      font-weight: bold;
      background: linear-gradient(45deg, var(--cyber-primary), var(--cyber-accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 0 30px rgba(6, 255, 165, 0.5);
    }

    /* Sidebar Navigation */
    .sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 998;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }

    .sidebar-overlay.active {
      opacity: 1;
      visibility: visible;
    }

    .cyber-sidebar {
      position: fixed;
      top: 0;
      left: -400px;
      width: 380px;
      height: 100vh;
      background: linear-gradient(180deg, var(--cyber-darker) 0%, #0f1419 100%);
      border-right: 1px solid var(--cyber-primary);
      box-shadow: 0 0 50px rgba(6, 255, 165, 0.3);
      z-index: 999;
      transition: left 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--cyber-primary) transparent;
    }

    .cyber-sidebar.open {
      left: 0;
    }

    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid var(--glass-border);
      background: linear-gradient(135deg, rgba(6, 255, 165, 0.1), rgba(0, 212, 255, 0.05));
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(45deg, var(--cyber-primary), var(--cyber-accent));
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: var(--cyber-darker);
      font-weight: bold;
      box-shadow: 0 4px 15px rgba(6, 255, 165, 0.4);
    }

    .logo-text {
      font-size: 1.3rem;
      font-weight: bold;
      background: linear-gradient(45deg, var(--cyber-primary), var(--cyber-accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .sidebar-close {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 1.2rem;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sidebar-close:hover {
      background: rgba(255, 107, 53, 0.2);
      border-color: var(--cyber-orange);
      color: var(--cyber-orange);
      transform: rotate(90deg);
    }

    .sidebar-profile {
      padding: 20px;
      border-bottom: 1px solid var(--glass-border);
      background: var(--glass-bg);
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .profile-avatar {
      position: relative;
    }

    .avatar-glow {
      width: 60px;
      height: 60px;
      background: linear-gradient(45deg, var(--cyber-primary), var(--cyber-accent));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      color: var(--cyber-darker);
      font-weight: bold;
      box-shadow: 0 0 20px rgba(6, 255, 165, 0.5);
      animation: pulse 3s infinite;
    }

    .profile-info {
      flex: 1;
    }

    .profile-name {
      font-size: 1.1rem;
      font-weight: bold;
      color: var(--cyber-primary);
      margin-bottom: 4px;
    }

    .profile-tier {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 8px;
    }

    .profile-stats {
      display: flex;
      gap: 12px;
    }

    .profit-indicator {
      background: linear-gradient(45deg, var(--cyber-secondary), var(--neural-green));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 0.9rem;
      font-weight: bold;
    }

    .roi-indicator {
      background: linear-gradient(45deg, var(--cyber-accent), var(--cyber-primary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 0.9rem;
      font-weight: bold;
    }

    .sidebar-menu {
      padding: 10px 0;
      flex: 1;
    }

    .menu-section {
      margin-bottom: 25px;
    }

    .section-title {
      padding: 8px 20px;
      font-size: 0.8rem;
      font-weight: bold;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 15px;
      width: 100%;
      padding: 12px 20px;
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.8);
      text-align: left;
      cursor: pointer;
      transition: all 0.3s ease;
      border-left: 3px solid transparent;
      position: relative;
      overflow: hidden;
    }

    .menu-item::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(6, 255, 165, 0.1), transparent);
      transition: left 0.6s ease;
    }

    .menu-item:hover::before {
      left: 100%;
    }

    .menu-item:hover {
      background: rgba(6, 255, 165, 0.05);
      border-left-color: var(--cyber-primary);
      color: var(--cyber-primary);
      transform: translateX(5px);
    }

    .menu-item.active {
      background: linear-gradient(90deg, rgba(6, 255, 165, 0.15), rgba(0, 212, 255, 0.1));
      border-left-color: var(--cyber-primary);
      color: var(--cyber-primary);
      box-shadow: inset 0 0 20px rgba(6, 255, 165, 0.1);
    }

    .menu-item.active .item-indicator {
      background: var(--cyber-primary);
    }

    .item-icon {
      font-size: 1.2rem;
      min-width: 24px;
      text-align: center;
    }

    .item-content {
      flex: 1;
    }

    .item-title {
      font-size: 0.95rem;
      font-weight: 500;
      margin-bottom: 2px;
    }

    .item-subtitle {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .item-indicator {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transition: all 0.3s ease;
    }

    .item-badge {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: bold;
      text-transform: uppercase;
    }

    .item-badge.hot {
      background: linear-gradient(45deg, var(--cyber-orange), var(--cyber-pink));
      color: white;
      animation: pulse 2s infinite;
    }

    .item-badge.live {
      background: linear-gradient(45deg, var(--risk-red), var(--cyber-orange));
      color: white;
      animation: pulse 1.5s infinite;
    }

    .item-badge.success {
      background: linear-gradient(45deg, var(--cyber-secondary), var(--neural-green));
      color: var(--cyber-darker);
    }

    .item-badge.quantum {
      background: linear-gradient(45deg, var(--quantum-blue), var(--cyber-purple));
      color: white;
      animation: holographic 3s infinite;
    }

    .item-badge.new {
      background: linear-gradient(45deg, var(--cyber-accent), var(--cyber-primary));
      color: var(--cyber-darker);
    }

    .item-badge.warning {
      background: linear-gradient(45deg, var(--cyber-orange), #ffa502);
      color: var(--cyber-darker);
    }

    .item-badge.alert {
      background: linear-gradient(45deg, var(--risk-red), var(--cyber-pink));
      color: white;
      animation: pulse 1s infinite;
    }

    .sidebar-footer {
      padding: 20px;
      border-top: 1px solid var(--glass-border);
      background: var(--glass-bg);
    }

    .quick-actions {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
      justify-content: space-between;
    }

    .quick-action {
      width: 45px;
      height: 45px;
      background: rgba(6, 255, 165, 0.1);
      border: 1px solid var(--glass-border);
      border-radius: 10px;
      color: var(--cyber-primary);
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }

    .quick-action:hover {
      background: var(--cyber-primary);
      color: var(--cyber-darker);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(6, 255, 165, 0.4);
    }

    .system-status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.6);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    .status-dot.online {
      background: var(--cyber-secondary);
    }

    .menu-toggle {
      position: fixed;
      top: 20px;
      left: 20px;
      width: 50px;
      height: 50px;
      background: linear-gradient(45deg, var(--cyber-primary), var(--cyber-accent));
      border: none;
      border-radius: 12px;
      cursor: pointer;
      z-index: 997;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      box-shadow: 0 4px 20px rgba(6, 255, 165, 0.3);
    }

    .menu-toggle:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(6, 255, 165, 0.5);
    }

    .toggle-line {
      width: 20px;
      height: 2px;
      background: var(--cyber-darker);
      border-radius: 1px;
      transition: all 0.3s ease;
    }

    .menu-toggle.open .toggle-line:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }

    .menu-toggle.open .toggle-line:nth-child(2) {
      opacity: 0;
    }

    .menu-toggle.open .toggle-line:nth-child(3) {
      transform: rotate(-45deg) translate(7px, -6px);
    }

    .breadcrumb-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      margin-bottom: 20px;
      backdrop-filter: blur(10px);
    }

    .nav-actions {
      display: flex;
      gap: 10px;
    }

    .action-btn {
      padding: 8px;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 1rem;
    }

        .action-btn:hover {
      background: rgba(6, 255, 165, 0.1);
      color: var(--cyber-primary);
      transform: translateY(-2px);
    }

    .user-mode-toggle {
      position: fixed;
      top: 80px;
      left: 20px;
      background: linear-gradient(45deg, var(--cyber-purple), var(--cyber-pink));
      border: none;
      border-radius: 12px;
      padding: 12px 16px;
      color: white;
      font-weight: bold;
      cursor: pointer;
      z-index: 996;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 20px rgba(124, 58, 237, 0.3);
      font-size: 0.9rem;
    }

    .user-mode-toggle:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(124, 58, 237, 0.5);
      background: linear-gradient(45deg, var(--cyber-pink), var(--cyber-orange));
    }

    .grid {
      display: grid;
      gap: 20px;
      margin-bottom: 30px;
    }

    .grid-2 { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
    .grid-3 { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
    .grid-4 { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }

    .metric-card {
      padding: 20px;
      text-align: center;
    }

    .metric-value {
      font-size: 2.5rem;
      font-weight: bold;
      color: var(--cyber-primary);
      margin-bottom: 5px;
    }

    .metric-label {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }

    .metric-change {
      font-size: 0.8rem;
      margin-top: 5px;
    }

    .positive { color: var(--cyber-secondary); }
    .negative { color: #ff4757; }

    .opportunity-card {
      padding: 20px;
      margin-bottom: 15px;
      position: relative;
      overflow: hidden;
    }

    .opportunity-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .opportunity-title {
      font-weight: bold;
      color: var(--cyber-primary);
    }

    .confidence-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: bold;
    }

    .confidence-high {
      background: var(--cyber-secondary);
      color: var(--cyber-dark);
    }

    .confidence-medium {
      background: var(--cyber-accent);
      color: var(--cyber-dark);
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
      margin: 10px 0;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--cyber-primary), var(--cyber-secondary));
      border-radius: 4px;
      transition: width 1s ease;
    }

    .cyber-button {
      padding: 12px 24px;
      background: linear-gradient(45deg, var(--cyber-primary), var(--cyber-secondary));
      color: var(--cyber-dark);
      border: none;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .cyber-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(6, 255, 165, 0.4);
    }

    .status-indicator {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 8px;
      animation: pulse 2s infinite;
    }

    .status-online { background: var(--cyber-secondary); }
    .status-warning { background: #ffa502; }
    .status-offline { background: #ff4757; }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    .live-feed {
      max-height: 400px;
      overflow-y: auto;
      padding: 20px;
    }

    .feed-item {
      display: flex;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .feed-time {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.8rem;
      margin-right: 15px;
      min-width: 60px;
    }

    .floating-action {
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(45deg, var(--cyber-primary), var(--cyber-secondary));
      border: none;
      color: var(--cyber-dark);
      font-size: 1.5rem;
      cursor: pointer;
      box-shadow: 0 8px 25px rgba(6, 255, 165, 0.4);
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }

    @keyframes holographic {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    .hidden { display: none; }

    .tab-content {
      display: block;
    }

    .tab-content.hidden {
      display: none;
    }

        /* Mobile Optimizations */
    @media (max-width: 768px) {
      .cyber-sidebar {
        width: 100%;
        left: -100%;
      }

      .menu-toggle {
        top: 15px;
        left: 15px;
        width: 45px;
        height: 45px;
      }

      .user-mode-toggle {
        top: 70px;
        left: 15px;
        padding: 10px 12px;
        font-size: 0.8rem;
      }

      .container {
        padding-left: 80px;
      }
    }

    /* Additional styles for comprehensive features */
    .social-sentiment {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: rgba(67, 170, 139, 0.1);
      border-radius: 8px;
      margin: 5px 0;
    }

    .weather-impact {
      background: rgba(0, 212, 255, 0.1);
      border-left: 4px solid var(--cyber-accent);
      padding: 10px;
      margin: 5px 0;
    }

    .prediction-explanation {
      background: rgba(124, 58, 237, 0.1);
      border: 1px solid var(--cyber-purple);
      border-radius: 12px;
      padding: 15px;
      margin: 10px 0;
    }

    .ensemble-model-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 10px;
      padding: 15px;
    }

    .model-status-card {
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      padding: 10px;
      text-align: center;
      transition: all 0.3s ease;
    }

    .model-status-card:hover {
      border-color: var(--cyber-primary);
      box-shadow: 0 0 15px rgba(6, 255, 165, 0.3);
    }

    .arbitrage-scanner {
      border-left: 4px solid var(--cyber-accent);
      background: rgba(0, 212, 255, 0.1);
      padding: 15px;
      margin: 10px 0;
      animation: arbitrage-glow 2s infinite alternate;
    }

    @keyframes arbitrage-glow {
      0% { box-shadow: 0 0 10px rgba(0, 212, 255, 0.3); }
      100% { box-shadow: 0 0 20px rgba(0, 212, 255, 0.6); }
    }

    .kelly-criterion-display {
      background: linear-gradient(45deg, var(--cyber-purple), var(--cyber-pink));
      color: white;
      padding: 10px;
      border-radius: 8px;
      text-align: center;
      margin: 5px 0;
    }

    .bankroll-manager {
      background: linear-gradient(135deg, 
        rgba(6, 255, 165, 0.1) 0%, 
        rgba(0, 255, 136, 0.1) 100%);
      border: 2px solid var(--cyber-secondary);
      border-radius: 16px;
      padding: 20px;
    }

    .injury-analysis {
      background: rgba(255, 107, 53, 0.1);
      border: 1px solid var(--cyber-orange);
      border-radius: 8px;
      padding: 10px;
      margin: 5px 0;
    }
  `;

  // Tab switching function
  const switchTab = (tabName: string) => {
    setCurrentTab(tabName);
    setSidebarOpen(false);
  };

  // Sidebar control functions
  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  // Interactive functions
  const executeQuickBet = () => {
    alert('Best bet executed: Lakers O228.5 | $2,847 stake | Expected: +$1,361');
  };

  const runQuickArbitrage = () => {
    alert('Quick arbitrage found: +5.8% ROI | Warriors spread discrepancy');
  };

  const scanAllBooks = () => {
    alert('All books scanned: 47 edges found | Average ROI: +4.7%');
  };

  const optimizePortfolio = () => {
    alert('Portfolio optimized: +23.7% efficiency gain | Risk reduced by 15%');
  };

  const executeBet = (betId: string) => {
    alert(`Bet executed: ${betId} | Optimal stake placed successfully`);
  };

  const navigateToTab = (tabName: string) => {
    switchTab(tabName);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className='comprehensive-admin-root'>
        <div className='cyber-bg'></div>

        <div className='container'>
          {/* Header */}
          <div className='header glass-card'>
            <div className='logo'>A1BETTING</div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--cyber-primary)', fontWeight: 'bold' }}>$18,420.73</div>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                  Portfolio Value
                </div>
              </div>
              <div className='status-indicator status-online'></div>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>47 AI Models Active</span>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <div
            className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
            onClick={closeSidebar}
          ></div>

          <nav className={`cyber-sidebar ${sidebarOpen ? 'open' : ''}`}>
            {/* Sidebar Header */}
            <div className='sidebar-header'>
              <div className='sidebar-logo'>
                <div className='logo-icon'>⚡</div>
                <div className='logo-text'>A1BETTING</div>
              </div>
              <button className='sidebar-close' onClick={closeSidebar}>
                ×
              </button>
            </div>

            {/* User Profile Section */}
            <div className='sidebar-profile'>
              <div className='profile-avatar'>
                <div className='avatar-glow'>🤖</div>
              </div>
              <div className='profile-info'>
                <div className='profile-name'>AlphaBot</div>
                <div className='profile-tier'>Elite Trader</div>
                <div className='profile-stats'>
                  <span className='profit-indicator'>+$18,420</span>
                  <span className='roi-indicator'>+847%</span>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className='sidebar-menu'>
              {/* Core Section */}
              <div className='menu-section'>
                <div className='section-title'>Core</div>
                <button
                  className={`menu-item ${currentTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => navigateToTab('dashboard')}
                >
                  <div className='item-icon'>📊</div>
                  <div className='item-content'>
                    <div className='item-title'>Dashboard</div>
                    <div className='item-subtitle'>Command Center</div>
                  </div>
                  <div className='item-indicator'></div>
                </button>
              </div>

              {/* Trading Section */}
              <div className='menu-section'>
                <div className='section-title'>Trading</div>
                <button
                  className={`menu-item ${currentTab === 'moneymaker' ? 'active' : ''}`}
                  onClick={() => navigateToTab('moneymaker')}
                >
                  <div className='item-icon'>💎</div>
                  <div className='item-content'>
                    <div className='item-title'>Money Maker</div>
                    <div className='item-subtitle'>Ultimate Optimizer</div>
                  </div>
                  <div className='item-badge hot'>HOT</div>
                </button>
                <button
                  className={`menu-item ${currentTab === 'arbitrage' ? 'active' : ''}`}
                  onClick={() => navigateToTab('arbitrage')}
                >
                  <div className='item-icon'>⚡</div>
                  <div className='item-content'>
                    <div className='item-title'>Arbitrage</div>
                    <div className='item-subtitle'>23 opportunities</div>
                  </div>
                  <div className='item-badge live'>LIVE</div>
                </button>
                <button
                  className={`menu-item ${currentTab === 'livebetting' ? 'active' : ''}`}
                  onClick={() => navigateToTab('livebetting')}
                >
                  <div className='item-icon'>🔴</div>
                  <div className='item-content'>
                    <div className='item-title'>Live Betting</div>
                    <div className='item-subtitle'>In-game action</div>
                  </div>
                </button>
                <button
                  className={`menu-item ${currentTab === 'prizepicks' ? 'active' : ''}`}
                  onClick={() => navigateToTab('prizepicks')}
                >
                  <div className='item-icon'>🎯</div>
                  <div className='item-content'>
                    <div className='item-title'>PrizePicks</div>
                    <div className='item-subtitle'>87% win rate</div>
                  </div>
                </button>
                <button
                  className={`menu-item ${currentTab === 'lineup' ? 'active' : ''}`}
                  onClick={() => navigateToTab('lineup')}
                >
                  <div className='item-icon'>🏀</div>
                  <div className='item-content'>
                    <div className='item-title'>Lineup Builder</div>
                    <div className='item-subtitle'>Smart optimization</div>
                  </div>
                </button>
              </div>

              {/* AI Engine Section */}
              <div className='menu-section'>
                <div className='section-title'>AI Engine</div>
                <button
                  className={`menu-item ${currentTab === 'analytics' ? 'active' : ''}`}
                  onClick={() => navigateToTab('analytics')}
                >
                  <div className='item-icon'>🧠</div>
                  <div className='item-content'>
                    <div className='item-title'>ML Analytics</div>
                    <div className='item-subtitle'>47 models active</div>
                  </div>
                  <div className='item-badge success'>97%</div>
                </button>
                <button
                  className={`menu-item ${currentTab === 'predictions' ? 'active' : ''}`}
                  onClick={() => navigateToTab('predictions')}
                >
                  <div className='item-icon'>🔮</div>
                  <div className='item-content'>
                    <div className='item-title'>AI Predictions</div>
                    <div className='item-subtitle'>Next-gen forecasts</div>
                  </div>
                </button>
                <button
                  className={`menu-item ${currentTab === 'quantum' ? 'active' : ''}`}
                  onClick={() => navigateToTab('quantum')}
                >
                  <div className='item-icon'>⚛️</div>
                  <div className='item-content'>
                    <div className='item-title'>Quantum AI</div>
                    <div className='item-subtitle'>Multiverse analysis</div>
                  </div>
                  <div className='item-badge quantum'>Q</div>
                </button>
                <button
                  className={`menu-item ${currentTab === 'shap' ? 'active' : ''}`}
                  onClick={() => navigateToTab('shap')}
                >
                  <div className='item-icon'>📈</div>
                  <div className='item-content'>
                    <div className='item-title'>SHAP Analysis</div>
                    <div className='item-subtitle'>Explainable AI</div>
                  </div>
                </button>
                <button
                  className={`menu-item ${currentTab === 'historical' ? 'active' : ''}`}
                  onClick={() => navigateToTab('historical')}
                >
                  <div className='item-icon'>📚</div>
                  <div className='item-content'>
                    <div className='item-title'>Historical Data</div>
                    <div className='item-subtitle'>Deep patterns</div>
                  </div>
                </button>
              </div>

              {/* Intelligence Section */}
              <div className='menu-section'>
                <div className='section-title'>Intelligence</div>
                <button
                  className={`menu-item ${currentTab === 'social' ? 'active' : ''}`}
                  onClick={() => navigateToTab('social')}
                >
                  <div className='item-icon'>🌐</div>
                  <div className='item-content'>
                    <div className='item-title'>Social Intel</div>
                    <div className='item-subtitle'>Market sentiment</div>
                  </div>
                </button>
                <button
                  className={`menu-item ${currentTab === 'news' ? 'active' : ''}`}
                  onClick={() => navigateToTab('news')}
                >
                  <div className='item-icon'>📰</div>
                  <div className='item-content'>
                    <div className='item-title'>News Hub</div>
                    <div className='item-subtitle'>Breaking updates</div>
                  </div>
                  <div className='item-badge new'>NEW</div>
                </button>
                <button
                  className={`menu-item ${currentTab === 'weather' ? 'active' : ''}`}
                  onClick={() => navigateToTab('weather')}
                >
                  <div className='item-icon'>🌤️</div>
                  <div className='item-content'>
                    <div className='item-title'>Weather Station</div>
                    <div className='item-subtitle'>Game conditions</div>
                  </div>
                </button>
                <button
                  className={`menu-item ${currentTab === 'injuries' ? 'active' : ''}`}
                  onClick={() => navigateToTab('injuries')}
                >
                  <div className='item-icon'>🏥</div>
                  <div className='item-content'>
                    <div className='item-title'>Injury Tracker</div>
                    <div className='item-subtitle'>Real-time updates</div>
                  </div>
                </button>
                <button
                  className={`menu-item ${currentTab === 'streaming' ? 'active' : ''}`}
                  onClick={() => navigateToTab('streaming')}
                >
                  <div className='item-icon'>📺</div>
                  <div className='item-content'>
                    <div className='item-title'>Live Stream</div>
                    <div className='item-subtitle'>HD broadcasts</div>
                  </div>
                </button>
              </div>

              {/* Management Section */}
              <div className='menu-section'>
                <div className='section-title'>Management</div>
                <button
                  className={`menu-item ${currentTab === 'bankroll' ? 'active' : ''}`}
                  onClick={() => navigateToTab('bankroll')}
                >
                  <div className='item-icon'>💰</div>
                  <div className='item-content'>
                    <div className='item-title'>Bankroll</div>
                    <div className='item-subtitle'>Risk management</div>
                  </div>
                </button>
                <button
                  className={`menu-item ${currentTab === 'risk' ? 'active' : ''}`}
                  onClick={() => navigateToTab('risk')}
                >
                  <div className='item-icon'>⚠️</div>
                  <div className='item-content'>
                    <div className='item-title'>Risk Engine</div>
                    <div className='item-subtitle'>Portfolio protection</div>
                  </div>
                  <div className='item-badge warning'>23%</div>
                </button>
                <button
                  className={`menu-item ${currentTab === 'sportsbooks' ? 'active' : ''}`}
                  onClick={() => navigateToTab('sportsbooks')}
                >
                  <div className='item-icon'>🏦</div>
                  <div className='item-content'>
                    <div className='item-title'>Sportsbooks</div>
                    <div className='item-subtitle'>8 accounts linked</div>
                  </div>
                </button>
                <button
                  className={`menu-item ${currentTab === 'automation' ? 'active' : ''}`}
                  onClick={() => navigateToTab('automation')}
                >
                  <div className='item-icon'>🤖</div>
                  <div className='item-content'>
                    <div className='item-title'>Automation</div>
                    <div className='item-subtitle'>Smart trading</div>
                  </div>
                </button>
                <button
                  className={`menu-item ${currentTab === 'alerts' ? 'active' : ''}`}
                  onClick={() => navigateToTab('alerts')}
                >
                  <div className='item-icon'>🚨</div>
                  <div className='item-content'>
                    <div className='item-title'>Alert Center</div>
                    <div className='item-subtitle'>5 active alerts</div>
                  </div>
                  <div className='item-badge alert'>5</div>
                </button>
              </div>

              {/* Tools Section */}
              <div className='menu-section'>
                <div className='section-title'>Tools</div>
                <button
                  className={`menu-item ${currentTab === 'backtesting' ? 'active' : ''}`}
                  onClick={() => navigateToTab('backtesting')}
                >
                  <div className='item-icon'>📊</div>
                  <div className='item-content'>
                    <div className='item-title'>Backtesting</div>
                    <div className='item-subtitle'>Strategy validation</div>
                  </div>
                </button>
                <button
                  className={`menu-item ${currentTab === 'education' ? 'active' : ''}`}
                  onClick={() => navigateToTab('education')}
                >
                  <div className='item-icon'>🎓</div>
                  <div className='item-content'>
                    <div className='item-title'>Academy</div>
                    <div className='item-subtitle'>Learn & improve</div>
                  </div>
                </button>
                <button
                  className={`menu-item ${currentTab === 'community' ? 'active' : ''}`}
                  onClick={() => navigateToTab('community')}
                >
                  <div className='item-icon'>👥</div>
                  <div className='item-content'>
                    <div className='item-title'>Community</div>
                    <div className='item-subtitle'>847 followers</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className='sidebar-footer'>
              <div className='quick-actions'>
                <button
                  className='quick-action'
                  onClick={runQuickArbitrage}
                  title='Quick Arbitrage'
                >
                  <span>⚡</span>
                </button>
                <button className='quick-action' onClick={executeQuickBet} title='Execute Best Bet'>
                  <span>🎯</span>
                </button>
                <button className='quick-action' title='Risk Check'>
                  <span>⚠️</span>
                </button>
                <button className='quick-action' title='Alerts'>
                  <span>🔔</span>
                </button>
              </div>
              <div className='system-status'>
                <div className='status-dot online'></div>
                <span>All systems operational</span>
              </div>
            </div>
          </nav>

          {/* Menu Toggle Button */}
          <button className={`menu-toggle ${sidebarOpen ? 'open' : ''}`} onClick={openSidebar}>
            <span className='toggle-line'></span>
            <span className='toggle-line'></span>
            <span className='toggle-line'></span>
          </button>

          {/* User Mode Toggle Button */}
          {onToggleUserMode && (
            <button
              className='user-mode-toggle'
              onClick={onToggleUserMode}
              title='Switch to User-Friendly Interface'
            >
              <span>👤</span>
              <span>User Mode</span>
            </button>
          )}

          {/* Breadcrumb Navigation */}
          <div className='breadcrumb-nav'>
            <span id='currentLocation'>
              {currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}
            </span>
            <div className='nav-actions'>
              <button className='action-btn' title='Refresh'>
                🔄
              </button>
              <button className='action-btn' title='Add to Favorites'>
                ⭐
              </button>
              <button className='action-btn' title='Fullscreen'>
                ⛶
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {/* Dashboard Tab */}
          <div className={`tab-content ${currentTab === 'dashboard' ? '' : 'hidden'}`}>
            {/* Enhanced Key Metrics */}
            <div className='grid grid-4'>
              <div className='glass-card metric-card cyber-glow'>
                <div className='metric-value'>72.4%</div>
                <div className='metric-label'>Win Rate</div>
                <div className='metric-change positive'>+2.3% this week</div>
              </div>
              <div className='glass-card metric-card cyber-glow'>
                <div className='metric-value'>$18,420</div>
                <div className='metric-label'>Total Profit</div>
                <div className='metric-change positive'>+$1,240 today</div>
              </div>
              <div className='glass-card metric-card cyber-glow'>
                <div className='metric-value'>91.5%</div>
                <div className='metric-label'>AI Accuracy</div>
                <div className='metric-change positive'>+0.8% improvement</div>
              </div>
              <div className='glass-card metric-card cyber-glow'>
                <div className='metric-value'>23</div>
                <div className='metric-label'>Live Opportunities</div>
                <div className='metric-change positive'>+7 new</div>
              </div>
            </div>

            {/* Advanced Dashboard Widgets */}
            <div className='grid grid-3' style={{ marginBottom: '30px' }}>
              <div className='glass-card'>
                <h4 style={{ padding: '15px', color: 'var(--cyber-primary)' }}>🔥 Hot Streaks</h4>
                <div style={{ padding: '0 15px 15px' }}>
                  <div className='opportunity-card'>
                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>NBA Player Props</div>
                    <div style={{ margin: '5px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Win Streak</span>
                        <span style={{ color: 'var(--cyber-secondary)' }}>12 games</span>
                      </div>
                      <div className='progress-bar'>
                        <div className='progress-fill' style={{ width: '88%' }}></div>
                      </div>
                    </div>
                    <div style={{ color: 'var(--cyber-secondary)', fontSize: '0.9rem' }}>
                      ROI: +247.8% this month
                    </div>
                  </div>

                  <div className='social-sentiment'>
                    <div>⚡</div>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>NFL Spreads</div>
                      <div style={{ fontSize: '0.8rem' }}>8-game hot streak | +89.3% ROI</div>
                    </div>
                  </div>

                  <div className='weather-impact'>
                    <div style={{ fontWeight: 'bold' }}>Arbitrage Scanner</div>
                    <div>47 opportunities found today</div>
                    <div style={{ color: 'var(--cyber-secondary)' }}>Average ROI: +4.7%</div>
                  </div>
                </div>
              </div>

              <div className='glass-card'>
                <h4 style={{ padding: '15px', color: 'var(--cyber-primary)' }}>
                  📊 Performance Analytics
                </h4>
                <div style={{ padding: '0 15px 15px' }}>
                  <div
                    style={{
                      height: '150px',
                      background:
                        'linear-gradient(45deg, rgba(6, 255, 165, 0.1), rgba(0, 212, 255, 0.1))',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        color: 'var(--cyber-secondary)',
                        fontSize: '0.8rem',
                      }}
                    >
                      Daily ROI Trend
                    </div>
                    📈 Real-time Chart
                  </div>

                  <div className='ensemble-model-grid' style={{ marginTop: '15px' }}>
                    <div className='model-status-card'>
                      <div style={{ fontSize: '0.9rem', marginBottom: '5px' }}>Today</div>
                      <div style={{ color: 'var(--cyber-secondary)', fontWeight: 'bold' }}>
                        +47.8%
                      </div>
                    </div>
                    <div className='model-status-card'>
                      <div style={{ fontSize: '0.9rem', marginBottom: '5px' }}>This Week</div>
                      <div style={{ color: 'var(--cyber-secondary)', fontWeight: 'bold' }}>
                        +184.2%
                      </div>
                    </div>
                    <div className='model-status-card'>
                      <div style={{ fontSize: '0.9rem', marginBottom: '5px' }}>This Month</div>
                      <div style={{ color: 'var(--cyber-secondary)', fontWeight: 'bold' }}>
                        +689.7%
                      </div>
                    </div>
                    <div className='model-status-card'>
                      <div style={{ fontSize: '0.9rem', marginBottom: '5px' }}>All Time</div>
                      <div style={{ color: 'var(--cyber-secondary)', fontWeight: 'bold' }}>
                        +2,847%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className='glass-card'>
                <h4 style={{ padding: '15px', color: 'var(--cyber-primary)' }}>⚡ Quick Actions</h4>
                <div style={{ padding: '0 15px 15px' }}>
                  <button
                    className='cyber-button'
                    style={{ width: '100%', marginBottom: '10px' }}
                    onClick={executeQuickBet}
                  >
                    🎯 Execute Best Bet
                  </button>
                  <button
                    className='cyber-button'
                    style={{ width: '100%', marginBottom: '10px' }}
                    onClick={runQuickArbitrage}
                  >
                    ⚡ Find Arbitrage
                  </button>
                  <button
                    className='cyber-button'
                    style={{ width: '100%', marginBottom: '10px' }}
                    onClick={scanAllBooks}
                  >
                    🔍 Scan All Books
                  </button>
                  <button
                    className='cyber-button'
                    style={{ width: '100%', marginBottom: '10px' }}
                    onClick={optimizePortfolio}
                  >
                    📊 Optimize Portfolio
                  </button>

                  <div className='prediction-explanation' style={{ marginTop: '15px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                      AI Recommendations
                    </div>
                    <div style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                      <div>💡 Increase NBA exposure by 15%</div>
                      <div>⚠️ Reduce same-game parlays</div>
                      <div>🎯 Focus on arbitrage opportunities</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Opportunities Enhanced */}
            <div className='grid grid-2'>
              <div className='glass-card'>
                <h3 style={{ padding: '20px 20px 0', color: 'var(--cyber-primary)' }}>
                  🎯 Elite Opportunities
                </h3>
                <div>
                  <div className='opportunity-card cyber-glow'>
                    <div className='opportunity-header'>
                      <div className='opportunity-title'>Lakers vs Warriors O/U 228.5</div>
                      <div className='confidence-badge confidence-high'>96% Confidence</div>
                    </div>
                    <div>
                      Expected Value:{' '}
                      <span style={{ color: 'var(--cyber-secondary)' }}>+12.3%</span>
                    </div>
                    <div
                      style={{
                        margin: '5px 0',
                        fontSize: '0.8rem',
                        color: 'rgba(255, 255, 255, 0.8)',
                      }}
                    >
                      Kelly: 18.4% | Sharpe: 3.42 | Model Consensus: 47/47
                    </div>
                    <div className='progress-bar'>
                      <div className='progress-fill' style={{ width: '96%' }}></div>
                    </div>
                    <button
                      className='cyber-button'
                      style={{ marginTop: '8px', fontSize: '0.8rem', padding: '6px 12px' }}
                      onClick={() => executeBet('lakers-warriors-total')}
                    >
                      Execute Bet
                    </button>
                  </div>

                  <div className='opportunity-card'>
                    <div className='opportunity-header'>
                      <div className='opportunity-title'>Chiefs -3.5 vs Bills</div>
                      <div className='confidence-badge confidence-high'>94% Confidence</div>
                    </div>
                    <div>
                      Expected Value: <span style={{ color: 'var(--cyber-secondary)' }}>+8.7%</span>
                    </div>
                    <div
                      style={{
                        margin: '5px 0',
                        fontSize: '0.8rem',
                        color: 'rgba(255, 255, 255, 0.8)',
                      }}
                    >
                      Kelly: 12.7% | Sharpe: 2.89 | Model Consensus: 44/47
                    </div>
                    <div className='progress-bar'>
                      <div className='progress-fill' style={{ width: '94%' }}></div>
                    </div>
                    <button
                      className='cyber-button'
                      style={{ marginTop: '8px', fontSize: '0.8rem', padding: '6px 12px' }}
                      onClick={() => executeBet('chiefs-bills-spread')}
                    >
                      Execute Bet
                    </button>
                  </div>

                  <div className='opportunity-card'>
                    <div className='opportunity-header'>
                      <div className='opportunity-title'>Dodgers ML +145</div>
                      <div className='confidence-badge confidence-medium'>87% Confidence</div>
                    </div>
                    <div>
                      Expected Value: <span style={{ color: 'var(--cyber-secondary)' }}>+6.2%</span>
                    </div>
                    <div
                      style={{
                        margin: '5px 0',
                        fontSize: '0.8rem',
                        color: 'rgba(255, 255, 255, 0.8)',
                      }}
                    >
                      Kelly: 8.9% | Sharpe: 2.14 | Model Consensus: 38/47
                    </div>
                    <div className='progress-bar'>
                      <div className='progress-fill' style={{ width: '87%' }}></div>
                    </div>
                    <button
                      className='cyber-button'
                      style={{ marginTop: '8px', fontSize: '0.8rem', padding: '6px 12px' }}
                      onClick={() => executeBet('dodgers-ml')}
                    >
                      Execute Bet
                    </button>
                  </div>
                </div>
              </div>

              <div className='glass-card'>
                <h3 style={{ padding: '20px 20px 0', color: 'var(--cyber-primary)' }}>
                  📡 Live Intelligence Feed
                </h3>
                <div className='live-feed'>
                  <div className='feed-item'>
                    <div className='feed-time'>14:32</div>
                    <div>🎯 New arbitrage opportunity detected: +5.2% ROI</div>
                  </div>
                  <div className='feed-item'>
                    <div className='feed-time'>14:30</div>
                    <div>🤖 Neural Network #23 updated prediction confidence to 96%</div>
                  </div>
                  <div className='feed-item'>
                    <div className='feed-time'>14:28</div>
                    <div>💰 Bet placed successfully: $500 on Lakers O/U</div>
                  </div>
                  <div className='feed-item'>
                    <div className='feed-time'>14:25</div>
                    <div>📊 Model accuracy increased by 0.3% this hour</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Money Maker Tab */}
          <div className={`tab-content ${currentTab === 'moneymaker' ? '' : 'hidden'}`}>
            <div className='glass-card'>
              <h3 style={{ padding: '20px', color: 'var(--cyber-primary)' }}>
                💰 Ultimate Money Maker Enhanced
              </h3>
              <div className='grid grid-3' style={{ padding: '20px' }}>
                <div className='glass-card'>
                  <h4 style={{ padding: '15px', color: 'var(--cyber-primary)' }}>
                    Advanced Configuration
                  </h4>
                  <div style={{ padding: '0 15px 15px' }}>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Strategy Engine:</label>
                      <select
                        style={{
                          width: '100%',
                          padding: '10px',
                          marginTop: '5px',
                          background: 'var(--glass-bg)',
                          border: '1px solid var(--glass-border)',
                          color: 'white',
                          borderRadius: '8px',
                        }}
                      >
                        <option value='kelly'>Kelly Criterion Optimization</option>
                        <option value='evolutionary'>Evolutionary Algorithm</option>
                        <option value='ensemble'>Ensemble Model Selection</option>
                        <option value='clustering'>Clustering-Based Strategy</option>
                        <option value='quantum'>Quantum Portfolio Theory</option>
                      </select>
                    </div>
                    <button
                      className='cyber-button'
                      style={{ width: '100%' }}
                      onClick={() =>
                        alert(
                          'Ultimate Money Maker optimization complete: +847% ROI strategy generated'
                        )
                      }
                    >
                      🚀 Run Ultimate Optimizer
                    </button>
                  </div>
                </div>

                <div className='glass-card'>
                  <h4 style={{ padding: '15px', color: 'var(--cyber-primary)' }}>
                    Best Bet Selector
                  </h4>
                  <div style={{ padding: '0 15px 15px' }}>
                    <div className='opportunity-card'>
                      <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                        🏆 #1 Optimal Bet
                      </div>
                      <div
                        style={{
                          margin: '5px 0',
                          padding: '10px',
                          background:
                            'linear-gradient(135deg, rgba(6, 255, 165, 0.2), rgba(0, 255, 136, 0.1))',
                          borderRadius: '8px',
                          border: '1px solid var(--cyber-secondary)',
                        }}
                      >
                        <div style={{ fontWeight: 'bold' }}>Lakers vs Warriors - Over 228.5</div>
                        <div style={{ color: 'var(--cyber-secondary)' }}>Expected ROI: +47.8%</div>
                        <div style={{ fontSize: '0.9rem' }}>Stake: $2,847 | Profit: +$1,361</div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                          Kelly: 28.47% | Sharpe: 3.42 | Win%: 96.2%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='glass-card'>
                  <h4 style={{ padding: '15px', color: 'var(--cyber-primary)' }}>
                    Portfolio Optimizer
                  </h4>
                  <div style={{ padding: '0 15px 15px' }}>
                    <div style={{ textAlign: 'center', margin: '15px 0' }}>
                      <div
                        style={{
                          fontSize: '2rem',
                          fontWeight: 'bold',
                          color: 'var(--cyber-secondary)',
                        }}
                      >
                        +$4,847
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Expected Daily Profit</div>
                    </div>

                    <div className='bankroll-manager' style={{ marginTop: '15px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Risk Metrics</div>
                      <div>Portfolio Beta: 1.23</div>
                      <div>Sharpe Ratio: 4.17</div>
                      <div>Max Drawdown: -12.8%</div>
                      <div>Win Rate: 73.4%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Arbitrage Tab */}
          <div className={`tab-content ${currentTab === 'arbitrage' ? '' : 'hidden'}`}>
            <div className='glass-card'>
              <h3 style={{ padding: '20px', color: 'var(--cyber-primary)' }}>
                ⚡ Arbitrage Scanner
              </h3>
              <div style={{ padding: '0 20px 20px' }}>
                <div className='arbitrage-scanner'>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '15px',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                      Real-Time Arbitrage Detection
                    </div>
                    <div style={{ color: 'var(--cyber-accent)', fontWeight: 'bold' }}>
                      Scanner Status: ACTIVE
                    </div>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    Scanning 23 sportsbooks | 1,247 markets | 89ms latency
                  </div>
                </div>

                <div className='opportunity-card cyber-glow'>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>Lakers vs Warriors - Total Points</div>
                    <div style={{ color: 'var(--cyber-secondary)', fontWeight: 'bold' }}>
                      +5.2% ROI
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      marginBottom: '10px',
                    }}
                  >
                    <div>DraftKings: Over 228.5 (+110)</div>
                    <div>FanDuel: Under 229.5 (-105)</div>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Stake Distribution: $547 / $453 | Total Profit: $52 | Duration: 12min
                  </div>
                  <button
                    className='cyber-button'
                    style={{ marginTop: '10px', fontSize: '0.9rem' }}
                    onClick={() => alert('Arbitrage executed: +$52 guaranteed profit')}
                  >
                    Execute Arbitrage
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Other tabs would go here with similar structure... */}
          {/* For now, showing placeholder for other tabs */}
          {currentTab !== 'dashboard' &&
            currentTab !== 'moneymaker' &&
            currentTab !== 'arbitrage' && (
              <div className='glass-card'>
                <div style={{ padding: '60px', textAlign: 'center' }}>
                  <h2 style={{ color: 'var(--cyber-primary)', marginBottom: '20px' }}>
                    {currentTab.charAt(0).toUpperCase() + currentTab.slice(1)} Coming Soon
                  </h2>
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    This advanced feature is currently under development and will be available soon.
                  </p>
                  <button
                    className='cyber-button'
                    style={{ marginTop: '20px' }}
                    onClick={() => setCurrentTab('dashboard')}
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            )}
        </div>

        {/* Floating Action Button */}
        <button className='floating-action'>🤖</button>
      </div>
    </>
  );
};

export default ComprehensiveAdminDashboard;
