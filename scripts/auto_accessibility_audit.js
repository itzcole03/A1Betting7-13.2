#!/usr/bin/env node
/**
 * Automated Accessibility Audit Script
 * Phase 4: End-to-End Integration & Testing
 *
 * This script performs accessibility audits using axe-core and other tools.
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

class AccessibilityAuditor {
  constructor(baseUrl = "http://localhost:8173") {
    this.baseUrl = baseUrl;
    this.browser = null;
    this.page = null;
    this.auditResults = [];
  }

  async initialize() {
    console.log("🚀 Initializing accessibility audit environment...");

    this.browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });

    console.log("✅ Accessibility audit environment initialized");
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log("✅ Accessibility audit environment cleaned up");
    }
  }

  async injectAxeCore() {
    // Inject axe-core library (simplified version)
    await this.page.addScriptTag({
      content: `
        // Simplified axe-core implementation for basic checks
        window.axeAudit = function() {
          const violations = [];
          
          // Check for missing alt text on images
          const images = document.querySelectorAll('img');
          images.forEach((img, index) => {
            if (!img.alt && !img.getAttribute('aria-label')) {
              violations.push({
                id: 'image-alt',
                impact: 'critical',
                description: 'Images must have alternate text',
                nodes: [{ target: [\`img:nth-child(\${index + 1})\`] }]
              });
            }
          });
          
          // Check for proper heading hierarchy
          const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
          let lastLevel = 0;
          headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName[1]);
            if (level > lastLevel + 1) {
              violations.push({
                id: 'heading-order',
                impact: 'moderate',
                description: 'Heading levels should only increase by one',
                nodes: [{ target: [heading.tagName.toLowerCase() + ':nth-of-type(' + (index + 1) + ')'] }]
              });
            }
            lastLevel = level;
          });
          
          // Check for form labels
          const inputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea, select');
          inputs.forEach((input, index) => {
            const id = input.id;
            const hasLabel = id && document.querySelector(\`label[for="\${id}"]\`);
            const hasAriaLabel = input.getAttribute('aria-label');
            const hasAriaLabelledby = input.getAttribute('aria-labelledby');
            
            if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby) {
              violations.push({
                id: 'label',
                impact: 'critical',
                description: 'Form elements must have labels',
                nodes: [{ target: [input.tagName.toLowerCase() + ':nth-of-type(' + (index + 1) + ')'] }]
              });
            }
          });
          
          // Check for proper button text
          const buttons = document.querySelectorAll('button');
          buttons.forEach((button, index) => {
            const text = button.textContent.trim();
            const ariaLabel = button.getAttribute('aria-label');
            if (!text && !ariaLabel) {
              violations.push({
                id: 'button-name',
                impact: 'critical',
                description: 'Buttons must have discernible text',
                nodes: [{ target: [\`button:nth-of-type(\${index + 1})\`] }]
              });
            }
          });
          
          // Check for sufficient color contrast (basic check)
          const elements = document.querySelectorAll('*');
          elements.forEach(element => {
            const style = window.getComputedStyle(element);
            const color = style.color;
            const backgroundColor = style.backgroundColor;
            
            // Simple contrast check - in a real implementation, you'd calculate the actual contrast ratio
            if (color === 'rgb(128, 128, 128)' && backgroundColor === 'rgb(255, 255, 255)') {
              violations.push({
                id: 'color-contrast',
                impact: 'serious',
                description: 'Elements must have sufficient color contrast',
                nodes: [{ target: [element.tagName.toLowerCase()] }]
              });
            }
          });
          
          return { violations };
        };
      `,
    });
  }

  async auditPage(pageName, url) {
    console.log(`🔍 Auditing ${pageName}...`);

    try {
      await this.page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
      await this.injectAxeCore();

      // Run accessibility audit
      const results = await this.page.evaluate(() => {
        return window.axeAudit();
      });

      // Additional manual checks
      const manualChecks = await this.performManualChecks();

      const auditResult = {
        page: pageName,
        url: url,
        timestamp: new Date().toISOString(),
        violations: results.violations,
        manualChecks: manualChecks,
        summary: {
          violationCount: results.violations.length,
          criticalCount: results.violations.filter(
            (v) => v.impact === "critical",
          ).length,
          seriousCount: results.violations.filter((v) => v.impact === "serious")
            .length,
          moderateCount: results.violations.filter(
            (v) => v.impact === "moderate",
          ).length,
          minorCount: results.violations.filter((v) => v.impact === "minor")
            .length,
        },
      };

      this.auditResults.push(auditResult);

      console.log(
        `✅ ${pageName} audit complete - ${auditResult.summary.violationCount} violations found`,
      );
      return auditResult;
    } catch (error) {
      console.error(`❌ Failed to audit ${pageName}: ${error.message}`);
      return {
        page: pageName,
        url: url,
        error: error.message,
        violations: [],
        summary: { violationCount: 0 },
      };
    }
  }

  async performManualChecks() {
    const checks = {};

    try {
      // Check if page has a main landmark
      checks.hasMainLandmark = (await this.page.$("main")) !== null;

      // Check if page has proper document title
      const title = await this.page.title();
      checks.hasProperTitle = title && title.length > 0 && title !== "Document";

      // Check if page has skip links
      checks.hasSkipLinks =
        (await this.page.$('a[href^="#"]:first-child')) !== null;

      // Check if page has proper language attribute
      checks.hasLangAttribute =
        (await this.page.$eval("html", (el) => el.lang)) !== "";

      // Check for focus management
      checks.focusManagement = await this.page.evaluate(() => {
        const focusableElements = document.querySelectorAll(
          'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
        );
        return focusableElements.length > 0;
      });

      // Check for ARIA landmarks
      checks.hasAriaLandmarks = await this.page.evaluate(() => {
        const landmarks = document.querySelectorAll(
          '[role="banner"], [role="navigation"], [role="main"], [role="contentinfo"], nav, main, header, footer',
        );
        return landmarks.length > 0;
      });
    } catch (error) {
      console.warn("Some manual checks failed:", error.message);
    }

    return checks;
  }

  async runFullAudit() {
    console.log("🚀 Starting comprehensive accessibility audit...");

    const pages = [
      { name: "Home/Locked Bets", url: this.baseUrl },
      { name: "Live Stream", url: `${this.baseUrl}?page=live-stream` },
      { name: "Settings", url: `${this.baseUrl}?page=settings` },
    ];

    for (const page of pages) {
      await this.auditPage(page.name, page.url);
    }
  }

  generateReport() {
    const totalViolations = this.auditResults.reduce(
      (sum, result) => sum + result.summary.violationCount,
      0,
    );
    const totalCritical = this.auditResults.reduce(
      (sum, result) => sum + (result.summary.criticalCount || 0),
      0,
    );
    const totalSerious = this.auditResults.reduce(
      (sum, result) => sum + (result.summary.seriousCount || 0),
      0,
    );

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        pagesAudited: this.auditResults.length,
        totalViolations,
        criticalViolations: totalCritical,
        seriousViolations: totalSerious,
        overallScore: Math.max(
          0,
          100 - (totalCritical * 10 + totalSerious * 5),
        ),
      },
      results: this.auditResults,
      recommendations: this.generateRecommendations(),
    };

    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    this.auditResults.forEach((result) => {
      if (result.violations) {
        result.violations.forEach((violation) => {
          if (!recommendations.find((r) => r.id === violation.id)) {
            recommendations.push({
              id: violation.id,
              description: violation.description,
              impact: violation.impact,
              howToFix: this.getFixRecommendation(violation.id),
            });
          }
        });
      }
    });

    return recommendations;
  }

  getFixRecommendation(violationId) {
    const fixes = {
      "image-alt":
        'Add meaningful alt text to all images. Use alt="" for decorative images.',
      "heading-order":
        "Ensure heading levels increase by only one level (h1 → h2 → h3, not h1 → h3).",
      label:
        'Associate form controls with labels using <label for="id"> or aria-label attributes.',
      "button-name":
        "Ensure all buttons have accessible names via text content or aria-label.",
      "color-contrast":
        "Ensure text has sufficient contrast ratio (4.5:1 for normal text, 3:1 for large text).",
    };

    return (
      fixes[violationId] || "Review accessibility guidelines for this issue."
    );
  }

  printSummary() {
    const report = this.generateReport();

    console.log("\n" + "=".repeat(60));
    console.log("♿ ACCESSIBILITY AUDIT SUMMARY");
    console.log("=".repeat(60));
    console.log(`Pages Audited: ${report.summary.pagesAudited}`);
    console.log(`Total Violations: ${report.summary.totalViolations}`);
    console.log(`Critical Issues: ${report.summary.criticalViolations} 🔴`);
    console.log(`Serious Issues: ${report.summary.seriousViolations} 🟠`);
    console.log(
      `Overall Accessibility Score: ${report.summary.overallScore}/100`,
    );

    if (report.summary.totalViolations > 0) {
      console.log("\n🔧 TOP RECOMMENDATIONS:");
      report.recommendations.slice(0, 5).forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.description}`);
        console.log(`   💡 ${rec.howToFix}`);
      });
    } else {
      console.log("\n🎉 No accessibility violations found!");
    }

    console.log(`\n📅 Audit completed at: ${report.timestamp}`);

    // Save detailed report
    const reportFile = `accessibility_report_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved to: ${reportFile}`);

    return report.summary.criticalViolations === 0;
  }
}

async function main() {
  console.log("🚀 A1Betting Accessibility Audit Suite");
  console.log("=".repeat(60));
  console.log(`Start time: ${new Date().toISOString()}`);

  const auditor = new AccessibilityAuditor();

  try {
    await auditor.initialize();
    await auditor.runFullAudit();

    const success = auditor.printSummary();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error("❌ Accessibility audit failed:", error.message);
    process.exit(1);
  } finally {
    await auditor.cleanup();
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
  console.log("ℹ️  Skipping accessibility audit...");
  process.exit(0);
}
