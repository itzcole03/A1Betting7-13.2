/**
 * API Validation Script for A1Betting Backend
 * Tests all major API endpoints for functionality and data accuracy
 */

const API_BASE_URL = 'http://localhost:8000';

// API endpoint test configurations
const API_TESTS = [
  // Health and system endpoints
  {
    name: 'Health Check',
    endpoint: '/health',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['status'],
    critical: true
  },
  
  // Cheatsheets API
  {
    name: 'Cheatsheets Opportunities',
    endpoint: '/v1/cheatsheets/opportunities',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['opportunities', 'total_count'],
    timeout: 10000
  },
  {
    name: 'Cheatsheets Summary Stats',
    endpoint: '/v1/cheatsheets/stats/summary',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['total_opportunities', 'sports_coverage']
  },
  {
    name: 'Cheatsheets Health',
    endpoint: '/v1/cheatsheets/health',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['status', 'available_sports']
  },

  // Odds and Arbitrage API
  {
    name: 'Odds Comparison',
    endpoint: '/v1/odds/compare',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['sport', 'lines'],
    timeout: 10000
  },
  {
    name: 'Arbitrage Opportunities',
    endpoint: '/v1/odds/arbitrage',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['opportunities', 'total_opportunities'],
    timeout: 10000
  },
  {
    name: 'Odds Health Check',
    endpoint: '/v1/odds/health',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['status', 'available_books']
  },

  // ML Models API
  {
    name: 'ML Models List',
    endpoint: '/api/models',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['models'],
    timeout: 5000
  },

  // AI Routes
  {
    name: 'AI Health Check',
    endpoint: '/v1/ai/health',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['status']
  },

  // Risk Tools
  {
    name: 'Kelly Calculator Health',
    endpoint: '/v1/risk-tools/health',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['status']
  }
];

// Validation functions
async function validateAPIEndpoint(test) {
  const startTime = Date.now();
  
  try {
    console.log(`🧪 Testing: ${test.name}`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), test.timeout || 5000);
    
    const response = await fetch(`${API_BASE_URL}${test.endpoint}`, {
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    const responseTime = Date.now() - startTime;
    
    // Check status code
    const statusOk = response.status === test.expectedStatus;
    if (!statusOk) {
      console.log(`  ❌ Expected status ${test.expectedStatus}, got ${response.status}`);
      return {
        name: test.name,
        endpoint: test.endpoint,
        status: 'FAIL',
        reason: `Status code mismatch: ${response.status}`,
        responseTime,
        critical: test.critical
      };
    }
    
    // Check response data
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.log(`  ❌ Invalid JSON response`);
      return {
        name: test.name,
        endpoint: test.endpoint,
        status: 'FAIL',
        reason: 'Invalid JSON response',
        responseTime,
        critical: test.critical
      };
    }
    
    // Validate expected fields
    const missingFields = [];
    if (test.expectedFields) {
      test.expectedFields.forEach(field => {
        if (!(field in data)) {
          missingFields.push(field);
        }
      });
    }
    
    if (missingFields.length > 0) {
      console.log(`  ⚠️ Missing fields: ${missingFields.join(', ')}`);
    }
    
    // Validate data quality
    const dataQuality = validateDataQuality(data, test);
    
    const success = statusOk && missingFields.length === 0;
    console.log(`  ${success ? '✅' : '❌'} ${response.status} (${responseTime}ms)`);
    
    if (dataQuality.warnings.length > 0) {
      dataQuality.warnings.forEach(warning => {
        console.log(`    ⚠️ ${warning}`);
      });
    }
    
    return {
      name: test.name,
      endpoint: test.endpoint,
      status: success ? 'PASS' : 'FAIL',
      statusCode: response.status,
      responseTime,
      missingFields,
      dataQuality,
      critical: test.critical
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`  ❌ Error: ${error.message}`);
    
    return {
      name: test.name,
      endpoint: test.endpoint,
      status: 'ERROR',
      error: error.message,
      responseTime,
      critical: test.critical
    };
  }
}

