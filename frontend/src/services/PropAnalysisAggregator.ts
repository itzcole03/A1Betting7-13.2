import { PropOllamaError, PropOllamaErrorType } from '../types/errors';
import { AnalysisCacheService } from './AnalysisCacheService';
import propOllamaService from './propOllamaService';

export interface PropAnalysisRequest {
  propId: string;
  player: string;
  team: string;
  sport: string;
  statType: string;
  line: number;
  overOdds: number;
  underOdds: number;
  includeContext?: boolean;
}

export interface PropAnalysisResponse {
  overAnalysis: string;
  underAnalysis: string;
  confidenceOver: number;
  confidenceUnder: number;
  keyFactorsOver: string[];
  keyFactorsUnder: string[];
  dataQuality: number;
  generationTime: number;
  modelUsed: string;
  isStale?: boolean;
  isFallback?: boolean;
  error?: PropOllamaError;
  timestamp?: string;
}

export interface AggregatedPropContext {
  player: {
    name: string;
    team: string;
    position: string;
    recentStats: Record<string, number>;
    seasonStats: Record<string, number>;
    trends: string[];
  };
  matchup: {
    opponent: string;
    location: string;
    date: string;
    weather?: string;
    injuries: string[];
  };
  betting: {
    line: number;
    overOdds: number;
    underOdds: number;
    lineMovement: string[];
    marketSentiment: string;
  };
  predictions: {
    modelPredictions: Record<string, number>;
    confidenceScores: Record<string, number>;
    keyFactors: string[];
  };
}

export class PropAnalysisAggregator {
  private cacheService: AnalysisCacheService;
  private fallbackGenerator: FallbackContentGenerator;
  
  constructor() {
    this.cacheService = AnalysisCacheService.getInstance();
    this.fallbackGenerator = new FallbackContentGenerator();
  }
  
  async getAnalysis(request: PropAnalysisRequest): Promise<PropAnalysisResponse> {
    const cacheKey = AnalysisCacheService.generateCacheKey(request);
    
    // Check cache first
    const cachedAnalysis = this.cacheService.get(cacheKey);
    if (cachedAnalysis) {
      // If not stale, return immediately
      if (!cachedAnalysis.isStale) {
        return cachedAnalysis;
      }
      
      // If stale, return but also refresh in background
      this.refreshAnalysisInBackground(request, cacheKey);
      return {
        ...cachedAnalysis,
        isStale: true,
        timestamp: cachedAnalysis.timestamp || new Date().toISOString()
      };
    }
    
    try {
      // Collect context from prediction components
      const context = await this.collectPredictionContext(request);
      
      // Generate analysis using PropOllama
      const analysis = await this.generateAnalysis(request, context);
      
      // Cache the result
      this.cacheService.set(cacheKey, analysis);
      
      return analysis;
    } catch (error) {
      console.error('Error generating prop analysis:', error);
      
      // Convert to PropOllamaError if needed
      const propError = error instanceof PropOllamaError 
        ? error 
        : PropOllamaError.fromError(error);
      
      // Generate fallback content if appropriate
      if (propError.fallbackAvailable) {
        const fallbackAnalysis = this.generateFallbackAnalysis(request, propError);
        return fallbackAnalysis;
      }
      
      // Re-throw the error if no fallback is available
      throw propError;
    }
  }
  
  private async refreshAnalysisInBackground(request: PropAnalysisRequest, cacheKey: string): Promise<void> {
    try {
      const context = await this.collectPredictionContext(request);
      const analysis = await this.generateAnalysis(request, context);
      this.cacheService.set(cacheKey, analysis);
    } catch (error) {
      console.error('Background refresh failed:', error);
      // Don't throw - this is a background operation
    }
  }
  
