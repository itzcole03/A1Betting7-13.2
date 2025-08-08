#!/usr/bin/env node

/**
 * Tree Shaking Optimization Utility
 * 
 * This utility helps identify opportunities for better tree shaking
 * and dead code elimination to reduce bundle size.
 * 
 * Features:
 * - Analyze import/export patterns
 * - Identify unused exports
 * - Detect barrel import issues
 * - Find large dependencies that can be optimized
 * - Generate optimization recommendations
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.join(__dirname, '..', 'src');
const REPORTS_DIR = path.join(__dirname, '..', 'reports');
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/**
 * Parse imports and exports from a file
 */
async function parseFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    const imports = [];
    const exports = [];
    
    // Parse import statements
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+)?from\s+['"`]([^'"`]+)['"`]/g;
    let importMatch;
    while ((importMatch = importRegex.exec(content)) !== null) {
      const [fullMatch, source] = importMatch;
      const isRelative = source.startsWith('./') || source.startsWith('../');
      const isNamespace = fullMatch.includes('* as ');
      const isDefault = !fullMatch.includes('{') && !isNamespace;
      const namedImports = fullMatch.match(/\{([^}]*)\}/)?.[1]
        ?.split(',')
        .map(imp => imp.trim())
        .filter(Boolean) || [];
      
      imports.push({
        source,
        isRelative,
        isNamespace,
        isDefault,
        namedImports,
        fullMatch
      });
    }
    
    // Parse export statements
    const exportRegex = /export\s+(?:(?:default\s+)|(?:const\s+|let\s+|var\s+|function\s+|class\s+|interface\s+|type\s+)?)?([^;{]+)/g;
    let exportMatch;
    while ((exportMatch = exportRegex.exec(content)) !== null) {
      const [fullMatch, declaration] = exportMatch;
      const isDefault = fullMatch.includes('default');
      
      exports.push({
        declaration: declaration?.trim(),
        isDefault,
        fullMatch
      });
    }
    
    return {
      filePath,
      imports,
      exports,
      size: content.length
    };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Recursively scan directory for source files
 */
async function scanDirectory(dir) {
  const files = [];
  
  async function scan(currentDir) {
    try {
      const entries = await readdir(currentDir);
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry);
        const stats = await stat(fullPath);
        
        if (stats.isDirectory()) {
          // Skip node_modules and other non-source directories
          if (!['node_modules', '.git', 'dist', 'build'].includes(entry)) {
            await scan(fullPath);
          }
        } else if (stats.isFile() && EXTENSIONS.some(ext => entry.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${currentDir}:`, error.message);
    }
  }
  
  await scan(dir);
  return files;
}

/**
 * Analyze barrel imports (index files that re-export everything)
 */
function analyzeBarrelImports(parsedFiles) {
  const barrelFiles = [];
  const barrelImportUsage = new Map();
  
  parsedFiles.forEach(file => {
    const isBarrel = file.filePath.endsWith('/index.ts') || file.filePath.endsWith('/index.tsx');
    
    if (isBarrel) {
      const reExports = file.exports.filter(exp => !exp.isDefault);
      barrelFiles.push({
        path: file.filePath,
        reExportCount: reExports.length,
        size: file.size
      });
    }
    
    // Track imports from barrel files
    file.imports.forEach(imp => {
      if (imp.namedImports.length > 0) {
        const key = imp.source;
        if (!barrelImportUsage.has(key)) {
          barrelImportUsage.set(key, new Set());
        }
        imp.namedImports.forEach(named => {
          barrelImportUsage.get(key).add(named);
        });
      }
    });
  });
  
  return {
    barrelFiles,
    barrelImportUsage: Array.from(barrelImportUsage.entries()).map(([source, imports]) => ({
      source,
      importCount: imports.size,
      imports: Array.from(imports)
    }))
  };
}

/**
 * Find large dependencies that might benefit from optimization
 */
