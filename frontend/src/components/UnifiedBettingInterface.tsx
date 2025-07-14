import React, { useState } from 'react';
import BetSlip from './BetSlip';
import BettingDashboard from './BettingDashboard';
import BettingHistory from './BettingHistory';
import { Button } from './Button';
import { Card, CardContent, CardHeader } from './Card';

/**
 * UnifiedBettingInterface Component
 *
 * Combines BetSlip, BettingHistory, and BettingDashboard into a single, seamless interface.
 * Allows users to place bets, view history, and monitor stats in one place.
 */
export const UnifiedBettingInterface: React.FC = () => {
  const [showHistory, setShowHistory] = useState(false);
  const [bets, setBets] = useState<any[]>([]);

  const handleBetSubmit = (bet: { amount: number; selection: string }) => {
    setBets(prev => [
      {
        id: (prev.length + 1).toString(),
        date: new Date().toISOString().slice(0, 10),
        selection: bet.selection,
        amount: bet.amount,
        outcome: 'pending',
        payout: 0,
      },
      ...prev,
    ]);
    setShowHistory(true);
  };

  return (
    <Card className='max-w-4xl mx-auto'>
      <CardHeader>
        <h2 className='text-xl font-bold text-white'>Unified Betting Interface</h2>
      </CardHeader>
      <CardContent>
        <div className='flex flex-col md:flex-row gap-8'>
          <div className='flex-1'>
            <BetSlip onSubmit={handleBetSubmit} />
          </div>
          <div className='flex-1'>
            <BettingDashboard />
          </div>
        </div>
        <div className='flex justify-center mt-8'>
          <Button
            variant={showHistory ? 'primary' : 'outline'}
            onClick={() => setShowHistory(h => !h)}
          >
            {showHistory ? 'Hide Betting History' : 'Show Betting History'}
          </Button>
        </div>
        {showHistory && (
          <div className='mt-8'>
            <BettingHistory bets={bets} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnifiedBettingInterface;
