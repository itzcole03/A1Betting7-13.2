/**
 * Enhanced Data Validation and Normalization Types
 * Provides comprehensive type safety and data quality assurance
 */

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: ValidationError[];
  warnings: string[];
  qualityScore: number; // 0-100, quality rating of the data
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
  suggestedFix?: string;
}

export interface DataQualityMetrics {
  completeness: number; // % of required fields present
  accuracy: number; // % of fields with valid values
  consistency: number; // % of fields matching expected patterns
  timeliness: number; // how recent/fresh the data is
}

// Enhanced interfaces for sports data
export interface ValidatedSportsProp {
  id: string;
  player: string;
  matchup: string;
  stat: string;
  line: number;
  overOdds: number;
  underOdds: number;
  confidence: number;
  sport: 'MLB' | 'NBA' | 'NFL' | 'NHL' | 'Soccer' | string;
  gameTime: string; // ISO string
  pickType: 'prop' | 'spread' | 'total' | 'moneyline';
  espnPlayerId?: string; // For player headshots

  // Data quality tracking
  dataSource: string;
  validatedAt: string;
  qualityScore: number;

  // Original data preservation
  _originalData?: any;
  _validationMeta?: {
    processingTime: number;
    transformations: string[];
    fallbacksUsed: string[];
  };
}

export interface RawSportsData {
  // Common API fields with various naming conventions
  id?: string;
  event_id?: string;
  player?: string;
  player_name?: string;
  event_name?: string;
  matchup?: string;
  stat?: string;
  stat_type?: string;
  line?: string | number;
  line_score?: string | number;
  overOdds?: string | number;
  over_odds?: string | number;
  underOdds?: string | number;
  under_odds?: string | number;
  value?: string | number;
  confidence?: string | number;
  sport?: string;
  gameTime?: string;
  start_time?: string;
  pickType?: string;

  // Meta fields
  source?: string;
  timestamp?: string | number;
  [key: string]: any; // Allow additional fields
}

export interface DataNormalizationConfig {
  sport: string;
  fieldMappings: Record<string, string[]>; // target field -> possible source fields
  validationRules: ValidationRule[];
  fallbackValues: Partial<ValidatedSportsProp>;
  requiredFields: string[];
  optionalFields: string[];
}

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'pattern';
  required: boolean;
  validator?: (value: any) => boolean;
  normalizer?: (value: any) => any;
  errorMessage?: string;
  enumValues?: string[];
  pattern?: RegExp;
  min?: number;
  max?: number;
}

export interface CacheInvalidationEvent {
  type: 'sport_update' | 'prop_update' | 'game_update' | 'manual' | 'time_based';
  sport?: string;
  gameId?: string;
  propId?: string;
  timestamp: number;
  reason: string;
  affectedKeys: string[];
}

export interface EnhancedRequestMetrics {
  // Basic metrics
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  errors: number;
  avgResponseTime: number;

  // Enhanced metrics
  dataQualityScore: number;
  validationErrors: number;
  fallbacksUsed: number;
  transformationErrors: number;

  // Performance tracking
  slowQueries: Array<{
    endpoint: string;
    duration: number;
    timestamp: number;
  }>;

  // Error categorization
  errorsByType: Record<string, number>;
  errorsByEndpoint: Record<string, number>;

  lastUpdate: number;
}

export interface StructuredLogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  component: string;
  operation: string;
  metadata: {
    endpoint?: string;
    params?: Record<string, any>;
    duration?: number;
    cacheKey?: string;
    sport?: string;
    dataQuality?: number;
    errorsCount?: number;
    fallbacksUsed?: string[];
  };
  message: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

// Export validation constants
export const SPORT_VALUES = ['MLB', 'NBA', 'NFL', 'NHL', 'Soccer'] as const;
export const PICK_TYPE_VALUES = ['prop', 'spread', 'total', 'moneyline'] as const;

export const MIN_CONFIDENCE_SCORE = 0;
export const MAX_CONFIDENCE_SCORE = 100;
export const MIN_QUALITY_SCORE = 0;
export const MAX_QUALITY_SCORE = 100;

export const REQUIRED_PROP_FIELDS = [
  'id',
  'player',
  'matchup',
  'stat',
  'line',
  'confidence',
  'sport',
] as const;

export const OPTIONAL_PROP_FIELDS = [
  'overOdds',
  'underOdds',
  'gameTime',
  'pickType',
  'dataSource',
] as const;
