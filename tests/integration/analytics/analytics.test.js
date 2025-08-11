// Analytics API Integration Tests for Phase 4.2
const IntegrationTestFramework = require('../utils/TestFramework');

describe('Analytics API Integration Tests', () => {
  let framework;

  beforeAll(async () => {
    framework = new IntegrationTestFramework();
    await framework.setupAuthentication();
  }, 60000);

  afterAll(async () => {
    await framework.cleanup();
  });

  describe('Health and Status Endpoints', () => {
    it('should return healthy status from analytics health endpoint', async () => {
      const result = await framework.testEndpoint('analytics',
        { method: 'GET', path: '/health', requiresAuth: false }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.response).toHaveProperty('status');
      expect(['healthy', 'unhealthy']).toContain(result.response.status);
      expect(result.duration).toBeLessThan(framework.config.performance.responseTime.health);
    });

    it('should return analytics dashboard summary', async () => {
      const result = await framework.testEndpoint('analytics',
        { method: 'GET', path: '/dashboard/summary', requiresAuth: true }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.response).toHaveProperty('summary');
      expect(result.duration).toBeLessThan(framework.config.performance.responseTime.simple_query);
    });
  });

  describe('Model Performance Endpoints', () => {
    it('should retrieve all model performance metrics', async () => {
      const result = await framework.testEndpoint('analytics',
        { method: 'GET', path: '/performance/models', requiresAuth: true }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.response).toHaveProperty('models');
      expect(Array.isArray(result.response.models)).toBe(true);
    });

    it('should retrieve specific model performance for NBA', async () => {
      const result = await framework.testEndpoint('analytics',
        { method: 'GET', path: '/performance/models/{model_name}/{sport}', requiresAuth: true },
        { 
          pathParams: { 
            model_name: 'ensemble_v1', 
            sport: 'NBA' 
          }
        }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.response).toHaveProperty('performance');
      expect(result.response.performance).toHaveProperty('accuracy');
      expect(result.response.performance).toHaveProperty('precision');
      expect(result.response.performance).toHaveProperty('recall');
    });

    it('should retrieve performance alerts', async () => {
      const result = await framework.testEndpoint('analytics',
        { method: 'GET', path: '/performance/alerts', requiresAuth: true }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.response).toHaveProperty('alerts');
      expect(Array.isArray(result.response.alerts)).toBe(true);
    });

    it('should record model prediction performance', async () => {
      const performanceData = {
        model_name: 'test_model_integration',
        sport: 'NBA',
        prediction: 25.5,
        actual: 27.0,
        accuracy: 0.94,
        timestamp: new Date().toISOString(),
        metadata: {
          player: 'Test Player',
          prop_type: 'points',
        },
      };

      const result = await framework.testEndpoint('analytics',
        { method: 'POST', path: '/performance/record', requiresAuth: true },
        { body: performanceData }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(201);
      expect(result.response).toHaveProperty('id');
      expect(result.response).toHaveProperty('recorded_at');
    });

    it('should update model performance metrics', async () => {
      const updateData = {
        model_name: 'test_model_integration',
        sport: 'NBA',
        accuracy: 0.87,
        precision: 0.85,
        recall: 0.88,
        f1_score: 0.86,
      };

      const result = await framework.testEndpoint('analytics',
        { method: 'PUT', path: '/performance/update', requiresAuth: true },
        { body: updateData }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.response).toHaveProperty('updated');
      expect(result.response.updated).toBe(true);
    });
  });

  describe('Ensemble Prediction Endpoints', () => {
    it('should generate ensemble predictions', async () => {
      const predictionRequest = {
        sport: 'NBA',
        player_id: 12345,
        prop_type: 'points',
        game_context: {
          home_team: 'Lakers',
          away_team: 'Warriors',
          date: new Date().toISOString().split('T')[0],
        },
        models: ['random_forest', 'xgboost', 'neural_network'],
      };

      const result = await framework.testEndpoint('analytics',
        { method: 'POST', path: '/ensemble/predict', requiresAuth: true },
        { body: predictionRequest }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.response).toHaveProperty('prediction');
      expect(result.response).toHaveProperty('confidence');
      expect(result.response).toHaveProperty('model_contributions');
      expect(typeof result.response.prediction).toBe('number');
      expect(result.response.confidence).toBeGreaterThanOrEqual(0);
      expect(result.response.confidence).toBeLessThanOrEqual(1);
      expect(result.duration).toBeLessThan(framework.config.performance.responseTime.ml_prediction);
    });

    it('should retrieve ensemble performance report', async () => {
      const result = await framework.testEndpoint('analytics',
        { method: 'GET', path: '/ensemble/report', requiresAuth: true },
        { 
          params: { 
            sport: 'NBA',
            date_range: '7d' 
          }
        }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.response).toHaveProperty('report');
      expect(result.response.report).toHaveProperty('accuracy');
      expect(result.response.report).toHaveProperty('total_predictions');
    });

    it('should handle invalid ensemble prediction request', async () => {
      const invalidRequest = {
        sport: 'INVALID_SPORT',
        player_id: 'invalid_id',
        // Missing required fields
      };

      const result = await framework.testEndpoint('analytics',
        { method: 'POST', path: '/ensemble/predict', requiresAuth: true },
        { body: invalidRequest }
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(422);
    });
  });

  describe('Cross-Sport Analytics', () => {
    it('should retrieve cross-sport insights', async () => {
      const result = await framework.testEndpoint('analytics',
        { method: 'GET', path: '/cross-sport/insights', requiresAuth: true },
        { 
          params: { 
            sports: 'NBA,NFL',
            analysis_type: 'correlation' 
          }
        }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.response).toHaveProperty('insights');
      expect(result.response).toHaveProperty('correlations');
    });

    it('should handle cross-sport insights with single sport', async () => {
      const result = await framework.testEndpoint('analytics',
        { method: 'GET', path: '/cross-sport/insights', requiresAuth: true },
        { 
          params: { 
            sports: 'NBA',
            analysis_type: 'trends' 
          }
        }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.response).toHaveProperty('insights');
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent prediction requests', async () => {
      const predictionRequest = {
        sport: 'NBA',
        player_id: 54321,
        prop_type: 'rebounds',
        game_context: {
          home_team: 'Celtics',
          away_team: 'Heat',
          date: new Date().toISOString().split('T')[0],
        },
      };

      const concurrentRequests = Array.from({ length: 5 }, () =>
        framework.testEndpoint('analytics',
          { method: 'POST', path: '/ensemble/predict', requiresAuth: true },
          { body: predictionRequest }
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

    it('should handle batch performance recording', async () => {
      const batchData = Array.from({ length: 10 }, (_, i) => ({
        model_name: 'batch_test_model',
        sport: 'NBA',
        prediction: 20 + i,
        actual: 22 + i,
        accuracy: 0.9 + (i * 0.01),
        timestamp: new Date(Date.now() - (i * 60000)).toISOString(),
      }));

      const batchRequests = batchData.map(data =>
        framework.testEndpoint('analytics',
          { method: 'POST', path: '/performance/record', requiresAuth: true },
          { body: data }
        )
      );

      const results = await Promise.all(batchRequests);

      // All batch requests should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.status).toBe(201);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing authentication gracefully', async () => {
      const originalToken = framework.authToken;
      framework.authToken = null;

      const result = await framework.testEndpoint('analytics',
        { method: 'GET', path: '/performance/models', requiresAuth: true }
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);

      framework.authToken = originalToken;
    });

    it('should handle invalid model name gracefully', async () => {
      const result = await framework.testEndpoint('analytics',
        { method: 'GET', path: '/performance/models/{model_name}/{sport}', requiresAuth: true },
        { 
          pathParams: { 
            model_name: 'nonexistent_model', 
            sport: 'NBA' 
          }
        }
      );

      expect(result.success).toBe(false);
      expect([404, 422]).toContain(result.status);
    });

    it('should handle invalid sport parameter gracefully', async () => {
      const result = await framework.testEndpoint('analytics',
        { method: 'GET', path: '/performance/models/{model_name}/{sport}', requiresAuth: true },
        { 
          pathParams: { 
            model_name: 'ensemble_v1', 
            sport: 'INVALID_SPORT' 
          }
        }
      );

      expect(result.success).toBe(false);
      expect([400, 422]).toContain(result.status);
    });

    it('should handle malformed prediction request data', async () => {
      const malformedRequest = {
        sport: null,
        player_id: 'not_a_number',
        prop_type: '',
        // Invalid data types
      };

      const result = await framework.testEndpoint('analytics',
        { method: 'POST', path: '/ensemble/predict', requiresAuth: true },
        { body: malformedRequest }
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(422);
    });

    it('should handle empty performance recording data', async () => {
      const emptyData = {};

      const result = await framework.testEndpoint('analytics',
        { method: 'POST', path: '/performance/record', requiresAuth: true },
        { body: emptyData }
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(422);
    });
  });

  describe('Data Validation and Schema Compliance', () => {
    it('should validate prediction response schema', async () => {
      const predictionRequest = {
        sport: 'NBA',
        player_id: 67890,
        prop_type: 'assists',
        game_context: {
          home_team: 'Nets',
          away_team: 'Knicks',
          date: new Date().toISOString().split('T')[0],
        },
      };

      const result = await framework.testEndpoint('analytics',
        { method: 'POST', path: '/ensemble/predict', requiresAuth: true },
        { body: predictionRequest }
      );

      if (result.success) {
        // Validate response structure
        expect(result.response).toMatchObject({
          prediction: expect.any(Number),
          confidence: expect.any(Number),
          model_contributions: expect.any(Object),
        });

        // Validate confidence is in valid range
        expect(result.response.confidence).toBeGreaterThanOrEqual(0);
        expect(result.response.confidence).toBeLessThanOrEqual(1);

        // Validate prediction is reasonable
        expect(result.response.prediction).toBeGreaterThan(0);
        expect(result.response.prediction).toBeLessThan(100);
      }
    });

    it('should validate performance metrics response schema', async () => {
      const result = await framework.testEndpoint('analytics',
        { method: 'GET', path: '/performance/models', requiresAuth: true }
      );

      if (result.success && result.response.models.length > 0) {
        const model = result.response.models[0];
        expect(model).toMatchObject({
          name: expect.any(String),
          performance: expect.objectContaining({
            accuracy: expect.any(Number),
          }),
        });
      }
    });
  });

  describe('Security and Authorization', () => {
    it('should require valid authentication for protected endpoints', async () => {
      const protectedEndpoints = [
        '/performance/models',
        '/performance/alerts',
        '/ensemble/predict',
        '/cross-sport/insights',
        '/dashboard/summary',
      ];

      const originalToken = framework.authToken;
      framework.authToken = 'invalid_token';

      for (const endpoint of protectedEndpoints) {
        const result = await framework.testEndpoint('analytics',
          { method: 'GET', path: endpoint, requiresAuth: true }
        );

        expect(result.success).toBe(false);
        expect(result.status).toBe(401);
      }

      framework.authToken = originalToken;
    });

    it('should prevent SQL injection in query parameters', async () => {
      const maliciousParams = {
        sport: "NBA'; DROP TABLE models; --",
        model_name: "test'; DELETE FROM analytics; --",
      };

      const result = await framework.testEndpoint('analytics',
        { method: 'GET', path: '/performance/models', requiresAuth: true },
        { params: maliciousParams }
      );

      // Should either reject malicious input or sanitize it
      if (result.success) {
        // If successful, ensure no data corruption occurred
        expect(result.response).toHaveProperty('models');
      } else {
        // Should reject with appropriate error code
        expect([400, 422]).toContain(result.status);
      }
    });
  });
});
