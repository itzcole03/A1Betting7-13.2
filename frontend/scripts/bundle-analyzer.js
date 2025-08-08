#!/usr/bin/env node

/**
 * Bundle Analyzer Utility for A1Betting Frontend
 * 
 * This script analyzes the build output to track bundle size optimization progress
 * and identify opportunities for further improvements.
 * 
 * Features:
 * - Bundle size analysis and reporting
 * - Chunk size breakdown
 * - Progress tracking toward 500KB target
 * - Performance recommendations
 * - Comparison with previous builds
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, '..', 'dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');
const JS_DIR = path.join(DIST_DIR, 'js');
const CSS_DIR = path.join(DIST_DIR, 'css');
const REPORTS_DIR = path.join(__dirname, '..', 'reports');
const TARGET_SIZE_KB = 500; // Target bundle size in KB
const WARNING_SIZE_KB = 750; // Warning threshold

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/**
 * Get file size in bytes
 */
async function getFileSize(filePath) {
  try {
    const stats = await stat(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Convert bytes to KB with formatting
 */
function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2);
}

/**
 * Get gzipped size estimate (rough approximation)
 */
function estimateGzipSize(size) {
  // Typical gzip compression ratio for JS/CSS is about 70-80%
  return size * 0.25; // Assume 75% compression
}

/**
 * Analyze JavaScript chunks
 */
async function analyzeJavaScriptChunks() {
  try {
    let files = [];
    let searchDir = ASSETS_DIR;

    // Check if JS files are in a separate js/ directory
    if (fs.existsSync(JS_DIR)) {
      searchDir = JS_DIR;
      files = await readdir(JS_DIR);
    } else if (fs.existsSync(ASSETS_DIR)) {
      searchDir = ASSETS_DIR;
      files = await readdir(ASSETS_DIR);
    } else {
      // Fallback: search in dist root
      searchDir = DIST_DIR;
      files = await readdir(DIST_DIR);
    }

    const jsFiles = files.filter(file => file.endsWith('.js'));
    
    const chunks = [];
    let totalSize = 0;
    
    for (const file of jsFiles) {
      const filePath = path.join(searchDir, file);
      const size = await getFileSize(filePath);
      const gzipSize = estimateGzipSize(size);
      
      chunks.push({
        name: file,
        size: size,
        sizeKB: formatBytes(size),
        gzipSizeKB: formatBytes(gzipSize),
        type: getChunkType(file)
      });
      
      totalSize += size;
    }
    
    // Sort by size (largest first)
    chunks.sort((a, b) => b.size - a.size);
    
    return {
      chunks,
      totalSize,
      totalSizeKB: formatBytes(totalSize),
      totalGzipSizeKB: formatBytes(estimateGzipSize(totalSize)),
      count: chunks.length
    };
  } catch (error) {
    console.error('Error analyzing JavaScript chunks:', error);
    return null;
  }
}

/**
 * Analyze CSS assets
 */
async function analyzeCSSAssets() {
  try {
    let files = [];
    let searchDir = ASSETS_DIR;

    // Check if CSS files are in a separate css/ directory
    if (fs.existsSync(CSS_DIR)) {
      searchDir = CSS_DIR;
      files = await readdir(CSS_DIR);
    } else if (fs.existsSync(ASSETS_DIR)) {
      searchDir = ASSETS_DIR;
      files = await readdir(ASSETS_DIR);
    } else {
      // Fallback: search in dist root
      searchDir = DIST_DIR;
      files = await readdir(DIST_DIR);
    }

    const cssFiles = files.filter(file => file.endsWith('.css'));
    
    const assets = [];
    let totalSize = 0;
    
    for (const file of cssFiles) {
      const filePath = path.join(searchDir, file);
      const size = await getFileSize(filePath);
      const gzipSize = estimateGzipSize(size);
      
      assets.push({
        name: file,
        size: size,
        sizeKB: formatBytes(size),
        gzipSizeKB: formatBytes(gzipSize)
      });
      
      totalSize += size;
    }
    
    return {
      assets,
      totalSize,
      totalSizeKB: formatBytes(totalSize),
      totalGzipSizeKB: formatBytes(estimateGzipSize(totalSize)),
      count: assets.length
    };
  } catch (error) {
    console.error('Error analyzing CSS assets:', error);
    return null;
  }
}

/**
 * Analyze other assets (images, fonts, etc.)
 */
async function analyzeOtherAssets() {
  try {
    const files = await readdir(ASSETS_DIR);
    const otherFiles = files.filter(file => !file.endsWith('.js') && !file.endsWith('.css'));
    
    const assets = [];
    let totalSize = 0;
    
    for (const file of otherFiles) {
      const filePath = path.join(ASSETS_DIR, file);
      const size = await getFileSize(filePath);
      
      assets.push({
        name: file,
        size: size,
        sizeKB: formatBytes(size),
        type: getAssetType(file)
      });
      
      totalSize += size;
    }
    
    return {
      assets,
      totalSize,
      totalSizeKB: formatBytes(totalSize),
      count: assets.length
    };
  } catch (error) {
    console.error('Error analyzing other assets:', error);
    return null;
  }
}

/**
 * Determine chunk type based on filename
 */
function getChunkType(filename) {
  if (filename.includes('react-core')) return 'React Core';
  if (filename.includes('motion')) return 'Framer Motion';
  if (filename.includes('charts')) return 'Charts';
  if (filename.includes('query')) return 'React Query';
  if (filename.includes('state')) return 'State Management';
  if (filename.includes('ui-radix')) return 'UI Components';
  if (filename.includes('icons')) return 'Icons';
  if (filename.includes('utils')) return 'Utilities';
  if (filename.includes('feature-')) return 'Feature Module';
  if (filename.includes('services')) return 'Services';
  if (filename.includes('vendor')) return 'Vendor';
  if (filename.includes('entry')) return 'Entry Point';
  return 'Other';
}

/**
 * Determine asset type based on file extension
 */
function getAssetType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.gif':
    case '.svg':
    case '.webp':
    case '.avif':
      return 'Image';
    case '.woff':
    case '.woff2':
    case '.ttf':
    case '.otf':
    case '.eot':
      return 'Font';
    case '.json':
      return 'Data';
    default:
      return 'Other';
  }
}

