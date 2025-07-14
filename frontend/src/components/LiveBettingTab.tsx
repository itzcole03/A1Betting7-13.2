import React from 'react';
import './A1BettingPreview.css';

/**
 * LiveBettingTab - Displays live games, odds, and a real-time feed for in-play betting.
 * Used as the Live Betting tab in A1BettingPreview.
 */
const LiveBettingTab: React.FC = () => (
  <div className='livebetting-tab'>
    <div className='glass-card'>
      <h3 style={{ padding: '20px', color: 'var(--cyber-primary)' }}>🔴 Live Betting Center</h3>
      <div className='grid grid-2' style={{ padding: '20px' }}>
        <div className='glass-card'>
          <h4 style={{ padding: '15px', color: 'var(--cyber-accent)' }}>Live Games</h4>
          <div style={{ padding: '0 15px 15px' }}>
            <div className='opportunity-card cyber-glow'>
              <div style={{ fontWeight: 'bold', marginBottom: 10 }}>Lakers vs Warriors</div>
              <div>Current Line: Over 228.5</div>
              <div style={{ color: 'var(--cyber-secondary)' }}>Score: 89 - 84 (Q3 8:42)</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                Live Odds: +110 / -105
              </div>
              <button className='cyber-button' style={{ marginTop: 10, fontSize: '0.9rem' }}>
                Bet Live
              </button>
            </div>
            <div className='opportunity-card'>
              <div style={{ fontWeight: 'bold', marginBottom: 10 }}>Chiefs vs Bills</div>
              <div>Current Line: Chiefs -3.5</div>
              <div style={{ color: 'var(--cyber-secondary)' }}>Score: 17 - 14 (Q2 2:15)</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                Live Odds: -110 / +105
              </div>
              <button className='cyber-button' style={{ marginTop: 10, fontSize: '0.9rem' }}>
                Bet Live
              </button>
            </div>
          </div>
        </div>
        <div className='glass-card'>
          <h4 style={{ padding: '15px', color: 'var(--cyber-accent)' }}>Live Feed</h4>
          <div className='live-feed' style={{ padding: '0 15px 15px' }}>
            <div className='feed-item'>
              <span className='feed-time'>Q3 8:42</span>
              <span>Lakers 89 - Warriors 84 | Over 228.5 in play</span>
            </div>
            <div className='feed-item'>
              <span className='feed-time'>Q2 2:15</span>
              <span>Chiefs 17 - Bills 14 | Chiefs -3.5 in play</span>
            </div>
            <div className='feed-item'>
              <span className='feed-time'>Q1 12:00</span>
              <span>Dodgers 0 - Giants 0 | Moneyline open</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default LiveBettingTab;
