/**
 * PropFinder.app Reconnaissance Script
 * 
 * This script captures network calls, tech stack, and UX patterns from PropFinder.app
 * to inform our competitive analysis and feature parity roadmap.
 * 
 * Usage: node recon.js
 * Outputs: propfinder_analysis.json, propfinder_endpoints.txt, propfinder_screenshot.png
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class PropFinderRecon {
  constructor() {
    this.requests = [];
    this.responses = [];
    this.consoleMessages = [];
    this.technologies = new Set();
    this.apiEndpoints = new Set();
    this.analysis = {
      timestamp: new Date().toISOString(),
      site: 'propfinder.app',
      techStack: {},
      apiEndpoints: [],
      performance: {},
      features: [],
      errors: []
    };
  }

  async run() {
    console.log('🔍 Starting PropFinder.app reconnaissance...');
    
    const browser = await puppeteer.launch({
      headless: false, // Set to true for CI environments
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await this.setupPageMonitoring(page);
      
      // Navigate and capture initial load
      console.log('📡 Navigating to PropFinder.app...');
      const response = await page.goto('https://propfinder.app', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      this.analysis.performance.initialLoadStatus = response.status();
      
      // Capture initial state and tech analysis
      await this.analyzeTechStack(page);
      await this.captureInitialState(page);
      await this.analyzeFeatures(page);
      
      // Take screenshots
      await this.captureScreenshots(page);
      
      // Interact with key features
      await this.interactWithFilters(page);
      await this.testSearchFunctionality(page);
      
      // Generate final analysis
      await this.generateAnalysis();
      
      console.log('✅ Reconnaissance complete! Check output files:');
      console.log('  - analysis/propfinder_analysis.json');
      console.log('  - analysis/propfinder_endpoints.txt');
      console.log('  - analysis/propfinder_screenshot.png');
      
    } catch (error) {
      console.error('❌ Reconnaissance failed:', error.message);
      this.analysis.errors.push({
        type: 'navigation_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      await browser.close();
    }
  }

  async setupPageMonitoring(page) {
    // Capture all network requests
    page.on('request', req => {
      this.requests.push({
        url: req.url(),
        method: req.method(),
        resourceType: req.resourceType(),
        headers: req.headers(),
        timestamp: Date.now()
      });

      // Extract API endpoints
      if (req.url().includes('/api/') || req.url().includes('/graphql')) {
        this.apiEndpoints.add(req.url());
      }
    });

    // Capture responses
    page.on('response', res => {
      this.responses.push({
        url: res.url(),
        status: res.status(),
        headers: res.headers(),
        timestamp: Date.now()
      });
    });

    // Capture console messages for debugging
    page.on('console', msg => {
      this.consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now()
      });
    });

    // Set viewport for consistent screenshots
    await page.setViewport({ width: 1920, height: 1080 });
  }

  async analyzeTechStack(page) {
    console.log('🔧 Analyzing tech stack...');
    
    // Check for common libraries and frameworks
    const techChecks = {
      react: () => window.React || document.querySelector('[data-reactroot]'),
      vue: () => window.Vue || document.querySelector('[data-v-]'),
      angular: () => window.ng || document.querySelector('[ng-version]'),
      tailwind: () => document.querySelector('.tw-') || document.querySelector('[class*="bg-"]'),
      bootstrap: () => document.querySelector('.container') || document.querySelector('.row'),
      jquery: () => window.jQuery || window.$,
      socketio: () => window.io,
      vite: () => window.__vite_plugin_react_preamble_installed__,
      webpack: () => window.webpackJsonp || window.__webpack_require__,
      typescript: () => window.tsc || document.querySelector('script[src*="typescript"]')
    };

    for (const [tech, check] of Object.entries(techChecks)) {
      try {
        const result = await page.evaluate(check);
        if (result) {
          this.technologies.add(tech);
          this.analysis.techStack[tech] = true;
        }
      } catch (e) {
        // Ignore evaluation errors for missing globals
      }
    }

    // Analyze bundle structure
    const scripts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
    });

    this.analysis.techStack.bundles = scripts.filter(src => 
      src.includes('.js') && (src.includes('main') || src.includes('app') || src.includes('vendor'))
    );
  }

  async captureInitialState(page) {
    console.log('📊 Capturing initial application state...');
    
    // Try to capture global state objects
    const initialState = await page.evaluate(() => {
      const stateKeys = [
        '__INITIAL_STATE__',
        '__REDUX_STORE__',
        '__NEXT_DATA__',
        '__NUXT__',
        'window.store',
        'window.app'
      ];
      
      const state = {};
      for (const key of stateKeys) {
        try {
          const value = eval(key);
          if (value && typeof value === 'object') {
            state[key] = JSON.stringify(value).slice(0, 1000); // Truncate for safety
          }
        } catch (e) {
          // Key doesn't exist
        }
      }
      return state;
    });

    this.analysis.initialState = initialState;
  }

  async analyzeFeatures(page) {
    console.log('🎯 Analyzing UI features...');
    
    // Look for common PropFinder features
    const featureSelectors = {
      'search-bar': 'input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]',
      'filters': '[class*="filter"], [data-testid*="filter"], .filter',
      'sports-tabs': '[class*="sport"], [data-testid*="sport"], .sport',
      'confidence-slider': 'input[type="range"], [class*="slider"], .slider',
      'odds-display': '[class*="odds"], [data-testid*="odds"], .odds',
      'bookmaker-logos': '[class*="book"], [class*="sportsbook"], img[alt*="book"]',
      'edge-indicators': '[class*="edge"], [class*="value"], [data-testid*="edge"]',
      'live-indicators': '[class*="live"], [class*="updating"], .live',
      'bookmark-buttons': '[class*="bookmark"], [class*="save"], [data-testid*="bookmark"]'
    };

    for (const [feature, selector] of Object.entries(featureSelectors)) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          this.analysis.features.push({
            name: feature,
            selector: selector,
            count: elements.length,
            visible: true
          });
        }
      } catch (e) {
        // Selector failed
      }
    }
  }

  async captureScreenshots(page) {
    console.log('📸 Capturing screenshots...');
    
    const outputDir = path.join(__dirname, '..', 'analysis');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Full page screenshot
    await page.screenshot({
      path: path.join(outputDir, 'propfinder_screenshot.png'),
      fullPage: true,
      type: 'png'
    });

    // Viewport screenshot for quick reference
    await page.screenshot({
      path: path.join(outputDir, 'propfinder_viewport.png'),
      type: 'png'
    });
  }

  async interactWithFilters(page) {
    console.log('🎛️ Testing filter interactions...');
    
    try {
      // Try to interact with common filter elements
      const filterInteractions = [
        'input[type="range"]', // Sliders
        'select', // Dropdowns
        'button[class*="filter"]', // Filter buttons
        '[role="checkbox"]', // Checkboxes
        '[role="button"][class*="sport"]' // Sport tabs
      ];

      for (const selector of filterInteractions) {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          try {
            await elements[0].click();
            await page.waitForTimeout(1000); // Wait for potential API calls
            
            this.analysis.features.push({
              name: 'interactive-filter',
              selector: selector,
              interactive: true
            });
          } catch (e) {
            // Element not clickable or hidden
          }
        }
      }
    } catch (e) {
      console.log('⚠️ Filter interaction analysis failed:', e.message);
    }
  }

  async testSearchFunctionality(page) {
    console.log('🔍 Testing search functionality...');
    
    try {
      const searchInput = await page.$('input[type="search"], input[placeholder*="search"]');
      if (searchInput) {
        await searchInput.type('lebron', { delay: 100 });
        await page.waitForTimeout(2000); // Wait for search results
        
        this.analysis.features.push({
          name: 'search-functionality',
          working: true,
          testQuery: 'lebron'
        });
      }
    } catch (e) {
      console.log('⚠️ Search functionality test failed:', e.message);
    }
  }

  async generateAnalysis() {
    console.log('📋 Generating analysis report...');
    
    const outputDir = path.join(__dirname, '..', 'analysis');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Finalize analysis
    this.analysis.apiEndpoints = Array.from(this.apiEndpoints);
    this.analysis.totalRequests = this.requests.length;
    this.analysis.technologies = Array.from(this.technologies);
    
    // Performance analysis
    const apiRequests = this.requests.filter(req => 
      req.url.includes('/api/') || req.url.includes('/graphql')
    );
    this.analysis.performance.apiRequestCount = apiRequests.length;
    
    // Write analysis JSON
    fs.writeFileSync(
      path.join(outputDir, 'propfinder_analysis.json'),
      JSON.stringify(this.analysis, null, 2)
    );

    // Write endpoints list
    fs.writeFileSync(
      path.join(outputDir, 'propfinder_endpoints.txt'),
      Array.from(this.apiEndpoints).join('\n')
    );

    // Write competitive analysis template
    const competitiveAnalysis = this.generateCompetitiveAnalysis();
    fs.writeFileSync(
      path.join(outputDir, 'competitive_analysis.md'),
      competitiveAnalysis
    );
  }

  generateCompetitiveAnalysis() {
    return `# PropFinder.app Competitive Analysis

## Generated: ${this.analysis.timestamp}

## Tech Stack Analysis
${Object.entries(this.analysis.techStack).map(([tech, present]) => 
  `- ${tech}: ${present ? '✅' : '❌'}`
).join('\n')}

## API Endpoints Discovered
${this.analysis.apiEndpoints.map(endpoint => `- ${endpoint}`).join('\n')}

## UI Features Detected
${this.analysis.features.map(feature => 
  `- ${feature.name}: ${feature.count || 1} instances`
).join('\n')}

## Performance Metrics
- Initial Load Status: ${this.analysis.performance.initialLoadStatus || 'Unknown'}
- Total Network Requests: ${this.analysis.totalRequests || 0}
- API Requests: ${this.analysis.performance.apiRequestCount || 0}

## Key Findings for A1Betting Implementation

### 1. Technology Choices
Our React/TypeScript/Vite stack ${this.technologies.has('react') ? 'aligns with' : 'differs from'} PropFinder's approach.

### 2. API Architecture
PropFinder uses ${this.analysis.apiEndpoints.length} API endpoints. Our current implementation should match this complexity.

### 3. Feature Parity Status
- Search functionality: ${this.analysis.features.some(f => f.name === 'search-functionality') ? '✅ Detected' : '❌ Not detected'}
- Filter system: ${this.analysis.features.some(f => f.name.includes('filter')) ? '✅ Detected' : '❌ Not detected'}
- Live updates: ${this.analysis.features.some(f => f.name === 'live-indicators') ? '✅ Detected' : '❌ Not detected'}

### 4. Recommended Next Actions
1. Implement missing features detected in PropFinder
2. Match or exceed their API endpoint coverage
3. Ensure our tech stack supports similar functionality
4. Focus on performance parity or improvement

## Raw Data
- Full analysis: propfinder_analysis.json
- API endpoints: propfinder_endpoints.txt
- Screenshots: propfinder_screenshot.png, propfinder_viewport.png
`;
  }
}

// Main execution
async function main() {
  try {
    const recon = new PropFinderRecon();
    await recon.run();
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Check if this is the main module
if (require.main === module) {
  main();
}

module.exports = PropFinderRecon;