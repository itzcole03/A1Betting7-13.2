import React from 'react';
import { useAIInsights } from '../../hooks/useAIInsights';
import { useEnhancedBets } from '../../hooks/useEnhancedBets';
import { usePortfolioOptimization } from '../../hooks/usePortfolioOptimization';
// @ts-expect-error TS(6142): Module '../enhanced/AIInsightsPanel' was resolved ... Remove this comment to see the full error message
import AIInsightsPanel from '../enhanced/AIInsightsPanel';
import './ComprehensiveAdminDashboard.css';

const ComprehensiveAdminDashboard: React.FC = () => {
  // --- Unified API Data Fetching ---
  const enhancedBetsQuery = useEnhancedBets({
    include_ai_insights: true,
    include_portfolio_optimization: true,
  });
  const portfolioOptimizationQuery = usePortfolioOptimization();
  const aiInsightsQuery = useAIInsights();

  // --- Loading/Error States ---
  const isLoading =
    enhancedBetsQuery.isLoading ||
    portfolioOptimizationQuery.isLoading ||
    aiInsightsQuery.isLoading;
  const isError =
    enhancedBetsQuery.isError || portfolioOptimizationQuery.isError || aiInsightsQuery.isError;

  // --- Data Normalization for AIInsightsPanel ---
  // Ensure insights have required 'shap_factors' property
  const aiInsights = (aiInsightsQuery.data?.ai_insights || []).map((insight: any) => ({
    ...insight,
    shap_factors: insight.shap_factors || [],
  }));
  const predictions = enhancedBetsQuery.data?.enhanced_bets || [];
  // For demo, no selection or handler
  const selectedBet = undefined;
  const onBetSelect = () => {};

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <>
      {/* Styles are now imported via CSS file */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='comprehensive-admin-root'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='cyber-bg'></div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='container'>
          {/* Main Dashboard Content */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <main style={{ marginTop: 40 }}>
            {isLoading && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='glass-card p-8 text-center text-cyan-400 text-xl'>
                Loading AI-powered betting intelligence...
              </div>
            )}
            {isError && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='glass-card p-8 text-center text-red-400 text-xl'>
                Error loading data. Please check your backend connection and try again.
              </div>
            )}
            {!isLoading && !isError && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <>
                {/* Enhanced Bets Table (summary) */}
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <section className='glass-card mb-8 p-6'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <h2 className='text-2xl font-bold mb-4 text-cyan-300'>Enhanced Bets</h2>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='overflow-x-auto'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <table className='min-w-full text-sm'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <thead>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <tr className='text-cyan-400'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <th className='px-2 py-1'>Player</th>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <th className='px-2 py-1'>Team</th>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <th className='px-2 py-1'>Stat</th>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <th className='px-2 py-1'>Line</th>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <th className='px-2 py-1'>Conf.</th>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <th className='px-2 py-1'>Rec.</th>
                        </tr>
                      </thead>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <tbody>
                        {predictions.map((bet: any) => (
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <tr key={bet.id} className='border-b border-cyan-900/30'>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <td className='px-2 py-1'>{bet.player_name}</td>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <td className='px-2 py-1'>{bet.team}</td>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <td className='px-2 py-1'>{bet.stat_type}</td>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <td className='px-2 py-1'>{bet.line_score ?? bet.line}</td>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <td className='px-2 py-1'>{bet.confidence?.toFixed(1)}%</td>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <td className='px-2 py-1'>{bet.recommendation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* AI Insights Panel */}
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <section className='mb-8'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <AIInsightsPanel
                    insights={aiInsights}
                    predictions={predictions}
                    selectedBet={selectedBet}
                    onBetSelect={onBetSelect}
                  />
                </section>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default ComprehensiveAdminDashboard;
