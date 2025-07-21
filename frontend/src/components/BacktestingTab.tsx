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
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <div className='backtesting-tab' role='tabpanel' aria-label='Backtesting Lab'>
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='glass-card'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <h3 style={{ padding: '20px', color: 'var(--cyber-primary)' }}>🔬 Backtesting Lab</h3>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div style={{ padding: '20px' }}>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='glass-card' style={{ marginBottom: 20 }}>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h4 style={{ color: 'var(--cyber-accent)', padding: '10px 0' }}>Strategy Simulator</h4>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div style={{ marginBottom: 10 }}>
            Select a strategy and time period to simulate historical performance.
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <form style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <select
              id='strategy-select'
              title='Strategy'
              style={{ padding: 8, borderRadius: 6, border: '1px solid var(--glass-border)' }}
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option>AI Model Ensemble</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option>Arbitrage Only</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option>PrizePicks Optimizer</option>
            </select>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <input
              id='start-date'
              type='date'
              title='Start Date'
              placeholder='Start Date'
              style={{ padding: 8, borderRadius: 6, border: '1px solid var(--glass-border)' }}
            />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <input
              id='end-date'
              type='date'
              title='End Date'
              placeholder='End Date'
              style={{ padding: 8, borderRadius: 6, border: '1px solid var(--glass-border)' }}
            />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <button className='cyber-btn' type='submit'>
              Run Simulation
            </button>
          </form>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='glass-card'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h4 style={{ color: 'var(--cyber-accent)', padding: '10px 0' }}>Results</h4>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div style={{ marginBottom: 10 }}>Simulation results will appear here.</div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className='backtest-results'
            style={{ background: '#181c24', borderRadius: 8, padding: 20, color: '#fff' }}
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              ROI: <span style={{ color: 'var(--cyber-primary)', fontWeight: 'bold' }}>+18.5%</span>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              Sharpe Ratio:{' '}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span style={{ color: 'var(--cyber-accent)', fontWeight: 'bold' }}>1.42</span>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              Max Drawdown:{' '}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span style={{ color: 'var(--risk-red)', fontWeight: 'bold' }}>-7.2%</span>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              Win Rate:{' '}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span style={{ color: 'var(--cyber-secondary)', fontWeight: 'bold' }}>73.8%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default BacktestingTab;
