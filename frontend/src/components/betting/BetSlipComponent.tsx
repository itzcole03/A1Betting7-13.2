/**
 * BetSlipComponent
 *
 * Manages the selected props and bet slip functionality.
 */

import React from 'react';
import { SelectedProp } from '../shared/PropOllamaTypes';

interface BetSlipComponentProps {
  selectedProps: SelectedProp[];
  entryAmount: number;
  onRemoveProp: (propId: string) => void;
  onEntryAmountChange: (amount: number) => void;
  onClearSlip: () => void;
  onPlaceBet: () => void;
}

export const BetSlipComponent: React.FC<BetSlipComponentProps> = ({
  selectedProps = [], // Provide default value to prevent undefined errors
  entryAmount,
  onRemoveProp,
  onEntryAmountChange,
  onClearSlip,
  onPlaceBet,
}) => {
  // Calculate total potential payout
  const totalPayout = selectedProps.reduce((sum, prop) => {
    const stake = entryAmount / selectedProps.length; // Divide stake evenly
    return sum + (stake * (prop.odds - 1));
  }, 0);

  return (
    <div className='space-y-6'>
      <div className='bg-slate-700/50 backdrop-blur-sm rounded-lg shadow-md border border-slate-600' data-testid='bet-slip-section'>
        <div className='px-6 py-4 border-b border-slate-600'>
          <h3 className='text-lg font-semibold text-white'>Bet Slip ({selectedProps.length} props)</h3>
        </div>
        {selectedProps.length === 0 ? (
          <div className='p-6 text-center text-slate-400' data-testid='bet-slip-empty'>
            <p>No props in your slip yet</p>
            <p className='text-sm'>Select props from the list to build your bet</p>
          </div>
        ) : (
          <div className='divide-y divide-slate-600'>
            {selectedProps.map((prop: SelectedProp) => {
              const individualStake = entryAmount / selectedProps.length;
              const potentialWin = individualStake * (prop.odds - 1);

              return (
                <div key={prop.id} className='p-6' data-testid='bet-slip-item'>
                  <div className='flex items-center justify-between mb-3'>
                    <div>
                      <h4 className='font-semibold text-white'>{prop.player}</h4>
                      <p className='text-sm text-slate-400'>
                        {prop.statType} • {prop.choice} {prop.line}
                      </p>
                    </div>
                    <button
                      onClick={() => onRemoveProp(prop.id)}
                      className='text-red-400 hover:text-red-300 text-sm'
                    >
                      Remove
                    </button>
                  </div>
                  <div className='grid grid-cols-3 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-slate-300 mb-1'>
                        Stake ($)
                      </label>
                      <div className='px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-white'>
                        {individualStake.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-slate-300 mb-1'>Odds</label>
                      <div className='px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-white'>
                        {prop.odds ? prop.odds.toFixed(2) : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-slate-300 mb-1'>
                        Potential Win
                      </label>
                      <div className='px-3 py-2 bg-green-600/30 border border-green-500 rounded-md text-green-400 font-semibold'>
                        ${potentialWin.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Entry Amount Control */}
            <div className='p-6 bg-slate-800/50'>
              <div className='mb-4'>
                <label className='block text-sm font-medium text-slate-300 mb-2'>
                  Total Entry Amount
                </label>
                <input
                  type='number'
                  min='1'
                  max='1000'
                  value={entryAmount}
                  onChange={(e) => onEntryAmountChange(Number(e.target.value))}
                  className='w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-white focus:ring-blue-500 focus:border-blue-500'
                />
              </div>

              <div className='flex justify-between items-center mb-4'>
                <span className='text-lg font-semibold text-white'>Total Stake:</span>
                <span className='text-lg font-bold text-white'>
                  ${entryAmount.toFixed(2)}
                </span>
              </div>
              <div className='flex justify-between items-center mb-4'>
                <span className='text-lg font-semibold text-white'>Potential Payout:</span>
                <span className='text-lg font-bold text-green-400'>
                  ${(entryAmount + totalPayout).toFixed(2)}
                </span>
              </div>

              <div className='flex gap-2'>
                <button
                  onClick={onClearSlip}
                  className='flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-semibold'
                >
                  Clear Slip
                </button>
                <button
                  onClick={onPlaceBet}
                  className='flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold'
                >
                  Place Bet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
