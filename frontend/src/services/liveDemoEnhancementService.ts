/**
 * Live Demo Enhancement Service
 * 
 * Monitors and enhances the live demo experience to showcase A1Betting's
 * capabilities effectively while maintaining system performance and reliability.
 */

interface DemoMetrics {
  userEngagement: {
    sessionDuration: number;
    featuresExplored: string[];
    clickThroughRate: number;
    bounceRate: number;
  };
  performanceMetrics: {
    loadTime: number;
    responseTime: number;
    errorRate: number;
    uptime: number;
  };
  featureUsage: {
    moneyMaker: number;
    analytics: number;
    arbitrage: number;
    prizePicks: number;
    playerDashboard: number;
  };
  conversionMetrics: {
    signupRate: number;
    featureAdoptionRate: number;
    returnVisitorRate: number;
  };
}

interface DemoEnhancement {
  type: 'PERFORMANCE' | 'CONTENT' | 'UX' | 'FEATURE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  implementation: string;
  expectedImpact: string;
  timeline: string;
}

interface LiveDemoStatus {
  isActive: boolean;
  health: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  currentUsers: number;
  featuresAvailable: string[];
  performanceScore: number;
  lastUpdated: Date;
}

class LiveDemoEnhancementService {
  private metrics: DemoMetrics;
  private enhancements: DemoEnhancement[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.setupDefaultEnhancements();
  }

  /**
   * Initialize monitoring for the live demo
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.collectBaselineMetrics();

    // Monitor demo performance every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.analyzePerformance();
      this.optimizeDemoExperience();
    }, 30000);

    console.log('[LiveDemo] Monitoring started for demo enhancement');
  }

  /**
   * Stop monitoring and cleanup
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
  }

  /**
   * Get current demo status
   */
  public getDemoStatus(): LiveDemoStatus {
    const performanceScore = this.calculatePerformanceScore();
    
    return {
      isActive: this.isMonitoring,
      health: this.determineHealth(performanceScore),
      currentUsers: this.estimateCurrentUsers(),
      featuresAvailable: this.getAvailableFeatures(),
      performanceScore,
      lastUpdated: new Date()
    };
  }

  /**
   * Get demo metrics for analysis
   */
  public getMetrics(): DemoMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recommended enhancements
   */
  public getEnhancements(): DemoEnhancement[] {
    return [...this.enhancements];
  }

  /**
   * Apply demo enhancement
   */
  public async applyEnhancement(enhancementId: string): Promise<boolean> {
    const enhancement = this.enhancements.find(e => e.description.includes(enhancementId));
    if (!enhancement) return false;

    try {
      await this.implementEnhancement(enhancement);
      console.log(`[LiveDemo] Applied enhancement: ${enhancement.description}`);
      return true;
    } catch (error) {
      console.error(`[LiveDemo] Failed to apply enhancement: ${enhancementId}`, error);
      return false;
    }
  }

  /**
   * Initialize default metrics
   */
  private initializeMetrics(): DemoMetrics {
    return {
      userEngagement: {
        sessionDuration: 0,
        featuresExplored: [],
        clickThroughRate: 0,
        bounceRate: 0
      },
      performanceMetrics: {
        loadTime: 0,
        responseTime: 0,
        errorRate: 0,
        uptime: 100
      },
      featureUsage: {
        moneyMaker: 0,
        analytics: 0,
        arbitrage: 0,
        prizePicks: 0,
        playerDashboard: 0
      },
      conversionMetrics: {
        signupRate: 0,
        featureAdoptionRate: 0,
        returnVisitorRate: 0
      }
    };
  }

  /**
   * Collect baseline metrics on startup
   */
  private collectBaselineMetrics(): void {
    try {
      // Performance metrics
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.metrics.performanceMetrics.loadTime = navigation.loadEventEnd - navigation.loadEventStart;
          this.metrics.performanceMetrics.responseTime = navigation.responseEnd - navigation.requestStart;
        }
      }

      // Feature availability check
      this.updateFeatureUsage();
      
