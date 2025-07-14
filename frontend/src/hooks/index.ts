// ============================================================================
// UNIVERSAL HOOKS SYSTEM EXPORTS;
// ============================================================================

export {
  // Data hooks;
  usePredictions,
  useEngineMetrics,
  useBettingOpportunities,
  useUserProfile,

  // UI hooks;
  useUniversalTheme,
  useUniversalForm,
  useModal,
  useToast,

  // Utility hooks;
  useDebounce,
  useLocalStorage,
  useWindowSize,
  useMediaQuery,
  useClickOutside,
  useWebSocket,

  // Performance hooks;
  useAnimation,
  //   usePerformanceMonitor
} from './UniversalHooks';

// Default export;
export { default } from './UniversalHooks';

// ============================================================================
// LEGACY COMPATIBILITY EXPORTS (Deprecated - Use Universal equivalents)
// ============================================================================

// Theme hooks;
export { useUniversalTheme as useTheme } from './UniversalHooks';
export { useUniversalTheme as useDarkMode } from './UniversalHooks';

// Form hooks;
export { useUniversalForm as useForm } from './UniversalHooks';

// Analytics hooks (redirect to consolidated system)
export { usePredictions as useAnalytics } from './UniversalHooks';
export { useBettingOpportunities as useBettingCore } from './UniversalHooks';

// Prediction hooks;
export { usePredictions as usePredictionService } from './UniversalHooks';
export { usePredictions as useRealtimePredictions } from './UniversalHooks';

// Ultimate Settings Hook;
export { default as useUltimateSettings } from './useUltimateSettings';

// ============================================================================
// DEPRECATED HOOK NOTICES;
// ============================================================================

/**
 * @deprecated Use useUniversalTheme from UniversalHooks instead;
 */
export const useThemeStore = () => {
  // console statement removed
  return Record<string, any>;
};

/**
 * @deprecated Use consolidated hooks from UniversalHooks instead;
 */
export const useMLAnalytics = () => {
  // console statement removed
  return Record<string, any>;
};
