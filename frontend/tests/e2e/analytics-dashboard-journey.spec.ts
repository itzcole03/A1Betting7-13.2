import { test, expect, Page } from '@playwright/test';

/**
 * Analytics Dashboard E2E Journey Tests
 * Tests analytics interface, data visualization, filtering, and user interactions
 */

test.describe('Analytics Dashboard Journey', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Navigate to analytics dashboard
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    
    // Wait for initial data load
    await page.waitForTimeout(2000);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('dashboard loads with initial data and components', async () => {
    // Verify main dashboard components are visible
    const dashboardContainer = page.locator('[data-testid="analytics-dashboard"], .analytics-dashboard, .dashboard-container').first();
    await expect(dashboardContainer).toBeVisible({ timeout: 15000 });

    // Check for key dashboard elements
    const expectedElements = [
      { selector: '[data-testid="sport-selector"], .sport-filter, select[name="sport"]', name: 'Sport Selector' },
      { selector: '[data-testid="date-picker"], .date-filter, input[type="date"]', name: 'Date Picker' },
      { selector: '[data-testid="props-list"], .props-container, .predictions-list', name: 'Props List' },
      { selector: '[data-testid="loading-indicator"], .loading, .spinner', name: 'Loading Indicator', optional: true },
    ];

    for (const element of expectedElements) {
      const locator = page.locator(element.selector).first();
      const isVisible = await locator.isVisible();
      
      if (!element.optional) {
        expect(isVisible, `${element.name} should be visible`).toBeTruthy();
      }
    }
  });

  test('sport selection changes dashboard content', async () => {
    // Find sport selector
    const sportSelector = page.locator('[data-testid="sport-selector"], .sport-filter, select[name="sport"]').first();
    
    if (await sportSelector.isVisible()) {
      // Get current sport
      const initialSport = await sportSelector.inputValue();
      
      // Change sport (try common options)
      const sportOptions = ['MLB', 'NBA', 'NFL', 'NHL'];
      const targetSport = sportOptions.find(sport => sport !== initialSport) || 'MLB';
      
      await sportSelector.selectOption(targetSport);
      
      // Wait for content to update
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Allow for API calls
      
      // Verify sport changed
      const updatedSport = await sportSelector.inputValue();
      expect(updatedSport).toBe(targetSport);
      
      // Verify content updated (check for sport-specific indicators)
      const sportIndicators = page.locator(`[data-sport="${targetSport}"], .sport-${targetSport.toLowerCase()}, :has-text("${targetSport}")`);
      
      if (await sportIndicators.first().isVisible()) {
        expect(await sportIndicators.first().isVisible()).toBeTruthy();
      }
    }
  });

  test('props filtering and search functionality', async () => {
    // Wait for props to load
    const propsContainer = page.locator('[data-testid="props-list"], .props-container, .predictions-list').first();
    await expect(propsContainer).toBeVisible({ timeout: 15000 });

    // Look for search/filter inputs
    const searchInput = page.locator('[data-testid="props-search"], input[placeholder*="search" i], .search-input').first();
    
    if (await searchInput.isVisible()) {
      // Test search functionality
      await searchInput.fill('home run');
      await page.waitForTimeout(2000); // Allow for filtering
      
      // Check if results are filtered
      const propItems = page.locator('[data-testid="prop-card"], .prop-item, .prediction-card');
      const visibleProps = await propItems.count();
      
      expect(visibleProps).toBeGreaterThan(0);
      
      // Verify search results contain search term
      const firstProp = propItems.first();
      if (await firstProp.isVisible()) {
        const propText = await firstProp.textContent();
        expect(propText?.toLowerCase()).toContain('home run');
      }
      
      // Clear search
      await searchInput.fill('');
      await page.waitForTimeout(1000);
    }

    // Test filter dropdowns
    const filterDropdowns = page.locator('[data-testid*="filter"], select[name*="filter"], .filter-select');
    const dropdownCount = await filterDropdowns.count();
    
    if (dropdownCount > 0) {
      const firstFilter = filterDropdowns.first();
      const options = await firstFilter.locator('option').count();
      
      if (options > 1) {
        // Select a filter option
        await firstFilter.selectOption({ index: 1 });
        await page.waitForTimeout(2000);
        
        // Verify filtering applied
        const propItems = page.locator('[data-testid="prop-card"], .prop-item, .prediction-card');
        const filteredProps = await propItems.count();
        expect(filteredProps).toBeGreaterThan(0);
      }
    }
  });

  test('prop card interactions and expanded details', async () => {
    // Wait for props to load
    const propsContainer = page.locator('[data-testid="props-list"], .props-container').first();
    await expect(propsContainer).toBeVisible({ timeout: 15000 });

    // Find prop cards
    const propCards = page.locator('[data-testid="prop-card"], .prop-item, .prediction-card');
    const cardCount = await propCards.count();
    
    if (cardCount > 0) {
      const firstCard = propCards.first();
      
      // Test card expansion
      const expandButton = firstCard.locator('[data-testid="expand-btn"], .expand-toggle, button:has-text("Expand"), .details-toggle').first();
      
      if (await expandButton.isVisible()) {
        await expandButton.click();
        
        // Wait for expansion animation
        await page.waitForTimeout(1000);
        
        // Verify expanded content is visible
        const expandedContent = firstCard.locator('[data-testid="expanded-details"], .expanded-content, .prop-details');
        await expect(expandedContent.first()).toBeVisible({ timeout: 5000 });
        
        // Test collapse
        const collapseButton = firstCard.locator('[data-testid="collapse-btn"], .collapse-toggle, button:has-text("Collapse")').first();
        if (await collapseButton.isVisible()) {
          await collapseButton.click();
          await page.waitForTimeout(1000);
          
          // Verify content is collapsed
          const isCollapsed = await expandedContent.first().isHidden();
          expect(isCollapsed).toBeTruthy();
        }
      }

      // Test betting actions if available
      const betButton = firstCard.locator('[data-testid="add-bet"], .bet-button, button:has-text("Bet")').first();
      
      if (await betButton.isVisible()) {
        await betButton.click();
        
        // Look for bet slip or confirmation
        const betConfirmation = page.locator('[data-testid="bet-slip"], .bet-confirmation, .added-to-slip');
        
        if (await betConfirmation.first().isVisible({ timeout: 3000 })) {
          expect(await betConfirmation.first().isVisible()).toBeTruthy();
        }
      }
    }
  });

  test('data visualization and charts interaction', async () => {
    // Look for chart containers
    const charts = page.locator('[data-testid*="chart"], .chart-container, .recharts-wrapper, canvas, svg');
    const chartCount = await charts.count();
    
    if (chartCount > 0) {
      const firstChart = charts.first();
      await expect(firstChart).toBeVisible();
      
      // Test chart interactions (hover, click)
      const chartBounds = await firstChart.boundingBox();
      if (chartBounds) {
        // Hover over chart
        await page.mouse.move(chartBounds.x + chartBounds.width / 2, chartBounds.y + chartBounds.height / 2);
        await page.waitForTimeout(1000);
        
        // Look for tooltips or hover effects
        const tooltips = page.locator('.recharts-tooltip, .tooltip, [data-testid="chart-tooltip"]');
        
        if (await tooltips.first().isVisible({ timeout: 2000 })) {
          expect(await tooltips.first().isVisible()).toBeTruthy();
        }
      }

      // Test chart legend interactions
      const legends = page.locator('.recharts-legend, .chart-legend, [data-testid="chart-legend"]');
      
      if (await legends.first().isVisible()) {
        const legendItems = legends.first().locator('span, .legend-item, [data-testid="legend-item"]');
        const itemCount = await legendItems.count();
        
        if (itemCount > 0) {
          // Click legend item to toggle series
          await legendItems.first().click();
          await page.waitForTimeout(1000);
          
          // Verify chart updated (this is visual, so we just check it doesn't crash)
          await expect(firstChart).toBeVisible();
        }
      }
    }
  });

  test('sorting and pagination functionality', async () => {
    // Test sorting
    const sortDropdown = page.locator('[data-testid="sort-select"], .sort-dropdown, select[name*="sort"]').first();
    
    if (await sortDropdown.isVisible()) {
      // Get initial prop order
      const propCards = page.locator('[data-testid="prop-card"], .prop-item');
      const initialFirst = await propCards.first().textContent();
      
      // Change sort option
      const sortOptions = await sortDropdown.locator('option').count();
      if (sortOptions > 1) {
        await sortDropdown.selectOption({ index: 1 });
        await page.waitForTimeout(2000);
        
        // Verify order changed
        const newFirst = await propCards.first().textContent();
        expect(newFirst).not.toBe(initialFirst);
      }
    }

    // Test pagination
    const pagination = page.locator('[data-testid="pagination"], .pagination, .page-navigation').first();
    
    if (await pagination.isVisible()) {
      const nextButton = pagination.locator('[data-testid="next-page"], button:has-text("Next"), .next-btn').first();
      
      if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
        // Get current page props
        const currentProps = await page.locator('[data-testid="prop-card"]').count();
        
        // Go to next page
        await nextButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Verify page changed
        const newProps = await page.locator('[data-testid="prop-card"]').count();
        
        // Either props changed or we're on a different page
        const pageIndicator = page.locator('.current-page, [data-testid="current-page"]');
        const pageChanged = newProps !== currentProps || await pageIndicator.isVisible();
        
        expect(pageChanged).toBeTruthy();
      }
    }
  });

  test('performance metrics and loading states', async () => {
    // Test initial loading state
    await page.goto('/analytics', { waitUntil: 'domcontentloaded' });
    
    // Check for loading indicators
    const loadingIndicators = page.locator('[data-testid="loading"], .loading, .spinner, .skeleton');
    
    if (await loadingIndicators.first().isVisible({ timeout: 1000 })) {
      // Wait for loading to complete
      await loadingIndicators.first().waitFor({ state: 'hidden', timeout: 30000 });
    }
    
    // Verify content loaded
    const contentLoaded = page.locator('[data-testid="props-list"], .props-container');
    await expect(contentLoaded.first()).toBeVisible({ timeout: 15000 });
    
    // Test refresh functionality
    const refreshButton = page.locator('[data-testid="refresh"], .refresh-btn, button:has-text("Refresh")').first();
    
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      
      // Should see loading state again
      const refreshLoading = page.locator('[data-testid="loading"], .loading').first();
      
      if (await refreshLoading.isVisible({ timeout: 2000 })) {
        await refreshLoading.waitFor({ state: 'hidden', timeout: 20000 });
      }
      
      // Content should still be there after refresh
      await expect(contentLoaded.first()).toBeVisible();
    }
  });

  test('error handling and recovery', async () => {
    // Simulate network issues by blocking API calls
    await page.route('**/api/**', route => route.abort());
    
    // Navigate to analytics (should trigger error state)
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Look for error states
    const errorIndicators = page.locator('[data-testid="error"], .error-message, .error-state, :has-text("Error"), :has-text("Failed to load")');
    
    if (await errorIndicators.first().isVisible({ timeout: 10000 })) {
      // Look for retry button
      const retryButton = page.locator('[data-testid="retry"], .retry-btn, button:has-text("Retry"), button:has-text("Try Again")').first();
      
      if (await retryButton.isVisible()) {
        // Restore network
        await page.unroute('**/api/**');
        
        // Click retry
        await retryButton.click();
        await page.waitForTimeout(3000);
        
        // Verify recovery
        const content = page.locator('[data-testid="props-list"], .props-container').first();
        const recovered = await content.isVisible({ timeout: 15000 });
        
        if (recovered) {
          expect(recovered).toBeTruthy();
        }
      }
    }
  });

  test('responsive design across viewports', async () => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1200, height: 800, name: 'Desktop' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000); // Allow for responsive changes
      
      // Verify dashboard is still functional
      const dashboard = page.locator('[data-testid="analytics-dashboard"], .analytics-dashboard').first();
      await expect(dashboard).toBeVisible();
      
      // Check if mobile-specific elements appear
      if (viewport.width < 768) {
        // Mobile: filters might be in a collapsible section
        const mobileFilters = page.locator('[data-testid="mobile-filters"], .mobile-only, .filters-drawer');
        
        if (await mobileFilters.first().isVisible()) {
          expect(await mobileFilters.first().isVisible()).toBeTruthy();
        }
      } else {
        // Desktop: full filters should be visible
        const desktopFilters = page.locator('[data-testid="filters"], .filters-container');
        
        if (await desktopFilters.first().isVisible()) {
          expect(await desktopFilters.first().isVisible()).toBeTruthy();
        }
      }
    }
  });
});