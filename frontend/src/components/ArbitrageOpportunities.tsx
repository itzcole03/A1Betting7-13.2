import React from 'react';
import { Card, CardContent, CardHeader } from './Card';

interface ArbitrageOpportunity {
  id: string;
  event: string;
  market: string;
  oddsA: number;
  oddsB: number;
  profit: number;
}

const mockOpportunities: ArbitrageOpportunity[] = [
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
    <Card className='max-w-2xl mx-auto'>
      <CardHeader>
        <h2 className='text-lg font-bold text-white'>Arbitrage Opportunities</h2>
      </CardHeader>
      <CardContent>
        <table className='w-full text-sm text-left text-gray-400'>
          <thead>
            <tr>
              <th className='py-2 px-3'>Event</th>
              <th className='py-2 px-3'>Market</th>
              <th className='py-2 px-3'>Odds A</th>
              <th className='py-2 px-3'>Odds B</th>
              <th className='py-2 px-3'>Profit (%)</th>
            </tr>
          </thead>
          <tbody>
            {mockOpportunities.length === 0 ? (
              <tr>
                <td colSpan={5} className='text-center py-4 text-gray-500'>
                  No arbitrage opportunities found.
                </td>
              </tr>
            ) : (
              mockOpportunities.map(opp => (
                <tr key={opp.id} className='border-b border-gray-700'>
                  <td className='py-2 px-3'>{opp.event}</td>
                  <td className='py-2 px-3'>{opp.market}</td>
                  <td className='py-2 px-3'>{opp.oddsA}</td>
                  <td className='py-2 px-3'>{opp.oddsB}</td>
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
