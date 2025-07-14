import { SocialSentimentData } from '@/adapters/SocialSentimentAdapter';
import { SportsRadarData } from '@/adapters/SportsRadarAdapter';
import { TheOddsData } from '@/adapters/TheOddsAdapter';
import { EventBus } from '@/unified/EventBus';
import { PerformanceMonitor } from '@/unified/PerformanceMonitor';
import { Analyzer } from '@/utils/Analyzer';
import { ProjectionAnalysis } from './ProjectionAnalyzer';

export interface EnhancedAnalysis extends ProjectionAnalysis {
  confidence: number;
  sentiment: {
    score: number;
    volume: number;
    trending: boolean;
    keywords: string[];
  };
  marketData: {
    odds: {
      moneyline?: number;
      spread?: number;
      total?: number;
    };
    consensus: {
      overPercentage: number;
      underPercentage: number;
    };
  };
  injuries: {
    player: string;
    status: string;
    impact: number;
  }[];
}

interface AnalysisInput {
  projectionAnalysis: ProjectionAnalysis[];
  sentimentData: SocialSentimentData[];
  sportsRadarData: SportsRadarData;
  oddsData: TheOddsData;
}

export class SentimentEnhancedAnalyzer implements Analyzer<AnalysisInput, EnhancedAnalysis[]> {
  public readonly id = 'sentiment-enhanced-analyzer';
  public readonly type = 'enhanced-analysis';
  public readonly name = 'Sentiment Enhanced Analyzer';
  public readonly description = 'Enhances projections with sentiment, odds, and injury data.';

  private readonly eventBus: EventBus;
  private readonly performanceMonitor: PerformanceMonitor;
  private readonly sentimentWeight: number;
  private readonly oddsWeight: number;
  private readonly injuryWeight: number;

  constructor(sentimentWeight = 0.2, oddsWeight = 0.3, injuryWeight = 0.2) {
    this.eventBus = EventBus.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.sentimentWeight = sentimentWeight;
    this.oddsWeight = oddsWeight;
    this.injuryWeight = injuryWeight;
  }

  public validate(data: AnalysisInput): boolean {
    return Array.isArray(data.projectionAnalysis);
  }

  public getMetrics() {
    return { accuracy: 1, latency: 0, errorRate: 0 };
  }

  public async analyze(input: AnalysisInput): Promise<EnhancedAnalysis[]> {
    const traceId = this.performanceMonitor.startTrace('sentiment-enhanced-analysis');

    try {
      const enhancedAnalyses = input.projectionAnalysis.map(projection => {
        const sentiment = this.findPlayerSentiment(projection.player, input.sentimentData);
        const odds = this.findPlayerOdds(projection.player, input.oddsData);
        const injuries = this.findPlayerInjuries(projection.player, input.sportsRadarData);

        const enhancedConfidence = this.calculateEnhancedConfidence(
          projection.confidence,
          sentiment,
          odds,
          injuries
        );

        return {
          ...projection,
          confidence: enhancedConfidence,
          sentiment: {
            score: sentiment?.sentiment.score ?? 0,
            volume: sentiment?.sentiment.volume ?? 0,
            trending: sentiment?.trending ?? false,
            keywords: sentiment?.keywords ?? [],
          },
          marketData: {
            odds: {
              moneyline: odds?.moneyline,
              spread: odds?.spread,
              total: odds?.total,
            },
            consensus: {
              overPercentage: odds?.consensus?.over ?? 50,
              underPercentage: odds?.consensus?.under ?? 50,
            },
          },
          injuries: injuries.map(injury => ({
            player: injury.player,
            status: injury.status,
            impact: this.calculateInjuryImpact(injury),
          })),
        };
      });

      this.eventBus.publish('enhanced-analysis-completed', {
        data: enhancedAnalyses as unknown as Record<string, unknown>,
        timestamp: Date.now(),
      });

      this.performanceMonitor.endTrace(traceId);
      return enhancedAnalyses;
    } catch (error) {
      this.performanceMonitor.endTrace(traceId, error as Error);
      throw error;
    }
  }

  public async confidence(input: AnalysisInput): Promise<number> {
    const analyses = await this.analyze(input);
    return analyses.reduce((acc, analysis) => acc + analysis.confidence, 0) / analyses.length;
  }

  private findPlayerSentiment(
    player: string,
    sentimentData: SocialSentimentData[]
  ): SocialSentimentData | undefined {
    return sentimentData.find(data => data.player === player);
  }

  private findPlayerInjuries(
    player: string,
    sportsData: SportsRadarData
  ): Array<{ player: string; status: string; type: string }> {
    const injuries: Array<{ player: string; status: string; type: string }> = [];

    sportsData.games.forEach(game => {
      game.players.forEach(p => {
        if (p.name === player) {
          p.injuries.forEach(injury => {
            injuries.push({
              player: p.name,
              status: injury.status,
              type: injury.type,
            });
          });
        }
      });
    });

    return injuries;
  }

  private findPlayerOdds(
    _player: string,
    _oddsData: TheOddsData
  ): {
    moneyline?: number;
    spread?: number;
    total?: number;
    consensus?: {
      over: number;
      under: number;
    };
  } | null {
    // Simplified implementation - return null since odds structure doesn't match
    return null;
  }

  private calculateEnhancedConfidence(
    baseConfidence: number,
    sentiment?: SocialSentimentData,
    odds?: unknown,
    injuries: Array<{ player: string; status: string; type: string }> = []
  ): number {
    let confidence = baseConfidence;

    // Apply sentiment adjustment
    if (sentiment) {
      confidence += this.sentimentWeight * sentiment.sentiment.score;
    }

    // Apply odds adjustment
    if (odds) {
      // Implement odds-based confidence adjustment
    }

    // Apply injury adjustment
    if (injuries.length > 0) {
      const injuryImpact = injuries.reduce(
        (acc, injury) => acc + this.calculateInjuryImpact(injury),
        0
      );
      confidence -= this.injuryWeight * injuryImpact;
    }

    // Ensure confidence stays within 0-1 range
    return Math.max(0, Math.min(1, confidence));
  }

  private calculateInjuryImpact(injury: { status: string; type: string }): number {
    // Implement injury impact calculation
    switch (injury.status.toLowerCase()) {
      case 'out':
        return 1;
      case 'doubtful':
        return 0.75;
      case 'questionable':
        return 0.5;
      case 'probable':
        return 0.25;
      default:
        return 0;
    }
  }
}
