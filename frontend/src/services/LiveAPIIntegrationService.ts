/**
 * Stub implementation of LiveAPIIntegrationService for test compatibility.
 * Replace with full implementation as needed.
 */
class LiveAPIIntegrationService {
  constructor() {}
  // Add methods as needed for tests

  static getInstance(): LiveAPIIntegrationService {
    if (!LiveAPIIntegrationService.instance) {
      LiveAPIIntegrationService.instance = new LiveAPIIntegrationService();
    }
    return LiveAPIIntegrationService.instance;
  }
  private static instance: LiveAPIIntegrationService;

  async testAllConnections(): Promise<unknown> {
    return {};
  }
  async checkAPIHealth(): Promise<unknown> {
    return {};
  }
  getRateLimitStatus(): unknown {
    return {};
  }
  async getOdds(): Promise<unknown> {
    return {};
  }
}

export default LiveAPIIntegrationService;
