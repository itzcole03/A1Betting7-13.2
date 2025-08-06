/**
 * BetSlipComponent
 *
 * Manages the selected props and bet slip functionality.
 */

import React from 'react';
import { SelectedProp, formatCurrency } from '../shared/PropOllamaTypes';

interface BetSlipComponentProps {
  selectedProps: SelectedProp[];
  entryAmount: number;
  onEntryAmountChange: (amount: number) => void;
  onRemoveProp: (propId: string) => void;
  onClearSlip: () => void;
  onPlaceBet?: () => void;
  className?: string;
}

const BetSlipComponentInner: React.FC<BetSlipComponentProps> = ({
  selectedProps,
  entryAmount,
  onEntryAmountChange,
  onRemoveProp,
  onClearSlip,
  onPlaceBet,
  className = '',
}) => {
  console.count('[BetSlipComponent] RENDER');
  // Calculate total odds and potential payout
  const totalOdds = selectedProps.reduce((total, prop) => {
    const odds = typeof prop.odds === 'number' ? prop.odds : 0;
    return (
      total +
      Math.log(Math.abs(odds) > 100 ? (odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1) : 2)
    );
  }, 0);

  const decimalOdds = Math.exp(totalOdds);
  const potentialPayout = entryAmount * decimalOdds;
  const potentialProfit = potentialPayout - entryAmount;

  if (selectedProps.length === 0) {
    return (
      <div className={`bet-slip empty ${className}`}>
        <h3 className='bet-slip-title'>Bet Slip</h3>
        <p className='empty-message'>Select props to build your bet slip</p>

        <style>{`
          .bet-slip.empty {
            padding: 1.5rem;
            background: #f9fafb;
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            text-align: center;
          }

          .bet-slip-title {
            margin: 0 0 1rem 0;
            font-size: 1.25rem;
            font-weight: 600;
            color: #374151;
          }

          .empty-message {
            margin: 0;
            color: #6b7280;
            font-style: italic;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`bet-slip ${className}`}>
      <div className='bet-slip-header'>
        <h3 className='bet-slip-title'>Bet Slip ({selectedProps.length})</h3>
        <button onClick={onClearSlip} className='clear-button'>
          Clear All
        </button>
      </div>

      <div className='selected-props'>
        {selectedProps.map(prop => (
          <div key={prop.id} className='selected-prop'>
            <div className='prop-info'>
              <div className='prop-player'>{prop.player}</div>
              <div className='prop-details'>
                {prop.statType} {prop.choice} {prop.line}
              </div>
              <div className='prop-odds'>
                {typeof prop.odds === 'number'
                  ? prop.odds > 0
                    ? `+${prop.odds}`
                    : prop.odds
                  : prop.odds}
              </div>
            </div>
            <button
              onClick={() => onRemoveProp(prop.id)}
              className='remove-button'
              aria-label={`Remove ${prop.player} prop`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className='bet-slip-controls'>
        <div className='entry-amount-group'>
          <label htmlFor='entry-amount' className='entry-label'>
            Entry Amount:
          </label>
          <div className='amount-input-group'>
            <span className='currency-symbol'>$</span>
            <input
              id='entry-amount'
              type='number'
              min='1'
              max='10000'
              step='1'
              value={entryAmount}
              onChange={e => onEntryAmountChange(Number(e.target.value))}
              className='amount-input'
            />
          </div>
        </div>

        <div className='payout-info'>
          <div className='payout-row'>
            <span>Total Odds:</span>
            <span className='odds-value'>{decimalOdds.toFixed(2)}x</span>
          </div>
          <div className='payout-row'>
            <span>Potential Payout:</span>
            <span className='payout-value'>{formatCurrency(potentialPayout)}</span>
          </div>
          <div className='payout-row profit'>
            <span>Potential Profit:</span>
            <span className='profit-value'>{formatCurrency(potentialProfit)}</span>
          </div>
        </div>

        {onPlaceBet && (
          <button onClick={onPlaceBet} className='place-bet-button'>
            Place Bet
          </button>
        )}
      </div>

      <style>{`
        .bet-slip {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1.5rem;
          min-width: 300px;
        }

        .bet-slip-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .bet-slip-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
        }

        .clear-button {
          background: none;
          border: 1px solid #d1d5db;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.875rem;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-button:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .selected-props {
          margin-bottom: 1.5rem;
        }

        .selected-prop {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          background: #f9fafb;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        .prop-info {
          flex: 1;
        }

        .prop-player {
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .prop-details {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .prop-odds {
          font-weight: 600;
          color: #059669;
        }

        .remove-button {
          background: #ef4444;
          color: white;
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          transition: background-color 0.2s;
        }

        .remove-button:hover {
          background: #dc2626;
        }

        .bet-slip-controls {
          border-top: 1px solid #e5e7eb;
          padding-top: 1rem;
        }

        .entry-amount-group {
          margin-bottom: 1rem;
        }

        .entry-label {
          display: block;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .amount-input-group {
          display: flex;
          align-items: center;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          overflow: hidden;
        }

        .currency-symbol {
          background: #f3f4f6;
          padding: 0.5rem 0.75rem;
          border-right: 1px solid #d1d5db;
          font-weight: 500;
          color: #374151;
        }

        .amount-input {
          flex: 1;
          border: none;
          padding: 0.5rem 0.75rem;
          font-size: 1rem;
          outline: none;
        }

        .payout-info {
          margin-bottom: 1rem;
        }

        .payout-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .payout-row.profit {
          font-weight: 600;
          padding-top: 0.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .odds-value {
          color: #059669;
          font-weight: 600;
        }

        .payout-value {
          color: #111827;
          font-weight: 500;
        }

        .profit-value {
          color: #059669;
          font-weight: 600;
        }

        .place-bet-button {
          width: 100%;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .place-bet-button:hover {
          background: #2563eb;
        }

        .place-bet-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export const BetSlipComponent = React.memo(BetSlipComponentInner);
