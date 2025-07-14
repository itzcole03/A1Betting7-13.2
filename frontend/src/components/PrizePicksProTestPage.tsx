import React from 'react';
import { PrizePicksProUnified } from './PrizePicksProUnified';

export const PrizePicksProTestPage: React.FC = () => {
  const handleLineupGenerated = (lineup: any) => {
    console.log('Lineup generated:', lineup);
    // In production, this would handle the optimized lineup
  };

  const handleBetPlaced = (lineup: any) => {
    console.log('Bet placed:', lineup);
    // In production, this would submit the bet to PrizePicks
    alert(`Bet placed! Expected payout: ${lineup.expected_payout.toFixed(2)}x`);
  };

  return (
    <div className='min-h-screen bg-black'>
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

export default PrizePicksProTestPage;
