import React from 'react';
import './A1BettingPreview.css';

/**
 * InjuriesTab - Displays real-time injury updates and impact analysis for games.
 * Used as the Injury Tracker tab in A1BettingPreview.
 *
 * Accessibility: All major sections have ARIA roles and labels for screen readers.
 *
 * @returns {JSX.Element} Injury tracker UI
 */
const InjuriesTab: React.FC = (): JSX.Element => (
  <div className='injuries-tab' role='tabpanel' aria-label='Injury Tracker'>
    <div className='glass-card'>
      <h3 style={{ padding: '20px', color: 'var(--cyber-primary)' }}>🏥 Injury Tracker</h3>
      <div className='grid grid-2' style={{ padding: '20px' }}>
        <div className='glass-card'>
          <h4 style={{ padding: '15px', color: 'var(--cyber-accent)' }}>Real-Time Updates</h4>
          <div style={{ padding: '0 15px 15px' }}>
            <div className='injury-analysis'>
              <div style={{ fontWeight: 'bold' }}>LeBron James</div>
              <div>Status: Probable (ankle)</div>
              <div style={{ color: 'var(--cyber-secondary)' }}>Expected to play</div>
            </div>
            <div className='injury-analysis'>
              <div style={{ fontWeight: 'bold' }}>Chiefs WR Tyreek Hill</div>
              <div>Status: Activated from IR</div>
              <div style={{ color: 'var(--cyber-secondary)' }}>Full participant in practice</div>
            </div>
            <div className='injury-analysis'>
              <div style={{ fontWeight: 'bold' }}>Dodgers SP Walker Buehler</div>
              <div>Status: Out (elbow)</div>
              <div style={{ color: 'var(--risk-red)' }}>Will not pitch tonight</div>
            </div>
          </div>
        </div>
        <div className='glass-card'>
          <h4 style={{ padding: '15px', color: 'var(--cyber-accent)' }}>Impact Analysis</h4>
          <div style={{ padding: '0 15px 15px' }}>
            <div className='opportunity-card'>
              <div style={{ fontWeight: 'bold', marginBottom: 10 }}>LeBron's status</div>
              <div>Line movement: Lakers -2.5 → -4.0</div>
              <div style={{ color: 'var(--cyber-secondary)' }}>Market expects him to play</div>
            </div>
            <div className='opportunity-card'>
              <div style={{ fontWeight: 'bold', marginBottom: 10 }}>Tyreek Hill activation</div>
              <div>Line movement: Chiefs -3.5 → -4.5</div>
              <div style={{ color: 'var(--cyber-secondary)' }}>
                Boosts Chiefs' scoring projection
              </div>
            </div>
            <div className='opportunity-card'>
              <div style={{ fontWeight: 'bold', marginBottom: 10 }}>Buehler out</div>
              <div>Line movement: Dodgers +145 → +160</div>
              <div style={{ color: 'var(--risk-red)' }}>Dodgers pitching depth tested</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default InjuriesTab;
