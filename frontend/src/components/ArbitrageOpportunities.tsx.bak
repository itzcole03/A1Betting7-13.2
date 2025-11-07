import React from 'react';
// @ts-expect-error TS(6142): Module './Card' was resolved to 'C:/Users/bcmad/Do... Remove this comment to see the full error message
import { Card, CardContent, CardHeader } from './Card';

interface ArbitrageOpportunity {
  id: string;
  event: string;
  market: string;
  oddsA: number;
  oddsB: number;
  profit: number;
}

const _mockOpportunities: ArbitrageOpportunity[] = [
  { id: '1', event: 'Team A vs Team B', market: 'Moneyline', oddsA: 2.1, oddsB: 2.2, profit: 5.3 },
  { id: '2', event: 'Team C vs Team D', market: 'Spread', oddsA: 1.95, oddsB: 2.05, profit: 3.1 },
];

/**
 * ArbitrageOpportunities Component
 *
 * Modern, accessible display of arbitrage opportunities for the A1Betting platform.
 * Shows event, market, odds, and potential profit.
 */
export const ArbitrageOpportunities: React.FC = () => {
  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Card className='max-w-2xl mx-auto'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <CardHeader>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <h2 className='text-lg font-bold text-white'>Arbitrage Opportunities</h2>
      </CardHeader>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <CardContent>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <table className='w-full text-sm text-left text-gray-400'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <thead>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <tr>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <th className='py-2 px-3'>Event</th>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <th className='py-2 px-3'>Market</th>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <th className='py-2 px-3'>Odds A</th>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <th className='py-2 px-3'>Odds B</th>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <th className='py-2 px-3'>Profit (%)</th>
            </tr>
          </thead>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <tbody>
            {mockOpportunities.length === 0 ? (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <tr>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <td colSpan={5} className='text-center py-4 text-gray-500'>
                  No arbitrage opportunities found.
                </td>
              </tr>
            ) : (
              mockOpportunities.map(opp => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <tr key={opp.id} className='border-b border-gray-700'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <td className='py-2 px-3'>{opp.event}</td>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <td className='py-2 px-3'>{opp.market}</td>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <td className='py-2 px-3'>{opp.oddsA}</td>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <td className='py-2 px-3'>{opp.oddsB}</td>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <td className='py-2 px-3 text-cyan-400 font-semibold'>{opp.profit}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default ArbitrageOpportunities;
