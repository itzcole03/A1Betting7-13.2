/**
 * Backend Discovery Service
 * Automatically finds and connects to available A1Betting backend
 * Searches ports 8000-8010 for active backend instances
 */

class BackendDiscoveryService {
  private discoveredBackend: string | null = null;
  private lastDiscovery: number = 0;
  private discoveryTimeout = 60000; // Re-discover every minute

  /**
   * Discover available backend by testing ports 8000-8010
   */
  async discoverBackend(): Promise<string> {
    const now = Date.now();

    // Use cached discovery if recent
    if (this.discoveredBackend && now - this.lastDiscovery < this.discoveryTimeout) {
      return this.discoveredBackend;
    }

    // Check if we're in production/hosted environment
    const isProduction = !import.meta.env.DEV || window.location.hostname !== 'localhost';

    if (isProduction) {
      // In production, skip discovery and use fallback immediately
      const fallbackUrl = import.meta.env.VITE_API_URL || '/api';
      console.log(`🏭 Production environment detected, using API endpoint: ${fallbackUrl}`);
      this.discoveredBackend = fallbackUrl;
      this.lastDiscovery = now;
      return fallbackUrl;
    }

    console.log('🔍 Discovering A1Betting backend...');

    // Test ports 8000-8010 sequentially (8007 first - our Phase 3 enhanced backend)
    const portsToTest = [8007, 8006, 8005, 8004, 8001, 8000, 8002, 8003, 8008, 8009, 8010];

    for (const port of portsToTest) {
      try {
        const testUrl = `http://localhost:${port}`;
        console.log(`🔍 Testing backend on port ${port}...`);

        const response = await fetch(`${testUrl}/api/health/status`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(1000), // Reduced timeout to 1 second per port
        });

        if (response.ok) {
          const health = await response.json();
          if (health.status === 'healthy') {
            console.log(`✅ Found A1Betting backend on port ${port}!`);
            this.discoveredBackend = testUrl;
            this.lastDiscovery = now;
            return testUrl;
          }
        }
      } catch (error) {
        // Port not available, continue testing
        console.log(`❌ Port ${port} not available`);
      }
    }

    // Fallback to environment variable or default
    const fallbackUrl = import.meta.env.VITE_API_URL || '/api';
    console.log(`⚠️ No backend discovered, using fallback: ${fallbackUrl}`);
    this.discoveredBackend = fallbackUrl;
    this.lastDiscovery = now;
    return fallbackUrl;
  }

  /**
   * Get current backend URL (with auto-discovery)
   */
  async getBackendUrl(): Promise<string> {
    return await this.discoverBackend();
  }

  /**
   * Force re-discovery (useful when backend changes)
   */
  forceRediscovery(): void {
    this.discoveredBackend = null;
    this.lastDiscovery = 0;
  }

  /**
   * Test if current backend is still available
   */
  async testCurrentBackend(): Promise<boolean> {
    if (!this.discoveredBackend) return false;

    try {
      const response = await fetch(`${this.discoveredBackend}/api/health/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get current backend with fallback and retry logic
   */
  async getBackendUrlWithRetry(): Promise<string> {
    // First try current backend
    if (this.discoveredBackend && (await this.testCurrentBackend())) {
      return this.discoveredBackend;
    }

    // If current backend failed, force rediscovery
    this.forceRediscovery();
    return await this.discoverBackend();
  }
}

// Export singleton instance
export const backendDiscovery = new BackendDiscoveryService();
export default backendDiscovery;
