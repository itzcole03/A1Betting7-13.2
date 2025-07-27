// Utility to safely render table cell values

function safeCell(val: any): React.ReactNode {
  if (val == null) return '';
  if (Array.isArray(val)) return '';
  if (typeof val === 'object') {
    if (React.isValidElement(val)) return val;
    return JSON.stringify(val);
  }
  if (typeof val === 'string' || typeof val === 'number') return val;
  return String(val);
}

import React, { useState } from 'react';

// Error boundary for debugging React child errors
class DebugErrorBoundary extends React.Component<any, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: 'red', color: 'white', padding: 24, fontWeight: 'bold' }}>
          Error: {String(this.state.error)}
        </div>
      );
    }
    return this.props.children;
  }
}

interface PropProjection {
  id: string;
  player: string;
  team: string;
  sport: string;
  statType: string;
  line: number;
  overOdds: number;
  underOdds: number;
  confidence: number;
  value: number;
  overReasoning: string;
  underReasoning: string;
}

interface SelectedProp {
  id: string;
  player: string;
  statType: string;
  line: number;
  choice: 'over' | 'under';
  odds: number;
}

const USER_ID = 'demo_user'; // Replace with real user/session logic
const SESSION_ID = 'default_session';

const CHAT_API_BASE = '/api/chat';

const defaultProjections: PropProjection[] = [
  {
    id: '1',
    player: 'LeBron James',
    team: 'LAL',
    sport: 'NBA',
    statType: 'Points',
    line: 27.5,
    overOdds: 1.8,
    underOdds: 2.0,
    confidence: 92,
    value: 8.5,
    overReasoning:
      'LeBron has scored over 27.5 in 7 of his last 10 games. The Lakers are playing at a fast pace and the matchup is favorable.',
    underReasoning:
      'LeBron may see reduced minutes in a potential blowout, and the opposing defense has improved recently. Regression is possible.',
  },
];

