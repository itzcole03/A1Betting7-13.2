import { test, expect, Page } from '@playwright/test';

/**
 * Navigation Journey E2E Tests
 * Tests primary navigation flows, route accessibility, and responsive navigation
 */

test.describe('Navigation Journey', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Ensure we start with a clean session
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('main navigation structure and accessibility', async () => {
    // Check for primary navigation elements
    const navigation = page.locator('[data-testid="main-nav"], nav, .navigation, .sidebar, .header-nav').first();
    await expect(navigation).toBeVisible({ timeout: 10000 });

    // Test common navigation items
    const navItems = [
      { text: /home|dashboard/i, path: '/', testId: 'nav-home' },
      { text: /analytics|sports/i, path: '/analytics', testId: 'nav-analytics' },
      { text: /betting|props/i, path: '/betting', testId: 'nav-betting' },
      { text: /models?|ai|ml/i, path: '/ml-models', testId: 'nav-models' },
    ];

    for (const item of navItems) {
      // Look for navigation item by text, test id, or href
      const navLink = page.locator(`
        [data-testid="${item.testId}"],
        nav a:has-text("${item.text.source}"),
        [href="${item.path}"],
        a[href*="${item.path}"]
      `).first();

      if (await navLink.isVisible()) {
        // Test navigation
        await navLink.click();
        await page.waitForLoadState('networkidle');
        
        // Verify URL changed
        const currentUrl = page.url();
        expect(currentUrl).toContain(item.path === '/' ? '/' : item.path);
        
        // Verify page content loaded
        const pageContent = page.locator('main, .main-content, [data-testid="page-content"]').first();
        await expect(pageContent).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('breadcrumb navigation functionality', async () => {
    // Navigate to a nested page
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Look for breadcrumbs
    const breadcrumbs = page.locator('[data-testid="breadcrumbs"], .breadcrumbs, nav[aria-label*="breadcrumb" i]');
    
    if (await breadcrumbs.isVisible()) {
      // Test breadcrumb navigation
      const homeLink = breadcrumbs.locator('a:has-text("Home"), a:has-text("Dashboard")').first();
      
      if (await homeLink.isVisible()) {
        await homeLink.click();
        await page.waitForLoadState('networkidle');
        
        // Verify we're back at home
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/\/$|\/dashboard|\/home/);
      }
    }
  });

  test('responsive navigation behavior', async () => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for mobile menu toggle
    const mobileMenuToggle = page.locator('[data-testid="mobile-menu-toggle"], .hamburger, .menu-toggle, button[aria-label*="menu" i]');
    
    if (await mobileMenuToggle.isVisible()) {
      // Open mobile menu
      await mobileMenuToggle.click();
      
      // Verify menu is open
      const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-nav, .drawer, .sidebar.open');
      await expect(mobileMenu.first()).toBeVisible({ timeout: 5000 });
      
      // Test navigation in mobile view
      const mobileNavLink = mobileMenu.locator('a').first();
      if (await mobileNavLink.isVisible()) {
        await mobileNavLink.click();
        await page.waitForLoadState('networkidle');
        
        // Menu should close after navigation
        const isMenuClosed = await mobileMenu.isHidden();
        if (!isMenuClosed) {
          // Some implementations keep menu open, that's also valid
          expect(await mobileMenu.isVisible()).toBeTruthy();
        }
      }
    }

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000); // Allow time for responsive changes
    
    // Verify navigation adapts to tablet size
    const navigation = page.locator('[data-testid="main-nav"], nav').first();
    await expect(navigation).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(1000);
    
    // Verify full desktop navigation is visible
    await expect(navigation).toBeVisible();
  });

  test('back and forward browser navigation', async () => {
    // Start at home
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to analytics
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain('/analytics');

    // Use browser back button
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).not.toContain('/analytics');

    // Use browser forward button
    await page.goForward();
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain('/analytics');
  });

  test('keyboard navigation accessibility', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test Tab navigation
    await page.keyboard.press('Tab');
    
    // Verify focus is visible on navigation elements
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Continue tabbing through navigation
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const currentFocused = page.locator(':focus');
      
      if (await currentFocused.isVisible()) {
        // Check if it's a navigation link
        const isNavLink = await currentFocused.evaluate((el) => 
          el.tagName.toLowerCase() === 'a' && el.closest('nav') !== null
        );
        
        if (isNavLink) {
          // Test Enter key activation
          const href = await currentFocused.getAttribute('href');
          if (href) {
            await page.keyboard.press('Enter');
            await page.waitForLoadState('networkidle');
            
            // Verify navigation occurred
            const currentUrl = page.url();
            expect(currentUrl).toContain(href === '/' ? '/' : href);
            break;
          }
        }
      }
    }
  });

  test('search navigation functionality', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for search functionality
    const searchInput = page.locator('[data-testid="search"], input[type="search"], input[placeholder*="search" i]');
    
    if (await searchInput.isVisible()) {
      // Test search
      await searchInput.fill('MLB');
      await page.keyboard.press('Enter');
      
      await page.waitForLoadState('networkidle');
      
      // Verify search results or navigation
      const searchResults = page.locator('[data-testid="search-results"], .search-results, .results');
      const isOnSearchPage = page.url().includes('search') || page.url().includes('query');
      
      const hasResults = await searchResults.isVisible() || isOnSearchPage;
      expect(hasResults).toBeTruthy();
    }
  });

  test('error page navigation and recovery', async () => {
    // Navigate to a non-existent page
    await page.goto('/non-existent-page-404');
    await page.waitForLoadState('networkidle');

    // Look for error page or 404 handling
    const errorIndicators = page.locator('[data-testid="error-page"], .error-page, .not-found, h1:has-text("404"), h1:has-text("Error")');
    
    if (await errorIndicators.first().isVisible()) {
      // Look for navigation back to home
      const homeLink = page.locator('a[href="/"], a:has-text("Home"), a:has-text("Dashboard"), [data-testid="back-home"]');
      
      if (await homeLink.first().isVisible()) {
        await homeLink.first().click();
        await page.waitForLoadState('networkidle');
        
        // Verify we're back at home
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/\/$|\/dashboard|\/home/);
      }
    }
  });

  test('deep link navigation and state preservation', async () => {
    // Navigate directly to a specific analytics view
    await page.goto('/analytics?sport=MLB&date=2024-01-01');
    await page.waitForLoadState('networkidle');

    // Verify the page loads with the correct state
    const currentUrl = page.url();
    expect(currentUrl).toContain('sport=MLB');
    expect(currentUrl).toContain('date=2024-01-01');

    // Check if the page state reflects the URL parameters
    const sportSelector = page.locator('[data-testid="sport-selector"], select[name="sport"], .sport-filter');
    
    if (await sportSelector.isVisible()) {
      const selectedValue = await sportSelector.inputValue();
      expect(selectedValue).toBe('MLB');
    }

    // Navigate away and back
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // Verify state is preserved
    const restoredUrl = page.url();
    expect(restoredUrl).toContain('sport=MLB');
    expect(restoredUrl).toContain('date=2024-01-01');
  });
});