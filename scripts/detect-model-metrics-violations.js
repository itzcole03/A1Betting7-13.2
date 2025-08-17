#!/usr/bin/env node

/**
 * CI Guard: Detect Direct Model Metrics Property Access
 * 
 * This script scans TypeScript/JavaScript files for potentially unsafe
 * direct property access on model metrics objects. It helps enforce
 * the use of safe accessor functions to prevent runtime crashes.
 * 
 * Usage:
 *   node scripts/detect-model-metrics-violations.js
 *   npm run check:model-metrics  # If added to package.json
 * 
 * Exit codes:
 *   0 - No violations found
 *   1 - Violations detected
 *   2 - Script error
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Directories to scan
  scanDirs: ['frontend/src'],
  
  // File patterns to include
  includePatterns: [/\.(tsx?|jsx?)$/],
  
  // File patterns to exclude
  excludePatterns: [
    /node_modules/,
    /\.test\./,
    /\.spec\./,
    /ensureModelMetricsShape/,
    /modelMetricsAccessors/,
    /\.d\.ts$/
  ],
  
  // Dangerous property access patterns
  violationPatterns: [
    // Direct optimization_level access
    {
      pattern: /\b\w+\.system_info\.optimization_level\b/g,
      message: "Direct access to system_info.optimization_level - use getOptimizationLevel() instead",
      severity: "error"
    },
    {
      pattern: /\b\w+\.optimization_level\b/g,
      message: "Direct access to optimization_level - use getOptimizationLevel() instead", 
      severity: "error"
    },
    
    // Direct model property access
    {
      pattern: /\b\w+\.model_name\b/g,
      message: "Direct access to model_name - use getModelName() instead",
      severity: "warning"
    },
    {
      pattern: /\b\w+\.modelName\b/g,
      message: "Direct access to modelName - use getModelName() instead",
      severity: "warning"
    },
    
    // Direct performance metrics access
    {
      pattern: /\b\w+\.throughput_per_second\b/g,
      message: "Direct access to throughput_per_second - use getThroughputRps() instead",
      severity: "warning"
    },
    {
      pattern: /\b\w+\.avg_latency\b/g,
      message: "Direct access to avg_latency - use getAvgLatencyMs() instead",
      severity: "warning"
    },
    
    // Direct inference metrics access (legacy patterns)
    {
      pattern: /\binferenceMetrics\.\w+\b/g,
      message: "Direct access to inferenceMetrics - consider using model metrics accessors",
      severity: "info"
    }
  ]
};

class ModelMetricsViolationDetector {
  constructor(config) {
    this.config = config;
    this.violations = [];
    this.stats = {
      filesScanned: 0,
      violationsFound: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0
    };
  }

  async scan() {
    console.log('🔍 Scanning for model metrics property access violations...\n');
    
    try {
      for (const dir of this.config.scanDirs) {
        await this.scanDirectory(dir);
      }
      
      this.reportResults();
      return this.violations.filter(v => v.severity === 'error').length === 0;
      
    } catch (error) {
      console.error('❌ Scanner error:', error.message);
      process.exit(2);
    }
  }

  async scanDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      console.warn(`⚠️  Directory not found: ${dirPath}`);
      return;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath);
      } else if (entry.isFile()) {
        await this.scanFile(fullPath);
      }
    }
  }

  async scanFile(filePath) {
    // Check if file should be included
    const shouldInclude = this.config.includePatterns.some(pattern => 
      pattern.test(filePath)
    );
    
    if (!shouldInclude) return;
    
    // Check if file should be excluded
    const shouldExclude = this.config.excludePatterns.some(pattern =>
      pattern.test(filePath)
    );
    
    if (shouldExclude) return;

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.stats.filesScanned++;
      
      // Check each violation pattern
      for (const { pattern, message, severity } of this.config.violationPatterns) {
        const matches = [...content.matchAll(pattern)];
        
        for (const match of matches) {
          // Get line number
          const beforeMatch = content.substring(0, match.index);
          const lineNumber = beforeMatch.split('\n').length;
          
          // Get line content for context
          const lines = content.split('\n');
          const lineContent = lines[lineNumber - 1]?.trim() || '';
          
          this.violations.push({
            file: filePath,
            line: lineNumber,
            column: match.index - beforeMatch.lastIndexOf('\n'),
            match: match[0],
            message,
            severity,
            context: lineContent
          });
          
          this.stats.violationsFound++;
          this.stats[`${severity}Count`]++;
        }
      }
      
    } catch (error) {
      console.warn(`⚠️  Could not read file ${filePath}: ${error.message}`);
    }
  }

  reportResults() {
    console.log('\n📊 Scan Results:');
    console.log(`   Files scanned: ${this.stats.filesScanned}`);
    console.log(`   Violations found: ${this.stats.violationsFound}`);
    
    if (this.stats.errorCount > 0) {
      console.log(`   ❌ Errors: ${this.stats.errorCount}`);
    }
    if (this.stats.warningCount > 0) {
      console.log(`   ⚠️  Warnings: ${this.stats.warningCount}`);
    }
    if (this.stats.infoCount > 0) {
      console.log(`   ℹ️  Info: ${this.stats.infoCount}`);
    }

    if (this.violations.length === 0) {
      console.log('\n✅ No model metrics property access violations detected!');
      return;
    }

    console.log('\n🚨 Violations detected:\n');
    
    // Group violations by file
    const violationsByFile = this.violations.reduce((acc, violation) => {
      if (!acc[violation.file]) acc[violation.file] = [];
      acc[violation.file].push(violation);
      return acc;
    }, {});

    for (const [file, violations] of Object.entries(violationsByFile)) {
      console.log(`📁 ${file}`);
      
      for (const violation of violations) {
        const severityIcon = {
          error: '❌',
          warning: '⚠️',
          info: 'ℹ️'
        }[violation.severity] || '•';
        
        console.log(`   ${severityIcon} Line ${violation.line}: ${violation.message}`);
        console.log(`      Context: ${violation.context}`);
        console.log(`      Match: "${violation.match}"`);
        console.log('');
      }
    }

    // Provide guidance
    console.log('💡 Guidance:');
    console.log('   • Import safe accessors: import { getOptimizationLevel, ... } from "@/utils/modelMetricsAccessors"');
    console.log('   • Replace direct access with accessor calls');
    console.log('   • See docs/model_metrics_normalization.md for migration guide');
    
    if (this.stats.errorCount > 0) {
      console.log('\n❌ Critical violations found - build should fail');
    }
  }
}

// CLI interface
async function main() {
  const detector = new ModelMetricsViolationDetector(CONFIG);
  const success = await detector.scan();
  
  // Exit with appropriate code
  if (!success) {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(2);
  });
}

module.exports = { ModelMetricsViolationDetector, CONFIG };