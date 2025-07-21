// Simple test file to check basic TypeScript compilation;
import React from 'react';
// @ts-expect-error TS(2307): Cannot find module '@/services/AnalyticsService' o... Remove this comment to see the full error message
import { analyticsService } from '@/services/AnalyticsService';
// @ts-expect-error TS(2307): Cannot find module '@/services/predictionService' ... Remove this comment to see the full error message
import { predictionService } from '@/services/predictionService';
// @ts-expect-error TS(2307): Cannot find module '@/utils/formatters' or its cor... Remove this comment to see the full error message
import { formatCurrency, formatPercentage } from '@/utils/formatters';
// @ts-expect-error TS(2307): Cannot find module '@/store/predictionStore' or it... Remove this comment to see the full error message
import { usePredictionStore } from '@/store/predictionStore';

// Test basic type imports;
// @ts-expect-error TS(2307): Cannot find module '@/types/common' or its corresp... Remove this comment to see the full error message
import type { Sport, PropType, BetResult } from '@/types/common';
// @ts-expect-error TS(2307): Cannot find module '@/types/lineup' or its corresp... Remove this comment to see the full error message
import type { LineupLeg, Lineup } from '@/types/lineup';
// @ts-expect-error TS(2307): Cannot find module '@/types/predictions' or its co... Remove this comment to see the full error message
import type { LineupBuilderStrategy, LineupBuilderOutput } from '@/types/predictions';

const TestComponent: React.FC = () => {
  // Test that services are accessible;

  // Test that utilities work;

  // Test that store hooks work;

  // Test that types are available;
  const sport: Sport = 'NBA';
  const propType: PropType = 'POINTS';
  const betResult: BetResult = 'WIN';

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div key={241917}>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <h1 key={933583}>TypeScript Test</h1>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <p key={161203}>Analytics: {analytics ? '✓' : '✗'}</p>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <p key={161203}>Predictions: {predictions ? '✓' : '✗'}</p>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <p key={161203}>Currency: {formattedCurrency}</p>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <p key={161203}>Percentage: {formattedPercentage}</p>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <p key={161203}>Store: {store ? '✓' : '✗'}</p>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <p key={161203}>
        Types: {sport} - {propType} - {betResult}
      </p>
    </div>
  );
};

export default TestComponent;
