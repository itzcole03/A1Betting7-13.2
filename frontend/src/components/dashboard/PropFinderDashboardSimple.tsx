import { useVirtualizer } from '@tanstack/react-virtual';
import { Filter, Heart, Search } from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import usePropfinderData, {
  PropOpportunity as CompatOpportunity,
} from '../../hooks/usePropFinderData';

interface SimpleOpportunity {
  id: string;
  playerName: string;
  team: string;
  position?: string;
  propLabel: string;
  line: number;
  odds: number;
  pfRating: number;
  l10Avg: number;
  edge: number;
  confidence: number;
  isFavorited?: boolean;
  sport?: string;
}

// Utility functions
const formatOdds = (odds: number): string => {
  return odds > 0 ? `+${odds}` : `${odds}`;
};

const getRatingColor = (rating: number): string => {
  if (rating >= 80) return 'bg-green-500';
  if (rating >= 70) return 'bg-blue-500';
  if (rating >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Main PropFinder Dashboard Component
const PropFinderDashboard: React.FC = () => {
  const { opportunities: compatOpportunities = [], stats, loading, error } = usePropfinderData();
  const [searchQuery, setSearchQuery] = useState('');
  // Default to 'All' so the dashboard doesn't pre-filter out opportunities on first load
  const [selectedSport, setSelectedSport] = useState('All');
  const [minConfidence, setMinConfidence] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const opportunities = useMemo<SimpleOpportunity[]>(() => {
    return compatOpportunities.map((opp: CompatOpportunity) => {
      const firstBookmakerOdds =
        Array.isArray(opp.bookmakers) && opp.bookmakers.length > 0
          ? opp.bookmakers[0]?.odds
          : opp.odds;
      const positionTag = opp.tags?.find(tag => tag?.toLowerCase().includes('position'));

      return {
        id: opp.id,
        playerName: opp.player ?? 'Unknown Player',
        team: opp.team ?? 'Unknown Team',
        position: positionTag,
        propLabel: opp.market
          ? `${opp.market}${typeof opp.line === 'number' ? ` ${opp.line}` : ''}`
          : 'Prop',
        line: typeof opp.line === 'number' ? opp.line : 0,
        odds:
          typeof firstBookmakerOdds === 'number'
            ? firstBookmakerOdds
            : Number(firstBookmakerOdds) || 0,
        pfRating: typeof opp.confidence === 'number' ? opp.confidence : 0,
        l10Avg:
          typeof opp.projectedValue === 'number'
            ? opp.projectedValue
            : typeof opp.edge === 'number'
            ? opp.edge
            : 0,
        edge: typeof opp.edge === 'number' ? opp.edge : 0,
        confidence: typeof opp.confidence === 'number' ? opp.confidence : 0,
        isFavorited: opp.isBookmarked,
        sport: opp.sport,
      };
    });
  }, [compatOpportunities]);

  const totalCount = stats?.total_opportunities ?? compatOpportunities.length;

  // Filter and search logic
  const filteredOpportunities = useMemo(() => {
    const normalizedSport = selectedSport.toLowerCase();
    return opportunities.filter(opp => {
      const matchesSearch =
        opp.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.propLabel.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesConfidence = opp.confidence >= minConfidence;
      const matchesSport =
        selectedSport === 'All' || !opp.sport
          ? true
          : (opp.sport ?? '').toLowerCase() === normalizedSport;
      return matchesSearch && matchesConfidence && matchesSport;
    });
  }, [opportunities, searchQuery, minConfidence, selectedSport]);

  // Virtualization setup
  const parentRef = useRef<HTMLDivElement>(null);
  const VIRTUALIZATION_THRESHOLD = 20;
  const shouldVirtualize = filteredOpportunities.length > VIRTUALIZATION_THRESHOLD;

  const virtualizer = useVirtualizer({
    count: filteredOpportunities.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    enabled: shouldVirtualize,
  });

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gray-900'>
        <div className='text-white'>Loading PropFinder opportunities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gray-900'>
        <div className='text-red-400'>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-900 text-white p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold mb-2'>PropFinder</h1>
          <p className='text-gray-400'>Find the best prop betting opportunities</p>
        </div>

        {/* Dev debug panel - shows last request/response for easier local debugging */}
        {process.env.NODE_ENV === 'development' && (
          <div className='mt-4 p-3 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300'>
            <div className='font-medium text-sm text-gray-200 mb-2'>Dev: Last PropFinder request</div>
            <pre className='whitespace-pre-wrap break-words max-h-40 overflow-auto text-xs'>
              {typeof window !== 'undefined' && (window as any).__propfinder_last_request_url
                ? String((window as any).__propfinder_last_request_url)
                : 'No request recorded'}
            </pre>
            <div className='font-medium text-sm text-gray-200 mt-2 mb-1'>Dev: Last response summary</div>
            <pre className='whitespace-pre-wrap break-words max-h-40 overflow-auto text-xs'>
              {typeof window !== 'undefined' && (window as any).__propfinder_last_stats
                ? JSON.stringify((window as any).__propfinder_last_stats, null, 2)
                : 'No response recorded'}
            </pre>
          </div>
        )}

        {/* Dev fetch status banner */}
        {process.env.NODE_ENV === 'development' && (
          <div className='mt-4'>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {typeof window !== 'undefined' && (window as any).__propfinder_last_fetch_status && (
              (() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const st: any = (window as any).__propfinder_last_fetch_status;
                if (!st.ok) {
                  return (
                    <div className='mb-4 p-3 bg-red-700 text-white rounded'>
                      <strong>Dev:</strong> Last PropFinder fetch failed — {String(st.message)}
                    </div>
                  );
                }
                if (st.server_total === 0) {
                  return (
                    <div className='mb-4 p-3 bg-yellow-700 text-white rounded'>
                      <strong>Dev:</strong> Server returned 0 total opportunities
                    </div>
                  );
                }
                return null;
              })()
            )}
          </div>
        )}

        {/* Controls */}
        <div className='mb-6 space-y-4'>
          <div className='flex flex-wrap gap-4'>
            <div className='relative flex-1 min-w-64'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <input
                type='text'
                placeholder='Search players or props...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className='px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2'
            >
              <Filter className='w-4 h-4' />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className='bg-gray-800 p-4 rounded-lg border border-gray-700'>
              <div className='flex flex-wrap gap-4 items-center'>
                <div>
                  <label className='block text-sm font-medium mb-1'>Sport</label>
                  <select
                    value={selectedSport}
                    onChange={e => setSelectedSport(e.target.value)}
                    className='px-3 py-1 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500'
                  >
                    <option value='All'>All</option>
                    <option value='MLB'>MLB</option>
                    <option value='NBA'>NBA</option>
                    <option value='NFL'>NFL</option>
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium mb-1'>
                    Min Confidence: {minConfidence}%
                  </label>
                  <input
                    type='range'
                    min='0'
                    max='100'
                    value={minConfidence}
                    onChange={e => setMinConfidence(Number(e.target.value))}
                    className='w-32'
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className='mb-4 flex justify-between items-center'>
          <p className='text-gray-400'>
            Showing {filteredOpportunities.length} of {totalCount} opportunities
          </p>
          {shouldVirtualize && (
            <div className='text-sm text-blue-400'>⚡ Virtualized rendering active</div>
          )}
        </div>

        {/* Data Table */}
        {filteredOpportunities.length === 0 ? (
          <div className='text-center py-12 text-gray-400'>
            No opportunities match your current filters
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className='grid grid-cols-6 gap-4 px-4 py-3 bg-gray-800 border-b border-gray-700 text-sm font-medium text-gray-300'>
              <div>Player</div>
              <div>Prop</div>
              <div>PF Rating</div>
              <div>L10 Avg</div>
              <div>Odds</div>
              <div>Actions</div>
            </div>

            {/* Table Body */}
            {shouldVirtualize ? (
              <div ref={parentRef} className='h-96 overflow-auto' style={{ contain: 'strict' }}>
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {virtualizer.getVirtualItems().map(virtualItem => {
                    const opportunity = filteredOpportunities[virtualItem.index];
                    return (
                      <div
                        key={virtualItem.key}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                        className='grid grid-cols-6 gap-4 px-4 py-3 hover:bg-gray-800 transition-colors items-center border-b border-gray-700'
                      >
                        <OpportunityRow opportunity={opportunity} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className='divide-y divide-gray-700'>
                {filteredOpportunities.map(opportunity => (
                  <div
                    key={opportunity.id}
                    className='grid grid-cols-6 gap-4 px-4 py-3 hover:bg-gray-800 transition-colors items-center'
                  >
                    <OpportunityRow opportunity={opportunity} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Opportunity row component
const OpportunityRow: React.FC<{ opportunity: SimpleOpportunity }> = ({ opportunity }) => {
  const [isFavorited, setIsFavorited] = useState(opportunity.isFavorited || false);

  return (
    <>
      <div className='flex items-center space-x-3'>
        <div className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold'>
          {opportunity.playerName
            .split(' ')
            .map(n => n[0])
            .join('')}
        </div>
        <div>
          <div className='font-medium'>{opportunity.playerName}</div>
          <div className='text-xs text-gray-400'>
            {opportunity.team}
            {opportunity.position ? ` ${opportunity.position}` : ''}
          </div>
        </div>
      </div>

      <div className='font-medium'>{opportunity.propLabel}</div>

      <div>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getRatingColor(
            opportunity.pfRating
          )}`}
        >
          {Math.round(opportunity.pfRating)}
        </div>
      </div>

      <div className={opportunity.l10Avg >= 1.5 ? 'text-green-400' : 'text-red-400'}>
        {opportunity.l10Avg.toFixed(1)}
      </div>

      <div className='bg-gray-700 px-2 py-1 rounded text-sm inline-block'>
        {formatOdds(opportunity.odds)}
      </div>

      <div>
        <Heart
          onClick={() => setIsFavorited(!isFavorited)}
          className={`w-5 h-5 cursor-pointer transition-colors ${
            isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'
          }`}
        />
      </div>
    </>
  );
};

export default PropFinderDashboard;
