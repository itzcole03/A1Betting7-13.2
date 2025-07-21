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
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='p-8'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex items-center space-x-4 mb-6'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <User className='w-12 h-12 text-cyan-400' />
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-2xl font-bold text-white'>{user.name}</div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-purple-400 flex items-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Star className='w-4 h-4 mr-1' /> {user.tier} Tier
          </div>
        </div>
      </div>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='bg-slate-800/60 rounded-xl p-6 flex flex-col space-y-2 max-w-sm'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='text-gray-300'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          Bets Placed: <span className='font-bold text-white'>{user.betsPlaced}</span>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='text-gray-300'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          Win Rate: <span className='font-bold text-green-400'>{user.winRate}%</span>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='text-gray-300'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          Total Profit: <span className='font-bold text-cyan-400'>${user.profit}</span>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
