/**
 * Changelog Management Service
 * Provides automated changelog integration and maintenance for A1Betting
 * Implements transparency requirements from the Analysis Report
 */

interface ChangelogEntry {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  category: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  transparency?: boolean; // Flag for transparency-related changes
}

interface VersionInfo {
  version: string;
  releaseDate: string;
  status: 'unreleased' | 'stable' | 'deprecated';
  entries: ChangelogEntry[];
}

class ChangelogService {
  private versions: VersionInfo[] = [];
  private currentVersion = '8.1.0'; // Incremented for transparency updates

  constructor() {
    this.initializeVersions();
  }

  /**
   * Initialize version history with accurate, transparent entries
   */
  private initializeVersions(): void {
    this.versions = [
      {
        version: '8.1.0',
        releaseDate: '2025-01-20',
        status: 'unreleased',
        entries: [
          {
            version: '8.1.0',
            date: '2025-01-20',
            type: 'major',
            category: 'changed',
            title: 'Quantum AI Transparency Update',
            description: 'Updated terminology from "Quantum Computing Simulation" to "Quantum-Inspired Classical Algorithms" for accuracy and transparency',
            impact: 'high',
            transparency: true,
          },
          {
            version: '8.1.0',
            date: '2025-01-20',
            type: 'major',
            category: 'added',
            title: 'Live Demo Performance Monitoring',
            description: 'Comprehensive monitoring system for live demo performance, health metrics, and user engagement tracking',
            impact: 'medium',
          },
          {
            version: '8.1.0',
            date: '2025-01-20',
            type: 'minor',
            category: 'added',
            title: 'Automated Changelog Management',
            description: 'Integrated changelog service with version tracking and transparency flagging',
            impact: 'low',
          },
        ],
      },
      {
        version: '8.0.0',
        releaseDate: '2025-01-20',
        status: 'stable',
        entries: [
          {
            version: '8.0.0',
            date: '2025-01-20',
            type: 'major',
            category: 'added',
            title: 'Advanced Mathematical Optimization Engine',
            description: 'Quantum-inspired classical algorithms for portfolio optimization including annealing simulation and variational optimization',
            impact: 'high',
          },
          {
            version: '8.0.0',
            date: '2025-01-20',
            type: 'major',
            category: 'added',
            title: 'Enhanced PropFinder-Style Dashboard',
            description: 'Complete PropFinder interface parity with virtual scrolling for 10,000+ props and React 19 concurrent features',
            impact: 'high',
          },
          {
            version: '8.0.0',
            date: '2025-01-20',
            type: 'major',
            category: 'added',
            title: 'Statistical Analysis Suite',
            description: '6 analysis types including Bayesian modeling, neural networks, and ensemble methods with real-time computation',
            impact: 'medium',
          },
        ],
      },
    ];
  }

  /**
   * Add a new changelog entry
   */
  public addEntry(entry: Omit<ChangelogEntry, 'version' | 'date'>): void {
    const newEntry: ChangelogEntry = {
      ...entry,
      version: this.currentVersion,
      date: new Date().toISOString().split('T')[0],
    };

    // Find or create current version
    let currentVersionInfo = this.versions.find(v => v.version === this.currentVersion);
    if (!currentVersionInfo) {
      currentVersionInfo = {
        version: this.currentVersion,
        releaseDate: new Date().toISOString().split('T')[0],
        status: 'unreleased',
        entries: [],
      };
      this.versions.unshift(currentVersionInfo);
    }

    currentVersionInfo.entries.push(newEntry);
    console.log('[Changelog] Entry added:', newEntry.title);
  }

  /**
   * Get all versions
   */
  public getVersions(): VersionInfo[] {
    return this.versions.sort((a, b) => 
      this.compareVersions(b.version, a.version)
    );
  }

  /**
   * Get specific version
   */
  public getVersion(version: string): VersionInfo | undefined {
    return this.versions.find(v => v.version === version);
  }

  /**
   * Get current unreleased changes
   */
  public getUnreleasedChanges(): ChangelogEntry[] {
    const unreleased = this.versions.find(v => v.status === 'unreleased');
    return unreleased?.entries || [];
  }

  /**
   * Get transparency-related changes
   */
  public getTransparencyChanges(): ChangelogEntry[] {
    return this.versions
      .flatMap(v => v.entries)
      .filter(entry => entry.transparency === true);
  }

