/**
 * K6 Load Test Script for A1Betting Performance Optimization
 * 
 * Tests sports activation workflow and baseline inference throughput
 * including cache performance, pagination, and virtualization scenarios
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const cacheHitRate = new Rate('cache_hits');
const inferenceLatency = new Trend('inference_latency');
const paginationLatency = new Trend('pagination_latency');
const cacheMissCounter = new Counter('cache_misses');
const activationTime = new Trend('sports_activation_time');

// Test configuration
export const options = {
  scenarios: {
    // Baseline sports activation test
    sports_activation: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },  // Ramp up to 10 users
        { duration: '1m', target: 10 },   // Stay at 10 users
        { duration: '30s', target: 20 },  // Ramp to 20 users
        { duration: '2m', target: 20 },   // Stay at 20 users
        { duration: '30s', target: 0 },   // Ramp down
      ],
      env: { SCENARIO: 'sports_activation' },
    },

    // Inference throughput test
    inference_throughput: {
      executor: 'constant-arrival-rate',
      rate: 30, // 30 requests per second
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 50,
      maxVUs: 100,
      env: { SCENARIO: 'inference_throughput' },
      startTime: '4m', // Start after sports activation test
    },

    // Cache performance test
    cache_performance: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '1m', target: 15 },
        { duration: '30s', target: 0 },
      ],
      env: { SCENARIO: 'cache_performance' },
      startTime: '7m', // Start after inference test
    },

    // Pagination stress test
    pagination_stress: {
      executor: 'constant-vus',
      vus: 10,
      duration: '1m',
      env: { SCENARIO: 'pagination_stress' },
      startTime: '9m',
    },
  },

  thresholds: {
    // Overall performance thresholds
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
    
    // Specific metric thresholds
    'inference_latency': ['p(95)<1500'], // Inference under 1.5s
    'pagination_latency': ['p(95)<800'], // Pagination under 800ms
    'sports_activation_time': ['p(95)<3000'], // Activation under 3s
    'cache_hits': ['rate>0.7'], // Cache hit rate over 70%
  },
};

// Base URL for the application
const BASE_URL = 'http://127.0.0.1:8000';
const FRONTEND_URL = 'http://localhost:5173';

// Test data
const SPORTS = ['MLB', 'NBA', 'NFL', 'NHL'];
const GAME_IDS = [776879, 776880, 776881, 776882]; // Sample game IDs

export default function() {
  const scenario = __ENV.SCENARIO;
  
  switch (scenario) {
    case 'sports_activation':
      testSportsActivation();
      break;
    case 'inference_throughput':
      testInferenceThroughput();
      break;
    case 'cache_performance':
      testCachePerformance();
      break;
    case 'pagination_stress':
      testPaginationStress();
      break;
    default:
      testSportsActivation();
  }
  
  sleep(1);
}

/**
 * Test sports activation workflow
 * Measures time from activation to first prop data
 */
function testSportsActivation() {
  const sport = SPORTS[Math.floor(Math.random() * SPORTS.length)];
  const startTime = new Date().getTime();
  
  // Step 1: Activate sport
  const activationResponse = http.post(
    `${BASE_URL}/api/sports/activate/${sport}`,
    null,
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'sports_activation' },
    }
  );
  
  const activationSuccess = check(activationResponse, {
    'sports activation successful': (r) => r.status === 200,
    'activation response time OK': (r) => r.timings.duration < 3000,
  });
  
  if (!activationSuccess) {
    errorRate.add(1);
    return;
  }
  
  // Step 2: Get today's games (should be cached after first activation)
  const gamesResponse = http.get(
    `${BASE_URL}/mlb/todays-games`,
    {
      headers: { 'Cache-Control': 'max-age=300' },
      tags: { name: 'todays_games' },
    }
  );
  
  const gamesSuccess = check(gamesResponse, {
    'games fetch successful': (r) => r.status === 200,
    'games response time OK': (r) => r.timings.duration < 2000,
    'has games data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.games && Array.isArray(data.games) && data.games.length > 0;
      } catch {
        return false;
      }
    },
  });
  
  // Check for cache headers
  const hasCacheHeaders = gamesResponse.headers['Cache-Control'] || 
                         gamesResponse.headers['ETag'];
  if (hasCacheHeaders) {
    cacheHitRate.add(1);
  }
  
  if (!gamesSuccess) {
    errorRate.add(1);
    return;
  }
  
  // Step 3: Get comprehensive props for first game
  const games = JSON.parse(gamesResponse.body).games;
  if (games.length > 0) {
    const gameId = games[0].game_id;
    
    const propsResponse = http.get(
      `${BASE_URL}/mlb/comprehensive-props/${gameId}?optimize_performance=true`,
      {
        tags: { name: 'comprehensive_props' },
      }
    );
    
    const propsSuccess = check(propsResponse, {
      'props fetch successful': (r) => r.status === 200,
      'props response time OK': (r) => r.timings.duration < 5000,
      'has comprehensive props': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.props && Array.isArray(data.props) && data.props.length >= 50;
        } catch {
          return false;
        }
      },
    });
    
    if (!propsSuccess) {
      errorRate.add(1);
    }
  }
  
  const totalTime = new Date().getTime() - startTime;
  activationTime.add(totalTime);
}

/**
 * Test ML inference throughput
 * Measures concurrent inference requests
 */