/**
 * Generate performance recommendations
 */
function generateRecommendations(analysis) {
  const recommendations = [];
  const { js, totalGzipSizeKB } = analysis;
  
  // Check if target size is exceeded
  if (parseFloat(totalGzipSizeKB) > TARGET_SIZE_KB) {
    recommendations.push({
      priority: 'HIGH',
      type: 'Bundle Size',
      message: `Total bundle size (${totalGzipSizeKB}KB) exceeds target (${TARGET_SIZE_KB}KB)`,
      action: 'Consider further code splitting and lazy loading'
    });
  }
  
  // Check for large individual chunks
  if (js && js.chunks) {
    const largeChunks = js.chunks.filter(chunk => parseFloat(chunk.gzipSizeKB) > 100);
    if (largeChunks.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        type: 'Large Chunks',
        message: `${largeChunks.length} chunks exceed 100KB gzipped`,
        action: 'Consider splitting large chunks further',
        chunks: largeChunks.map(c => c.name)
      });
    }
  }
  
  // Check for too many chunks
  if (js && js.count > 20) {
    recommendations.push({
      priority: 'LOW',
      type: 'Chunk Count',
      message: `High number of chunks (${js.count}) may affect loading performance`,
      action: 'Consider consolidating smaller chunks'
    });
  }
  
  return recommendations;
}

/**
 * Load previous analysis for comparison
 */
