import React from 'react';
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
    <Card className='max-w-2xl mx-auto'>
      <CardHeader>
        <h2 className='text-lg font-bold text-white'>Betting Opportunities</h2>
      </CardHeader>
      <CardContent>
        <table className='w-full text-sm text-left text-gray-400'>
          <thead>
            <tr>
              <th className='py-2 px-3'>Event</th>
              <th className='py-2 px-3'>Market</th>
              <th className='py-2 px-3'>Odds</th>
              <th className='py-2 px-3'>Value</th>
            </tr>
          </thead>
          <tbody>
            {mockOpportunities.length === 0 ? (
              <tr>
                <td colSpan={4} className='text-center py-4 text-gray-500'>
                  No opportunities found.
                </td>
              </tr>
            ) : (
              mockOpportunities.map(o => (
                <tr key={o.id} className='border-b border-gray-700'>
                  <td className='py-2 px-3'>{o.event}</td>
                  <td className='py-2 px-3'>{o.market}</td>
                  <td className='py-2 px-3'>{o.odds}</td>
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
