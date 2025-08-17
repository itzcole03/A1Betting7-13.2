/**
 * Navigation Readiness Utility
 * 
 * Provides utilities to wait for navigation elements to be available in the DOM
 * before running validation tests. This prevents premature failures when
 * navigation components are still loading.
 */

/**
 * Wait for navigation elements to be present in the DOM
 * 
 * @param timeoutMs - Maximum time to wait for navigation (default: 4000ms)
 * @returns Promise<boolean> - true if navigation found, false if timeout
 */
export function waitForNav(timeoutMs = 4000): Promise<boolean> {
  const start = performance.now();
  
  return new Promise(resolve => {
    function poll() {
      // Check for navigation elements using multiple selectors
      const navSelectors = [
        '[data-nav-root]',
        '[data-testid="nav-fallback"]',
        '[data-core-nav="primary"]',
        'nav[role="navigation"]',
        '[data-testid="nav-primary"]'
      ];
      
      // Try each selector
      for (const selector of navSelectors) {
        if (document.querySelector(selector)) {
          // eslint-disable-next-line no-console
          console.log(`[NavReadiness] Found navigation element: ${selector}`);
          return resolve(true);
        }
      }
      
      // Check timeout
      if (performance.now() - start > timeoutMs) {
        // eslint-disable-next-line no-console
        console.warn(`[NavReadiness] Navigation not found after ${timeoutMs}ms, continuing anyway`);
        return resolve(false);
      }
      
      // Continue polling
      setTimeout(poll, 100); // Poll every 100ms
    }
    
    // Start polling
    poll();
  });
}

/**
 * Check if any navigation element is currently present
 */
export function hasNavigation(): boolean {
  const navSelectors = [
    '[data-nav-root]',
    '[data-testid="nav-fallback"]',
    '[data-core-nav="primary"]',
    'nav[role="navigation"]',
    '[data-testid="nav-primary"]'
  ];
  
  return navSelectors.some(selector => document.querySelector(selector));
}