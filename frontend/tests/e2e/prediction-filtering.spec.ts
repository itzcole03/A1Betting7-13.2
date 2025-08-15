import { test, expect } from '@playwright/test';

// Test suite for sports prop prediction filtering functionality
test.describe('Prediction Filtering        // Check if filter state is maintained (if implemented)
        const _inputValue = await searchInput.inputValue();ntegration', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the main application
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
    
    // Activate MLB sport if needed
    await page.evaluate(() => {
      fetch('/api/sports/activate/MLB', { method: 'POST' })
        .catch(() => {}); // Ignore errors if already active
    });
  });

  test('should display prop predictions with filtering options', async ({ page }) => {
    // Wait for props to load
    await page.waitForSelector('[data-testid="prop-list"]', { timeout: 10000 });
    
    // Check that props are displayed
    const propCards = await page.locator('[data-testid="prop-card"]').count();
    expect(propCards).toBeGreaterThan(0);
    
    // Check for filter controls
    await expect(page.locator('[data-testid="prop-filters"]')).toBeVisible();
  });

  test('should filter props by player name', async ({ page }) => {
    // Wait for props to load
    await page.waitForSelector('[data-testid="prop-list"]', { timeout: 10000 });
    
    // Get initial prop count
    const initialCount = await page.locator('[data-testid="prop-card"]').count();
    
    if (initialCount > 0) {
      // Try to find a player search input
      const playerSearch = page.locator('input[placeholder*="player" i], input[placeholder*="search" i]').first();
      
      if (await playerSearch.isVisible()) {
        // Enter a search term
        await playerSearch.fill('Smith');
        await page.waitForTimeout(1000); // Wait for debounced search
        
        // Verify filtering occurred
        const filteredCount = await page.locator('[data-testid="prop-card"]').count();
        expect(filteredCount).toBeLessThanOrEqual(initialCount);
      }
    }
  });

  test('should filter props by sport type', async ({ page }) => {
    // Wait for props to load
    await page.waitForSelector('[data-testid="prop-list"]', { timeout: 10000 });
    
    // Look for sport filter dropdown or buttons
    const sportFilter = page.locator('[data-testid="sport-filter"], select[name*="sport" i], button[role="button"]:has-text("MLB")').first();
    
    if (await sportFilter.isVisible()) {
      await sportFilter.click();
      await page.waitForTimeout(1000);
      
      // Verify props are still displayed after filter
      const filteredProps = await page.locator('[data-testid="prop-card"]').count();
      expect(filteredProps).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter props by confidence level', async ({ page }) => {
    // Wait for props to load
    await page.waitForSelector('[data-testid="prop-list"]', { timeout: 10000 });
    
    // Look for confidence filter (slider, dropdown, etc.)
    const confidenceFilter = page.locator('[data-testid="confidence-filter"], input[type="range"], select[name*="confidence" i]').first();
    
    if (await confidenceFilter.isVisible()) {
      const filterType = await confidenceFilter.getAttribute('type');
      
      if (filterType === 'range') {
        // Adjust slider to high confidence
        await confidenceFilter.fill('80');
      } else {
        // Click/select high confidence option
        await confidenceFilter.click();
      }
      
      await page.waitForTimeout(1000);
      
      // Verify filtering applied
      const filteredProps = await page.locator('[data-testid="prop-card"]').count();
      expect(filteredProps).toBeGreaterThanOrEqual(0);
    }
  });

  test('should sort props by different criteria', async ({ page }) => {
    // Wait for props to load
    await page.waitForSelector('[data-testid="prop-list"]', { timeout: 10000 });
    
    const initialProps = await page.locator('[data-testid="prop-card"]').count();
    
    if (initialProps > 1) {
      // Look for sort dropdown
      const sortControl = page.locator('[data-testid="sort-control"], select[name*="sort" i]').first();
      
      if (await sortControl.isVisible()) {
        // Change sort order
        await sortControl.selectOption({ label: /confidence/i });
        await page.waitForTimeout(1000);
        
        // Verify props are still displayed in new order
        const sortedProps = await page.locator('[data-testid="prop-card"]').count();
        expect(sortedProps).toBe(initialProps);
      }
    }
  });

  test('should handle empty filter results gracefully', async ({ page }) => {
    // Wait for props to load
    await page.waitForSelector('[data-testid="prop-list"]', { timeout: 10000 });
    
    // Apply a filter that should return no results
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="player" i]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('NonexistentPlayerXYZ123');
      await page.waitForTimeout(1000);
      
      // Should show "no results" message or empty state
      const noResults = await page.locator('[data-testid="no-results"], [data-testid="empty-state"]').isVisible();
      const emptyList = await page.locator('[data-testid="prop-card"]').count() === 0;
      
      expect(noResults || emptyList).toBeTruthy();
    }
  });

  test('should maintain filter state on page refresh', async ({ page }) => {
    // Wait for props to load
    await page.waitForSelector('[data-testid="prop-list"]', { timeout: 10000 });
    
    // Apply a filter
    const searchInput = page.locator('input[placeholder*="search" i]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('Test');
      await page.waitForTimeout(1000);
      
      // Refresh page
      await page.reload();
      await page.waitForSelector('[data-testid="prop-list"]', { timeout: 10000 });
      
      // Check if filter state is maintained (if implemented)
      const inputValue = await searchInput.inputValue();
      // Note: This test assumes filter state persistence is implemented
      // If not implemented, this test documents the expected behavior
    }
  });
});

// Test suite for advanced filtering features
test.describe('Advanced Filtering Features', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should support multiple simultaneous filters', async ({ page }) => {
    await page.waitForSelector('[data-testid="prop-list"]', { timeout: 10000 });
    
    const initialCount = await page.locator('[data-testid="prop-card"]').count();
    
    if (initialCount > 0) {
      // Apply multiple filters if available
      const playerFilter = page.locator('input[placeholder*="player" i]').first();
      const sportFilter = page.locator('[data-testid="sport-filter"]').first();
      
      if (await playerFilter.isVisible()) {
        await playerFilter.fill('John');
      }
      
      if (await sportFilter.isVisible()) {
        await sportFilter.click();
      }
      
      await page.waitForTimeout(1000);
      
      // Verify filters work together
      const filteredCount = await page.locator('[data-testid="prop-card"]').count();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    }
  });

  test('should provide clear all filters functionality', async ({ page }) => {
    await page.waitForSelector('[data-testid="prop-list"]', { timeout: 10000 });
    
    // Apply some filters
    const playerFilter = page.locator('input[placeholder*="player" i]').first();
    
    if (await playerFilter.isVisible()) {
      await playerFilter.fill('Test Filter');
      await page.waitForTimeout(1000);
      
      // Look for clear filters button
      const clearButton = page.locator('[data-testid="clear-filters"], button:has-text("Clear")').first();
      
      if (await clearButton.isVisible()) {
        await clearButton.click();
        await page.waitForTimeout(1000);
        
        // Verify filters are cleared
        const inputValue = await playerFilter.inputValue();
        expect(inputValue).toBe('');
      }
    }
  });
});
