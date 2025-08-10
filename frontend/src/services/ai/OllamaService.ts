import { getEnvVar } from '../../utils/getEnvVar';
/**
 * Ollama Service - Frontend service for AI-powered sports analytics
 * Provides streaming AI explanations and analysis via Ollama LLM
 */

export interface ExplainRequest {
  context: string;
  question: string;
  playerIds?: string[];
  sport?: string;
  includeTrends?: boolean;
  includeMatchups?: boolean;
}

export interface PropAnalysisRequest {
  playerName: string;
  statType: string;
  line: number;
  odds: string;
  recentPerformance?: string;
  marketContext?: Record<string, any>;
}

export interface PlayerSummaryRequest {
  name: string;
  position: string;
  team: string;
  seasonStats: Record<string, any>;
  recentTrends?: string;
  matchupData?: Record<string, any>;
}

export interface AIResponse {
  type: 'start' | 'chunk' | 'complete' | 'error';
  content: string;
  fullContent?: string;
  error?: boolean;
  fallback?: boolean;
}

export interface AIHealthStatus {
  status: string;
  ollamaAvailable: boolean;
  availableModels: string[];
  timestamp: string;
}

class OllamaService {
  private static instance: OllamaService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl =
      getEnvVar('VITE_API_BASE_URL', 'http://localhost:8000') ?? 'http://localhost:8000';
  }

  static getInstance(): OllamaService {
    if (!OllamaService.instance) {
      OllamaService.instance = new OllamaService();
    }
    return OllamaService.instance;
  }

  /**
   * Check AI service health and availability
   */
  async checkHealth(): Promise<AIHealthStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/ai/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('AI health check failed:', error);
      return {
        status: 'unavailable',
        ollamaAvailable: false,
        availableModels: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Stream AI explanation for player analysis
   */
  async *streamExplanation(request: ExplainRequest): AsyncGenerator<AIResponse, void, unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/ai/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: request.context,
          question: request.question,
          player_ids: request.playerIds,
          sport: request.sport || 'MLB',
          include_trends: request.includeTrends ?? true,
          include_matchups: request.includeMatchups ?? true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Explanation request failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                yield data as AIResponse;
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Stream explanation error:', error);
      yield {
        type: 'error',
        content: `⚠️ Explanation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error: true,
      };
    }
  }

  /**
   * Stream AI analysis for prop betting opportunity
   */
  async *streamPropAnalysis(
    request: PropAnalysisRequest
  ): AsyncGenerator<AIResponse, void, unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/ai/analyze-prop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_name: request.playerName,
          stat_type: request.statType,
          line: request.line,
          odds: request.odds,
          recent_performance: request.recentPerformance,
          market_context: request.marketContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Prop analysis request failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                yield data as AIResponse;
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Stream prop analysis error:', error);
      yield {
        type: 'error',
        content: `⚠️ Prop analysis failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error: true,
      };
    }
  }

  /**
   * Stream comprehensive player research summary
   */
  async *streamPlayerSummary(
    request: PlayerSummaryRequest
  ): AsyncGenerator<AIResponse, void, unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/ai/player-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: request.name,
          position: request.position,
          team: request.team,
          season_stats: request.seasonStats,
          recent_trends: request.recentTrends,
          matchup_data: request.matchupData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Player summary request failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                yield data as AIResponse;
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Stream player summary error:', error);
      yield {
        type: 'error',
        content: `⚠️ Player summary failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error: true,
      };
    }
  }

  /**
   * Get simple non-streaming explanation (fallback)
   */
  async getSimpleExplanation(request: ExplainRequest): Promise<string> {
    try {
      let fullContent = '';
      for await (const response of this.streamExplanation(request)) {
        if (response.type === 'complete') {
          fullContent = response.fullContent || response.content;
          break;
        } else if (response.type === 'error') {
          throw new Error(response.content);
        }
      }
      return fullContent || 'No explanation generated';
    } catch (error) {
      console.error('Simple explanation error:', error);
      return `⚠️ Explanation unavailable: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
    }
  }
}

export default OllamaService.getInstance();
