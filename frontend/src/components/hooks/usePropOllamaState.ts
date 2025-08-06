/**
 * PropOllama State Management Hook
 *
 * Consolidates all state management for the PropOllama components.
 * This reduces the complexity of the main component by extracting
 * state logic into a reusable hook.
 */

import React, { useCallback, useState } from 'react';
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

export interface PropOllamaState {
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

  // Bet slip
  selectedProps: SelectedProp[];
  entryAmount: number;

  // Performance
  initialLoadingComplete: boolean;
  clicksEnabled: boolean;
  propLoadingProgress: number;
  sportActivationStatus: SportActivationStatus;

  // Ensemble
  ensembleLoading: boolean;
  ensembleError: string | null;
  ensembleResult: string | null;
}

export interface PropOllamaActions {
  // Connection
  setConnectionHealth: (health: ConnectionHealth) => void;

  // Data
  setProjections: (projections: FeaturedProp[]) => void;
  setUnifiedResponse: (response: EnhancedBetsResponse | null) => void;
  setUpcomingGames: (games: UpcomingGame[]) => void;
  setSelectedGame: (game: { game_id: number; home: string; away: string } | null) => void;

  // Filters
  updateFilters: (filters: Partial<PropFilters>) => void;
  updateSorting: (sorting: Partial<PropSorting>) => void;
  updateDisplayOptions: (options: Partial<PropDisplayOptions>) => void;

  // Loading and errors
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRenderError: (error: string | null) => void;
  setLoadingStage: (stage: LoadingStage | null) => void;
  setLoadingMessage: (message: string) => void;

  // Analysis
  updateEnhancedAnalysisCache: (propId: string, analysis: EnhancedPropAnalysis) => void;
  setLoadingAnalysis: (loading: Set<string>) => void;
  setAnalyzingPropId: (id: string | null) => void;
  updatePropAnalystResponse: (propId: string, response: string) => void;

  // Bet slip
  setSelectedProps: (props: SelectedProp[]) => void;
  addSelectedProp: (prop: SelectedProp) => void;
  removeSelectedProp: (propId: string) => void;
  setEntryAmount: (amount: number) => void;

  // Performance
  setInitialLoadingComplete: (complete: boolean) => void;
  setClicksEnabled: (enabled: boolean) => void;
  setPropLoadingProgress: (progress: number) => void;
  updateSportActivationStatus: (
    sport: string,
    status: Partial<SportActivationStatus[string]>
  ) => void;

  // Ensemble
  setEnsembleLoading: (loading: boolean) => void;
  setEnsembleError: (error: string | null) => void;
  setEnsembleResult: (result: string | null) => void;
}

