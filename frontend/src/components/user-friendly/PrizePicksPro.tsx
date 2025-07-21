import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { usePrizePicksProps } from '../../hooks/usePrizePicksProps';
// import { useQuantumPredictions } from '../../hooks/useQuantumPredictions'; // Uncomment if quantum predictions are available
import type {
  PrizePicksProjection,
  SelectedProp,
  SavedLineup,
} from '../../types/prizePicksUnified';

const PrizePicksPro: React.FC = () => {
  const { data, loading, error } = usePrizePicksProps();
  const [selectedProps, setSelectedProps] = useState<Map<string, SelectedProp>>(new Map());
  const [entryAmount, setEntryAmount] = useState<number>(25);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [lineupName, setLineupName] = useState('');
  const [savedLineups, setSavedLineups] = useState<SavedLineup[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Uncomment and integrate if quantum predictions are available
  // const quantumOptions = React.useMemo(() => ({ minConfidence: 80 }), []);
  // const { predictions: quantumPredictions } = useQuantumPredictions(quantumOptions);
  // const quantumProps = quantumPredictions.map(...)

  // Combine quantum predictions with real PrizePicks data if needed
  const allProps: PrizePicksProjection[] = data;

  const validatePicks = (newProps: Map<string, SelectedProp>) => {
    const errors: string[] = [];
    const picks = Array.from(newProps.values());
    if (picks.length < 2) errors.push('Minimum 2 picks required');
    if (picks.length > 6) errors.push('Maximum 6 picks allowed');
    if (entryAmount < 5) errors.push('Minimum entry amount is $5');
    if (entryAmount > 1000) errors.push('Maximum entry amount is $1000');
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const selectProp = (propId: string, choice: 'over' | 'under') => {
    const key = `${propId}_${choice}`;
    const newProps = new Map(selectedProps);
    if (selectedProps.has(key)) {
      newProps.delete(key);
    } else if (selectedProps.size < 6) {
      const existingKey = `${propId}_${choice === 'over' ? 'under' : 'over'}`;
      if (newProps.has(existingKey)) newProps.delete(existingKey);
      newProps.set(key, { propId, choice });
    }
    setSelectedProps(newProps);
    validatePicks(newProps);
  };

  const calculatePayout = () => {
    const count = selectedProps.size;
    const multipliers: Record<number, number> = { 2: 3, 3: 5, 4: 10, 5: 20, 6: 50 };
    return count >= 2 ? entryAmount * (multipliers[count] || 0) * 1.5 : 0;
  };

  const getPickRequirements = () => {
    const count = selectedProps.size;
    const requirements: Record<number, string> = {
      2: 'Power Play (2 picks)',
      3: 'Flex Play (3 picks)',
      4: 'Power Play (4 picks)',
      5: 'Flex Play (5 picks)',
      6: 'Power Play (6 picks)',
    };
    return requirements[count] || `Select ${Math.max(0, 2 - count)} more`;
  };

  const saveLineup = () => {
    if (!lineupName.trim()) {
      toast.error('Please enter a lineup name');
      return;
    }
    const picks = Array.from(selectedProps.values()).map(pick => {
      const prop = allProps.find(p => p.id === pick.propId)!;
      return {
        // @ts-expect-error TS(2551): Property 'playerId' does not exist on type 'PrizeP... Remove this comment to see the full error message
        player: prop.player?.name || prop.playerId,
        stat: prop.statType,
        line: prop.line,
        choice: pick.choice,
        confidence: 0, // Add real confidence if available
      };
    });
    const lineup: SavedLineup = {
      id: `lineup_${Date.now()}`,
      name: lineupName,
      // @ts-expect-error TS(2322): Type '{ player: any; stat: string | undefined; lin... Remove this comment to see the full error message
      picks,
      entryAmount,
      projectedPayout: calculatePayout(),
      savedAt: new Date(),
    };
    setSavedLineups(prev => [...prev, lineup]);
    setShowSaveModal(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  if (loading) return <div className='ppro-loading'>Loading PrizePicks props...</div>;
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  if (error) return <div className='ppro-error'>Error: {error}</div>;
  if (!allProps || allProps.length === 0)
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    return <div className='ppro-empty'>No PrizePicks props available.</div>;

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='ppro-container'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <h2>PrizePicks Props</h2>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='ppro-controls'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <input
          type='number'
          min={5}
          max={1000}
          value={entryAmount}
          onChange={e => setEntryAmount(Number(e.target.value))}
          placeholder='Entry Amount ($)'
        />
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <button onClick={() => setShowSaveModal(true)} disabled={selectedProps.size < 2}>
          Save Lineup
        </button>
        {validationErrors.length > 0 && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='ppro-validation-errors'>
            {validationErrors.map((err, i) => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div key={i} className='ppro-error-message'>
                {err}
              </div>
            ))}
          </div>
        )}
      </div>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <table className='ppro-table'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <thead>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <tr>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <th>Player</th>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <th>Stat Type</th>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <th>Line</th>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <th>Description</th>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <th>Start Time</th>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <th>Pick</th>
          </tr>
        </thead>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <tbody>
          {allProps.map((prop: PrizePicksProjection) => (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <tr key={prop.id}>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <td>{prop.player?.name || prop.playerId}</td>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <td>{prop.statType}</td>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <td>{prop.line}</td>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <td>{prop.description || '-'}</td>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <td>{prop.startTime ? new Date(prop.startTime).toLocaleString() : '-'}</td>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <td>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <button onClick={() => selectProp(prop.id, 'over')}>Over</button>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <button onClick={() => selectProp(prop.id, 'under')}>Under</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='ppro-summary'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div>
          Selected: {selectedProps.size} | {getPickRequirements()}
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div>Potential Payout: ${calculatePayout().toFixed(2)}</div>
      </div>
      {showSaveModal && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='ppro-modal'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='ppro-modal-content'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3>Save Lineup</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <input
              type='text'
              value={lineupName}
              onChange={e => setLineupName(e.target.value)}
              placeholder='Lineup Name'
            />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <button onClick={saveLineup}>Save</button>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <button onClick={() => setShowSaveModal(false)}>Cancel</button>
          </div>
        </div>
      )}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      {showSuccess && <div className='ppro-success'>Lineup saved!</div>}
    </div>
  );
};

export default PrizePicksPro;
