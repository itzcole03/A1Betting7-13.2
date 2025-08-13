import { getEnvVar } from '../../utils/getEnvVar';
/**
 * Ollama Service - Frontend service for AI-powered sports analytics
 * Provides streaming AI explanations and analysis via Ollama LLM
 */

// Branded types for player IDs and stat types
export type PlayerId = string & { readonly brand: unique symbol };
export type StatType = string & { readonly brand: unique symbol };
export type SportType = 'MLB' | 'NBA' | 'NFL' | 'NHL';
export interface ExplainRequest {
  context: string;
  question: string;
  playerIds?: PlayerId[];
  sport?: SportType;
  includeTrends?: boolean;
  includeMatchups?: boolean;
}

export type MarketContext = Record<string, string | number | boolean>;
export interface PropAnalysisRequest {
  playerName: string;
  statType: StatType;
  line: number;
  odds: string;
  recentPerformance?: string;
  marketContext?: MarketContext;
}

export type SeasonStats = Record<string, number>;
export type MatchupData = Record<string, string | number | boolean>;
export interface PlayerSummaryRequest {
  name: string;
  position: string;
  team: string;
  seasonStats: SeasonStats;
  recentTrends?: string;
  matchupData?: MatchupData;
}

export type AIResponseType = 'start' | 'chunk' | 'complete' | 'error';
export interface AIResponse {
  type: AIResponseType;
  content: string;
  fullContent?: string;
  error?: boolean;
  fallback?: boolean;
}
export interface AIErrorResponse extends AIResponse {
  type: 'error';
  error: true;
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
  /**
   * Stream AI explanation for player analysis with runtime type guard
   */
  async *streamExplanation(request: ExplainRequest): AsyncGenerator<AIResponse, void, undefined> {
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

      // Enhanced runtime type guard for AIResponse
      const allowedTypes: AIResponseType[] = ['start', 'chunk', 'complete', 'error'];
      const isAIResponse = (data: unknown): data is AIResponse => {
        if (typeof data !== 'object' || data === null) return false;
        const obj = data as Partial<AIResponse>;
        return (
          typeof obj.type === 'string' &&
          allowedTypes.includes(obj.type as AIResponseType) &&
          typeof obj.content === 'string' &&
          (obj.fullContent === undefined || typeof obj.fullContent === 'string') &&
          (obj.error === undefined || typeof obj.error === 'boolean') &&
          (obj.fallback === undefined || typeof obj.fallback === 'boolean')
        );
      };

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data: unknown = JSON.parse(line.slice(6));
                if (isAIResponse(data)) {
                  yield data;
                } else {
                  console.warn('Received invalid AIResponse:', data);
                }
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
      const errResp: AIErrorResponse = {
        type: 'error',
        content: `⚠️ Explanation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error: true,
      };
      yield errResp;
    }
  }

  /**
   * Stream AI analysis for prop betting opportunity
   */
  /**
   * Stream AI analysis for prop betting opportunity with runtime type guard
   */
  async *streamPropAnalysis(
    request: PropAnalysisRequest
  ): AsyncGenerator<AIResponse, void, undefined> {
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

      // Enhanced runtime type guard for AIResponse
      const allowedTypes: AIResponseType[] = ['start', 'chunk', 'complete', 'error'];
      const isAIResponse = (data: unknown): data is AIResponse => {
        if (typeof data !== 'object' || data === null) return false;
        const obj = data as Partial<AIResponse>;
        return (
          typeof obj.type === 'string' &&
          allowedTypes.includes(obj.type as AIResponseType) &&
          typeof obj.content === 'string' &&
          (obj.fullContent === undefined || typeof obj.fullContent === 'string') &&
          (obj.error === undefined || typeof obj.error === 'boolean') &&
          (obj.fallback === undefined || typeof obj.fallback === 'boolean')
        );
      };

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data: unknown = JSON.parse(line.slice(6));
                if (isAIResponse(data)) {
                  yield data;
                } else {
                  console.warn('Received invalid AIResponse:', data);
                }
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
      const errResp: AIErrorResponse = {
        type: 'error',
        content: `⚠️ Prop analysis failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error: true,
      };
      yield errResp;
    }
  }

  /**
   * Stream comprehensive player research summary
   */
  /**
   * Stream comprehensive player research summary with runtime type guard
   */
  async *streamPlayerSummary(
    request: PlayerSummaryRequest
  ): AsyncGenerator<AIResponse, void, undefined> {
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

      // Enhanced runtime type guard for AIResponse
      const allowedTypes: AIResponseType[] = ['start', 'chunk', 'complete', 'error'];
      const isAIResponse = (data: unknown): data is AIResponse => {
        if (typeof data !== 'object' || data === null) return false;
        const obj = data as Partial<AIResponse>;
        return (
          typeof obj.type === 'string' &&
          allowedTypes.includes(obj.type as AIResponseType) &&
          typeof obj.content === 'string' &&
          (obj.fullContent === undefined || typeof obj.fullContent === 'string') &&
          (obj.error === undefined || typeof obj.error === 'boolean') &&
          (obj.fallback === undefined || typeof obj.fallback === 'boolean')
        );
      };

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data: unknown = JSON.parse(line.slice(6));
                if (isAIResponse(data)) {
                  yield data;
                } else {
                  console.warn('Received invalid AIResponse:', data);
                }
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
      const errResp: AIErrorResponse = {
        type: 'error',
        content: `⚠️ Player summary failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error: true,
      };
      yield errResp;
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
          fullContent =
            typeof response.fullContent === 'string' ? response.fullContent : response.content;
          break;
        } else if (response.type === 'error') {
          throw new Error(
            typeof response.content === 'string' ? response.content : 'Unknown error'
          );
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
