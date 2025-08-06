import React, { useMemo } from 'react';
import type { FeaturedProp } from '../../services/unified/FeaturedPropsService';
import CondensedPropCard from '../CondensedPropCard';
import VirtualizedPropList from '../VirtualizedPropList';

export interface PropListProps {
  props: FeaturedProp[];
  loading: boolean;
  expandedRowKey: string | null;
  onExpandToggle: (key: string) => void;
  onAnalysisRequest: (prop: FeaturedProp) => Promise<any>;
  enhancedAnalysisCache: Map<string, any>;
  loadingAnalysis: Set<string>;
  sortBy: string;
  searchTerm: string;
  useVirtualization: boolean;
  forceVirtualization?: boolean;
}

/**
 * PropList Component - Displays the list of props with virtualization support
 *
 * Handles both standard and virtualized rendering based on performance settings
 */
const PropListComponent: React.FC<PropListProps> = React.memo(
  ({
    props,
    loading,
    expandedRowKey,
    onExpandToggle,
    onAnalysisRequest,
    enhancedAnalysisCache,
    loadingAnalysis,
    sortBy,
    searchTerm,
    useVirtualization,
    forceVirtualization = false,
  }) => {
    console.count('[PropList] RENDER');
    // Auto-virtualization for large datasets
    const shouldVirtualize = useMemo(
      () => useVirtualization || forceVirtualization || props.length > 100,
      [useVirtualization, forceVirtualization, props.length]
    );

    // Filter props based on search term
    const filteredProps = React.useMemo(() => {
      if (!searchTerm.trim()) return props;
      const term = searchTerm.toLowerCase();
      return props.filter(
        prop =>
          (prop.player && prop.player.toLowerCase().includes(term)) ||
          (prop.matchup && prop.matchup.toLowerCase().includes(term))
      );
    }, [props, searchTerm]);

    // Show loading state
    if (loading && props.length === 0) {
      return (
        <div className='flex items-center justify-center h-64'>
          <div className='text-lg text-gray-600'>Loading props...</div>
        </div>
      );
    }

    // Show empty state
    if (!loading && filteredProps.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center h-64 text-gray-500'>
          <div className='text-xl mb-2'>No props found</div>
          {searchTerm && <div className='text-sm'>Try adjusting your search or filters</div>}
        </div>
      );
    }

    // Render with virtualization if needed
    if (shouldVirtualize) {
      console.log('⚡ Virtualized rendering active for', filteredProps.length, 'props');
      // Wrap onExpandToggle to accept string|null
      const handleSetExpandedRowKey = (key: string | null) => {
        if (key !== null) onExpandToggle(key);
      };
      // Provide required props for VirtualizedPropList
      const noop = () => {};
      const noopIsSelected = () => false;
      const noopAsync = async () => {};
      const expandedCardRef = React.useRef(null);
      return (
        <div className='props-list-container'>
          <div className='mb-4 text-sm text-gray-600'>
            Showing {filteredProps.length} props (virtualized for performance)
          </div>
          <VirtualizedPropList
            projections={filteredProps}
            fetchEnhancedAnalysis={onAnalysisRequest}
            enhancedAnalysisCache={enhancedAnalysisCache}
            loadingAnalysis={loadingAnalysis}
            expandedRowKey={expandedRowKey}
            setExpandedRowKey={handleSetExpandedRowKey}
            isSelected={noopIsSelected}
            addProp={noopAsync}
            removeProp={noop}
            expandedCardRef={expandedCardRef}
            propAnalystResponses={{}}
            clicksEnabled={false}
          />
        </div>
      );
    }

    // Standard rendering for smaller datasets
    return (
      <div className='props-list-container'>
        <div className='mb-4 text-sm text-gray-600'>Showing {filteredProps.length} props</div>
        <div className='space-y-4'>
          {filteredProps.map(prop => (
            <CondensedPropCard
              key={prop.id}
              player={prop.player}
              team={prop.matchup?.split(' ')[0] || ''}
              stat={prop.stat}
              line={prop.line}
              confidence={prop.confidence}
              matchup={prop.matchup}
              espnPlayerId={prop.espnPlayerId}
              onClick={() => onExpandToggle(prop.id)}
              isExpanded={expandedRowKey === prop.id}
            />
          ))}
        </div>
      </div>
    );
  }
);
// Auto-virtualization for large datasets

// Exporting the PropListComponent as default
export default PropListComponent;
export const PropList = React.memo(PropListComponent);
