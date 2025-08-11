// Integration Test Framework for Phase 4.2
const axios = require('axios');
const config = require('../config/testConfig');

class IntegrationTestFramework {
  constructor() {
    this.config = config;
    this.authToken = null;
    this.adminToken = null;
    this.baseURL = config.environment.baseURL;
    this.client = this.createClient();
    this.testResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      performance: {},
    };
  }

  createClient() {
    const client = axios.create({
      baseURL: this.baseURL,
      timeout: this.config.environment.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Request interceptor for authentication
    client.interceptors.request.use(
      (config) => {
        if (this.authToken && config.requiresAuth) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        if (this.adminToken && config.requiresAdmin) {
          config.headers.Authorization = `Bearer ${this.adminToken}`;
        }
        
        // Add request timing
        config.requestStartTime = Date.now();
        
        // Add correlation ID for tracking
        config.headers['X-Test-Correlation-ID'] = this.generateCorrelationId();
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for logging and metrics
    client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.requestStartTime;
        this.recordPerformance(response.config.url, response.config.method, duration);
        
        if (this.config.logging.includeResponseLogs) {
          this.log('info', `Response: ${response.status} ${response.config.method} ${response.config.url} (${duration}ms)`);
        }
        
        return response;
      },
      (error) => {
        const duration = error.config ? Date.now() - error.config.requestStartTime : 0;
        
        if (this.config.logging.includeErrorLogs) {
          this.log('error', `Error: ${error.response?.status || 'NETWORK'} ${error.config?.method} ${error.config?.url} (${duration}ms)`, {
            error: error.message,
            response: error.response?.data,
          });
        }
        
        return Promise.reject(error);
      }
    );

    return client;
  }

  generateCorrelationId() {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
    };

    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  recordPerformance(url, method, duration) {
    const key = `${method} ${url}`;
    if (!this.testResults.performance[key]) {
      this.testResults.performance[key] = {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0,
      };
    }

    const perf = this.testResults.performance[key];
    perf.count++;
    perf.totalTime += duration;
    perf.avgTime = perf.totalTime / perf.count;
    perf.minTime = Math.min(perf.minTime, duration);
    perf.maxTime = Math.max(perf.maxTime, duration);
  }

  async setupAuthentication() {
    this.log('info', 'Setting up authentication for integration tests');

    try {
      // Register and login test user
      await this.registerTestUser(this.config.auth.testUser);
      this.authToken = await this.loginUser(this.config.auth.testUser);

      // Register and login admin user
      await this.registerTestUser({ ...this.config.auth.adminUser, role: 'admin' });
      this.adminToken = await this.loginUser(this.config.auth.adminUser);

      this.log('info', 'Authentication setup completed');
    } catch (error) {
      this.log('error', 'Authentication setup failed', { error: error.message });
      throw error;
    }
  }

  async registerTestUser(userData) {
    try {
      const response = await this.client.post('/api/auth/register', userData);
      this.log('info', `Test user registered: ${userData.username}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 409) {
        this.log('info', `Test user already exists: ${userData.username}`);
        return null;
      }
      throw error;
    }
  }

  async loginUser(credentials) {
    try {
      const response = await this.client.post('/api/auth/login', credentials);
      this.log('info', `User logged in: ${credentials.username}`);
      return response.data.access_token;
    } catch (error) {
      this.log('error', `Login failed for: ${credentials.username}`, { error: error.message });
      throw error;
    }
  }

  async testEndpoint(endpointGroup, endpoint, testData = {}) {
    const startTime = Date.now();
    const testName = `${endpointGroup.toUpperCase()} ${endpoint.method} ${endpoint.path}`;
    
    try {
      this.log('info', `Testing: ${testName}`);

      // Prepare URL
      const baseURL = this.config.endpoints[endpointGroup].baseURL;
      let url = `${baseURL}${endpoint.path}`;
      
      // Replace path parameters
      url = this.replacePlaceholders(url, testData);

      // Prepare request config
      const requestConfig = {
        method: endpoint.method.toLowerCase(),
        url,
        requiresAuth: endpoint.requiresAuth,
        requiresAdmin: endpoint.requiresAdmin,
      };

      // Add request body for POST/PUT requests
      if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
        requestConfig.data = testData.body || this.getDefaultTestData(endpointGroup, endpoint);
      }

      // Add query parameters for GET requests
      if (endpoint.method === 'GET' && testData.params) {
        requestConfig.params = testData.params;
      }

      // Execute request
      const response = await this.client(requestConfig);

      // Validate response
      this.validateResponse(response, endpoint);

      // Record success
      this.testResults.passed++;
      const duration = Date.now() - startTime;
      
      this.log('info', `✅ PASSED: ${testName} (${duration}ms)`, {
        status: response.status,
        responseTime: duration,
      });

      return {
        success: true,
        response: response.data,
        status: response.status,
        duration,
      };

    } catch (error) {
      this.testResults.failed++;
      const duration = Date.now() - startTime;
      
      const errorInfo = {
        endpoint: testName,
        error: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
        duration,
      };

      this.testResults.errors.push(errorInfo);
      
      this.log('error', `❌ FAILED: ${testName} (${duration}ms)`, errorInfo);

      return {
        success: false,
        error: errorInfo,
        status: error.response?.status,
        duration,
      };
    }
  }

  replacePlaceholders(url, testData) {
    return url.replace(/{([^}]+)}/g, (match, key) => {
      return testData.pathParams?.[key] || this.getDefaultPlaceholderValue(key);
    });
  }

  getDefaultPlaceholderValue(key) {
    const defaults = {
      model_name: 'ensemble_v1',
      sport: 'NBA',
      player_name: 'LeBron James',
      prop_id: '12345',
      game_id: '67890',
      analysis_id: 'test_analysis_123',
    };
    return defaults[key] || 'default_value';
  }

  getDefaultTestData(endpointGroup, endpoint) {
    const defaultData = {
      auth: {
        register: this.config.testData.validUser,
        login: { 
          username: this.config.testData.validUser.username,
          password: this.config.testData.validUser.password 
        },
        'change-password': {
          current_password: this.config.testData.validUser.password,
          new_password: 'NewPassword123!'
        },
      },
      
      analytics: {
        'ensemble/predict': this.config.testData.samplePrediction,
        'performance/record': {
          model_name: 'test_model',
          sport: 'NBA',
          prediction: 25.5,
          actual: 27.0,
          accuracy: 0.94,
        },
      },

      ai: {
        explain: this.config.testData.samplePrediction,
        'analyze-prop': {
          player: 'LeBron James',
          prop_type: 'points',
          value: 25.5,
          context: 'Recent form analysis',
        },
        'player-summary': {
          player: 'LeBron James',
          sport: 'NBA',
          include_recent_games: true,
        },
      },

      prizepicks: {
        'lineup/optimize': this.config.testData.sampleLineup,
        'lineup/analysis': this.config.testData.sampleLineup,
        'props/{prop_id}/explain': {
          context: 'Why is this prop valuable?',
        },
      },

      unified: {
        analysis: this.config.testData.sampleAnalysisRequest,
        'batch-predictions': {
          predictions: [this.config.testData.samplePrediction],
        },
      },
    };

    const groupData = defaultData[endpointGroup];
    if (!groupData) return {};

    const endpointKey = endpoint.path.replace(/^\//, '');
    return groupData[endpointKey] || {};
  }

  validateResponse(response, endpoint) {
    // Validate status code
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Unexpected status code: ${response.status}`);
    }

    // Validate response structure based on endpoint
    if (endpoint.path === '/health' || endpoint.path.includes('/health')) {
      this.validateHealthResponse(response.data);
    }

    // Validate performance benchmarks
    const duration = Date.now() - response.config.requestStartTime;
    const expectedDuration = this.getExpectedResponseTime(endpoint);
    
    if (duration > expectedDuration) {
      this.log('warn', `Performance warning: ${endpoint.path} took ${duration}ms (expected <${expectedDuration}ms)`);
    }
  }

  validateHealthResponse(data) {
    if (!data.status) {
      throw new Error('Health response missing status field');
    }
    
    if (!['healthy', 'unhealthy'].includes(data.status)) {
      throw new Error(`Invalid health status: ${data.status}`);
    }
  }

  getExpectedResponseTime(endpoint) {
    if (endpoint.path.includes('/health')) {
      return this.config.performance.responseTime.health;
    }
    if (endpoint.path.includes('/auth')) {
      return this.config.performance.responseTime.auth;
    }
    if (endpoint.path.includes('/predict') || endpoint.path.includes('/analyze')) {
      return this.config.performance.responseTime.ml_prediction;
    }
    if (endpoint.path.includes('/analysis')) {
      return this.config.performance.responseTime.complex_analysis;
    }
    return this.config.performance.responseTime.simple_query;
  }

  async runEndpointTests(endpointGroups = null) {
    const groupsToTest = endpointGroups || Object.keys(this.config.endpoints);
    
    this.log('info', `Starting integration tests for endpoint groups: ${groupsToTest.join(', ')}`);

    for (const groupName of groupsToTest) {
      const group = this.config.endpoints[groupName];
      if (!group) {
        this.log('warn', `Endpoint group not found: ${groupName}`);
        continue;
      }

      this.log('info', `Testing endpoint group: ${groupName.toUpperCase()}`);

      for (const endpoint of group.endpoints) {
        // Skip admin endpoints if we don't have admin token
        if (endpoint.requiresAdmin && !this.adminToken) {
          this.log('warn', `Skipping admin endpoint: ${endpoint.path}`);
          this.testResults.skipped++;
          continue;
        }

        // Skip auth endpoints if we don't have auth token (except for registration/login)
        if (endpoint.requiresAuth && !this.authToken && 
            !['register', 'login'].some(path => endpoint.path.includes(path))) {
          this.log('warn', `Skipping authenticated endpoint: ${endpoint.path}`);
          this.testResults.skipped++;
          continue;
        }

        await this.testEndpoint(groupName, endpoint);
        
        // Add delay between requests to avoid rate limiting
        await this.delay(100);
      }
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateReport() {
    const totalTests = this.testResults.passed + this.testResults.failed + this.testResults.skipped;
    const successRate = totalTests > 0 ? (this.testResults.passed / totalTests * 100).toFixed(2) : 0;

    const report = {
      summary: {
        total: totalTests,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        skipped: this.testResults.skipped,
        successRate: `${successRate}%`,
      },
      performance: this.testResults.performance,
      errors: this.testResults.errors,
      timestamp: new Date().toISOString(),
    };

    this.log('info', '📊 Integration Test Report Generated', report.summary);
    
    if (this.testResults.errors.length > 0) {
      this.log('error', `❌ ${this.testResults.errors.length} test failures:`, this.testResults.errors);
    }

    return report;
  }

  async cleanup() {
    this.log('info', 'Cleaning up integration test environment');
    
    // Clear authentication tokens
    this.authToken = null;
    this.adminToken = null;
    
    // Additional cleanup can be added here
    this.log('info', 'Cleanup completed');
  }
}

module.exports = IntegrationTestFramework;
