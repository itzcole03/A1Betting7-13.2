import React, { memo, useCallback, useMemo } from 'react';
import { httpFetch } from '../../services/HttpClient';
import { BetSlipComponent } from '../betting/BetSlipComponent';
import EnhancedErrorBoundary from '../EnhancedErrorBoundary';
import { PropFilters } from '../filters/PropFilters';
import { usePropOllamaState } from '../hooks/usePropOllamaState';
import { PropList } from '../lists/PropList';
import LoadingOverlay from '../LoadingOverlay';
import { PerformancePanel } from '../performance/PerformancePanel';
import { PropSorting } from '../sorting/PropSorting';
import { GameStatsPanel } from '../stats/GameStatsPanel';
import { useOptimizedDataFetching } from '../../hooks/useOptimizedDataFetching';

/**
 * Optimized PropOllama Container with performance improvements:
 * - Memoized components to prevent unnecessary re-renders
 * - Debounced data fetching to reduce API calls
 * - Optimized state management
 * - Proper React.memo usage for child components
 */
const OptimizedPropOllamaContainer: React.FC = memo(() => {
  // State and actions hooks
  const [state, actions] = usePropOllamaState();

  // Optimized data fetching with debouncing and caching
  const { data: healthData, loading: healthLoading, error: healthError } = useOptimizedDataFetching(
    () => httpFetch('/api/v2/health').then(res => res.json()),
    [], // No dependencies - only fetch once
    {
      debounceDelay: 500,
      cacheTime: 60000, // Cache for 1 minute
      autoRefresh: false, // Disable auto-refresh for health check
    }
  );

  // Log health data for debugging but don't cause re-renders
  React.useEffect(() => {
    if (healthData) {
      console.log('[OptimizedPropOllamaContainer] Health check success:', healthData);
    }
    if (healthError) {
      console.error('[OptimizedPropOllamaContainer] Health check failed:', healthError);
    }
  }, [healthData, healthError]);

  // Memoized handlers to prevent unnecessary re-renders of child components
  const memoizedHandlers = useMemo(() => ({
    handleFiltersChange: (filters: any) => actions.updateFilters(filters),
    handleSortingChange: (sorting: any) => actions.updateSorting(sorting),
    handleGameSelect: (game: any) => {
      if (game) actions.setSelectedGame(game);
    },
    handleStatsGameSelect: (gameId: number) => {
      const game = state.upcomingGames.find((g: any) => g.game_id === gameId);
      if (game) {
        actions.setSelectedGame({
          game_id: gameId,
          home: game.home,
          away: game.away,
        });
      }
    },
  }), [actions, state.upcomingGames]);

  // Memoized connection health data to prevent unnecessary re-renders
  const connectionHealthData = useMemo(() => ({
    status: state.connectionHealth.isHealthy ? 'healthy' as const : 'error' as const,
    latency: state.connectionHealth.latency,
    lastCheck: new Date(state.connectionHealth.lastChecked),
  }), [state.connectionHealth.isHealthy, state.connectionHealth.latency, state.connectionHealth.lastChecked]);

  // Memoized performance metrics to prevent unnecessary re-renders
  const performanceMetrics = useMemo(() => ({}), []);

  return (
    <EnhancedErrorBoundary>
      <div className='prop-ollama-container text-white'>
        {/* Header Section */}
        <HeaderSection 
          connectionHealth={connectionHealthData}
          performanceMetrics={performanceMetrics}
          healthLoading={healthLoading}
        />

        {/* Control Panel */}
        <ControlPanel 
          state={state}
          handlers={memoizedHandlers}
        />

        {/* Main Content */}
        <MainContent 
          state={state}
          handlers={memoizedHandlers}
        />

        {/* Bet Slip */}
        <BetSlipSection 
          selectedProps={state.selectedProps}
          entryAmount={state.entryAmount}
          onEntryAmountChange={actions.setEntryAmount}
        />

        {/* Loading Overlay */}
        {state.isLoading && (
          <LoadingOverlay 
            stage={state.loadingStage}
            message={state.loadingMessage}
            progress={state.propLoadingProgress}
          />
        )}
      </div>
    </EnhancedErrorBoundary>
  );
});

