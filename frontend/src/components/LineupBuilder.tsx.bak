import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import ApiHealthIndicator from './ApiHealthIndicator';
import ConfidenceIndicator from './ConfidenceIndicator';

const _Spinner = () => (
  <div className='flex justify-center items-center h-24'>
    <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600'></div>
  </div>
);

const _LineupBuilder = () => {
  type Prediction = {
    id: string;
    [key: string]: string | number | boolean | null | undefined;
  };
  type Player = {
    id: string;
    name: string;
    team?: string;
    sport?: string;
    position?: string;
    stats?: Record<string, string | number | boolean | null | undefined>;
  };
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [filterTeam, setFilterTeam] = useState('All');
  const [filterSport, setFilterSport] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [modalPlayer, setModalPlayer] = useState<Player | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    position: 'All',
    minStat: '',
    maxStat: '',
    player: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teams, setTeams] = useState([]);
  const [sports, setSports] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedPredictions, setSelectedPredictions] = useState<Prediction[]>([]);
  type OptimizedLineup = {
    predictions: Prediction[];
    expectedPayout: number;
    confidenceScore: number;
  };
  const [optimizedLineup, setOptimizedLineup] = useState<OptimizedLineup | null>(null);
  const [sport, setSport] = useState('NBA');
  const [legs, setLegs] = useState(2);

  // Fetch lineup data (with optional refresh)
  const _fetchLineup = async (refresh: boolean = false) => {
    setLoading(true);
    setError('');
    const _url = '/api/lineup';
    const _params: string[] = [];
    if (filterDate) params.push(`date=${filterDate}`);
    if (filterStatus !== 'All') params.push(`status=${filterStatus}`);
    if (filterTeam !== 'All') params.push(`team=${filterTeam}`);
    if (filterSport !== 'All') params.push(`sport=${filterSport}`);
    if (refresh) params.push('refresh=true');
    if (params.length) url += '?' + params.join('&');
    try {
      const _res = await axios.get(url);
      setPlayers(Array.isArray(res.data.players) ? res.data.players : []);
      if (res.data.teams) setTeams(res.data.teams);
      if (res.data.sports) setSports(res.data.sports);
      if (refresh) window.alert('Lineup and stats refreshed!');
    } catch (err) {
      setError('Lineup fetch error');
      window.alert('Lineup fetch error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch predictions for selected sport;
  const _fetchPredictions = useCallback(async () => {
    try {
      setLoading(true);
      const _res = await axios.get(`/api/predictions?sport=${sport}`);
      setPredictions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      window.alert('Error fetching predictions');
    } finally {
      setLoading(false);
    }
  }, [sport]);

  // Optimize lineup;
  const _optimizeLineup = useCallback(async () => {
    if (selectedPredictions.length < legs) {
      window.alert(`Please select at least ${legs} predictions`);
      return;
    }
    try {
      setLoading(true);
      const _res = await axios.post('/api/optimize', {
        predictions: selectedPredictions,
        legs,
      });
      setOptimizedLineup(res.data);
      window.alert('Lineup optimized successfully');
    } catch (error) {
      window.alert('Error optimizing lineup');
    } finally {
      setLoading(false);
    }
  }, [selectedPredictions, legs]);

  // Run at startup and on filter change;
  useEffect(() => {
    fetchLineup();
    fetchPredictions();
  }, [filterDate, filterStatus, filterTeam, filterSport, fetchPredictions]);

  const _handleSelect = (player: Player) => {
    setSelectedPlayers(prev =>
      prev.some(p => p.id === player.id) ? prev.filter(p => p.id !== player.id) : [...prev, player]
    );
  };

  // Save lineup POST;
  const _handleSave = async () => {
    try {
      await axios.post('/api/lineup/save', selectedPlayers);
      toast.success('Lineup saved!');
    } catch (err) {
      toast.error('Failed to save lineup');
    }
  };

  const _handleExport = (type: string) => {
    let _dataStr: string, fileName: string;
    if (type === 'csv') {
      const _header = 'id,name,team,sport,position';
      const _rows = selectedPlayers.map(
        p => `${p.id},${p.name},${p.team || ''},${p.sport || ''},${p.position || ''}`
      );
      dataStr = [header, ...rows].join('\n');
      fileName = 'lineup.csv';
    } else {
      dataStr = JSON.stringify(selectedPlayers, null, 2);
      fileName = 'lineup.json';
    }
    const _blob = new Blob([dataStr], { type: type === 'csv' ? 'text/csv' : 'application/json' });
    const _url = URL.createObjectURL(blob);
    const _a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
    window.alert('Lineup exported!');
  };

  // Unique filter options;

  // Advanced filtering logic;
  const _filteredPlayers = players.filter(player => {
    // TODO: Implement actual filtering logic
    return true;
  });

  // Handle prediction selection;
  const _handlePredictionSelect = (prediction: Prediction) => {
    if (selectedPredictions.find((p: Prediction) => p.id === prediction.id)) {
      setSelectedPredictions((prev: Prediction[]) =>
        prev.filter((p: Prediction) => p.id !== prediction.id)
      );
    } else {
      if (selectedPredictions.length >= 6) {
        window.alert('Maximum 6 predictions allowed');
        return;
      }
      setSelectedPredictions((prev: Prediction[]) => [...prev, prediction]);
    }
  };

  // Handle legs change;
  const _handleLegsChange = (newLegs: number) => {
    if (newLegs < 2 || newLegs > 6) {
      window.alert('Number of legs must be between 2 and 6');
      return;
    }
    setLegs(newLegs);
    if (selectedPredictions.length > newLegs) {
      setSelectedPredictions(prev => prev.slice(0, newLegs));
    }
  };

  // Handle sport change;
  const _handleSportChange = (newSport: string) => {
    setSport(newSport);
    setSelectedPredictions([]);
    setOptimizedLineup(null);
  };
  const _positions = ['PG', 'SG', 'SF', 'PF', 'C'];

  if (loading) return <Spinner />;
  if (error) return <div className='p-4 text-red-600'>{error}</div>;
  if (!Array.isArray(players) || players.length === 0) {
    return (
      <div className='p-4 text-center text-gray-500'>
        No players available for lineup. Please check your data source.
      </div>
    );
  }

  return (
    <div className='p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg'>
      this comment to see the full error message
      <div className='flex justify-between items-center mb-4'>
        this comment to see the full error message
        <h2 className='text-2xl font-bold text-gray-800 dark:text-white'>Lineup Builder</h2>
        this comment to see the full error message
        <ApiHealthIndicator />
      </div>
      this comment to see the full error message
      <div
        className='flex flex-wrap gap-4 mb-4 items-end'
        role='region'
        aria-label='Lineup filters'
      >
        this comment to see the full error message
        <div>
          Remove this comment to see the full error message
          <label className='block text-xs font-semibold mb-1' htmlFor='filterTeam'>
            Team
          </label>
          {/* Team filter dropdown */}
          Remove this comment to see the full error message
          <select
            id='filterTeam'
            className='border px-2 py-1'
            value={filterTeam}
            onChange={e => setFilterTeam(e.target.value)}
          >
            Remove this comment to see the full error message
            <option value='All'>All</option>
            {teams.map(team => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>
        this comment to see the full error message
        <div>
          Remove this comment to see the full error message
          <label className='block text-xs font-semibold mb-1' htmlFor='filterSport'>
            Sport
          </label>
          {/* Sport filter dropdown */}
          Remove this comment to see the full error message
          <select
            id='filterSport'
            className='border px-2 py-1'
            value={filterSport}
            onChange={e => setFilterSport(e.target.value)}
          >
            Remove this comment to see the full error message
            <option value='All'>All</option>
            {sports.map(sport => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className='block text-xs font-semibold mb-1' htmlFor='filterPosition'>
            Position
          </label>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <select
            id='filterPosition'
            className='border px-2 py-1'
            value={advancedFilters.position}
            onChange={e => setAdvancedFilters(f => ({ ...f, position: e.target.value }))}
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <option value='All'>All</option>
            {positions.map(pos => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>
        this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <label className='block text-xs font-semibold mb-1' htmlFor='filterMinStat'>
            Min Stat
          </label>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <input
            id='filterMinStat'
            type='number'
            className='border px-2 py-1 w-20'
            value={advancedFilters.minStat}
            onChange={e => setAdvancedFilters(f => ({ ...f, minStat: e.target.value }))}
            placeholder='Min'
          />
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <label className='block text-xs font-semibold mb-1' htmlFor='filterMaxStat'>
            Max Stat
          </label>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <input
            id='filterMaxStat'
            type='number'
            className='border px-2 py-1 w-20'
            value={advancedFilters.maxStat}
            onChange={e => setAdvancedFilters(f => ({ ...f, maxStat: e.target.value }))}
            placeholder='Max'
          />
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <label className='block text-xs font-semibold mb-1' htmlFor='filterPlayer'>
            Player
          </label>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <input
            id='filterPlayer'
            type='text'
            className='border px-2 py-1'
            value={advancedFilters.player}
            onChange={e => setAdvancedFilters(f => ({ ...f, player: e.target.value }))}
            placeholder='Search...'
          />
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <label className='block text-xs font-semibold mb-1' htmlFor='filterDate'>
            Game Date
          </label>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <input
            id='filterDate'
            type='date'
            className='border px-2 py-1'
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <label className='block text-xs font-semibold mb-1' htmlFor='filterStatus'>
            Game Status
          </label>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <select
            id='filterStatus'
            className='border px-2 py-1'
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <option value='All'>All</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <option value='live'>Live</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <option value='future'>Future</option>
          </select>
        </div>
        {/* Selected count and clear button */}
        <div className='ml-auto flex items-center gap-2'>
          <span className='text-sm text-gray-700'>Selected: {selectedPlayers.length}</span>
          <button
            className='px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300'
            onClick={() => setSelectedPlayers([])}
            disabled={selectedPlayers.length === 0}
            title='Clear selection'
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                setSelectedPlayers([]);
              }
            }}
          >
            Clear
          </button>
        </div>
        {/* Export dropdown */}
        <div className='relative'>
          <button
            className='px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700'
            onClick={() => setShowExport(prev => !prev)}
            disabled={selectedPlayers.length === 0}
            title='Export lineup'
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                setShowExport(prev => !prev);
              }
            }}
          >
            ⬇️ Export
          </button>
          {showExport && selectedPlayers.length > 0 && (
            <div className='absolute right-0 mt-1 bg-white border rounded shadow z-10'>
              <button
                className='block w-full px-4 py-2 text-left hover:bg-gray-100'
                onClick={() => handleExport('csv')}
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleExport('csv');
                  }
                }}
              >
                Export as CSV
              </button>
              <button
                className='block w-full px-4 py-2 text-left hover:bg-gray-100'
                onClick={() => handleExport('json')}
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleExport('json');
                  }
                }}
              >
                Export as JSON
              </button>
            </div>
          )}
        </div>
        {/* Refresh button */}
        <button
          className='px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2'
          onClick={() => fetchLineup()}
          disabled={refreshing || loading}
          title='Refresh lineup and stats'
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              fetchLineup();
            }
          }}
        >
          {refreshing ? (
            <span className='animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full'></span>
          ) : (
            <span>🔄</span>
          )}
          Refresh
        </button>
        // @ts-expect-error TS(2304): Cannot find name 'div'.
      </div>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        // @ts-expect-error TS(2304): Cannot find name 'filteredPlayers'.
        {filteredPlayers.map(player => (
          <div
            key={player.id}
            className={`border p-3 rounded shadow cursor-pointer ${
              selectedPlayers.some(p => p.id === player.id)
                ? 'bg-blue-100 border-blue-500'
                : 'bg-white'
            }`}
            onClick={() => handleSelect(player)}
            title={`Click to ${
              selectedPlayers.some(p => p.id === player.id) ? 'remove' : 'add'
            } this player`}
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleSelect(player);
              }
            }}
          >
            <div className='font-bold flex items-center justify-between'>
              {player.name}
              <button
                className='ml-2 text-xs text-blue-600 underline hover:text-blue-800'
                onClick={e => {
                  e.stopPropagation();
                  setModalPlayer(player);
                }}
                title='Show details'
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setModalPlayer(player);
                  }
                }}
              >
                Details
              </button>
            </div>
            <div className='text-sm text-gray-600'>
              {player.team} - {player.sport}
            </div>
          </div>
        ))}
        // @ts-expect-error TS(2304): Cannot find name 'div'.
      </div>
      {/* Modal for player details */}
      // @ts-expect-error TS(2304): Cannot find name 'modalPlayer'.
      {modalPlayer && (
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded shadow-lg max-w-md w-full relative'>
            <button
              className='absolute top-2 right-2 text-gray-500 hover:text-gray-800'
              onClick={() => setModalPlayer(null)}
              title='Close'
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setModalPlayer(null);
                }
              }}
            >
              ✖
            </button>
            <h2 className='text-xl font-bold mb-2'>{modalPlayer.name}</h2>
            <div className='mb-1'>
              Team: <span className='font-semibold'>{modalPlayer.team}</span>
            </div>
            <div className='mb-1'>
              Sport: <span className='font-semibold'>{modalPlayer.sport}</span>
            </div>
            <div className='mb-1'>
              Position: <span className='font-semibold'>{modalPlayer.position || 'N/A'}</span>
            </div>
            <div className='mb-1'>
              Stats:{' '}
              <span className='font-semibold'>
                {modalPlayer.stats ? JSON.stringify(modalPlayer.stats) : 'N/A'}
              </span>
            </div>
            {/* Add more player details as needed */}
          </div>
        </div>
      )}
      <button
        onClick={handleSave}
        className='mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'
        disabled={selectedPlayers.length === 0}
        aria-disabled={selectedPlayers.length === 0}
        aria-label='Save lineup'
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleSave();
          }
        }}
      >
        💾 Save Lineup
      </button>
      {/* Sport Selection */}
      <div className='mb-4'>
        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
          Select Sport
        </label>
        <select
          value={sport}
          onChange={e => handleSportChange(e.target.value)}
          className='w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600'
        >
          <option value='NBA'>NBA</option>
          <option value='WNBA'>WNBA</option>
          <option value='MLB'>MLB</option>
          <option value='NHL'>NHL</option>
          <option value='Soccer'>Soccer</option>
        </select>
      </div>
      {/* Legs Selection */}
      <div className='mb-4'>
        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
          Number of Legs
        </label>
        <input
          type='number'
          min='2'
          max='6'
          value={legs}
          onChange={e => handleLegsChange(parseInt(e.target.value))}
          className='w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600'
        />
      </div>
      {/* Predictions List */}
      // @ts-expect-error TS(2304): Cannot find name 'div'.
      <div className='mb-4'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <h3 className='text-lg font-semibold text-gray-800 dark:text-white mb-2'>
          Available Predictions;
        </h3>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          // @ts-expect-error TS(2304): Cannot find name 'predictions'.
          {predictions.map(prediction => (
            <div
              key={prediction.id}
              onClick={() => handlePredictionSelect(prediction)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedPredictions.find(p => p.id === prediction.id)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              role='button'
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handlePredictionSelect(prediction);
                }
              }}
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='flex justify-between items-start'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <h4 className='font-medium text-gray-900 dark:text-white'>
                    // @ts-expect-error TS(2304): Cannot find name 'prediction'.
                    {prediction.player}
                  </h4>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    // @ts-expect-error TS(2304): Cannot find name 'prediction'.
                    {prediction.stat}
                  </p>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <ConfidenceIndicator
                  confidence={
                    typeof prediction.confidence === 'number'
                      ? prediction.confidence
                      : Number(prediction.confidence) || 0
                  }
                />
              </div>
            </div>
          ))}
          // @ts-expect-error TS(2304): Cannot find name 'div'.
        </div>
        // @ts-expect-error TS(2304): Cannot find name 'div'.
      </div>
      {/* Selected Predictions */}
      // @ts-expect-error TS(2304): Cannot find name 'selectedPredictions'.
      {selectedPredictions.length > 0 && (
        <div className='mb-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <h3 className='text-lg font-semibold text-gray-800 dark:text-white mb-2'>
            // @ts-expect-error TS(2304): Cannot find name 'selectedPredictions'. Selected
            Predictions ({selectedPredictions.length}/{legs})
          </h3>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            // @ts-expect-error TS(2304): Cannot find name 'selectedPredictions'.
            {selectedPredictions.map(prediction => (
              <div
                key={prediction.id}
                className='p-4 border border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-900'
              >
                <div className='flex justify-between items-start'>
                  <div>
                    <h4 className='font-medium text-gray-900 dark:text-white'>
                      {prediction.player}
                    </h4>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>{prediction.stat}</p>
                  </div>
                  <ConfidenceIndicator
                    confidence={
                      typeof prediction.confidence === 'number'
                        ? prediction.confidence
                        : Number(prediction.confidence) || 0
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          // @ts-expect-error TS(2304): Cannot find name 'div'.
        </div>
      )}
      {/* Optimize Button */}
      <button
        onClick={optimizeLineup}
        disabled={loading || selectedPredictions.length < legs}
        className={`w-full py-2 px-4 rounded-md text-white font-medium ${
          loading || selectedPredictions.length < legs
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            optimizeLineup();
          }
        }}
      >
        {loading ? 'Optimizing...' : 'Optimize Lineup'}
      </button>
      {/* Optimized Lineup Display */}
      {optimizedLineup && (
        <div className='mt-4 p-4 border border-green-500 rounded-lg bg-green-50 dark:bg-green-900'>
          <h3 className='text-lg font-semibold text-gray-800 dark:text-white mb-2'>
            Optimized Lineup
          </h3>
          <div className='grid grid-cols-1 gap-4'>
            {optimizedLineup.predictions.map((prediction: Prediction) => (
              <div key={prediction.id} className='p-4 border border-green-500 rounded-lg'>
                <div className='flex justify-between items-start'>
                  <div>
                    <h4 className='font-medium text-gray-900 dark:text-white'>
                      {prediction.player}
                    </h4>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>{prediction.stat}</p>
                  </div>
                  <ConfidenceIndicator
                    confidence={
                      typeof prediction.confidence === 'number'
                        ? prediction.confidence
                        : Number(prediction.confidence) || 0
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <div className='mt-4'>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Expected Payout: {optimizedLineup.expectedPayout}x
            </p>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Confidence Score: {optimizedLineup.confidenceScore}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LineupBuilder;
