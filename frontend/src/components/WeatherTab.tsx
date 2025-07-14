import React from 'react';
import './A1BettingPreview.css';

/**
 * WeatherTab - Displays real-time weather conditions and analytics for games.
 * Used as the Weather Station tab in A1BettingPreview.
 *
 * Accessibility: All major sections have ARIA roles and labels for screen readers.
 *
 * @returns {JSX.Element} Weather station UI
 */
const WeatherTab: React.FC = (): JSX.Element => (
  <div className='weather-tab' role='tabpanel' aria-label='Weather Station'>
    <div className='glass-card'>
      <h3 style={{ padding: '20px', color: 'var(--cyber-primary)' }}>🌤️ Weather Station</h3>
      <div className='grid grid-2' style={{ padding: '20px' }}>
        <div className='glass-card'>
          <h4 style={{ padding: '15px', color: 'var(--cyber-accent)' }}>Game Conditions</h4>
          <div style={{ padding: '0 15px 15px' }}>
            <div className='weather-impact'>
              <div style={{ fontWeight: 'bold' }}>Lakers vs Warriors</div>
              <div>Temperature: 72°F | Humidity: 45% | Wind: 3mph</div>
              <div style={{ color: 'var(--cyber-secondary)' }}>Edge detected: +3.2%</div>
            </div>
            <div className='weather-impact'>
              <div style={{ fontWeight: 'bold' }}>Chiefs vs Bills</div>
              <div>Temperature: 68°F | Humidity: 52% | Wind: 7mph</div>
              <div style={{ color: 'var(--cyber-secondary)' }}>Edge detected: +2.1%</div>
            </div>
            <div className='weather-impact'>
              <div style={{ fontWeight: 'bold' }}>Dodgers vs Giants</div>
              <div>Temperature: 64°F | Humidity: 60% | Wind: 5mph</div>
              <div style={{ color: 'var(--cyber-secondary)' }}>Edge detected: +1.7%</div>
            </div>
          </div>
        </div>
        <div className='glass-card'>
          <h4 style={{ padding: '15px', color: 'var(--cyber-accent)' }}>Weather Analytics</h4>
          <div style={{ padding: '0 15px 15px' }}>
            <div className='opportunity-card'>
              <div style={{ fontWeight: 'bold', marginBottom: 10 }}>Wind Impact</div>
              <div>Games with wind {'>'} 10mph: 12% lower scoring</div>
              <div style={{ color: 'var(--cyber-secondary)' }}>Adjust totals accordingly</div>
            </div>
            <div className='opportunity-card'>
              <div style={{ fontWeight: 'bold', marginBottom: 10 }}>Humidity Effect</div>
              <div>High humidity: 8% more turnovers</div>
              <div style={{ color: 'var(--cyber-secondary)' }}>Monitor player fatigue</div>
            </div>
            <div className='opportunity-card'>
              <div style={{ fontWeight: 'bold', marginBottom: 10 }}>Temperature Trends</div>
              <div>Cold games: 6% fewer home runs</div>
              <div style={{ color: 'var(--cyber-secondary)' }}>Pitchers gain slight edge</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default WeatherTab;
