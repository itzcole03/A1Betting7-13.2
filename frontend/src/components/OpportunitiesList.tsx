import React, { useState } from 'react';
// @ts-expect-error TS(6142): Module './Card' was resolved to 'C:/Users/bcmad/Do... Remove this comment to see the full error message
import { Card, CardContent, CardHeader } from './Card';

interface Opportunity {
  id: string;
  event: string;
  market: string;
  odds: number;
  type: 'value' | 'arbitrage' | 'ai';
}

const mockOpportunities: Opportunity[] = [
  { id: '1', event: 'Team A vs Team B', market: 'Moneyline', odds: 2.1, type: 'value' },
  { id: '2', event: 'Team C vs Team D', market: 'Spread', odds: 1.95, type: 'ai' },
  { id: '3', event: 'Team E vs Team F', market: 'Total', odds: 2.3, type: 'arbitrage' },
];

/**
 * OpportunitiesList Component
 *
 * Modern, accessible display and filtering of betting opportunities.
 * Shows event, market, odds, and type.
 */
export const OpportunitiesList: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'value' | 'arbitrage' | 'ai'>('all');

  const filtered =
    filter === 'all' ? mockOpportunities : mockOpportunities.filter(o => o.type === filter);

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Card className='max-w-2xl mx-auto'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <CardHeader>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center justify-between'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h2 className='text-lg font-bold text-white'>Opportunities</h2>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as any)}
            className='bg-gray-800 border border-gray-600 rounded-lg text-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500'
            aria-label='Filter opportunities by type'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='all'>All</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='value'>Value</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='arbitrage'>Arbitrage</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='ai'>AI</option>
          </select>
        </div>
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
              <th className='py-2 px-3'>Type</th>
            </tr>
          </thead>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <tbody>
            {filtered.length === 0 ? (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <tr>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <td colSpan={4} className='text-center py-4 text-gray-500'>
                  No opportunities found.
                </td>
              </tr>
            ) : (
              filtered.map(o => (
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
                      o.type === 'value'
                        ? 'text-green-400'
                        : o.type === 'arbitrage'
                          ? 'text-cyan-400'
                          : 'text-yellow-400'
                    }`}
                  >
                    {o.type.charAt(0).toUpperCase() + o.type.slice(1)}
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

export default OpportunitiesList;
