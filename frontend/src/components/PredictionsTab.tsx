import React from 'react';
import './A1BettingPreview.css';

/**
 * PredictionsTab - Displays AI predictions, model insights, and consensus for today's games.
 * Used as the AI Predictions tab in A1BettingPreview.
 */
const PredictionsTab: React.FC = () => (
  <div className='predictions-tab'>
    <div className='glass-card'>
      <h3 style={{ padding: '20px', color: 'var(--cyber-primary)' }}>🤖 AI Predictions Engine</h3>
      <div className='grid grid-2' style={{ padding: '20px' }}>
        <div className='glass-card'>
          <h4 style={{ padding: '15px', color: 'var(--cyber-accent)' }}>Today's Predictions</h4>
          <div style={{ padding: '0 15px 15px' }}>
            <div className='opportunity-card'>
              <div style={{ fontWeight: 'bold' }}>Lakers vs Warriors</div>
              <div>
                Prediction: <span style={{ color: 'var(--cyber-primary)' }}>Over 228.5</span>
              </div>
              <div>Confidence: 96% | Expected ROI: +12.3%</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                ML Model Consensus: 47/47 models agree
              </div>
            </div>
            <div className='opportunity-card'>
              <div style={{ fontWeight: 'bold' }}>Chiefs vs Bills</div>
              <div>
                Prediction: <span style={{ color: 'var(--cyber-primary)' }}>Chiefs -3.5</span>
              </div>
              <div>Confidence: 94% | Expected ROI: +8.7%</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                ML Model Consensus: 44/47 models agree
              </div>
            </div>
          </div>
        </div>
        <div className='glass-card'>
          <h4 style={{ padding: '15px', color: 'var(--cyber-accent)' }}>Model Insights</h4>
          <div style={{ padding: '0 15px 15px' }}>
            <div style={{ marginBottom: 15 }}>
              <div style={{ color: 'rgba(255,255,255,0.8)' }}>Weather Impact:</div>
              <div style={{ color: 'var(--cyber-secondary)' }}>+3.2% edge detected</div>
            </div>
            <div style={{ marginBottom: 15 }}>
              <div style={{ color: 'rgba(255,255,255,0.8)' }}>Injury Analysis:</div>
              <div style={{ color: 'var(--cyber-secondary)' }}>Key player status updated</div>
            </div>
            <div style={{ marginBottom: 15 }}>
              <div style={{ color: 'rgba(255,255,255,0.8)' }}>Historical Patterns:</div>
              <div style={{ color: 'var(--cyber-secondary)' }}>89% correlation found</div>
            </div>
            <div style={{ marginBottom: 15 }}>
              <div style={{ color: 'rgba(255,255,255,0.8)' }}>Sentiment Analysis:</div>
              <div style={{ color: 'var(--cyber-secondary)' }}>Bullish sentiment: 76%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default PredictionsTab;
