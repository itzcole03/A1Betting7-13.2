import { UnifiedLogger } from '../services/unified/UnifiedLogger';
import {
  UnifiedPredictionService,
  type PredictionRequest,
  type PredictionResult,
} from '../services/unified/UnifiedPredictionService';
import type { MarketState, TimestampedData } from '../types/core';

export type { PredictionContext } from '../types/core';

const CONFIDENCE_THRESHOLD = 0.6;
const CONFIDENCE_GAP_TOLERANCE = 0.18;

export type PropRecommendationDirection = 'over' | 'under' | 'neutral';

export interface PropRecommendationTarget {
  playerId?: string;
  metric?: string;
  direction?: PropRecommendationDirection;
  line?: number;
  llmConfidence?: number;
  expectedValue?: number;
  source?: string;
  timestamp?: number;
  marketState?: Partial<MarketState>;
  historicalData?: TimestampedData[];
  metadata?: Record<string, unknown>;
}

export type PropValidationStatus =
  | 'confirmed'
  | 'low-confidence'
  | 'conflict'
  | 'missing'
  | 'error';

interface NormalizedRecommendationTarget extends PropRecommendationTarget {
  playerId?: string;
  metric?: string;
  llmConfidence?: number;
  direction: PropRecommendationDirection;
  timestamp: number;
  marketState: MarketState;
  metadata: Record<string, unknown>;
  label: string;
}

export interface EnginePredictionSnapshot {
  id: string;
  value: number;
  confidence: number;
  timestamp: number;
  metadata: Record<string, unknown>;
  source: 'unified-service' | 'fallback';
  raw?: PredictionResult;
}

export interface PropValidationItem {
  target: NormalizedRecommendationTarget;
  status: PropValidationStatus;
  prediction?: EnginePredictionSnapshot;
  reason?: string;
  error?: string;
}

export interface PropValidationSummary {
  totalTargets: number;
  confirmed: number;
  lowConfidence: number;
  conflicts: number;
  missing: number;
  errors: number;
}

export interface PropValidationIssue {
  code:
    | 'NO_TARGETS'
    | 'TARGET_MISSING_IDENTIFIERS'
    | 'ENGINE_LOW_CONFIDENCE'
    | 'CONFIDENCE_MISMATCH'
    | 'ENGINE_ERROR'
    | 'SERVICE_FALLBACK';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  target?: NormalizedRecommendationTarget;
  details?: Record<string, unknown>;
}

export interface PropValidationResult {
  executedAt: string;
  items: PropValidationItem[];
  summary: PropValidationSummary;
  issues: PropValidationIssue[];
  metadata: {
    confidenceThreshold: number;
    confidenceGapTolerance: number;
  };
}

class UnifiedPredictionEngine {
  private static instance: UnifiedPredictionEngine;
  private readonly service: UnifiedPredictionService;
  private readonly logger: UnifiedLogger;

  private constructor() {
    this.service = UnifiedPredictionService.getInstance();
    this.logger = UnifiedLogger.getInstance();
    this.logger.setContext('UnifiedPredictionEngine');
  }

  static getInstance(): UnifiedPredictionEngine {
    if (!UnifiedPredictionEngine.instance) {
      UnifiedPredictionEngine.instance = new UnifiedPredictionEngine();
    }
    return UnifiedPredictionEngine.instance;
  }

  async generatePrediction(
    target: NormalizedRecommendationTarget
  ): Promise<EnginePredictionSnapshot> {
    const request = this.buildServiceRequest(target);
    const startedAt = Date.now();

    try {
      const serviceResult = await this.service.makePrediction(request);
      return this.mapServiceResult(target, serviceResult, startedAt);
    } catch (error) {
      this.logger.warn('Unified service prediction failed, using fallback', {
        label: target.label,
        error: toErrorMessage(error),
      });
      return this.buildFallbackPrediction(target, request, Date.now() - startedAt, error);
    }
  }

  private buildServiceRequest(target: NormalizedRecommendationTarget): PredictionRequest {
    const metadata: Record<string, unknown> = {
      direction: target.direction,
      line: target.marketState.line,
      volume: target.marketState.volume,
      movement: target.marketState.movement,
      llmConfidence: target.llmConfidence,
      expectedValue: target.expectedValue,
      source: target.metadata.source,
      label: target.label,
      correlationFactors: extractCorrelationFactors(target),
    };

    return {
      sport: this.resolveSport(target),
      market: target.metric ?? 'unknown',
      playerId: target.playerId,
      gameId: this.resolveGameId(target),
      modelType: this.resolveModelType(target),
      metadata,
    };
  }

  private resolveSport(target: NormalizedRecommendationTarget): string {
    const candidates = [
      target.metadata?.sport,
      target.metadata?.league,
      target.metadata?.sportSlug,
      target.metadata?.competition,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim().toLowerCase();
      }
    }

