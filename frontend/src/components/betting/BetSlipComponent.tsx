/**
 * BetSlipComponent
 *
 * Manages the selected props and bet slip functionality.
 */

import { BetSlipItem, BettingOpportunity } from '../../hooks/useUnifiedBettingState';

interface BetSlipComponentProps {
  betSlip: BetSlipItem[];
  getOpportunityById: (id: string) => BettingOpportunity | undefined;
  removeFromBetSlip: (id: string) => void;
}

export const BetSlipComponent: React.FC<BetSlipComponentProps> = ({
  betSlip,
  getOpportunityById,
  removeFromBetSlip,
}) => {
  return (
    <div className='space-y-6'>
      <div className='bg-white rounded-lg shadow-md' data-testid='bet-slip-section'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h3 className='text-lg font-semibold text-gray-900'>Bet Slip ({betSlip.length} bets)</h3>
        </div>
        {betSlip.length === 0 ? (
          <div className='p-6 text-center text-gray-500' data-testid='bet-slip-empty'>
            <p>No bets in your slip yet</p>
            <p className='text-sm'>Add opportunities from the Opportunities tab</p>
          </div>
        ) : (
          <div className='divide-y divide-gray-200'>
            {betSlip.map((item: BetSlipItem) => {
              const opportunity = getOpportunityById(item.opportunity_id);
              if (!opportunity) return null;
              return (
                <div key={item.opportunity_id} className='p-6' data-testid='bet-slip-item'>
                  <div className='flex items-center justify-between mb-3'>
                    <div>
                      <h4 className='font-semibold text-gray-900'>{opportunity.selection}</h4>
                      <p className='text-sm text-gray-500'>
                        {opportunity.sport} • {opportunity.market}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromBetSlip(item.opportunity_id)}
                      className='text-red-500 hover:text-red-700'
                    >
                      Remove
                    </button>
                  </div>
                  <div className='grid grid-cols-3 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Stake ($)
                      </label>
                      <input
                        type='number'
                        min='1'
                        max={opportunity.max_stake}
                        value={item.stake}
                        readOnly
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Odds</label>
                      <div className='px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900'>
                        {opportunity.odds.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Potential Win
                      </label>
                      <div className='px-3 py-2 bg-green-50 border border-green-200 rounded-md text-green-700 font-semibold'>
                        ${item.potential_win.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className='p-6 bg-gray-50'>
              <div className='flex justify-between items-center mb-4'>
                <span className='text-lg font-semibold text-gray-900'>Total Stake:</span>
                <span className='text-lg font-bold text-gray-900'>
                  ${betSlip.reduce((sum, item) => sum + item.stake, 0).toFixed(2)}
                </span>
              </div>
              <div className='flex justify-between items-center mb-4'>
                <span className='text-lg font-semibold text-gray-900'>Potential Payout:</span>
                <span className='text-lg font-bold text-green-600'>
                  ${betSlip.reduce((sum, item) => sum + item.potential_win, 0).toFixed(2)}
                </span>
              </div>
              <button className='w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-semibold'>
                Place All Bets
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
