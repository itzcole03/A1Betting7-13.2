/**
 * Optimized PropOllama Container
 *
 * This container integrates all our new performance optimizations:
 * - usePropOllamaReducer for optimized state management
 * - OptimizedSportsDataService for intelligent caching
 * - OptimizedPropList for performance rendering
 * - React.memo and useCallback for preventing unnecessary re-renders
 */

import React, { memo, useCallback, useMemo } from 'react';
import { OptimizedSportsDataService } from '../../services/optimized/OptimizedSportsDataService';
import EnhancedErrorBoundary from '../EnhancedErrorBoundary';
import { usePropOllamaReducer } from '../hooks/usePropOllamaReducer';
import LoadingOverlay from '../LoadingOverlay';
import { OptimizedPropList } from './OptimizedPropList';

interface OptimizedPropOllamaContainerProps {
  className?: string;
}

const OptimizedPropOllamaContainer: React.FC<OptimizedPropOllamaContainerProps> = memo(
  ({ className = '' }) => {
    // Use optimized reducer for state management
    const [state, actions] = usePropOllamaReducer();
    const dataService = new OptimizedSportsDataService();

    // Memoized handlers to prevent unnecessary re-renders
    const handleExpandToggle = useCallback(
      (key: string | null) => {
        actions.updateDisplayOptions({ expandedRowKey: key });
      },
      [actions]
    );

    const handleAnalysisRequest = useCallback(
      async (prop: any) => {
        actions.addLoadingAnalysis(prop.id);

        try {
          // Use optimized data service for analysis request
          const analysis = await dataService.fetchEnhancedAnalysis(prop);
          actions.addToAnalysisCache(prop.id, analysis);
        } catch (error) {
          console.error('Failed to fetch analysis:', error);
        } finally {
          actions.removeLoadingAnalysis(prop.id);
        }
      },
      [actions, dataService]
    );

    const handleSortChange = useCallback(
      (sortConfig: any) => {
        const [field, direction] = sortConfig.split('-');
        actions.updateSorting({ sortBy: field, sortOrder: direction });
      },
      [actions]
    );

    const handleFiltersChange = useCallback(
      (filters: any) => {
        actions.updateFilters(filters);
      },
      [actions]
    );

    // Memoized filter values for performance
    const memoizedFilters = useMemo(
      () => state.filters,
      [state.filters.selectedSport, state.filters.searchTerm]
    );
    const memoizedSortConfig = useMemo(
      () => ({
        field: (state.sorting.sortBy === 'confidence'
          ? 'confidence'
          : state.sorting.sortBy === 'alphabetical'
          ? 'player'
          : 'confidence') as 'confidence' | 'line' | 'player',
        direction: state.sorting.sortOrder as 'asc' | 'desc',
      }),
      [state.sorting.sortBy, state.sorting.sortOrder]
    );

    // Determine valid loading stage
    const validLoadingStage = useMemo(() => {
      if (state.loadingStage?.stage === 'fetching') {
        return 'fetching' as const;
      } else if (state.loadingStage?.stage === 'filtering') {
        return 'processing' as const;
      } else if (state.loadingStage?.stage === 'rendering') {
        return 'processing' as const;
      }
      return 'fetching' as const;
    }, [state.loadingStage]);

    // Performance monitoring
    const propCount = state.projections.length;
    const isLargeDataset = propCount > 100;

    React.useEffect(() => {
      if (isLargeDataset) {
        console.log(`[OptimizedPropOllamaContainer] 🚀 Managing large dataset: ${propCount} props`);
      }
    }, [isLargeDataset, propCount]);

    return (
      <EnhancedErrorBoundary>
        <div className={`optimized-prop-ollama-container ${className}`}>
          {/* Header Section */}
          <div className='header-section mb-6'>
            <div className='flex items-center justify-between'>
              <h1 className='text-3xl font-bold text-gray-900'>⚡ Optimized Sports Analytics</h1>

              {/* Performance Indicator */}
              <div className='performance-indicator'>
                {isLargeDataset && (
                  <div className='bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium'>
                    🚀 High Performance Mode ({propCount} props)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className='stats-bar bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-6'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-center'>
              <div>
                <div className='text-2xl font-bold text-blue-600'>{propCount}</div>
                <div className='text-sm text-gray-600'>Total Props</div>
              </div>
              <div>
                <div className='text-2xl font-bold text-green-600'>
                  {state.projections.filter(p => (p.confidence || 0) > 80).length}
                </div>
                <div className='text-sm text-gray-600'>High Confidence</div>
              </div>
              <div>
                <div className='text-2xl font-bold text-purple-600'>
                  {Object.keys(state.enhancedAnalysisCache).length}
                </div>
                <div className='text-sm text-gray-600'>Analyzed</div>
              </div>
              <div>
                <div className='text-2xl font-bold text-orange-600'>
                  {isLargeDataset ? 'ON' : 'OFF'}
                </div>
                <div className='text-sm text-gray-600'>Optimization</div>
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div className='controls-section mb-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {/* Filters */}
              <div className='filter-controls'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Search Term</label>
                <input
                  type='text'
                  value={state.filters.searchTerm}
                  onChange={e =>
                    handleFiltersChange({
                      ...state.filters,
                      searchTerm: e.target.value,
                    })
                  }
                  placeholder='Search props...'
                  className='w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                />
              </div>

              {/* Sport Filter */}
              <div className='sport-filter'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Sport</label>
                <select
                  value={state.filters.selectedSport}
                  onChange={e =>
                    handleFiltersChange({
                      ...state.filters,
                      selectedSport: e.target.value,
                    })
                  }
                  className='w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value='MLB'>MLB</option>
                  <option value='NBA'>NBA</option>
                  <option value='NFL'>NFL</option>
                  <option value='NHL'>NHL</option>
                </select>
              </div>

              {/* Sort Control */}
              <div className='sort-controls'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Sort By</label>
                <select
                  value={`${state.sorting.sortBy}-${state.sorting.sortOrder}`}
                  onChange={e => handleSortChange(e.target.value)}
                  className='w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value='confidence-desc'>Confidence (High to Low)</option>
                  <option value='confidence-asc'>Confidence (Low to High)</option>
                  <option value='line-desc'>Line (High to Low)</option>
                  <option value='line-asc'>Line (Low to High)</option>
                  <option value='player-asc'>Player (A to Z)</option>
                  <option value='player-desc'>Player (Z to A)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Props List */}
          <div className='props-section'>
            <OptimizedPropList
              props={state.projections}
              expandedRowKey={state.displayOptions.expandedRowKey}
              onExpandToggle={handleExpandToggle}
              onAnalysisRequest={handleAnalysisRequest}
              enhancedAnalysisCache={state.enhancedAnalysisCache}
              loadingAnalysis={Object.fromEntries(
                Array.from(state.loadingAnalysis).map(id => [id, true])
              )}
              sortConfig={memoizedSortConfig}
              filters={memoizedFilters}
              viewMode='card'
              isLoading={state.isLoading}
              loadingStage={validLoadingStage}
              className='optimized-props-list'
            />
          </div>

          {/* Loading Overlay */}
          {state.isLoading && (
            <LoadingOverlay
              isVisible={state.isLoading}
              stage={validLoadingStage}
              sport='MLB'
              message='Loading optimized sports analytics...'
            />
          )}
        </div>
      </EnhancedErrorBoundary>
    );
  }
);

OptimizedPropOllamaContainer.displayName = 'OptimizedPropOllamaContainer';

export default OptimizedPropOllamaContainer;
