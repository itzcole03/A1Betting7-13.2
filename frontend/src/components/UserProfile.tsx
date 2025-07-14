import { Star, User } from 'lucide-react';
import React from 'react';

/**
 * UserProfile - Shows user info, stats, and account actions.
 */
const UserProfile: React.FC = () => {
  // Example user data (replace with real integration)
  const user = {
    name: 'Jane Doe',
    tier: 'Pro',
    betsPlaced: 124,
    winRate: 76.2,
    profit: 4200,
  };

  return (
    <div className='p-8'>
      <div className='flex items-center space-x-4 mb-6'>
        <User className='w-12 h-12 text-cyan-400' />
        <div>
          <div className='text-2xl font-bold text-white'>{user.name}</div>
          <div className='text-purple-400 flex items-center'>
            <Star className='w-4 h-4 mr-1' /> {user.tier} Tier
          </div>
        </div>
      </div>
      <div className='bg-slate-800/60 rounded-xl p-6 flex flex-col space-y-2 max-w-sm'>
        <div className='text-gray-300'>
          Bets Placed: <span className='font-bold text-white'>{user.betsPlaced}</span>
        </div>
        <div className='text-gray-300'>
          Win Rate: <span className='font-bold text-green-400'>{user.winRate}%</span>
        </div>
        <div className='text-gray-300'>
          Total Profit: <span className='font-bold text-cyan-400'>${user.profit}</span>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
