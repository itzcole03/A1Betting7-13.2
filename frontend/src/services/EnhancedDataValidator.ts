/**
 * Enhanced Data Validation Service
 * Provides comprehensive data validation, normalization, and quality assessment
 */

import {
  DataNormalizationConfig,
  DataQualityMetrics,
  MAX_CONFIDENCE_SCORE,
  MIN_CONFIDENCE_SCORE,
  PICK_TYPE_VALUES,
  RawSportsData,
  REQUIRED_PROP_FIELDS,
  SPORT_VALUES,
  StructuredLogEntry,
  ValidatedSportsProp,
  ValidationError,
  ValidationResult,
} from '../types/DataValidation';

export class EnhancedDataValidator {
  private logger: (entry: StructuredLogEntry) => void;
  private normalizationConfigs: Map<string, DataNormalizationConfig> = new Map();

  constructor(logger?: (entry: StructuredLogEntry) => void) {
    this.logger = logger || console.log;
    this.initializeNormalizationConfigs();
  }

  /**
   * Validate and normalize raw sports data
   */
  validateSportsProp(
    rawData: RawSportsData,
    sport?: string,
    context: { source?: string; timestamp?: number } = {}
  ): ValidationResult<ValidatedSportsProp> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    const transformations: string[] = [];
    const fallbacksUsed: string[] = [];