export function usePropOllamaState(): [PropOllamaState, PropOllamaActions] {
  // Connection and health
  const [connectionHealth, setConnectionHealth] = useState<ConnectionHealth>({
    isHealthy: false,
    latency: 0,
    lastChecked: 0,
  });

  // Data state
  const [projections, setProjections] = useState<FeaturedProp[]>([]);
  const [unifiedResponse, setUnifiedResponse] = useState<EnhancedBetsResponse | null>(null);
  const [upcomingGames, setUpcomingGames] = useState<UpcomingGame[]>([]);
  const [selectedGame, setSelectedGame] = useState<{
    game_id: number;
    home: string;
    away: string;
  } | null>(null);

  // Filter state
  const [filters, setFilters] = useState<PropFilters>({
    selectedSport: 'MLB',
    propType: 'player',
    selectedStatType: 'Popular',
    selectedDate: '',
    searchTerm: '',
    showUpcomingGames: false,
  });

  // Sorting state
  const [sorting, setSorting] = useState<PropSorting>({
    sortBy: 'confidence',
    sortOrder: 'desc',
  });

  // Display options state
  const [displayOptions, setDisplayOptions] = useState<PropDisplayOptions>({
    visiblePropsCount: 6,
    useVirtualization: false,
    expandedRowKey: null,
  });

  // Loading and error state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<LoadingStage | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  // Analysis state
  const [enhancedAnalysisCache, setEnhancedAnalysisCache] = useState<
    Record<string, EnhancedPropAnalysis>
  >({});
  const [loadingAnalysis, setLoadingAnalysis] = useState<Set<string>>(new Set());
  const [analyzingPropId, setAnalyzingPropId] = useState<string | null>(null);
  const [propAnalystResponses, setPropAnalystResponses] = useState<Record<string, string>>({});

  // Bet slip state
  const [selectedProps, setSelectedProps] = useState<SelectedProp[]>([]);
  const [entryAmount, setEntryAmount] = useState<number>(10);

  // Performance state
  const [initialLoadingComplete, setInitialLoadingComplete] = useState(false);
  const [clicksEnabled, setClicksEnabled] = useState(false);
  const [propLoadingProgress, setPropLoadingProgress] = useState<number>(0);
  const [sportActivationStatus, setSportActivationStatus] = useState<SportActivationStatus>({});

  // Ensemble state
  const [ensembleLoading, setEnsembleLoading] = useState<boolean>(false);
  const [ensembleError, setEnsembleError] = useState<string | null>(null);
  const [ensembleResult, setEnsembleResult] = useState<string | null>(null);

  // Action creators
  const updateFilters = useCallback((newFilters: Partial<PropFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const updateSorting = useCallback((newSorting: Partial<PropSorting>) => {
    setSorting(prev => ({ ...prev, ...newSorting }));
  }, []);

  const updateDisplayOptions = useCallback((newOptions: Partial<PropDisplayOptions>) => {
    setDisplayOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  const updateEnhancedAnalysisCache = useCallback(
    (propId: string, analysis: EnhancedPropAnalysis) => {
      setEnhancedAnalysisCache(prev => ({ ...prev, [propId]: analysis }));
    },
    []
  );

  const updatePropAnalystResponse = useCallback((propId: string, response: string) => {
    setPropAnalystResponses(prev => ({ ...prev, [propId]: response }));
  }, []);

  const addSelectedProp = useCallback((prop: SelectedProp) => {
    setSelectedProps(prev => {
      if (prev.find(p => p.id === prop.id)) {
        return prev; // Already selected
      }
      return [...prev, prop];
    });
  }, []);

  const removeSelectedProp = useCallback((propId: string) => {
    setSelectedProps(prev => prev.filter(p => p.id !== propId));
  }, []);

  const updateSportActivationStatus = useCallback(
    (sport: string, status: Partial<SportActivationStatus[string]>) => {
      setSportActivationStatus(prev => ({
        ...prev,
        [sport]: { ...prev[sport], ...status },
      }));
    },
    []
  );

  // Combine state
  const state: PropOllamaState = {
    connectionHealth,
    projections,
    unifiedResponse,
    upcomingGames,
    selectedGame,
    filters,
    sorting,
    displayOptions,
    isLoading,
    error,
    renderError,
    loadingStage,
    loadingMessage,
    enhancedAnalysisCache,
    loadingAnalysis,
    analyzingPropId,
    propAnalystResponses,
    selectedProps,
    entryAmount,
    initialLoadingComplete,
    clicksEnabled,
    propLoadingProgress,
    sportActivationStatus,
    ensembleLoading,
    ensembleError,
    ensembleResult,
  };

  // Memoize actions to prevent unnecessary re-renders and effect loops
  const actions: PropOllamaActions = React.useMemo(
    () => ({
      setConnectionHealth,
      setProjections,
      setUnifiedResponse,
      setUpcomingGames,
      setSelectedGame,
      updateFilters,
      updateSorting,
      updateDisplayOptions,
      setIsLoading,
      setError,
      setRenderError,
      setLoadingStage,
      setLoadingMessage,
      updateEnhancedAnalysisCache,
      setLoadingAnalysis,
      setAnalyzingPropId,
      updatePropAnalystResponse,
      setSelectedProps,
      addSelectedProp,
      removeSelectedProp,
      setEntryAmount,
      setInitialLoadingComplete,
      setClicksEnabled,
      setPropLoadingProgress,
      updateSportActivationStatus,
      setEnsembleLoading,
      setEnsembleError,
      setEnsembleResult,
    }),
    [
      setConnectionHealth,
      setProjections,
      setUnifiedResponse,
      setUpcomingGames,
      setSelectedGame,
      updateFilters,
      updateSorting,
      updateDisplayOptions,
      setIsLoading,
      setError,
      setRenderError,
      setLoadingStage,
      setLoadingMessage,
      updateEnhancedAnalysisCache,
      setLoadingAnalysis,
      setAnalyzingPropId,
      updatePropAnalystResponse,
      setSelectedProps,
      addSelectedProp,
      removeSelectedProp,
      setEntryAmount,
      setInitialLoadingComplete,
      setClicksEnabled,
      setPropLoadingProgress,
      updateSportActivationStatus,
      setEnsembleLoading,
      setEnsembleError,
      setEnsembleResult,
    ]
  );

  return [state, actions];
}
