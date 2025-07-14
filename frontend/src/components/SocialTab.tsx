import React from 'react';
import './A1BettingPreview.css';

/**
 * SocialTab - Displays market sentiment, influencer opinions, and trending topics.
 * Used as the Social Intel tab in A1BettingPreview.
 *
 * Accessibility: All major sections have ARIA roles and labels for screen readers.
 *
 * @returns {JSX.Element} Social intelligence UI
 */
const SocialTab: React.FC = (): JSX.Element => (
  <div className='social-tab' role='tabpanel' aria-label='Social Intelligence'>
    <div className='glass-card'>
      <h3 style={{ padding: '20px', color: 'var(--cyber-primary)' }}>🌐 Social Intelligence</h3>
      <div className='grid grid-2' style={{ padding: '20px' }}>
        <div className='glass-card'>
          <h4 style={{ padding: '15px', color: 'var(--cyber-accent)' }}>Market Sentiment</h4>
          <div style={{ padding: '0 15px 15px' }}>
            <div className='social-sentiment'>
              <div>📈</div>
              <div>
                <div style={{ fontWeight: 'bold' }}>Betting Volume Spike</div>
                <div style={{ fontSize: '0.8rem' }}>Lakers ML: +187% volume spike</div>
              </div>
            </div>
            <div className='social-sentiment'>
              <div>💬</div>
              <div>
                <div style={{ fontWeight: 'bold' }}>Fan Chatter</div>
                <div style={{ fontSize: '0.8rem' }}>
                  &quot;Lakers are unstoppable tonight!&quot;
                </div>
              </div>
            </div>
            <div className='social-sentiment'>
              <div>🔎</div>
              <div>
                <div style={{ fontWeight: 'bold' }}>Trending Hashtags</div>
                <div style={{ fontSize: '0.8rem' }}>#LakersWin #NBA #BettingEdge</div>
              </div>
            </div>
          </div>
        </div>
        <div className='glass-card'>
          <h4 style={{ padding: '15px', color: 'var(--cyber-accent)' }}>Sentiment Analysis</h4>
          <div style={{ padding: '0 15px 15px' }}>
            <div className='opportunity-card'>
              <div style={{ fontWeight: 'bold', marginBottom: 10 }}>Bullish Sentiment</div>
              <div>76% bullish | 24% bearish</div>
              <div style={{ color: 'var(--cyber-secondary)' }}>Majority expect Lakers win</div>
            </div>
            <div className='opportunity-card'>
              <div style={{ fontWeight: 'bold', marginBottom: 10 }}>Top Influencers</div>
              <div>@NBAInsider: &quot;Lakers have the edge tonight.&quot;</div>
              <div>@SharpBettor: &quot;Market is overreacting to recent losses.&quot;</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SocialTab;
