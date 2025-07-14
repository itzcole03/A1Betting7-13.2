import { DollarSign, Zap } from 'lucide-react';
import React, { useState } from 'react';

/**
 * BettingInterface - Place and track bets with real-time analytics.
 */
const BettingInterface: React.FC = () => {
  const [betAmount, setBetAmount] = useState('');
  const [betPlaced, setBetPlaced] = useState(false);

  const handlePlaceBet = () => {
    setBetPlaced(true);
    setTimeout(() => setBetPlaced(false), 2000);
  };

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent mb-4'>
        Place Your Bet
      </h1>
      <div className='bg-slate-800/60 rounded-xl p-6 flex flex-col space-y-4 max-w-md'>
        <label htmlFor='bet-amount-input' className='text-gray-300 font-semibold'>
          Bet Amount ($)
        </label>
        <input
          id='bet-amount-input'
          type='number'
          className='p-2 rounded bg-slate-900 text-white border border-slate-700'
          value={betAmount}
          onChange={e => setBetAmount(e.target.value)}
          min={1}
          placeholder='Enter amount'
          title='Bet Amount'
        />
        <button
          className='bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center'
          onClick={handlePlaceBet}
          disabled={!betAmount}
        >
          <DollarSign className='mr-2' /> Place Bet
        </button>
        {betPlaced && (
          <div className='text-green-400 flex items-center space-x-2 mt-2'>
            <Zap className='w-5 h-5' />
            <span>Bet placed successfully!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BettingInterface;