function validateDataQuality(data, test) {
  const warnings = [];
  
  // Check for common data quality issues
  if (test.name.includes('Opportunities') && data.opportunities) {
    if (Array.isArray(data.opportunities)) {
      if (data.opportunities.length === 0) {
        warnings.push('No opportunities returned (may be expected in demo mode)');
      } else {
        // Validate opportunity structure
        const firstOpp = data.opportunities[0];
        const requiredFields = ['id', 'player_name', 'stat_type', 'edge_percentage'];
        requiredFields.forEach(field => {
          if (!(field in firstOpp)) {
            warnings.push(`Opportunity missing field: ${field}`);
          }
        });
        
        // Validate data ranges
        if (firstOpp.edge_percentage && (firstOpp.edge_percentage < 0 || firstOpp.edge_percentage > 50)) {
          warnings.push('Edge percentage outside expected range (0-50%)');
        }
        if (firstOpp.confidence && (firstOpp.confidence < 0 || firstOpp.confidence > 100)) {
          warnings.push('Confidence outside expected range (0-100%)');
        }
      }
    } else {
      warnings.push('Opportunities field is not an array');
    }
  }
  
  if (test.name.includes('Models') && data.models) {
    if (Array.isArray(data.models)) {
      if (data.models.length === 0) {
        warnings.push('No models returned');
      } else {
        // Validate model structure
        const firstModel = data.models[0];
        const requiredFields = ['id', 'name', 'status'];
        requiredFields.forEach(field => {
          if (!(field in firstModel)) {
            warnings.push(`Model missing field: ${field}`);
          }
        });
      }
    }
  }
  
  return { warnings };
}

async function runAPIValidation() {
  console.log('🚀 Starting API Validation...\n');
  
  const results = {
    total: API_TESTS.length,
    passed: 0,
    failed: 0,
    errors: 0,
    criticalFailures: 0,
    tests: []
  };
  
  // Run all tests
  for (const test of API_TESTS) {
    const result = await validateAPIEndpoint(test);
    results.tests.push(result);
    
    switch (result.status) {
      case 'PASS':
        results.passed++;
        break;
      case 'FAIL':
        results.failed++;
        if (result.critical) {
          results.criticalFailures++;
        }
        break;
      case 'ERROR':
        results.errors++;
        if (result.critical) {
          results.criticalFailures++;
        }
        break;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Generate summary
  console.log('\n📊 API Validation Summary:');
  console.log('=============================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} (${((results.passed/results.total)*100).toFixed(1)}%)`);
  console.log(`Failed: ${results.failed} (${((results.failed/results.total)*100).toFixed(1)}%)`);
  console.log(`Errors: ${results.errors} (${((results.errors/results.total)*100).toFixed(1)}%)`);
  console.log(`Critical Failures: ${results.criticalFailures}`);
  
  // Calculate average response time
  const responseTimes = results.tests
    .filter(t => t.responseTime)
    .map(t => t.responseTime);
  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
    : 0;
  console.log(`Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
  
  // Overall status
  const passRate = results.passed / results.total;
  const hasCriticalFailures = results.criticalFailures > 0;
  
  if (hasCriticalFailures) {
    console.log('\n❌ CRITICAL FAILURES DETECTED - System may not be functional');
  } else if (passRate >= 0.8) {
    console.log('\n✅ API VALIDATION PASSED - System is functional');
  } else if (passRate >= 0.6) {
    console.log('\n⚠️ API VALIDATION PASSED WITH WARNINGS - Some features may be degraded');
  } else {
    console.log('\n❌ API VALIDATION FAILED - Multiple system issues detected');
  }
  
  // Detailed failure report
  const failures = results.tests.filter(t => t.status !== 'PASS');
  if (failures.length > 0) {
    console.log('\n🔍 Detailed Failure Report:');
    failures.forEach(failure => {
      console.log(`  ${failure.name}: ${failure.reason || failure.error}`);
    });
  }
  
  return results;
}

// Export for Node.js or run directly
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAPIValidation, API_TESTS };
} else if (typeof window !== 'undefined') {
  window.runAPIValidation = runAPIValidation;
}

// Auto-run if called directly
if (typeof require !== 'undefined' && require.main === module) {
  runAPIValidation().catch(console.error);
}
