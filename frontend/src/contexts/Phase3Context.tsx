/**
 * Phase 3 Context Provider
 * Provides unified state management for Phase 3 architecture features
 */

import React, { createContext, useContext, useReducer, useCallback, useMemo, useRef, useEffect, ReactNode } from 'react';
import { unifiedApiService, type HealthData, type AnalyticsData, type PredictionResponse } from '../services/unifiedApiService';
import { useMetricsStore } from '../metrics/metricsStore';

// State interface
interface Phase3State {
  // System status
  health: HealthData | null;
  analytics: AnalyticsData | null;
  
  // Predictions
  predictions: PredictionResponse[];
  
  // Loading states
  loading: {
    health: boolean;
    analytics: boolean;
    predictions: boolean;
    creating_prediction: boolean;
  };
  
  // Error states
  errors: {
    health: string | null;
    analytics: string | null;
    predictions: string | null;
  };
  
  // Configuration
  config: {
    refresh_interval: number;
    auto_refresh: boolean;
  };
  
  // Performance metrics
  performance: {
    last_update: number;
    request_count: number;
    error_count: number;
  };
}

// Action types
type Phase3Action =
  | { type: 'SET_HEALTH'; payload: HealthData }
  | { type: 'SET_ANALYTICS'; payload: AnalyticsData }
  | { type: 'SET_PREDICTIONS'; payload: PredictionResponse[] }
  | { type: 'ADD_PREDICTION'; payload: PredictionResponse }
  | { type: 'SET_LOADING'; payload: { key: keyof Phase3State['loading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: { key: keyof Phase3State['errors']; value: string | null } }
  | { type: 'SET_CONFIG'; payload: Partial<Phase3State['config']> }
  | { type: 'INCREMENT_REQUEST_COUNT' }
  | { type: 'INCREMENT_ERROR_COUNT' }
  | { type: 'UPDATE_LAST_UPDATE' };

// Initial state
const initialState: Phase3State = {
  health: null,
  analytics: null,
  predictions: [],
  loading: {
    health: false,
    analytics: false,
    predictions: false,
    creating_prediction: false,
  },
  errors: {
    health: null,
    analytics: null,
    predictions: null,
  },
  config: {
    refresh_interval: 30000, // 30 seconds
    auto_refresh: true,
  },
  performance: {
    last_update: 0,
    request_count: 0,
    error_count: 0,
  },
};

// Reducer
function phase3Reducer(state: Phase3State, action: Phase3Action): Phase3State {
  switch (action.type) {
    case 'SET_HEALTH':
      return { ...state, health: action.payload };
      
    case 'SET_ANALYTICS':
      return { ...state, analytics: action.payload };
      
    case 'SET_PREDICTIONS':
      return { ...state, predictions: action.payload };
      
    case 'ADD_PREDICTION':
      return { 
        ...state, 
        predictions: [action.payload, ...state.predictions.slice(0, 9)] // Keep last 10
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.payload.key]: action.payload.value }
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.payload.key]: action.payload.value }
      };
      
    case 'SET_CONFIG':
      return {
        ...state,
        config: { ...state.config, ...action.payload }
      };
      
    case 'INCREMENT_REQUEST_COUNT':
      return {
        ...state,
        performance: { ...state.performance, request_count: state.performance.request_count + 1 }
      };
      
    case 'INCREMENT_ERROR_COUNT':
      return {
        ...state,
        performance: { ...state.performance, error_count: state.performance.error_count + 1 }
      };
      
    case 'UPDATE_LAST_UPDATE':
      return {
        ...state,
        performance: { ...state.performance, last_update: Date.now() }
      };
      
    default:
      return state;
  }
}

// Context
const Phase3Context = createContext<{
  state: Phase3State;
  actions: {
    // Data loading actions
    loadHealth: () => Promise<void>;
    loadAnalytics: () => Promise<void>;
    loadPredictions: () => Promise<void>;
    
    // Prediction actions
    createPrediction: (request: any) => Promise<PredictionResponse>;
    
    // Configuration actions
    setRefreshInterval: (interval: number) => void;
    toggleAutoRefresh: () => void;
    
    // Utility actions
    refreshAll: () => Promise<void>;
    clearErrors: () => void;
  };
} | null>(null);

