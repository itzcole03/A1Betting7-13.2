import { cleanup, render, screen, waitFor } from '@testing-library/react';

import { masterServiceRegistry } from '../../services/MasterServiceRegistry';
import FeatureComponent from '../FeatureComponent.impl';
import {
  ensureFeatureFlagServiceRegistered,
  getFeatureFlagService,
  initializeFeatureFlags,
  type FeatureFlagService,
} from '../FeatureFlags';

const createUniqueFeatureId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2)}`;

describe('FeatureFlags runtime', () => {
  beforeEach(async () => {
    ensureFeatureFlagServiceRegistered();
    await initializeFeatureFlags().catch(() => {});
  });

  afterEach(() => {
    cleanup();
  });

  it('registers itself with the MasterServiceRegistry', () => {
    const service = masterServiceRegistry.getService('featureFlags') as FeatureFlagService | null;
    expect(service).toBeTruthy();
    expect(typeof service?.isFeatureEnabled).toBe('function');
  });

  it('toggles downstream component visibility when a feature flag changes', async () => {
    const service = getFeatureFlagService();
    const featureId = createUniqueFeatureId('feature_component_visibility');

    service.registerFeature({
      id: featureId,
      name: 'Feature Component Visibility',
      description: 'Ensures UI reacts to feature toggles',
      enabled: false,
      rolloutPercentage: 100,
      dependencies: [],
      tags: [],
      metadata: {},
    });

    const baseContext = { userId: 'runtime-user', userGroups: [], attributes: {} };

    const { rerender } = render(
      <FeatureComponent
        featureId={featureId}
        userContext={baseContext}
        autoInitialize={false}
        fallback={<span data-testid='fallback'>fallback</span>}
      >
        <span data-testid='content'>feature-on</span>
      </FeatureComponent>
    );

    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();

    service.updateFeature(featureId, { enabled: true });

    const refreshedContext = {
      ...baseContext,
      attributes: { ...baseContext.attributes, revision: Date.now() },
    };

    rerender(
      <FeatureComponent
        featureId={featureId}
        userContext={refreshedContext}
        autoInitialize={false}
        fallback={<span data-testid='fallback'>fallback</span>}
      >
        <span data-testid='content'>feature-on</span>
      </FeatureComponent>
    );

    await waitFor(() => expect(screen.getByTestId('content')).toBeInTheDocument());
    expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();
  });

  it('notifies subscribers when feature flags change', () => {
    const service = getFeatureFlagService();
    const featureId = createUniqueFeatureId('feature_subscription');

    service.registerFeature({
      id: featureId,
      name: 'Subscription Feature',
      description: 'Validates change notification hooks',
      enabled: false,
      rolloutPercentage: 100,
      dependencies: [],
      tags: [],
      metadata: {},
    });

    const events: Array<{ id: string; enabled: boolean }> = [];

    const unsubscribe = service.subscribe(
      featureId,
      event => {
        events.push({ enabled: event.enabled, id: event.featureId });
      },
      { emitCurrentValue: false }
    );

    service.updateFeature(featureId, { enabled: true });
    service.updateFeature(featureId, { enabled: false });

    unsubscribe();

    expect(events).toEqual([
      { id: featureId, enabled: true },
      { id: featureId, enabled: false },
    ]);
  });
});
