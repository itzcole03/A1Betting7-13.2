import React from 'react';
// @ts-expect-error TS(6142): Module './PrizePicksProUnified' was resolved to 'C... Remove this comment to see the full error message
import { PrizePicksProUnified } from './PrizePicksProUnified';

export const _PrizePicksProTestPage: React.FC = () => {
  const _handleLineupGenerated = (lineup: unknown) => {
    console.log('Lineup generated:', lineup);
    // In production, this would handle the optimized lineup
  };

  const _handleBetPlaced = (lineup: unknown) => {
    console.log('Bet placed:', lineup);
    // In production, this would submit the bet to PrizePicks
    alert(`Bet placed! Expected payout: ${lineup.expected_payout.toFixed(2)}x`);
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='min-h-screen bg-black'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