    return 'generic';
  }

  private resolveModelType(target: NormalizedRecommendationTarget): string | undefined {
    const candidate =
      target.metadata?.modelType ?? target.metadata?.model ?? target.metadata?.engine;
    return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : undefined;
  }

  private resolveGameId(target: NormalizedRecommendationTarget): string | undefined {
    const candidate =
      target.metadata?.gameId ??
      target.metadata?.eventId ??
      target.metadata?.matchId ??
      target.metadata?.fixtureId;
    return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : undefined;
  }

  private mapServiceResult(
    target: NormalizedRecommendationTarget,
    result: PredictionResult,
    startedAt: number
  ): EnginePredictionSnapshot {
    const timestamp = result.timestamp instanceof Date ? result.timestamp.getTime() : Date.now();

    return {
      id: `${target.label}:${timestamp}`,
      value: result.prediction,
      confidence: result.confidence,
      timestamp,
      metadata: {
        modelUsed: result.modelUsed,
        factors: result.factors,
        request: result.request,
        durationMs: Date.now() - startedAt,
        source: target.metadata.source,
      },
      source: 'unified-service',
      raw: result,
    };
  }

  private buildFallbackPrediction(
    target: NormalizedRecommendationTarget,
    request: PredictionRequest,
    durationMs: number,
    error: unknown
  ): EnginePredictionSnapshot {
    const llmConfidence =
      typeof target.llmConfidence === 'number' ? target.llmConfidence : undefined;
    const baseConfidence = llmConfidence ? Math.min(llmConfidence, CONFIDENCE_THRESHOLD) : 0.45;
    const fallbackConfidence = Number(Math.max(0, Math.min(1, baseConfidence * 0.75)).toFixed(3));
    const value =
      typeof target.marketState.line === 'number'
        ? target.marketState.line
        : typeof target.line === 'number'
        ? target.line
        : 0;

    return {
      id: `${target.label}:${Date.now()}:fallback`,
      value,
      confidence: fallbackConfidence,
      timestamp: Date.now(),
      metadata: {
        fallback: true,
        error: toErrorMessage(error),
        request,
        durationMs,
        source: target.metadata.source,
        llmConfidence: target.llmConfidence,
      },
      source: 'fallback',
    };
  }
}

export { UnifiedPredictionEngine };

export async function validatePropRecommendations(
  targets: PropRecommendationTarget[]
): Promise<PropValidationResult> {
  if (!Array.isArray(targets) || targets.length === 0) {
    return {
      executedAt: new Date().toISOString(),
      items: [],
      summary: createEmptySummary(0),
      issues: [
        {
          code: 'NO_TARGETS',
          severity: 'info',
          message: 'No recommendation targets supplied for validation.',
        },
      ],
      metadata: {
        confidenceThreshold: CONFIDENCE_THRESHOLD,
        confidenceGapTolerance: CONFIDENCE_GAP_TOLERANCE,
      },
    };
  }

  const engine = UnifiedPredictionEngine.getInstance();
  const issues: PropValidationIssue[] = [];
  const items: PropValidationItem[] = [];
  const normalizedTargets = targets.map((target, index) => normalizeTarget(target, index));

  for (const normalized of normalizedTargets) {
    if (!normalized.playerId || !normalized.metric) {
      issues.push({
        code: 'TARGET_MISSING_IDENTIFIERS',
        severity: 'warning',
        message: `Missing identifiers for recommendation "${normalized.label}"`,
        target: normalized,
      });
      items.push({
        target: normalized,
        status: 'missing',
        reason: 'Missing playerId or metric identifiers',
      });
      continue;
    }

    let prediction: EnginePredictionSnapshot;
    try {
      prediction = await engine.generatePrediction(normalized);
    } catch (error) {
      const message = toErrorMessage(error);
      issues.push({
        code: 'ENGINE_ERROR',
        severity: 'critical',
        message: `Prediction engine error for "${normalized.label}": ${message}`,
        target: normalized,
        details: { error: message },
      });
      items.push({
        target: normalized,
        status: 'error',
        reason: 'Prediction engine error',
        error: message,
      });
      continue;
    }

    if (prediction.source === 'fallback') {
      issues.push({
        code: 'SERVICE_FALLBACK',
        severity: 'warning',
        message: `Unified prediction service unavailable for "${normalized.label}"; using fallback data.`,
        target: normalized,
        details: { error: prediction.metadata.error },
      });
    }

    const statusInfo = determineValidationStatus(normalized, prediction);
    if (statusInfo.issue) {
      issues.push(statusInfo.issue);
    }

    items.push({
      target: normalized,
      status: statusInfo.status,
      prediction,
      reason: statusInfo.reason,
    });
  }

  return {
    executedAt: new Date().toISOString(),
    items,
    summary: buildSummary(items, normalizedTargets.length),
    issues,
    metadata: {
      confidenceThreshold: CONFIDENCE_THRESHOLD,
      confidenceGapTolerance: CONFIDENCE_GAP_TOLERANCE,
    },
  };
}

