/**
 * Core runtime surface for admin/diagnostics utilities.
 *
 * The exports collected here must remain lightweight and safe for eager import
 * by feature code. Heavier developer-only modules should remain lazily
 * imported from their respective entry points instead of being exposed via
 * this facade.
 */

import type {
  FeatureComponentContract,
  FeatureComponentProps,
  FeatureComponentRenderArgs,
  FeatureCompositionComponent,
} from './FeatureComponent';
import { FeatureComponent } from './FeatureComponent';
import type { MasterIntegrationContextValue } from './MasterIntegrationHub';
import { MasterIntegrationProvider, useMasterIntegration } from './MasterIntegrationHub';
import { UnifiedMonitor } from './UnifiedMonitor';

/**
 * Minimal event type contract preserved for legacy EventBus consumers.
 */
export interface EventTypes {
  [event: string]: unknown;
}

/**
 * Structured listing of the stable runtime surfaces we intentionally expose.
 * Keeps bundle consumers aware of the supported contract without resorting to
 * `Object.keys(require('core'))` style reflection.
 */
export const coreManifest = Object.freeze({
  version: '2025.10.04',
  surfaces: Object.freeze({
    featureBoundary: 'FeatureComponent',
    adminIntegration: 'MasterIntegrationProvider',
    metrics: 'UnifiedMonitor',
  }),
});

export type CoreManifest = typeof coreManifest;

// Re-export selected stable surfaces for downstream modules.
export { FeatureComponent, MasterIntegrationProvider, UnifiedMonitor, useMasterIntegration };

export type {
  FeatureComponentContract,
  FeatureComponentProps,
  FeatureComponentRenderArgs,
  FeatureCompositionComponent,
  MasterIntegrationContextValue,
};
