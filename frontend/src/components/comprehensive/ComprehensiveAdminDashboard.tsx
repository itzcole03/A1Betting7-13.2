import React, { useState } from 'react';
import { useAIInsights } from 'src/hooks/useAIInsights';
import { useEnhancedBets } from 'src/hooks/useEnhancedBets';
import { usePortfolioOptimization } from 'src/hooks/usePortfolioOptimization';
import AIInsightsPanel from '../../components/enhanced/AIInsightsPanel';
import './ComprehensiveAdminDashboard.css';

interface ComprehensiveAdminDashboardProps {
  selectedBet?: any;
  onBetSelect?: (bet: any) => void;
  enhancedBets?: any[];
}

export const ComprehensiveAdminDashboard: React.FC<ComprehensiveAdminDashboardProps> = ({
  selectedBet,
  onBetSelect,
  enhancedBets,
}) => {
  // eslint-disable-next-line no-console
  console.log('[DASHBOARD] Rendering ComprehensiveAdminDashboard');
  const _enhancedBetsQuery = useEnhancedBets({
    include_ai_insights: true,
    include_portfolio_optimization: true,
  });
  const _portfolioOptimizationQuery = usePortfolioOptimization();
  const _aiInsightsQuery = useAIInsights();

  const _isLoading =
    _enhancedBetsQuery.isLoading ||
    _portfolioOptimizationQuery.isLoading ||
    _aiInsightsQuery.isLoading;
  const _isError =
    _enhancedBetsQuery.isError || _portfolioOptimizationQuery.isError || _aiInsightsQuery.isError;
  // eslint-disable-next-line no-console
  console.log('[DASHBOARD] isLoading:', _isLoading, 'isError:', _isError);

  const _aiInsights = (_aiInsightsQuery.data?.ai_insights || []).map((insight: any) => ({
    ...insight,
    shap_factors: (insight as any).shap_factors || [],
  }));
  // Use prop if provided, otherwise use internal state
  const [_internalSelectedBet, _setInternalSelectedBet] = useState<any>(undefined);
  const _predictions = enhancedBets ?? (_enhancedBetsQuery.data?.enhanced_bets || []);
  const _selectedBet = selectedBet !== undefined ? selectedBet : _internalSelectedBet;
  const _onBetSelect = onBetSelect ?? _setInternalSelectedBet;

  return (
    <>
      <div className='comprehensive-admin-root'>
        <div className='cyber-bg'></div>
        <div className='container'>
          <main style={{ marginTop: 40 }}>
            {_isLoading && (
              <div className='glass-card p-8 text-center text-cyan-400 text-xl'>
                Loading AI-powered betting intelligence...
              </div>
            )}
            {_isError && (
              <div className='glass-card p-8 text-center text-red-400 text-xl'>
                Error loading data. Please check your backend connection and try again.
              </div>
            )}
            {!_isLoading && !_isError && (
              <>
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
                        {_predictions.map((bet: any) => (
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

                <section className='mb-8'>
                  <AIInsightsPanel
                    insights={_aiInsights}
                    predictions={_predictions}
                    selectedBet={_selectedBet}
                    onBetSelect={_onBetSelect}
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
