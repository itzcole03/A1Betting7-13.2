import React from 'react';
import './A1BettingPreview.css';

/**
 * LiveBettingTab - Displays live games, odds, and a real-time feed for in-play betting.
 * Used as the Live Betting tab in A1BettingPreview.
 */
const LiveBettingTab: React.FC = () => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <div className='livebetting-tab'>
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='glass-card'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <h3 style={{ padding: '20px', color: 'var(--cyber-primary)' }}>🔴 Live Betting Center</h3>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid grid-2' style={{ padding: '20px' }}>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='glass-card'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h4 style={{ padding: '15px', color: 'var(--cyber-accent)' }}>Live Games</h4>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div style={{ padding: '0 15px 15px' }}>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='opportunity-card cyber-glow'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div style={{ fontWeight: 'bold', marginBottom: 10 }}>Lakers vs Warriors</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>Current Line: Over 228.5</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div style={{ color: 'var(--cyber-secondary)' }}>Score: 89 - 84 (Q3 8:42)</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                Live Odds: +110 / -105
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <button className='cyber-button' style={{ marginTop: 10, fontSize: '0.9rem' }}>
                Bet Live
              </button>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='opportunity-card'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div style={{ fontWeight: 'bold', marginBottom: 10 }}>Chiefs vs Bills</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>Current Line: Chiefs -3.5</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div style={{ color: 'var(--cyber-secondary)' }}>Score: 17 - 14 (Q2 2:15)</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                Live Odds: -110 / +105
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <button className='cyber-button' style={{ marginTop: 10, fontSize: '0.9rem' }}>
                Bet Live
              </button>
            </div>
          </div>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='glass-card'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h4 style={{ padding: '15px', color: 'var(--cyber-accent)' }}>Live Feed</h4>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='live-feed' style={{ padding: '0 15px 15px' }}>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='feed-item'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='feed-time'>Q3 8:42</span>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span>Lakers 89 - Warriors 84 | Over 228.5 in play</span>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='feed-item'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='feed-time'>Q2 2:15</span>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span>Chiefs 17 - Bills 14 | Chiefs -3.5 in play</span>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='feed-item'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='feed-time'>Q1 12:00</span>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span>Dodgers 0 - Giants 0 | Moneyline open</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default LiveBettingTab;
