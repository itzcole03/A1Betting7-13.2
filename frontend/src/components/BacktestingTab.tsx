import React from 'react';
import './A1BettingPreview.css';

/**
 * BacktestingTab - Provides a strategy simulator and displays historical performance metrics.
 * Used as the Backtesting tab in A1BettingPreview.
 *
 * Accessibility: All major sections have ARIA roles and labels for screen readers.
 *
 * @returns {JSX.Element} Backtesting lab UI
 */
const BacktestingTab: React.FC = (): JSX.Element => (
  <div className='backtesting-tab' role='tabpanel' aria-label='Backtesting Lab'>
    <div className='glass-card'>
      <h3 style={{ padding: '20px', color: 'var(--cyber-primary)' }}>🔬 Backtesting Lab</h3>
      <div style={{ padding: '20px' }}>
        <div className='glass-card' style={{ marginBottom: 20 }}>
          <h4 style={{ color: 'var(--cyber-accent)', padding: '10px 0' }}>Strategy Simulator</h4>
          <div style={{ marginBottom: 10 }}>
            Select a strategy and time period to simulate historical performance.
          </div>
          <form style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <label
              htmlFor='strategy-select'
              style={{
                position: 'absolute',
                left: '-9999px',
                width: 1,
                height: 1,
                overflow: 'hidden',
              }}
            >
              Strategy
            </label>
            <select
              id='strategy-select'
              title='Strategy'
              style={{ padding: 8, borderRadius: 6, border: '1px solid var(--glass-border)' }}
            >
              <option>AI Model Ensemble</option>
              <option>Arbitrage Only</option>
              <option>PrizePicks Optimizer</option>
            </select>
            <label
              htmlFor='start-date'
              style={{
                position: 'absolute',
                left: '-9999px',
                width: 1,
                height: 1,
                overflow: 'hidden',
              }}
            >
              Start Date
            </label>
            <input
              id='start-date'
              type='date'
              title='Start Date'
              placeholder='Start Date'
              style={{ padding: 8, borderRadius: 6, border: '1px solid var(--glass-border)' }}
            />
            <label
              htmlFor='end-date'
              style={{
                position: 'absolute',
                left: '-9999px',
                width: 1,
                height: 1,
                overflow: 'hidden',
              }}
            >
              End Date
            </label>
            <input
              id='end-date'
              type='date'
              title='End Date'
              placeholder='End Date'
              style={{ padding: 8, borderRadius: 6, border: '1px solid var(--glass-border)' }}
            />
            <button className='cyber-btn' type='submit'>
              Run Simulation
            </button>
          </form>
        </div>
        <div className='glass-card'>
          <h4 style={{ color: 'var(--cyber-accent)', padding: '10px 0' }}>Results</h4>
          <div style={{ marginBottom: 10 }}>Simulation results will appear here.</div>
          <div
            className='backtest-results'
            style={{ background: '#181c24', borderRadius: 8, padding: 20, color: '#fff' }}
          >
            <div>
              ROI: <span style={{ color: 'var(--cyber-primary)', fontWeight: 'bold' }}>+18.5%</span>
            </div>
            <div>
              Sharpe Ratio:{' '}
              <span style={{ color: 'var(--cyber-accent)', fontWeight: 'bold' }}>1.42</span>
            </div>
            <div>
              Max Drawdown:{' '}
              <span style={{ color: 'var(--risk-red)', fontWeight: 'bold' }}>-7.2%</span>
            </div>
            <div>
              Win Rate:{' '}
              <span style={{ color: 'var(--cyber-secondary)', fontWeight: 'bold' }}>73.8%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default BacktestingTab;
