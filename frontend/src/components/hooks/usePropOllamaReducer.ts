/**
 * Optimized PropOllama State Management with useReducer
 *
 * This replaces multiple useState hooks with a single useReducer for better performance
 * and more predictable state updates. Reduces the number of re-renders and provides
 * better state management patterns.
 */

import { useCallback, useMemo, useReducer } from 'react';
import { EnhancedPropAnalysis } from '../../services/EnhancedPropAnalysisService';
import { FeaturedProp } from '../../services/unified/FeaturedPropsService';
import { EnhancedBetsResponse } from '../../types/enhancedBetting';
import {
  ConnectionHealth,
  LoadingStage,
  PropDisplayOptions,
  PropFilters,
  PropSorting,
  SelectedProp,
  SportActivationStatus,
  UpcomingGame,
} from '../shared/PropOllamaTypes';

// Consolidated state interface
export interface PropOllamaReducerState {
  // Connection and health
  connectionHealth: ConnectionHealth;

  // Data
  projections: FeaturedProp[];
  unifiedResponse: EnhancedBetsResponse | null;
  upcomingGames: UpcomingGame[];
  selectedGame: { game_id: number; home: string; away: string } | null;

  // UI State
  filters: PropFilters;
  sorting: PropSorting;
  displayOptions: PropDisplayOptions;

  // Loading and errors
  isLoading: boolean;
  error: string | null;
  renderError: string | null;
  loadingStage: LoadingStage | null;
  loadingMessage: string;

  // Analysis
  enhancedAnalysisCache: Record<string, EnhancedPropAnalysis>;
  loadingAnalysis: Set<string>;
  analyzingPropId: string | null;
  propAnalystResponses: Record<string, string>;

  // Performance
  initialLoadingComplete: boolean;
  clicksEnabled: boolean;
  propLoadingProgress: number;
  sportActivationStatus: SportActivationStatus;

  // Betting
  selectedProps: SelectedProp[];
  entryAmount: number;
  betSlipVisible: boolean;

  // Stats and advanced features
  currentUserStats: any;
  autoRefreshEnabled: boolean;
  lastRefreshTime: number;

  // Ensemble
  ensembleLoading: boolean;
  ensembleError: string | null;
  ensembleResult: string | null;
}

