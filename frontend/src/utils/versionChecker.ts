/**
 * Frontend Version Coherence System
 * 
 * Shared version constant and runtime compatibility checking
 * for A1Betting7-13.2 frontend-backend coordination.
 */

import React from 'react';

// Shared version constant (must match backend/version_coherence.py)
export const APP_VERSION = "7.13.2";

export interface VersionInfo {
  app: string;
  semantic: {
    major: number;
    minor: number;
    patch: number;
    prerelease?: string;
    build?: string;
  };
  features: string[];
  build: {
    timestamp: string;
    git_commit?: string;
    environment: string;
    node_version?: string;
  };
}

export interface CompatibilityResult {
  compatible: boolean;
  frontend_version: string;
  backend_version?: string;
  issues: string[];
  warnings: string[];
}

class VersionChecker {
  private static instance: VersionChecker;
  private backendVersion?: VersionInfo;
  private compatibilityCache = new Map<string, CompatibilityResult>();
  private logger = {
    info: (message: string) => {
      // eslint-disable-next-line no-console
      console.log(message);
    },
    warn: (message: string) => {
      // eslint-disable-next-line no-console
      console.warn(message);
    },
    error: (message: string) => {
      // eslint-disable-next-line no-console
      console.error(message);
    }
  };

  private constructor() {}

  public static getInstance(): VersionChecker {
    if (!VersionChecker.instance) {
      VersionChecker.instance = new VersionChecker();
    }
    return VersionChecker.instance;
  }

  /**
   * Parse semantic version string into components
   */
  private parseVersion(version: string): VersionInfo['semantic'] {
    const cleanVersion = version.replace(/^v/, '');
    const parts = cleanVersion.split(/[-+]/);
    const prerelease = parts[1];
    const build = parts[2];

    const [major, minor, patch] = parts[0].split('.').map(n => parseInt(n) || 0);

    return {
      major,
      minor,
      patch,
      prerelease,
      build
    };
  }

  /**
   * Compare two semantic versions
   * Returns: -1 (older), 0 (equal), 1 (newer)
   */
  private compareVersions(v1: string, v2: string): number {
    const parsed1 = this.parseVersion(v1);
    const parsed2 = this.parseVersion(v2);

    // Compare major.minor.patch
    const components = ['major', 'minor', 'patch'] as const;
    for (const component of components) {
      if (parsed1[component] > parsed2[component]) return 1;
      if (parsed1[component] < parsed2[component]) return -1;
    }

    // If main versions equal, compare prerelease
    if (!parsed1.prerelease && !parsed2.prerelease) return 0;
    if (!parsed1.prerelease && parsed2.prerelease) return 1;
    if (parsed1.prerelease && !parsed2.prerelease) return -1;
    
    return parsed1.prerelease!.localeCompare(parsed2.prerelease!);
  }

  /**
   * Fetch backend version information
   */
  public async fetchBackendVersion(): Promise<VersionInfo | null> {
    try {
      const response = await fetch('/api/version/info');
      if (!response.ok) {
        this.logger.warn(`Failed to fetch backend version: ${response.status}`);
        return null;
      }

      const data = await response.json();
      if (data.status === 'success' && data.data) {
        this.backendVersion = data.data;
        return data.data;
      }

      this.logger.warn('Invalid backend version response');
      return null;
    } catch (error) {
      this.logger.error(`Error fetching backend version: ${error}`);
      return null;
    }
  }

  /**
   * Check compatibility between frontend and backend versions
   */
  public async checkCompatibility(options?: {
    requireExactMatch?: boolean;
    allowNewerBackend?: boolean;
    features?: string[];
  }): Promise<CompatibilityResult> {
    const cacheKey = JSON.stringify({ APP_VERSION, options });
    if (this.compatibilityCache.has(cacheKey)) {
      return this.compatibilityCache.get(cacheKey)!;
    }

    const result: CompatibilityResult = {
      compatible: true,
      frontend_version: APP_VERSION,
      issues: [],
      warnings: []
    };

    try {
      // Fetch backend version if not cached
      if (!this.backendVersion) {
        await this.fetchBackendVersion();
      }

      if (!this.backendVersion) {
        result.compatible = false;
        result.issues.push('Unable to connect to backend version service');
        return result;
      }

      result.backend_version = this.backendVersion.app;

      const frontendParsed = this.parseVersion(APP_VERSION);
      const backendParsed = this.parseVersion(this.backendVersion.app);

      // Version compatibility checks
      if (options?.requireExactMatch) {
        if (APP_VERSION !== this.backendVersion.app) {
          result.compatible = false;
          result.issues.push(
            `Exact version match required. Frontend: ${APP_VERSION}, Backend: ${this.backendVersion.app}`
          );
        }
      } else {
        // Default compatibility: major version must match
        if (frontendParsed.major !== backendParsed.major) {
          result.compatible = false;
          result.issues.push(
            `Major version mismatch. Frontend: ${frontendParsed.major}.x.x, Backend: ${backendParsed.major}.x.x`
          );
        }

        // Check if backend is newer
        const comparison = this.compareVersions(APP_VERSION, this.backendVersion.app);
        if (comparison < 0) {
          if (options?.allowNewerBackend) {
            result.warnings.push(
              `Backend is newer (${this.backendVersion.app}) than frontend (${APP_VERSION}). Some features may be unavailable.`
            );
          } else {
            result.compatible = false;
            result.issues.push(
              `Backend version (${this.backendVersion.app}) is newer than frontend (${APP_VERSION}). Please update frontend.`
            );
          }
        } else if (comparison > 0) {
          result.warnings.push(
            `Frontend version (${APP_VERSION}) is newer than backend (${this.backendVersion.app}). Some features may not work.`
          );
        }
      }

      // Feature compatibility checks
      if (options?.features) {
        const missingFeatures = options.features.filter(
          feature => !this.backendVersion!.features.includes(feature)
        );

        if (missingFeatures.length > 0) {
          result.compatible = false;
          result.issues.push(
            `Required features not available in backend: ${missingFeatures.join(', ')}`
          );
        }
      }

    } catch (error) {
      result.compatible = false;
      result.issues.push(`Error checking compatibility: ${error}`);
    }

    // Cache result for 5 minutes
    this.compatibilityCache.set(cacheKey, result);
    setTimeout(() => this.compatibilityCache.delete(cacheKey), 5 * 60 * 1000);

    return result;
  }

