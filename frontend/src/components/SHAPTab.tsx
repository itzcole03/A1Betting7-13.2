import React from 'react';
import './A1BettingPreview.css';

/**
 * SHAPTab - Displays SHAP explainable AI visualizations and feature importance for predictions.
 * Used as the SHAP Analysis tab in A1BettingPreview.
 *
 * Accessibility: All major sections have ARIA roles and labels for screen readers.
 *
 * @returns {JSX.Element} SHAP explainability UI
 */
const SHAPTab: React.FC = (): JSX.Element => (
  <div className='shap-tab' role='tabpanel' aria-label='SHAP Analysis'>
    <div className='glass-card'>
      <h3 style={{ padding: '20px', color: 'var(--cyber-primary)' }}>🧠 SHAP Explainable AI</h3>
      <div className='grid grid-2' style={{ padding: '20px' }}>
        <div className='glass-card'>
          <h4 style={{ padding: '15px', color: 'var(--neural-green)' }}>Model Interpretability</h4>
          <div style={{ padding: '0 15px 15px' }}>
            <div className='shap-visualization'>
              <div style={{ fontWeight: 'bold', color: 'white' }}>94%</div>
            </div>
            <div className='prediction-explanation'>
              <div style={{ fontWeight: 'bold', marginBottom: 10 }}>
                Lakers vs Warriors - Over 228.5
              </div>
              <div style={{ margin: '5px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Team Average PPG</span>
                  <span style={{ color: 'var(--cyber-secondary)' }}>+18.4</span>
                </div>
                <div className='progress-bar' style={{ height: 4 }}>
                  <div className='progress-fill' style={{ width: '85%' }}></div>
                </div>
              </div>
              <div style={{ margin: '5px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Pace Factor</span>
                  <span style={{ color: 'var(--cyber-secondary)' }}>+12.7</span>
                </div>
                <div className='progress-bar' style={{ height: 4 }}>
                  <div className='progress-fill' style={{ width: '70%' }}></div>
                </div>
              </div>
              <div style={{ margin: '5px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Defense Rating</span>
                  <span style={{ color: 'var(--cyber-orange)' }}>-8.3</span>
                </div>
                <div className='progress-bar' style={{ height: 4 }}>
                  <div
                    className='progress-fill'
                    style={{ width: '45%', background: 'var(--cyber-orange)' }}
                  ></div>
                </div>
              </div>
              <div style={{ margin: '5px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Weather Impact</span>
                  <span style={{ color: 'var(--cyber-secondary)' }}>+5.2</span>
                </div>
                <div className='progress-bar' style={{ height: 4 }}>
                  <div className='progress-fill' style={{ width: '30%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='glass-card'>
          <h4 style={{ padding: '15px', color: 'var(--neural-green)' }}>Feature Importance</h4>
          <div style={{ padding: '0 15px 15px' }}>
            <div className='ensemble-model-grid'>
              <div className='model-status-card'>
                <div style={{ fontSize: '0.9rem', marginBottom: 5 }}>Historical Trends</div>
                <div style={{ color: 'var(--cyber-primary)', fontWeight: 'bold' }}>89.3%</div>
              </div>
              <div className='model-status-card'>
                <div style={{ fontSize: '0.9rem', marginBottom: 5 }}>Player Props</div>
                <div style={{ color: 'var(--cyber-primary)', fontWeight: 'bold' }}>76.8%</div>
              </div>
              <div className='model-status-card'>
                <div style={{ fontSize: '0.9rem', marginBottom: 5 }}>Team Stats</div>
                <div style={{ color: 'var(--cyber-primary)', fontWeight: 'bold' }}>92.1%</div>
              </div>
              <div className='model-status-card'>
                <div style={{ fontSize: '0.9rem', marginBottom: 5 }}>Weather Data</div>
                <div style={{ color: 'var(--cyber-primary)', fontWeight: 'bold' }}>43.7%</div>
              </div>
              <div className='model-status-card'>
                <div style={{ fontSize: '0.9rem', marginBottom: 5 }}>Injury Report</div>
                <div style={{ color: 'var(--cyber-primary)', fontWeight: 'bold' }}>67.9%</div>
              </div>
              <div className='model-status-card'>
                <div style={{ fontSize: '0.9rem', marginBottom: 5 }}>Social Sentiment</div>
                <div style={{ color: 'var(--cyber-primary)', fontWeight: 'bold' }}>54.2%</div>
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 10 }}>Risk Assessment Matrix</div>
              <div className='risk-heatmap' id='riskHeatmap' aria-label='Risk Heatmap'></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SHAPTab;
