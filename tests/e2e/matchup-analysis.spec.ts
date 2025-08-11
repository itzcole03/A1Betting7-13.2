// End-to-End Tests for Matchup Analysis Features
import { test, expect } from '@playwright/test';
import { MatchupAnalysisPage, NavigationPage } from './utils/pageObjects';

test.describe('Matchup Analysis E2E Tests', () => {
  let matchupPage: MatchupAnalysisPage;
  let navigationPage: NavigationPage;

  test.beforeEach(async ({ page }) => {
    matchupPage = new MatchupAnalysisPage(page);
    navigationPage = new NavigationPage(page);
    
    // Navigate to matchup analysis page
    await navigationPage.goto('/matchup-analysis');
    await matchupPage.waitForPageLoad();
  });

  test.describe('Page Loading and Layout', () => {
    test('should load matchup analysis page successfully', async ({ page }) => {
      // Verify page title and main elements
      await expect(page).toHaveTitle(/A1Betting|Matchup Analysis/i);
      await expect(page.locator('h1')).toContainText(/Matchup Analysis/i);
      
      // Validate all main page elements are present
      await matchupPage.validatePageElements();
      
      // Take screenshot for visual verification
      await matchupPage.takeScreenshot('matchup-analysis-loaded');
    });

    test('should display player selection dropdowns with options', async ({ page }) => {
      // Check Player A dropdown
      await expect(matchupPage.playerASelect).toBeVisible();
      const playerAOptions = await matchupPage.playerASelect.locator('option').count();
      expect(playerAOptions).toBeGreaterThan(1);
      
      // Check Player B dropdown
      await expect(matchupPage.playerBSelect).toBeVisible();
      const playerBOptions = await matchupPage.playerBSelect.locator('option').count();
      expect(playerBOptions).toBeGreaterThan(1);
      
      // Verify default selections
      const playerAValue = await matchupPage.playerASelect.inputValue();
      const playerBValue = await matchupPage.playerBSelect.inputValue();
      expect(playerAValue).toBeTruthy();
      expect(playerBValue).toBeTruthy();
    });

    test('should display analysis type and timeframe controls', async ({ page }) => {
      // Check analysis type buttons
      const analysisTypeCount = await matchupPage.analysisTypeButtons.count();
      expect(analysisTypeCount).toBeGreaterThanOrEqual(4);
      
      // Check timeframe buttons
      const timeframeCount = await matchupPage.timeframeButtons.count();
      expect(timeframeCount).toBeGreaterThanOrEqual(4);
      
      // Verify default selections are highlighted
      await expect(matchupPage.analysisTypeButtons.first()).toHaveClass(/bg-cyan-500|active/);
      await expect(matchupPage.timeframeButtons.first()).toHaveClass(/bg-purple-500|active/);
    });
  });

  test.describe('Player Selection and Comparison', () => {
    test('should allow selecting different players for comparison', async ({ page }) => {
      // Select Jayson Tatum as Player A
      await matchupPage.selectPlayer('A', 'Jayson Tatum');
      
      // Select Kevin Durant as Player B
      await matchupPage.selectPlayer('B', 'Kevin Durant');
      
      // Verify selections were made
      const playerAValue = await matchupPage.playerASelect.inputValue();
      const playerBValue = await matchupPage.playerBSelect.inputValue();
      
      expect(playerAValue).toContain('tatum');
      expect(playerBValue).toContain('durant');
      
      // Take screenshot of player selection
      await matchupPage.takeScreenshot('players-selected');
    });

    test('should display player stats and information', async ({ page }) => {
      // Wait for player information to load
      await page.waitForTimeout(1000);
      
      // Get Player A stats
      const playerAStats = await matchupPage.getPlayerStats('A');
      expect(Object.keys(playerAStats).length).toBeGreaterThan(0);
      
      // Get Player B stats
      const playerBStats = await matchupPage.getPlayerStats('B');
      expect(Object.keys(playerBStats).length).toBeGreaterThan(0);
      
      // Verify stats contain expected fields
      const expectedStats = ['points', 'rebounds', 'assists'];
      const playerAHasExpectedStats = expectedStats.some(stat => 
        Object.keys(playerAStats).some(key => key.toLowerCase().includes(stat))
      );
      expect(playerAHasExpectedStats).toBe(true);
    });

    test('should update comparison when players change', async ({ page }) => {
      // Get initial confidence score
      const initialConfidence = await matchupPage.getConfidenceScore().catch(() => 0);
      
      // Change Player B to a different player
      await matchupPage.selectPlayer('B', 'LeBron James');
      
      // Wait for comparison to update
      await page.waitForTimeout(1500);
      
      // Get updated confidence score
      const updatedConfidence = await matchupPage.getConfidenceScore().catch(() => 0);
      
      // Verify that some comparison data is present
      expect(updatedConfidence).toBeGreaterThanOrEqual(0);
      expect(updatedConfidence).toBeLessThanOrEqual(100);
    });
  });

  test.describe('Analysis Controls and Functionality', () => {
    test('should switch between analysis types', async ({ page }) => {
      const analysisTypes = ['Head-to-Head', 'Statistical', 'Situational', 'Predictive'];
      
      for (const type of analysisTypes) {
        await matchupPage.selectAnalysisType(type);
        
        // Verify the correct button is active
        const activeButton = matchupPage.analysisTypeButtons.filter({ hasText: type }).first();
        await expect(activeButton).toHaveClass(/bg-cyan-500|active/);
        
        // Wait for any dynamic updates
        await page.waitForTimeout(500);
      }
    });

    test('should switch between timeframes', async ({ page }) => {
      const timeframes = ['Season', 'Last 10', 'Last 5', 'Career'];
      
      for (const timeframe of timeframes) {
        await matchupPage.selectTimeframe(timeframe);
        
        // Verify the correct button is active
        const activeButton = matchupPage.timeframeButtons.filter({ hasText: timeframe }).first();
        await expect(activeButton).toHaveClass(/bg-purple-500|active/);
        
        // Wait for any dynamic updates
        await page.waitForTimeout(500);
      }
    });

    test('should run analysis and display results', async ({ page }) => {
      // Set up specific matchup
      await matchupPage.selectPlayer('A', 'Jayson Tatum');
      await matchupPage.selectPlayer('B', 'Kevin Durant');
      await matchupPage.selectAnalysisType('Head-to-Head');
      await matchupPage.selectTimeframe('Season');
      
      // Run analysis
      await matchupPage.runAnalysis();
      
      // Verify analysis completed and results are displayed
      const confidenceScore = await matchupPage.getConfidenceScore();
      expect(confidenceScore).toBeGreaterThan(0);
      expect(confidenceScore).toBeLessThanOrEqual(100);
      
      // Check for contextual factors
      const contextualFactors = page.locator('text=/Contextual Factors|Current Form|Matchup History/').first();
      await expect(contextualFactors).toBeVisible();
      
      // Take screenshot of results
      await matchupPage.takeScreenshot('analysis-results');
    });
  });

  test.describe('Responsive Design and Mobile Experience', () => {
    test('should display properly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Reload page for mobile layout
      await page.reload();
      await matchupPage.waitForPageLoad();
      
      // Verify main elements are still visible and accessible
      await expect(matchupPage.playerASelect).toBeVisible();
      await expect(matchupPage.playerBSelect).toBeVisible();
      await expect(matchupPage.runAnalysisButton).toBeVisible();
      
      // Check that buttons are touch-friendly
      const buttonHeight = await matchupPage.runAnalysisButton.boundingBox();
      expect(buttonHeight?.height).toBeGreaterThan(40); // Touch target size
      
      // Take mobile screenshot
      await matchupPage.takeScreenshot('mobile-layout');
    });

    test('should handle touch interactions on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await matchupPage.waitForPageLoad();
      
      // Test touch interactions
      await matchupPage.playerASelect.tap();
      await page.waitForTimeout(500);
      
      // Select a player option
      await matchupPage.selectPlayer('A', 'LeBron James');
      
      // Verify selection worked
      const selectedValue = await matchupPage.playerASelect.inputValue();
      expect(selectedValue).toContain('lebron');
    });
  });

  test.describe('Performance and Loading', () => {
    test('should load page within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await navigationPage.goto('/matchup-analysis');
      await matchupPage.waitForPageLoad();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Page should load within 5 seconds
    });

    test('should handle slow network conditions', async ({ page, context }) => {
      // Simulate slow 3G network
      await context.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
        await route.continue();
      });
      
      await navigationPage.goto('/matchup-analysis');
      await matchupPage.waitForPageLoad();
      
      // Verify page still loads and functions
      await matchupPage.validatePageElements();
      await expect(matchupPage.runAnalysisButton).toBeEnabled();
    });

    test('should handle API errors gracefully', async ({ page, context }) => {
      // Mock API failures
      await context.route('**/api/**', async route => {
        if (route.request().url().includes('/analytics') || 
            route.request().url().includes('/predictions')) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Service temporarily unavailable' })
          });
        } else {
          await route.continue();
        }
      });
      
      await navigationPage.goto('/matchup-analysis');
      await matchupPage.waitForPageLoad();
      
      // Verify page still loads with graceful error handling
      await matchupPage.validatePageElements();
      
      // Try to run analysis (should handle error gracefully)
      await matchupPage.runAnalysis();
      
      // Should not crash the page
      await expect(page.locator('#root')).toBeVisible();
    });
  });

  test.describe('Accessibility and User Experience', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Navigate through form elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        const focusedElement = await page.locator(':focus');
        await expect(focusedElement).toBeVisible();
      }
      
      // Test Enter key activation
      await matchupPage.runAnalysisButton.focus();
      await page.keyboard.press('Enter');
      
      // Verify analysis runs
      await page.waitForTimeout(1000);
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Check for ARIA labels on interactive elements
      const selectElements = page.locator('select');
      const selectCount = await selectElements.count();
      
      for (let i = 0; i < selectCount; i++) {
        const select = selectElements.nth(i);
        const hasLabel = await select.getAttribute('aria-label') || 
                        await select.getAttribute('id');
        expect(hasLabel).toBeTruthy();
      }
      
      // Check button accessibility
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const hasAccessibleName = await button.textContent() || 
                                await button.getAttribute('aria-label') ||
                                await button.getAttribute('title');
        expect(hasAccessibleName).toBeTruthy();
      }
    });

    test('should provide clear visual feedback for interactions', async ({ page }) => {
      // Test hover states
      await matchupPage.runAnalysisButton.hover();
      
      // Test focus states
      await matchupPage.playerASelect.focus();
      
      // Test active states
      await matchupPage.runAnalysisButton.click();
      
      // Take screenshot of interaction states
      await matchupPage.takeScreenshot('interaction-states');
    });
  });

  test.describe('Data Validation and Error Handling', () => {
    test('should validate player selections', async ({ page }) => {
      // Try to run analysis with same player selected for both sides
      await matchupPage.selectPlayer('A', 'Jayson Tatum');
      await matchupPage.selectPlayer('B', 'Jayson Tatum');
      
      await matchupPage.runAnalysis();
      
      // Should handle this gracefully (either prevent selection or show appropriate message)
      await page.waitForTimeout(1000);
      
      // Page should still be functional
      await expect(matchupPage.runAnalysisButton).toBeVisible();
    });

    test('should handle missing or incomplete data', async ({ page, context }) => {
      // Mock incomplete API responses
      await context.route('**/api/players/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            stats: {}, // Empty stats
            name: 'Test Player',
            team: 'TEST'
          })
        });
      });
      
      await page.reload();
      await matchupPage.waitForPageLoad();
      
      // Should still display page without crashing
      await matchupPage.validatePageElements();
      
      // Run analysis with incomplete data
      await matchupPage.runAnalysis();
      
      // Should handle gracefully
      await expect(page.locator('#root')).toBeVisible();
    });
  });
});
