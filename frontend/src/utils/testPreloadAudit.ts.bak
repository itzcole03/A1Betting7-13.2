import { preloadAuditor } from '../utils/preloadAudit';

/**
 * Test the preload audit functionality
 * Run this in browser console or during app initialization
 */
export function testPreloadAudit(): void {
  // eslint-disable-next-line no-console
  console.group('🔍 Preload Audit Results');
  
  try {
    const report = preloadAuditor.generateAuditReport();
    // eslint-disable-next-line no-console
    console.log(report);
    
    // Also get structured data for programmatic use
    const auditResult = preloadAuditor.auditPreloads();
    // eslint-disable-next-line no-console
    console.log('\n📊 Structured Audit Data:', auditResult);
    
    // Quick summary for developers
    // eslint-disable-next-line no-console
    console.log(`\n📈 Quick Summary:`);
    // eslint-disable-next-line no-console
    console.log(`- Performance Score: ${auditResult.performanceScore}/100`);
    // eslint-disable-next-line no-console
    console.log(`- Preload entries: ${auditResult.preloadEntries.length}`);
    // eslint-disable-next-line no-console
    console.log(`- Preconnect entries: ${auditResult.preconnectEntries.length}`);
    // eslint-disable-next-line no-console
    console.log(`- Issues found: ${auditResult.issues.length}`);
    // eslint-disable-next-line no-console
    console.log(`- High priority issues: ${auditResult.issues.filter(i => i.severity === 'high').length}`);
    
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error running preload audit:', error);
  }
  
  // eslint-disable-next-line no-console
  console.groupEnd();
}

// Auto-run in development mode
if (process.env.NODE_ENV === 'development') {
  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testPreloadAudit);
  } else {
    // DOM is already ready
    setTimeout(testPreloadAudit, 1000); // Small delay to ensure all resources are loaded
  }
}