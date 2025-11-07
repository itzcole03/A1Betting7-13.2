import React from 'react';
import { useAIInsights } from '../../hooks/useAIInsights';
import { useEnhancedBets } from '../../hooks/useEnhancedBets';
import { usePortfolioOptimization } from '../../hooks/usePortfolioOptimization';

const ComprehensiveAdminDashboard: React.FC = () => {
  const { isLoading: betsLoading, isError: betsError, data: betsData } = useEnhancedBets();
  const { isLoading: portLoading, isError: portError } = usePortfolioOptimization();
  const { isLoading: aiLoading, isError: aiError, data: aiData } = useAIInsights();

  if (betsLoading || portLoading || aiLoading) {
    return <div role='status'>Loading AI-powered betting intelligence</div>;
  }
  if (betsError || portError || aiError) {
    return <div role='alert'>Error loading data</div>;
  }

  // Defensive: default to empty arrays if data is not present or not shaped as expected
  const enhancedBets = Array.isArray((betsData as any)?.enhanced_bets)
    ? (betsData as any).enhanced_bets
    : [];
  const aiInsights = Array.isArray((aiData as any)?.ai_insights) ? (aiData as any).ai_insights : [];

  return (
    <div>
      <div>Enhanced Bets</div>
      <div>
        {enhancedBets.length > 0 ? (
          <div>
            <span>Select Bet for Analysis</span>
            <ul>
              {enhancedBets.map((bet: any) => (
                <li key={bet.bet_id || bet.id}>
                  {bet.player_name} - {bet.sport || bet.team} - {bet.stat_type || ''} -{' '}
                  {bet.line || ''} - {bet.confidence || ''}
                  {bet.recommendation ? <span> - {bet.recommendation}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div>
        {aiInsights.length > 0 ? (
          <ul>
            {aiInsights.map((insight: any) => (
              <li key={insight.bet_id}>
                {insight.player_name} - {insight.quantum_analysis}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
};

export default ComprehensiveAdminDashboard;
