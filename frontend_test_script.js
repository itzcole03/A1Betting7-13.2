// Frontend Test Script - Insert this into browser console at http://localhost:8173
// Tests the live PropOllamaUnified component behavior for MLB

// Wait for component to load
setTimeout(() => {
  console.log("🚀 Starting MLB Frontend Integration Test...");

  // Test 1: Check if PropOllamaUnified component exists
  const appContainer = document.querySelector("#root");
  if (appContainer) {
    console.log("✅ React app container found");
  } else {
    console.log("❌ React app container not found");
    return;
  }

  // Test 2: Check console logs for PropOllamaUnified activity
  console.log("📊 Monitoring console for PropOllamaUnified logs...");

  // Store original console.log to intercept PropOllamaUnified logs
  const originalLog = console.log;
  const propLogs = [];

  console.log = function (...args) {
    const message = args.join(" ");
    if (message.includes("[PropOllamaUnified]")) {
      propLogs.push(message);
      if (message.includes("visibleProjections")) {
        console.info("🎯 Found visibleProjections log:", message);
      }
      if (message.includes("sport")) {
        console.info("🏟️ Found sport-related log:", message);
      }
      if (message.includes("consolidatedProjections")) {
        console.info("📋 Found consolidatedProjections log:", message);
      }
    }
    originalLog.apply(console, args);
  };

  // Test 3: Look for sport selector
  setTimeout(() => {
    const sportSelectors = document.querySelectorAll("select, button");
    let mlbSelectorFound = false;

    sportSelectors.forEach((el) => {
      if (el.textContent && el.textContent.includes("MLB")) {
        mlbSelectorFound = true;
        console.log("✅ MLB selector found:", el);
      }
    });

    if (!mlbSelectorFound) {
      console.log("⚠️ MLB selector not immediately visible");
    }

    // Test 4: Check for prop cards
    const propCards = document.querySelectorAll(
      '[class*="card"], [class*="prop"]'
    );
    console.log(`📊 Found ${propCards.length} potential prop cards`);

    // Test 5: Check for loading states
    const loadingElements = document.querySelectorAll(
      '[class*="loading"], [class*="spinner"]'
    );
    console.log(`⏳ Found ${loadingElements.length} loading indicators`);

    // Test 6: Check for error messages
    const errorElements = document.querySelectorAll(
      '[class*="error"], [class*="warning"]'
    );
    if (errorElements.length > 0) {
      console.log(`⚠️ Found ${errorElements.length} error/warning elements`);
      errorElements.forEach((el) =>
        console.log("Error element:", el.textContent)
      );
    } else {
      console.log("✅ No error elements found");
    }

    // Test 7: Summary
    console.log("📋 MLB Frontend Test Summary:");
    console.log(`   PropOllamaUnified logs captured: ${propLogs.length}`);
    console.log(`   Prop cards found: ${propCards.length}`);
    console.log(`   Loading indicators: ${loadingElements.length}`);
    console.log(`   Error elements: ${errorElements.length}`);

    // Restore original console.log
    setTimeout(() => {
      console.log = originalLog;
      console.log("🔄 Console.log restored");
    }, 5000);
  }, 3000);
}, 2000);

// Manual trigger for testing specific functionality
window.testMLBIntegration = {
  checkBackendConnection: async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/mlb/odds-comparison/?market_type=playerprops"
      );
      const data = await response.json();
      console.log("✅ Backend connection successful:", data.length, "props");
      return data;
    } catch (error) {
      console.log("❌ Backend connection failed:", error);
      return null;
    }
  },

  testSportActivation: async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/sports/activate/MLB",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await response.json();
      console.log("✅ Sport activation successful:", data);
      return data;
    } catch (error) {
      console.log("❌ Sport activation failed:", error);
      return null;
    }
  },

  checkPropData: () => {
    // Look for PropOllamaUnified component state in React DevTools
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log(
        "🔍 React DevTools available - check component state manually"
      );
    } else {
      console.log("⚠️ React DevTools not available");
    }

    // Check for any global PropOllamaUnified debugging data
    if (window.__REACT_DEBUG__) {
      console.log("🐛 React debug object found:", window.__REACT_DEBUG__);
    }
  },
};

console.log("🎯 Test functions available:");
console.log("  - window.testMLBIntegration.checkBackendConnection()");
console.log("  - window.testMLBIntegration.testSportActivation()");
console.log("  - window.testMLBIntegration.checkPropData()");
