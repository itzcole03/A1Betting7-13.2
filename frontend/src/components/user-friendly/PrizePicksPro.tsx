// CANONICAL PRIZEPICKSPRO COMPONENT
// This is the single source of truth for PrizePicksPro.
// All features from PrizePicksProUnified_Clean.tsx and this file should be merged here.
// Remove all other PrizePicksPro* files after merging.
// Ensure backend integration, filtering, mock data fallback, and user-friendly UI are all present.
// (Manual merge of advanced and user-friendly features required.)

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { usePrizePicksProps } from '../../hooks/usePrizePicksProps';
// import { useQuantumPredictions } from '../../hooks/useQuantumPredictions'; // Uncomment if quantum predictions are available
import type {
  PrizePicksProjection,
  SavedLineup,
  SelectedProp,
} from '../../types/prizePicksUnified';

const PrizePicksPro: React.FC = () => {
  const { data: allProps, loading, error } = usePrizePicksProps();
  const [selectedProps, setSelectedProps] = useState<Map<string, SelectedProp>>(new Map());
  const [entryAmount, setEntryAmount] = useState<number>(25);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [lineupName, setLineupName] = useState('');
  const [savedLineups, setSavedLineups] = useState<SavedLineup[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Validate picks
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

  // Select or deselect a prop
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

  // Calculate payout
  const calculatePayout = () => {
    const count = selectedProps.size;
    const multipliers: Record<number, number> = { 2: 3, 3: 5, 4: 10, 5: 20, 6: 50 };
    return count >= 2 ? entryAmount * (multipliers[count] || 0) * 1.5 : 0;
  };

  // Get pick requirements
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

  // Save lineup
  const saveLineup = () => {
    if (!lineupName.trim()) {
      toast.error('Please enter a lineup name');
      return;
    }
    const picks = Array.from(selectedProps.values()).map(pick => {
      const prop = allProps.find((p: PrizePicksProjection) => p.id === pick.propId);
      return {
        player: prop?.player?.name || prop?.player_id || '-',
        stat: prop?.stat_type || '-',
        line:
          typeof prop?.line_score === 'number' ? prop.line_score : Number(prop?.line_score) || 0,
        choice: pick.choice,
        confidence: prop?.confidence || 0,
      };
    });
    const lineup: SavedLineup = {
      id: `lineup_${Date.now()}`,
      name: lineupName,
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

  if (loading) return <div className='ppro-loading'>Loading PrizePicks props...</div>;
  if (error) return <div className='ppro-error'>Error: {error}</div>;
  if (!allProps || allProps.length === 0)
    return <div className='ppro-empty'>No PrizePicks props available.</div>;

  return (
    <div className='ppro-container'>
      <h2>PrizePicks Props</h2>
      <div className='ppro-controls'>
        <input
          type='number'
          min={5}
          max={1000}
          value={entryAmount}
          onChange={e => setEntryAmount(Number(e.target.value))}
          placeholder='Entry Amount ($)'
        />
        <button onClick={() => setShowSaveModal(true)} disabled={selectedProps.size < 2}>
          Save Lineup
        </button>
        {validationErrors.length > 0 && (
          <div className='ppro-validation-errors'>
            {validationErrors.map((err, i) => (
              <div key={i} className='ppro-error-message'>
                {err}
              </div>
            ))}
          </div>
        )}
      </div>
      <table className='ppro-table'>
        <thead>
          <tr>
            <th>Player</th>
            <th>Stat Type</th>
            <th>Line</th>
            <th>Description</th>
            <th>Start Time</th>
            <th>Pick</th>
          </tr>
        </thead>
        <tbody>
          {allProps.map((prop: PrizePicksProjection) => (
            <tr key={prop.id}>
              <td>{prop.player?.name || prop.player_id}</td>
              <td>{prop.stat_type}</td>
              <td>{prop.line_score}</td>
              <td>{prop.description || '-'}</td>
              <td>{prop.start_time ? new Date(prop.start_time).toLocaleString() : '-'}</td>
              <td>
                <button onClick={() => selectProp(prop.id, 'over')}>Over</button>
                <button onClick={() => selectProp(prop.id, 'under')}>Under</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className='ppro-summary'>
        <div>
          Selected: {selectedProps.size} | {getPickRequirements()}
        </div>
        <div>Potential Payout: ${calculatePayout().toFixed(2)}</div>
      </div>
      {showSaveModal && (
        <div className='ppro-modal'>
          <div className='ppro-modal-content'>
            <h3>Save Lineup</h3>
            <input
              type='text'
              value={lineupName}
              onChange={e => setLineupName(e.target.value)}
              placeholder='Lineup Name'
            />
            <button onClick={saveLineup}>Save</button>
            <button onClick={() => setShowSaveModal(false)}>Cancel</button>
          </div>
        </div>
      )}
      {showSuccess && <div className='ppro-success'>Lineup saved!</div>}
    </div>
  );
};

export default PrizePicksPro;
