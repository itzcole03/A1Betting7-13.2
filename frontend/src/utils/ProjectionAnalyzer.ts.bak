import { DailyFantasyData } from '../adapters/DailyFantasyAdapter';
import { Analyzer } from '../core/Analyzer';
import { EventBus } from '../core/EventBus';

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

interface PredictionMetrics {
  predicted: number;
  confidence: number;
  range: {
    min: number;
    max: number;
  };
}

export class ProjectionAnalyzer implements Analyzer<DailyFantasyData, ProjectionAnalysis[]> {
  public readonly id = 'projection-analyzer';
  public readonly type = 'sports-projections';
  public readonly name = 'Projection Analyzer';
  public readonly description = 'Analyzes player projections for fantasy sports.';

  private readonly eventBus: EventBus;
  private readonly confidenceThreshold: number;
  private readonly performanceMonitor: any; // Explicitly type as any for now

  constructor(confidenceThreshold: number = 0.7) {
    this.eventBus = EventBus.getInstance();
    this.confidenceThreshold = confidenceThreshold;
    this.performanceMonitor = (window as any).PerformanceMonitor?.getInstance?.() || {
      startTrace: () => '',
      endTrace: () => {},
      startSpan: () => '',
      endSpan: () => {},
    };
  }

  public async analyze(data: DailyFantasyData): Promise<ProjectionAnalysis[]> {
    const _traceId = this.performanceMonitor.startTrace('projection-analysis');

    try {
      const _analyses: ProjectionAnalysis[] = [];

      for (const _projection of data.projections) {
        const _spanId = this.performanceMonitor.startSpan(_traceId, 'player-analysis', {
          player: _projection.name,
          team: _projection.team,
        });

        try {
          const _analysis = this.analyzePlayerProjection(_projection);
          if (_analysis.confidence >= this.confidenceThreshold) {
            _analyses.push(_analysis);
          }

          this.performanceMonitor.endSpan(_spanId);
        } catch (error) {
          this.performanceMonitor.endSpan(_spanId, error as Error);
        }
      }

      this.performanceMonitor.endTrace(_traceId);
      return _analyses;
    } catch (error) {
      this.performanceMonitor.endTrace(_traceId, error as Error);
      throw error;
    }
  }

  public async confidence(data: DailyFantasyData): Promise<number> {
    if (!data.projections.length) return 0;

    const _validProjections = data.projections.filter((_p: any) => this.isValidProjection(_p));

    return _validProjections.length / data.projections.length;
  }

  private analyzePlayerProjection(
    projection: DailyFantasyData['projections'][0]
  ): ProjectionAnalysis {
    const _analysis: ProjectionAnalysis = {
      player: projection.name,
      predictions: {
        points: this.calculateMetrics(
          projection.pts,
          this.calculateBaseConfidence(projection),
          'points'
        ),
        rebounds: this.calculateMetrics(
          projection.reb,
          this.calculateBaseConfidence(projection),
          'rebounds'
        ),
        assists: this.calculateMetrics(
          projection.ast,
          this.calculateBaseConfidence(projection),
          'assists'
        ),
        steals: this.calculateMetrics(
          projection.stl,
          this.calculateBaseConfidence(projection),
          'steals'
        ),
        blocks: this.calculateMetrics(
          projection.blk,
          this.calculateBaseConfidence(projection),
          'blocks'
        ),
        threes: this.calculateMetrics(
          projection.three_pt,
          this.calculateBaseConfidence(projection),
          'threes'
        ),
        minutes: this.calculateMetrics(
          projection.min,
          this.calculateBaseConfidence(projection),
          'minutes'
        ),
      },
      confidence: this.calculateBaseConfidence(projection),
      metadata: {
        team: projection.team,
        position: projection.position,
        opponent: projection.opp_team,
        isHome: projection.is_home,
      },
    };

    this.eventBus.publish({
      type: 'projection:analyzed',
      payload: {
        player: projection.name,
        confidence: this.calculateBaseConfidence(projection),
        predictions: Object.entries(_analysis.predictions).map(([stat, metrics]) => ({
          stat,
          predicted: metrics.predicted,
          confidence: metrics.confidence,
        })),
      },
    });

    return _analysis;
  }

  private calculateBaseConfidence(projection: DailyFantasyData['projections'][0]): number {
    let _confidence = 1.0;

    if (!this.isValidProjection(projection)) {
      _confidence *= 0.5;
    }

    if (projection.min < 10 || projection.min > 48) {
      _confidence *= 0.7;
    }

    if (projection.pts > 60 || projection.reb > 30 || projection.ast > 20) {
      _confidence *= 0.8;
    }

    return _confidence;
  }

  private calculateMetrics(
    value: number,
    baseConfidence: number,
    statType: string
  ): PredictionMetrics {
    return {
      predicted: value,
      confidence: baseConfidence * this.getStatTypeConfidence(statType),
      range: {
        min: Math.max(0, value - this.calculateVariance(value, statType)),
        max: value + this.calculateVariance(value, statType),
      },
    };
  }

  private calculateVariance(value: number, statType: string): number {
    const _varianceFactors: Record<string, number> = {
      points: 0.2,
      rebounds: 0.25,
      assists: 0.3,
      steals: 0.4,
      blocks: 0.4,
      threes: 0.35,
      minutes: 0.15,
    };

    return value * (_varianceFactors[statType] || 0.25);
  }

  private getStatTypeConfidence(statType: string): number {
    const _confidenceFactors: Record<string, number> = {
      points: 0.9,
      rebounds: 0.85,
      assists: 0.8,
      steals: 0.7,
      blocks: 0.7,
      threes: 0.75,
      minutes: 0.95,
    };

    return _confidenceFactors[statType] || 0.8;
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
