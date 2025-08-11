// Unified components export
export { default as UnifiedPropCard } from './PropCard';

// Types
export type {
  PropCardVariant,
  UnifiedPropCardProps,
  UnifiedPlayer,
  UnifiedGame,
  UnifiedProp,
  UnifiedAnalysis,
  StatBar,
  Insight
} from './PropCard';

// Migration helpers
export {
  convertToUnifiedFormat,
  extractTeamFromMatchup,
  generateSummary
} from './migration-helpers';