// Action types for the reducer
export type PropOllamaAction =
  | { type: 'SET_CONNECTION_HEALTH'; payload: ConnectionHealth }
  | { type: 'SET_PROJECTIONS'; payload: FeaturedProp[] }
  | { type: 'SET_UNIFIED_RESPONSE'; payload: EnhancedBetsResponse | null }
  | { type: 'SET_UPCOMING_GAMES'; payload: UpcomingGame[] }
  | { type: 'SET_SELECTED_GAME'; payload: { game_id: number; home: string; away: string } | null }
  | { type: 'UPDATE_FILTERS'; payload: Partial<PropFilters> }
  | { type: 'UPDATE_SORTING'; payload: Partial<PropSorting> }
  | { type: 'UPDATE_DISPLAY_OPTIONS'; payload: Partial<PropDisplayOptions> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RENDER_ERROR'; payload: string | null }
  | { type: 'SET_LOADING_STAGE'; payload: LoadingStage | null }
  | { type: 'SET_LOADING_MESSAGE'; payload: string }
  | { type: 'SET_ENHANCED_ANALYSIS_CACHE'; payload: Record<string, EnhancedPropAnalysis> }
  | { type: 'ADD_TO_ANALYSIS_CACHE'; payload: { id: string; analysis: EnhancedPropAnalysis } }
  | { type: 'SET_LOADING_ANALYSIS'; payload: Set<string> }
  | { type: 'ADD_LOADING_ANALYSIS'; payload: string }
  | { type: 'REMOVE_LOADING_ANALYSIS'; payload: string }
  | { type: 'SET_ANALYZING_PROP_ID'; payload: string | null }
  | { type: 'SET_PROP_ANALYST_RESPONSES'; payload: Record<string, string> }
  | { type: 'ADD_PROP_ANALYST_RESPONSE'; payload: { id: string; response: string } }
  | { type: 'SET_INITIAL_LOADING_COMPLETE'; payload: boolean }
  | { type: 'SET_CLICKS_ENABLED'; payload: boolean }
  | { type: 'SET_PROP_LOADING_PROGRESS'; payload: number }
  | {
      type: 'UPDATE_SPORT_ACTIVATION_STATUS';
      payload: { sport: string; status: Partial<SportActivationStatus[string]> };
    }
  | { type: 'SET_SELECTED_PROPS'; payload: SelectedProp[] }
  | { type: 'ADD_SELECTED_PROP'; payload: SelectedProp }
  | { type: 'REMOVE_SELECTED_PROP'; payload: string }
  | { type: 'SET_ENTRY_AMOUNT'; payload: number }
  | { type: 'SET_BET_SLIP_VISIBLE'; payload: boolean }
  | { type: 'SET_CURRENT_USER_STATS'; payload: any }
  | { type: 'SET_AUTO_REFRESH_ENABLED'; payload: boolean }
  | { type: 'SET_LAST_REFRESH_TIME'; payload: number }
  | { type: 'SET_ENSEMBLE_LOADING'; payload: boolean }
  | { type: 'SET_ENSEMBLE_ERROR'; payload: string | null }
  | { type: 'SET_ENSEMBLE_RESULT'; payload: string | null }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: PropOllamaReducerState = {
  connectionHealth: {
    isHealthy: false,
    latency: 0,
    lastChecked: 0,
  },
  projections: [],
  unifiedResponse: null,
  upcomingGames: [],
  selectedGame: null,
  filters: {
    selectedSport: 'MLB',
    propType: 'player',
    selectedStatType: 'Popular',
    selectedDate: '',
    searchTerm: '',
    showUpcomingGames: false,
  },
  sorting: {
    sortBy: 'confidence',
    sortOrder: 'desc',
  },
  displayOptions: {
    expandedRowKey: null,
    useVirtualization: false,
    visiblePropsCount: 6,
  },
  isLoading: false,
  error: null,
  renderError: null,
  loadingStage: null,
  loadingMessage: '',
  enhancedAnalysisCache: {},
  loadingAnalysis: new Set(),
  analyzingPropId: null,
  propAnalystResponses: {},
  initialLoadingComplete: false,
  clicksEnabled: false,
  propLoadingProgress: 0,
  sportActivationStatus: {},
  selectedProps: [],
  entryAmount: 10,
  betSlipVisible: true,
  currentUserStats: null,
  autoRefreshEnabled: false,
  lastRefreshTime: 0,
  ensembleLoading: false,
  ensembleError: null,
  ensembleResult: null,
};

// Optimized reducer function
function propOllamaReducer(
  state: PropOllamaReducerState,
  action: PropOllamaAction
): PropOllamaReducerState {
  switch (action.type) {
    case 'SET_CONNECTION_HEALTH':
      return { ...state, connectionHealth: action.payload };

    case 'SET_PROJECTIONS':
      return { ...state, projections: action.payload };

    case 'SET_UNIFIED_RESPONSE':
      return { ...state, unifiedResponse: action.payload };

    case 'SET_UPCOMING_GAMES':
      return { ...state, upcomingGames: action.payload };

    case 'SET_SELECTED_GAME':
      return { ...state, selectedGame: action.payload };

    case 'UPDATE_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    case 'UPDATE_SORTING':
      return {
        ...state,
        sorting: { ...state.sorting, ...action.payload },
      };

    case 'UPDATE_DISPLAY_OPTIONS':
      return {
        ...state,
        displayOptions: { ...state.displayOptions, ...action.payload },
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_RENDER_ERROR':
      return { ...state, renderError: action.payload };

    case 'SET_LOADING_STAGE':
      return { ...state, loadingStage: action.payload };

    case 'SET_LOADING_MESSAGE':
      return { ...state, loadingMessage: action.payload };

    case 'SET_ENHANCED_ANALYSIS_CACHE':
      return { ...state, enhancedAnalysisCache: action.payload };

    case 'ADD_TO_ANALYSIS_CACHE':
      return {
        ...state,
        enhancedAnalysisCache: {
          ...state.enhancedAnalysisCache,
          [action.payload.id]: action.payload.analysis,
        },
      };

    case 'SET_LOADING_ANALYSIS':
      return { ...state, loadingAnalysis: action.payload };

    case 'ADD_LOADING_ANALYSIS':
      return {
        ...state,
        loadingAnalysis: new Set([...state.loadingAnalysis, action.payload]),
      };

    case 'REMOVE_LOADING_ANALYSIS':
      const newLoadingAnalysis = new Set(state.loadingAnalysis);
      newLoadingAnalysis.delete(action.payload);
      return { ...state, loadingAnalysis: newLoadingAnalysis };

    case 'SET_ANALYZING_PROP_ID':
      return { ...state, analyzingPropId: action.payload };

    case 'SET_PROP_ANALYST_RESPONSES':
      return { ...state, propAnalystResponses: action.payload };

    case 'ADD_PROP_ANALYST_RESPONSE':
      return {
        ...state,
        propAnalystResponses: {
          ...state.propAnalystResponses,
          [action.payload.id]: action.payload.response,
        },
      };

    case 'SET_INITIAL_LOADING_COMPLETE':
      return { ...state, initialLoadingComplete: action.payload };

    case 'SET_CLICKS_ENABLED':
      return { ...state, clicksEnabled: action.payload };

    case 'SET_PROP_LOADING_PROGRESS':
      return { ...state, propLoadingProgress: action.payload };

    case 'UPDATE_SPORT_ACTIVATION_STATUS':
      return {
        ...state,
        sportActivationStatus: {
          ...state.sportActivationStatus,
          [action.payload.sport]: {
            ...state.sportActivationStatus[action.payload.sport],
            ...action.payload.status,
          },
        },
      };

    case 'SET_SELECTED_PROPS':
      return { ...state, selectedProps: action.payload };

    case 'ADD_SELECTED_PROP':
      return {
        ...state,
        selectedProps: [...state.selectedProps, action.payload],
      };

    case 'REMOVE_SELECTED_PROP':
      return {
        ...state,
        selectedProps: state.selectedProps.filter(prop => prop.id !== action.payload),
      };

    case 'SET_ENTRY_AMOUNT':
      return { ...state, entryAmount: action.payload };

    case 'SET_BET_SLIP_VISIBLE':
      return { ...state, betSlipVisible: action.payload };

    case 'SET_CURRENT_USER_STATS':
      return { ...state, currentUserStats: action.payload };

    case 'SET_AUTO_REFRESH_ENABLED':
      return { ...state, autoRefreshEnabled: action.payload };

    case 'SET_LAST_REFRESH_TIME':
      return { ...state, lastRefreshTime: action.payload };

    case 'SET_ENSEMBLE_LOADING':
      return { ...state, ensembleLoading: action.payload };

    case 'SET_ENSEMBLE_ERROR':
      return { ...state, ensembleError: action.payload };

    case 'SET_ENSEMBLE_RESULT':
      return { ...state, ensembleResult: action.payload };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// Memoized actions interface
export interface PropOllamaReducerActions {
  setConnectionHealth: (health: ConnectionHealth) => void;
  setProjections: (projections: FeaturedProp[]) => void;
  setUnifiedResponse: (response: EnhancedBetsResponse | null) => void;
  setUpcomingGames: (games: UpcomingGame[]) => void;
  setSelectedGame: (game: { game_id: number; home: string; away: string } | null) => void;
  updateFilters: (filters: Partial<PropFilters>) => void;
  updateSorting: (sorting: Partial<PropSorting>) => void;
  updateDisplayOptions: (options: Partial<PropDisplayOptions>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRenderError: (error: string | null) => void;
  setLoadingStage: (stage: LoadingStage | null) => void;
  setLoadingMessage: (message: string) => void;
  setEnhancedAnalysisCache: (cache: Record<string, EnhancedPropAnalysis>) => void;
  addToAnalysisCache: (id: string, analysis: EnhancedPropAnalysis) => void;
  setLoadingAnalysis: (loading: Set<string>) => void;
  addLoadingAnalysis: (id: string) => void;
  removeLoadingAnalysis: (id: string) => void;
  setAnalyzingPropId: (id: string | null) => void;
  setPropAnalystResponses: (responses: Record<string, string>) => void;
  addPropAnalystResponse: (id: string, response: string) => void;
  setInitialLoadingComplete: (complete: boolean) => void;
  setClicksEnabled: (enabled: boolean) => void;
  setPropLoadingProgress: (progress: number) => void;
  updateSportActivationStatus: (
    sport: string,
    status: Partial<SportActivationStatus[string]>
  ) => void;
  setSelectedProps: (props: SelectedProp[]) => void;
  addSelectedProp: (prop: SelectedProp) => void;
  removeSelectedProp: (id: string) => void;
  setEntryAmount: (amount: number) => void;
  setBetSlipVisible: (visible: boolean) => void;
  setCurrentUserStats: (stats: any) => void;
  setAutoRefreshEnabled: (enabled: boolean) => void;
  setLastRefreshTime: (time: number) => void;
  setEnsembleLoading: (loading: boolean) => void;
  setEnsembleError: (error: string | null) => void;
  setEnsembleResult: (result: string | null) => void;
  resetState: () => void;
}

/**
 * Optimized PropOllama state management hook using useReducer
 *
 * Benefits:
 * - Single state object reduces re-renders
 * - Memoized actions prevent unnecessary function recreation
 * - Better performance for complex state updates
 * - More predictable state transitions
 */
export function usePropOllamaReducer(): [PropOllamaReducerState, PropOllamaReducerActions] {
  const [state, dispatch] = useReducer(propOllamaReducer, initialState);

  // Memoized actions to prevent unnecessary re-renders
  const actions = useMemo(
    (): PropOllamaReducerActions => ({
      setConnectionHealth: useCallback(
        (health: ConnectionHealth) => dispatch({ type: 'SET_CONNECTION_HEALTH', payload: health }),
        []
      ),

      setProjections: useCallback(
        (projections: FeaturedProp[]) =>
          dispatch({ type: 'SET_PROJECTIONS', payload: projections }),
        []
      ),

      setUnifiedResponse: useCallback(
        (response: EnhancedBetsResponse | null) =>
          dispatch({ type: 'SET_UNIFIED_RESPONSE', payload: response }),
        []
      ),

      setUpcomingGames: useCallback(
        (games: UpcomingGame[]) => dispatch({ type: 'SET_UPCOMING_GAMES', payload: games }),
        []
      ),

      setSelectedGame: useCallback(
        (game: { game_id: number; home: string; away: string } | null) =>
          dispatch({ type: 'SET_SELECTED_GAME', payload: game }),
        []
      ),

      updateFilters: useCallback(
        (filters: Partial<PropFilters>) => dispatch({ type: 'UPDATE_FILTERS', payload: filters }),
        []
      ),

      updateSorting: useCallback(
        (sorting: Partial<PropSorting>) => dispatch({ type: 'UPDATE_SORTING', payload: sorting }),
        []
      ),

      updateDisplayOptions: useCallback(
        (options: Partial<PropDisplayOptions>) =>
          dispatch({ type: 'UPDATE_DISPLAY_OPTIONS', payload: options }),
        []
      ),

      setLoading: useCallback(
        (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
        []
      ),

      setError: useCallback(
        (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
        []
      ),

      setRenderError: useCallback(
        (error: string | null) => dispatch({ type: 'SET_RENDER_ERROR', payload: error }),
        []
      ),

      setLoadingStage: useCallback(
        (stage: LoadingStage | null) => dispatch({ type: 'SET_LOADING_STAGE', payload: stage }),
        []
      ),

      setLoadingMessage: useCallback(
        (message: string) => dispatch({ type: 'SET_LOADING_MESSAGE', payload: message }),
        []
      ),

      setEnhancedAnalysisCache: useCallback(
        (cache: Record<string, EnhancedPropAnalysis>) =>
          dispatch({ type: 'SET_ENHANCED_ANALYSIS_CACHE', payload: cache }),
        []
      ),

      addToAnalysisCache: useCallback(
        (id: string, analysis: EnhancedPropAnalysis) =>
          dispatch({ type: 'ADD_TO_ANALYSIS_CACHE', payload: { id, analysis } }),
        []
      ),

      setLoadingAnalysis: useCallback(
        (loading: Set<string>) => dispatch({ type: 'SET_LOADING_ANALYSIS', payload: loading }),
        []
      ),

      addLoadingAnalysis: useCallback(
        (id: string) => dispatch({ type: 'ADD_LOADING_ANALYSIS', payload: id }),
        []
      ),

      removeLoadingAnalysis: useCallback(
        (id: string) => dispatch({ type: 'REMOVE_LOADING_ANALYSIS', payload: id }),
        []
      ),

      setAnalyzingPropId: useCallback(
        (id: string | null) => dispatch({ type: 'SET_ANALYZING_PROP_ID', payload: id }),
        []
      ),

      setPropAnalystResponses: useCallback(
        (responses: Record<string, string>) =>
          dispatch({ type: 'SET_PROP_ANALYST_RESPONSES', payload: responses }),
        []
      ),

      addPropAnalystResponse: useCallback(
        (id: string, response: string) =>
          dispatch({ type: 'ADD_PROP_ANALYST_RESPONSE', payload: { id, response } }),
        []
      ),

      setInitialLoadingComplete: useCallback(
        (complete: boolean) =>
          dispatch({ type: 'SET_INITIAL_LOADING_COMPLETE', payload: complete }),
        []
      ),

      setClicksEnabled: useCallback(
        (enabled: boolean) => dispatch({ type: 'SET_CLICKS_ENABLED', payload: enabled }),
        []
      ),

      setPropLoadingProgress: useCallback(
        (progress: number) => dispatch({ type: 'SET_PROP_LOADING_PROGRESS', payload: progress }),
        []
      ),

      updateSportActivationStatus: useCallback(
        (sport: string, status: Partial<SportActivationStatus[string]>) =>
          dispatch({ type: 'UPDATE_SPORT_ACTIVATION_STATUS', payload: { sport, status } }),
        []
      ),

      setSelectedProps: useCallback(
        (props: SelectedProp[]) => dispatch({ type: 'SET_SELECTED_PROPS', payload: props }),
        []
      ),

      addSelectedProp: useCallback(
        (prop: SelectedProp) => dispatch({ type: 'ADD_SELECTED_PROP', payload: prop }),
        []
      ),

      removeSelectedProp: useCallback(
        (id: string) => dispatch({ type: 'REMOVE_SELECTED_PROP', payload: id }),
        []
      ),

      setEntryAmount: useCallback(
        (amount: number) => dispatch({ type: 'SET_ENTRY_AMOUNT', payload: amount }),
        []
      ),

      setBetSlipVisible: useCallback(
        (visible: boolean) => dispatch({ type: 'SET_BET_SLIP_VISIBLE', payload: visible }),
        []
      ),

      setCurrentUserStats: useCallback(
        (stats: any) => dispatch({ type: 'SET_CURRENT_USER_STATS', payload: stats }),
        []
      ),

      setAutoRefreshEnabled: useCallback(
        (enabled: boolean) => dispatch({ type: 'SET_AUTO_REFRESH_ENABLED', payload: enabled }),
        []
      ),

      setLastRefreshTime: useCallback(
        (time: number) => dispatch({ type: 'SET_LAST_REFRESH_TIME', payload: time }),
        []
      ),

      setEnsembleLoading: useCallback(
        (loading: boolean) => dispatch({ type: 'SET_ENSEMBLE_LOADING', payload: loading }),
        []
      ),

      setEnsembleError: useCallback(
        (error: string | null) => dispatch({ type: 'SET_ENSEMBLE_ERROR', payload: error }),
        []
      ),

      setEnsembleResult: useCallback(
        (result: string | null) => dispatch({ type: 'SET_ENSEMBLE_RESULT', payload: result }),
        []
      ),

      resetState: useCallback(() => dispatch({ type: 'RESET_STATE' }), []),
    }),
    []
  );

  return [state, actions];
}
