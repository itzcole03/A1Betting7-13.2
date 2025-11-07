import { RefreshCw, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';
import type { OddsSnapshot } from '../../hooks/useOddsHistory';
import { useOddsHistory } from '../../hooks/useOddsHistory';
import { MovementAnalysis } from '../analysis/MovementAnalysis';

interface MovementAnalysisDemoProps {
  propId?: string;
  sportsbook?: string;
  hoursBack?: number;
}

export const MovementAnalysisDemo: React.FC<MovementAnalysisDemoProps> = ({
  propId = 'sample-prop-123',
  sportsbook,
  hoursBack = 24,
}) => {
  const [selectedPropId, setSelectedPropId] = useState(propId);
  const [selectedSportsbook, setSelectedSportsbook] = useState<string | undefined>(sportsbook);
  const [selectedHoursBack, setSelectedHoursBack] = useState(hoursBack);

  const { data, loading, error, refetch, totalSnapshots, dateRange } = useOddsHistory(
    {
      prop_id: selectedPropId,
      sportsbook: selectedSportsbook,
      hours_back: selectedHoursBack,
    },
    true
  );

  const handleRefresh = () => {
    refetch();
  };

  const handlePropIdChange = (newPropId: string) => {
    setSelectedPropId(newPropId);
  };

  const handleSportsbookChange = (newSportsbook: string) => {
    setSelectedSportsbook(newSportsbook || undefined);
  };

  const handleHoursBackChange = (newHours: number) => {
    setSelectedHoursBack(newHours);
  };

  // Sample prop IDs for demo
  const samplePropIds = [
    'sample-prop-123',
    'nba-points-456',
    'mlb-strikeouts-789',
    'nfl-passing-yards-101',
  ];

  const sportsbooks = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'Barstool'];

  if (loading) {
    return (
      <div className='w-full max-w-6xl mx-auto p-6'>
        <div className='bg-white rounded-lg shadow-md border border-slate-100 p-8'>
          <div className='flex items-center justify-center'>
            <RefreshCw className='w-8 h-8 animate-spin text-blue-500 mr-3' />
            <span className='text-lg text-slate-600'>Loading odds history...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='w-full max-w-6xl mx-auto p-6'>
        <div className='bg-red-50 rounded-lg shadow-md border border-red-200 p-8'>
          <div className='text-center'>
            <div className='text-red-600 text-lg font-medium mb-2'>Error Loading Data</div>
            <div className='text-red-500'>{error}</div>
            <button
              onClick={handleRefresh}
              className='mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors'
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className='w-full max-w-6xl mx-auto p-6'>
        <div className='bg-yellow-50 rounded-lg shadow-md border border-yellow-200 p-8'>
          <div className='text-center'>
            <TrendingUp className='w-12 h-12 text-yellow-500 mx-auto mb-4' />
            <div className='text-yellow-800 text-lg font-medium mb-2'>No Data Available</div>
            <div className='text-yellow-600 mb-4'>
              No odds history found for prop ID: {selectedPropId}
            </div>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-yellow-700 mb-2'>
                  Try a different Prop ID:
                </label>
                <select
                  value={selectedPropId}
                  onChange={e => handlePropIdChange(e.target.value)}
                  className='w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500'
                >
                  {samplePropIds.map(id => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleRefresh}
                className='px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors'
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prepare data for MovementAnalysis component
  const movementData = {
    prop_id: selectedPropId,
    sportsbook: selectedSportsbook || 'All Sportsbooks',
    total_snapshots: totalSnapshots,
    date_range: dateRange || { start: '', end: '' },
    snapshots: data,
  };

  return (
    <div className='w-full max-w-6xl mx-auto p-6 space-y-6'>
      {/* Controls */}
      <div className='bg-white rounded-lg shadow-md border border-slate-100 p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-semibold text-slate-900'>Movement Analysis Demo</h2>
          <button
            onClick={handleRefresh}
            className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
          >
            <RefreshCw className='w-4 h-4' />
            Refresh
          </button>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-2'>Prop ID</label>
            <select
              value={selectedPropId}
              onChange={e => handlePropIdChange(e.target.value)}
              className='w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              {samplePropIds.map(id => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-slate-700 mb-2'>
              Sportsbook (Optional)
            </label>
            <select
              value={selectedSportsbook || ''}
              onChange={e => handleSportsbookChange(e.target.value)}
              className='w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value=''>All Sportsbooks</option>
              {sportsbooks.map(book => (
                <option key={book} value={book}>
                  {book}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-slate-700 mb-2'>Hours Back</label>
            <select
              value={selectedHoursBack}
              onChange={e => handleHoursBackChange(Number(e.target.value))}
              className='w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value={1}>1 Hour</option>
              <option value={4}>4 Hours</option>
              <option value={12}>12 Hours</option>
              <option value={24}>24 Hours</option>
              <option value={48}>48 Hours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Movement Analysis Component */}
      <MovementAnalysis
        data={movementData}
        title={`Line Movement: ${selectedPropId}`}
        height={500}
        showAlerts={true}
        showSteamDetection={true}
      />

      {/* Data Summary */}
      <div className='bg-white rounded-lg shadow-md border border-slate-100 p-6'>
        <h3 className='text-lg font-semibold text-slate-900 mb-4'>Data Summary</h3>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
          <div>
            <span className='font-medium text-slate-600'>Total Snapshots:</span>
            <span className='ml-2 text-slate-900'>{totalSnapshots}</span>
          </div>
          <div>
            <span className='font-medium text-slate-600'>Date Range:</span>
            <span className='ml-2 text-slate-900'>
              {dateRange
                ? `${new Date(dateRange.start).toLocaleDateString()} - ${new Date(
                    dateRange.end
                  ).toLocaleDateString()}`
                : 'N/A'}
            </span>
          </div>
          <div>
            <span className='font-medium text-slate-600'>Sportsbooks:</span>
            <span className='ml-2 text-slate-900'>
              {new Set((data as OddsSnapshot[]).map(d => d.sportsbook)).size}
            </span>
          </div>
          <div>
            <span className='font-medium text-slate-600'>Last Updated:</span>
            <span className='ml-2 text-slate-900'>
              {(data as OddsSnapshot[]).length > 0
                ? new Date(
                    Math.max(
                      ...(data as OddsSnapshot[]).map(d =>
                        new Date(d.captured_at || d.timestamp || 0).getTime()
                      )
                    )
                  ).toLocaleTimeString()
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovementAnalysisDemo;