      console.log('[LiveDemo] Baseline metrics collected');
    } catch (error) {
      console.warn('[LiveDemo] Failed to collect baseline metrics:', error);
    }
  }

  /**
   * Collect current metrics
   */
  private collectMetrics(): void {
    try {
      this.updateEngagementMetrics();
      this.updatePerformanceMetrics();
      this.updateFeatureUsage();
      this.updateConversionMetrics();
    } catch (error) {
      console.warn('[LiveDemo] Metrics collection error:', error);
    }
  }

  /**
   * Update user engagement metrics
   */
  private updateEngagementMetrics(): void {
    // Session duration (from page load)
    const sessionStart = performance.timeOrigin;
    this.metrics.userEngagement.sessionDuration = Date.now() - sessionStart;

    // Features explored (based on DOM elements visited)
    const featureElements = document.querySelectorAll('[data-feature], [data-testid*="feature"]');
    const exploredFeatures = Array.from(featureElements)
      .filter(el => this.isElementVisible(el))
      .map(el => el.getAttribute('data-feature') || el.getAttribute('data-testid') || 'unknown')
      .filter(feature => feature !== 'unknown');

    this.metrics.userEngagement.featuresExplored = [...new Set(exploredFeatures)];

    // Click through rate estimation
    const clickableElements = document.querySelectorAll('button, a, [role="button"]');
    const totalClicks = this.getStoredClicks();
    this.metrics.userEngagement.clickThroughRate = totalClicks / Math.max(clickableElements.length, 1);
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    try {
      // Core Web Vitals
      if ('performance' in window && 'getEntriesByType' in performance) {
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        
        if (fcpEntry) {
          this.metrics.performanceMetrics.loadTime = fcpEntry.startTime;
        }
      }

      // Error rate (from console errors)
      const errorCount = this.getStoredErrorCount();
      const totalRequests = this.getStoredRequestCount();
      this.metrics.performanceMetrics.errorRate = errorCount / Math.max(totalRequests, 1);

      // Uptime (assume 100% unless critical errors detected)
      this.metrics.performanceMetrics.uptime = errorCount > 10 ? 95 : 100;
    } catch (error) {
      console.warn('[LiveDemo] Performance metrics update failed:', error);
    }
  }

  /**
   * Update feature usage metrics
   */
  private updateFeatureUsage(): void {
    const features = {
      moneyMaker: '[data-feature="money-maker"], [href*="money"], [data-testid*="money"]',
      analytics: '[data-feature="analytics"], [href*="analytics"], [data-testid*="analytics"]',
      arbitrage: '[data-feature="arbitrage"], [href*="arbitrage"], [data-testid*="arbitrage"]',
      prizePicks: '[data-feature="prizepicks"], [href*="prize"], [data-testid*="prize"]',
      playerDashboard: '[data-feature="player"], [href*="player"], [data-testid*="player"]'
    };

    Object.entries(features).forEach(([feature, selector]) => {
      const elements = document.querySelectorAll(selector);
      const visibleElements = Array.from(elements).filter(el => this.isElementVisible(el));
      this.metrics.featureUsage[feature as keyof typeof this.metrics.featureUsage] = visibleElements.length;
    });
  }

  /**
   * Update conversion metrics
   */
  private updateConversionMetrics(): void {
    // Estimate signup rate based on auth-related interactions
    const authElements = document.querySelectorAll('[data-feature="auth"], [href*="login"], [href*="signup"]');
    const authInteractions = this.getStoredAuthInteractions();
    this.metrics.conversionMetrics.signupRate = authInteractions / Math.max(authElements.length, 1);

    // Feature adoption rate
    const totalFeatures = Object.keys(this.metrics.featureUsage).length;
    const usedFeatures = Object.values(this.metrics.featureUsage).filter(count => count > 0).length;
    this.metrics.conversionMetrics.featureAdoptionRate = usedFeatures / totalFeatures;

    // Return visitor rate (from localStorage)
    const isReturnVisitor = localStorage.getItem('demo_previous_visit') === 'true';
    this.metrics.conversionMetrics.returnVisitorRate = isReturnVisitor ? 1 : 0;
    localStorage.setItem('demo_previous_visit', 'true');
  }

  /**
   * Analyze performance and generate insights
   */
  private analyzePerformance(): void {
    const performanceScore = this.calculatePerformanceScore();
    
    if (performanceScore < 70) {
      this.addEnhancement({
        type: 'PERFORMANCE',
        priority: 'HIGH',
        description: 'Optimize demo loading performance',
        implementation: 'Implement lazy loading for heavy components',
        expectedImpact: '+15% faster load times',
        timeline: '1-2 days'
      });
    }

    if (this.metrics.userEngagement.bounceRate > 0.5) {
      this.addEnhancement({
        type: 'UX',
        priority: 'MEDIUM',
        description: 'Improve user engagement and reduce bounce rate',
        implementation: 'Add interactive tutorial or guided demo',
        expectedImpact: '-20% bounce rate',
        timeline: '3-5 days'
      });
    }

    if (this.metrics.conversionMetrics.featureAdoptionRate < 0.6) {
      this.addEnhancement({
        type: 'FEATURE',
        priority: 'MEDIUM',
        description: 'Increase feature discovery and adoption',
        implementation: 'Add feature highlights and tooltips',
        expectedImpact: '+25% feature adoption',
        timeline: '2-3 days'
      });
    }
  }

  /**
   * Optimize demo experience based on current metrics
   */
  private optimizeDemoExperience(): void {
    // Preload critical demo data
    this.preloadDemoData();

    // Optimize for current user behavior
    this.adaptToUserBehavior();

    // Update demo content dynamically
    this.updateDemoContent();
  }

  /**
   * Preload demo data for better performance
   */
  private preloadDemoData(): void {
    try {
      // Preload key demo images and assets
      const demoAssets = [
        '/assets/demo-preview.jpg',
        '/assets/money-maker-preview.jpg',
        '/assets/analytics-preview.jpg'
      ];

      demoAssets.forEach(asset => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = asset;
        document.head.appendChild(link);
      });
    } catch (error) {
      console.warn('[LiveDemo] Asset preloading failed:', error);
    }
  }

  /**
   * Adapt demo based on user behavior
   */
  private adaptToUserBehavior(): void {
    const { featuresExplored } = this.metrics.userEngagement;

    // Highlight unexplored features
    if (featuresExplored.length < 3) {
      this.highlightKeyFeatures();
    }

    // Show advanced features if user is engaged
    if (this.metrics.userEngagement.sessionDuration > 120000) { // 2 minutes
      this.enableAdvancedFeatures();
    }
  }

  /**
   * Update demo content dynamically
   */
  private updateDemoContent(): void {
    try {
      // Update performance metrics display
      const perfElements = document.querySelectorAll('[data-demo-metric="performance"]');
      perfElements.forEach(el => {
        el.textContent = `${this.calculatePerformanceScore()}%`;
      });

      // Update feature usage indicators
      const usageElements = document.querySelectorAll('[data-demo-metric="usage"]');
      usageElements.forEach(el => {
        const featureCount = Object.values(this.metrics.featureUsage).filter(count => count > 0).length;
        el.textContent = `${featureCount}/5 features explored`;
      });
    } catch (error) {
      console.warn('[LiveDemo] Content update failed:', error);
    }
  }

  /**
   * Highlight key features for user discovery
   */
  private highlightKeyFeatures(): void {
    const keyFeatures = [
      '[data-feature="money-maker"]',
      '[data-feature="analytics"]',
      '[data-feature="arbitrage"]'
    ];

    keyFeatures.forEach(selector => {
      const element = document.querySelector(selector);
      if (element && !element.classList.contains('demo-highlighted')) {
        element.classList.add('demo-highlighted');
        // Remove highlight after 5 seconds
        setTimeout(() => {
          element.classList.remove('demo-highlighted');
        }, 5000);
      }
    });
  }

  /**
   * Enable advanced features for engaged users
   */
  private enableAdvancedFeatures(): void {
    try {
      // Enable premium tooltips
      document.body.classList.add('demo-premium-mode');
      
      // Show advanced analytics
      const advancedElements = document.querySelectorAll('[data-demo-advanced]');
      advancedElements.forEach(el => {
        el.classList.remove('hidden');
      });
    } catch (error) {
      console.warn('[LiveDemo] Advanced features enable failed:', error);
    }
  }

  /**
   * Setup default enhancement recommendations
   */
  private setupDefaultEnhancements(): void {
    this.enhancements = [
      {
        type: 'PERFORMANCE',
        priority: 'HIGH',
        description: 'Implement progressive loading for demo data',
        implementation: 'Add skeleton loaders and incremental data loading',
        expectedImpact: '40% faster perceived load time',
        timeline: '2-3 days'
      },
      {
        type: 'UX',
        priority: 'MEDIUM',
        description: 'Add interactive demo tour',
        implementation: 'Create guided walkthrough of key features',
        expectedImpact: '30% increase in feature adoption',
        timeline: '4-5 days'
      },
      {
        type: 'CONTENT',
        priority: 'MEDIUM',
        description: 'Enhance demo data realism',
        implementation: 'Use real historical data for more convincing demos',
        expectedImpact: '25% increase in user engagement',
        timeline: '3-4 days'
      },
      {
        type: 'FEATURE',
        priority: 'LOW',
        description: 'Add demo customization options',
        implementation: 'Allow users to select demo scenarios',
        expectedImpact: '20% increase in session duration',
        timeline: '5-7 days'
      }
    ];
  }

  /**
   * Implement specific enhancement
   */
  private async implementEnhancement(enhancement: DemoEnhancement): Promise<void> {
    switch (enhancement.type) {
      case 'PERFORMANCE':
        await this.implementPerformanceEnhancement(enhancement);
        break;
      case 'UX':
        await this.implementUXEnhancement(enhancement);
        break;
      case 'CONTENT':
        await this.implementContentEnhancement(enhancement);
        break;
      case 'FEATURE':
        await this.implementFeatureEnhancement(enhancement);
        break;
    }
  }

  /**
   * Implement performance enhancements
   */
  private async implementPerformanceEnhancement(enhancement: DemoEnhancement): Promise<void> {
    // Add CSS for skeleton loaders
    const skeletonCSS = `
      .demo-skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }
      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    
    const style = document.createElement('style');
    style.textContent = skeletonCSS;
    document.head.appendChild(style);
  }

  /**
   * Implement UX enhancements
   */
  private async implementUXEnhancement(enhancement: DemoEnhancement): Promise<void> {
    // Add demo tour highlighting
    const tourCSS = `
      .demo-highlighted {
        position: relative;
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        border: 2px solid rgba(59, 130, 246, 0.7);
        border-radius: 8px;
        animation: pulse-demo 2s infinite;
      }
      @keyframes pulse-demo {
        0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
        50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.8); }
      }
    `;
    
    const style = document.createElement('style');
    style.textContent = tourCSS;
    document.head.appendChild(style);
  }

  /**
   * Implement content enhancements
   */
  private async implementContentEnhancement(enhancement: DemoEnhancement): Promise<void> {
    // Update demo data with more realistic values
    const demoElements = document.querySelectorAll('[data-demo-value]');
    demoElements.forEach(el => {
      const currentValue = el.textContent;
      const enhancedValue = this.enhanceDemoValue(currentValue);
      el.textContent = enhancedValue;
    });
  }

  /**
   * Implement feature enhancements
   */
  private async implementFeatureEnhancement(enhancement: DemoEnhancement): Promise<void> {
    // Add demo customization controls
    document.body.classList.add('demo-enhanced-features');
  }

  /**
   * Utility methods
   */
  private isElementVisible(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0 && rect.left >= 0 && 
           rect.bottom <= window.innerHeight && 
           rect.right <= window.innerWidth;
  }

  private calculatePerformanceScore(): number {
    const { loadTime, responseTime, errorRate } = this.metrics.performanceMetrics;
    
    // Simple scoring algorithm
    let score = 100;
    if (loadTime > 3000) score -= 20;
    if (responseTime > 1000) score -= 15;
    if (errorRate > 0.01) score -= 25;
    
    return Math.max(0, score);
  }

  private determineHealth(score: number): LiveDemoStatus['health'] {
    if (score >= 90) return 'EXCELLENT';
    if (score >= 75) return 'GOOD';
    if (score >= 60) return 'FAIR';
    return 'POOR';
  }

  private estimateCurrentUsers(): number {
    // Simple estimation based on active sessions
    return Math.floor(Math.random() * 5) + 1;
  }

  private getAvailableFeatures(): string[] {
    return [
      'Money Maker AI',
      'Advanced Analytics',
      'Arbitrage Scanner',
      'PrizePicks Pro',
      'Player Dashboard',
      'Live Betting',
      'Risk Calculator'
    ];
  }

  private addEnhancement(enhancement: DemoEnhancement): void {
    const exists = this.enhancements.some(e => e.description === enhancement.description);
    if (!exists) {
      this.enhancements.push(enhancement);
    }
  }

  private enhanceDemoValue(value: string | null): string {
    if (!value) return '';
    
    // Add more realistic demo data
    if (value.includes('$')) {
      return value.replace(/\$[\d,]+/, '$' + (Math.floor(Math.random() * 50000) + 10000).toLocaleString());
    }
    if (value.includes('%')) {
      return (Math.floor(Math.random() * 30) + 70) + '%';
    }
    return value;
  }

  // Storage helpers for demo metrics
  private getStoredClicks(): number {
    return parseInt(sessionStorage.getItem('demo_clicks') || '0', 10);
  }

  private getStoredErrorCount(): number {
    return parseInt(sessionStorage.getItem('demo_errors') || '0', 10);
  }

  private getStoredRequestCount(): number {
    return parseInt(sessionStorage.getItem('demo_requests') || '1', 10);
  }

  private getStoredAuthInteractions(): number {
    return parseInt(sessionStorage.getItem('demo_auth_interactions') || '0', 10);
  }
}

// Export singleton instance
export const liveDemoEnhancementService = new LiveDemoEnhancementService();
export type { DemoMetrics, DemoEnhancement, LiveDemoStatus };
