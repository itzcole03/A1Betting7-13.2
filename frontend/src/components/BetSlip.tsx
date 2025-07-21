import React, { useState } from 'react';
// @ts-expect-error TS(6142): Module './Button' was resolved to 'C:/Users/bcmad/... Remove this comment to see the full error message
import { Button } from './Button';
// @ts-expect-error TS(6142): Module './Card' was resolved to 'C:/Users/bcmad/Do... Remove this comment to see the full error message
import { Card, CardContent, CardFooter, CardHeader } from './Card';

interface BetSlipProps {
  onSubmit?: (bet: { amount: number; selection: string }) => void;
  className?: string;
}

/**
 * BetSlip Component
 *
 * Modern, accessible bet slip for entering and submitting bets.
 * Includes validation, error handling, and integration with the platform's betting logic.
 *
 * @param onSubmit - Callback for bet submission
 * @param className - Additional CSS classes
 */
export const BetSlip: React.FC<BetSlipProps> = ({ onSubmit, className = '' }) => {
  const [amount, setAmount] = useState<number>(0);
  const [selection, setSelection] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selection) {
      setError('Please select a bet.');
      return;
    }
    if (amount <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSubmit?.({ amount, selection });
    }, 800);
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Card className={`max-w-md mx-auto ${className}`}>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <CardHeader>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <h2 className='text-lg font-bold text-white'>Bet Slip</h2>
      </CardHeader>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <form onSubmit={handleSubmit}>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <CardContent className='space-y-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <label htmlFor='bet-selection' className='block text-sm font-medium text-gray-300 mb-1'>
              Selection
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <input
              id='bet-selection'
              type='text'
              value={selection}
              onChange={e => setSelection(e.target.value)}
              className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500'
              placeholder='Enter your bet selection'
              required
            />
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <label htmlFor='bet-amount' className='block text-sm font-medium text-gray-300 mb-1'>
              Amount ($)
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <input
              id='bet-amount'
              type='number'
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500'
              min={1}
              required
            />
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          {error && <div className='text-red-500 text-sm'>{error}</div>}
        </CardContent>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <CardFooter>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Button type='submit' variant='primary' isLoading={isSubmitting} className='w-full'>
            Place Bet
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default BetSlip;
