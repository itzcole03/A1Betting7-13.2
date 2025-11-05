/**
 * Virtualization Audit Script
 * 
 * Scans React components for potential virtualization issues
 * and generates a report of components that should use virtualization
 * for performance optimization.
 */

import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

const VIRTUALIZATION_THRESHOLD = 100;
const LARGE_ARRAY_PATTERNS = [
  'props', 'projections', 'opportunities', 'items', 'data',
  'bets', 'recommendations', 'players', 'games', 'events'
];

const VIRTUALIZED_COMPONENTS = [
  'VirtualizedPropList', 'VirtualizedList', 'FixedSizeList', 
  'VariableSizeList', 'WindowedList', 'AutoSizer'
];

interface VirtualizationIssue {
  file: string;
  component: string;
  issue: string;
  line: number;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
}

interface AuditReport {
  totalFiles: number;
  issuesFound: number;
  componentsCovered: number;
  issues: VirtualizationIssue[];
  summary: {
    high: number;
    medium: number;
    low: number;
  };
}

class VirtualizationAuditor {
  private issues: VirtualizationIssue[] = [];
  private componentsScanned = 0;
  private filesScanned = 0;

  async auditDirectory(dirPath: string): Promise<AuditReport> {
    console.log(`🔍 Starting virtualization audit of ${dirPath}...`);
    
    await this.scanDirectory(dirPath);
    
    const report: AuditReport = {
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

  private async scanDirectory(dirPath: string): Promise<void> {
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

  private shouldSkipDirectory(name: string): boolean {
    const skipDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '__tests__'];
    return skipDirs.includes(name);
  }

  private isReactComponent(filename: string): boolean {
    return /\.(tsx?|jsx?)$/.test(filename) && 
           !/\.(test|spec|stories)\.(tsx?|jsx?)$/.test(filename);
  }

  private async scanFile(filePath: string): Promise<void> {
    try {
      this.filesScanned++;
      const content = fs.readFileSync(filePath, 'utf-8');
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
        errorRecovery: true,
      });

      const relativePath = path.relative(process.cwd(), filePath);
      let currentComponent = '';
      let hasVirtualizationImport = false;

      traverse(ast, {
        ImportDeclaration: (path) => {
          const source = path.node.source.value;
          if (source.includes('@tanstack/react-virtual') ||
              source.includes('react-window') ||
              source.includes('VirtualizedPropList')) {
            hasVirtualizationImport = true;
          }
        },

        FunctionDeclaration: (path) => {
          if (path.node.id) {
            currentComponent = path.node.id.name;
            this.componentsScanned++;
            this.analyzeComponent(path, relativePath, currentComponent, hasVirtualizationImport);
          }
        },

        VariableDeclarator: (path) => {
          if (path.node.id.type === 'Identifier' && path.node.init) {
            if (path.node.init.type === 'ArrowFunctionExpression' ||
                path.node.init.type === 'FunctionExpression') {
              currentComponent = path.node.id.name;
              this.componentsScanned++;
              this.analyzeComponent(path, relativePath, currentComponent, hasVirtualizationImport);
            }
          }
        },
      });

    } catch (error) {
      console.warn(`⚠️  Failed to parse ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private analyzeComponent(
    path: any, 
    filePath: string, 
    componentName: string, 
    hasVirtualizationImport: boolean
  ): void {
    let hasLargeListRendering = false;
    let hasVirtualizationCheck = false;
    let hasMapRendering = false;
    
    // Traverse the component body
    path.traverse({
      JSXElement: (jsxPath: any) => {
        this.checkJSXElement(jsxPath, filePath, componentName);
      },

      CallExpression: (callPath: any) => {
        if (this.isMapCall(callPath)) {
          hasMapRendering = true;
          this.checkMapRendering(callPath, filePath, componentName);
        }
      },

      ConditionalExpression: (condPath: any) => {
        if (this.hasLengthCondition(condPath)) {
          hasVirtualizationCheck = true;
        }
      },

      LogicalExpression: (logPath: any) => {
        if (this.hasLengthCondition(logPath)) {
          hasVirtualizationCheck = true;
        }
      }
    });

    // Check for patterns that suggest virtualization needs
    const componentBody = this.getComponentBody(path);
    if (componentBody) {
      const hasVirtualizationKeywords = this.hasVirtualizationKeywords(componentBody);
      if (hasVirtualizationKeywords) {
        hasVirtualizationCheck = true;
      }

      if (hasMapRendering && !hasVirtualizationCheck && !hasVirtualizationImport) {
        this.addIssue({
          file: filePath,
          component: componentName,
          issue: 'Component renders lists without virtualization check',
          line: path.node.loc?.start.line || 0,
          severity: 'medium',
          suggestion: 'Add conditional virtualization for large lists or import virtualization components'
        });
      }
    }
  }

  private checkJSXElement(path: any, filePath: string, componentName: string): void {
    const elementName = path.node.openingElement.name.name;
    
    // Skip if already using virtualized component
    if (VIRTUALIZED_COMPONENTS.includes(elementName)) {
      return;
    }

    // Check for props that suggest large lists
    const attributes = path.node.openingElement.attributes || [];
    
    for (const attr of attributes) {
      if (attr.type === 'JSXAttribute' && attr.name) {
        const propName = attr.name.name;
        
        if (LARGE_ARRAY_PATTERNS.some(pattern => 
            propName.toLowerCase().includes(pattern.toLowerCase()))) {
          
          this.addIssue({
            file: filePath,
            component: componentName,
            issue: `JSX element with potentially large array prop '${propName}'`,
            line: path.node.loc?.start.line || 0,
            severity: 'medium',
            suggestion: `Consider using virtualization if ${propName} can contain > ${VIRTUALIZATION_THRESHOLD} items`
          });
        }
      }
    }
  }

  private checkMapRendering(path: any, filePath: string, componentName: string): void {
    const callee = path.node.callee.object;
    
    if (callee && callee.type === 'Identifier') {
      const varName = callee.name;
      
      if (LARGE_ARRAY_PATTERNS.some(pattern => 
          varName.toLowerCase().includes(pattern.toLowerCase()))) {
        
        // Check if this is in JSX context
        let parent = path.parent;
        let inJSX = false;
        
        while (parent) {
          if (parent.type === 'JSXExpressionContainer') {
            inJSX = true;
            break;
          }
          parent = parent.parent;
        }

        if (inJSX) {
          this.addIssue({
            file: filePath,
            component: componentName,
            issue: `Array.map() rendering on potentially large array '${varName}'`,
            line: path.node.loc?.start.line || 0,
            severity: 'high',
            suggestion: `Use VirtualizedPropList or similar when ${varName}.length > ${VIRTUALIZATION_THRESHOLD}`
          });
        }
      }
    }
  }

  private isMapCall(path: any): boolean {
    return path.node.callee && 
           path.node.callee.type === 'MemberExpression' && 
           path.node.callee.property && 
           path.node.callee.property.name === 'map';
  }

  private hasLengthCondition(path: any): boolean {
    const node = path.node;
    
    if (node.type === 'BinaryExpression') {
      // Check for .length comparisons
      const hasLengthProperty = (n: any) => 
        n.type === 'MemberExpression' && 
        n.property && 
        n.property.name === 'length';
      
      if (hasLengthProperty(node.left) || hasLengthProperty(node.right)) {
        // Check if comparing against a reasonable threshold
        const literal = node.left.type === 'Literal' ? node.left : node.right;
        if (literal && literal.type === 'Literal' && 
            typeof literal.value === 'number' && 
            literal.value >= VIRTUALIZATION_THRESHOLD * 0.5) {
          return true;
        }
      }
    }
    
    return false;
  }

  private hasVirtualizationKeywords(componentBody: string): boolean {
    const keywords = [
      'virtualized', 'virtualizer', 'usevirtualizer', 'fixedsizelist',
      'variablesizelist', 'virtualizedlist', 'virtualizedproplist',
      'windowedlist', 'autosizer'
    ];
    
    const bodyLower = componentBody.toLowerCase();
    return keywords.some(keyword => bodyLower.includes(keyword));
  }

  private getComponentBody(path: any): string | null {
    try {
      // Get the body of the component
      let body = null;
      
      if (path.node.type === 'FunctionDeclaration') {
        body = path.node.body;
      } else if (path.node.init) {
        body = path.node.init.body;
      }
      
      if (body) {
        return JSON.stringify(body); // Simple serialization for keyword checking
      }
    } catch {
      // Ignore errors
    }
    
    return null;
  }

  private addIssue(issue: VirtualizationIssue): void {
    this.issues.push(issue);
  }
}

// Main audit function
export async function auditVirtualization(srcPath: string = './frontend/src'): Promise<AuditReport> {
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
    
    for (const issue of report.issues) {
      const icon = issue.severity === 'high' ? '🔴' : 
                  issue.severity === 'medium' ? '🟡' : '🟢';
      
      console.log(`${icon} ${issue.file}:${issue.line} (${issue.component})`);
      console.log(`   Issue: ${issue.issue}`);
      console.log(`   Suggestion: ${issue.suggestion}`);
      console.log('');
    }
  }
  
  return report;
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const srcPath = process.argv[2] || './frontend/src';
  auditVirtualization(srcPath).catch(console.error);
}