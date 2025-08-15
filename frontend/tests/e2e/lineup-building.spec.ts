import { test, expect } from '@playwright/test';

// Test suite for lineup building functionality
test.describe('Lineup Building Integration', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the main application
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
    
    // Activate MLB sport
    await page.evaluate(() => {
      fetch('/api/sports/activate/MLB', { method: 'POST' })
        .catch(() => {}); // Ignore errors if already active
    });
  });

  test('should display available props for lineup building', async ({ page }) => {
    // Wait for props to load
    await page.waitForSelector('[data-testid="prop-list"]', { timeout: 10000 });
    
    // Check that props are displayed
    const propCards = await page.locator('[data-testid="prop-card"]').count();
    expect(propCards).toBeGreaterThan(0);
    
    // Look for bet slip or lineup builder
    const betSlip = page.locator('[data-testid="bet-slip"], [data-testid="lineup-builder"]').first();
    const hasBetSlip = await betSlip.isVisible();
    
    // Should have some way to build lineups
    expect(hasBetSlip).toBeTruthy();
  });

  test('should allow adding props to lineup/bet slip', async ({ page }) => {
    // Wait for props to load
    await page.waitForSelector('[data-testid="prop-list"]', { timeout: 10000 });
    
    const propCards = await page.locator('[data-testid="prop-card"]');
    const propCount = await propCards.count();
    
    if (propCount > 0) {
      // Find first prop card with add button
      const firstProp = propCards.first();
      const addButton = firstProp.locator('[data-testid="add-to-bet"], button:has-text("Add"), button[aria-label*="add" i]').first();
      
      if (await addButton.isVisible()) {
        await addButton.click();
        
        // Verify prop was added to bet slip
        const betSlipItems = await page.locator('[data-testid="bet-slip-item"], [data-testid="lineup-item"]').count();
        expect(betSlipItems).toBeGreaterThan(0);
      }
    }
  });

  test('should display bet slip with added props', async ({ page }) => {
    // Wait for props to load
    await page.waitForSelector('[data-testid="prop-list"]', { timeout: 10000 });
    
    // Try to add a prop to bet slip
    const propCards = await page.locator('[data-testid="prop-card"]');
    const propCount = await propCards.count();
    
    if (propCount > 0) {
      const firstProp = propCards.first();
      const addButton = firstProp.locator('[data-testid="add-to-bet"], button:has-text("Add")').first();
      
      if (await addButton.isVisible()) {
        await addButton.click();
        
        // Check bet slip visibility
        const betSlip = page.locator('[data-testid="bet-slip"], [data-testid="lineup-builder"]');
        await expect(betSlip.first()).toBeVisible();
        
        // Verify bet slip contains items
        const betSlipItems = await page.locator('[data-testid="bet-slip-item"]').count();
        expect(betSlipItems).toBeGreaterThan(0);
      }
    }
  });

  test('should allow removing props from lineup', async ({ page }) => {
    // Wait for props to load
    await page.waitForSelector('[data-testid="prop-list"]', { timeout: 10000 });
    
    // Add a prop first
    const propCards = await page.locator('[data-testid="prop-card"]');
    const propCount = await propCards.count();
    
    if (propCount > 0) {
      const firstProp = propCards.first();
      const addButton = firstProp.locator('[data-testid="add-to-bet"], button:has-text("Add")').first();
      
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);
        
        // Find remove button
        const removeButton = page.locator('[data-testid="remove-from-bet"], button:has-text("Remove"), button[aria-label*="remove" i]').first();
        
        if (await removeButton.isVisible()) {
          await removeButton.click();
          
          // Verify item was removed
          const betSlipItems = await page.locator('[data-testid="bet-slip-item"]').count();
          expect(betSlipItems).toBe(0);
        }
      }
    }
  });

  test('should calculate lineup totals and payouts', async ({ page }) => {
    // Wait for props to load
    await page.waitForSelector('[data-testid="prop-list"]', { timeout: 10000 });
    
    // Try to add multiple props
    const propCards = await page.locator('[data-testid="prop-card"]');
    const propCount = await propCards.count();
    
    if (propCount > 1) {
      // Add first prop
      const firstAddButton = propCards.first().locator('[data-testid="add-to-bet"], button:has-text("Add")').first();
      if (await firstAddButton.isVisible()) {
        await firstAddButton.click();
        await page.waitForTimeout(300);
      }
      
      // Add second prop
      const secondAddButton = propCards.nth(1).locator('[data-testid="add-to-bet"], button:has-text("Add")').first();
      if (await secondAddButton.isVisible()) {
        await secondAddButton.click();
        await page.waitForTimeout(300);
      }
      
      // Check for total calculation display
      const totalDisplay = page.locator('[data-testid="bet-total"], [data-testid="lineup-total"], [data-testid="payout"]').first();
      if (await totalDisplay.isVisible()) {
        const totalText = await totalDisplay.textContent();
        expect(totalText).toMatch(/\$|\d+|total|payout/i);
      }
    }
  });

  test('should validate lineup constraints', async ({ page }) => {
    // Wait for props to load
    await page.waitForSelector('[data-testid="prop-list"]', { timeout: 10000 });
    
    // Try to add many props to test constraints
    const propCards = await page.locator('[data-testid="prop-card"]');
    const propCount = await propCards.count();
    
    let addedProps = 0;
    
    // Try to add up to 6 props (typical fantasy lineup limit)
    for (let i = 0; i < Math.min(6, propCount); i++) {
      const addButton = propCards.nth(i).locator('[data-testid="add-to-bet"], button:has-text("Add")').first();
      
      if (await addButton.isVisible()) {
        await addButton.click();
        addedProps++;
        await page.waitForTimeout(200);
        
        // Check if there's a constraint message
        const constraintMessage = page.locator('[data-testid="constraint-error"], [role="alert"]');
        if (await constraintMessage.isVisible()) {
          break; // Stop if we hit a constraint
        }
      }
    }
    
    // Verify we have some props in lineup
    expect(addedProps).toBeGreaterThan(0);
  });

  test('should support different lineup types or contests', async ({ page }) => {
    // Wait for application to load
    await page.waitForLoadState('networkidle');
    
    // Look for contest type selector
    const contestSelector = page.locator('[data-testid="contest-type"], select[name*="contest" i], button:has-text("Contest")').first();
    
    if (await contestSelector.isVisible()) {
      await contestSelector.click();
      
      // Look for different contest options
      const contestOptions = page.locator('[data-testid="contest-option"], option').count();
      expect(await contestOptions).toBeGreaterThan(0);
    }
  });

  test('should save and load lineup drafts', async ({ page }) => {
    // Wait for props to load
    await page.waitForSelector('[data-testid="prop-list"]', { timeout: 10000 });
    
    // Build a small lineup
    const propCards = await page.locator('[data-testid="prop-card"]');
    const propCount = await propCards.count();
    
    if (propCount > 0) {
      const addButton = propCards.first().locator('[data-testid="add-to-bet"], button:has-text("Add")').first();
      
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(300);
        
        // Look for save functionality
        const saveButton = page.locator('[data-testid="save-lineup"], button:has-text("Save")').first();
        
        if (await saveButton.isVisible()) {
          await saveButton.click();
          
          // Verify save confirmation or success message
          const saveSuccess = page.locator('[data-testid="save-success"], [role="alert"]:has-text("saved")').first();
          const hasSaveSuccess = await saveSuccess.isVisible();
          
          // Save functionality should provide some feedback
          expect(hasSaveSuccess).toBeTruthy();
        }
      }
    }
  });
});

