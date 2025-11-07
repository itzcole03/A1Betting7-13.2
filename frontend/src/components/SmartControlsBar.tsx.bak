import React, { useState } from 'react';

const _SmartControlsBar = () => {
  const [sport, setSport] = useState('NBA');
  const [legs, setLegs] = useState(3);
  const [confidence, setConfidence] = useState(0.7);
  const [useSentiment, setUseSentiment] = useState(true);
  const [useVolatility, setUseVolatility] = useState(true);
  const [entryAmount, setEntryAmount] = useState(10);

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='p-4 mb-4 border rounded-md bg-white shadow-md grid gap-4 md:grid-cols-2'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex flex-wrap gap-4 items-center'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <label className='font-medium'>
          Legs:
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <select
            value={legs}
            onChange={e => setLegs(parseInt(e.target.value))}
            className='ml-2 p-1 border rounded'
          >
            {[2, 3, 4, 5, 6].map(n => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <label className='font-medium'>
          Sport:
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <select
            value={sport}
            onChange={e => setSport(e.target.value)}
            className='ml-2 p-1 border rounded'
          >
            {['NBA', 'WNBA', 'MLB', 'NHL', 'Soccer'].map(s => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <label className='font-medium'>
          Confidence ≥ {Math.round(confidence * 100)}%
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <input
            type='range'
            min='0.5'
            max='1'
            step='0.01'
            value={confidence}
            onChange={e => setConfidence(parseFloat(e.target.value))}
            className='ml-2'
          />
        </label>
      </div>

      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex flex-wrap gap-4 items-center'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <label className='flex items-center gap-1'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <input
            type='checkbox'
            checked={useSentiment}
            onChange={() => setUseSentiment(!useSentiment)}
          />
          Social Sentiment;
        </label>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <label className='flex items-center gap-1'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <input
            type='checkbox'
            checked={useVolatility}
            onChange={() => setUseVolatility(!useVolatility)}
          />
          Volatility;
        </label>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <label className='font-medium'>
          Entry: $
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <input
            type='number'
            value={entryAmount}
            min={1}
            onChange={e => setEntryAmount(Number(e.target.value))}
            className='ml-1 w-16 p-1 border rounded'
          />
        </label>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <span className='font-bold text-green-600'>Payout: ${safeNumber(payout, 2)}</span>
      </div>
    </div>
  );
};

export default SmartControlsBar;