function analyzeLargeDependencies(parsedFiles) {
  const dependencyUsage = new Map();
  
  parsedFiles.forEach(file => {
    file.imports.forEach(imp => {
      if (!imp.isRelative) {
        const pkgName = imp.source.split('/')[0];
        if (!dependencyUsage.has(pkgName)) {
          dependencyUsage.set(pkgName, {
            namedImports: new Set(),
            namespaceImports: 0,
            defaultImports: 0,
            files: new Set()
          });
        }
        
        const usage = dependencyUsage.get(pkgName);
        usage.files.add(file.filePath);
        
        if (imp.isNamespace) {
          usage.namespaceImports++;
        } else if (imp.isDefault) {
          usage.defaultImports++;
        } else {
          imp.namedImports.forEach(named => usage.namedImports.add(named));
        }
      }
    });
  });
  
  return Array.from(dependencyUsage.entries())
    .map(([pkg, usage]) => ({
      package: pkg,
      namedImportsCount: usage.namedImports.size,
      namedImports: Array.from(usage.namedImports),
      namespaceImports: usage.namespaceImports,
      defaultImports: usage.defaultImports,
      filesUsed: usage.files.size,
      files: Array.from(usage.files)
    }))
    .sort((a, b) => b.filesUsed - a.filesUsed);
}

/**
 * Detect potential unused exports
 */
