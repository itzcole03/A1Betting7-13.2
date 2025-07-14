import React from 'react';
import { PrizePicksProUnified } from './PrizePicksProUnified';
import toast from 'react-hot-toast';

/**
 * PrizePicksTab Component
 *
 * Unified PrizePicks Pro and Lineup Builder interface for the main dashboard.
 * Combines all PrizePicks functionality into a single comprehensive tab.
 *
 * Features:
 * - Real-time ML predictions with 47+ ensemble models
 * - SHAP explanations for AI transparency
 * - Kelly Criterion optimization for bet sizing
 * - Advanced lineup correlation analysis
 * - Live data integration with auto-refresh
 * - Comprehensive filtering and search
 * - Professional cyber-themed design
 */
const PrizePicksTab: React.FC = () => {
  const handleLineupGenerated = (lineup: any) => {
    console.log('✅ Lineup optimized:', lineup);
    toast.success(`Lineup optimized! Expected payout: ${lineup.expected_payout.toFixed(2)}x`, {
      duration: 4000,
      position: 'top-right',
    });
  };

  const handleBetPlaced = (lineup: any) => {
    console.log('🎯 Bet placed:', lineup);
    toast.success(
      `Bet placed successfully! Expected payout: ${lineup.expected_payout.toFixed(2)}x`,
      {
        duration: 6000,
        position: 'top-right',
      }
    );

    // In production, this would submit to PrizePicks API
    // Example: await prizePicksService.placeBet(lineup);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4'>
      <PrizePicksProUnified
        variant='cyber'
        maxSelections={6}
        enableMLPredictions={true}
        enableShapExplanations={true}
        enableKellyOptimization={true}
        enableCorrelationAnalysis={true}
        autoRefresh={true}
        refreshInterval={30000}
        onLineupGenerated={handleLineupGenerated}
        onBetPlaced={handleBetPlaced}
      />
    </div>
  );
};

export default PrizePicksTab;
