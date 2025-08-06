import React from 'react';
import { BetSlipComponent } from '../betting/BetSlipComponent';
import DirectDataFetchTest from '../debug/DirectDataFetchTest';
import FeaturedPropsServiceTest from '../debug/FeaturedPropsServiceTest';
import SimpleDirectAPITest from '../debug/SimpleDirectAPITest';
import SimplePropOllamaDebugContainer from '../debug/SimplePropOllamaDebugContainer';
import EnhancedErrorBoundary from '../EnhancedErrorBoundary';
import { PropFilters } from '../filters/PropFilters';
import { usePropOllamaData } from '../hooks/usePropOllamaData';
import { usePropOllamaState } from '../hooks/usePropOllamaState';
import { PropList } from '../lists/PropList';
import LoadingOverlay from '../LoadingOverlay';
import { PerformancePanel } from '../performance/PerformancePanel';
import { PropSorting } from '../sorting/PropSorting';
import { GameStatsPanel } from '../stats/GameStatsPanel';

/**
 * Main PropOllama Container - Replaces the monolithic PropOllamaUnified component
 *
 * This is the new modular architecture that breaks down the massive 2427-line component
 * into manageable, reusable pieces with proper separation of concerns.
 */
const PropOllamaContainer: React.FC = () => {
  console.error('[PropOllamaContainer] *** COMPONENT RENDERING - CHECK THIS! ***');

  // Make a test API call to verify the component is actually running
  React.useEffect(() => {
    console.error('[PropOllamaContainer] *** USEEFFECT RUNNING - MAKING TEST CALL ***');
    fetch('/api/health')
      .then(response => response.json())
      .then(data => {
        console.error('[PropOllamaContainer] *** TEST CALL SUCCESS ***', data);
      })
      .catch(error => {
        console.error('[PropOllamaContainer] *** TEST CALL ERROR ***', error);
      });
  }, []);

  const [state, actions] = usePropOllamaState();
  console.error(
    '[PropOllamaContainer] State initialized, selectedSport:',
    state.filters.selectedSport
  );

  // Initialize data fetching hook (RE-ENABLED WITH DEBUG FALLBACK)
  usePropOllamaData({ state, actions });
  console.error('[PropOllamaContainer] Data fetching hook enabled with debug fallback');

  return (
    <EnhancedErrorBoundary>
      <div className='prop-ollama-container text-white'>
        {/* Header Section */}
        <div className='header-section'>
          <h1 className='text-3xl font-bold mb-6 text-center text-white'>
            AI Sports Analytics & Prop Generation
          </h1>

          {/* Performance Monitor */}
          <PerformancePanel
            connectionHealth={{
              status: state.connectionHealth.isHealthy ? 'healthy' : 'error',
              latency: state.connectionHealth.latency,
              lastCheck: new Date(state.connectionHealth.lastChecked),
            }}
            performanceMetrics={{}}
          />
        </div>

        {/* DEBUG: Data Fetch Testing */}
        <div className='debug-section mb-8'>
          {/* Top row - API tests */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6'>
            <DirectDataFetchTest />
            <FeaturedPropsServiceTest />
            <SimpleDirectAPITest />
          </div>

          {/* Bottom row - PropOllama debug */}
          <SimplePropOllamaDebugContainer />
        </div>

        {/* Control Panel */}
        <div className='control-panel grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
          {/* Filters */}
          <div className='filters-section bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg border border-slate-600'>
            <PropFilters
              filters={state.filters}
              onFiltersChange={actions.updateFilters}
              sports={['All', 'NBA', 'NFL', 'NHL', 'MLB']}
              statTypes={['All', 'Points', 'Rebounds', 'Assists', 'Home Runs', 'RBIs', 'Hits']}
              upcomingGames={state.upcomingGames}
              selectedGame={state.selectedGame}
              onGameSelect={game => {
                if (game) {
                  actions.setSelectedGame(game);
                }
              }}
            />
          </div>

          {/* Sorting */}
          <div className='sorting-section bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg border border-slate-600'>
            <PropSorting sorting={state.sorting} onSortingChange={actions.updateSorting} />
          </div>

          {/* Game Stats */}
          <div className='stats-section bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg border border-slate-600'>
            <GameStatsPanel
              selectedGameId={state.selectedGame?.game_id || null}
              onGameSelect={gameId => {
                const game = state.upcomingGames.find(g => g.game_id === gameId);
                if (game) {
                  actions.setSelectedGame({
                    game_id: gameId,
                    home: game.home,
                    away: game.away,
                  });
                }
              }}
              games={state.upcomingGames}
              loading={state.isLoading}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className='main-content grid grid-cols-1 xl:grid-cols-4 gap-6'>
          {/* Props List - Takes 3/4 of space */}
          <div className='props-section xl:col-span-3 bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-600 overflow-hidden'>
            <PropList
              props={state.projections}
              loading={state.isLoading}
              expandedRowKey={state.displayOptions.expandedRowKey}
              onExpandToggle={key => actions.updateDisplayOptions({ expandedRowKey: key })}
              onAnalysisRequest={prop => {
                console.log('Analysis requested for', prop);
              }}
              enhancedAnalysisCache={state.enhancedAnalysisCache}
              loadingAnalysis={Object.fromEntries(
                Array.from(state.loadingAnalysis).map(id => [id, true])
              )}
              sortBy={state.sorting.sortBy}
              searchTerm={state.filters.searchTerm}
              useVirtualization={state.displayOptions.useVirtualization}
              forceVirtualization={false}
            />
          </div>

          {/* Bet Slip - Takes 1/4 of space */}
          <div className='betslip-section xl:col-span-1 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-600 p-6'>
            <BetSlipComponent
              selectedProps={state.selectedProps}
              entryAmount={state.entryAmount}
              onRemoveProp={actions.removeSelectedProp}
              onEntryAmountChange={actions.setEntryAmount}
              onClearSlip={() => actions.setSelectedProps([])}
              onPlaceBet={() => {
                console.log('Placing bet with props:', state.selectedProps);
              }}
            />
          </div>
        </div>

        {/* Loading Overlay */}
        {state.isLoading && (
          <LoadingOverlay
            isVisible={state.isLoading}
            stage={
              state.loadingStage?.stage === 'filtering' || state.loadingStage?.stage === 'sorting'
                ? 'processing'
                : state.loadingStage?.stage === 'rendering' ||
                  state.loadingStage?.stage === 'complete'
                ? 'processing'
                : state.loadingStage?.stage || 'fetching'
            }
            sport={state.filters.selectedSport}
            message={state.loadingMessage}
          />
        )}
      </div>
    </EnhancedErrorBoundary>
  );
};

export default PropOllamaContainer;
