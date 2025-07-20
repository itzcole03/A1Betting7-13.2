import React from 'react';
import { useAIInsights } from '../../hooks/useAIInsights';
import { useEnhancedBets } from '../../hooks/useEnhancedBets';
import { usePortfolioOptimization } from '../../hooks/usePortfolioOptimization';
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
    <>
      {/* Styles are now imported via CSS file */}
      <div className='comprehensive-admin-root'>
        <div className='cyber-bg'></div>
        <div className='container'>
          {/* Main Dashboard Content */}
          <main style={{ marginTop: 40 }}>
            {isLoading && (
              <div className='glass-card p-8 text-center text-cyan-400 text-xl'>
                Loading AI-powered betting intelligence...
              </div>
            )}
            {isError && (
              <div className='glass-card p-8 text-center text-red-400 text-xl'>
                Error loading data. Please check your backend connection and try again.
              </div>
            )}
            {!isLoading && !isError && (
              <>
                {/* Enhanced Bets Table (summary) */}
                <section className='glass-card mb-8 p-6'>
                  <h2 className='text-2xl font-bold mb-4 text-cyan-300'>Enhanced Bets</h2>
                  <div className='overflow-x-auto'>
                    <table className='min-w-full text-sm'>
                      <thead>
                        <tr className='text-cyan-400'>
                          <th className='px-2 py-1'>Player</th>
                          <th className='px-2 py-1'>Team</th>
                          <th className='px-2 py-1'>Stat</th>
                          <th className='px-2 py-1'>Line</th>
                          <th className='px-2 py-1'>Conf.</th>
                          <th className='px-2 py-1'>Rec.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {predictions.map((bet: any) => (
                          <tr key={bet.id} className='border-b border-cyan-900/30'>
                            <td className='px-2 py-1'>{bet.player_name}</td>
                            <td className='px-2 py-1'>{bet.team}</td>
                            <td className='px-2 py-1'>{bet.stat_type}</td>
                            <td className='px-2 py-1'>{bet.line_score ?? bet.line}</td>
                            <td className='px-2 py-1'>{bet.confidence?.toFixed(1)}%</td>
                            <td className='px-2 py-1'>{bet.recommendation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* AI Insights Panel */}
                <section className='mb-8'>
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