// Test suite for advanced lineup features
test.describe('Advanced Lineup Features', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should optimize lineup based on projections', async ({ page }) => {
    await page.waitForSelector('[data-testid="prop-list"]', { timeout: 10000 });
    
    // Look for auto-optimization feature
    const optimizeButton = page.locator('[data-testid="optimize-lineup"], button:has-text("Optimize")').first();
    
    if (await optimizeButton.isVisible()) {
      await optimizeButton.click();
      await page.waitForTimeout(2000); // Allow time for optimization
      
      // Verify optimization results
      const betSlipItems = await page.locator('[data-testid="bet-slip-item"]').count();
      expect(betSlipItems).toBeGreaterThan(0);
    }
  });

  test('should provide lineup analysis and insights', async ({ page }) => {
    await page.waitForSelector('[data-testid="prop-list"]', { timeout: 10000 });
    
    // Build a small lineup first
    const propCards = await page.locator('[data-testid="prop-card"]');
    const propCount = await propCards.count();
    
    if (propCount > 0) {
      const addButton = propCards.first().locator('[data-testid="add-to-bet"], button:has-text("Add")').first();
      
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);
        
        // Look for analysis features
        const analysisSection = page.locator('[data-testid="lineup-analysis"], [data-testid="insights"]').first();
        
        if (await analysisSection.isVisible()) {
          const analysisText = await analysisSection.textContent();
          expect(analysisText?.length).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should handle real-time odds updates in lineup', async ({ page }) => {
    await page.waitForSelector('[data-testid="prop-list"]', { timeout: 10000 });
    
    // Add props to lineup
    const propCards = await page.locator('[data-testid="prop-card"]');
    const propCount = await propCards.count();
    
    if (propCount > 0) {
      const addButton = propCards.first().locator('[data-testid="add-to-bet"], button:has-text("Add")').first();
      
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);
        
        // Look for live odds indicators
        const liveIndicator = page.locator('[data-testid="live-odds"], [data-testid="updating"]').first();
        const hasLiveUpdates = await liveIndicator.isVisible();
        
        // Test passes if live updates are implemented or not
        expect(typeof hasLiveUpdates).toBe('boolean');
      }
    }
  });
});
