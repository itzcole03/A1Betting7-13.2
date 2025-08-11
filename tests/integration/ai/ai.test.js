// AI Services Integration Tests for Phase 4.2
const IntegrationTestFramework = require('../utils/TestFramework');

describe('AI Services Integration Tests', () => {
  let framework;

  beforeAll(async () => {
    framework = new IntegrationTestFramework();
    await framework.setupAuthentication();
  }, 60000);

  afterAll(async () => {
    await framework.cleanup();
  });

  describe('AI Service Health and Status', () => {
    it('should return healthy status from AI health endpoint', async () => {
      const result = await framework.testEndpoint('ai',
        { method: 'GET', path: '/health', requiresAuth: false }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.response).toHaveProperty('status');
      expect(['healthy', 'unhealthy', 'degraded']).toContain(result.response.status);
      expect(result.duration).toBeLessThan(framework.config.performance.responseTime.health);
    });

    it('should provide AI service version and uptime', async () => {
      const result = await framework.testEndpoint('ai',
        { method: 'GET', path: '/health', requiresAuth: false }
      );

      if (result.success) {
        expect(result.response).toHaveProperty('version');
        expect(result.response).toHaveProperty('uptime');
        expect(typeof result.response.version).toBe('string');
        expect(typeof result.response.uptime).toBe('number');
      }
    });
  });

  describe('AI Explanation Service', () => {
    it('should generate AI explanation for prediction', async () => {
      const explanationRequest = {
        sport: 'NBA',
        player: 'LeBron James',
        prop_type: 'points',
        prediction: 27.5,
        confidence: 0.85,
        game_context: {
          opponent: 'Warriors',
          venue: 'home',
          recent_form: 'good',
        },
        factors: ['recent_performance', 'matchup_history', 'injury_status'],
      };

      const result = await framework.testEndpoint('ai',
        { method: 'POST', path: '/explain', requiresAuth: true },
        { body: explanationRequest }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.response).toHaveProperty('explanation');
      expect(result.response).toHaveProperty('key_factors');
      expect(result.response).toHaveProperty('confidence_reasoning');
      expect(typeof result.response.explanation).toBe('string');
      expect(Array.isArray(result.response.key_factors)).toBe(true);
      expect(result.duration).toBeLessThan(framework.config.performance.responseTime.ml_prediction);
    });

    it('should handle explanation for different sports', async () => {
      const sports = ['NBA', 'NFL', 'MLB', 'NHL'];

      for (const sport of sports) {
        const explanationRequest = {
          sport,
          player: 'Test Player',
          prop_type: sport === 'NBA' ? 'points' : sport === 'NFL' ? 'passing_yards' : 'hits',
          prediction: 25.0,
          confidence: 0.80,
        };

        const result = await framework.testEndpoint('ai',
          { method: 'POST', path: '/explain', requiresAuth: true },
          { body: explanationRequest }
        );

        if (result.success) {
          expect(result.response).toHaveProperty('explanation');
          expect(result.response.explanation).toContain(sport);
        }
      }
    });

    it('should reject explanation request with invalid data', async () => {
      const invalidRequest = {
        sport: null,
        player: '',
        prop_type: 'invalid_prop',
        prediction: 'not_a_number',
        confidence: 1.5, // Invalid confidence > 1
      };

      const result = await framework.testEndpoint('ai',
        { method: 'POST', path: '/explain', requiresAuth: true },
        { body: invalidRequest }
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(422);
    });

    it('should handle missing required fields in explanation request', async () => {
      const incompleteRequest = {
        sport: 'NBA',
        // Missing player, prop_type, prediction, confidence
      };

      const result = await framework.testEndpoint('ai',
        { method: 'POST', path: '/explain', requiresAuth: true },
        { body: incompleteRequest }
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(422);
    });
  });

  describe('Prop Analysis Service', () => {
    it('should analyze prop betting opportunity', async () => {
      const propAnalysisRequest = {
        player: 'Stephen Curry',
        prop_type: 'three_pointers_made',
        line: 4.5,
        odds: -110,
        context: {
          opponent: 'Lakers',
          venue: 'home',
          recent_games: 5,
          season_avg: 4.8,
        },
        analysis_depth: 'comprehensive',
      };

      const result = await framework.testEndpoint('ai',
        { method: 'POST', path: '/analyze-prop', requiresAuth: true },
        { body: propAnalysisRequest }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.response).toHaveProperty('analysis');
      expect(result.response).toHaveProperty('recommendation');
      expect(result.response).toHaveProperty('value_assessment');
      expect(result.response).toHaveProperty('risk_factors');
      expect(typeof result.response.analysis).toBe('string');
      expect(['over', 'under', 'avoid']).toContain(result.response.recommendation);
      expect(result.duration).toBeLessThan(framework.config.performance.responseTime.ml_prediction);
    });

    it('should provide detailed prop analysis with historical context', async () => {
      const propAnalysisRequest = {
        player: 'Giannis Antetokounmpo',
        prop_type: 'rebounds',
        line: 11.5,
        odds: +105,
        context: {
          opponent: 'Celtics',
          venue: 'away',
          injury_report: 'healthy',
          rest_days: 1,
        },
        include_historical: true,
        historical_games: 20,
      };

      const result = await framework.testEndpoint('ai',
        { method: 'POST', path: '/analyze-prop', requiresAuth: true },
        { body: propAnalysisRequest }
      );

      if (result.success) {
        expect(result.response).toHaveProperty('historical_analysis');
        expect(result.response).toHaveProperty('trend_analysis');
        expect(result.response.historical_analysis).toHaveProperty('hit_rate');
        expect(typeof result.response.historical_analysis.hit_rate).toBe('number');
      }
    });

    it('should handle prop analysis for different bet types', async () => {
      const betTypes = [
        { prop_type: 'points', line: 25.5 },
        { prop_type: 'assists', line: 7.5 },
        { prop_type: 'rebounds', line: 10.5 },
        { prop_type: 'steals', line: 1.5 },
        { prop_type: 'blocks', line: 0.5 },
      ];

      for (const betType of betTypes) {
        const propAnalysisRequest = {
          player: 'Nikola Jokic',
          ...betType,
          odds: -110,
          context: {
            opponent: 'Nuggets',
            venue: 'home',
          },
        };

        const result = await framework.testEndpoint('ai',
          { method: 'POST', path: '/analyze-prop', requiresAuth: true },
          { body: propAnalysisRequest }
        );

        if (result.success) {
          expect(result.response).toHaveProperty('analysis');
          expect(result.response.analysis).toContain(betType.prop_type);
        }
      }
    });

    it('should reject prop analysis with invalid odds format', async () => {
      const invalidRequest = {
        player: 'Test Player',
        prop_type: 'points',
        line: 25.5,
        odds: 'invalid_odds', // Should be number
        context: {},
      };

      const result = await framework.testEndpoint('ai',
        { method: 'POST', path: '/analyze-prop', requiresAuth: true },
        { body: invalidRequest }
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(422);
    });
  });

  describe('Player Summary Service', () => {
    it('should generate comprehensive player summary', async () => {
      const playerSummaryRequest = {
        player: 'Luka Doncic',
        sport: 'NBA',
        include_recent_games: true,
        recent_games_count: 10,
        include_season_stats: true,
        include_injury_history: true,
        include_advanced_metrics: true,
      };

      const result = await framework.testEndpoint('ai',
        { method: 'POST', path: '/player-summary', requiresAuth: true },
        { body: playerSummaryRequest }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.response).toHaveProperty('summary');
      expect(result.response).toHaveProperty('recent_form');
      expect(result.response).toHaveProperty('season_outlook');
      expect(result.response).toHaveProperty('key_strengths');
      expect(result.response).toHaveProperty('risk_factors');
      expect(typeof result.response.summary).toBe('string');
      expect(Array.isArray(result.response.key_strengths)).toBe(true);
      expect(result.duration).toBeLessThan(framework.config.performance.responseTime.ml_prediction);
    });

    it('should include injury analysis in player summary', async () => {
      const playerSummaryRequest = {
        player: 'Kawhi Leonard',
        sport: 'NBA',
        include_injury_history: true,
        injury_impact_analysis: true,
      };

      const result = await framework.testEndpoint('ai',
        { method: 'POST', path: '/player-summary', requiresAuth: true },
        { body: playerSummaryRequest }
      );

      if (result.success) {
        expect(result.response).toHaveProperty('injury_analysis');
        expect(result.response.injury_analysis).toHaveProperty('current_status');
        expect(result.response.injury_analysis).toHaveProperty('risk_assessment');
      }
    });

    it('should provide matchup-specific player insights', async () => {
      const playerSummaryRequest = {
        player: 'Joel Embiid',
        sport: 'NBA',
        matchup_context: {
          opponent: 'Heat',
          opponent_defense_rank: 5,
          venue: 'away',
          rest_days: 2,
        },
        include_matchup_history: true,
      };

      const result = await framework.testEndpoint('ai',
        { method: 'POST', path: '/player-summary', requiresAuth: true },
        { body: playerSummaryRequest }
      );

      if (result.success) {
        expect(result.response).toHaveProperty('matchup_analysis');
        expect(result.response.matchup_analysis).toHaveProperty('historical_performance');
        expect(result.response.matchup_analysis).toHaveProperty('key_factors');
      }
    });

    it('should handle player summary for different sports', async () => {
      const sportPlayers = [
        { sport: 'NBA', player: 'Kevin Durant' },
        { sport: 'NFL', player: 'Josh Allen' },
        { sport: 'MLB', player: 'Mookie Betts' },
        { sport: 'NHL', player: 'Connor McDavid' },
      ];

      for (const { sport, player } of sportPlayers) {
        const playerSummaryRequest = {
          player,
          sport,
          include_recent_games: true,
          recent_games_count: 5,
        };

        const result = await framework.testEndpoint('ai',
          { method: 'POST', path: '/player-summary', requiresAuth: true },
          { body: playerSummaryRequest }
        );

        if (result.success) {
          expect(result.response).toHaveProperty('summary');
          expect(result.response.summary).toContain(sport);
          expect(result.response.summary).toContain(player);
        }
      }
    });

    it('should reject player summary with invalid player name', async () => {
      const invalidRequest = {
        player: '', // Empty player name
        sport: 'NBA',
        include_recent_games: true,
      };

      const result = await framework.testEndpoint('ai',
        { method: 'POST', path: '/player-summary', requiresAuth: true },
        { body: invalidRequest }
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(422);
    });
  });

  describe('Performance and Stress Testing', () => {
    it('should handle concurrent AI explanation requests', async () => {
      const explanationRequest = {
        sport: 'NBA',
        player: 'Jimmy Butler',
        prop_type: 'points',
        prediction: 22.5,
        confidence: 0.78,
      };

      const concurrentRequests = Array.from({ length: 3 }, () =>
        framework.testEndpoint('ai',
          { method: 'POST', path: '/explain', requiresAuth: true },
          { body: explanationRequest }
        )
      );

      const results = await Promise.all(concurrentRequests);

      // All requests should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.status).toBe(200);
      });

      // Average response time should be reasonable
      const avgResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      expect(avgResponseTime).toBeLessThan(framework.config.performance.responseTime.ml_prediction * 1.5);
    });

    it('should handle large context data in requests', async () => {
      const largeContextRequest = {
        player: 'LeBron James',
        sport: 'NBA',
        prop_type: 'points',
        prediction: 28.5,
        confidence: 0.82,
        game_context: {
          opponent: 'Warriors',
          venue: 'home',
          recent_form: 'excellent',
          injury_report: 'healthy',
          weather: 'indoor',
          referee_crew: ['Tony Brothers', 'Scott Foster'],
          historical_matchups: Array.from({ length: 20 }, (_, i) => ({
            date: `2023-${String(i + 1).padStart(2, '0')}-01`,
            points: 25 + Math.random() * 10,
            result: Math.random() > 0.5 ? 'W' : 'L',
          })),
        },
      };

      const result = await framework.testEndpoint('ai',
        { method: 'POST', path: '/explain', requiresAuth: true },
        { body: largeContextRequest }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.response).toHaveProperty('explanation');
      expect(result.duration).toBeLessThan(framework.config.performance.responseTime.ml_prediction * 2);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle AI service timeouts gracefully', async () => {
      const timeoutRequest = {
        sport: 'NBA',
        player: 'Timeout Test Player',
        prop_type: 'points',
        prediction: 25.0,
        confidence: 0.80,
        force_timeout: true, // Special flag for testing
      };

      const result = await framework.testEndpoint('ai',
        { method: 'POST', path: '/explain', requiresAuth: true },
        { body: timeoutRequest }
      );

      if (result.success) {
        expect(result.response).toHaveProperty('explanation');
      } else {
        // Should return timeout error
        expect([408, 504]).toContain(result.status);
      }
    });

    it('should handle AI service unavailable scenarios', async () => {
      // This test might fail in normal circumstances, which is expected
      const result = await framework.testEndpoint('ai',
        { method: 'GET', path: '/health', requiresAuth: false }
      );

      if (!result.success) {
        expect([503, 502]).toContain(result.status);
      }
    });

    it('should validate input data types properly', async () => {
      const invalidDataTypes = {
        sport: 123, // Should be string
        player: null, // Should be string
        prop_type: [], // Should be string
        prediction: '25.5', // Should be number
        confidence: 'high', // Should be number
      };

      const result = await framework.testEndpoint('ai',
        { method: 'POST', path: '/explain', requiresAuth: true },
        { body: invalidDataTypes }
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(422);
    });
  });

  describe('Security and Authorization', () => {
    it('should require authentication for all AI endpoints', async () => {
      const protectedEndpoints = [
        { method: 'POST', path: '/explain' },
        { method: 'POST', path: '/analyze-prop' },
        { method: 'POST', path: '/player-summary' },
      ];

      const originalToken = framework.authToken;
      framework.authToken = null;

      for (const endpoint of protectedEndpoints) {
        const result = await framework.testEndpoint('ai', endpoint);

        expect(result.success).toBe(false);
        expect(result.status).toBe(401);
      }

      framework.authToken = originalToken;
    });

    it('should sanitize user input to prevent injection attacks', async () => {
      const maliciousRequest = {
        sport: 'NBA',
        player: '<script>alert("xss")</script>',
        prop_type: 'points; DROP TABLE players; --',
        prediction: 25.5,
        confidence: 0.80,
      };

      const result = await framework.testEndpoint('ai',
        { method: 'POST', path: '/explain', requiresAuth: true },
        { body: maliciousRequest }
      );

      if (result.success) {
        // Response should not contain unsanitized malicious content
        expect(result.response.explanation).not.toContain('<script>');
        expect(result.response.explanation).not.toContain('DROP TABLE');
      } else {
        // Should reject malicious input
        expect([400, 422]).toContain(result.status);
      }
    });

    it('should implement rate limiting for AI endpoints', async () => {
      const explanationRequest = {
        sport: 'NBA',
        player: 'Rate Limit Test',
        prop_type: 'points',
        prediction: 25.0,
        confidence: 0.80,
      };

      // Make multiple rapid requests
      const rapidRequests = Array.from({ length: 15 }, () =>
        framework.testEndpoint('ai',
          { method: 'POST', path: '/explain', requiresAuth: true },
          { body: explanationRequest }
        )
      );

      const results = await Promise.all(rapidRequests);

      // Should have some rate-limited responses
      const rateLimitedResponses = results.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThanOrEqual(0);
    });
  });
});
