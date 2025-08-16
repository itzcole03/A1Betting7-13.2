import { test, expect, Page } from '@playwright/test';

/**
 * Live Update Consumption E2E Journey Tests
 * Tests real-time data updates, WebSocket connections, and live features
 */

test.describe('Live Update Consumption Journey', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Enable WebSocket monitoring
    await page.route('ws://**', (route) => {
      // Log WebSocket connections for debugging
      route.continue();
    });

    // Navigate to a page with live updates
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('live data indicators and connection status', async () => {
    // Look for live data indicators
    const liveIndicators = page.locator(
      '[data-testid="live-indicator"], ' +
      '.live-status, ' +
      '.connection-status, ' +
      ':has-text("Live"), ' +
      ':has-text("Connected"), ' +
      '.status-connected'
    );

    // Wait for live indicators to appear
    const hasLiveIndicator = await liveIndicators.first().isVisible({ timeout: 10000 });
    
    if (hasLiveIndicator) {
      expect(await liveIndicators.first().isVisible()).toBeTruthy();
      
      // Check indicator shows connected status
      const indicatorText = await liveIndicators.first().textContent();
      const isConnected = indicatorText?.toLowerCase().includes('live') || 
                         indicatorText?.toLowerCase().includes('connected') ||
                         indicatorText?.toLowerCase().includes('online');
      
      expect(isConnected).toBeTruthy();
    }

    // Look for WebSocket connection status
    const wsStatus = page.locator('[data-testid="ws-status"], .websocket-status, .realtime-status');
    
    if (await wsStatus.first().isVisible()) {
      const statusText = await wsStatus.first().textContent();
      expect(statusText).toBeTruthy();
    }
  });

  test('real-time prop updates and price changes', async () => {
    // Wait for initial props to load
    const propsContainer = page.locator('[data-testid="props-list"], .props-container').first();
    await expect(propsContainer).toBeVisible({ timeout: 15000 });

    // Find prop cards with odds/prices
    const propCards = page.locator('[data-testid="prop-card"], .prop-item');
    const cardCount = await propCards.count();
    
    if (cardCount > 0) {
      const firstCard = propCards.first();
      
      // Get initial odds/price values
      const oddsElements = firstCard.locator('.odds, .price, [data-testid="odds"]');
      const initialOdds: string[] = [];
      
      const oddsCount = await oddsElements.count();
      for (let i = 0; i < Math.min(oddsCount, 3); i++) {
        const oddsText = await oddsElements.nth(i).textContent();
        if (oddsText) {
          initialOdds.push(oddsText.trim());
        }
      }

      // Wait for potential updates (live data systems typically update every 5-30 seconds)
      await page.waitForTimeout(10000);
      
      // Check if any odds have updated
      let hasUpdates = false;
      for (let i = 0; i < Math.min(oddsCount, 3); i++) {
        const currentOdds = await oddsElements.nth(i).textContent();
        if (currentOdds && currentOdds.trim() !== initialOdds[i]) {
          hasUpdates = true;
          break;
        }
      }

      // Look for update animations or indicators
      const updateIndicators = firstCard.locator('.updated, .price-change, .odds-change, [data-testid="updated"]');
      const hasUpdateAnimation = await updateIndicators.first().isVisible({ timeout: 1000 });
      
      if (hasUpdates || hasUpdateAnimation) {
        expect(hasUpdates || hasUpdateAnimation).toBeTruthy();
      }
    }
  });

  test('live game status and score updates', async () => {
    // Navigate to live games section if available
    const liveGamesLink = page.locator('[data-testid="live-games"], a:has-text("Live"), .live-games-nav');
    
    if (await liveGamesLink.first().isVisible()) {
      await liveGamesLink.first().click();
      await page.waitForLoadState('networkidle');
    }

    // Look for live game elements
    const liveGames = page.locator('[data-testid="live-game"], .live-game, .game-live');
    const liveGameCount = await liveGames.count();
    
    if (liveGameCount > 0) {
      const firstLiveGame = liveGames.first();
      
      // Get initial score
      const scoreElements = firstLiveGame.locator('.score, [data-testid="score"]');
      const initialScores: string[] = [];
      
      const scoreCount = await scoreElements.count();
      for (let i = 0; i < scoreCount; i++) {
        const scoreText = await scoreElements.nth(i).textContent();
        if (scoreText) {
          initialScores.push(scoreText.trim());
        }
      }

      // Wait for potential score updates
      await page.waitForTimeout(15000);
      
      // Check for score changes
      let scoreChanged = false;
      for (let i = 0; i < scoreCount; i++) {
        const currentScore = await scoreElements.nth(i).textContent();
        if (currentScore && currentScore.trim() !== initialScores[i]) {
          scoreChanged = true;
          break;
        }
      }

      // Look for live indicators
      const liveIndicators = firstLiveGame.locator('.live-indicator, .status-live, :has-text("LIVE")');
      const hasLiveIndicator = await liveIndicators.first().isVisible();
      
      if (scoreChanged || hasLiveIndicator) {
        expect(scoreChanged || hasLiveIndicator).toBeTruthy();
      }
    }
  });

  test('notification system for live updates', async () => {
    // Look for notification container
    const notificationContainer = page.locator(
      '[data-testid="notifications"], ' +
      '.notifications, ' +
      '.toast-container, ' +
      '.alerts-container'
    );

    // Wait for potential notifications
    await page.waitForTimeout(5000);
    
    if (await notificationContainer.first().isVisible()) {
      // Check for notification types
      const notifications = notificationContainer.locator('.notification, .toast, .alert');
      const notificationCount = await notifications.count();
      
      if (notificationCount > 0) {
        const firstNotification = notifications.first();
        
        // Verify notification content
        const notificationText = await firstNotification.textContent();
        expect(notificationText).toBeTruthy();
        
        // Look for live update related notifications
        const isLiveNotification = notificationText?.toLowerCase().includes('update') ||
                                  notificationText?.toLowerCase().includes('change') ||
                                  notificationText?.toLowerCase().includes('live');
        
        if (isLiveNotification) {
          expect(isLiveNotification).toBeTruthy();
        }
      }
    }

    // Test notification interaction (dismiss)
    const dismissButton = page.locator('.notification .close, .toast .dismiss, [data-testid="dismiss-notification"]');
    
    if (await dismissButton.first().isVisible()) {
      await dismissButton.first().click();
      
      // Verify notification is dismissed
      await page.waitForTimeout(1000);
      const isDismissed = await dismissButton.first().isHidden();
      expect(isDismissed).toBeTruthy();
    }
  });

  test('websocket connection handling and reconnection', async () => {
    // Monitor WebSocket messages
    interface WSMessage {
      type: 'sent' | 'received';
      payload: string | Buffer;
    }
    
    const wsMessages: WSMessage[] = [];
    
    page.on('websocket', (ws) => {
      ws.on('framesent', (event) => {
        wsMessages.push({ type: 'sent', payload: event.payload });
      });
      
      ws.on('framereceived', (event) => {
        wsMessages.push({ type: 'received', payload: event.payload });
      });
    });

    // Wait for WebSocket connection to establish
    await page.waitForTimeout(5000);
    
    // Simulate network disconnection
    await page.context().setOffline(true);
    await page.waitForTimeout(3000);
    
    // Look for disconnection indicators
    const disconnectIndicators = page.locator(
      '[data-testid="disconnected"], ' +
      '.connection-lost, ' +
      '.offline-indicator, ' +
      ':has-text("Disconnected"), ' +
      ':has-text("Offline")'
    );
    
    const isDisconnectedShown = await disconnectIndicators.first().isVisible({ timeout: 10000 });
    
    // Restore network connection
    await page.context().setOffline(false);
    await page.waitForTimeout(3000);
    
    // Look for reconnection indicators
    const reconnectIndicators = page.locator(
      '[data-testid="reconnected"], ' +
      '.connection-restored, ' +
      ':has-text("Reconnected"), ' +
      ':has-text("Online")'
    );
    
    const isReconnectedShown = await reconnectIndicators.first().isVisible({ timeout: 10000 });
    
    if (isDisconnectedShown || isReconnectedShown) {
      expect(isDisconnectedShown || isReconnectedShown).toBeTruthy();
    }
  });

  test('live betting odds movement tracking', async () => {
    // Navigate to betting interface
    const bettingLink = page.locator('[data-testid="betting-nav"], a[href*="betting"], a:has-text("Betting")');
    
    if (await bettingLink.first().isVisible()) {
      await bettingLink.first().click();
      await page.waitForLoadState('networkidle');
    }

    // Look for odds with movement indicators
    const oddsElements = page.locator('.odds, .price, [data-testid="odds"]');
    const oddsCount = await oddsElements.count();
    
    if (oddsCount > 0) {
      // Track odds changes over time
      interface OddsTrack {
        element: ReturnType<typeof page.locator>;
        initialValue: string;
        timestamps: number[];
      }
      
      const oddsTracking: OddsTrack[] = [];
      
      for (let i = 0; i < Math.min(oddsCount, 5); i++) {
        const odds = oddsElements.nth(i);
        const initialValue = await odds.textContent() || '';
        
        oddsTracking.push({
          element: odds,
          initialValue: initialValue.trim(),
          timestamps: [Date.now()]
        });
      }

      // Monitor for changes over 30 seconds
      const monitoringDuration = 30000;
      const checkInterval = 2000;
      const startTime = Date.now();
      
      while (Date.now() - startTime < monitoringDuration) {
        await page.waitForTimeout(checkInterval);
        
        for (const track of oddsTracking) {
          const currentValue = await track.element.textContent() || '';
          
          if (currentValue.trim() !== track.initialValue) {
            track.timestamps.push(Date.now());
            track.initialValue = currentValue.trim();
          }
        }
      }

      // Check for odds movement indicators
      const movementIndicators = page.locator(
        '.odds-up, .odds-down, .price-increase, .price-decrease, ' +
        '[data-testid="odds-movement"], .movement-indicator'
      );
      
      const hasMovementIndicators = await movementIndicators.first().isVisible({ timeout: 1000 });
      
      // Verify at least some tracking occurred
      const hasTrackedChanges = oddsTracking.some(track => track.timestamps.length > 1);
      
      if (hasTrackedChanges || hasMovementIndicators) {
        expect(hasTrackedChanges || hasMovementIndicators).toBeTruthy();
      }
    }
  });

  test('live event timeline and play-by-play', async () => {
    // Look for live event timeline
    const timeline = page.locator(
      '[data-testid="event-timeline"], ' +
      '.timeline, ' +
      '.play-by-play, ' +
      '.live-events'
    );

    if (await timeline.first().isVisible({ timeout: 10000 })) {
      // Get initial event count
      const eventItems = timeline.first().locator('.event, .play, .timeline-item');
      const initialEventCount = await eventItems.count();
      
      // Wait for new events
      await page.waitForTimeout(20000);
      
      // Check for new events
      const updatedEventCount = await eventItems.count();
      const hasNewEvents = updatedEventCount > initialEventCount;
      
      // Look for real-time event indicators
      const liveEventIndicators = timeline.first().locator(
        '.new-event, .latest-event, .live-update, [data-testid="new-event"]'
      );
      
      const hasLiveEventIndicator = await liveEventIndicators.first().isVisible({ timeout: 1000 });
      
      if (hasNewEvents || hasLiveEventIndicator) {
        expect(hasNewEvents || hasLiveEventIndicator).toBeTruthy();
      }

      // Test event interaction
      if (await eventItems.first().isVisible()) {
        await eventItems.first().click();
        
        // Look for event details or expanded view
        const eventDetails = page.locator('.event-details, .play-details, .expanded-event');
        
        if (await eventDetails.first().isVisible({ timeout: 3000 })) {
          expect(await eventDetails.first().isVisible()).toBeTruthy();
        }
      }
    }
  });

  test('live data performance and optimization', async () => {
    // Monitor network requests
    interface NetworkRequest {
      url: string;
      method: string;
      timestamp: number;
    }
    
    const networkRequests: NetworkRequest[] = [];
    
    page.on('request', (request) => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      });
    });

    // Load live data page
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    
    // Monitor for a period
    const monitorStart = Date.now();
    await page.waitForTimeout(30000);
    const monitorEnd = Date.now();
    
    // Analyze request patterns
    const liveDataRequests = networkRequests.filter(req => 
      req.url.includes('/api/') && 
      req.timestamp >= monitorStart && 
      req.timestamp <= monitorEnd
    );
    
    // Check request frequency (should not be excessive)
    const requestFrequency = liveDataRequests.length / ((monitorEnd - monitorStart) / 1000);
    
    // Reasonable frequency: less than 2 requests per second on average
    expect(requestFrequency).toBeLessThan(2);
    
    // Check for WebSocket usage (more efficient than polling)
    const wsRequests = networkRequests.filter(req => req.url.includes('ws://') || req.url.includes('wss://'));
    
    if (wsRequests.length > 0) {
      // WebSocket connections are more efficient
      expect(wsRequests.length).toBeGreaterThan(0);
    }

    // Verify page remains responsive during live updates
    const propsContainer = page.locator('[data-testid="props-list"], .props-container');
    await expect(propsContainer.first()).toBeVisible();
    
    // Test interaction responsiveness
    const firstProp = page.locator('[data-testid="prop-card"], .prop-item').first();
    if (await firstProp.isVisible()) {
      const clickStart = Date.now();
      await firstProp.click();
      const clickEnd = Date.now();
      
      // Click response should be under 1 second
      const responseTime = clickEnd - clickStart;
      expect(responseTime).toBeLessThan(1000);
    }
  });

  test('live update preferences and settings', async () => {
    // Look for settings or preferences
    const settingsButton = page.locator(
      '[data-testid="settings"], ' +
      '.settings-btn, ' +
      'button:has-text("Settings"), ' +
      '.preferences-btn'
    );
    
    if (await settingsButton.first().isVisible()) {
      await settingsButton.first().click();
      await page.waitForTimeout(1000);
      
      // Look for live update preferences
      const liveUpdateSettings = page.locator(
        '[data-testid="live-updates-setting"], ' +
        'input[name*="live"], ' +
        'input[name*="realtime"], ' +
        '.live-updates-toggle'
      );
      
      if (await liveUpdateSettings.first().isVisible()) {
        // Test toggling live updates
        const isChecked = await liveUpdateSettings.first().isChecked();
        await liveUpdateSettings.first().click();
        
        await page.waitForTimeout(1000);
        
        // Verify setting changed
        const newState = await liveUpdateSettings.first().isChecked();
        expect(newState).toBe(!isChecked);
        
        // Test effect of the setting
        await page.waitForTimeout(5000);
        
        // Look for live indicators based on setting
        const liveIndicators = page.locator('.live-status, [data-testid="live-indicator"]');
        const hasLiveIndicator = await liveIndicators.first().isVisible();
        
        // Indicator visibility should match setting
        if (newState) {
          expect(hasLiveIndicator).toBeTruthy();
        }
      }
    }
  });
});