  private async collectPredictionContext(request: PropAnalysisRequest): Promise<AggregatedPropContext> {
    try {
      // In a real implementation, this would collect data from various prediction components
      // For now, we'll return mock data
      return {
        player: {
          name: request.player,
          team: request.team,
          position: this.getPositionForSport(request.sport, request.statType),
          recentStats: {
            games: 10,
            [request.statType.toLowerCase()]: request.line * 0.9,
            minutes: 32.5
          },
          seasonStats: {
            games: 65,
            [request.statType.toLowerCase()]: request.line * 1.1,
            minutes: 34.2
          },
          trends: [
            `${request.player} has exceeded ${request.line} ${request.statType} in 7 of last 10 games`,
            `${request.player} averages 15% more ${request.statType} at home`
          ]
        },
        matchup: {
          opponent: "Opponent Team",
          location: "Home",
          date: new Date().toISOString(),
          injuries: [
            "Key defender out with ankle injury",
            "Backup center questionable"
          ]
        },
        betting: {
          line: request.line,
          overOdds: request.overOdds,
          underOdds: request.underOdds,
          lineMovement: [
            `Line opened at ${request.line - 0.5}`,
            `Line moved to ${request.line} due to heavy action`
          ],
          marketSentiment: "60% of bets on Over"
        },
        predictions: {
          modelPredictions: {
            "ensemble": request.line + 2.5,
            "historical": request.line + 1.8,
            "matchup": request.line + 3.2
          },
          confidenceScores: {
            "over": 0.75,
            "under": 0.25
          },
          keyFactors: [
            "Recent performance trend",
            "Matchup advantage",
            "Pace of play"
          ]
        }
      };
    } catch (error) {
      throw PropOllamaError.dataFetchError('Failed to collect prediction context');
    }
  }
  
  private getPositionForSport(sport: string, statType: string): string {
    if (sport === 'NBA') {
      if (statType === 'Points' || statType === 'Assists') return 'Guard';
      if (statType === 'Rebounds' || statType === 'Blocks') return 'Forward';
      return 'Player';
    }
    if (sport === 'NFL') {
      if (statType === 'Passing Yards' || statType === 'Passing TDs') return 'Quarterback';
      if (statType === 'Rushing Yards') return 'Running Back';
      if (statType === 'Receiving Yards') return 'Wide Receiver';
      return 'Player';
    }
    return 'Player';
  }
  
  private async generateAnalysis(
    request: PropAnalysisRequest, 
    context: AggregatedPropContext
  ): Promise<PropAnalysisResponse> {
    try {
      // Build prompt for PropOllama
      const prompt = this.buildPrompt(request, context);
      
      // Call PropOllama service
      const startTime = Date.now();
      const response = await propOllamaService.sendChatMessage({
        message: prompt,
        analysisType: 'prop',
        context: JSON.parse(JSON.stringify(context)) as Record<string, unknown>
      });
      const generationTime = Date.now() - startTime;
      
      // Parse response
      const parsedResponse = this.parseResponse(response.content);
      
      return {
        overAnalysis: parsedResponse.overAnalysis,
        underAnalysis: parsedResponse.underAnalysis,
        confidenceOver: parsedResponse.confidenceOver || response.confidence * 100 || 75,
        confidenceUnder: parsedResponse.confidenceUnder || (100 - (response.confidence * 100)) || 25,
        keyFactorsOver: parsedResponse.keyFactorsOver || context.predictions.keyFactors,
        keyFactorsUnder: parsedResponse.keyFactorsUnder || context.predictions.keyFactors,
        dataQuality: 0.8,
        generationTime,
        modelUsed: response.model_used || 'llama2'
      };
    } catch (error) {
      throw PropOllamaError.fromError(error);
    }
  }
  
  private buildPrompt(request: PropAnalysisRequest, context: AggregatedPropContext): string {
    return `Analyze the following prop bet for ${request.player} (${request.team}):
${request.statType} Line: ${request.line}
Over Odds: ${request.overOdds}
Under Odds: ${request.underOdds}

Please provide separate detailed analyses for both the OVER and UNDER scenarios.
Include key factors, confidence level, and reasoning for each scenario.

Format your response with clear sections for OVER ANALYSIS and UNDER ANALYSIS.`;
  }
  