function loadPreviousAnalysis() {
  const reportPath = path.join(REPORTS_DIR, 'bundle-analysis.json');
  try {
    if (fs.existsSync(reportPath)) {
      const data = fs.readFileSync(reportPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Could not load previous analysis:', error.message);
  }
  return null;
}

/**
 * Save analysis results
 */
function saveAnalysis(analysis) {
  const reportPath = path.join(REPORTS_DIR, 'bundle-analysis.json');
  const historyPath = path.join(REPORTS_DIR, 'bundle-history.json');
  
  try {
    // Save current analysis
    fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
    
    // Update history
    let history = [];
    if (fs.existsSync(historyPath)) {
      try {
        const historyData = fs.readFileSync(historyPath, 'utf8');
        history = JSON.parse(historyData);
      } catch (e) {
        // Ignore parsing errors, start fresh
      }
    }
    
    // Add current analysis to history
    history.push({
      timestamp: analysis.timestamp,
      totalSizeKB: analysis.totalSizeKB,
      totalGzipSizeKB: analysis.totalGzipSizeKB,
      chunkCount: analysis.js?.count || 0
    });
    
    // Keep only last 20 entries
    if (history.length > 20) {
      history = history.slice(-20);
    }
    
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    
    console.log(`📊 Analysis saved to ${reportPath}`);
  } catch (error) {
    console.error('Error saving analysis:', error);
  }
}

/**
 * Print analysis results
 */
function printAnalysis(analysis) {
  const { js, css, other, totalSizeKB, totalGzipSizeKB, recommendations } = analysis;
  
  console.log('🔍 Bundle Size Analysis Report');
  console.log('=' .repeat(50));
  console.log(`📅 Timestamp: ${analysis.timestamp}`);
  console.log(`📦 Total Bundle Size: ${totalSizeKB}KB (${totalGzipSizeKB}KB gzipped)`);
  console.log(`🎯 Target Size: ${TARGET_SIZE_KB}KB gzipped`);
  
  const percentOfTarget = (parseFloat(totalGzipSizeKB) / TARGET_SIZE_KB * 100).toFixed(1);
  const status = parseFloat(totalGzipSizeKB) <= TARGET_SIZE_KB ? '✅' : '❌';
  console.log(`📈 Progress: ${percentOfTarget}% of target ${status}`);
  console.log();
  
  // JavaScript chunks
  if (js) {
    console.log(`📄 JavaScript Chunks (${js.count} files)`);
    console.log(`   Total: ${js.totalSizeKB}KB (${js.totalGzipSizeKB}KB gzipped)`);
    console.log('   Largest chunks:');
    js.chunks.slice(0, 5).forEach((chunk, i) => {
      console.log(`   ${i + 1}. ${chunk.name}: ${chunk.sizeKB}KB (${chunk.gzipSizeKB}KB gz) - ${chunk.type}`);
    });
    console.log();
  }
  
  // CSS assets
  if (css) {
    console.log(`🎨 CSS Assets (${css.count} files)`);
    console.log(`   Total: ${css.totalSizeKB}KB (${css.totalGzipSizeKB}KB gzipped)`);
    console.log();
  }
  
  // Other assets
  if (other) {
    console.log(`🖼️  Other Assets (${other.count} files)`);
    console.log(`   Total: ${other.totalSizeKB}KB`);
    console.log();
  }
  
  // Recommendations
  if (recommendations.length > 0) {
    console.log('💡 Recommendations:');
    recommendations.forEach((rec, i) => {
      const icon = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
      console.log(`   ${icon} [${rec.priority}] ${rec.type}: ${rec.message}`);
      console.log(`      Action: ${rec.action}`);
      if (rec.chunks) {
        console.log(`      Affected chunks: ${rec.chunks.slice(0, 3).join(', ')}${rec.chunks.length > 3 ? '...' : ''}`);
      }
    });
    console.log();
  }
}

/**
 * Compare with previous analysis
 */
function printComparison(current, previous) {
  if (!previous) {
    console.log('📈 No previous analysis found for comparison');
    return;
  }
  
  const currentSize = parseFloat(current.totalGzipSizeKB);
  const previousSize = parseFloat(previous.totalGzipSizeKB);
  const difference = currentSize - previousSize;
  const percentChange = ((difference / previousSize) * 100).toFixed(1);
  
  console.log('📊 Comparison with Previous Build:');
  
  if (difference > 0) {
    console.log(`   📈 Size increased by ${difference.toFixed(2)}KB (${percentChange}%)`);
  } else if (difference < 0) {
    console.log(`   📉 Size decreased by ${Math.abs(difference).toFixed(2)}KB (${Math.abs(parseFloat(percentChange))}%)`);
  } else {
    console.log(`   ➡️  Size unchanged`);
  }
  
  const currentChunks = current.js?.count || 0;
  const previousChunks = previous.js?.count || 0;
  const chunkDiff = currentChunks - previousChunks;
  
  if (chunkDiff > 0) {
    console.log(`   📄 +${chunkDiff} chunks added`);
  } else if (chunkDiff < 0) {
    console.log(`   📄 ${Math.abs(chunkDiff)} chunks removed`);
  }
  
  console.log();
}

/**
 * Main analysis function
 */
async function analyzeBundles() {
  console.log('🚀 Starting bundle analysis...\n');
  
  // Check if dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ dist directory not found. Please run the build first.');
    process.exit(1);
  }
  
  // Analyze different asset types
  const js = await analyzeJavaScriptChunks();
  const css = await analyzeCSSAssets();
  const other = await analyzeOtherAssets();
  
  if (!js) {
    console.error('❌ Failed to analyze JavaScript chunks');
    process.exit(1);
  }
  
  // Calculate totals
  const totalSize = (js?.totalSize || 0) + (css?.totalSize || 0) + (other?.totalSize || 0);
  const totalSizeKB = formatBytes(totalSize);
  const totalGzipSizeKB = formatBytes(estimateGzipSize(totalSize));
  
  // Create analysis object
  const analysis = {
    timestamp: new Date().toISOString(),
    totalSize,
    totalSizeKB,
    totalGzipSizeKB,
    js,
    css,
    other,
    recommendations: []
  };
  
  // Generate recommendations
  analysis.recommendations = generateRecommendations(analysis);
  
  // Load previous analysis for comparison
  const previousAnalysis = loadPreviousAnalysis();
  
  // Print results
  printAnalysis(analysis);
  printComparison(analysis, previousAnalysis);
  
  // Save analysis
  saveAnalysis(analysis);
  
  // Exit with error code if bundle is too large
  if (parseFloat(totalGzipSizeKB) > WARNING_SIZE_KB) {
    console.error(`❌ Bundle size (${totalGzipSizeKB}KB) exceeds warning threshold (${WARNING_SIZE_KB}KB)`);
    process.exit(1);
  }
  
  console.log('✅ Bundle analysis complete!');
}

// Run the analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeBundles().catch(error => {
    console.error('❌ Bundle analysis failed:', error);
    process.exit(1);
  });
}

export { analyzeBundles };
