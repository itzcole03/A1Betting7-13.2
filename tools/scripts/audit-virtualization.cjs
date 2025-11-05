/**
 * Simple Virtualization Audit Script
 * 
 * Scans React components for potential virtualization issues
 */

const fs = require('fs');
const path = require('path');

const VIRTUALIZATION_THRESHOLD = 100;
const LARGE_ARRAY_PATTERNS = [
  'props', 'projections', 'opportunities', 'items', 'data',
  'bets', 'recommendations', 'players', 'games', 'events'
];

const VIRTUALIZED_COMPONENTS = [
  'VirtualizedPropList', 'VirtualizedList', 'FixedSizeList', 
  'VariableSizeList', 'WindowedList', 'AutoSizer'
];

class VirtualizationAuditor {
  constructor() {
    this.issues = [];
    this.componentsScanned = 0;
    this.filesScanned = 0;
  }

  async auditDirectory(dirPath) {
    console.log(`🔍 Starting virtualization audit of ${dirPath}...`);
    
    await this.scanDirectory(dirPath);
    
    const report = {
      totalFiles: this.filesScanned,
      issuesFound: this.issues.length,
      componentsCovered: this.componentsScanned,
      issues: this.issues,
      summary: {
        high: this.issues.filter(i => i.severity === 'high').length,
        medium: this.issues.filter(i => i.severity === 'medium').length,
        low: this.issues.filter(i => i.severity === 'low').length,
      }
    };

    return report;
  }

