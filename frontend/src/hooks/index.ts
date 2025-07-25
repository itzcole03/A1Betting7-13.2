// ============================================================================
// UNIVERSAL HOOKS SYSTEM EXPORTS;
// ============================================================================

export {
  // Data hooks;
  // @ts-expect-error TS(2305): Module '"./UniversalHooks"' has no exported member... Remove this comment to see the full error message
  usePredictions,
  // @ts-expect-error TS(2305): Module '"./UniversalHooks"' has no exported member... Remove this comment to see the full error message
  useEngineMetrics,
  // @ts-expect-error TS(2305): Module '"./UniversalHooks"' has no exported member... Remove this comment to see the full error message
  useBettingOpportunities,
  // @ts-expect-error TS(2305): Module '"./UniversalHooks"' has no exported member... Remove this comment to see the full error message
  useUserProfile,

  // UI hooks;
  // @ts-expect-error TS(2305): Module '"./UniversalHooks"' has no exported member... Remove this comment to see the full error message
  useUniversalTheme,
  // @ts-expect-error TS(2305): Module '"./UniversalHooks"' has no exported member... Remove this comment to see the full error message
  useUniversalForm,
  // @ts-expect-error TS(2305): Module '"./UniversalHooks"' has no exported member... Remove this comment to see the full error message
  useModal,
  // @ts-expect-error TS(2305): Module '"./UniversalHooks"' has no exported member... Remove this comment to see the full error message
  useToast,

  // Utility hooks;
  // @ts-expect-error TS(2305): Module '"./UniversalHooks"' has no exported member... Remove this comment to see the full error message
  useDebounce,
  // @ts-expect-error TS(2305): Module '"./UniversalHooks"' has no exported member... Remove this comment to see the full error message
  useLocalStorage,
  // @ts-expect-error TS(2305): Module '"./UniversalHooks"' has no exported member... Remove this comment to see the full error message
  useWindowSize,
  // @ts-expect-error TS(2305): Module '"./UniversalHooks"' has no exported member... Remove this comment to see the full error message
  useMediaQuery,
  // @ts-expect-error TS(2305): Module '"./UniversalHooks"' has no exported member... Remove this comment to see the full error message
  useClickOutside,
  // @ts-expect-error TS(2305): Module '"./UniversalHooks"' has no exported member... Remove this comment to see the full error message
  useWebSocket,

  // Performance hooks;
  // @ts-expect-error TS(2305): Module '"./UniversalHooks"' has no exported member... Remove this comment to see the full error message
  useAnimation,
  //   usePerformanceMonitor
} from './UniversalHooks';

// Default export;
// @ts-expect-error TS(2305): Module '"./UniversalHooks"' has no exported member... Remove this comment to see the full error message
export { default } from './UniversalHooks';

// ============================================================================
// LEGACY COMPATIBILITY EXPORTS (Deprecated - Use Universal equivalents)
// ============================================================================

// Theme hooks;
// @ts-expect-error TS(2305): Module '"./UniversalHooks"' has no exported member... Remove this comment to see the full error message
export { useUniversalTheme as useTheme } from './UniversalHooks';
// @ts-expect-error TS(2305): Module '"./UniversalHooks"' has no exported member... Remove this comment to see the full error message
export { useUniversalTheme as useDarkMode } from './UniversalHooks';

// Form hooks;
// @ts-expect-error TS(2305): Module '"./UniversalHooks"' has no exported member... Remove this comment to see the full error message
export { useUniversalForm as useForm } from './UniversalHooks';

// Analytics hooks (redirect to consolidated system)
// @ts-expect-error TS(2305): Module '"./UniversalHooks"' has no exported member... Remove this comment to see the full error message
export { usePredictions as useAnalytics } from './UniversalHooks';
// @ts-expect-error TS(2305): Module '"./UniversalHooks"' has no exported member... Remove this comment to see the full error message
export { useBettingOpportunities as useBettingCore } from './UniversalHooks';

// Prediction hooks;
// @ts-expect-error TS(2305): Module '"./UniversalHooks"' has no exported member... Remove this comment to see the full error message
export { usePredictions as usePredictionService } from './UniversalHooks';
// @ts-expect-error TS(2305): Module '"./UniversalHooks"' has no exported member... Remove this comment to see the full error message
export { usePredictions as useRealtimePredictions } from './UniversalHooks';

// Ultimate Settings Hook;
// @ts-expect-error TS(2305): Module '"./useUltimateSettings"' has no exported m... Remove this comment to see the full error message
export { default as useUltimateSettings } from './useUltimateSettings';

// ============================================================================
// DEPRECATED HOOK NOTICES;
// ============================================================================

/**
 * @deprecated Use useUniversalTheme from UniversalHooks instead;
 */
export const _useThemeStore = () => {
  // console statement removed
  // @ts-expect-error TS(2693): 'Record' only refers to a type, but is being used ... Remove this comment to see the full error message
  return Record<string, unknown>;
};

/**
 * @deprecated Use consolidated hooks from UniversalHooks instead;
 */
export const _useMLAnalytics = () => {
  // console statement removed
  // @ts-expect-error TS(2693): 'Record' only refers to a type, but is being used ... Remove this comment to see the full error message
  return Record<string, unknown>;
};
