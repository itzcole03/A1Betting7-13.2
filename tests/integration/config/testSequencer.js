// Integration Test Sequencer for Phase 4.2
const Sequencer = require('@jest/test-sequencer').default;

class IntegrationTestSequencer extends Sequencer {
  sort(tests) {
    // Define the order of test execution for integration tests
    const testOrder = [
      'auth.test.js',        // Authentication tests first
      'analytics.test.js',   // Analytics tests second
      'ai.test.js',         // AI services tests third
      'betting.test.js',    // Betting tests fourth
      'prizepicks.test.js', // PrizePicks tests fifth
      'odds.test.js',       // Odds comparison tests sixth
      'unified.test.js',    // Unified API tests seventh
      'health.test.js',     // Health checks last
    ];

    // Sort tests according to the defined order
    return tests.sort((testA, testB) => {
      const indexA = this.getTestIndex(testA.path, testOrder);
      const indexB = this.getTestIndex(testB.path, testOrder);
      
      if (indexA !== indexB) {
        return indexA - indexB;
      }
      
      // If tests have the same priority, sort alphabetically
      return testA.path.localeCompare(testB.path);
    });
  }

  getTestIndex(testPath, testOrder) {
    for (let i = 0; i < testOrder.length; i++) {
      if (testPath.includes(testOrder[i])) {
        return i;
      }
    }
    // Return high index for unrecognized tests (run them last)
    return testOrder.length;
  }
}

module.exports = IntegrationTestSequencer;
