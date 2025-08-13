/**
 * API Endpoint Tester - Direct API testing utilities for debugging
 */

export interface APITestResult {
  success: boolean;
  status?: number;
  statusText?: string;
  responseTime: number;
  responseBody?: any;
  error?: string;
  headers?: Record<string, string>;
}

export class APITester {
  /**
   * Test a specific API endpoint with detailed error reporting
   */
  static async testEndpoint(endpoint: string, options: RequestInit = {}): Promise<APITestResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
        ...options,
      });

      const responseTime = Date.now() - startTime;
      const headers = Object.fromEntries(response.headers.entries());

      let responseBody: any = null;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          responseBody = await response.json();
        } else {
          responseBody = await response.text();
        }
      } catch (bodyError) {
        console.warn('Could not parse response body:', bodyError);
        responseBody = null;
      }

      const result: APITestResult = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        responseTime,
        responseBody,
        headers,
      };
      if (!response.ok) {
        result.error = `HTTP ${response.status}: ${response.statusText}`;
      }
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        responseTime,
        error: errorMessage,
        responseBody: null,
      };
    }
  }

  /**
   * Test cheatsheets API endpoints specifically
   */
  static async testCheatsheetsAPI(): Promise<{
    health: APITestResult;
    opportunities: APITestResult;
    summary: APITestResult;
  }> {
    const [health, opportunities, summary] = await Promise.allSettled([
      this.testEndpoint('/api/v1/cheatsheets/health'),
      this.testEndpoint(
        '/api/v1/cheatsheets/opportunities?min_edge=1&min_confidence=50&sports=MLB&max_results=1'
      ),
      this.testEndpoint('/api/v1/cheatsheets/summary'),
    ]);

    return {
      health:
        health.status === 'fulfilled'
          ? health.value
          : {
              success: false,
              responseTime: 0,
              error: health.status === 'rejected' ? health.reason : 'Unknown error',
            },
      opportunities:
        opportunities.status === 'fulfilled'
          ? opportunities.value
          : {
              success: false,
              responseTime: 0,
              error: opportunities.status === 'rejected' ? opportunities.reason : 'Unknown error',
            },
      summary:
        summary.status === 'fulfilled'
          ? summary.value
          : {
              success: false,
              responseTime: 0,
              error: summary.status === 'rejected' ? summary.reason : 'Unknown error',
            },
    };
  }

  /**
   * Generate a comprehensive API health report
   */
  static async generateHealthReport(): Promise<{
    overall: {
      healthy: boolean;
      issues: string[];
      recommendations: string[];
    };
    endpoints: {
      health: APITestResult;
      opportunities: APITestResult;
      summary: APITestResult;
    };
    environment: {
      isLocal: boolean;
      hostname: string;
      userAgent: string;
      timestamp: string;
    };
  }> {
    const endpoints = await this.testCheatsheetsAPI();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Analyze results
    if (!endpoints.health.success) {
      issues.push(`Health endpoint failed: ${endpoints.health.error}`);
      recommendations.push('Check if backend server is running and accessible');
    }

    if (!endpoints.opportunities.success) {
      issues.push(`Opportunities endpoint failed: ${endpoints.opportunities.error}`);
      if (endpoints.opportunities.status === 500) {
        recommendations.push(
          'Server error (500) indicates backend API issues - check backend logs'
        );
        recommendations.push('Verify database connections and API route handlers');
      }
    }

    if (!endpoints.summary.success) {
      issues.push(`Summary endpoint failed: ${endpoints.summary.error}`);
    }

    // Response time analysis
    Object.entries(endpoints).forEach(([name, result]) => {
      if (result.success && result.responseTime > 5000) {
        issues.push(`${name} endpoint is slow (${result.responseTime}ms)`);
        recommendations.push(`Optimize ${name} endpoint performance`);
      }
    });

    const isLocal =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (!isLocal && issues.length > 0) {
      recommendations.push('In cloud environments, ensure backend is properly connected');
    }

    return {
      overall: {
        healthy: Object.values(endpoints).every(e => e.success),
        issues,
        recommendations,
      },
      endpoints,
      environment: {
        isLocal,
        hostname: window.location.hostname,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export default APITester;
