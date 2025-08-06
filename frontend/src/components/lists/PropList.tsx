import React from 'react';
import type { FeaturedProp } from '../../services/unified/FeaturedPropsService';
import CondensedPropCard from '../CondensedPropCard';
import VirtualizedPropList from '../VirtualizedPropList';

export interface PropListProps {
  props: FeaturedProp[];
  loading: boolean;
  expandedRowKey: string | null;
  onExpandToggle: (key: string) => void;
  onAnalysisRequest: (prop: FeaturedProp) => void;
  enhancedAnalysisCache: Record<string, any>;
  loadingAnalysis: Record<string, boolean>;
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
export const PropList: React.FC<PropListProps> = ({
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
  // Auto-virtualization for large datasets
  const shouldVirtualize = useVirtualization || forceVirtualization || props.length > 100;

  // Filter props based on search term
  const filteredProps = React.useMemo(() => {
    if (!searchTerm.trim()) return props;

    const term = searchTerm.toLowerCase();
    return props.filter(
      prop =>
        prop.player?.toLowerCase().includes(term) ||
        prop.statType?.toLowerCase().includes(term) ||
        prop.matchup?.toLowerCase().includes(term)
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
          onExpandToggle={onExpandToggle}
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
            prop={prop}
            isExpanded={expandedRowKey === prop.id}
            onToggleExpand={() => onExpandToggle(prop.id)}
            onAnalysisRequest={() => onAnalysisRequest(prop)}
            enhancedAnalysis={enhancedAnalysisCache[prop.id]}
            loadingAnalysis={loadingAnalysis[prop.id] || false}
          />
        ))}
      </div>
    </div>
  );
};