function normalizeTarget(
  target: PropRecommendationTarget,
  index: number
): NormalizedRecommendationTarget {
  const playerId = typeof target.playerId === 'string' ? target.playerId.trim() : target.playerId;
  const metric = typeof target.metric === 'string' ? target.metric.trim() : target.metric;
  const direction = target.direction ?? 'neutral';
  const timestamp = target.timestamp ?? Date.now();
  const llmConfidence = normalizeConfidence(target.llmConfidence);
  const metadata: Record<string, unknown> = {
    ...(target.metadata ?? {}),
    source: target.source ?? target.metadata?.source ?? 'unknown',
    index,
  };

  const label = buildLabel(playerId, metric, metadata);

  return {
    ...target,
    playerId,
    metric,
    direction,
    llmConfidence,
    timestamp,
    marketState: normalizeMarketState(target.marketState, target.line, direction),
    metadata,
    label,
  };
}

function extractCorrelationFactors(target: NormalizedRecommendationTarget): string[] {
  const raw = target.metadata?.correlationFactors;
  if (Array.isArray(raw)) {
    return raw.filter((value): value is string => typeof value === 'string');
  }
  return [];
}

function determineValidationStatus(
  target: NormalizedRecommendationTarget,
  prediction: EnginePredictionSnapshot
): {
  status: PropValidationStatus;
  reason?: string;
  issue?: PropValidationIssue;
} {
  if (prediction.confidence < CONFIDENCE_THRESHOLD) {
    return {
      status: 'low-confidence',
      reason: `Engine confidence ${prediction.confidence.toFixed(
        2
      )} below guardrail (${CONFIDENCE_THRESHOLD})`,
      issue: {
        code: 'ENGINE_LOW_CONFIDENCE',
        severity: 'warning',
        message: `Engine confidence ${prediction.confidence.toFixed(2)} fell below guardrail for "${
          target.label
        }"`,
        target,
        details: { engineConfidence: prediction.confidence },
      },
    };
  }

  if (typeof target.llmConfidence === 'number') {
    const gap = Math.abs(target.llmConfidence - prediction.confidence);
    if (gap > CONFIDENCE_GAP_TOLERANCE) {
      return {
        status: 'conflict',
        reason: `Confidence gap ${gap.toFixed(2)} exceeded tolerance (${CONFIDENCE_GAP_TOLERANCE})`,
        issue: {
          code: 'CONFIDENCE_MISMATCH',
          severity: 'critical',
          message: `LLM confidence ${target.llmConfidence.toFixed(
            2
          )} diverged from engine confidence ${prediction.confidence.toFixed(2)} for "${
            target.label
          }"`,
          target,
          details: {
            llmConfidence: target.llmConfidence,
            engineConfidence: prediction.confidence,
            delta: gap,
          },
        },
      };
    }
  }

  return { status: 'confirmed' };
}

function normalizeConfidence(value: number | undefined): number | undefined {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return undefined;
  }
  let normalized = value;
  if (normalized > 1 && normalized <= 100) {
    normalized = normalized / 100;
  }
  if (normalized < 0) {
    normalized = 0;
  }
  if (normalized > 1) {
    normalized = 1;
  }
  return Number(normalized.toFixed(3));
}

function normalizeMarketState(
  marketState: PropRecommendationTarget['marketState'],
  line: number | undefined,
  direction: PropRecommendationDirection
): MarketState {
  const resolvedLine = toNumber(marketState?.line) ?? (typeof line === 'number' ? line : 0);
  const resolvedVolume = toNumber(marketState?.volume) ?? 0;
  const resolvedMovement = normalizeMovement(marketState?.movement, direction);

  return {
    line: resolvedLine,
    volume: resolvedVolume,
    movement: resolvedMovement,
  };
}

function normalizeMovement(
  movement: MarketState['movement'] | undefined,
  direction: PropRecommendationDirection
): MarketState['movement'] {
  if (movement === 'up' || movement === 'down' || movement === 'stable') {
    return movement;
  }
  if (direction === 'over') {
    return 'up';
  }
  if (direction === 'under') {
    return 'down';
  }
  return 'stable';
}

function buildLabel(
  playerId: string | undefined,
  metric: string | undefined,
  metadata: Record<string, unknown>
): string {
  if (playerId && metric) {
    return `${playerId}:${metric}`;
  }
  const label = metadata.label;
  if (typeof label === 'string' && label.trim().length > 0) {
    return label.trim();
  }
  if (playerId) {
    return playerId;
  }
  if (metric) {
    return metric;
  }
  const index = typeof metadata.index === 'number' ? metadata.index : 'unknown';
  return `target_${index}`;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function buildSummary(items: PropValidationItem[], total: number): PropValidationSummary {
  const summary = createEmptySummary(total);
  for (const item of items) {
    switch (item.status) {
      case 'confirmed':
        summary.confirmed += 1;
        break;
      case 'low-confidence':
        summary.lowConfidence += 1;
        break;
      case 'conflict':
        summary.conflicts += 1;
        break;
      case 'missing':
        summary.missing += 1;
        break;
      case 'error':
        summary.errors += 1;
        break;
      default:
        break;
    }
  }
  return summary;
}

function createEmptySummary(totalTargets: number): PropValidationSummary {
  return {
    totalTargets,
    confirmed: 0,
    lowConfidence: 0,
    conflicts: 0,
    missing: 0,
    errors: 0,
  };
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
}
