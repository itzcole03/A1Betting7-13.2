import React from 'react';
import './A1BettingPreview.css';

/**
 * NewsTab - Displays breaking sports news and market impact analysis.
 * Used as the News Hub tab in A1BettingPreview.
 *
 * Accessibility: All major sections have ARIA roles and labels for screen readers.
 *
 * @returns {JSX.Element} News hub UI
 */
const NewsTab: React.FC = (): JSX.Element => (
  <div className='news-tab' role='tabpanel' aria-label='News Hub'>
    <div className='glass-card'>
      <h3 style={{ padding: '20px', color: 'var(--cyber-primary)' }}>📰 News Hub</h3>
      <div className='grid grid-2' style={{ padding: '20px' }}>
        <div className='glass-card'>
          <h4 style={{ padding: '15px', color: 'var(--cyber-accent)' }}>Breaking Updates</h4>
          <div style={{ padding: '0 15px 15px' }}>
            <div className='news-item'>
              <div style={{ fontWeight: 'bold', marginBottom: 5 }}>
                LeBron James cleared to play tonight
              </div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                Source: ESPN | 7:42 PM
              </div>
            </div>
            <div className='news-item'>
              <div style={{ fontWeight: 'bold', marginBottom: 5 }}>
                Chiefs activate star receiver from IR
              </div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                Source: NFL.com | 7:15 PM
              </div>
            </div>
            <div className='news-item'>
              <div style={{ fontWeight: 'bold', marginBottom: 5 }}>
                Dodgers lineup changes for tonight's game
              </div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                Source: MLB.com | 6:58 PM
              </div>
            </div>
          </div>
        </div>
        <div className='glass-card'>
          <h4 style={{ padding: '15px', color: 'var(--cyber-accent)' }}>Market Impact</h4>
          <div style={{ padding: '0 15px 15px' }}>
            <div className='opportunity-card'>
              <div style={{ fontWeight: 'bold', marginBottom: 10 }}>
                LeBron's return boosts Lakers odds
              </div>
              <div>Line movement: Lakers -2.5 → -4.0</div>
              <div style={{ color: 'var(--cyber-secondary)' }}>
                Market expects strong performance
              </div>
            </div>
            <div className='opportunity-card'>
              <div style={{ fontWeight: 'bold', marginBottom: 10 }}>Chiefs receiver activation</div>
              <div>Line movement: Chiefs -3.5 → -4.5</div>
              <div style={{ color: 'var(--cyber-secondary)' }}>Increased scoring projection</div>
            </div>
            <div className='opportunity-card'>
              <div style={{ fontWeight: 'bold', marginBottom: 10 }}>Dodgers lineup changes</div>
              <div>Line movement: Dodgers +145 → +130</div>
              <div style={{ color: 'var(--cyber-secondary)' }}>Sharps backing Dodgers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default NewsTab;
