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
const _SocialTab: React.FC = (): JSX.Element => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <div className='social-tab' role='tabpanel' aria-label='Social Intelligence'>
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='glass-card'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <h3 style={{ padding: '20px', color: 'var(--cyber-primary)' }}>🌐 Social Intelligence</h3>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid grid-2' style={{ padding: '20px' }}>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='glass-card'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h4 style={{ padding: '15px', color: 'var(--cyber-accent)' }}>Market Sentiment</h4>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div style={{ padding: '0 15px 15px' }}>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='social-sentiment'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>📈</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div style={{ fontWeight: 'bold' }}>Betting Volume Spike</div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div style={{ fontSize: '0.8rem' }}>Lakers ML: +187% volume spike</div>
              </div>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='social-sentiment'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>💬</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div style={{ fontWeight: 'bold' }}>Fan Chatter</div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div style={{ fontSize: '0.8rem' }}>
                  &quot;Lakers are unstoppable tonight!&quot;
                </div>
              </div>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='social-sentiment'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>🔎</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div style={{ fontWeight: 'bold' }}>Trending Hashtags</div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div style={{ fontSize: '0.8rem' }}>#LakersWin #NBA #BettingEdge</div>
              </div>
            </div>
          </div>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='glass-card'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h4 style={{ padding: '15px', color: 'var(--cyber-accent)' }}>Sentiment Analysis</h4>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div style={{ padding: '0 15px 15px' }}>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='opportunity-card'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div style={{ fontWeight: 'bold', marginBottom: 10 }}>Bullish Sentiment</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>76% bullish | 24% bearish</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div style={{ color: 'var(--cyber-secondary)' }}>Majority expect Lakers win</div>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='opportunity-card'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div style={{ fontWeight: 'bold', marginBottom: 10 }}>Top Influencers</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>@NBAInsider: &quot;Lakers have the edge tonight.&quot;</div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>@SharpBettor: &quot;Market is overreacting to recent losses.&quot;</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SocialTab;
