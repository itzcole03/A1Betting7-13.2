import { motion } from 'framer-motion';
import { Activity, Gauge, RefreshCw, Search, Zap } from 'lucide-react';
import React, {
  CSSProperties,
  Suspense,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useOptimizedList } from '../../hooks/useOptimizedPerformance';
import { PropOpportunity, usePropFinderData } from '../../hooks/usePropFinderData';
import PerformanceMonitoringDashboard from '../phase4/PerformanceMonitoringDashboard';
import Phase4Banner from '../phase4/Phase4Banner';

const formatOdds = (odds?: number) => {
  if (odds === null || odds === undefined || Number.isNaN(odds)) return '—';
  return odds > 0 ? `+${Math.round(odds)}` : Math.round(odds).toString();
};

const formatPercent = (value?: number, fractionDigits = 1) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${value.toFixed(fractionDigits)}%`;
};

// Memoized prop card component for performance
const PropCard = memo(
  ({
    opportunity,
    style,
    onSelect,
  }: {
    opportunity: PropOpportunity;
    style?: CSSProperties;
    onSelect: (opp: PropOpportunity) => void;
  }) => {
    const handleClick = useCallback(() => {
      onSelect(opportunity);
    }, [opportunity, onSelect]);

    const confidenceValue = useMemo(() => opportunity.confidence ?? 0, [opportunity.confidence]);
    const evValue = useMemo(
      () => opportunity.evPercent ?? opportunity.edge ?? 0,
      [opportunity.evPercent, opportunity.edge]
    );
    const confidenceColor = useMemo(() => {
      if (confidenceValue >= 80) return 'text-green-400';
      if (confidenceValue >= 60) return 'text-yellow-400';
      return 'text-red-400';
    }, [confidenceValue]);

    const evColor = useMemo(() => {
      if (evValue >= 8) return 'text-green-400';
      if (evValue > 0) return 'text-yellow-400';
      return 'text-red-400';
    }, [evValue]);

    return (
      <motion.div
        style={style}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        onClick={handleClick}
        className='bg-gray-800 rounded-lg border border-gray-700 p-4 cursor-pointer hover:bg-gray-750 transition-all duration-200'
      >
        <div className='flex justify-between items-start mb-3'>
          <div>
            <h3 className='text-lg font-bold text-white'>{opportunity.player}</h3>
            <p className='text-gray-400 text-sm'>
              {opportunity.team} vs {opportunity.opponent}
            </p>
          </div>
          <div className='text-right'>
            <div className='text-white font-semibold'>{formatOdds(opportunity.odds)}</div>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-4 mb-3'>
          <div>
            <p className='text-gray-400 text-xs uppercase tracking-wide'>Prop</p>
            <p className='text-white font-semibold'>
              {(opportunity.market ?? 'Prop').toUpperCase()} {opportunity.line ?? '—'}
            </p>
          </div>
          <div>
            <p className='text-gray-400 text-xs uppercase tracking-wide'>Best Book</p>
            <p className='text-white font-semibold'>
              {opportunity.bestBookmaker || opportunity.bookmakers?.[0]?.name || '—'}
            </p>
            <p className='text-gray-400 text-xs'>
              Odds {formatOdds(opportunity.odds ?? opportunity.bookmakers?.[0]?.odds)}
            </p>
          </div>
        </div>

        <div className='flex justify-between items-center'>
          <div className='flex items-center space-x-4'>
            <div>
              <p className='text-gray-400 text-xs'>Confidence</p>
              <p className={`font-bold ${confidenceColor}`}>{formatPercent(confidenceValue)}</p>
            </div>
            <div>
              <p className='text-gray-400 text-xs'>Expected Value</p>
              <p className={`font-bold ${evColor}`}>{formatPercent(evValue)}</p>
            </div>
          </div>
          <div className='bg-blue-600/20 px-2 py-1 rounded text-blue-400 text-xs'>
            {(opportunity.sport || 'Unknown').toUpperCase()}
          </div>
        </div>
      </motion.div>
    );
  }
);

PropCard.displayName = 'PropCard';

// Loading skeleton component
const LoadingSkeleton = memo(() => (
  <div className='space-y-4'>
    {Array(6)
      .fill(0)
      .map((_, i) => (
        <div key={i} className='bg-gray-800 rounded-lg border border-gray-700 p-4 animate-pulse'>
          <div className='flex justify-between items-start mb-3'>
            <div>
              <div className='h-5 bg-gray-700 rounded w-32 mb-2'></div>
              <div className='h-4 bg-gray-700 rounded w-24'></div>
            </div>
            <div className='h-6 bg-gray-700 rounded w-16'></div>
          </div>
          <div className='grid grid-cols-2 gap-4 mb-3'>
            <div className='h-4 bg-gray-700 rounded'></div>
            <div className='h-4 bg-gray-700 rounded'></div>
          </div>
          <div className='flex justify-between'>
            <div className='flex space-x-4'>
              <div className='h-4 bg-gray-700 rounded w-16'></div>
              <div className='h-4 bg-gray-700 rounded w-16'></div>
            </div>
            <div className='h-6 bg-gray-700 rounded w-12'></div>
          </div>
        </div>
      ))}
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

const OptimizedPropFinderDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState<'all' | string>('all');
  const [sortBy, setSortBy] = useState<'confidence' | 'ev' | 'edge'>('confidence');
  const [showPerformancePanel, setShowPerformancePanel] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<PropOpportunity | null>(null);

  const {
    opportunities = [],
    loading,
    error,
    refreshData,
    refreshing,
  } = usePropFinderData({ autoRefresh: true });

  const availableSports = useMemo(() => {
    const unique = new Set<string>();
    opportunities.forEach(opp => {
      if (opp.sport) {
        unique.add(opp.sport);
      }
    });
    return Array.from(unique).sort();
  }, [opportunities]);

  const filteredOpportunities = useMemo(() => {
    const loweredSearch = searchTerm.trim().toLowerCase();

    const sortable = opportunities.filter(opp => {
      const matchesSearch =
        loweredSearch.length === 0 ||
        `${opp.player ?? ''} ${opp.market ?? ''} ${opp.team ?? ''}`
          .toLowerCase()
          .includes(loweredSearch);

      const matchesSport =
        selectedSport === 'all' || (opp.sport ?? '').toLowerCase() === selectedSport.toLowerCase();

      return matchesSearch && matchesSport;
    });

    const getConfidence = (opp: PropOpportunity) => opp.confidence ?? 0;
    const getEv = (opp: PropOpportunity) => opp.evPercent ?? opp.edge ?? 0;
    const getEdge = (opp: PropOpportunity) => opp.edge ?? 0;

    return sortable.sort((a, b) => {
      switch (sortBy) {
        case 'ev':
          return getEv(b) - getEv(a);
        case 'edge':
          return getEdge(b) - getEdge(a);
        case 'confidence':
        default:
          return getConfidence(b) - getConfidence(a);
      }
    });
  }, [opportunities, searchTerm, selectedSport, sortBy]);

  // Optimized list rendering with virtualization
  const { visibleItems, containerProps, innerProps, setContainerHeight } = useOptimizedList(
    filteredOpportunities,
    {
      itemHeight: 180,
      overscan: 3,
      enableVirtualization: filteredOpportunities.length > 20,
    }
  );

  // Set container height on mount
  useEffect(() => {
    setContainerHeight(600); // Set to desired height
  }, [setContainerHeight]);

  const handleOpportunitySelect = useCallback((opp: PropOpportunity) => {
    setSelectedOpportunity(opp);
  }, []);

  const handleRefresh = useCallback(() => {
    void refreshData?.();
  }, [refreshData]);

  const summary = useMemo(() => {
    const highConfidence = filteredOpportunities.filter(opp => (opp.confidence ?? 0) >= 80).length;
    const positiveEv = filteredOpportunities.filter(
      opp => (opp.evPercent ?? opp.edge ?? 0) > 0
    ).length;
    const lastUpdated = opportunities.reduce<Date | null>((latest, opp) => {
      if (!opp.lastUpdated) return latest;
      const date = new Date(opp.lastUpdated);
      if (!Number.isFinite(date.getTime())) return latest;
      if (!latest || date > latest) return date;
      return latest;
    }, null);

    return {
      total: opportunities.length,
      filtered: filteredOpportunities.length,
      highConfidence,
      positiveEv,
      lastUpdated,
    };
  }, [filteredOpportunities, opportunities]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white'>
      {/* Phase 4 Banner */}
      <Phase4Banner />

      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='flex justify-between items-center mb-8'>
          <div>
            <h1
              data-testid='propfinder-killer-heading'
              className='text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'
            >
              PropFinder Killer Dashboard
            </h1>
            <p className='text-gray-400 mt-2'>Real PropFinder Data Integration with Alert Engine</p>
          </div>

          <div className='flex items-center space-x-4'>
            <button
              onClick={() => setShowPerformancePanel(!showPerformancePanel)}
              className='flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97] focus-visible:scale-[1.03] focus:outline-none'
            >
              <Gauge className='w-4 h-4' />
              <span>Performance</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className='flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97] focus-visible:scale-[1.03] focus:outline-none disabled:opacity-50'
            >
              <RefreshCw className={`w-4 h-4 ${loading || refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className='bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6'>
          <div className='grid grid-cols-2 md:grid-cols-5 gap-4 text-center'>
            <div>
              <p className='text-gray-400 text-sm'>Opportunities</p>
              <p className='text-white font-bold'>{summary.filtered}</p>
            </div>
            <div>
              <p className='text-gray-400 text-sm'>High Confidence</p>
              <p className='text-green-400 font-bold'>{summary.highConfidence}</p>
            </div>
            <div>
              <p className='text-gray-400 text-sm'>Positive EV</p>
              <p className='text-blue-400 font-bold'>{summary.positiveEv}</p>
            </div>
            <div>
              <p className='text-gray-400 text-sm'>Sports</p>
              <p className='text-purple-400 font-bold'>{availableSports.length}</p>
            </div>
            <div>
              <p className='text-gray-400 text-sm'>Last Update</p>
              <p className='text-white font-bold'>
                {summary.lastUpdated ? summary.lastUpdated.toLocaleTimeString() : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
          <div className='relative'>
            <Search className='absolute left-3 top-3 w-5 h-5 text-gray-400' />
            <input
              type='text'
              placeholder='Search players, teams, props...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white'
            />
          </div>

          <select
            value={selectedSport}
            onChange={e => setSelectedSport(e.target.value)}
            className='px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white'
          >
            <option value='all'>All Sports</option>
            {availableSports.map(sport => (
              <option key={sport} value={sport}>
                {sport.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className='px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white'
          >
            <option value='confidence'>Sort by Confidence</option>
            <option value='ev'>Sort by Expected Value</option>
            <option value='edge'>Sort by Edge</option>
          </select>

          <div className='flex items-center space-x-2 text-gray-400'>
            <Activity className='w-4 h-4' />
            <span>{filteredOpportunities.length} opportunities</span>
          </div>
        </div>

        {/* Performance Panel */}
        {showPerformancePanel && (
          <div className='mb-6'>
            <Suspense fallback={<LoadingSkeleton />}>
              <PerformanceMonitoringDashboard />
            </Suspense>
          </div>
        )}

        {/* Main Content */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Opportunities List */}
          <div className='lg:col-span-2'>
            <div className='bg-gray-800 rounded-lg border border-gray-700 p-4'>
              <div className='flex items-center space-x-2 mb-4'>
                <Zap className='w-5 h-5 text-yellow-400' />
                <h2 className='text-xl font-bold text-white'>Live Opportunities</h2>
                {(loading || refreshing) && (
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400'></div>
                )}
              </div>

              {error ? (
                <div className='text-center py-8'>
                  <p className='text-red-400 mb-4'>Error loading opportunities: {error}</p>
                  <button
                    onClick={handleRefresh}
                    className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors'
                  >
                    Retry
                  </button>
                </div>
              ) : loading && filteredOpportunities.length === 0 ? (
                <LoadingSkeleton />
              ) : (
                <div {...containerProps}>
                  <div {...innerProps}>
                    {visibleItems.map(({ item: opportunity, style }) => (
                      <PropCard
                        key={opportunity.id}
                        opportunity={opportunity}
                        style={style}
                        onSelect={handleOpportunitySelect}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Selected Opportunity Details */}
            {selectedOpportunity && (
              <div className='bg-gray-800 rounded-lg border border-gray-700 p-4'>
                <h3 className='text-lg font-bold text-white mb-4'>Opportunity Details</h3>
                <div className='space-y-3'>
                  <div>
                    <p className='text-gray-400 text-sm'>Player</p>
                    <p className='text-white font-semibold'>{selectedOpportunity.player}</p>
                  </div>
                  <div>
                    <p className='text-gray-400 text-sm'>Matchup</p>
                    <p className='text-white'>
                      {selectedOpportunity.team} vs {selectedOpportunity.opponent}
                    </p>
                  </div>
                  <div>
                    <p className='text-gray-400 text-sm'>Prop</p>
                    <p className='text-white'>
                      {(selectedOpportunity.market ?? '—').toUpperCase()}{' '}
                      {selectedOpportunity.line ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className='text-gray-400 text-sm'>Confidence</p>
                    <p className='text-green-400 font-bold'>
                      {formatPercent(selectedOpportunity.confidence)}
                    </p>
                  </div>
                  <div>
                    <p className='text-gray-400 text-sm'>Expected Value</p>
                    <p className='text-blue-400 font-bold'>
                      {formatPercent(selectedOpportunity.evPercent ?? selectedOpportunity.edge)}
                    </p>
                  </div>
                  <div>
                    <p className='text-gray-400 text-sm'>Best Book</p>
                    <p className='text-white'>
                      {selectedOpportunity.bestBookmaker ||
                        selectedOpportunity.bookmakers?.[0]?.name ||
                        '—'}{' '}
                      (
                      {formatOdds(
                        selectedOpportunity.odds ?? selectedOpportunity.bookmakers?.[0]?.odds
                      )}
                      )
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className='bg-gray-800 rounded-lg border border-gray-700 p-4'>
              <h3 className='text-lg font-bold text-white mb-4'>Quick Stats</h3>
              <div className='space-y-3'>
                <div className='flex justify-between'>
                  <span className='text-gray-400'>High Confidence</span>
                  <span className='text-green-400 font-bold'>{summary.highConfidence}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-400'>Positive EV</span>
                  <span className='text-blue-400 font-bold'>{summary.positiveEv}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-400'>Live Updates</span>
                  <span className='text-yellow-400 font-bold'>Real-time</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizedPropFinderDashboard;
