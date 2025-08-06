/**
 * Performance-Optimized PropList Component v2
 *
 * This component replaces the original PropList with significant performance improvements:
 * - React.memo for preventing unnecessary re-renders
 * - Virtualization for large datasets using react-window
 * - Optimized sorting and filtering
 * - Intelligent batching of operations
 * - Proper TypeScript interfaces matching existing components
 */

import React, { memo, useCallback, useMemo } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { EnhancedPropAnalysis } from '../../services/EnhancedPropAnalysisService';
import { FeaturedProp } from '../../services/unified/FeaturedPropsService';
import CondensedPropCard from '../CondensedPropCard';
import EnhancedPropCard from '../EnhancedPropCard';
import LoadingOverlay from '../LoadingOverlay';
import PropCard, { PropCardProps } from '../PropCard';

// Type interfaces
interface SortConfig {
  field: 'confidence' | 'line' | 'player';
  direction: 'asc' | 'desc';
}

interface OptimizedPropListProps {
  props: FeaturedProp[];
  expandedRowKey: string | null;
  onExpandToggle: (key: string | null) => void;
  onAnalysisRequest: (prop: FeaturedProp) => void;
  enhancedAnalysisCache: Record<string, EnhancedPropAnalysis>;
  loadingAnalysis: Record<string, boolean>;
  sortConfig?: SortConfig;
  filters?: any;
  viewMode?: 'condensed' | 'expanded' | 'card';
  enableVirtualization?: boolean;
  className?: string;
  isLoading?: boolean;
  loadingStage?: 'activating' | 'fetching' | 'processing';
}

interface VirtualizedListData {
  props: FeaturedProp[];
  expandedRowKey: string | null;
  onExpandToggle: (key: string | null) => void;
  onAnalysisRequest: (prop: FeaturedProp) => void;
  enhancedAnalysisCache: Record<string, EnhancedPropAnalysis>;
  loadingAnalysis: Record<string, boolean>;
  viewMode: 'condensed' | 'expanded' | 'card';
}

// Helper function to convert FeaturedProp to PropCard compatible props
const mapFeaturedPropToCardProps = (
  prop: FeaturedProp
): Omit<
  PropCardProps,
  'onCollapse' | 'onRequestAnalysis' | 'isAnalysisLoading' | 'hasAnalysis'
> => ({
  player: prop.player || '',
  team: prop.team || '',
  position: prop.position || '',
  score: prop.confidence || 0,
  maxScore: 100,
  summary: prop.summary || `${prop.stat} ${prop.line}`,
  analysis: prop.analysis || '',
  stats: prop.stats || [],
  insights: prop.insights || [],
});