function detectUnusedExports(parsedFiles) {
  const allExports = new Map();
  const allImports = new Set();
  
  // Collect all exports
  parsedFiles.forEach(file => {
    file.exports.forEach(exp => {
      if (!exp.isDefault && exp.declaration) {
        const exportName = exp.declaration.split(/[\s=({]/)[0];
        if (exportName && exportName !== 'default') {
          allExports.set(exportName, file.filePath);
        }
      }
    });
  });
  
  // Collect all imports
  parsedFiles.forEach(file => {
    file.imports.forEach(imp => {
      imp.namedImports.forEach(named => {
        allImports.add(named);
      });
    });
  });
  
  // Find potentially unused exports
  const unusedExports = [];
  allExports.forEach((filePath, exportName) => {
    if (!allImports.has(exportName)) {
      unusedExports.push({ exportName, filePath });
    }
  });
  
  return unusedExports;
}

/**
 * Generate optimization recommendations
 */
function generateOptimizations(analysis) {
  const recommendations = [];
  
  // Barrel import optimizations
  if (analysis.barrelAnalysis.barrelImportUsage.length > 0) {
    const problematicBarrels = analysis.barrelAnalysis.barrelImportUsage
      .filter(barrel => barrel.importCount > 10);
    
    if (problematicBarrels.length > 0) {
      recommendations.push({
        type: 'Barrel Imports',
        priority: 'HIGH',
        issue: `${problematicBarrels.length} barrel imports with >10 named imports detected`,
        impact: 'May prevent effective tree shaking',
        solution: 'Replace barrel imports with direct imports from specific modules',
        files: problematicBarrels.map(b => b.source)
      });
    }
  }
  
  // Large dependency optimizations
  const largeDependencies = analysis.dependencyAnalysis
    .filter(dep => dep.namedImportsCount > 5 && dep.filesUsed > 3);
  
  if (largeDependencies.length > 0) {
    recommendations.push({
      type: 'Large Dependencies',
      priority: 'MEDIUM',
      issue: `${largeDependencies.length} dependencies with heavy usage patterns`,
      impact: 'Large bundle size from over-imported dependencies',
      solution: 'Consider using smaller alternatives or more selective imports',
      details: largeDependencies.slice(0, 5).map(dep => ({
        package: dep.package,
        namedImportsCount: dep.namedImportsCount,
        filesUsed: dep.filesUsed
      }))
    });
  }
  
  // Unused exports
  if (analysis.unusedExports.length > 0) {
    recommendations.push({
      type: 'Unused Exports',
      priority: 'LOW',
      issue: `${analysis.unusedExports.length} potentially unused exports found`,
      impact: 'Dead code that could be removed',
      solution: 'Remove unused exports or verify they are not used externally',
      count: analysis.unusedExports.length
    });
  }
  
  // Namespace imports
  const namespaceImports = analysis.dependencyAnalysis
    .filter(dep => dep.namespaceImports > 0);
  
  if (namespaceImports.length > 0) {
    recommendations.push({
      type: 'Namespace Imports',
      priority: 'MEDIUM',
      issue: `${namespaceImports.length} packages imported with namespace imports`,
      impact: 'Prevents tree shaking of unused functions',
      solution: 'Replace namespace imports with named imports where possible',
      packages: namespaceImports.map(dep => dep.package)
    });
  }
  
  return recommendations;
}

/**
 * Print analysis results
 */
function printAnalysis(analysis) {
  console.log('🌳 Tree Shaking Analysis Report');
  console.log('=' .repeat(50));
  console.log(`📅 Timestamp: ${analysis.timestamp}`);
  console.log(`📁 Files analyzed: ${analysis.fileCount}`);
  console.log();
  
  // Barrel analysis
  console.log('📦 Barrel Import Analysis:');
  console.log(`   Barrel files found: ${analysis.barrelAnalysis.barrelFiles.length}`);
  if (analysis.barrelAnalysis.barrelImportUsage.length > 0) {
    console.log('   Heavy barrel usage:');
    analysis.barrelAnalysis.barrelImportUsage
      .filter(barrel => barrel.importCount > 5)
      .slice(0, 5)
      .forEach(barrel => {
        console.log(`   - ${barrel.source}: ${barrel.importCount} named imports`);
      });
  }
  console.log();
  
  // Dependency analysis
  console.log('📚 Dependency Usage Analysis:');
  console.log(`   External packages: ${analysis.dependencyAnalysis.length}`);
  console.log('   Top dependencies by usage:');
  analysis.dependencyAnalysis.slice(0, 5).forEach(dep => {
    console.log(`   - ${dep.package}: ${dep.filesUsed} files, ${dep.namedImportsCount} named imports`);
  });
  console.log();
  
  // Unused exports
  console.log('🗑️  Unused Export Analysis:');
  console.log(`   Potentially unused exports: ${analysis.unusedExports.length}`);
  if (analysis.unusedExports.length > 0) {
    console.log('   Examples:');
    analysis.unusedExports.slice(0, 5).forEach(exp => {
      const fileName = path.basename(exp.filePath);
      console.log(`   - ${exp.exportName} in ${fileName}`);
    });
  }
  console.log();
  
  // Recommendations
  if (analysis.recommendations.length > 0) {
    console.log('💡 Optimization Recommendations:');
    analysis.recommendations.forEach((rec, i) => {
      const icon = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
      console.log(`   ${icon} [${rec.priority}] ${rec.type}:`);
      console.log(`      Issue: ${rec.issue}`);
      console.log(`      Impact: ${rec.impact}`);
      console.log(`      Solution: ${rec.solution}`);
      if (rec.files) {
        console.log(`      Affected files: ${rec.files.slice(0, 3).join(', ')}${rec.files.length > 3 ? '...' : ''}`);
      }
      if (rec.packages) {
        console.log(`      Affected packages: ${rec.packages.slice(0, 3).join(', ')}${rec.packages.length > 3 ? '...' : ''}`);
      }
      console.log();
    });
  }
}

/**
 * Save analysis results
 */
function saveAnalysis(analysis) {
  const reportPath = path.join(REPORTS_DIR, 'tree-shaking-analysis.json');
  
  try {
    fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
    console.log(`📊 Tree shaking analysis saved to ${reportPath}`);
  } catch (error) {
    console.error('Error saving analysis:', error);
  }
}

/**
 * Main analysis function
 */
async function analyzeTreeShaking() {
  console.log('🚀 Starting tree shaking analysis...\n');
  
  // Scan for source files
  console.log('📁 Scanning source files...');
  const sourceFiles = await scanDirectory(SRC_DIR);
  console.log(`Found ${sourceFiles.length} source files\n`);
  
  // Parse all files
  console.log('📖 Parsing files...');
  const parsedFiles = [];
  for (const file of sourceFiles) {
    const parsed = await parseFile(file);
    if (parsed) {
      parsedFiles.push(parsed);
    }
  }
  console.log(`Parsed ${parsedFiles.length} files successfully\n`);
  
  // Perform analysis
  console.log('🔍 Analyzing import/export patterns...');
  const barrelAnalysis = analyzeBarrelImports(parsedFiles);
  const dependencyAnalysis = analyzeLargeDependencies(parsedFiles);
  const unusedExports = detectUnusedExports(parsedFiles);
  
  const analysis = {
    timestamp: new Date().toISOString(),
    fileCount: parsedFiles.length,
    barrelAnalysis,
    dependencyAnalysis,
    unusedExports,
    recommendations: []
  };
  
  // Generate recommendations
  analysis.recommendations = generateOptimizations(analysis);
  
  // Print and save results
  printAnalysis(analysis);
  saveAnalysis(analysis);
  
  console.log('✅ Tree shaking analysis complete!');
  
  // Return analysis for programmatic use
  return analysis;
}

// Run the analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeTreeShaking().catch(error => {
    console.error('❌ Tree shaking analysis failed:', error);
    process.exit(1);
  });
}

export { analyzeTreeShaking };
