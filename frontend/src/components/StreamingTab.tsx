import React from 'react';
import './A1BettingPreview.css';

/**
 * StreamingTab - Displays live and upcoming sports streams for in-play betting.
 * Used as the Live Stream tab in A1BettingPreview.
 *
 * Accessibility: All major sections have ARIA roles and labels for screen readers.
 *
 * @returns {JSX.Element} Live streaming UI
 */
const StreamingTab: React.FC = (): JSX.Element => (
  <div className='streaming-tab' role='tabpanel' aria-label='Live Stream'>
    <div className='glass-card'>
      <h3 style={{ padding: '20px', color: 'var(--cyber-primary)' }}>📺 Live Streaming</h3>
      <div style={{ padding: '20px' }}>
        <div className='streaming-section'>
          <div className='glass-card' style={{ marginBottom: 20 }}>
            <h4 style={{ color: 'var(--cyber-accent)', padding: '10px 0' }}>Featured Game</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div
                style={{
                  width: 320,
                  height: 180,
                  background: '#111',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                {/* Placeholder for embedded stream */}
                <span>Video Stream Placeholder</span>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 18 }}>Lakers vs. Warriors</div>
                <div style={{ color: 'var(--cyber-secondary)' }}>NBA - Live 3rd Qtr</div>
                <div style={{ marginTop: 10 }}>
                  Score: <span style={{ fontWeight: 'bold' }}>88 - 84</span>
                </div>
                <div style={{ marginTop: 10, color: 'var(--cyber-accent)' }}>
                  Watch live and bet in real time!
                </div>
              </div>
            </div>
          </div>
          <div className='glass-card'>
            <h4 style={{ color: 'var(--cyber-accent)', padding: '10px 0' }}>Upcoming Streams</h4>
            <ul style={{ paddingLeft: 20 }}>
              <li>Chiefs vs. Bills (NFL) - 8:20pm ET</li>
              <li>Yankees vs. Red Sox (MLB) - 7:05pm ET</li>
              <li>Barcelona vs. Real Madrid (Soccer) - 3:00pm ET</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default StreamingTab;
