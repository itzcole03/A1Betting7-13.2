/**
 * Preload Audit Utility
 * 
 * Scans index.html and provides comprehensive analysis of preload/preconnect
 * entries with validation and performance recommendations.
 */

interface PreloadEntry {
  rel: string;
  href: string;
  as?: string;
  type?: string;
  crossorigin?: string | boolean;
  media?: string;
  integrity?: string;
  element: HTMLLinkElement;
}

interface PreloadAuditResult {
  preloadEntries: PreloadEntry[];
  preconnectEntries: PreloadEntry[];
  dnsPreconnectEntries: PreloadEntry[];
  issues: PreloadIssue[];
  recommendations: string[];
  performanceScore: number;
}

interface PreloadIssue {
  type: 'missing_as' | 'missing_crossorigin' | 'invalid_href' | 'missing_critical_resource' | 'unused_preload';
  element: PreloadEntry;
  severity: 'low' | 'medium' | 'high';
  description: string;
  fix: string;
}

class PreloadAuditor {
  /**
   * Perform comprehensive preload audit
   */
  public auditPreloads(): PreloadAuditResult {
    const linkElements = document.querySelectorAll('link[rel]') as NodeListOf<HTMLLinkElement>;
    
    const preloadEntries: PreloadEntry[] = [];
    const preconnectEntries: PreloadEntry[] = [];
    const dnsPreconnectEntries: PreloadEntry[] = [];
    const issues: PreloadIssue[] = [];

    // Categorize and validate link elements
    linkElements.forEach(element => {
      const entry: PreloadEntry = {
        rel: element.rel,
        href: element.href,
        as: element.getAttribute('as') || undefined,
        type: element.type || undefined,
        crossorigin: element.hasAttribute('crossorigin') ? (element.getAttribute('crossorigin') || true) : undefined,
        media: element.media || undefined,
        integrity: element.integrity || undefined,
        element
      };

      switch (element.rel.toLowerCase()) {
        case 'preload':
          preloadEntries.push(entry);
          this.validatePreloadEntry(entry, issues);
          break;
        case 'preconnect':
          preconnectEntries.push(entry);
          this.validatePreconnectEntry(entry, issues);
          break;
        case 'dns-prefetch':
          dnsPreconnectEntries.push(entry);
          break;
      }
    });

    // Check for missing critical resources
    this.checkMissingCriticalResources(preloadEntries, issues);

    // Generate recommendations
    const recommendations = this.generateRecommendations(preloadEntries, preconnectEntries, issues);

    // Calculate performance score
    const performanceScore = this.calculatePerformanceScore(preloadEntries, preconnectEntries, issues);

    return {
      preloadEntries,
      preconnectEntries,
      dnsPreconnectEntries,
      issues,
      recommendations,
      performanceScore
    };
  }

  /**
   * Validate preload entry attributes
   */
  private validatePreloadEntry(entry: PreloadEntry, issues: PreloadIssue[]): void {
    // Check for missing 'as' attribute
    if (!entry.as) {
      issues.push({
        type: 'missing_as',
        element: entry,
        severity: 'high',
        description: `Preload link missing 'as' attribute: ${entry.href}`,
        fix: "Add 'as' attribute to specify resource type (script, style, font, etc.)"
      });
    }

    // Check for fonts missing crossorigin
    if (entry.as === 'font' && entry.crossorigin === undefined) {
      issues.push({
        type: 'missing_crossorigin',
        element: entry,
        severity: 'medium',
        description: `Font preload missing 'crossorigin' attribute: ${entry.href}`,
        fix: "Add 'crossorigin' attribute for font preloads"
      });
    }

    // Validate href
    if (!entry.href || entry.href === window.location.href) {
      issues.push({
        type: 'invalid_href',
        element: entry,
        severity: 'high',
        description: `Invalid or missing href in preload: ${entry.href}`,
        fix: "Provide valid resource URL in href attribute"
      });
    }
  }

  /**
   * Validate preconnect entry attributes
   */
  private validatePreconnectEntry(entry: PreloadEntry, issues: PreloadIssue[]): void {
    // Check for external origins that might need crossorigin
    try {
      const url = new URL(entry.href);
      if (url.origin !== window.location.origin && entry.crossorigin === undefined) {
        // Only flag as medium severity since not all preconnects need crossorigin
        issues.push({
          type: 'missing_crossorigin',
          element: entry,
          severity: 'medium',
          description: `External preconnect might need 'crossorigin': ${entry.href}`,
          fix: "Consider adding 'crossorigin' attribute for external origins that serve CORS-enabled resources"
        });
      }
    } catch {
      issues.push({
        type: 'invalid_href',
        element: entry,
        severity: 'medium',
        description: `Invalid URL in preconnect: ${entry.href}`,
        fix: "Provide valid URL in href attribute"
      });
    }
  }