    try {
      // Get normalization config for the sport
      const config = this.getNormalizationConfig(sport || rawData.sport || 'Unknown');

      // Start with empty validated data
      const validatedData: Partial<ValidatedSportsProp> = {};

      // Normalize and validate each field
      this.validateAndNormalizeField(
        'id',
        rawData,
        validatedData,
        config,
        errors,
        transformations,
        fallbacksUsed
      );
      this.validateAndNormalizeField(
        'player',
        rawData,
        validatedData,
        config,
        errors,
        transformations,
        fallbacksUsed
      );
      this.validateAndNormalizeField(
        'matchup',
        rawData,
        validatedData,
        config,
        errors,
        transformations,
        fallbacksUsed
      );
      this.validateAndNormalizeField(
        'stat',
        rawData,
        validatedData,
        config,
        errors,
        transformations,
        fallbacksUsed
      );
      this.validateAndNormalizeField(
        'line',
        rawData,
        validatedData,
        config,
        errors,
        transformations,
        fallbacksUsed
      );
      this.validateAndNormalizeField(
        'overOdds',
        rawData,
        validatedData,
        config,
        errors,
        transformations,
        fallbacksUsed
      );
      this.validateAndNormalizeField(
        'underOdds',
        rawData,
        validatedData,
        config,
        errors,
        transformations,
        fallbacksUsed
      );
      this.validateAndNormalizeField(
        'confidence',
        rawData,
        validatedData,
        config,
        errors,
        transformations,
        fallbacksUsed
      );
      this.validateAndNormalizeField(
        'sport',
        rawData,
        validatedData,
        config,
        errors,
        transformations,
        fallbacksUsed
      );
      this.validateAndNormalizeField(
        'gameTime',
        rawData,
        validatedData,
        config,
        errors,
        transformations,
        fallbacksUsed
      );
      this.validateAndNormalizeField(
        'pickType',
        rawData,
        validatedData,
        config,
        errors,
        transformations,
        fallbacksUsed
      );

      // Add metadata
      validatedData.dataSource = context.source || 'unknown';
      validatedData.validatedAt = new Date().toISOString();
      validatedData._originalData = rawData;
      validatedData._validationMeta = {
        processingTime: Date.now() - startTime,
        transformations,
        fallbacksUsed,
      };

      // Calculate quality score
      const qualityMetrics = this.calculateDataQuality(
        validatedData as ValidatedSportsProp,
        rawData,
        errors
      );
      validatedData.qualityScore = this.calculateOverallQualityScore(qualityMetrics);

      // Check if validation passed
      const criticalErrors = errors.filter(e => e.severity === 'error');
      const isValid = criticalErrors.length === 0 && this.hasRequiredFields(validatedData);

      // Add warnings for data quality issues
      if (qualityMetrics.completeness < 80) {
        warnings.push(`Low data completeness: ${qualityMetrics.completeness.toFixed(1)}%`);
      }
      if (qualityMetrics.accuracy < 90) {
        warnings.push(`Low data accuracy: ${qualityMetrics.accuracy.toFixed(1)}%`);
      }

      // Log validation result
      this.logValidationResult(isValid, errors, warnings, validatedData, startTime);

      return {
        isValid,
        data: isValid ? (validatedData as ValidatedSportsProp) : undefined,
        errors,
        warnings,
        qualityScore: validatedData.qualityScore || 0,
      };
    } catch (error) {
      const validationError: ValidationError = {
        field: 'validation',
        message: `Validation process failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        code: 'VALIDATION_SYSTEM_ERROR',
        severity: 'error',
        suggestedFix: 'Check data format and validation configuration',
      };

      this.logger({
        timestamp: new Date().toISOString(),
        level: 'error',
        component: 'DataValidator',
        operation: 'validateSportsProp',
        metadata: {
          sport: sport || rawData.sport,
          duration: Date.now() - startTime,
          errorsCount: 1,
        },
        message: 'Validation system error',
        error: {
          name: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      });

      return {
        isValid: false,
        errors: [validationError],
        warnings: [],
        qualityScore: 0,
      };
    }
  }

  /**
   * Validate multiple props in batch with performance optimization
   */
  validateBatch(
    rawDataArray: RawSportsData[],
    sport?: string,
    context: { source?: string; timestamp?: number } = {}
  ): ValidationResult<ValidatedSportsProp[]> {
    const startTime = Date.now();
    const validatedProps: ValidatedSportsProp[] = [];
    const allErrors: ValidationError[] = [];
    const allWarnings: string[] = [];
    let totalQualityScore = 0;

    for (let i = 0; i < rawDataArray.length; i++) {
      const result = this.validateSportsProp(rawDataArray[i], sport, {
        ...context,
        source: `${context.source || 'batch'}[${i}]`,
      });

      if (result.isValid && result.data) {
        validatedProps.push(result.data);
        totalQualityScore += result.qualityScore;
      }

      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    const avgQualityScore =
      validatedProps.length > 0 ? totalQualityScore / validatedProps.length : 0;
    const isValid =
      validatedProps.length > 0 && allErrors.filter(e => e.severity === 'error').length === 0;

    this.logger({
      timestamp: new Date().toISOString(),
      level: 'info',
      component: 'DataValidator',
      operation: 'validateBatch',
      metadata: {
        sport,
        duration: Date.now() - startTime,
        dataQuality: avgQualityScore,
        errorsCount: allErrors.length,
      },
      message: `Batch validation completed: ${validatedProps.length}/${rawDataArray.length} props validated`,
    });

    return {
      isValid,
      data: isValid ? validatedProps : undefined,
      errors: allErrors,
      warnings: allWarnings,
      qualityScore: avgQualityScore,
    };
  }

  private validateAndNormalizeField(
    fieldName: keyof ValidatedSportsProp,
    rawData: RawSportsData,
    validatedData: Partial<ValidatedSportsProp>,
    config: DataNormalizationConfig,
    errors: ValidationError[],
    transformations: string[],
    fallbacksUsed: string[]
  ): void {
    const mappings = config.fieldMappings[fieldName] || [fieldName];
    let rawValue: any = undefined;
    let sourceField: string | undefined;

    // Find the first available value from mapped fields
    for (const mapping of mappings) {
      if (rawData[mapping] !== undefined && rawData[mapping] !== null && rawData[mapping] !== '') {
        rawValue = rawData[mapping];
        sourceField = mapping;
        break;
      }
    }

    // Apply field-specific validation and normalization
    try {
      switch (fieldName) {
        case 'id':
          validatedData.id = this.normalizeId(rawValue, rawData, fallbacksUsed);
          break;
        case 'player':
          validatedData.player = this.normalizePlayer(rawValue, rawData, fallbacksUsed);
          break;
        case 'matchup':
          validatedData.matchup = this.normalizeMatchup(rawValue, rawData, fallbacksUsed);
          break;
        case 'stat':
          validatedData.stat = this.normalizeStat(rawValue, fallbacksUsed);
          break;
        case 'line':
          validatedData.line = this.normalizeLine(rawValue, errors, fieldName);
          break;
        case 'overOdds':
        case 'underOdds':
          (validatedData as any)[fieldName] = this.normalizeOdds(rawValue, errors, fieldName);
          break;
        case 'confidence':
          validatedData.confidence = this.normalizeConfidence(rawValue, errors, fieldName);
          break;
        case 'sport':
          validatedData.sport = this.normalizeSport(rawValue, config.sport, errors, fallbacksUsed);
          break;
        case 'gameTime':
          validatedData.gameTime = this.normalizeGameTime(rawValue, fallbacksUsed);
          break;
        case 'pickType':
          validatedData.pickType = this.normalizePickType(rawValue, fallbacksUsed);
          break;
      }

      // Track transformation if source field was different
      if (sourceField && sourceField !== fieldName) {
        transformations.push(`${fieldName}:${sourceField}`);
      }
    } catch (error) {
      errors.push({
        field: fieldName,
        message: `Failed to normalize field: ${
          error instanceof Error ? error.message : String(error)
        }`,
        code: 'NORMALIZATION_ERROR',
        severity: 'error',
        suggestedFix: `Check the source data format for field ${fieldName}`,
      });
    }
  }

  private normalizeId(value: any, rawData: RawSportsData, fallbacksUsed: string[]): string {
    if (value && typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    // Generate fallback ID
    const fallbackId = `${rawData.player_name || rawData.player || 'unknown'}-${
      rawData.stat_type || rawData.stat || 'unknown'
    }-${Date.now()}`;
    fallbacksUsed.push('id:generated');
    return fallbackId;
  }

  private normalizePlayer(value: any, rawData: RawSportsData, fallbacksUsed: string[]): string {
    if (value && typeof value === 'string' && value.trim()) {
      const normalized = value.trim();
      // Don't allow "Over" or "Under" as player names
      if (normalized.toLowerCase() === 'over' || normalized.toLowerCase() === 'under') {
        const fallback = rawData.event_name || 'Unknown Team';
        fallbacksUsed.push('player:event_name');
        return fallback;
      }
      return normalized;
    }

    const fallback = rawData.event_name || 'Unknown';
    fallbacksUsed.push('player:event_name');
    return fallback;
  }

  private normalizeMatchup(value: any, rawData: RawSportsData, fallbacksUsed: string[]): string {
    if (value && typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    const fallback = rawData.event_name || 'Unknown vs Unknown';
    fallbacksUsed.push('matchup:event_name');
    return fallback;
  }

  private normalizeStat(value: any, fallbacksUsed: string[]): string {
    if (value && typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    fallbacksUsed.push('stat:unknown');
    return 'Unknown';
  }

  private normalizeLine(value: any, errors: ValidationError[], fieldName: string): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    const numValue = typeof value === 'number' ? value : parseFloat(String(value));

    if (isNaN(numValue)) {
      errors.push({
        field: fieldName,
        message: `Invalid line value: ${value}`,
        code: 'INVALID_NUMBER',
        severity: 'warning',
        suggestedFix: 'Provide a valid numeric line value',
      });
      return 0;
    }

    return numValue;
  }

  private normalizeOdds(value: any, errors: ValidationError[], fieldName: string): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    const numValue = typeof value === 'number' ? value : parseFloat(String(value));

    if (isNaN(numValue)) {
      errors.push({
        field: fieldName,
        message: `Invalid odds value: ${value}`,
        code: 'INVALID_ODDS',
        severity: 'warning',
        suggestedFix: 'Provide a valid numeric odds value',
      });
      return 0;
    }

    return numValue;
  }

  private normalizeConfidence(value: any, errors: ValidationError[], fieldName: string): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    const numValue = typeof value === 'number' ? value : parseFloat(String(value));

    if (isNaN(numValue)) {
      errors.push({
        field: fieldName,
        message: `Invalid confidence value: ${value}`,
        code: 'INVALID_CONFIDENCE',
        severity: 'error',
        suggestedFix: 'Provide a valid numeric confidence value between 0-100',
      });
      return 0;
    }

    if (numValue < MIN_CONFIDENCE_SCORE || numValue > MAX_CONFIDENCE_SCORE) {
      errors.push({
        field: fieldName,
        message: `Confidence value out of range: ${numValue} (expected 0-100)`,
        code: 'CONFIDENCE_OUT_OF_RANGE',
        severity: 'warning',
        suggestedFix: `Provide a confidence value between ${MIN_CONFIDENCE_SCORE}-${MAX_CONFIDENCE_SCORE}`,
      });
      return Math.max(MIN_CONFIDENCE_SCORE, Math.min(MAX_CONFIDENCE_SCORE, numValue));
    }

    return numValue;
  }

  private normalizeSport(
    value: any,
    configSport: string,
    errors: ValidationError[],
    fallbacksUsed: string[]
  ): string {
    if (value && typeof value === 'string' && value.trim()) {
      const normalized = value.trim().toUpperCase();
      if (SPORT_VALUES.includes(normalized as any)) {
        return normalized;
      }
    }

    // Use config sport as fallback
    if (configSport && configSport !== 'Unknown') {
      fallbacksUsed.push('sport:config');
      return configSport;
    }

    errors.push({
      field: 'sport',
      message: `Invalid or missing sport value: ${value}`,
      code: 'INVALID_SPORT',
      severity: 'error',
      suggestedFix: `Provide a valid sport value: ${SPORT_VALUES.join(', ')}`,
    });

    fallbacksUsed.push('sport:unknown');
    return 'Unknown';
  }

  private normalizeGameTime(value: any, fallbacksUsed: string[]): string {
    if (value && typeof value === 'string' && value.trim()) {
      try {
        // Try to parse as ISO string
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch (error) {
        // Fall through to fallback
      }
    }

    if (typeof value === 'number') {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch (error) {
        // Fall through to fallback
      }
    }

    fallbacksUsed.push('gameTime:current');
    return new Date().toISOString();
  }

  private normalizePickType(
    value: any,
    fallbacksUsed: string[]
  ): 'prop' | 'spread' | 'total' | 'moneyline' {
    if (value && typeof value === 'string' && value.trim()) {
      const normalized = value.trim().toLowerCase() as 'prop' | 'spread' | 'total' | 'moneyline';
      if (PICK_TYPE_VALUES.includes(normalized)) {
        return normalized;
      }
    }

    fallbacksUsed.push('pickType:prop');
    return 'prop';
  }

  private calculateDataQuality(
    validatedData: ValidatedSportsProp,
    rawData: RawSportsData,
    errors: ValidationError[]
  ): DataQualityMetrics {
    const requiredFieldsPresent = REQUIRED_PROP_FIELDS.filter(
      field =>
        validatedData[field] !== undefined &&
        validatedData[field] !== null &&
        validatedData[field] !== ''
    ).length;

    const completeness = (requiredFieldsPresent / REQUIRED_PROP_FIELDS.length) * 100;

    const errorCount = errors.filter(e => e.severity === 'error').length;
    const warningCount = errors.filter(e => e.severity === 'warning').length;
    const accuracy = Math.max(0, 100 - errorCount * 20 - warningCount * 5);

    // Check consistency (proper data types, reasonable values)
    let consistencyScore = 100;
    if (typeof validatedData.line !== 'number' || isNaN(validatedData.line)) consistencyScore -= 10;
    if (typeof validatedData.confidence !== 'number' || isNaN(validatedData.confidence))
      consistencyScore -= 15;
    if (!SPORT_VALUES.includes(validatedData.sport as any) && validatedData.sport !== 'Unknown')
      consistencyScore -= 20;

    // Timeliness based on data freshness
    const dataAge =
      Date.now() - (rawData.timestamp ? new Date(rawData.timestamp).getTime() : Date.now());
    const timeliness = Math.max(0, 100 - (dataAge / (1000 * 60 * 60)) * 2); // Reduce by 2 points per hour

    return {
      completeness,
      accuracy,
      consistency: Math.max(0, consistencyScore),
      timeliness,
    };
  }

  private calculateOverallQualityScore(metrics: DataQualityMetrics): number {
    // Weighted average: completeness and accuracy are most important
    return Math.round(
      metrics.completeness * 0.3 +
        metrics.accuracy * 0.4 +
        metrics.consistency * 0.2 +
        metrics.timeliness * 0.1
    );
  }

  private hasRequiredFields(data: Partial<ValidatedSportsProp>): boolean {
    return REQUIRED_PROP_FIELDS.every(
      field => data[field] !== undefined && data[field] !== null && data[field] !== ''
    );
  }

  private logValidationResult(
    isValid: boolean,
    errors: ValidationError[],
    warnings: string[],
    data: Partial<ValidatedSportsProp>,
    startTime: number
  ): void {
    this.logger({
      timestamp: new Date().toISOString(),
      level: isValid ? 'info' : 'warn',
      component: 'DataValidator',
      operation: 'validateSportsProp',
      metadata: {
        sport: data.sport,
        duration: Date.now() - startTime,
        dataQuality: data.qualityScore,
        errorsCount: errors.length,
        fallbacksUsed: data._validationMeta?.fallbacksUsed,
      },
      message: `Validation ${isValid ? 'passed' : 'failed'}: ${errors.length} errors, ${
        warnings.length
      } warnings`,
    });
  }

  private initializeNormalizationConfigs(): void {
    // MLB configuration
    this.normalizationConfigs.set('MLB', {
      sport: 'MLB',
      fieldMappings: {
        id: ['id', 'event_id', 'prop_id'],
        player: ['player', 'player_name'],
        matchup: ['matchup', 'event_name'],
        stat: ['stat', 'stat_type'],
        line: ['line', 'line_score'],
        overOdds: ['overOdds', 'over_odds'],
        underOdds: ['underOdds', 'under_odds'],
        confidence: ['confidence'],
        sport: ['sport'],
        gameTime: ['gameTime', 'start_time'],
        pickType: ['pickType'],
      },
      validationRules: [], // Will be populated as needed
      fallbackValues: {
        sport: 'MLB',
        pickType: 'prop',
        confidence: 0,
      },
      requiredFields: [...REQUIRED_PROP_FIELDS],
      optionalFields: ['overOdds', 'underOdds', 'gameTime', 'pickType'],
    });

    // Add configurations for other sports as needed
    ['NBA', 'NFL', 'NHL', 'Soccer'].forEach(sport => {
      this.normalizationConfigs.set(sport, {
        ...this.normalizationConfigs.get('MLB')!,
        sport,
        fallbackValues: {
          ...this.normalizationConfigs.get('MLB')!.fallbackValues,
          sport,
        },
      });
    });
  }

  private getNormalizationConfig(sport: string): DataNormalizationConfig {
    return this.normalizationConfigs.get(sport) || this.normalizationConfigs.get('MLB')!;
  }
}

// Export singleton instance
export const dataValidator = new EnhancedDataValidator();