  /**
   * Release current version
   */
  public releaseVersion(version?: string): void {
    const versionToRelease = version || this.currentVersion;
    const versionInfo = this.versions.find(v => v.version === versionToRelease);
    
    if (versionInfo) {
      versionInfo.status = 'stable';
      versionInfo.releaseDate = new Date().toISOString().split('T')[0];
      
      // Increment version for next development
      this.currentVersion = this.incrementVersion(this.currentVersion);
      
      console.log(`[Changelog] Version ${versionToRelease} released`);
    }
  }

  /**
   * Generate markdown changelog
   */
  public generateMarkdown(): string {
    let markdown = `# Changelog

All notable changes to the A1Betting PropFinder-Killer platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

${this.getUnreleasedChanges().length === 0 ? 
  'No unreleased changes.' : 
  this.formatEntriesMarkdown(this.getUnreleasedChanges())
}

`;

    // Add released versions
    this.getVersions()
      .filter(v => v.status === 'stable')
      .forEach(version => {
        markdown += `## [${version.version}] - ${version.releaseDate}

${this.formatEntriesMarkdown(version.entries)}

`;
      });

    return markdown;
  }

  /**
   * Generate transparency report
   */
  public generateTransparencyReport(): string {
    const transparencyChanges = this.getTransparencyChanges();
    
    return `# Transparency Changelog

This report documents all transparency-related changes made to ensure honest representation of A1Betting's capabilities.

## Transparency Updates

${transparencyChanges.length === 0 ? 
  'No transparency updates recorded.' :
  transparencyChanges.map(entry => `
### ${entry.title} (v${entry.version})
- **Date**: ${entry.date}
- **Impact**: ${entry.impact}
- **Description**: ${entry.description}
`).join('\n')
}

## Commitment to Transparency

A1Betting is committed to accurate representation of its capabilities. All features are described using precise technical terminology, and any marketing claims are backed by verifiable implementation details.
`;
  }

  /**
   * Format entries as markdown
   */
  private formatEntriesMarkdown(entries: ChangelogEntry[]): string {
    const grouped = this.groupByCategory(entries);
    let markdown = '';

    Object.entries(grouped).forEach(([category, categoryEntries]) => {
      if (categoryEntries.length === 0) return;
      
      const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
      markdown += `### ${this.getCategoryEmoji(category)} ${categoryTitle}\n\n`;
      
      categoryEntries.forEach(entry => {
        const impactBadge = this.getImpactBadge(entry.impact);
        const transparencyBadge = entry.transparency ? ' 🔍 TRANSPARENCY' : '';
        
        markdown += `- **${entry.title}**${impactBadge}${transparencyBadge}: ${entry.description}\n`;
      });
      
      markdown += '\n';
    });

    return markdown;
  }

  /**
   * Group entries by category
   */
  private groupByCategory(entries: ChangelogEntry[]): Record<string, ChangelogEntry[]> {
    return entries.reduce((acc, entry) => {
      if (!acc[entry.category]) acc[entry.category] = [];
      acc[entry.category].push(entry);
      return acc;
    }, {} as Record<string, ChangelogEntry[]>);
  }

  /**
   * Get category emoji
   */
  private getCategoryEmoji(category: string): string {
    const emojis: Record<string, string> = {
      added: '🚀',
      changed: '⚡',
      deprecated: '⚠️',
      removed: '🗑️',
      fixed: '🐞',
      security: '🔒',
    };
    return emojis[category] || '📝';
  }

  /**
   * Get impact badge
   */
  private getImpactBadge(impact: string): string {
    const badges: Record<string, string> = {
      critical: ' 🔴 CRITICAL',
      high: ' 🟠 HIGH',
      medium: ' 🟡 MEDIUM',
      low: ' 🟢 LOW',
    };
    return badges[impact] || '';
  }

  /**
   * Compare version strings
   */
  private compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;
      
      if (aPart > bPart) return 1;
      if (aPart < bPart) return -1;
    }
    
    return 0;
  }

  /**
   * Increment version number
   */
  private incrementVersion(version: string): string {
    const parts = version.split('.').map(Number);
    parts[2]++; // Increment patch version
    return parts.join('.');
  }

  /**
   * Get development status
   */
  public getStatus(): {
    currentVersion: string;
    unreleasedCount: number;
    transparencyCount: number;
    lastRelease: string;
  } {
    const unreleased = this.getUnreleasedChanges();
    const transparency = this.getTransparencyChanges();
    const lastStable = this.versions.find(v => v.status === 'stable');

    return {
      currentVersion: this.currentVersion,
      unreleasedCount: unreleased.length,
      transparencyCount: transparency.length,
      lastRelease: lastStable?.version || 'None',
    };
  }
}

// Export singleton instance
export const changelogService = new ChangelogService();

// Export types
export type { ChangelogEntry, VersionInfo };
