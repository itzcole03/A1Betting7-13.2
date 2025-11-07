/**
 * Navigation Validator Manual Test Utility
 * Utility script to manually test navigation validator functionality
 */

// Simulate the navigation validation functionality
const testNavigationValidator = () => {
  console.log('🔍 Testing Navigation Validator Implementation...\n');

  // Test 1: Check if navigation elements exist
  console.log('Test 1: Navigation Element Detection');
  const navSelectors = '[data-testid="primary-nav"], [role="navigation"], nav';
  const navElements = document.querySelectorAll(navSelectors);
  console.log(`✓ Found ${navElements.length} navigation elements using selectors: ${navSelectors}`);
  
  if (navElements.length > 0) {
    navElements.forEach((element, index) => {
      console.log(`  - Element ${index + 1}: ${element.tagName} ${element.getAttribute('role') || ''} ${element.getAttribute('data-testid') || ''}`);
    });
  } else {
    console.log('  - No navigation elements found');
  }

  // Test 2: Check navReadySignal functionality
  console.log('\nTest 2: NavReady Signal');
  try {
    // Try to access the signal functions (if available in browser)
    if (window.navReadySignal) {
      console.log('✓ NavReady signal system available');
      console.log(`  - Is navigation ready: ${window.navReadySignal.isNavReady()}`);
    } else {
      console.log('⚠ NavReady signal system not available in global scope');
    }
  } catch (error) {
    console.log('⚠ NavReady signal test skipped:', error.message);
  }

  // Test 3: Environment configuration
  console.log('\nTest 3: Environment Configuration');
  const maxAttempts = parseInt(import.meta?.env?.VITE_VALIDATOR_NAV_MAX_ATTEMPTS) || 12;
  const interval = parseInt(import.meta?.env?.VITE_VALIDATOR_NAV_INTERVAL_MS) || 250;
  console.log(`✓ Max Attempts: ${maxAttempts}`);
  console.log(`✓ Interval: ${interval}ms`);

  // Test 4: State machine simulation
  console.log('\nTest 4: State Machine Simulation');
  let validationAttempts = 0;
  let validationState = 'idle';
  
  const simulateValidation = () => {
    validationAttempts++;
    console.log(`  Attempt ${validationAttempts}: Checking navigation...`);
    
    if (navElements.length > 0) {
      validationState = 'success';
      console.log('  ✓ Navigation validation successful!');
      return true;
    }
    
    if (validationAttempts >= maxAttempts) {
      validationState = 'degraded_timeout';
      console.log('  ⚠ Navigation validation timed out after', validationAttempts, 'attempts');
      return false;
    }
    
    console.log('  → Continuing validation...');
    return false;
  };

  // Simulate a few validation attempts
  let success = false;
  for (let i = 0; i < Math.min(3, maxAttempts) && !success; i++) {
    success = simulateValidation();
  }

  console.log(`\nFinal State: ${validationState}`);
  console.log(`Total Attempts: ${validationAttempts}`);

  // Test 5: Cleanup simulation
  console.log('\nTest 5: Cleanup Simulation');
  validationState = 'idle';
  validationAttempts = 0;
  console.log('✓ State reset to idle');
  console.log('✓ Attempts counter reset to 0');

  console.log('\n🎉 Navigation Validator Implementation Test Complete!');
};

// Export for use in browser console or during development
if (typeof window !== 'undefined') {
  window.testNavigationValidator = testNavigationValidator;
  console.log('🚀 Navigation validator test utility loaded. Run testNavigationValidator() to test.');
} else if (typeof module !== 'undefined') {
  module.exports = { testNavigationValidator };
}

export { testNavigationValidator };