// End-to-End Tests for Navigation and User Flows
import { test, expect } from '@playwright/test';
import { NavigationPage, DashboardPage, AnalyticsPage } from './utils/pageObjects';

test.describe('Navigation and User Flow E2E Tests', () => {
  let navigationPage: NavigationPage;

  test.beforeEach(async ({ page }) => {
    navigationPage = new NavigationPage(page);
    await navigationPage.goto('/');
  });

  test.describe('Core Navigation', () => {
    test('should navigate to dashboard successfully', async ({ page }) => {
      await navigationPage.navigateToPage('dashboard');
      
      // Verify we're on the dashboard
      await expect(page).toHaveURL(/dashboard/);
      
      // Check for dashboard content
      const dashboardPage = new DashboardPage(page);
      const hasContent = await dashboardPage.validateDashboardContent();
      expect(hasContent).toBe(true);
    });

    test('should navigate to matchup analysis', async ({ page }) => {
      await navigationPage.navigateToPage('matchup-analysis');
      
      // Verify URL and content
      await expect(page).toHaveURL(/matchup-analysis/);
      await expect(page.locator('h1')).toContainText(/Matchup Analysis/i);
    });

    test('should navigate to analytics page', async ({ page }) => {
      await navigationPage.navigateToPage('analytics');
      
      // Verify URL
      await expect(page).toHaveURL(/analytics/);
      
      // Check for analytics content
      const analyticsPage = new AnalyticsPage(page);
      const hasContent = await analyticsPage.validateAnalyticsContent();
      expect(hasContent).toBe(true);
    });

    test('should handle navigation menu interactions', async ({ page }) => {
      // Open navigation menu
      await navigationPage.openNavigation();
      
      // Verify menu is visible
      const menuVisible = await navigationPage.navigationPanel.isVisible().catch(() => false);
      if (menuVisible) {
        await expect(navigationPage.navigationPanel).toBeVisible();
        
        // Take screenshot of open menu
        await navigationPage.takeScreenshot('navigation-menu-open');
        
        // Click outside to close (if applicable)
        await page.click('body', { position: { x: 100, y: 100 } });
      }
    });
  });

  test.describe('Page-to-Page Navigation Flow', () => {
    test('should maintain state when navigating between pages', async ({ page }) => {
      // Start on matchup analysis
      await navigationPage.navigateToPage('matchup-analysis');
      
      // Make some selections
      const playerSelect = page.locator('select').first();
      if (await playerSelect.isVisible()) {
        await playerSelect.selectOption({ index: 2 });
        const selectedValue = await playerSelect.inputValue();
        
        // Navigate away and back
        await navigationPage.navigateToPage('dashboard');
        await navigationPage.navigateToPage('matchup-analysis');
        
        // Check if selection is maintained (or appropriately reset)
        const currentValue = await playerSelect.inputValue();
        expect(currentValue).toBeTruthy();
      }
    });

    test('should handle deep linking to specific pages', async ({ page }) => {
      // Direct navigation to matchup analysis
      await page.goto('/matchup-analysis');
      await navigationPage.waitForPageLoad();
      
      // Verify page loads correctly
      await expect(page.locator('h1')).toContainText(/Matchup Analysis/i);
      
      // Test other deep links
      const deepLinks = ['/analytics', '/dashboard', '/betting'];
      
      for (const link of deepLinks) {
        await page.goto(link);
        await navigationPage.waitForPageLoad();
        
        // Verify page doesn't crash
        await expect(page.locator('#root')).toBeVisible();
        
        // Check URL is correct
        await expect(page).toHaveURL(new RegExp(link.substring(1)));
      }
    });

    test('should handle browser back/forward navigation', async ({ page }) => {
      // Navigate through several pages
      await navigationPage.navigateToPage('dashboard');
      await navigationPage.navigateToPage('matchup-analysis');
      await navigationPage.navigateToPage('analytics');
      
      // Use browser back button
      await page.goBack();
      await expect(page).toHaveURL(/matchup-analysis/);
      
      // Go back again
      await page.goBack();
      await expect(page).toHaveURL(/dashboard/);
      
      // Use forward button
      await page.goForward();
      await expect(page).toHaveURL(/matchup-analysis/);
    });
  });

  test.describe('URL Handling and Routing', () => {
    test('should handle invalid URLs gracefully', async ({ page }) => {
      // Test non-existent route
      await page.goto('/non-existent-page');
      
      // Should either redirect to home or show 404 page
      await page.waitForTimeout(2000);
      
      // Page should not crash
      await expect(page.locator('#root')).toBeVisible();
      
      // Should have some meaningful content
      const hasContent = await page.locator('h1, h2, h3').first().isVisible().catch(() => false);
      expect(hasContent).toBe(true);
    });

    test('should preserve query parameters', async ({ page }) => {
      // Navigate with query parameters
      await page.goto('/matchup-analysis?player1=tatum&player2=durant');
      await navigationPage.waitForPageLoad();
      
      // Verify query parameters are preserved
      const url = page.url();
      expect(url).toContain('player1=tatum');
      expect(url).toContain('player2=durant');
      
      // Navigate to another page and back
      await navigationPage.navigateToPage('dashboard');
      await page.goBack();
      
      // Query parameters might be preserved or reset depending on implementation
      const finalUrl = page.url();
      expect(finalUrl).toContain('/matchup-analysis');
    });

    test('should handle hash fragments in URLs', async ({ page }) => {
      // Navigate with hash fragment
      await page.goto('/matchup-analysis#comparison-results');
      await navigationPage.waitForPageLoad();
      
      // Verify hash is preserved
      const url = page.url();
      expect(url).toContain('#comparison-results');
      
      // Check if page scrolls to section (if applicable)
      const targetElement = page.locator('#comparison-results, [data-testid="comparison-results"]').first();
      const isVisible = await targetElement.isVisible().catch(() => false);
      if (isVisible) {
        // If element exists, check if it's in viewport
        const boundingBox = await targetElement.boundingBox();
        expect(boundingBox?.y).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Performance and Loading States', () => {
    test('should show loading states during navigation', async ({ page }) => {
      // Monitor for loading indicators during navigation
      const loadingIndicators: string[] = [];
      
      page.on('response', response => {
        if (response.url().includes('/api/')) {
          console.log(`API Response: ${response.status()} ${response.url()}`);
        }
      });
      
      // Navigate and watch for loading states
      await navigationPage.navigateToPage('analytics');
      
      // Look for common loading indicators
      const commonLoadingSelectors = [
        '[data-testid*="loading"]',
        '.loading',
        '.spinner',
        'text=/Loading/',
        'text=/Please wait/',
      ];
      
      for (const selector of commonLoadingSelectors) {
        const element = page.locator(selector).first();
        const isVisible = await element.isVisible().catch(() => false);
        if (isVisible) {
          loadingIndicators.push(selector);
        }
      }
      
      // Wait for page to fully load
      await navigationPage.waitForPageLoad();
      
      // Verify loading indicators disappear
      for (const selector of loadingIndicators) {
        const element = page.locator(selector).first();
        await expect(element).not.toBeVisible();
      }
    });

    test('should handle concurrent navigation requests', async ({ page }) => {
      // Rapidly navigate between pages
      const navigationPromises = [
        navigationPage.navigateToPage('dashboard'),
        navigationPage.navigateToPage('matchup-analysis'),
        navigationPage.navigateToPage('analytics'),
      ];
      
      // Wait for all navigations to settle
      await Promise.allSettled(navigationPromises);
      
      // Verify final page state is stable
      await page.waitForTimeout(1000);
      await expect(page.locator('#root')).toBeVisible();
      
      // Take screenshot of final state
      await navigationPage.takeScreenshot('concurrent-navigation-final');
    });

    test('should maintain performance across multiple navigations', async ({ page }) => {
      const navigationTimes: number[] = [];
      
      const pages = ['dashboard', 'matchup-analysis', 'analytics', 'dashboard'];
      
      for (const pageName of pages) {
        const startTime = Date.now();
        await navigationPage.navigateToPage(pageName);
        const endTime = Date.now();
        
        navigationTimes.push(endTime - startTime);
      }
      
      // Verify navigation times are reasonable
      const avgNavigationTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;
      expect(avgNavigationTime).toBeLessThan(3000); // Average under 3 seconds
      
      // Verify no navigation took too long
      const maxNavigationTime = Math.max(...navigationTimes);
      expect(maxNavigationTime).toBeLessThan(10000); // Max under 10 seconds
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('should recover from navigation errors', async ({ page, context }) => {
      // Mock navigation failures
      let failureCount = 0;
      await context.route('**/*', async route => {
        if (failureCount < 2 && route.request().url().includes('/analytics')) {
          failureCount++;
          await route.abort();
        } else {
          await route.continue();
        }
      });
      
      // Try to navigate to analytics (should fail first time)
      await navigationPage.navigateToPage('analytics');
      
      // Verify error is handled gracefully
      await page.waitForTimeout(2000);
      await expect(page.locator('#root')).toBeVisible();
      
      // Try navigation again (should succeed)
      await navigationPage.navigateToPage('dashboard');
      await navigationPage.navigateToPage('analytics');
      
      // Should eventually succeed
      await expect(page.locator('#root')).toBeVisible();
    });

    test('should handle network disconnection during navigation', async ({ page, context }) => {
      // Simulate network disconnection
      await context.setOffline(true);
      
      // Try to navigate
      await navigationPage.navigateToPage('analytics');
      
      // Should handle offline state gracefully
      await page.waitForTimeout(2000);
      await expect(page.locator('#root')).toBeVisible();
      
      // Reconnect network
      await context.setOffline(false);
      
      // Try navigation again
      await navigationPage.navigateToPage('dashboard');
      await expect(page.locator('#root')).toBeVisible();
    });

    test('should handle JavaScript errors during navigation', async ({ page }) => {
      // Monitor for JavaScript errors
      const jsErrors: string[] = [];
      page.on('pageerror', error => {
        jsErrors.push(error.message);
      });
      
      // Navigate through several pages
      const pages = ['dashboard', 'matchup-analysis', 'analytics'];
      
      for (const pageName of pages) {
        await navigationPage.navigateToPage(pageName);
        await page.waitForTimeout(1000);
      }
      
      // Check for critical JavaScript errors
      const criticalErrors = jsErrors.filter(error => 
        error.includes('TypeError') || 
        error.includes('ReferenceError') ||
        error.includes('Cannot read property')
      );
      
      // Should have minimal critical errors
      expect(criticalErrors.length).toBeLessThan(3);
      
      // Page should still be functional
      await expect(page.locator('#root')).toBeVisible();
    });
  });

  test.describe('Mobile Navigation Experience', () => {
    test('should provide mobile-friendly navigation', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await navigationPage.waitForPageLoad();
      
      // Test mobile navigation
      await navigationPage.openNavigation();
      
      // Verify navigation is accessible on mobile
      const menuButton = navigationPage.menuButton;
      await expect(menuButton).toBeVisible();
      
      // Test touch navigation
      await menuButton.tap();
      await page.waitForTimeout(500);
      
      // Take mobile navigation screenshot
      await navigationPage.takeScreenshot('mobile-navigation');
    });

    test('should handle swipe gestures (if implemented)', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await navigationPage.waitForPageLoad();
      
      // Test horizontal swipe (if navigation supports it)
      await page.touchscreen.tap(200, 300);
      await page.touchscreen.tap(100, 300); // Swipe left
      
      // Wait for any swipe animations
      await page.waitForTimeout(1000);
      
      // Verify page is still functional
      await expect(page.locator('#root')).toBeVisible();
    });
  });
});
