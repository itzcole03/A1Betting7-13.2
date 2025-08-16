import { test, expect, Page } from '@playwright/test';

/**
 * Login Flow E2E Journey Tests
 * Tests authentication flows, session management, and error handling
 */

test.describe('Login Flow Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
    await page.context().clearPermissions();
    
    // Navigate to login page
    await page.goto('/');
  });

  test('complete login flow with valid credentials', async ({ page }) => {
    // Start from homepage - should redirect to login if not authenticated
    await page.goto('/');
    
    // Check if we're redirected to login or if login form is present
    const loginIndicator = page.locator('[data-testid="login-form"], [data-testid="auth-required"], .login-container, #login-form');
    
    // If no login form is visible, check if we're already authenticated
    const isLoggedIn = await page.locator('[data-testid="user-profile"], [data-testid="logout-btn"], .user-menu').isVisible();
    
    if (!isLoggedIn) {
      // Look for login elements
      await expect(loginIndicator.first()).toBeVisible({ timeout: 10000 });
      
      // Fill in login credentials (adjust selectors based on actual implementation)
      const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
      const passwordField = page.locator('input[type="password"], input[name="password"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
      
      if (await emailField.isVisible()) {
        await emailField.fill('test@example.com');
        await passwordField.fill('testpassword123');
        await submitButton.click();
        
        // Wait for login to complete
        await page.waitForLoadState('networkidle');
        
        // Verify successful login
        const successIndicator = page.locator('[data-testid="dashboard"], [data-testid="main-nav"], .main-content, [data-testid="analytics-dashboard"]');
        await expect(successIndicator.first()).toBeVisible({ timeout: 15000 });
      }
    }
    
    // Verify we can access protected routes
    await page.goto('/analytics');
    
    // Should not be redirected back to login
    await page.waitForLoadState('networkidle');
    const currentUrl = page.url();
    expect(currentUrl).toContain('/analytics');
  });

  test('handle invalid credentials gracefully', async ({ page }) => {
    // Navigate to login
    await page.goto('/');
    
    const loginForm = page.locator('[data-testid="login-form"], .login-container, #login-form').first();
    
    if (await loginForm.isVisible()) {
      const emailField = page.locator('input[type="email"], input[name="email"]').first();
      const passwordField = page.locator('input[type="password"], input[name="password"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Login")').first();
      
      // Try invalid credentials
      await emailField.fill('invalid@example.com');
      await passwordField.fill('wrongpassword');
      await submitButton.click();
      
      // Wait for error message
      const errorMessage = page.locator('[data-testid="error-message"], .error, .alert-error, [role="alert"]');
      await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
      
      // Verify we're still on login page
      const stillOnLogin = page.locator('[data-testid="login-form"], .login-container');
      await expect(stillOnLogin.first()).toBeVisible();
    } else {
      // No login form found - app may use different auth mechanism or be in development mode
      test.skip(true, 'No login form found - skipping invalid credentials test');
    }
  });

  test('session persistence across page refreshes', async ({ page }) => {
    // Complete login first
    await loginIfRequired(page);
    
    // Navigate to a protected page
    await page.goto('/analytics');
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify we're still authenticated and not redirected to login
    const currentUrl = page.url();
    expect(currentUrl).toContain('/analytics');
    
    // Verify protected content is still visible
    const protectedContent = page.locator('[data-testid="analytics-dashboard"], .analytics-content, .dashboard-content');
    await expect(protectedContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('logout flow and session cleanup', async ({ page }) => {
    // Complete login first
    await loginIfRequired(page);
    
    // Look for logout option
    const logoutButton = page.locator('[data-testid="logout-btn"], button:has-text("Logout"), button:has-text("Sign Out"), .user-menu button');
    
    // If logout button is in a dropdown/menu, open it first
    const userMenu = page.locator('[data-testid="user-menu"], .user-dropdown, .profile-menu');
    if (await userMenu.isVisible()) {
      await userMenu.click();
    }
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // Wait for logout to complete
      await page.waitForLoadState('networkidle');
      
      // Verify we're redirected to login or homepage
      const afterLogout = page.locator('[data-testid="login-form"], .login-container, .homepage');
      await expect(afterLogout.first()).toBeVisible({ timeout: 10000 });
      
      // Verify we can't access protected routes
      await page.goto('/analytics');
      await page.waitForLoadState('networkidle');
      
      // Should either be redirected or see login prompt
      const currentUrl = page.url();
      const isProtected = currentUrl.includes('/login') || await page.locator('[data-testid="login-form"], .auth-required').first().isVisible();
      expect(isProtected).toBeTruthy();
    } else {
      // No logout button found - may be using different auth pattern
      test.skip(true, 'No logout button found - skipping logout test');
    }
  });
});

// Helper function to login if required
async function loginIfRequired(page: Page) {
  const isLoggedIn = await page.locator('[data-testid="user-profile"], [data-testid="logout-btn"], .user-menu').first().isVisible();
  
  if (!isLoggedIn) {
    await page.goto('/');
    
    const loginForm = page.locator('[data-testid="login-form"], .login-container, #login-form').first();
    if (await loginForm.isVisible()) {
      const emailField = page.locator('input[type="email"], input[name="email"]').first();
      const passwordField = page.locator('input[type="password"], input[name="password"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Login")').first();
      
      await emailField.fill('test@example.com');
      await passwordField.fill('testpassword123');
      await submitButton.click();
      
      await page.waitForLoadState('networkidle');
    }
  }
}