// Page Objects for End-to-End Testing
import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  async goto(path: string = '/') {
    await this.page.goto(path, { waitUntil: 'networkidle' });
    await this.waitForPageLoad();
  }
  
  async waitForPageLoad() {
    // Wait for the main app container
    await this.page.waitForSelector('#root, [data-testid="app-container"]', { 
      timeout: 10000 
    });
    
    // Wait for any loading indicators to disappear
    await this.page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('[data-testid*="loading"], .loading, .spinner');
      return loadingElements.length === 0 || Array.from(loadingElements).every(el => 
        getComputedStyle(el).display === 'none' || !el.offsetParent
      );
    }, { timeout: 5000 }).catch(() => {
      // Continue if loading indicators don't disappear (they might not exist)
    });
  }
  
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `tests/e2e/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }
  
  async waitForApiResponse(urlPattern: string | RegExp, timeout: number = 5000) {
    return await this.page.waitForResponse(
      response => {
        const url = response.url();
        return typeof urlPattern === 'string' ? 
          url.includes(urlPattern) : 
          urlPattern.test(url);
      },
      { timeout }
    );
  }
  
  async checkApiHealth() {
    try {
      const healthIndicator = this.page.locator('[data-testid="api-health-indicator"]').first();
      if (await healthIndicator.isVisible({ timeout: 2000 })) {
        const status = await healthIndicator.textContent();
        return status?.includes('healthy') || status?.includes('UP') || false;
      }
    } catch {
      // Health indicator not found, assume OK
    }
    return true;
  }
}

export class NavigationPage extends BasePage {
  readonly menuButton: Locator;
  readonly navigationPanel: Locator;
  
  constructor(page: Page) {
    super(page);
    this.menuButton = page.locator('button[title*="Navigation"], button[title*="Menu"]').first();
    this.navigationPanel = page.locator('[data-testid="navigation-panel"], .navigation-panel').first();
  }
  
  async openNavigation() {
    if (await this.menuButton.isVisible()) {
      await this.menuButton.click();
      await this.navigationPanel.waitFor({ state: 'visible', timeout: 3000 });
    }
  }
  
  async navigateToPage(pageName: string) {
    await this.openNavigation();
    
    const pageMap: Record<string, string> = {
      'dashboard': '/dashboard',
      'matchup-analysis': '/matchup-analysis',
      'analytics': '/analytics',
      'betting': '/betting',
      'prizepicks': '/prizepicks',
      'settings': '/settings',
    };
    
    const path = pageMap[pageName.toLowerCase()] || `/${pageName}`;
    
    // Try to click navigation link first
    try {
      const navLink = this.page.locator(`a[href="${path}"], a[href*="${pageName}"]`).first();
      if (await navLink.isVisible({ timeout: 2000 })) {
        await navLink.click();
        await this.waitForPageLoad();
        return;
      }
    } catch {
      // Navigation link not found, use direct navigation
    }
    
    // Fallback to direct navigation
    await this.goto(path);
  }
}

export class MatchupAnalysisPage extends BasePage {
  readonly playerASelect: Locator;
  readonly playerBSelect: Locator;
  readonly analysisTypeButtons: Locator;
  readonly timeframeButtons: Locator;
  readonly runAnalysisButton: Locator;
  readonly comparisonResults: Locator;
  readonly confidenceScore: Locator;
  
  constructor(page: Page) {
    super(page);
    this.playerASelect = page.locator('select').first();
    this.playerBSelect = page.locator('select').nth(1);
    this.analysisTypeButtons = page.locator('button').filter({ hasText: /Head-to-Head|Statistical|Situational|Predictive/ });
    this.timeframeButtons = page.locator('button').filter({ hasText: /Season|Last 10|Last 5|Career/ });
    this.runAnalysisButton = page.locator('button').filter({ hasText: /Run Analysis|Analyze/ }).first();
    this.comparisonResults = page.locator('[data-testid="comparison-results"], .comparison-results').first();
    this.confidenceScore = page.locator('text=/\\d+\\.\\d+%/').first();
  }
  
  async selectPlayer(playerPosition: 'A' | 'B', playerName: string) {
    const select = playerPosition === 'A' ? this.playerASelect : this.playerBSelect;
    await select.selectOption({ label: new RegExp(playerName, 'i') });
    
    // Wait for any dynamic updates
    await this.page.waitForTimeout(500);
  }
  
  async selectAnalysisType(type: 'Head-to-Head' | 'Statistical' | 'Situational' | 'Predictive') {
    const button = this.analysisTypeButtons.filter({ hasText: type }).first();
    await button.click();
    
    // Wait for button state to update
    await expect(button).toHaveClass(/bg-cyan-500|active|selected/);
  }
  
  async selectTimeframe(timeframe: 'Season' | 'Last 10' | 'Last 5' | 'Career') {
    const button = this.timeframeButtons.filter({ hasText: timeframe }).first();
    await button.click();
    
    // Wait for button state to update
    await expect(button).toHaveClass(/bg-purple-500|active|selected/);
  }
  
  async runAnalysis() {
    await this.runAnalysisButton.click();
    
    // Wait for analysis to complete
    await this.page.waitForFunction(() => {
      const loadingIndicators = document.querySelectorAll('[data-testid*="loading"], .loading');
      return loadingIndicators.length === 0 || Array.from(loadingIndicators).every(el => 
        getComputedStyle(el).display === 'none'
      );
    }, { timeout: 10000 }).catch(() => {
      // Continue if no loading indicators
    });
    
    // Wait for results to appear
    await this.page.waitForTimeout(1000);
  }
  
  async getConfidenceScore(): Promise<number> {
    const scoreText = await this.confidenceScore.textContent();
    const match = scoreText?.match(/(\\d+\\.\\d+)%/);
    return match ? parseFloat(match[1]) : 0;
  }
  
  async getPlayerStats(playerPosition: 'A' | 'B'): Promise<Record<string, string>> {
    const playerSection = playerPosition === 'A' ? 
      this.page.locator('.bg-slate-700\\/30').first() :
      this.page.locator('.bg-slate-700\\/30').last();
    
    const stats: Record<string, string> = {};
    
    // Extract recent stats
    const statRows = playerSection.locator('.flex.justify-between.text-sm');
    const count = await statRows.count();
    
    for (let i = 0; i < count; i++) {
      const row = statRows.nth(i);
      const label = await row.locator('span').first().textContent();
      const value = await row.locator('span').last().textContent();
      
      if (label && value) {
        stats[label.replace(':', '').trim()] = value.trim();
      }
    }
    
    return stats;
  }
  
  async validatePageElements() {
    // Check that all main elements are present
    await expect(this.playerASelect).toBeVisible();
    await expect(this.playerBSelect).toBeVisible();
    await expect(this.analysisTypeButtons.first()).toBeVisible();
    await expect(this.timeframeButtons.first()).toBeVisible();
    await expect(this.runAnalysisButton).toBeVisible();
    
    // Check page title
    await expect(this.page.locator('h1')).toContainText(/Matchup Analysis/i);
  }
}

export class DashboardPage extends BasePage {
  readonly analyticsCards: Locator;
  readonly recentPredictions: Locator;
  readonly performanceCharts: Locator;
  readonly refreshButton: Locator;
  
  constructor(page: Page) {
    super(page);
    this.analyticsCards = page.locator('[data-testid="analytics-card"], .analytics-card');
    this.recentPredictions = page.locator('[data-testid="recent-predictions"], .recent-predictions');
    this.performanceCharts = page.locator('[data-testid="performance-chart"], .performance-chart');
    this.refreshButton = page.locator('button').filter({ hasText: /Refresh|Update/ }).first();
  }
  
  async validateDashboardContent() {
    // Wait for dashboard content to load
    await this.page.waitForSelector('h1, [data-testid="dashboard-title"]', { timeout: 5000 });
    
    // Check for main dashboard elements
    const hasAnalytics = await this.analyticsCards.first().isVisible().catch(() => false);
    const hasPredictions = await this.recentPredictions.first().isVisible().catch(() => false);
    const hasCharts = await this.performanceCharts.first().isVisible().catch(() => false);
    
    return hasAnalytics || hasPredictions || hasCharts;
  }
  
  async refreshDashboard() {
    if (await this.refreshButton.isVisible()) {
      await this.refreshButton.click();
      await this.page.waitForTimeout(1000);
    }
  }
}

export class AnalyticsPage extends BasePage {
  readonly performanceMetrics: Locator;
  readonly modelComparison: Locator;
  readonly chartContainer: Locator;
  
  constructor(page: Page) {
    super(page);
    this.performanceMetrics = page.locator('[data-testid="performance-metrics"], .performance-metrics');
    this.modelComparison = page.locator('[data-testid="model-comparison"], .model-comparison');
    this.chartContainer = page.locator('[data-testid="chart-container"], .chart-container, canvas');
  }
  
  async validateAnalyticsContent() {
    // Check for analytics page elements
    const hasMetrics = await this.performanceMetrics.first().isVisible().catch(() => false);
    const hasComparison = await this.modelComparison.first().isVisible().catch(() => false);
    const hasCharts = await this.chartContainer.first().isVisible().catch(() => false);
    
    return hasMetrics || hasComparison || hasCharts;
  }
}