  private parseResponse(content: string): {
    overAnalysis: string;
    underAnalysis: string;
    confidenceOver?: number;
    confidenceUnder?: number;
    keyFactorsOver?: string[];
    keyFactorsUnder?: string[];
  } {
    // Simple parsing logic - in a real implementation this would be more robust
    const overMatch = content.match(/OVER ANALYSIS:?([\s\S]*?)(?=UNDER ANALYSIS|$)/i);
    const underMatch = content.match(/UNDER ANALYSIS:?([\s\S]*?)(?=$)/i);
    
    const overAnalysis = overMatch ? overMatch[1].trim() : 'No over analysis available';
    const underAnalysis = underMatch ? underMatch[1].trim() : 'No under analysis available';
    
    // Extract confidence if present
    const overConfidenceMatch = overAnalysis.match(/confidence:?\s*(\d+)%/i);
    const underConfidenceMatch = underAnalysis.match(/confidence:?\s*(\d+)%/i);
    
    // Extract key factors if present
    const overFactorsMatch = overAnalysis.match(/key factors:?\s*([\s\S]*?)(?=\n\n|$)/i);
    const underFactorsMatch = underAnalysis.match(/key factors:?\s*([\s\S]*?)(?=\n\n|$)/i);
    
    const keyFactorsOver = overFactorsMatch 
      ? overFactorsMatch[1].split('\n').map(f => f.replace(/^[•\-*]\s*/, '').trim()).filter(Boolean)
      : undefined;
      
    const keyFactorsUnder = underFactorsMatch
      ? underFactorsMatch[1].split('\n').map(f => f.replace(/^[•\-*]\s*/, '').trim()).filter(Boolean)
      : undefined;
    
    return {
      overAnalysis,
      underAnalysis,
      confidenceOver: overConfidenceMatch ? parseInt(overConfidenceMatch[1], 10) : undefined,
      confidenceUnder: underConfidenceMatch ? parseInt(underConfidenceMatch[1], 10) : undefined,
      keyFactorsOver,
      keyFactorsUnder
    };
  }
  
  private generateFallbackAnalysis(request: PropAnalysisRequest, error: PropOllamaError): PropAnalysisResponse {
    const fallbackOver = this.fallbackGenerator.generateOverAnalysis(request);
    const fallbackUnder = this.fallbackGenerator.generateUnderAnalysis(request);
    
    return {
      overAnalysis: fallbackOver.analysis,
      underAnalysis: fallbackUnder.analysis,
      confidenceOver: fallbackOver.confidence,
      confidenceUnder: fallbackUnder.confidence,
      keyFactorsOver: fallbackOver.keyFactors,
      keyFactorsUnder: fallbackUnder.keyFactors,
      dataQuality: 0.5,
      generationTime: 0,
      modelUsed: 'Fallback Generator',
      isFallback: true,
      error
    };
  }
}

class FallbackContentGenerator {
  generateOverAnalysis(prop: PropAnalysisRequest): { 
    analysis: string; 
    confidence: number; 
    keyFactors: string[] 
  } {
    return {
      analysis: `Based on historical data, ${prop.player} has a good chance of exceeding the ${prop.statType} line of ${prop.line}. Recent performance and matchup factors suggest the OVER is a reasonable bet.`,
      confidence: 65,
      keyFactors: [
        'Historical performance',
        'Recent trends',
        'Matchup factors'
      ]
    };
  }
  
  generateUnderAnalysis(prop: PropAnalysisRequest): { 
    analysis: string; 
    confidence: number; 
    keyFactors: string[] 
  } {
    return {
      analysis: `There are some factors that could limit ${prop.player}'s ${prop.statType} production below the line of ${prop.line}. Consider team dynamics and potential game script when evaluating the UNDER.`,
      confidence: 35,
      keyFactors: [
        'Team dynamics',
        'Game script',
        'Defensive matchup'
      ]
    };
  }
}