import { useVirtualizer } from '@tanstack/react-virtual';
import React from 'react';
import { EnhancedPropAnalysis } from '../services/EnhancedPropAnalysisService';
import { FeaturedProp } from '../services/unified/FeaturedPropsService';
import CondensedPropCard from './CondensedPropCard';

// Helper functions
const extractTeamFromMatchup = (matchup: string): string => {
  return matchup.split(' vs ')[0] || matchup.split(' @ ')[0] || matchup;
};

const getGradeFromConfidence = (confidence: number): string => {
  return confidence >= 80 ? 'A+' : confidence >= 60 ? 'B' : 'C';
};

const getLogoUrl = (matchup: string): string => {
  return matchup ? `/logos/${matchup.split(' ')[0].toLowerCase()}.png` : '';
};

const getAccentColor = (matchup: string): string => {
  if (matchup && matchup.toLowerCase().includes('chiefs')) return '#b71c1c';
  if (matchup && matchup.toLowerCase().includes('rams')) return '#0d47a1';
  if (matchup && matchup.toLowerCase().includes('eagles')) return '#004d40';
  return '#222';
};

interface VirtualizedPropListProps {
  projections: FeaturedProp[];
  isSelected: (id: string) => boolean;
  addProp: (proj: FeaturedProp, choice: 'over' | 'under') => void;
  removeProp: (propId: string) => void;
  expandedRowKey: string | null;
  setExpandedRowKey: (key: string | null) => void;
  expandedCardRef: React.RefObject<HTMLDivElement | null>;
  propAnalystResponses: Record<string, any>;
  clicksEnabled: boolean;
  enhancedAnalysisCache: Map<string, EnhancedPropAnalysis>;
  fetchEnhancedAnalysis: (proj: FeaturedProp) => Promise<EnhancedPropAnalysis | null>;
  loadingAnalysis: Set<string>;
}

const VirtualizedPropList: React.FC<VirtualizedPropListProps> = ({
  projections,
  isSelected,
  addProp,
  removeProp,
  expandedRowKey,
  setExpandedRowKey,
  expandedCardRef,
  propAnalystResponses,
  clicksEnabled,
  enhancedAnalysisCache,
  fetchEnhancedAnalysis,
  loadingAnalysis,
}) => {
  // Create container ref for the virtualizer
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Calculate estimated item height (this should match your CondensedPropCard height)
  const estimateItemHeight = React.useCallback(
    (index: number) => {
      // Base card height
      const baseHeight = 180;

      // If this card is expanded, add space for expanded content
      const isExpanded = projections[index]?.id === expandedRowKey;
      const expandedHeight = isExpanded ? 400 : 0; // Estimate expanded content height

      return baseHeight + expandedHeight;
    },
    [projections, expandedRowKey]
  );

  // Create the virtualizer
  const virtualizer = useVirtualizer({
    count: projections.length,
    getScrollElement: () => containerRef.current,
    estimateSize: estimateItemHeight,
    overscan: 5, // Render 5 extra items outside the viewport for smooth scrolling
    measureElement: element => {
      // Measure the actual element height for dynamic sizing
      return element.getBoundingClientRect().height;
    },
  });

  // Debug logging
  React.useEffect(() => {
    console.log('[VirtualizedPropList] Rendering', projections.length, 'items');
    console.log('[VirtualizedPropList] Virtual items:', virtualizer.getVirtualItems().length);
    console.log('[VirtualizedPropList] Total size:', virtualizer.getTotalSize());
  }, [projections.length, virtualizer]);

  return (
    <div className='w-full'>
      {/* Performance Stats */}
      <div className='mb-4 text-sm text-gray-400 bg-slate-800 rounded p-2 border border-slate-700'>
        <div className='flex justify-between items-center'>
          <span>📊 Dataset: {projections.length} props</span>
          <span>🚀 Rendering: {virtualizer.getVirtualItems().length} visible</span>
          <span>
            ⚡ Performance:{' '}
            {((virtualizer.getVirtualItems().length / projections.length) * 100).toFixed(1)}%
            efficiency
          </span>
        </div>
      </div>

      {/* Virtualized Container */}
      <div
        ref={containerRef}
        className='h-[800px] overflow-auto'
        style={{
          contain: 'strict',
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map(virtualItem => {
            const proj = projections[virtualItem.index];
            const isExpanded = proj.id === expandedRowKey;

            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {/* Expanded card wrapper for click-outside detection */}
                <div
                  ref={isExpanded ? expandedCardRef : null}
                  className={`transition-all duration-200 ${isExpanded ? 'z-10 relative' : ''}`}
                >
                  <CondensedPropCard
                    key={proj.id}
                    player={proj.player}
                    team={extractTeamFromMatchup(proj.matchup || '')}
                    stat={proj.stat || 'Unknown'}
                    line={proj.line || 0}
                    confidence={proj.confidence || 0}
                    grade={getGradeFromConfidence(proj.confidence || 0)}
                    logoUrl={getLogoUrl(proj.matchup || '')}
                    accentColor={getAccentColor(proj.matchup || '')}
                    bookmarked={proj.confidence >= 90}
                    matchup={proj.matchup}
                    espnPlayerId={proj.espnPlayerId}
                    onClick={() => {
                      if (!clicksEnabled) return;
                      setExpandedRowKey(isExpanded ? null : proj.id);
                    }}
                    isExpanded={isExpanded}
                    showStatcastMetrics={proj.sport === 'MLB'}
                    statcastData={proj._originalData}
                    alternativeProps={(proj as any).alternativeProps}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Load More Button (if needed) */}
      {projections.length > 100 && (
        <div className='mt-4 text-center'>
          <div className='text-sm text-gray-400 bg-slate-800 rounded p-3 border border-slate-700'>
            <div className='flex items-center justify-center space-x-4'>
              <span>⚡ Virtualized rendering active</span>
              <span>📈 Smooth scrolling for {projections.length.toLocaleString()} items</span>
              <span>🔥 Memory optimized</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualizedPropList;
