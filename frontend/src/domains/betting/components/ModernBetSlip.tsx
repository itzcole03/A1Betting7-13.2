/**
 * Modern Betting Slip Component with React 18+ Features
 *
 * This component demonstrates:
 * - Domain-driven architecture
 * - Modern React patterns (compound components, custom hooks)
 * - Concurrent features (Suspense, useTransition)
 * - Modern state management with Zustand
 * - TypeScript discriminated unions
 */

import React, { useMemo } from 'react';
import {
  ConcurrentList,
  useNonBlockingUpdate,
  withSuspense,
} from '../../../app/providers/ConcurrentFeaturesProvider';
import { useBetSlip } from '../../../app/providers/ModernStateProvider';

// =============================================================================
// TYPES
// =============================================================================

interface BetSlipItemProps {
  bet: {
    id: string;
    gameId: string;
    playerId: string;
    stat: string;
    line: number;
    odds: number;
    type: 'over' | 'under';
    timestamp: number;
  };
  stake: number;
  onUpdateStake: (betId: string, stake: number) => void;
  onRemove: (betId: string) => void;
}

interface BetSlipSummaryProps {
  totalStake: number;
  totalPayout: number;
  validBetsCount: number;
}

interface BetSlipProps {
  className?: string;
  compact?: boolean;
}

// =============================================================================
// BET SLIP ITEM COMPONENT
// =============================================================================

const BetSlipItem: React.FC<BetSlipItemProps> = ({ bet, stake, onUpdateStake, onRemove }) => {
  const { updateWithTransition } = useNonBlockingUpdate();

  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStake = parseFloat(e.target.value) || 0;
    updateWithTransition(() => {
      onUpdateStake(bet.id, newStake);
    });
  };

  const potentialPayout = useMemo(() => {
    return (stake * bet.odds).toFixed(2);
  }, [stake, bet.odds]);

  return (
    <div className='border border-gray-200 rounded-lg p-4 mb-3 bg-white'>
      <div className='flex justify-between items-start mb-2'>
        <div className='flex-1'>
          <h4 className='font-semibold text-gray-900'>Player {bet.playerId}</h4>
          <p className='text-sm text-gray-600'>
            {bet.stat} {bet.type} {bet.line}
          </p>
        </div>
        <button
          onClick={() => onRemove(bet.id)}
          className='text-red-500 hover:text-red-700 text-sm'
          aria-label='Remove bet'
        >
          ✕
        </button>
      </div>

      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <label htmlFor={`stake-${bet.id}`} className='text-sm text-gray-600'>
            Stake:
          </label>
          <input
            id={`stake-${bet.id}`}
            type='number'
            min='0'
            step='0.01'
            value={stake}
            onChange={handleStakeChange}
            className='w-20 px-2 py-1 border border-gray-300 rounded text-sm'
          />
        </div>

        <div className='text-right'>
          <div className='text-sm text-gray-600'>
            Odds: {bet.odds > 0 ? '+' : ''}
            {bet.odds}
          </div>
          <div className='font-semibold text-green-600'>${potentialPayout}</div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// BET SLIP SUMMARY COMPONENT
// =============================================================================

const BetSlipSummary: React.FC<BetSlipSummaryProps> = ({
  totalStake,
  totalPayout,
  validBetsCount,
}) => (
  <div className='border-t border-gray-200 pt-4 mt-4'>
    <div className='space-y-2'>
      <div className='flex justify-between text-sm'>
        <span className='text-gray-600'>Total Bets:</span>
        <span className='font-medium'>{validBetsCount}</span>
      </div>
      <div className='flex justify-between text-sm'>
        <span className='text-gray-600'>Total Stake:</span>
        <span className='font-medium'>${totalStake.toFixed(2)}</span>
      </div>
      <div className='flex justify-between text-lg font-semibold'>
        <span>Potential Payout:</span>
        <span className='text-green-600'>${totalPayout.toFixed(2)}</span>
      </div>
    </div>

    <button
      disabled={validBetsCount === 0}
      className={`w-full mt-4 px-4 py-2 rounded-lg font-medium ${
        validBetsCount > 0
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      }`}
    >
      Place Bet{validBetsCount > 1 ? 's' : ''}
    </button>
  </div>
);

// =============================================================================
// MAIN BET SLIP COMPONENT
// =============================================================================

const BetSlipComponent: React.FC<BetSlipProps> = ({ className = '', compact = false }) => {
  const {
    selectedBets,
    stakes,
    updateStake,
    removeBet,
    clearBetSlip,
    totalStake,
    totalPayout,
    validBets,
  } = useBetSlip();

  const { updateWithTransition } = useNonBlockingUpdate();

  const handleClearAll = () => {
    updateWithTransition(() => {
      clearBetSlip();
    });
  };

  if (selectedBets.length === 0) {
    return (
      <div className={`p-8 text-center text-gray-500 ${className}`}>
        <div className='text-4xl mb-2'>🎯</div>
        <p>No bets selected</p>
        <p className='text-sm'>Add some bets to get started!</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className='flex justify-between items-center mb-4'>
        <h3 className={`font-semibold ${compact ? 'text-lg' : 'text-xl'}`}>
          Bet Slip ({selectedBets.length})
        </h3>
        {selectedBets.length > 0 && (
          <button onClick={handleClearAll} className='text-sm text-red-500 hover:text-red-700'>
            Clear All
          </button>
        )}
      </div>

      <ConcurrentList
        items={selectedBets}
        renderItem={bet => (
          <BetSlipItem
            bet={bet}
            stake={stakes[bet.id] || 0}
            onUpdateStake={updateStake}
            onRemove={removeBet}
          />
        )}
        keyExtractor={bet => bet.id}
        className='space-y-2'
      />

      <BetSlipSummary
        totalStake={totalStake}
        totalPayout={totalPayout}
        validBetsCount={validBets.length}
      />
    </div>
  );
};

// =============================================================================
// COMPOUND COMPONENT PATTERN
// =============================================================================

const BetSlip = Object.assign(BetSlipComponent, {
  Item: BetSlipItem,
  Summary: BetSlipSummary,
});

// =============================================================================
// EXPORT WITH SUSPENSE
// =============================================================================

export default withSuspense(BetSlip, <div>Loading bet slip...</div>);
export { BetSlip, BetSlipItem, BetSlipSummary };
