// Integration Testing Configuration for Phase 4.2
const config = {
  // Test Environment Configuration
  environment: {
    baseURL: process.env.TEST_API_URL || 'http://localhost:8000',
    timeout: 30000,
    retries: 3,
    parallel: true,
    maxConcurrent: 5,
  },

  // Authentication Configuration
  auth: {
    testUser: {
      username: 'test_user_integration',
      email: 'integration_test@a1betting.com',
      password: 'TestPassword123!',
    },
    adminUser: {
      username: 'admin_integration',
      email: 'admin_test@a1betting.com', 
      password: 'AdminPassword123!',
    },
    tokenRefreshThreshold: 300, // 5 minutes
  },

  // API Endpoint Groups for Testing
  endpoints: {
    auth: {
      baseURL: '/api/auth',
      endpoints: [
        { method: 'POST', path: '/register', requiresAuth: false },
        { method: 'POST', path: '/login', requiresAuth: false },
        { method: 'POST', path: '/refresh', requiresAuth: true },
        { method: 'GET', path: '/me', requiresAuth: true },
        { method: 'PUT', path: '/profile', requiresAuth: true },
        { method: 'POST', path: '/change-password', requiresAuth: true },
        { method: 'POST', path: '/reset-password', requiresAuth: false },
        { method: 'POST', path: '/verify-email', requiresAuth: false },
      ],
    },

    analytics: {
      baseURL: '/analytics',
      endpoints: [
        { method: 'GET', path: '/health', requiresAuth: false },
        { method: 'GET', path: '/performance/models', requiresAuth: true },
        { method: 'GET', path: '/performance/models/{model_name}/{sport}', requiresAuth: true },
        { method: 'GET', path: '/performance/alerts', requiresAuth: true },
        { method: 'POST', path: '/ensemble/predict', requiresAuth: true },
        { method: 'GET', path: '/ensemble/report', requiresAuth: true },
        { method: 'GET', path: '/cross-sport/insights', requiresAuth: true },
        { method: 'GET', path: '/dashboard/summary', requiresAuth: true },
        { method: 'POST', path: '/performance/record', requiresAuth: true },
        { method: 'PUT', path: '/performance/update', requiresAuth: true },
      ],
    },

    ai: {
      baseURL: '/v1/ai',
      endpoints: [
        { method: 'GET', path: '/health', requiresAuth: false },
        { method: 'POST', path: '/explain', requiresAuth: true },
        { method: 'POST', path: '/analyze-prop', requiresAuth: true },
        { method: 'POST', path: '/player-summary', requiresAuth: true },
      ],
    },

    betting: {
      baseURL: '/api',
      endpoints: [
        { method: 'GET', path: '/betting-opportunities', requiresAuth: true },
        { method: 'GET', path: '/arbitrage-opportunities', requiresAuth: true },
        { method: 'GET', path: '/risk-profiles', requiresAuth: true },
      ],
    },

    prizepicks: {
      baseURL: '/api/v1/prizepicks',
      endpoints: [
        { method: 'GET', path: '/props', requiresAuth: true },
        { method: 'GET', path: '/recommendations', requiresAuth: true },
        { method: 'GET', path: '/comprehensive-projections', requiresAuth: true },
        { method: 'POST', path: '/lineup/optimize', requiresAuth: true },
        { method: 'GET', path: '/lineup/optimal', requiresAuth: true },
        { method: 'GET', path: '/lineup/analysis', requiresAuth: true },
        { method: 'GET', path: '/trends', requiresAuth: true },
        { method: 'POST', path: '/props/{prop_id}/explain', requiresAuth: true },
        { method: 'GET', path: '/props/enhanced', requiresAuth: true },
        { method: 'GET', path: '/props/legacy', requiresAuth: true },
        { method: 'GET', path: '/health', requiresAuth: false },
        { method: 'POST', path: '/heal', requiresAuth: true, requiresAdmin: true },
      ],
    },

    odds: {
      baseURL: '/v1/odds',
      endpoints: [
        { method: 'GET', path: '/bookmakers', requiresAuth: true },
        { method: 'GET', path: '/compare', requiresAuth: true },
        { method: 'GET', path: '/arbitrage', requiresAuth: true },
        { method: 'GET', path: '/player/{player_name}', requiresAuth: true },
        { method: 'GET', path: '/health', requiresAuth: false },
      ],
    },

    unified: {
      baseURL: '',
      endpoints: [
        { method: 'POST', path: '/analysis', requiresAuth: true },
        { method: 'GET', path: '/props/featured', requiresAuth: true },
        { method: 'GET', path: '/predictions/mlb', requiresAuth: true },
        { method: 'POST', path: '/unified/batch-predictions', requiresAuth: true },
        { method: 'GET', path: '/insights/ai', requiresAuth: true },
        { method: 'GET', path: '/game/{game_id}/analyze', requiresAuth: true },
        { method: 'GET', path: '/platform-recommendations', requiresAuth: true },
        { method: 'GET', path: '/health', requiresAuth: false },
      ],
    },

    health: {
      baseURL: '',
      endpoints: [
        { method: 'GET', path: '/version', requiresAuth: false },
        { method: 'GET', path: '/status', requiresAuth: true, requiresAdmin: true },
        { method: 'GET', path: '/model/{model_name}/health', requiresAuth: true, requiresAdmin: true },
        { method: 'GET', path: '/queue/status', requiresAuth: true, requiresAdmin: true },
      ],
    },

    admin: {
      baseURL: '/admin',
      endpoints: [
        { method: 'GET', path: '/rules-audit-log', requiresAuth: true, requiresAdmin: true },
        { method: 'POST', path: '/reload-business-rules', requiresAuth: true, requiresAdmin: true },
      ],
    },
  },

  // Test Data Templates
  testData: {
    validUser: {
      username: 'valid_test_user',
      email: 'valid@test.com',
      password: 'ValidPassword123!',
    },

    invalidUser: {
      username: '',
      email: 'invalid-email',
      password: '123',
    },

    samplePrediction: {
      sport: 'NBA',
      player_id: 1,
      prop_type: 'points',
      value: 25.5,
      confidence: 0.85,
    },

    sampleLineup: {
      sport: 'NBA',
      players: [
        { player_id: 1, prop_type: 'points', value: 25.5 },
        { player_id: 2, prop_type: 'rebounds', value: 8.5 },
        { player_id: 3, prop_type: 'assists', value: 6.5 },
      ],
    },

    sampleAnalysisRequest: {
      sport: 'NBA',
      date: new Date().toISOString().split('T')[0],
      analysis_type: 'comprehensive',
      include_arbitrage: true,
      include_lineups: true,
    },
  },

  // Expected Response Schemas
  schemas: {
    user: {
      type: 'object',
      required: ['id', 'username', 'email'],
      properties: {
        id: { type: 'number' },
        username: { type: 'string' },
        email: { type: 'string', format: 'email' },
        role: { type: 'string', enum: ['user', 'admin', 'premium'] },
      },
    },

    authResponse: {
      type: 'object',
      required: ['access_token', 'user'],
      properties: {
        access_token: { type: 'string' },
        refresh_token: { type: 'string' },
        user: { $ref: '#/schemas/user' },
      },
    },

    healthResponse: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: ['healthy', 'unhealthy'] },
        timestamp: { type: 'string' },
        version: { type: 'string' },
        uptime: { type: 'number' },
      },
    },

    predictionResponse: {
      type: 'object',
      required: ['prediction', 'confidence'],
      properties: {
        prediction: { type: 'number' },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        reasoning: { type: 'string' },
        factors: { type: 'array' },
      },
    },

    errorResponse: {
      type: 'object',
      required: ['error'],
      properties: {
        error: { type: 'string' },
        details: { type: 'object' },
        timestamp: { type: 'string' },
        request_id: { type: 'string' },
      },
    },
  },

  // Performance Benchmarks
  performance: {
    responseTime: {
      health: 100, // ms
      auth: 500,
      simple_query: 1000,
      complex_analysis: 5000,
      ml_prediction: 3000,
    },

    throughput: {
      concurrent_users: 50,
      requests_per_second: 100,
      max_queue_time: 2000,
    },
  },

  // Error Handling Configuration
  errorHandling: {
    expectedErrors: [
      { status: 400, description: 'Bad Request' },
      { status: 401, description: 'Unauthorized' },
      { status: 403, description: 'Forbidden' },
      { status: 404, description: 'Not Found' },
      { status: 422, description: 'Validation Error' },
      { status: 429, description: 'Rate Limited' },
      { status: 500, description: 'Internal Server Error' },
      { status: 503, description: 'Service Unavailable' },
    ],

    retryableErrors: [429, 500, 502, 503, 504],
    
    timeoutErrors: {
      connection: 5000,
      response: 30000,
    },
  },

  // Database Configuration for Integration Tests
  database: {
    testDatabase: 'a1betting_test',
    cleanupAfterTests: true,
    seedData: true,
    isolateTests: true,
  },

  // External Services Configuration
  externalServices: {
    mock: true, // Use mocked external services for integration tests
    services: {
      prizepicks: { mock: true, timeout: 5000 },
      sportsradar: { mock: true, timeout: 3000 },
      theodds: { mock: true, timeout: 3000 },
      ollama: { mock: true, timeout: 10000 },
    },
  },

  // Logging Configuration
  logging: {
    level: 'info',
    includeRequestLogs: true,
    includeResponseLogs: false,
    includeErrorLogs: true,
    logFile: 'tests/integration/logs/integration-tests.log',
  },

  // Coverage and Reporting
  reporting: {
    coverage: {
      enabled: true,
      threshold: 85,
      includeUntested: true,
    },
    
    performance: {
      enabled: true,
      trackResponseTimes: true,
      trackThroughput: true,
      generateReport: true,
    },

    outputFormats: ['json', 'html', 'junit'],
    outputPath: 'tests/integration/reports',
  },
};

module.exports = config;
