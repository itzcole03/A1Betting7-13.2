import React from 'react';
// @ts-expect-error TS(6142): Module './Card' was resolved to 'C:/Users/bcmad/Do... Remove this comment to see the full error message
import { Card, CardContent, CardHeader } from './Card';

const mockOpportunities = [
  { id: '1', event: 'Team A vs Team B', market: 'Moneyline', odds: 2.1, value: 'High' },
  { id: '2', event: 'Team C vs Team D', market: 'Spread', odds: 1.95, value: 'Medium' },
  { id: '3', event: 'Team E vs Team F', market: 'Total', odds: 2.3, value: 'Low' },
];

/**
 * BettingOpportunities Component
 *
 * Modern, accessible display of top betting opportunities for the A1Betting platform.
 * Shows event, market, odds, and value rating.
 */
export const BettingOpportunities: React.FC = () => {
  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Card className='max-w-2xl mx-auto'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <CardHeader>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <h2 className='text-lg font-bold text-white'>Betting Opportunities</h2>
      </CardHeader>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <CardContent>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <table className='w-full text-sm text-left text-gray-400'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <thead>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <tr>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <th className='py-2 px-3'>Event</th>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <th className='py-2 px-3'>Market</th>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <th className='py-2 px-3'>Odds</th>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <th className='py-2 px-3'>Value</th>
            </tr>
          </thead>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <tbody>
            {mockOpportunities.length === 0 ? (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <tr>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <td colSpan={4} className='text-center py-4 text-gray-500'>
                  No opportunities found.
                </td>
              </tr>
            ) : (
              mockOpportunities.map(o => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <tr key={o.id} className='border-b border-gray-700'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <td className='py-2 px-3'>{o.event}</td>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <td className='py-2 px-3'>{o.market}</td>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <td className='py-2 px-3'>{o.odds}</td>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <td
                    className={`py-2 px-3 font-semibold ${
                      o.value === 'High'
                        ? 'text-green-400'
                        : o.value === 'Medium'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  >
                    {o.value}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default BettingOpportunities;