// Provider component
export const Phase3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(phase3Reducer, initialState);
  const { updateFromRaw } = useMetricsStore();

  // Helper function for API calls with error handling
  const apiCall = async <T,>(
    apiFunction: () => Promise<T>,
    loadingKey: keyof Phase3State['loading'],
    errorKey: keyof Phase3State['errors'],
    successAction: (data: T) => Phase3Action
  ) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: loadingKey, value: true } });
      dispatch({ type: 'SET_ERROR', payload: { key: errorKey, value: null } });
      dispatch({ type: 'INCREMENT_REQUEST_COUNT' });

      const data = await apiFunction();
      dispatch(successAction(data));
      dispatch({ type: 'UPDATE_LAST_UPDATE' });
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      dispatch({ type: 'SET_ERROR', payload: { key: errorKey, value: errorMessage } });
      dispatch({ type: 'INCREMENT_ERROR_COUNT' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: loadingKey, value: false } });
    }
  };

  // Actions
  const actions = {
    loadHealth: async () => {
      const healthData = await apiCall(
        () => unifiedApiService.getHealth(),
        'health',
        'health',
        (data) => ({ type: 'SET_HEALTH', payload: data })
      );
      
      // Update metrics store with health data
      if (healthData) {
        updateFromRaw(healthData);
      }
    },

    loadAnalytics: async () => {
      const analyticsData = await apiCall(
        () => unifiedApiService.getAnalytics(),
        'analytics',
        'analytics',
        (data) => ({ type: 'SET_ANALYTICS', payload: data })
      );
      
      // Update metrics store with analytics data
      if (analyticsData) {
        updateFromRaw(analyticsData);
      }
    },

    loadPredictions: async () => {
      await apiCall(
        () => unifiedApiService.getRecentPredictions({ limit: 10 }).then(res => res.predictions || []),
        'predictions',
        'predictions',
        (data) => ({ type: 'SET_PREDICTIONS', payload: data })
      );
    },

    createPrediction: async (request: any): Promise<PredictionResponse> => {
      return await apiCall(
        () => unifiedApiService.createPrediction(request),
        'creating_prediction',
        'predictions',
        (data) => ({ type: 'ADD_PREDICTION', payload: data })
      );
    },

    setRefreshInterval: (interval: number) => {
      dispatch({ type: 'SET_CONFIG', payload: { refresh_interval: interval } });
    },

    toggleAutoRefresh: () => {
      dispatch({ type: 'SET_CONFIG', payload: { auto_refresh: !state.config.auto_refresh } });
    },

    refreshAll: async () => {
      try {
        await Promise.all([
          actions.loadHealth(),
          actions.loadAnalytics(),
          actions.loadPredictions(),
        ]);
      } catch (error) {
        console.error('Failed to refresh all data:', error);
      }
    },

    clearErrors: () => {
      dispatch({ type: 'SET_ERROR', payload: { key: 'health', value: null } });
      dispatch({ type: 'SET_ERROR', payload: { key: 'analytics', value: null } });
      dispatch({ type: 'SET_ERROR', payload: { key: 'predictions', value: null } });
    },
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!state.config.auto_refresh) return;

    // Initial load
    actions.refreshAll();

    // Set up refresh interval
    const interval = setInterval(() => {
      actions.refreshAll();
    }, state.config.refresh_interval);

    return () => clearInterval(interval);
  }, [state.config.auto_refresh, state.config.refresh_interval]);

  return (
    <Phase3Context.Provider value={{ state, actions }}>
      {children}
    </Phase3Context.Provider>
  );
};

// Hook to use the context
export const usePhase3 = () => {
  const context = useContext(Phase3Context);
  if (!context) {
    throw new Error('usePhase3 must be used within a Phase3Provider');
  }
  return context;
};

// Selector hooks for specific data
export const usePhase3Health = () => {
  const { state } = usePhase3();
  return {
    health: state.health,
    loading: state.loading.health,
    error: state.errors.health,
    isHealthy: state.health?.status === 'healthy',
  };
};

export const usePhase3Analytics = () => {
  const { state } = usePhase3();
  return {
    analytics: state.analytics,
    loading: state.loading.analytics,
    error: state.errors.analytics,
  };
};

export const usePhase3Predictions = () => {
  const { state, actions } = usePhase3();
  return {
    predictions: state.predictions,
    loading: state.loading.predictions,
    createLoading: state.loading.creating_prediction,
    error: state.errors.predictions,
    createPrediction: actions.createPrediction,
    refresh: actions.loadPredictions,
  };
};

export const usePhase3Performance = () => {
  const { state } = usePhase3();
  return {
    performance: state.performance,
    consolidationStats: state.health?.consolidation_stats,
    systemMetrics: state.analytics?.system_performance,
    modelMetrics: state.analytics?.model_performance,
    userMetrics: state.analytics?.user_metrics,
  };
};

export const usePhase3Config = () => {
  const { state, actions } = usePhase3();
  return {
    config: state.config,
    setRefreshInterval: actions.setRefreshInterval,
    toggleAutoRefresh: actions.toggleAutoRefresh,
  };
};

export default Phase3Context;