OptimizedPropOllamaContainer.displayName = 'OptimizedPropOllamaContainer';

// Memoized sub-components to prevent unnecessary re-renders

const HeaderSection = memo<{
  connectionHealth: { status: 'healthy' | 'error'; latency: number; lastCheck: Date };
  performanceMetrics: {};
  healthLoading: boolean;
}>(({ connectionHealth, performanceMetrics, healthLoading }) => (
  <div className='header-section'>
    <h1 className='text-3xl font-bold mb-6 text-center text-white'>
      AI Sports Analytics & Prop Generation
    </h1>

    {/* Performance Monitor */}
    <PerformancePanel
      connectionHealth={connectionHealth}
      performanceMetrics={performanceMetrics}
    />
    
    {healthLoading && (
      <div className='text-center text-cyan-400 text-sm'>
        Checking backend health...
      </div>
    )}
  </div>
));

HeaderSection.displayName = 'HeaderSection';

const ControlPanel = memo<{
  state: any;
  handlers: any;
}>(({ state, handlers }) => (
  <div className='control-panel grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
    {/* Filters */}
    <div className='bg-slate-800/50 p-6 rounded-lg border border-slate-700'>
      <PropFilters
        filters={state.filters}
        onChange={handlers.handleFiltersChange}
        sportActivationStatus={state.sportActivationStatus}
      />
    </div>

    {/* Sorting */}
    <div className='bg-slate-800/50 p-6 rounded-lg border border-slate-700'>
      <PropSorting
        sorting={state.sorting}
        onChange={handlers.handleSortingChange}
      />
    </div>

    {/* Game Stats */}
    <div className='bg-slate-800/50 p-6 rounded-lg border border-slate-700'>
      <GameStatsPanel
        games={state.upcomingGames}
        selectedGame={state.selectedGame}
        onGameSelect={handlers.handleStatsGameSelect}
      />
    </div>
  </div>
));

ControlPanel.displayName = 'ControlPanel';

const MainContent = memo<{
  state: any;
  handlers: any;
}>(({ state, handlers }) => (
  <div className='main-content'>
    {/* Error Display */}
    {state.error && (
      <div className='bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-6'>
        <h3 className='font-semibold mb-2'>Error</h3>
        <p>{state.error}</p>
      </div>
    )}

    {/* Render Error Display */}
    {state.renderError && (
      <div className='bg-yellow-900/50 border border-yellow-500 text-yellow-200 p-4 rounded-lg mb-6'>
        <h3 className='font-semibold mb-2'>Render Error</h3>
        <p>{state.renderError}</p>
      </div>
    )}

    {/* Props List */}
    <div className='bg-slate-800/30 rounded-lg border border-slate-700'>
      <PropList
        projections={state.projections}
        unifiedResponse={state.unifiedResponse}
        filters={state.filters}
        sorting={state.sorting}
        displayOptions={state.displayOptions}
        onPropSelect={handlers.handleGameSelect}
        enhancedAnalysisCache={state.enhancedAnalysisCache}
        loadingAnalysis={state.loadingAnalysis}
        analyzingPropId={state.analyzingPropId}
        selectedProps={state.selectedProps}
        onAddToSlip={handlers.handleGameSelect}
      />
    </div>
  </div>
));

MainContent.displayName = 'MainContent';

const BetSlipSection = memo<{
  selectedProps: any[];
  entryAmount: number;
  onEntryAmountChange: (amount: number) => void;
}>(({ selectedProps, entryAmount, onEntryAmountChange }) => (
  <div className='bet-slip-section mt-8'>
    <BetSlipComponent
      selectedProps={selectedProps}
      entryAmount={entryAmount}
      onEntryAmountChange={onEntryAmountChange}
    />
  </div>
));

BetSlipSection.displayName = 'BetSlipSection';

export default OptimizedPropOllamaContainer;