// Performance-optimized sorting and filtering
const sortAndFilterProps = (
  props: FeaturedProp[],
  sortConfig?: SortConfig,
  filters?: any
): FeaturedProp[] => {
  let result = [...props];

  // Apply filters
  if (filters) {
    if (filters.minConfidence !== undefined) {
      result = result.filter(prop => (prop.confidence || 0) >= filters.minConfidence);
    }
    if (filters.sport && filters.sport !== 'all') {
      result = result.filter(prop => prop.sport === filters.sport);
    }
    if (filters.stat && filters.stat !== 'all') {
      result = result.filter(prop => prop.stat === filters.stat);
    }
  }

  // Apply sorting
  if (sortConfig) {
    result.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortConfig.field) {
        case 'confidence':
          aValue = a.confidence || 0;
          bValue = b.confidence || 0;
          break;
        case 'line':
          aValue = parseFloat(a.line?.toString() || '0');
          bValue = parseFloat(b.line?.toString() || '0');
          break;
        case 'player':
          aValue = a.player || '';
          bValue = b.player || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return result;
};

// Base item height for virtualization
const ITEM_HEIGHT = 180;
const EXPANDED_ITEM_HEIGHT = 580;

// VirtualizedListItem component for react-window
const VirtualizedListItem: React.FC<ListChildComponentProps<VirtualizedListData>> = memo(
  ({ index, style, data }) => {
    const prop = data.props[index];
    const isExpanded = data.expandedRowKey === prop.id;

    return (
      <div style={style}>
        {data.viewMode === 'condensed' ? (
          <CondensedPropCard
            key={prop.id}
            player={prop.player || ''}
            team={prop.team || ''}
            stat={prop.stat || ''}
            line={parseFloat(prop.line?.toString() || '0')}
            confidence={prop.confidence || 0}
            grade={prop.grade || 'A+'}
            logoUrl={prop.logoUrl}
            accentColor={prop.accentColor}
            bookmarked={prop.bookmarked}
            matchup={prop.matchup}
            espnPlayerId={prop.espnPlayerId}
            onClick={() => data.onExpandToggle(isExpanded ? null : prop.id)}
            isExpanded={isExpanded}
            showStatcastMetrics={isExpanded}
            statcastData={prop.statcastData}
            alternativeProps={prop.alternativeProps || []}
          />
        ) : (
          <PropCard
            key={prop.id}
            {...mapFeaturedPropToCardProps(prop)}
            onCollapse={() => data.onExpandToggle(null)}
            onRequestAnalysis={() => data.onAnalysisRequest(prop)}
            isAnalysisLoading={data.loadingAnalysis[prop.id] || false}
            hasAnalysis={!!data.enhancedAnalysisCache[prop.id]}
          />
        )}
      </div>
    );
  }
);

VirtualizedListItem.displayName = 'VirtualizedListItem';

// Standard PropListItem component for non-virtualized rendering
const PropListItem = memo<{
  prop: FeaturedProp;
  isExpanded: boolean;
  onExpandToggle: (key: string | null) => void;
  onAnalysisRequest: (prop: FeaturedProp) => void;
  enhancedAnalysisCache: Record<string, EnhancedPropAnalysis>;
  loadingAnalysis: Record<string, boolean>;
  viewMode: 'condensed' | 'expanded' | 'card';
}>(
  ({
    prop,
    isExpanded,
    onExpandToggle,
    onAnalysisRequest,
    enhancedAnalysisCache,
    loadingAnalysis,
    viewMode,
  }) => {
    const handleExpandToggle = useCallback(() => {
      onExpandToggle(isExpanded ? null : prop.id);
    }, [isExpanded, prop.id, onExpandToggle]);

    const handleAnalysisRequest = useCallback(() => {
      onAnalysisRequest(prop);
    }, [prop, onAnalysisRequest]);

    switch (viewMode) {
      case 'condensed':
        return (
          <CondensedPropCard
            key={prop.id}
            player={prop.player || ''}
            team={prop.team || ''}
            stat={prop.stat || ''}
            line={parseFloat(prop.line?.toString() || '0')}
            confidence={prop.confidence || 0}
            grade={prop.grade || 'A+'}
            logoUrl={prop.logoUrl}
            accentColor={prop.accentColor}
            bookmarked={prop.bookmarked}
            matchup={prop.matchup}
            espnPlayerId={prop.espnPlayerId}
            onClick={handleExpandToggle}
            isExpanded={isExpanded}
            showStatcastMetrics={isExpanded}
            statcastData={prop.statcastData}
            alternativeProps={prop.alternativeProps || []}
          />
        );

      case 'expanded':
        return (
          <EnhancedPropCard
            key={prop.id}
            prop={prop}
            analysis={enhancedAnalysisCache[prop.id]}
            loading={loadingAnalysis[prop.id] || false}
            onAnalysisRequest={handleAnalysisRequest}
          />
        );

      default:
        return (
          <PropCard
            key={prop.id}
            {...mapFeaturedPropToCardProps(prop)}
            onCollapse={() => onExpandToggle(null)}
            onRequestAnalysis={handleAnalysisRequest}
            isAnalysisLoading={loadingAnalysis[prop.id] || false}
            hasAnalysis={!!enhancedAnalysisCache[prop.id]}
          />
        );
    }
  }
);

PropListItem.displayName = 'PropListItem';

// Main OptimizedPropList component
const OptimizedPropList: React.FC<OptimizedPropListProps> = memo(
  ({
    props,
    expandedRowKey,
    onExpandToggle,
    onAnalysisRequest,
    enhancedAnalysisCache,
    loadingAnalysis,
    sortConfig,
    filters,
    viewMode = 'card',
    enableVirtualization = true,
    className = '',
    isLoading = false,
    loadingStage = 'fetching',
  }) => {
    // Memoized processed props
    const processedProps = useMemo(
      () => sortAndFilterProps(props, sortConfig, filters),
      [props, sortConfig, filters]
    );

    // Determine if virtualization should be used
    const shouldVirtualize = enableVirtualization && processedProps.length > 50;

    // Memoized item height calculation for virtualization
    const getItemSize = useCallback(
      (index: number) => {
        const prop = processedProps[index];
        const isExpanded = expandedRowKey === prop.id;
        return isExpanded ? EXPANDED_ITEM_HEIGHT : ITEM_HEIGHT;
      },
      [processedProps, expandedRowKey]
    );

    // Memoized virtualized list data
    const virtualizedListData: VirtualizedListData = useMemo(
      () => ({
        props: processedProps,
        expandedRowKey,
        onExpandToggle,
        onAnalysisRequest,
        enhancedAnalysisCache,
        loadingAnalysis,
        viewMode,
      }),
      [
        processedProps,
        expandedRowKey,
        onExpandToggle,
        onAnalysisRequest,
        enhancedAnalysisCache,
        loadingAnalysis,
        viewMode,
      ]
    );

    if (isLoading) {
      return <LoadingOverlay isVisible={true} stage={loadingStage} sport='MLB' />;
    }

    if (processedProps.length === 0) {
      return (
        <div className={`flex items-center justify-center py-12 ${className}`}>
          <div className='text-center'>
            <p className='text-gray-500 text-lg'>No props match your current filters</p>
            <p className='text-gray-400 text-sm mt-2'>
              Try adjusting your filters or refreshing the data
            </p>
          </div>
        </div>
      );
    }

    // Virtualized rendering for large datasets
    if (shouldVirtualize) {
      return (
        <div className={`optimized-prop-list virtualized ${className}`}>
          <List
            height={600} // Fixed height for virtualization
            itemCount={processedProps.length}
            itemSize={ITEM_HEIGHT} // Use fixed size for better performance
            itemData={virtualizedListData}
            width='100%'
          >
            {VirtualizedListItem}
          </List>
        </div>
      );
    }

    // Standard rendering for smaller datasets
    return (
      <div className={`optimized-prop-list standard ${className}`}>
        <div className='space-y-4'>
          {processedProps.map(prop => (
            <PropListItem
              key={prop.id}
              prop={prop}
              isExpanded={expandedRowKey === prop.id}
              onExpandToggle={onExpandToggle}
              onAnalysisRequest={onAnalysisRequest}
              enhancedAnalysisCache={enhancedAnalysisCache}
              loadingAnalysis={loadingAnalysis}
              viewMode={viewMode}
            />
          ))}
        </div>
      </div>
    );
  }
);

OptimizedPropList.displayName = 'OptimizedPropList';

export default OptimizedPropList;
