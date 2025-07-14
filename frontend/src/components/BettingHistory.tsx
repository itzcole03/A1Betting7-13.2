import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from './Card';

interface Bet {
  id: string;
  date: string;
  selection: string;
  amount: number;
  outcome: 'win' | 'lose' | 'pending';
  payout: number;
}

interface BettingHistoryProps {
  bets?: Bet[];
  className?: string;
}

const mockBets: Bet[] = [
  { id: '1', date: '2025-01-18', selection: 'Team A', amount: 100, outcome: 'win', payout: 180 },
  { id: '2', date: '2025-01-17', selection: 'Team B', amount: 50, outcome: 'lose', payout: 0 },
  { id: '3', date: '2025-01-16', selection: 'Team C', amount: 75, outcome: 'pending', payout: 0 },
];

/**
 * BettingHistory Component
 *
 * Modern, accessible betting history display for the A1Betting platform.
 * Supports filtering and outcome highlighting.
 *
 * @param bets - Array of bet objects
 * @param className - Additional CSS classes
 */
export const BettingHistory: React.FC<BettingHistoryProps> = ({
  bets = mockBets,
  className = '',
}) => {
  const [filter, setFilter] = useState<'all' | 'win' | 'lose' | 'pending'>('all');

  const filteredBets = filter === 'all' ? bets : bets.filter(bet => bet.outcome === filter);

  return (
    <Card className={`max-w-2xl mx-auto ${className}`}>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-bold text-white'>Betting History</h2>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as any)}
            className='bg-gray-800 border border-gray-600 rounded-lg text-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500'
            aria-label='Filter bets by outcome'
          >
            <option value='all'>All</option>
            <option value='win'>Wins</option>
            <option value='lose'>Losses</option>
            <option value='pending'>Pending</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <table className='w-full text-sm text-left text-gray-400'>
          <thead>
            <tr>
              <th className='py-2 px-3'>Date</th>
              <th className='py-2 px-3'>Selection</th>
              <th className='py-2 px-3'>Amount ($)</th>
              <th className='py-2 px-3'>Outcome</th>
              <th className='py-2 px-3'>Payout ($)</th>
            </tr>
          </thead>
          <tbody>
            {filteredBets.length === 0 ? (
              <tr>
                <td colSpan={5} className='text-center py-4 text-gray-500'>
                  No bets found.
                </td>
              </tr>
            ) : (
              filteredBets.map(bet => (
                <tr key={bet.id} className='border-b border-gray-700'>
                  <td className='py-2 px-3'>{bet.date}</td>
                  <td className='py-2 px-3'>{bet.selection}</td>
                  <td className='py-2 px-3'>{bet.amount}</td>
                  <td
                    className={`py-2 px-3 font-semibold ${
                      bet.outcome === 'win'
                        ? 'text-green-400'
                        : bet.outcome === 'lose'
                          ? 'text-red-400'
                          : 'text-yellow-400'
                    }`}
                  >
                    {bet.outcome.charAt(0).toUpperCase() + bet.outcome.slice(1)}
                  </td>
                  <td className='py-2 px-3'>{bet.payout}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default BettingHistory;
