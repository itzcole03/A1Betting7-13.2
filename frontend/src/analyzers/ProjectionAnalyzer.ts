import { DailyFantasyData } from '@/adapters/DailyFantasyAdapter';
import { Analyzer } from '@/core/Analyzer';
import { EventBus } from '@/unified/EventBus';
import { PerformanceMonitor } from '@/utils/PerformanceMonitor';

export interface PredictionMetrics {
  predicted: number;
  confidence: number;
  range: {
    min: number;
    max: number;
  };
}

export interface ProjectionAnalysis {
  player: string;
  predictions: {
    points: PredictionMetrics;
    rebounds: PredictionMetrics;
    assists: PredictionMetrics;
    steals: PredictionMetrics;
    blocks: PredictionMetrics;
    threes: PredictionMetrics;
    minutes: PredictionMetrics;
  };
  confidence: number;
  metadata: {
    team: string;
    position: string;
    opponent: string;
    isHome: boolean;
  };
}

export class ProjectionAnalyzer implements Analyzer<DailyFantasyData, ProjectionAnalysis[]> {
  public readonly id = 'projection-analyzer';
  public readonly type = 'sports-projections';
  public readonly name = 'Projection Analyzer';
  public readonly description = 'Analyzes player projections for fantasy sports.';

  private readonly eventBus: EventBus;
  private readonly performanceMonitor: PerformanceMonitor;
  private readonly confidenceThreshold: number;

  constructor(confidenceThreshold: number = 0.7) {
    this.eventBus = EventBus.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.confidenceThreshold = confidenceThreshold;
  }

  public async analyze(data: DailyFantasyData): Promise<ProjectionAnalysis[]> {
    const _traceId = this.performanceMonitor.startTrace('projection-analysis', {
      category: 'analysis.projection',
      description: 'Projection analysis',
    });

    try {
      const _analyses: ProjectionAnalysis[] = [];

      for (const _projection of data.projections) {
        const _spanId = this.performanceMonitor.startSpan(traceId, 'player-analysis', {
          player: projection.name,
          team: projection.team,
        });

        try {
          const _baseConfidence = this.calculateBaseConfidence(projection);
          const _analysis = this.analyzePlayerProjection(projection, baseConfidence);
          if (analysis.confidence >= this.confidenceThreshold) {
            analyses.push(analysis);
          }
          this.performanceMonitor.endSpan(spanId);
        } catch (error) {
          this.performanceMonitor.endSpan(spanId, error as Error);
        }
      }

      this.performanceMonitor.endTrace(traceId);
      return analyses;
    } catch (error) {
      this.performanceMonitor.endTrace(traceId, error as Error);
      throw error;
    }
  }

  public async confidence(data: DailyFantasyData): Promise<number> {
    if (!data.projections.length) return 0;
    const _validProjections = data.projections.filter((p: unknown) => this.isValidProjection(p));
    return validProjections.length / data.projections.length;
  }

  private analyzePlayerProjection(
    projection: DailyFantasyData['projections'][0],
    baseConfidence: number
  ): ProjectionAnalysis {
    const _analysis: ProjectionAnalysis = {
      player: projection.name,
      predictions: {
        points: this.calculateMetrics(projection.pts, baseConfidence, 'points'),
        rebounds: this.calculateMetrics(projection.reb, baseConfidence, 'rebounds'),
        assists: this.calculateMetrics(projection.ast, baseConfidence, 'assists'),
        steals: this.calculateMetrics(projection.stl, baseConfidence, 'steals'),
        blocks: this.calculateMetrics(projection.blk, baseConfidence, 'blocks'),
        threes: this.calculateMetrics(projection.three_pt, baseConfidence, 'threes'),
        minutes: this.calculateMetrics(projection.min, baseConfidence, 'minutes'),
      },
      confidence: baseConfidence,
      metadata: {
        team: projection.team,
        position: projection.position,
        opponent: projection.opp_team,
        isHome: projection.is_home,
      },
    };

    // Publish detailed analysis event
    this.eventBus.publish('projection:analyzed', {
      data: {
        player: projection.name,
        confidence: baseConfidence,
        predictions: Object.entries(analysis.predictions).map(([stat, metrics]) => ({
          stat,
          predicted: metrics.predicted,
          confidence: metrics.confidence,
        })),
      },
      timestamp: Date.now(),
    });

    return analysis;
  }

  private calculateBaseConfidence(projection: DailyFantasyData['projections'][0]): number {
    let _confidence = 1.0;
    // Reduce confidence for missing or invalid data
    if (!this.isValidProjection(projection)) {
      confidence *= 0.5;
    }
    // Reduce confidence for extreme minute projections
    if (projection.min < 10 || projection.min > 48) {
      confidence *= 0.7;
    }
    // Reduce confidence for unrealistic stat projections
    if (projection.pts > 60 || projection.reb > 30 || projection.ast > 20) {
      confidence *= 0.8;
    }
    return confidence;
  }

  private calculateMetrics(
    value: number,
    baseConfidence: number,
    statType: string
  ): PredictionMetrics {
    const _variance = this.calculateVariance(value, statType);
    return {
      predicted: value,
      confidence: baseConfidence * this.getStatTypeConfidence(statType),
      range: {
        min: Math.max(0, value - variance),
        max: value + variance,
      },
    };
  }

  private calculateVariance(value: number, statType: string): number {
    // Different stats have different natural variances
    const _varianceFactors: Record<string, number> = {
      points: 0.2,
      rebounds: 0.25,
      assists: 0.3,
      steals: 0.4,
      blocks: 0.4,
      threes: 0.35,
      minutes: 0.15,
    };
    return value * (varianceFactors[statType] || 0.25);
  }

  private getStatTypeConfidence(statType: string): number {
    // Some stats are more predictable than others
    const _confidenceFactors: Record<string, number> = {
      points: 0.9,
      rebounds: 0.85,
      assists: 0.8,
      steals: 0.7,
      blocks: 0.7,
      threes: 0.75,
      minutes: 0.95,
    };
    return confidenceFactors[statType] || 0.8;
  }

  private isValidProjection(projection: DailyFantasyData['projections'][0]): boolean {
    return (
      typeof projection.pts === 'number' &&
      typeof projection.reb === 'number' &&
      typeof projection.ast === 'number' &&
      typeof projection.min === 'number' &&
      projection.min > 0
    );
  }

  public validate(data: DailyFantasyData): boolean {
    return Array.isArray(data.projections);
  }

  public getMetrics() {
    return { accuracy: 1, latency: 0, errorRate: 0 };
  }
}
