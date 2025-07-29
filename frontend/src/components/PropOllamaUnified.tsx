import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  FeaturedProp,
  fetchBatchPredictions,
  fetchFeaturedProps,
} from '../services/unified/FeaturedPropsService';
import { EnhancedBetsResponse, EnhancedPrediction } from '../types/enhancedBetting';

// Utility to safely render cell values
function safeCell(val: any) {
  if (val === undefined || val === null) return '';
  if (typeof val === 'number' && isNaN(val)) return '';
  return String(val);
}

// Click-to-toggle help popover component
function HelpPopover() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  return (
    <div className='relative inline-block'>
      <button
        ref={btnRef}
        tabIndex={0}
        aria-label='Show table help'
        aria-haspopup='dialog'
        aria-expanded={open}
        className='w-6 h-6 flex items-center justify-center rounded-full bg-blue-700 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400'
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(v => !v);
          }
        }}
      >
        <svg width='16' height='16' fill='currentColor' viewBox='0 0 20 20'>
          <circle cx='10' cy='10' r='9' stroke='white' strokeWidth='2' fill='currentColor' />
          <text x='10' y='15' textAnchor='middle' fontSize='12' fill='white'>
            i
          </text>
        </svg>
      </button>
      {open && (
        <div
          ref={popoverRef}
          className='absolute z-10 left-1/2 -translate-x-1/2 mt-2 w-80 bg-slate-900 border border-blue-700 rounded-lg p-4 text-blue-100 text-xs shadow-lg'
          role='dialog'
          aria-modal='true'
        >
          <ul className='list-disc ml-5'>
            <li>
              <b>Player Name</b>: The athlete this bet is about.
            </li>
            <li>
              <b>Matchup</b>: The teams playing in this game.
            </li>
            <li>
              <b>Stat Type</b>: What you are betting on (like runs, hits, points).
            </li>
            <li>
              <b>Target</b>: The number the player needs to beat for your bet to win.
            </li>
            <li>
              <b>Over/Under Bet</b>: You win if the player gets more/less than the target.
            </li>
            <li>
              <b>AI Confidence</b>: How sure the AI is (High, Medium, Low).
            </li>
            <li>
              <b>Potential Value</b>: Is this a good deal? (Good, Fair, Low).
            </li>
            <li>
              <b>Add</b>: Click to add this pick to your bet slip.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

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

// Remove defaultProjections; will use backend data

const PropOllamaUnified: React.FC = () => {
  const [showAllProps, setShowAllProps] = useState(false);
  const [selectedProps, setSelectedProps] = useState<SelectedProp[]>([]);
  const [entryAmount, setEntryAmount] = useState<number>(10);
  const [sortBy, setSortBy] = useState<'confidence' | 'value' | 'player'>('confidence');
  const [searchTerm, setSearchTerm] = useState<string>('');
  // State declarations (restored, only once, above useEffect)
  const [renderError, setRenderError] = useState<string | null>(null);
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [projections, setProjections] = useState<EnhancedPrediction[]>([]);
  const [unifiedResponse, setUnifiedResponse] = useState<EnhancedBetsResponse | null>(null);
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzingPropId, setAnalyzingPropId] = useState<string | null>(null);
  const [propAnalystResponses, setPropAnalystResponses] = useState<
    Record<string, { loading: boolean; error?: string; content?: string }>
  >({});
  const [ensembleLoading, setEnsembleLoading] = useState<boolean>(false);
  const [ensembleError, setEnsembleError] = useState<string | null>(null);
  const [ensembleResult, setEnsembleResult] = useState<string | null>(null);
  // Sports options
  const sports = ['All', 'NBA', 'NFL', 'NHL', 'MLB'];
  // State declarations
  // (All state variables are now declared above, only once)
  // Fetch unified backend data on mount and when selectedSport changes
  // Granular loading state for prop-level progress
  const [propLoadingProgress, setPropLoadingProgress] = useState<number>(0);
  useEffect(() => {
    const fetchUnified = async () => {
      setIsLoading(true);
      setPropLoadingProgress(0);
      setError(null);
      try {
        // Fetch real props from backend
        const candidateProps: FeaturedProp[] = await fetchFeaturedProps(selectedSport);
        // Use backend batch endpoint for predictions
        let enriched_props: EnhancedPrediction[] = [];
        if (candidateProps.length > 0) {
          // Show progress bar as batch loads
          const batchResults = await fetchBatchPredictions(candidateProps);
          enriched_props = batchResults.filter((r: any) => r && !r.error);
          setPropLoadingProgress(1);
        }
        const safeUnifiedResponse = {
          analysis: '',
          confidence: 0,
          recommendation: '',
          key_factors: [],
          processing_time: 0,
          cached: false,
          enriched_props,
          enhanced_bets: enriched_props,
          count: enriched_props.length,
          portfolio_metrics: undefined,
          ai_insights: [],
          filters: {
            sport: selectedSport === 'All' ? 'NBA' : selectedSport,
            min_confidence: 0,
            max_results: 10,
          },
          status: 'success',
        };
        setUnifiedResponse(safeUnifiedResponse);
        setProjections(enriched_props);
      } catch (err: any) {
        // Log the error object for debugging
        // eslint-disable-next-line no-console
        console.error('Unified backend fetch error:', err, err?.response || err?.message || err);
        let errorMsg = 'Failed to fetch unified backend data.';
        if (err?.response) {
          errorMsg += ` (Status: ${err.response.status})`;
          if (err.response.data && typeof err.response.data === 'object') {
            errorMsg += `: ${JSON.stringify(err.response.data)}`;
          } else if (typeof err.response.data === 'string') {
            errorMsg += `: ${err.response.data}`;
          }
        } else if (err?.message) {
          errorMsg += ` (${err.message})`;
        }
        errorMsg += ' Please ensure the backend server is running and reachable.';
        setError(errorMsg);
      } finally {
        setIsLoading(false);
        setPropLoadingProgress(0);
      }
    };
    fetchUnified();
  }, [selectedSport]);

  // Sort handler
  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as 'confidence' | 'value' | 'player');
  };

  // isSelected handler
  const isSelected = (projectionId: string) => selectedProps.some(p => p.id === projectionId);

  // addProp handler (accepts EnhancedPrediction)
  const addProp = (proj: EnhancedPrediction, choice: 'over' | 'under') => {
    if (selectedProps.length < 6 && !isSelected(proj.id)) {
      setSelectedProps([
        ...selectedProps,
        {
          id: proj.id,
          player: proj.player_name,
          statType: proj.stat_type,
          line: proj.line_score,
          choice,
          odds: 1, // Placeholder, update if odds are available in EnhancedPrediction
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
  let filteredProjections = projections
    .filter(p => selectedSport === 'All' || p.sport === selectedSport)
    .filter(
      p =>
        searchTerm === '' ||
        (p.player_name && p.player_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.team && p.team.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      if (sortBy === 'value') return (b as any).expected_value - (a as any).expected_value;
      // Odds sorting removed: EnhancedPrediction does not have overOdds/underOdds
      return (a.player_name || '').localeCompare(b.player_name || '');
    });

  // Show only top 10 by default unless showAllProps is true
  const displayedProjections = showAllProps
    ? filteredProjections
    : filteredProjections.slice(0, 10);

  // Projections table rows with empty state for AI Insights
  let projectionRows: React.ReactNode[] = [];
  if (isLoading) {
    projectionRows = [
      <tr key='loading'>
        <td colSpan={10} className='text-center text-yellow-300 py-4' role='status'>
          <div className='flex flex-col items-center gap-2'>
            <span>Loading AI-powered betting intelligence...</span>
            <div className='w-64 h-3 bg-slate-700 rounded-full overflow-hidden'>
              <div
                className='h-full bg-yellow-400 transition-all duration-300'
                style={{ width: `${Math.round(propLoadingProgress * 100)}%` }}
              />
            </div>
            <span className='text-xs text-gray-400'>
              {Math.round(propLoadingProgress * 100)}% complete
            </span>
          </div>
        </td>
      </tr>,
    ];
  } else if (displayedProjections.length === 0) {
    projectionRows = [
      <tr key='none'>
        <td colSpan={10} className='text-center text-gray-400 py-4'>
          No AI Insights Available
        </td>
      </tr>,
    ];
  } else {
    projectionRows = [];
    displayedProjections.forEach((proj, idx) => {
      if (!proj || typeof proj !== 'object' || !proj.id) return;
      const rowKey = proj.id + '-' + idx;
      const isExpanded = expandedRowKey === rowKey;
      projectionRows.push(
        <tr
          key={rowKey}
          className={
            (isSelected(proj.id) ? 'bg-yellow-100/10 ring-2 ring-yellow-400 ' : '') +
            'group transition-all duration-150 hover:bg-slate-800/60 border-b border-slate-700/60 shadow-sm'
          }
          style={{ cursor: 'pointer' }}
          onClick={() => setExpandedRowKey(isExpanded ? null : rowKey)}
          aria-expanded={isExpanded}
        >
          <td className='px-4 py-3 flex items-center gap-2 font-semibold text-white min-w-0 max-w-xs whitespace-normal break-words'>
            <span className='whitespace-normal break-words'>{safeCell(proj.player_name)}</span>
            <span className='ml-2 text-xs text-gray-400 select-none'>{isExpanded ? '▼' : '▶'}</span>
          </td>
          <td className='px-4 py-3 text-blue-200 min-w-0 max-w-xs whitespace-pre-line break-words'>
            {safeCell(proj.team)}
          </td>
          <td className='px-4 py-3 text-purple-200 font-medium'>{safeCell(proj.stat_type)}</td>
          <td className='px-4 py-3 text-yellow-200 font-bold'>{safeCell(proj.line_score)}</td>
          <td className='px-4 py-3'>
            <button
              className='rounded-full px-3 py-1 bg-green-700/80 text-green-100 font-bold shadow hover:bg-green-600/90 transition disabled:opacity-60 disabled:cursor-not-allowed'
              onClick={e => {
                e.stopPropagation();
                addProp(proj, 'over');
              }}
              disabled={isSelected(proj.id)}
              tabIndex={0}
            >
              Over
            </button>
          </td>
          <td className='px-4 py-3'>
            <button
              className='rounded-full px-3 py-1 bg-red-700/80 text-red-100 font-bold shadow hover:bg-red-600/90 transition disabled:opacity-60 disabled:cursor-not-allowed'
              onClick={e => {
                e.stopPropagation();
                addProp(proj, 'under');
              }}
              disabled={isSelected(proj.id)}
              tabIndex={0}
            >
              Under
            </button>
          </td>
          <td className='px-4 py-3'>
            {typeof proj.confidence === 'number' ? (
              <span
                className={
                  'inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-bold ' +
                  (proj.confidence >= 70
                    ? 'bg-green-800/80 text-green-200'
                    : proj.confidence >= 50
                    ? 'bg-yellow-800/80 text-yellow-200'
                    : 'bg-red-800/80 text-red-200')
                }
              >
                {proj.confidence}%{proj.confidence >= 70 && <span className='ml-1'>High</span>}
                {proj.confidence < 70 && proj.confidence >= 50 && (
                  <span className='ml-1'>Medium</span>
                )}
                {proj.confidence < 50 && <span className='ml-1'>Low</span>}
              </span>
            ) : (
              safeCell(proj.confidence)
            )}
          </td>
          <td className='px-4 py-3'>
            {typeof (proj as any).expected_value === 'number' ? (
              <span
                className={
                  'inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-bold ' +
                  ((proj as any).expected_value > 0
                    ? 'bg-green-800/80 text-green-200'
                    : (proj as any).expected_value === 0
                    ? 'bg-yellow-800/80 text-yellow-200'
                    : 'bg-red-800/80 text-red-200')
                }
              >
                {(proj as any).expected_value}
                {(proj as any).expected_value > 0 && <span className='ml-1'>Good</span>}
                {(proj as any).expected_value === 0 && <span className='ml-1'>Fair</span>}
                {(proj as any).expected_value < 0 && <span className='ml-1'>Low</span>}
              </span>
            ) : (
              safeCell((proj as any).expected_value)
            )}
          </td>
          <td className='px-4 py-3'>
            {isSelected(proj.id) ? (
              <button
                className='rounded-full px-3 py-1 bg-gray-700 text-white font-bold shadow hover:bg-gray-800 transition'
                onClick={e => {
                  e.stopPropagation();
                  removeProp(proj.id);
                }}
              >
                Remove
              </button>
            ) : (
              <span className='inline-block px-2 py-1 rounded-full bg-blue-800/80 text-blue-200 font-semibold text-xs'>
                Add
              </span>
            )}
          </td>
        </tr>
      );
      if (isExpanded) {
        projectionRows.push(
          <tr key={rowKey + '-expanded'}>
            <td colSpan={9} className='p-0 bg-transparent border-none'>
              <div className='mx-2 my-2 rounded-2xl shadow-2xl border-2 border-yellow-400 bg-slate-900/95 overflow-hidden'>
                <div className='flex flex-col md:flex-row gap-8 p-6'>
                  {/* Left: AI Analysis */}
                  <div className='flex-1 min-w-[220px]'>
                    <div className='text-lg font-bold text-green-300 mb-2 flex items-center gap-2'>
                      <svg width='20' height='20' fill='none' viewBox='0 0 20 20'>
                        <circle
                          cx='10'
                          cy='10'
                          r='9'
                          stroke='#4ade80'
                          strokeWidth='2'
                          fill='#166534'
                        />
                      </svg>
                      AI's Take
                    </div>
                    <div className='mb-4 text-white text-base leading-relaxed'>
                      {unifiedResponse?.analysis || 'No analysis available.'}
                    </div>
                    <div className='text-yellow-300 font-semibold mb-1'>Why this pick?</div>
                    <div className='mb-4 text-yellow-100 text-sm'>
                      {unifiedResponse &&
                      Array.isArray(unifiedResponse.key_factors) &&
                      unifiedResponse.key_factors.length > 0 ? (
                        <ul className='list-disc ml-5'>
                          {unifiedResponse.key_factors.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className='italic text-slate-400'>N/A</span>
                      )}
                    </div>
                    <div className='grid grid-cols-2 gap-2 text-xs text-slate-200 mb-2'>
                      <div>
                        <span className='font-bold text-white'>Stat Type:</span> {proj.stat_type}
                      </div>
                      <div>
                        <span className='font-bold text-white'>Target:</span> {proj.line_score}
                      </div>
                      <div>
                        <span className='font-bold text-white'>AI Confidence:</span>{' '}
                        {proj.confidence}%
                      </div>
                      <div>
                        <span className='font-bold text-white'>Potential Value:</span>{' '}
                        {(proj as any).expected_value}
                      </div>
                    </div>
                    <div className='text-xs text-blue-200 mt-3 bg-slate-800/60 rounded p-2'>
                      <b>Legend:</b> <br />
                      <ul className='list-disc ml-5'>
                        <li>
                          <b>AI Confidence</b>: Higher % = more likely to win.
                        </li>
                        <li>
                          <b>Potential Value</b>: Positive = good deal, Negative = not recommended.
                        </li>
                        <li>
                          <b>Target</b>: Number to go over/under for your bet to win.
                        </li>
                      </ul>
                    </div>
                  </div>
                  {/* Right: Meta Info */}
                  <div className='flex-1 min-w-[180px] flex flex-col gap-2'>
                    <div className='font-bold text-yellow-300 mb-1'>Matchup</div>
                    <div className='mb-2 text-white text-base'>{proj.team}</div>
                    <div className='font-bold text-yellow-300 mb-1'>Processing Time</div>
                    <div className='mb-2 text-white'>
                      {unifiedResponse?.processing_time ?? 'N/A'} sec
                    </div>
                    <div className='font-bold text-yellow-300 mb-1'>Cached</div>
                    <div className='mb-2 text-white'>{unifiedResponse?.cached ? 'Yes' : 'No'}</div>
                    <div className='text-xs text-gray-400 mt-4'>Click row to collapse.</div>
                  </div>
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
        {/* AI Insights Display */}
        {unifiedResponse?.ai_insights && unifiedResponse.ai_insights.length > 0 && (
          <div className='mb-6 bg-slate-900/80 border border-purple-700 rounded-lg p-4'>
            <h3 className='text-lg font-bold text-purple-300 mb-2'>AI Insights</h3>
            {unifiedResponse.ai_insights.map((insight, idx) => (
              <div key={idx} className='mb-4 p-3 bg-slate-800/60 rounded'>
                {insight.quantum_analysis && (
                  <div className='mb-1'>
                    <span className='font-semibold text-purple-200'>Quantum Analysis:</span>{' '}
                    <span className='text-white'>{insight.quantum_analysis}</span>
                  </div>
                )}
                {insight.neural_patterns && insight.neural_patterns.length > 0 && (
                  <div className='mb-1'>
                    <span className='font-semibold text-purple-200'>Neural Patterns:</span>{' '}
                    <span className='text-white'>{insight.neural_patterns.join(', ')}</span>
                  </div>
                )}
                {insight.shap_factors && insight.shap_factors.length > 0 && (
                  <div className='mb-1'>
                    <span className='font-semibold text-purple-200'>SHAP Factors:</span>{' '}
                    <span className='text-white'>
                      {insight.shap_factors.map(f => `${f.factor}: ${f.impact}`).join(', ')}
                    </span>
                  </div>
                )}
                {insight.risk_factors && insight.risk_factors.length > 0 && (
                  <div className='mb-1'>
                    <span className='font-semibold text-purple-200'>Risk Factors:</span>{' '}
                    <span className='text-white'>{insight.risk_factors.join(', ')}</span>
                  </div>
                )}
                {typeof insight.opportunity_score === 'number' && (
                  <div className='mb-1'>
                    <span className='font-semibold text-purple-200'>Opportunity Score:</span>{' '}
                    <span className='text-white'>{insight.opportunity_score}</span>
                  </div>
                )}
                {typeof insight.market_edge === 'number' && (
                  <div className='mb-1'>
                    <span className='font-semibold text-purple-200'>Market Edge:</span>{' '}
                    <span className='text-white'>{insight.market_edge}</span>
                  </div>
                )}
                {insight.confidence_reasoning && (
                  <div className='mb-1'>
                    <span className='font-semibold text-purple-200'>Confidence Reasoning:</span>{' '}
                    <span className='text-white'>{insight.confidence_reasoning}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
                className='bg-red-700 text-white p-2 rounded mb-2 flex items-center gap-4'
                role='alert'
                aria-live='assertive'
              >
                <span>Error loading data: {error}</span>
                <button
                  className='ml-auto bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-3 py-1 rounded-lg transition-colors'
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            )}
            {/* Condensed help section with tooltip/popover */}
            <div className='mb-2 flex items-center gap-2'>
              <span className='text-blue-200 font-semibold text-sm'>
                What does this table mean?
              </span>
              <div className='relative group inline-block'>
                <button
                  tabIndex={0}
                  aria-label='Show table help'
                  className='w-6 h-6 flex items-center justify-center rounded-full bg-blue-700 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400'
                >
                  <svg width='16' height='16' fill='currentColor' viewBox='0 0 20 20'>
                    <circle
                      cx='10'
                      cy='10'
                      r='9'
                      stroke='white'
                      strokeWidth='2'
                      fill='currentColor'
                    />
                    <text x='10' y='15' textAnchor='middle' fontSize='12' fill='white'>
                      i
                    </text>
                  </svg>
                </button>
                <div
                  className='hidden group-hover:block group-focus-within:block absolute z-10 left-1/2 -translate-x-1/2 mt-2 w-80 bg-slate-900 border border-blue-700 rounded-lg p-4 text-blue-100 text-xs shadow-lg'
                  role='tooltip'
                >
                  <ul className='list-disc ml-5'>
                    <li>
                      <b>Player Name</b>: The athlete this bet is about.
                    </li>
                    <li>
                      <b>Matchup</b>: The teams playing in this game.
                    </li>
                    <li>
                      <b>Stat Type</b>: What you are betting on (like runs, hits, points).
                    </li>
                    <li>
                      <b>Target</b>: The number the player needs to beat for your bet to win.
                    </li>
                    <li>
                      <b>Over/Under Bet</b>: You win if the player gets more/less than the target.
                    </li>
                    <li>
                      <b>AI Confidence</b>: How sure the AI is (High, Medium, Low).
                    </li>
                    <li>
                      <b>Potential Value</b>: Is this a good deal? (Good, Fair, Low).
                    </li>
                    <li>
                      <b>Add</b>: Click to add this pick to your bet slip.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className='overflow-x-auto'>
              <table className='min-w-full bg-slate-800/70 rounded-lg'>
                <thead>
                  <tr className='text-yellow-400'>
                    <th className='px-2 py-2' title='The player this bet is about.'>
                      Player Name
                    </th>
                    <th className='px-2 py-2' title='The teams playing in this matchup.'>
                      Matchup
                    </th>
                    <th
                      className='px-2 py-2'
                      title='What stat you are betting on (e.g., runs, hits, points).'
                    >
                      Stat Type
                    </th>
                    <th
                      className='px-2 py-2'
                      title='The number the player needs to beat for your bet to win.'
                    >
                      Target
                    </th>
                    <th
                      className='px-2 py-2'
                      title='Bet that the player will get more than the target.'
                    >
                      Over Bet
                    </th>
                    <th
                      className='px-2 py-2'
                      title='Bet that the player will get less than the target.'
                    >
                      Under Bet
                    </th>
                    <th
                      className='px-2 py-2'
                      title='How confident the AI is in this pick (higher is better).'
                    >
                      AI Confidence
                    </th>
                    <th
                      className='px-2 py-2'
                      title='How much value this bet offers compared to the odds.'
                    >
                      Potential Value
                    </th>
                    <th className='px-2 py-2' title='Add this pick to your bet slip.'>
                      Add
                    </th>
                  </tr>
                </thead>
                <tbody>{projectionRows}</tbody>
              </table>
              {!isLoading && filteredProjections.length > 10 && (
                <div className='text-center py-4'>
                  <button
                    className='bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-lg transition-colors'
                    onClick={() => setShowAllProps(v => !v)}
                  >
                    {showAllProps
                      ? 'Show Top 10 Only'
                      : `View More (${filteredProjections.length - 10} more)`}
                  </button>
                </div>
              )}
              {isLoading && (
                <div className='text-center text-yellow-300 py-4'>
                  Fetching latest AI-powered projections...
                </div>
              )}
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