  /**
   * Check for missing critical resources that should be preloaded
   */
  private checkMissingCriticalResources(preloadEntries: PreloadEntry[], issues: PreloadIssue[]): void {
    const preloadedUrls = new Set(preloadEntries.map(entry => entry.href));
    const criticalResources: { url: string; type: string; reason: string }[] = [];

    // Check for critical CSS files that aren't preloaded
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]') as NodeListOf<HTMLLinkElement>;
    stylesheets.forEach(stylesheet => {
      if (!preloadedUrls.has(stylesheet.href)) {
        criticalResources.push({
          url: stylesheet.href,
          type: 'style',
          reason: 'Critical CSS file should be preloaded'
        });
      }
    });

    // Check for critical scripts that aren't preloaded
    const scripts = document.querySelectorAll('script[src]') as NodeListOf<HTMLScriptElement>;
    scripts.forEach(script => {
      if (!preloadedUrls.has(script.src) && !script.src.includes('analytics')) {
        criticalResources.push({
          url: script.src,
          type: 'script',
          reason: 'Critical script should be preloaded'
        });
      }
    });

    // Add issues for missing critical resources
    criticalResources.forEach(resource => {
      issues.push({
        type: 'missing_critical_resource',
        element: {
          rel: 'preload',
          href: resource.url,
          as: resource.type,
          element: {} as HTMLLinkElement
        },
        severity: resource.type === 'style' ? 'high' : 'medium',
        description: resource.reason,
        fix: `Add <link rel="preload" href="${resource.url}" as="${resource.type}">`
      });
    });
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    preloadEntries: PreloadEntry[], 
    preconnectEntries: PreloadEntry[], 
    issues: PreloadIssue[]
  ): string[] {
    const recommendations: string[] = [];

    if (preloadEntries.length === 0) {
      recommendations.push("Consider preloading critical resources (CSS, JavaScript, fonts) for better performance");
    }

    if (preconnectEntries.length < 2) {
      recommendations.push("Add preconnect links for external domains (fonts, CDNs, APIs) to reduce connection time");
    }

    const highSeverityIssues = issues.filter(issue => issue.severity === 'high');
    if (highSeverityIssues.length > 0) {
      recommendations.push(`Fix ${highSeverityIssues.length} high-severity preload issues`);
    }

    const fontPreloads = preloadEntries.filter(entry => entry.as === 'font');
    if (fontPreloads.length === 0) {
      recommendations.push("Consider preloading critical fonts to prevent layout shift");
    }

    // Check for too many preloads (performance anti-pattern)
    if (preloadEntries.length > 10) {
      recommendations.push("Reduce number of preloaded resources - too many preloads can hurt performance");
    }

    if (recommendations.length === 0) {
      recommendations.push("Preload configuration looks good! Consider monitoring Core Web Vitals for further optimization");
    }

    return recommendations;
  }

  /**
   * Calculate performance score based on preload configuration
   */
  private calculatePerformanceScore(
    preloadEntries: PreloadEntry[], 
    preconnectEntries: PreloadEntry[], 
    issues: PreloadIssue[]
  ): number {
    let score = 100;

    // Deduct points for issues
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 8;
          break;
        case 'low':
          score -= 3;
          break;
      }
    });

    // Deduct points for missing preconnects (up to -20)
    if (preconnectEntries.length === 0) {
      score -= 20;
    } else if (preconnectEntries.length === 1) {
      score -= 10;
    }

    // Deduct points for no preloads (up to -30)
    if (preloadEntries.length === 0) {
      score -= 30;
    }

    // Deduct points for too many preloads
    if (preloadEntries.length > 10) {
      score -= (preloadEntries.length - 10) * 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate detailed audit report
   */
  public generateAuditReport(): string {
    const result = this.auditPreloads();
    
    let report = '=== PRELOAD AUDIT REPORT ===\n\n';
    
    report += `Performance Score: ${result.performanceScore}/100\n\n`;
    
    report += `PRELOAD ENTRIES (${result.preloadEntries.length}):\n`;
    result.preloadEntries.forEach((entry, index) => {
      report += `${index + 1}. ${entry.href}\n`;
      report += `   - as: ${entry.as || 'NOT SET'}\n`;
      report += `   - type: ${entry.type || 'N/A'}\n`;
      report += `   - crossorigin: ${entry.crossorigin || 'N/A'}\n\n`;
    });

    report += `PRECONNECT ENTRIES (${result.preconnectEntries.length}):\n`;
    result.preconnectEntries.forEach((entry, index) => {
      report += `${index + 1}. ${entry.href}\n`;
      report += `   - crossorigin: ${entry.crossorigin || 'N/A'}\n\n`;
    });

    if (result.issues.length > 0) {
      report += `ISSUES FOUND (${result.issues.length}):\n`;
      result.issues.forEach((issue, index) => {
        report += `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}\n`;
        report += `   Fix: ${issue.fix}\n\n`;
      });
    }

    report += 'RECOMMENDATIONS:\n';
    result.recommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec}\n`;
    });

    return report;
  }
}

// Export singleton instance
export const preloadAuditor = new PreloadAuditor();
export type { PreloadAuditResult, PreloadEntry, PreloadIssue };