function testInferenceThroughput() {
  const gameId = GAME_IDS[Math.floor(Math.random() * GAME_IDS.length)];
  const startTime = new Date().getTime();
  
  // Test modern ML prediction endpoint
  const inferenceResponse = http.post(
    `${BASE_URL}/api/modern-ml/predict`,
    JSON.stringify({
      game_id: gameId,
      features: {
        home_team: "Team A",
        away_team: "Team B",
        weather_conditions: "clear",
        temperature: 75
      },
      model_type: "ensemble"
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'ml_inference' },
    }
  );
  
  const inferenceTime = new Date().getTime() - startTime;
  inferenceLatency.add(inferenceTime);
  
  const inferenceSuccess = check(inferenceResponse, {
    'inference successful': (r) => r.status === 200,
    'inference response time OK': (r) => r.timings.duration < 1500,
    'has prediction data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.predictions && Array.isArray(data.predictions);
      } catch {
        return false;
      }
    },
  });
  
  if (!inferenceSuccess) {
    errorRate.add(1);
  }
  
  // Test batch prediction if available
  const batchResponse = http.post(
    `${BASE_URL}/api/modern-ml/batch-predict`,
    JSON.stringify({
      game_ids: [gameId],
      model_type: "transformer"
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'batch_inference' },
    }
  );
  
  check(batchResponse, {
    'batch inference successful': (r) => r.status === 200,
    'batch response time OK': (r) => r.timings.duration < 3000,
  });
}

/**
 * Test cache performance
 * Tests ETag and Cache-Control headers
 */
function testCachePerformance() {
  // Test static endpoint caching
  const configResponse = http.get(
    `${BASE_URL}/api/enterprise/model-registry/types`,
    {
      headers: { 'If-None-Match': '"cached-etag-test"' },
      tags: { name: 'config_cache_test' },
    }
  );
  
  check(configResponse, {
    'config endpoint has cache headers': (r) => 
      r.headers['Cache-Control'] || r.headers['ETag'],
    'config response time OK': (r) => r.timings.duration < 500,
  });
  
  // Test conditional request
  let etag = configResponse.headers['ETag'];
  if (etag) {
    const conditionalResponse = http.get(
      `${BASE_URL}/api/enterprise/model-registry/types`,
      {
        headers: { 'If-None-Match': etag },
        tags: { name: 'conditional_request' },
      }
    );
    
    const isCacheHit = conditionalResponse.status === 304;
    cacheHitRate.add(isCacheHit ? 1 : 0);
    
    if (!isCacheHit) {
      cacheMissCounter.add(1);
    }
    
    check(conditionalResponse, {
      'conditional request handled': (r) => r.status === 200 || r.status === 304,
      'cache validation fast': (r) => r.timings.duration < 200,
    });
  }
  
  // Test Redis cache performance
  const cacheTestResponse = http.get(
    `${BASE_URL}/api/debug/cache-test`,
    {
      tags: { name: 'redis_cache_test' },
    }
  );
  
  check(cacheTestResponse, {
    'redis cache responsive': (r) => r.timings.duration < 100,
  });
}

/**
 * Test pagination performance under load
 * Tests server-side pagination with various page sizes
 */
function testPaginationStress() {
  const pageSize = [50, 100, 200][Math.floor(Math.random() * 3)];
  const page = Math.floor(Math.random() * 10) + 1;
  const startTime = new Date().getTime();
  
  // Test pagination endpoint
  const paginationResponse = http.get(
    `${BASE_URL}/api/pagination/props?page=${page}&size=${pageSize}&sport=MLB`,
    {
      tags: { name: 'pagination_test' },
    }
  );
  
  const paginationTime = new Date().getTime() - startTime;
  paginationLatency.add(paginationTime);
  
  const paginationSuccess = check(paginationResponse, {
    'pagination successful': (r) => r.status === 200,
    'pagination response time OK': (r) => r.timings.duration < 800,
    'has pagination metadata': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.pagination && typeof data.pagination.total === 'number';
      } catch {
        return false;
      }
    },
    'correct page size': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.items && data.items.length <= pageSize;
      } catch {
        return false;
      }
    },
  });
  
  if (!paginationSuccess) {
    errorRate.add(1);
  }
  
  // Test cursor-based pagination
  const cursorResponse = http.get(
    `${BASE_URL}/api/pagination/props?cursor=next&size=${pageSize}&sport=MLB`,
    {
      tags: { name: 'cursor_pagination' },
    }
  );
  
  check(cursorResponse, {
    'cursor pagination successful': (r) => r.status === 200,
    'cursor response time OK': (r) => r.timings.duration < 600,
  });
}

// Setup function - runs once before all tests
export function setup() {
  console.log('🚀 Starting A1Betting Performance Load Test');
  console.log(`Backend URL: ${BASE_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  
  // Warm up the backend
  const healthCheck = http.get(`${BASE_URL}/health`);
  if (healthCheck.status !== 200) {
    console.error('❌ Backend health check failed');
    return;
  }
  
  console.log('✅ Backend is healthy, starting tests...');
  
  return { 
    startTime: new Date().getTime(),
    backendHealthy: true 
  };
}

// Teardown function - runs once after all tests
export function teardown(data) {
  if (!data || !data.backendHealthy) {
    console.log('⚠️ Load test completed with backend issues');
    return;
  }
  
  const totalTime = new Date().getTime() - data.startTime;
  console.log(`✅ Load test completed in ${totalTime}ms`);
  
  // Final health check
  const finalHealthCheck = http.get(`${BASE_URL}/health`);
  if (finalHealthCheck.status === 200) {
    console.log('✅ Backend remained healthy throughout the test');
  } else {
    console.log('⚠️ Backend health degraded during testing');
  }
}