const PropOllamaUnified: React.FC = () => {
  // State declarations
  const [renderError, setRenderError] = useState<string | null>(null);
  // Expanded prop state
  const [expandedPropId, setExpandedPropId] = useState<string | null>(null);
  const [projections, setProjections] = useState<PropProjection[]>(defaultProjections);
  const [selectedProps, setSelectedProps] = useState<SelectedProp[]>([]);
  const [entryAmount, setEntryAmount] = useState<number>(10);
  const [sortBy, setSortBy] = useState<'confidence' | 'value' | 'player'>('confidence');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Per-prop analysis state
  const [analyzingPropId, setAnalyzingPropId] = useState<string | null>(null);
  const [propAnalystResponses, setPropAnalystResponses] = useState<
    Record<string, { loading: boolean; error?: string; content?: string }>
  >({});

  // Ensemble LLM analysis state
  const [ensembleLoading, setEnsembleLoading] = useState<boolean>(false);
  const [ensembleError, setEnsembleError] = useState<string | null>(null);
  const [ensembleResult, setEnsembleResult] = useState<string | null>(null);

  // Sports options
  const sports = ['All', 'NBA', 'NFL', 'NHL', 'MLB'];

  // Sort handler
  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as 'confidence' | 'value' | 'player');
  };

  // isSelected handler
  const isSelected = (projectionId: string) => selectedProps.some(p => p.id === projectionId);

  // addProp handler
  const addProp = (proj: PropProjection, choice: 'over' | 'under') => {
    if (selectedProps.length < 6 && !isSelected(proj.id)) {
      setSelectedProps([
        ...selectedProps,
        {
          id: proj.id,
          player: proj.player,
          statType: proj.statType,
          line: proj.line,
          choice,
          odds: choice === 'over' ? proj.overOdds : proj.underOdds,
        },
      ]);
    }
  };

  // removeProp handler
  const removeProp = (propId: string) =>
    setSelectedProps(selectedProps.filter(p => p.id !== propId));

  // calculatePayout handler
  const calculatePayout = () => {
    const odds = selectedProps.reduce((acc, p) => acc * (p.odds || 1), 1);
    return (entryAmount * odds).toFixed(2);
  };

  // Per-prop analyze handler
  const handleAnalyzeProp = async (proj: PropProjection) => {
    setAnalyzingPropId(proj.id);
    setPropAnalystResponses(prev => ({
      ...prev,
      [proj.id]: { loading: true, error: undefined, content: undefined },
    }));
    try {
      const response = await fetch('/api/propollama/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Analyze prop: ${proj.player} ${proj.statType} ${proj.line} (Over odds: ${proj.overOdds}, Under odds: ${proj.underOdds})`,
          analysisType: 'prop_analysis',
          context: {
            player: proj.player,
            statType: proj.statType,
            line: proj.line,
            overOdds: proj.overOdds,
            underOdds: proj.underOdds,
            team: proj.team,
            sport: proj.sport,
          },
        }),
      });
      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }
      const data = await response.json();
      setPropAnalystResponses(prev => ({
        ...prev,
        [proj.id]: {
          loading: false,
          content: data.content || 'No analysis available.',
          error: data.error || undefined,
        },
      }));
    } catch (err: any) {
      setPropAnalystResponses(prev => ({
        ...prev,
        [proj.id]: { loading: false, error: err.message || 'Failed to get analysis.' },
      }));
    } finally {
      setAnalyzingPropId(null);
    }
  };

  // refreshProjections handler
  const refreshProjections = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    } catch (err: any) {
      setError('Failed to refresh projections.');
      setIsLoading(false);
    }
  };

  // Ensemble LLM analysis handler
  const handleRunLLM = async () => {
    setEnsembleLoading(true);
    setEnsembleError(null);
    setEnsembleResult(null);
    try {
      const response = await fetch('/api/propollama/final_analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: USER_ID,
          sessionId: SESSION_ID,
          selectedProps,
          entryAmount,
        }),
      });
      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }
      const data = await response.json();
      setEnsembleResult(data.content || 'No analysis available.');
      if (data.error) setEnsembleError(data.error);
    } catch (err: any) {
      setEnsembleError(err.message || 'Failed to get LLM analysis.');
    } finally {
      setEnsembleLoading(false);
    }
  };

  // Filtered projections for table
  const filteredProjections = projections
    .filter(p => selectedSport === 'All' || p.sport === selectedSport)
    .filter(
      p =>
        searchTerm === '' ||
        p.player.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.team.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      if (sortBy === 'value') return b.value - a.value;
      return a.player.localeCompare(b.player);
    });

  // Projections table rows with empty state for AI Insights
  let projectionRows: React.ReactNode[] = [];
  if (isLoading) {
    projectionRows = [
      <tr key='loading'>
        <td colSpan={10} className='text-center text-gray-400 py-4' role='status'>
          Loading AI-powered betting intelligence
        </td>
      </tr>,
    ];
  } else if (filteredProjections.length === 0) {
    projectionRows = [
      <tr key='none'>
        <td colSpan={10} className='text-center text-gray-400 py-4'>
          No AI Insights Available
        </td>
      </tr>,
    ];
  } else {
    projectionRows = [];
    filteredProjections.forEach(proj => {
      if (!proj || typeof proj !== 'object' || !proj.id) return;
      const isExpanded = expandedPropId === proj.id;
      projectionRows.push(
        <tr
          key={proj.id}
          className={
            (isSelected(proj.id) ? 'bg-yellow-900/20 ' : '') +
            'cursor-pointer hover:bg-slate-700/40 transition-colors'
          }
          onClick={() => setExpandedPropId(isExpanded ? null : proj.id)}
          aria-expanded={isExpanded}
        >
          <td className='px-2 py-1 flex items-center gap-2'>
            <span>{safeCell(proj.player)}</span>
            <span className='ml-1 text-xs text-gray-400 select-none'>{isExpanded ? '▼' : '▶'}</span>
          </td>
          <td className='px-2 py-1'>{safeCell(proj.team)}</td>
          <td className='px-2 py-1'>{safeCell(proj.statType)}</td>
          <td className='px-2 py-1'>{safeCell(proj.line)}</td>
          <td className='px-2 py-1'>
            <button
              className={`px-2 py-1 rounded ${
                isSelected(proj.id) ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-600'
              } text-white flex flex-col items-center`}
              disabled={isSelected(proj.id) || selectedProps.length >= 6}
              onClick={e => {
                e.stopPropagation();
                addProp(proj, 'over');
              }}
              title={`Odds: ${safeCell(proj.overOdds)}`}
            >
              <span style={{ fontWeight: 'bold' }}>OVER</span>
              <span style={{ fontSize: '0.8em' }}>{safeCell(proj.overOdds)}</span>
            </button>
          </td>
          <td className='px-2 py-1'>
            <button
              className={`px-2 py-1 rounded ${
                isSelected(proj.id) ? 'bg-gray-500' : 'bg-red-500 hover:bg-red-600'
              } text-white flex flex-col items-center`}
              disabled={isSelected(proj.id) || selectedProps.length >= 6}
              onClick={e => {
                e.stopPropagation();
                addProp(proj, 'under');
              }}
              title={`Odds: ${safeCell(proj.underOdds)}`}
            >
              <span style={{ fontWeight: 'bold' }}>UNDER</span>
              <span style={{ fontSize: '0.8em' }}>{safeCell(proj.underOdds)}</span>
            </button>
          </td>
          <td className='px-2 py-1'>
            {typeof proj.confidence === 'number'
              ? `${proj.confidence}%`
              : safeCell(proj.confidence)}
          </td>
          <td className='px-2 py-1'>{safeCell(proj.value)}</td>
          {/* Reasoning column removed from main row for cleaner UI */}
          <td className='px-2 py-1'>
            {isSelected(proj.id) ? (
              <button
                className='px-2 py-1 rounded bg-gray-700 text-white hover:bg-gray-800'
                onClick={e => {
                  e.stopPropagation();
                  removeProp(proj.id);
                }}
              >
                Remove
              </button>
            ) : (
              <span className='text-gray-400'>Select</span>
            )}
          </td>
        </tr>
      );
      if (isExpanded) {
        const analysis = propAnalystResponses[proj.id];
        projectionRows.push(
          <tr key={proj.id + '-expanded'}>
            <td colSpan={9} className='bg-slate-900/80 text-white p-4 border-t border-slate-700'>
              <div className='flex flex-col md:flex-row gap-6'>
                <div className='flex-1 min-w-[220px]'>
                  <div className='font-bold mb-1 text-green-400'>Over Analysis</div>
                  <div className='mb-3 text-white'>{proj.overReasoning}</div>
                  <div className='font-bold mb-1 text-red-400'>Under Analysis</div>
                  <div className='mb-3 text-white'>{proj.underReasoning}</div>
                  <div className='text-sm text-gray-400 mb-2'>
                    <span className='font-bold text-white'>Stat:</span> {proj.statType}{' '}
                    &nbsp;|&nbsp;
                    <span className='font-bold text-white'>Line:</span> {proj.line} &nbsp;|&nbsp;
                    <span className='font-bold text-white'>Confidence:</span> {proj.confidence}%
                    &nbsp;|&nbsp;
                    <span className='font-bold text-white'>Value:</span> {proj.value}
                  </div>
                  <button
                    className='mt-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-lg transition-colors disabled:bg-gray-600 disabled:text-gray-400'
                    onClick={() => handleAnalyzeProp(proj)}
                    disabled={!!(analysis && analysis.loading)}
                  >
                    {analysis && analysis.loading ? 'Analyzing...' : 'Analyze'}
                  </button>
                  {analysis && analysis.error && (
                    <div className='text-red-400 mt-2'>{analysis.error}</div>
                  )}
                  {analysis && analysis.content && (
                    <div className='mt-4 p-3 bg-slate-950/80 rounded-lg border border-yellow-700'>
                      <div className='font-bold text-yellow-300 mb-1'>Analyst's Take</div>
                      <div className='text-white'>{analysis.content}</div>
                    </div>
                  )}
                </div>
                <div className='flex-1 min-w-[180px]'>
                  <div className='font-bold mb-1 text-yellow-300'>Betting Odds</div>
                  <div className='mb-2'>
                    <span className='inline-block bg-green-500 text-white px-2 py-1 rounded mr-2'>
                      Over: {proj.overOdds}
                    </span>
                    <span className='inline-block bg-red-500 text-white px-2 py-1 rounded'>
                      Under: {proj.underOdds}
                    </span>
                  </div>
                  <div className='font-bold mb-1 text-yellow-300'>Team</div>
                  <div className='mb-2'>{proj.team}</div>
                  <div className='text-xs text-gray-400 mt-2'>Click row to collapse.</div>
                </div>
              </div>
            </td>
          </tr>
        );
      }
    });
  }

  // --- Main Render ---
  return (
    <DebugErrorBoundary>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='p-3 bg-yellow-500/20 rounded-xl'></div>
            <div>
              <h1 className='text-3xl font-bold text-white'>PropOllama</h1>
              <p className='text-gray-400'>Elite Sports Analyst AI - Ensemble Betting Insights</p>
            </div>
          </div>
        </div>
        {/* Analytics and AI Insights Section Headers */}
        <div className='mb-4 flex gap-8'>
          <h2 className='text-2xl font-bold text-yellow-400'>Analytics</h2>
          <h2 className='text-2xl font-bold text-purple-400'>AI Insights</h2>
        </div>
        {/* Main Content Grid: Projections + Bet Slip + Chat */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {/* Projections Section */}
          <div className='md:col-span-2'>
            {/* ...existing projections filter and table code... */}
            <div className='flex flex-wrap gap-4 mb-4'>
              <select
                value={selectedSport}
                onChange={e => setSelectedSport(e.target.value)}
                className='bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white'
              >
                {sports.map(sport => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
              <input
                type='text'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder='Search player or team...'
                className='bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white'
              />
              <select
                value={sortBy}
                onChange={handleSortByChange}
                className='bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white'
              >
                <option value='confidence'>Sort by Confidence</option>
                <option value='value'>Sort by Value</option>
                <option value='player'>Sort by Player</option>
              </select>
              <button
                onClick={refreshProjections}
                className='bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-lg transition-colors'
                disabled={isLoading}
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            {error && (
              <div
                className='bg-red-700 text-white p-2 rounded mb-2'
                role='alert'
                aria-live='assertive'
              >
                Error loading data. Please check your backend connection and try again.
              </div>
            )}
            <div className='overflow-x-auto'>
              <table className='min-w-full bg-slate-800/70 rounded-lg'>
                <thead>
                  <tr className='text-yellow-400'>
                    <th className='px-2 py-2'>Player</th>
                    <th className='px-2 py-2'>Team</th>
                    <th className='px-2 py-2'>Stat</th>
                    <th className='px-2 py-2'>Line</th>
                    <th className='px-2 py-2'>Over</th>
                    <th className='px-2 py-2'>Under</th>
                    <th className='px-2 py-2'>Confidence</th>
                    <th className='px-2 py-2'>Value</th>
                    <th className='px-2 py-2'>Select</th>
                  </tr>
                </thead>
                <tbody>{projectionRows}</tbody>
              </table>
            </div>
          </div>
          {/* Bet Slip Section - always right column on desktop */}
          <div className='bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 flex flex-col gap-4'>
            <h2 className='text-xl font-bold text-white mb-2'>Bet Slip</h2>
            {selectedProps.length === 0 ? (
              <div className='text-gray-400'>
                No props selected. Select up to 6 props to build your entry.
              </div>
            ) : (
              <div>
                <ul className='mb-2'>
                  {selectedProps.map((prop, idx) => (
                    <li key={prop.id} className='flex items-center justify-between gap-2 mb-1'>
                      <span className='text-white'>
                        {safeCell(prop.player)} {safeCell(prop.statType)} {safeCell(prop.line)}
                      </span>
                      <span className='text-yellow-400 font-semibold'>
                        {safeCell(prop.choice?.toUpperCase?.() ?? prop.choice)}
                      </span>
                      <span className='text-gray-300'>Odds: {safeCell(prop.odds)}</span>
                      <button
                        className='ml-2 px-2 py-1 rounded bg-gray-700 text-white hover:bg-gray-800'
                        onClick={() => removeProp(prop.id)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
                <div className='flex items-center gap-2 mb-2'>
                  <span className='text-white'>Entry Amount:</span>
                  <input
                    type='number'
                    min={1}
                    max={1000}
                    value={entryAmount}
                    onChange={e => setEntryAmount(Number(e.target.value))}
                    className='w-20 bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1 text-white'
                  />
                </div>
                <div className='text-white mb-2'>
                  Potential Payout:{' '}
                  <span className='text-yellow-400 font-bold'>${calculatePayout()}</span>
                </div>
                <button
                  className='w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 rounded-lg transition-colors disabled:bg-gray-600 disabled:text-gray-400 mb-2'
                  disabled={selectedProps.length < 2 || ensembleLoading}
                  onClick={handleRunLLM}
                  aria-busy={ensembleLoading}
                >
                  {ensembleLoading ? 'Running LLM...' : 'Run LLM (Final Analysis)'}
                </button>
                {ensembleError && (
                  <div className='bg-red-700 text-white p-2 rounded mb-2' role='alert'>
                    {ensembleError}
                  </div>
                )}
                {ensembleResult && !ensembleError && (
                  <div className='bg-slate-950/80 border border-yellow-700 rounded-lg p-4 mt-2'>
                    <div className='font-bold text-yellow-300 mb-1'>LLM Final Analysis</div>
                    <div className='text-white whitespace-pre-line'>{ensembleResult}</div>
                  </div>
                )}
                <button
                  className='w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 rounded-lg transition-colors disabled:bg-gray-600 disabled:text-gray-400'
                  disabled={selectedProps.length < 2}
                >
                  Place Entry
                </button>
                <div className='text-xs text-gray-400 mt-2'>
                  Select 2-6 props. Payout increases with more selections.
                </div>
              </div>
            )}
          </div>
          {/* Chat/Analyst section removed; now handled per-prop in expanded row */}
        </div>
        {/* Close main content grid */}
      </div>
      {/* Close max-w-7xl container */}
    </DebugErrorBoundary>
  );
};

export default PropOllamaUnified;
