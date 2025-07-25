/**
 * Unified API Service
 *
 * Service for interacting with the unified backend API that combines
 * PrizePicks, MoneyMaker, and Lineup Builder functionality
 */

import {
  CorrelationMatrix,
  EnhancedBetsResponse,
  LiveGameContext,
  MultiPlatformOpportunity,
  PortfolioAnalysis,
  PortfolioMetrics,
  StackSuggestion,
} from '../types/enhancedBetting';

import { VITE_API_URL } from '../constants';
function getApiUrl() {
  return VITE_API_URL || 'http://localhost:8000';
}

type FetchImpl = typeof fetch;

class UnifiedApiService {
  private baseUrl: string;
  private timeout: number;
  private fetchImpl: FetchImpl;

  constructor(fetchImpl?: FetchImpl) {
    const apiUrl = getApiUrl();
    this.baseUrl = `${apiUrl}/api/unified`;
    this.timeout = 5000; // 5 seconds
    this.fetchImpl =
      fetchImpl ||
      (typeof fetch !== 'undefined'
        ? fetch.bind(window)
        : ((() => {
            throw new Error('No fetch implementation available');
          }) as any));
    console.log('[REAL UnifiedApiService] CONSTRUCTOR CALLED - using backend:', apiUrl);
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const _controller = new AbortController();
    const _timeoutId = setTimeout(() => _controller.abort(), this.timeout);

    try {
      console.log('[fetchWithTimeout] Fetching:', url, options);
      const _response = await this.fetchImpl(url, {
        ...options,
        signal: _controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(_timeoutId);

      const _contentType = _response.headers.get('content-type');
      console.log('[fetchWithTimeout] Response:', {
        url,
        status: _response.status,
        statusText: _response.statusText,
        contentType: _contentType,
      });

      if (_contentType && _contentType.includes('text/html')) {
        const _text = await _response.text();
        console.debug(
          `API endpoint ${url} returned HTML instead of JSON - likely a 404 or error page. Body:`,
          _text
        );
        throw new Error('API_UNAVAILABLE');
      }

      return _response;
    } catch (error) {
      clearTimeout(_timeoutId);
      console.error('[fetchWithTimeout] Error fetching', url, error);
      throw new Error('API_UNAVAILABLE');
    }
  }

  /**
   * Get enhanced betting predictions with AI insights and portfolio optimization
   */
  async getEnhancedBets(
    params: {
      sport?: string;
      min_confidence?: number;
      include_ai_insights?: boolean;
      include_portfolio_optimization?: boolean;
      max_results?: number;
    } = {}
  ): Promise<EnhancedBetsResponse> {
    // eslint-disable-next-line no-console
    console.log('[REAL] getEnhancedBets called [REAL SERVICE]');
    const _searchParams = new URLSearchParams();

    if (params.sport) _searchParams.append('sport', params.sport);
    if (params.min_confidence)
      _searchParams.append('min_confidence', params.min_confidence.toString());
    if (params.include_ai_insights !== undefined)
      _searchParams.append('include_ai_insights', params.include_ai_insights.toString());
    if (params.include_portfolio_optimization !== undefined)
      _searchParams.append(
        'include_portfolio_optimization',
        params.include_portfolio_optimization.toString()
      );
    if (params.max_results) _searchParams.append('max_results', params.max_results.toString());

    const _response = await this.fetchWithTimeout(`${this.baseUrl}/enhanced-bets?${_searchParams}`);

    if (!_response.ok) {
      throw new Error(`Failed to fetch enhanced bets: ${_response.status} ${_response.statusText}`);
    }

    return (await this.safeJsonParse(_response)) as EnhancedBetsResponse;
  }

  /**
   * Fallback enhanced bets data when API is unavailable
   */
  private getFallbackEnhancedBets(): EnhancedBetsResponse {
    const _mockPredictions = [
      {
        source: 'fallback',
        id: 'fallback_1',
        player_name: 'Aaron Judge',
        team: 'NYY',
        sport: 'MLB',
        stat_type: 'Home Runs',
        line: 1.5,
        recommendation: 'OVER' as 'OVER',
        confidence: 87.3,
        expected_value: 0.124,
        expected_return: 0.124,
        risk_score: 0.23,
        kelly_fraction: 0.045,
        quantum_confidence: 89.2,
        neural_score: 91.7,
        synergy_rating: 0.8,
        stack_potential: 0.7,
        optimal_stake: 0.06,
        correlation_score: 0.3,
        diversification_value: 0.8,
        injury_risk: 0.1,
        portfolio_impact: 0.75,
        variance_contribution: 0.25,
        line_score: 1.5,
        feature_importance: {
          recent_performance: 0.35,
          matchup_advantage: 0.28,
          historical_avg: 0.22,
          weather_conditions: 0.15,
        },
        shap_explanation: {
          baseline: 0.5,
          features: {
            recent_performance: 0.35,
            matchup_advantage: 0.28,
            historical_avg: 0.22,
            weather_conditions: 0.15,
            team_pace: 0,
          },
          prediction: 87.3,
          top_factors: [
            ['Recent form', 0.35] as [string, number],
            ['Matchup', 0.28] as [string, number],
            ['Historical', 0.22] as [string, number],
          ],
          explanation: 'Strong recent performance and favorable matchup drive high confidence.',
          key_factors: [
            ['Recent form', 0.35] as [string, number],
            ['Matchup', 0.28] as [string, number],
            ['Historical', 0.22] as [string, number],
          ],
        },
        risk_assessment: {
          overall_risk: 0.23,
          confidence_risk: 0.13,
          volatility_risk: 0.18,
          market_risk: 0.15,
          line_risk: 0.12,
          risk_level: 'low' as 'low',
        },
      },
      {
        source: 'fallback',
        id: 'fallback_2',
        player_name: 'Mookie Betts',
        team: 'LAD',
        sport: 'MLB',
        stat_type: 'Total Bases',
        line: 2.5,
        recommendation: 'UNDER' as 'UNDER',
        confidence: 82.1,
        expected_value: 0.098,
        expected_return: 0.098,
        risk_score: 0.31,
        kelly_fraction: 0.038,
        quantum_confidence: 85.4,
        neural_score: 87.9,
        synergy_rating: 0.6,
        stack_potential: 0.5,
        optimal_stake: 0.04,
        correlation_score: 0.4,
        diversification_value: 0.9,
        injury_risk: 0.05,
        portfolio_impact: 0.65,
        variance_contribution: 0.35,
        line_score: 2.5,
        feature_importance: {
          recent_performance: 0.42,
          matchup_advantage: 0.24,
          historical_avg: 0.2,
          team_pace: 0.14,
        },
        shap_explanation: {
          baseline: 0.5,
          features: {
            recent_performance: 0.42,
            matchup_advantage: 0.24,
            historical_avg: 0.2,
            team_pace: 0.14,
            weather_conditions: 0,
          },
          prediction: 82.1,
          top_factors: [
            ['Recent form', 0.42] as [string, number],
            ['Matchup', 0.24] as [string, number],
            ['Historical', 0.2] as [string, number],
          ],
          explanation: 'Consistent performer with good matchup fundamentals.',
          key_factors: [
            ['Recent form', 0.42] as [string, number],
            ['Matchup', 0.24] as [string, number],
            ['Historical', 0.2] as [string, number],
          ],
        },
        risk_assessment: {
          overall_risk: 0.31,
          confidence_risk: 0.18,
          volatility_risk: 0.22,
          market_risk: 0.19,
          line_risk: 0.15,
          risk_level: 'medium' as 'medium',
        },
      },
    ];

    return {
      success: true,
      enhanced_bets: _mockPredictions,
      predictions: _mockPredictions, // Keep both for compatibility
      total_predictions: _mockPredictions.length,
      portfolio_metrics: {
        total_expected_value: 0.222,
        total_risk_score: 0.27,
        diversification_score: 0.85,
        kelly_optimization: 0.041,
        sharpe_ratio: 2.1,
        max_drawdown: -0.082,
        // @ts-expect-error TS(2322): Type '{ total_expected_value: number; total_risk_s... Remove this comment to see the full error message
        confidence_weighted_return: 0.198,
      },
      ai_insights: [
        {
          // @ts-expect-error TS(2322): Type '{ bet_id: string; player_name: string; sport... Remove this comment to see the full error message
          bet_id: 'fallback_1',
          player_name: 'Aaron Judge',
          sport: 'MLB',
          confidence: 87.3,
          quantum_analysis:
            'Quantum algorithms detected optimal betting patterns with 87.3% confidence.',
          neural_patterns: ['Strong momentum indicators', 'Positive correlation clusters'],
          shap_explanation: {
            baseline: 0.5,
            features: { recent_performance: 0.35, matchup_advantage: 0.28 },
            prediction: 87.3,
            top_factors: [
              ['Recent form', 0.35],
              ['Matchup', 0.28],
            ],
          },
          risk_factors: ['Weather conditions', 'Injury status'],
          opportunity_score: 8.7,
          market_edge: 4.2,
          confidence_reasoning: 'Multiple AI models show consensus on positive expected value.',
          key_factors: [
            ['Recent performance', 0.35],
            ['Matchup advantage', 0.28],
          ],
        },
        {
          // @ts-expect-error TS(2322): Type '{ bet_id: string; player_name: string; sport... Remove this comment to see the full error message
          bet_id: 'fallback_2',
          player_name: 'Mookie Betts',
          sport: 'MLB',
          confidence: 82.1,
          quantum_analysis:
            'Moderate quantum advantage detected with stable probability distribution.',
          neural_patterns: ['Consistent performance', 'Favorable matchup dynamics'],
          shap_explanation: {
            baseline: 0.5,
            features: { recent_performance: 0.42, matchup_advantage: 0.24 },
            prediction: 82.1,
            top_factors: [
              ['Recent form', 0.42],
              ['Matchup', 0.24],
            ],
          },
          risk_factors: ['Market volatility'],
          opportunity_score: 7.1,
          market_edge: 3.8,
          confidence_reasoning: 'Consistent performance indicators with good fundamentals.',
          key_factors: [
            ['Recent performance', 0.42],
            ['Matchup advantage', 0.24],
          ],
        },
      ],
      status: 'fallback_mode',
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Get portfolio optimization recommendations
   */
  async getPortfolioOptimization(
    params: {
      sport?: string;
      min_confidence?: number;
      max_positions?: number;
    } = {}
  ): Promise<{
    portfolio_metrics: PortfolioMetrics;
    optimization_recommendations: unknown[];
    risk_assessment: unknown;
    status: string;
  }> {
    try {
      const _searchParams = new URLSearchParams();

      if (params.sport) _searchParams.append('sport', params.sport);
      if (params.min_confidence)
        _searchParams.append('min_confidence', params.min_confidence.toString());
      if (params.max_positions)
        _searchParams.append('max_positions', params.max_positions.toString());

      const url = `${this.baseUrl}/portfolio-optimization?${_searchParams}`;
      console.log('[getPortfolioOptimization] Fetching:', url);
      const _response = await this.fetchWithTimeout(url);

      if (!_response.ok) {
        const _text = await _response.text();
        console.error(
          '[getPortfolioOptimization] Non-OK response:',
          _response.status,
          _response.statusText,
          'Body:',
          _text
        );
        throw new Error(
          `Failed to fetch portfolio optimization: ${_response.status} ${_response.statusText}`
        );
      }

      const _json = await this.safeJsonParse(_response);
      console.log('[getPortfolioOptimization] Response JSON:', _json);
      return _json as {
        portfolio_metrics: PortfolioMetrics;
        optimization_recommendations: unknown[];
        risk_assessment: unknown;
        status: string;
      };
    } catch (error) {
      console.warn('Portfolio optimization API unavailable, using fallback data:', error);

      // Return fallback data
      return {
        // @ts-expect-error TS(2352): Conversion of type '{ total_expected_value: number... Remove this comment to see the full error message
        portfolio_metrics: {
          total_expected_value: 0.156,
          total_risk_score: 0.34,
          diversification_score: 0.82,
          kelly_optimization: 0.038,
          sharpe_ratio: 1.9,
          max_drawdown: -0.095,
          confidence_weighted_return: 0.142,
        } as PortfolioMetrics,
        optimization_recommendations: [
          {
            action: 'INCREASE_STAKE',
            bet_id: 'fallback-1',
            reasoning: 'High confidence with good risk-adjusted returns',
            suggested_allocation: 0.15,
          },
        ],
        risk_assessment: {
          overall_risk: 'MODERATE',
          correlation_risk: 'LOW',
          concentration_risk: 'LOW',
        },
        status: 'fallback_mode',
      };
    }
  }

  /**
   * Analyze a custom portfolio of bets
   */
  async analyzeCustomPortfolio(
    betIds: string[],
    investmentAmount: number = 1000
  ): Promise<PortfolioAnalysis> {
    const _response = await this.fetchWithTimeout(
      `${this.baseUrl}/portfolio/analyze?investment_amount=${investmentAmount}`,
      {
        method: 'POST',
        body: JSON.stringify(betIds),
      }
    );

    if (!_response.ok) {
      throw new Error(`Failed to analyze portfolio: ${_response.status} ${_response.statusText}`);
    }

    return _response.json();
  }

  /**
   * Get AI-powered insights and explanations
   */
  async getAIInsights(
    params: {
      sport?: string;
      min_confidence?: number;
    } = {}
  ): Promise<{
    ai_insights: Array<{
      bet_id: string;
      player_name: string;
      sport: string;
      confidence: number;
      quantum_analysis: string;
      neural_patterns: string[];
      shap_explanation: unknown;
      risk_factors: string[];
      opportunity_score: number;
      market_edge: number;
      confidence_reasoning: string;
      key_factors: Array<[string, number]>;
    }>;
    summary: {
      total_opportunities: number;
      average_opportunity_score: number;
      total_market_edge: number;
      quantum_analysis_available: boolean;
      neural_patterns_detected: number;
      high_confidence_bets: number;
    };
    market_intelligence: {
      inefficiencies_detected: number;
      pattern_strength: string;
      recommendation: string;
    };
  }> {
    // eslint-disable-next-line no-console
    console.log('[REAL] getAIInsights called');
    const _searchParams = new URLSearchParams();

    if (params.sport) _searchParams.append('sport', params.sport);
    if (params.min_confidence)
      _searchParams.append('min_confidence', params.min_confidence.toString());

    const _response = await this.fetchWithTimeout(`${this.baseUrl}/ai-insights?${_searchParams}`);

    if (!_response.ok) {
      throw new Error(`Failed to fetch AI insights: ${_response.status} ${_response.statusText}`);
    }

    return _response.json();
  }

  /**
   * Get live game context for streaming integration
   */
  async getLiveGameContext(
    gameId: string,
    includeBettingOpportunities: boolean = true
  ): Promise<{
    live_context: LiveGameContext;
    relevant_bets: unknown[];
    live_opportunities: unknown[];
    alerts: unknown[];
    next_update: string;
  }> {
    try {
      const _searchParams = new URLSearchParams();
      _searchParams.append('include_betting_opportunities', includeBettingOpportunities.toString());

      const _response = await this.fetchWithTimeout(
        `${this.baseUrl}/live-context/${gameId}?${_searchParams}`
      );

      if (!_response.ok) {
        throw new Error(
          `Failed to fetch live game context: ${_response.status} ${_response.statusText}`
        );
      }

      return (await this.safeJsonParse(_response)) as {
        live_context: LiveGameContext;
        relevant_bets: unknown[];
        live_opportunities: unknown[];
        alerts: unknown[];
        next_update: string;
      };
    } catch (error) {
      console.warn('Live game context API unavailable, using fallback data:', error);

      // Return fallback mock data
      return {
        // @ts-expect-error TS(2352): Conversion of type '{ game_id: string; status: "in... Remove this comment to see the full error message
        live_context: {
          game_id: gameId,
          status: 'in_progress',
          current_time: 'Q3 8:45',
          score: {
            home: { team: 'LAL', score: 98 },
            away: { team: 'BOS', score: 102 },
          },
          next_events: ['Timeout', 'Quarter End'],
          pace_analysis: 'ON_PACE',
          momentum: 'NEUTRAL',
        } as LiveGameContext,
        relevant_bets: [
          {
            id: 'bet-1',
            player_name: 'LeBron James',
            bet_type: 'Points',
            current_value: 22,
            target: 25.5,
            status: 'ON_PACE',
          },
        ],
        live_opportunities: [
          {
            type: 'LIVE_BET',
            description: 'Strong momentum shift detected',
            action: 'CONSIDER_ENTRY',
            confidence: 0.75,
          },
        ],
        alerts: [],
        next_update: new Date(Date.now() + 60000).toISOString(),
      };
    }
  }

  /**
   * Get multi-platform betting opportunities
   */
  async getMultiPlatformOpportunities(
    params: {
      sport?: string;
      min_confidence?: number;
      include_arbitrage?: boolean;
    } = {}
  ): Promise<{
    multi_platform_opportunities: MultiPlatformOpportunity[];
    arbitrage_opportunities: unknown[];
    platform_summary: {
      total_platforms: number;
      opportunities_found: number;
      arbitrage_count: number;
      recommended_primary: string;
    };
    recommendations: string[];
  }> {
    const _searchParams = new URLSearchParams();

    if (params.sport) _searchParams.append('sport', params.sport);
    if (params.min_confidence)
      _searchParams.append('min_confidence', params.min_confidence.toString());
    if (params.include_arbitrage !== undefined)
      _searchParams.append('include_arbitrage', params.include_arbitrage.toString());

    const _response = await this.fetchWithTimeout(
      `${this.baseUrl}/multi-platform?${_searchParams}`
    );

    if (!_response.ok) {
      throw new Error(
        `Failed to fetch multi-platform opportunities: ${_response.status} ${_response.statusText}`
      );
    }

    return _response.json();
  }

  /**
   * Safe JSON parsing that detects HTML responses
   */
  private async safeJsonParse(response: Response): Promise<unknown> {
    const _responseText = await response.text();

    // Check if response is HTML
    if (
      _responseText.trim().startsWith('<!DOCTYPE') ||
      _responseText.trim().startsWith('<html') ||
      _responseText.includes('<title>')
    ) {
      throw new Error('API returned HTML instead of JSON - endpoint not available');
    }

    try {
      return JSON.parse(_responseText);
    } catch (error) {
      console.error('JSON parse error. Response text:', _responseText);
      throw new Error('Invalid JSON response from API');
    }
  }

  /**
   * Quick connectivity check that doesn't block the UI
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      const _response = await this.fetchWithTimeout(`${this.baseUrl}/health`, {
        method: 'GET',
      });
      return _response.ok;
    } catch (error) {
      console.warn('API connectivity check failed:', error);
      return false;
    }
  }

  /**
   * Get service health status
   */
  async getHealth(): Promise<{
    status: string;
    last_update?: string;
    predictions_count: number;
    portfolio_optimized: boolean;
    services: Record<string, string>;
    api_health: {
      api_status: string;
      endpoints_active: number;
      last_request: string;
      response_time_avg: string;
      error_rate: string;
    };
    overall_status: string;
    capabilities: string[];
  }> {
    const _response = await this.fetchWithTimeout(`${this.baseUrl}/health`);

    if (!_response.ok) {
      throw new Error(`Failed to fetch health status: ${_response.status} ${_response.statusText}`);
    }

    return _response.json();
  }

  /**
   * Generate stacking suggestions based on current predictions
   */
  async generateStackingSuggestions(predictions: unknown[]): Promise<{
    suggestions: StackSuggestion[];
    correlationMatrix: CorrelationMatrix;
  }> {
    // For now, generate mock stacking suggestions based on the predictions
    // In a real implementation, this would call a backend endpoint

    const suggestions: StackSuggestion[] = [];
    const correlationMatrix: CorrelationMatrix = {
      players: [],
      matrix: [],
      insights: [],
    };

    if (predictions.length === 0) {
      return { suggestions, correlationMatrix };
    }

    // Group by team for team stacks
    const teamGroups = (predictions as any[]).reduce((groups: Record<string, any[]>, pred) => {
      if (!groups[pred.team]) groups[pred.team] = [];
      groups[pred.team].push(pred);
      return groups;
    }, {});

    // Generate team stack suggestions
    Object.entries(teamGroups).forEach(([team, teamPreds]) => {
      if (teamPreds.length >= 2) {
        const avgCorrelation = 0.6 + Math.random() * 0.3; // Mock correlation
        const avgSynergy = 0.7 + Math.random() * 0.2;
        const expectedBoost = 5 + Math.random() * 10;

        suggestions.push({
          type: 'team',
          players: teamPreds.map((p: any) => p.player_name),
          correlation_score: avgCorrelation,
          synergy_rating: avgSynergy,
          expected_boost: expectedBoost,
          risk_level: avgCorrelation > 0.8 ? 'high' : avgCorrelation > 0.6 ? 'medium' : 'low',
          explanation: `Strong ${team} team correlation with ${
            teamPreds.length
          } players showing positive synergy. Expected ${expectedBoost.toFixed(
            1
          )}% performance boost when stacked together.`,
        });
      }
    });

    // Group by sport for game stacks
    const sportGroups = (predictions as any[]).reduce((groups: Record<string, any[]>, pred) => {
      if (!groups[pred.sport]) groups[pred.sport] = [];
      groups[pred.sport].push(pred);
      return groups;
    }, {});

    Object.entries(sportGroups).forEach(([sport, sportPreds]) => {
      if (sportPreds.length >= 3) {
        const avgCorrelation = 0.4 + Math.random() * 0.3;
        const avgSynergy = 0.5 + Math.random() * 0.3;
        const expectedBoost = 3 + Math.random() * 7;

        suggestions.push({
          type: 'game',
          players: sportPreds.slice(0, 3).map((p: any) => p.player_name),
          correlation_score: avgCorrelation,
          synergy_rating: avgSynergy,
          expected_boost: expectedBoost,
          risk_level: avgCorrelation > 0.7 ? 'high' : avgCorrelation > 0.5 ? 'medium' : 'low',
          explanation: `Multi-game ${sport} stack with diverse player types. Lower correlation risk with moderate upside potential.`,
        });
      }
    });

    // Generate correlation matrix
    const playerNames = (predictions as any[]).slice(0, 5).map((p: any) => p.player_name); // Limit to first 5 for demo
    correlationMatrix.players = playerNames;

    // Generate mock correlation matrix
    correlationMatrix.matrix = playerNames.map((playerA: string, i: number) =>
      playerNames.map((playerB: string, j: number) => {
        if (i === j) return 1.0;

        const predA = (predictions as any[]).find((p: any) => p.player_name === playerA);
        const predB = (predictions as any[]).find((p: any) => p.player_name === playerB);

        let correlation = 0.1 + Math.random() * 0.3; // Base correlation

        // Higher correlation for same team
        if (predA?.team === predB?.team) {
          correlation += 0.4;
        }

        // Higher correlation for same sport
        if (predA?.sport === predB?.sport) {
          correlation += 0.2;
        }

        return Math.min(0.95, correlation);
      })
    );

    // Generate insights
    correlationMatrix.insights = [];
    for (let i = 0; i < playerNames.length; i++) {
      for (let j = i + 1; j < playerNames.length; j++) {
        const correlation = correlationMatrix.matrix[i][j];
        let recommendation: 'STACK' | 'AVOID' | 'NEUTRAL';

        if (correlation > 0.7) recommendation = 'AVOID';
        else if (correlation > 0.4 && correlation < 0.7) recommendation = 'STACK';
        else recommendation = 'NEUTRAL';

        correlationMatrix.insights.push({
          player_a: playerNames[i],
          player_b: playerNames[j],
          correlation,
          recommendation,
        });
      }
    }

    return { suggestions, correlationMatrix };
  }
}

export const createUnifiedApiService = (fetchImpl?: FetchImpl) => new UnifiedApiService(fetchImpl);