  async scanDirectory(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
        await this.scanDirectory(fullPath);
      } else if (entry.isFile() && this.isReactComponent(entry.name)) {
        await this.scanFile(fullPath);
      }
    }
  }

  shouldSkipDirectory(name) {
    const skipDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '__tests__'];
    return skipDirs.includes(name);
  }

  isReactComponent(filename) {
    return /\.(tsx?|jsx?)$/.test(filename) && 
           !/\.(test|spec|stories)\.(tsx?|jsx?)$/.test(filename);
  }

  async scanFile(filePath) {
    try {
      this.filesScanned++;
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(process.cwd(), filePath);
      
      // Simple text-based analysis
      this.analyzeContentForVirtualization(content, relativePath);

    } catch (error) {
      console.warn(`⚠️  Failed to parse ${filePath}: ${error.message}`);
    }
  }

  analyzeContentForVirtualization(content, filePath) {
    const lines = content.split('\n');
    let componentName = 'Unknown';
    let hasVirtualizationImport = false;
    
    // Check for virtualization imports
    hasVirtualizationImport = content.includes('@tanstack/react-virtual') ||
                             content.includes('react-window') ||
                             content.includes('VirtualizedPropList');

    // Find component name
    const componentMatch = content.match(/(?:export\s+(?:default\s+)?)?(?:function|const)\s+([A-Z][a-zA-Z0-9]*)/);
    if (componentMatch) {
      componentName = componentMatch[1];
      this.componentsScanned++;
    }

    // Check each line for potential issues
    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      
      // Check for array.map() without virtualization
      if (this.hasArrayMapPattern(trimmedLine) && !hasVirtualizationImport) {
        const arrayName = this.extractArrayName(trimmedLine);
        if (arrayName && this.isLikelyLargeArray(arrayName)) {
          this.addIssue({
            file: filePath,
            component: componentName,
            issue: `Array.map() on potentially large array '${arrayName}' without virtualization`,
            line: lineIndex + 1,
            severity: 'high',
            suggestion: `Use VirtualizedPropList when ${arrayName}.length > ${VIRTUALIZATION_THRESHOLD}`
          });
        }
      }

      // Check for JSX props that suggest large arrays
      const propMatch = trimmedLine.match(/(\w+)=\{([^}]*)\}/g);
      if (propMatch) {
        propMatch.forEach(prop => {
          const [, propName, propValue] = prop.match(/(\w+)=\{([^}]*)\}/) || [];
          if (propName && this.isLikelyLargeArray(propName) && !hasVirtualizationImport) {
            this.addIssue({
              file: filePath,
              component: componentName,
              issue: `JSX prop '${propName}' might contain large array without virtualization check`,
              line: lineIndex + 1,
              severity: 'medium',
              suggestion: `Consider conditional virtualization for ${propName} when length > ${VIRTUALIZATION_THRESHOLD}`
            });
          }
        });
      }

      // Check for hardcoded large numbers in conditions
      const numberMatch = trimmedLine.match(/\.length\s*[><=!]\s*(\d+)/);
      if (numberMatch) {
        const threshold = parseInt(numberMatch[1]);
        if (threshold >= VIRTUALIZATION_THRESHOLD && !hasVirtualizationImport) {
          this.addIssue({
            file: filePath,
            component: componentName,
            issue: `Manual threshold check (${threshold}) found but no virtualization import`,
            line: lineIndex + 1,
            severity: 'low',
            suggestion: 'Import VirtualizedPropList or similar virtualization component'
          });
        }
      }
    });
  }

  hasArrayMapPattern(line) {
    return /\w+\.map\s*\(/.test(line) && /{/.test(line);
  }

  extractArrayName(line) {
    const match = line.match(/(\w+)\.map\s*\(/);
    return match ? match[1] : null;
  }

  isLikelyLargeArray(name) {
    const nameLower = name.toLowerCase();
    return LARGE_ARRAY_PATTERNS.some(pattern => 
      nameLower.includes(pattern.toLowerCase())
    );
  }

  addIssue(issue) {
    this.issues.push(issue);
  }
}

// Main audit function
async function auditVirtualization(srcPath = './src') {
  const auditor = new VirtualizationAuditor();
  const report = await auditor.auditDirectory(srcPath);
  
  console.log('\n📊 Virtualization Audit Report');
  console.log('================================');
  console.log(`Files scanned: ${report.totalFiles}`);
  console.log(`Components analyzed: ${report.componentsCovered}`);
  console.log(`Issues found: ${report.issuesFound}`);
  console.log(`  - High priority: ${report.summary.high}`);
  console.log(`  - Medium priority: ${report.summary.medium}`);
  console.log(`  - Low priority: ${report.summary.low}`);
  
  if (report.issues.length > 0) {
    console.log('\n🚨 Issues Found:');
    console.log('================');
    
    report.issues.forEach((issue, index) => {
      const icon = issue.severity === 'high' ? '🔴' : 
                  issue.severity === 'medium' ? '🟡' : '🟢';
      
      console.log(`${index + 1}. ${icon} ${issue.file}:${issue.line} (${issue.component})`);
      console.log(`   Issue: ${issue.issue}`);
      console.log(`   Suggestion: ${issue.suggestion}`);
      console.log('');
    });

    // Summary by file
    const fileGroups = {};
    report.issues.forEach(issue => {
      if (!fileGroups[issue.file]) {
        fileGroups[issue.file] = [];
      }
      fileGroups[issue.file].push(issue);
    });

    console.log('\n📁 Issues by File:');
    console.log('==================');
    Object.entries(fileGroups).forEach(([file, issues]) => {
      const highCount = issues.filter(i => i.severity === 'high').length;
      const mediumCount = issues.filter(i => i.severity === 'medium').length;
      const lowCount = issues.filter(i => i.severity === 'low').length;
      
      console.log(`${file}: ${issues.length} issues (🔴 ${highCount} 🟡 ${mediumCount} 🟢 ${lowCount})`);
    });
  } else {
    console.log('\n✅ No virtualization issues found!');
  }
  
  return report;
}

// CLI execution
if (require.main === module) {
  const srcPath = process.argv[2] || './src';
  auditVirtualization(srcPath).catch(console.error);
}

module.exports = { auditVirtualization };