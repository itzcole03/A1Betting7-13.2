#!/usr/bin/env node
/**
 * Automated UI Testing Script
 * Phase 4: End-to-End Integration & Testing
 *
 * This script tests the frontend UI components and user flows.
 */

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

class UITester {
  constructor(baseUrl = "http://localhost:8173") {
    this.baseUrl = baseUrl;
    this.browser = null;
    this.page = null;
    this.testResults = [];
  }

  async initialize() {
    console.log("🚀 Initializing UI testing environment...");

    this.browser = await puppeteer.launch({
      headless: "new", // Use new headless mode
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });

    this.page = await this.browser.newPage();

    // Set viewport size
    await this.page.setViewport({ width: 1920, height: 1080 });

    // Set user agent
    await this.page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    );

    console.log("✅ UI testing environment initialized");
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log("✅ UI testing environment cleaned up");
    }
  }

  async runTest(testName, testFunction) {
    console.log(`🔄 Running test: ${testName}`);
    const startTime = Date.now();

    try {
      await testFunction();
      const duration = Date.now() - startTime;

      this.testResults.push({
        name: testName,
        status: "PASSED",
        duration,
        error: null,
      });

      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.testResults.push({
        name: testName,
        status: "FAILED",
        duration,
        error: error.message,
      });

      console.log(`❌ ${testName} - FAILED: ${error.message} (${duration}ms)`);
      return false;
    }
  }

  async testPageLoad() {
    await this.runTest("Page Load", async () => {
      const response = await this.page.goto(this.baseUrl, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      if (!response.ok()) {
        throw new Error(`Page failed to load: ${response.status()}`);
      }

      // Wait for main content to appear
      await this.page.waitForSelector("nav", { timeout: 10000 });
      await this.page.waitForSelector("main", { timeout: 10000 });

      // Check page title
      const title = await this.page.title();
      if (!title.includes("A1Betting")) {
        throw new Error(`Unexpected page title: ${title}`);
      }
    });
  }

  async testNavigation() {
    await this.runTest("Navigation Test", async () => {
      // Test navigation between pages
      const navButtons = await this.page.$$("nav button");

      if (navButtons.length < 3) {
        throw new Error(
          `Expected at least 3 navigation buttons, found ${navButtons.length}`,
        );
      }

      // Test Locked Bets page
      await this.page.click('button:has-text("Locked Bets")');
      await this.page.waitForSelector('h1:has-text("Locked Bets")', {
        timeout: 5000,
      });

      // Test Live Stream page
      await this.page.click('button:has-text("Live Stream")');
      await this.page.waitForSelector('h1:has-text("Live Stream")', {
        timeout: 5000,
      });

      // Test Settings page
      await this.page.click('button:has-text("Settings")');
      await this.page.waitForSelector('h1:has-text("Settings")', {
        timeout: 5000,
      });

      // Return to Locked Bets
      await this.page.click('button:has-text("Locked Bets")');
      await this.page.waitForSelector('h1:has-text("Locked Bets")', {
        timeout: 5000,
      });
    });
  }

  async testLockedBetsPage() {
    await this.runTest("Locked Bets Page Test", async () => {
      // Ensure we're on the locked bets page
      await this.page.click('button:has-text("Locked Bets")');
      await this.page.waitForSelector('h1:has-text("Locked Bets")', {
        timeout: 5000,
      });

      // Check for refresh button
      const refreshButton = await this.page.$('button:has-text("Refresh")');
      if (!refreshButton) {
        throw new Error("Refresh button not found");
      }

      // Check for stats bar
      const statsElements = await this.page.$$(
        '[class*="grid"] > div:has(div:has-text("Total Bets"))',
      );
      if (statsElements.length === 0) {
        throw new Error("Stats bar not found");
      }

      // Test refresh functionality
      await this.page.click('button:has-text("Refresh")');

      // Wait a moment for refresh to complete
      await this.page.waitForTimeout(2000);

      // Check for filter controls
      const sportFilter = await this.page.$("select");
      if (!sportFilter) {
        throw new Error("Sport filter not found");
      }
    });
  }

  async testLiveStreamPage() {
    await this.runTest("Live Stream Page Test", async () => {
      // Navigate to live stream page
      await this.page.click('button:has-text("Live Stream")');
      await this.page.waitForSelector('h1:has-text("Live Stream")', {
        timeout: 5000,
      });

      // Check for iframe
      const iframe = await this.page.$("iframe");
      if (!iframe) {
        throw new Error("Stream iframe not found");
      }

      // Check for control buttons
      const reloadButton = await this.page.$('button:has-text("Reload")');
      const fullscreenButton = await this.page.$(
        'button:has-text("Fullscreen")',
      );
      const newTabButton = await this.page.$('button:has-text("New Tab")');

      if (!reloadButton || !fullscreenButton || !newTabButton) {
        throw new Error("Stream control buttons not found");
      }
    });
  }

  async testSettingsPage() {
    await this.runTest("Settings Page Test", async () => {
      // Navigate to settings page
      await this.page.click('button:has-text("Settings")');
      await this.page.waitForSelector("h1", { timeout: 5000 });

      // Check for sidebar navigation
      const sidebarNav = await this.page.$("nav");
      if (!sidebarNav) {
        throw new Error("Settings sidebar navigation not found");
      }

      // Check for profile tab
      const profileTab = await this.page.$('button:has-text("Profile")');
      if (!profileTab) {
        throw new Error("Profile tab not found");
      }

      // Test tab switching
      await this.page.click('button:has-text("Profile")');
      await this.page.waitForSelector('h3:has-text("Profile Information")', {
        timeout: 5000,
      });

      // Test preferences tab
      await this.page.click('button:has-text("Preferences")');
      await this.page.waitForSelector('h3:has-text("Betting Preferences")', {
        timeout: 5000,
      });
    });
  }

  async testResponsiveDesign() {
    await this.runTest("Responsive Design Test", async () => {
      // Test mobile viewport
      await this.page.setViewport({ width: 375, height: 667 });
      await this.page.reload({ waitUntil: "networkidle2" });

      // Check that navigation is still functional
      const nav = await this.page.$("nav");
      if (!nav) {
        throw new Error("Navigation not found in mobile viewport");
      }

      // Test tablet viewport
      await this.page.setViewport({ width: 768, height: 1024 });
      await this.page.reload({ waitUntil: "networkidle2" });

      // Check that layout adapts
      const main = await this.page.$("main");
      if (!main) {
        throw new Error("Main content not found in tablet viewport");
      }

      // Return to desktop viewport
      await this.page.setViewport({ width: 1920, height: 1080 });
      await this.page.reload({ waitUntil: "networkidle2" });
    });
  }

  async testErrorHandling() {
    await this.runTest("Error Handling Test", async () => {
      // Test navigation to non-existent page (should fallback gracefully)
      await this.page.goto(`${this.baseUrl}/non-existent-page`, {
        waitUntil: "networkidle2",
      });

      // Should still show the app (React Router should handle this)
      const body = await this.page.$("body");
      if (!body) {
        throw new Error("Page completely failed to load");
      }

      // Return to home page
      await this.page.goto(this.baseUrl, { waitUntil: "networkidle2" });
    });
  }

  async testPerformance() {
    await this.runTest("Performance Test", async () => {
      const metrics = await this.page.metrics();

      // Check JavaScript heap usage (should be reasonable)
      if (metrics.JSHeapUsedSize > 50 * 1024 * 1024) {
        // 50MB
        throw new Error(`High memory usage: ${metrics.JSHeapUsedSize} bytes`);
      }

      // Measure page load time
      const navigationTiming = JSON.parse(
        await this.page.evaluate(() => JSON.stringify(performance.timing)),
      );

      const pageLoadTime =
        navigationTiming.loadEventEnd - navigationTiming.navigationStart;

      if (pageLoadTime > 10000) {
        // 10 seconds
        throw new Error(`Slow page load time: ${pageLoadTime}ms`);
      }

      console.log(`📊 Page load time: ${pageLoadTime}ms`);
      console.log(
        `📊 JS heap usage: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)}MB`,
      );
    });
  }

  generateReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(
      (t) => t.status === "PASSED",
    ).length;
    const failedTests = totalTests - passedTests;
    const avgDuration =
      this.testResults.reduce((sum, t) => sum + t.duration, 0) / totalTests;

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: (passedTests / totalTests) * 100,
        averageDuration: avgDuration,
      },
      results: this.testResults,
    };

    return report;
  }

  printSummary() {
    const report = this.generateReport();

    console.log("\n" + "=".repeat(60));
    console.log("📊 UI TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`Passed: ${report.summary.passed} ✅`);
    console.log(`Failed: ${report.summary.failed} ❌`);
    console.log(`Success Rate: ${report.summary.successRate.toFixed(1)}%`);
    console.log(
      `Average Duration: ${report.summary.averageDuration.toFixed(0)}ms`,
    );

    if (report.summary.failed > 0) {
      console.log("\n❌ FAILED TESTS:");
      this.testResults
        .filter((t) => t.status === "FAILED")
        .forEach((t) => console.log(`  - ${t.name}: ${t.error}`));
    }

    console.log(`\n📅 Test completed at: ${report.timestamp}`);

    // Save report
    const reportFile = `ui_test_report_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved to: ${reportFile}`);

    return report.summary.failed === 0;
  }
}

async function main() {
  console.log("🚀 A1Betting UI Testing Suite");
  console.log("=".repeat(60));
  console.log(`Start time: ${new Date().toISOString()}`);

  const tester = new UITester();

  try {
    await tester.initialize();

    // Run all UI tests
    await tester.testPageLoad();
    await tester.testNavigation();
    await tester.testLockedBetsPage();
    await tester.testLiveStreamPage();
    await tester.testSettingsPage();
    await tester.testResponsiveDesign();
    await tester.testErrorHandling();
    await tester.testPerformance();

    // Generate and print summary
    const success = tester.printSummary();

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error("❌ UI test execution failed:", error.message);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// Check if puppeteer is available
try {
  require.resolve("puppeteer");
  main();
} catch (error) {
  console.error(
    "❌ Puppeteer not found. Install it with: npm install puppeteer",
  );
  console.log("ℹ️  Skipping UI tests...");
  process.exit(0);
}