  /**
   * Get frontend version information
   */
  public getFrontendVersion(): VersionInfo {
    return {
      app: APP_VERSION,
      semantic: this.parseVersion(APP_VERSION),
      features: [
        'websocket_v2',
        'realtime_enhancements', 
        'unified_logging',
        'modular_architecture',
        'virtualization',
        'dark_theme',
        'performance_monitoring'
      ],
      build: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        node_version: process.env.NODE_VERSION,
      }
    };
  }

  /**
   * Initialize version checking on app startup
   */
  public async initialize(): Promise<CompatibilityResult> {
    this.logger.info(`🚀 A1Betting Frontend v${APP_VERSION} initializing...`);

    const compatibility = await this.checkCompatibility({
      allowNewerBackend: true,
      features: ['websocket_v2', 'unified_logging']
    });

    if (compatibility.compatible) {
      this.logger.info(
        `✅ Version compatibility verified - Frontend: ${compatibility.frontend_version}, Backend: ${compatibility.backend_version}`
      );
      
      if (compatibility.warnings.length > 0) {
        compatibility.warnings.forEach(warning => this.logger.warn(`⚠️ ${warning}`));
      }
    } else {
      this.logger.error('❌ Version compatibility check failed:');
      compatibility.issues.forEach(issue => this.logger.error(`  - ${issue}`));
      
      // Show user-friendly error message
      this.showVersionError(compatibility);
    }

    return compatibility;
  }

  /**
   * Show user-friendly version error message
   */
  private showVersionError(compatibility: CompatibilityResult): void {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      color: white;
      padding: 16px;
      z-index: 9999;
      text-align: center;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    `;

    errorDiv.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto;">
        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
          ⚠️ Version Compatibility Issue
        </h3>
        <p style="margin: 0 0 12px 0; opacity: 0.9;">
          Frontend (${compatibility.frontend_version}) and backend (${compatibility.backend_version || 'unknown'}) versions are incompatible.
        </p>
        <details style="text-align: left; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 6px; margin-top: 12px;">
          <summary style="cursor: pointer; font-weight: 500; margin-bottom: 8px;">Technical Details</summary>
          <ul style="margin: 0; padding-left: 20px;">
            ${compatibility.issues.map(issue => `<li>${issue}</li>`).join('')}
          </ul>
        </details>
      </div>
    `;

    document.body.insertBefore(errorDiv, document.body.firstChild);
  }

  /**
   * Check if a specific feature is available
   */
  public async isFeatureAvailable(feature: string): Promise<boolean> {
    if (!this.backendVersion) {
      await this.fetchBackendVersion();
    }

    return this.backendVersion?.features.includes(feature) || false;
  }

  /**
   * Get runtime version report for debugging
   */
  public async getVersionReport(): Promise<{
    frontend: VersionInfo;
    backend?: VersionInfo;
    compatibility: CompatibilityResult;
  }> {
    const compatibility = await this.checkCompatibility();

    return {
      frontend: this.getFrontendVersion(),
      backend: this.backendVersion,
      compatibility
    };
  }
}

// Export singleton instance
export const versionChecker = VersionChecker.getInstance();

// React hook for version checking in components
export function useVersionCheck() {
  const [compatibility, setCompatibility] = React.useState<CompatibilityResult | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    versionChecker.checkCompatibility().then(result => {
      setCompatibility(result);
      setLoading(false);
    });
  }, []);

  return {
    compatibility,
    loading,
    isCompatible: compatibility?.compatible || false,
    refresh: () => {
      setLoading(true);
      versionChecker.checkCompatibility().then(result => {
        setCompatibility(result);
        setLoading(false);
      });
    }
  };
}

// Auto-initialize on import in browser environment
if (typeof window !== 'undefined') {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      versionChecker.initialize().catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Version checker initialization failed:', error);
      });
    });
  } else {
    versionChecker.initialize().catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Version checker initialization failed:', error);
    });
  }
}