jest.mock('../../utils/FeatureFlags', () => {
  const baseFeature = {
    id: 'test-feature',
    name: 'Test Feature',
    description: 'Test feature for gating',
    enabled: true,
    rolloutPercentage: 100,
    dependencies: [] as string[],
    tags: [] as string[],
    metadata: {},
  };

  let enabled = true;

  const instance = {
    isFeatureEnabled: jest.fn(() => enabled),
    getFeature: jest.fn(() => ({ ...baseFeature, enabled })),
    initialize: jest.fn(() => Promise.resolve()),
  };

  class MockFeatureFlags {
    public static getInstance() {
      return instance;
    }
  }

  return {
    __esModule: true,
    default: MockFeatureFlags,
    FeatureFlags: MockFeatureFlags,
    __setEnabled: (value: boolean) => {
      enabled = value;
    },
    __reset: () => {
      enabled = true;
      instance.isFeatureEnabled.mockClear();
      instance.getFeature.mockClear();
      instance.initialize.mockClear();
    },
    __instance: instance,
  };
});

jest.mock('../UnifiedMonitor', () => {
  const instance = {
    recordMetric: jest.fn(),
    getMetricsSnapshot: jest.fn(() => []),
    startTrace: jest.fn(() => 'trace'),
    endTrace: jest.fn(),
    clearMetrics: jest.fn(),
  };

  class MockUnifiedMonitor {
    public static getInstance() {
      return instance;
    }
  }

  return {
    UnifiedMonitor: MockUnifiedMonitor,
    __instance: instance,
  };
});

import { render, screen, waitFor } from '@testing-library/react';

import FeatureComponent from '../FeatureComponent';

const featureFlagsMock = jest.requireMock('../../utils/FeatureFlags');
const monitorMock = jest.requireMock('../UnifiedMonitor');

describe('FeatureComponent', () => {
  beforeEach(() => {
    featureFlagsMock.__reset();
    featureFlagsMock.__setEnabled(true);
    monitorMock.__instance.recordMetric.mockClear();
  });

  it('renders children when feature is enabled', async () => {
    render(
      <FeatureComponent featureId='test-feature' data-testid='feature-wrapper'>
        <span>Enabled content</span>
      </FeatureComponent>
    );

    const wrapper = await screen.findByTestId('feature-wrapper');
    expect(wrapper).toHaveAttribute('data-feature-enabled', 'true');
    expect(wrapper).toHaveAttribute('aria-disabled', 'false');
    expect(screen.getByText('Enabled content')).toBeInTheDocument();
  });

  it('renders fallback and marks element disabled when feature is disabled', async () => {
    featureFlagsMock.__setEnabled(false);

    render(
      <FeatureComponent
        featureId='test-feature'
        data-testid='feature-wrapper'
        fallback={<span data-testid='fallback'>Fallback</span>}
      >
        <span>Enabled content</span>
      </FeatureComponent>
    );

    const wrapper = await screen.findByTestId('feature-wrapper');
    expect(wrapper).toHaveAttribute('data-feature-enabled', 'false');
    expect(wrapper).toHaveAttribute('aria-disabled', 'true');
    expect(wrapper).not.toHaveAttribute('hidden');
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });

  it('hides wrapper when disabled and no fallback provided', async () => {
    featureFlagsMock.__setEnabled(false);

    render(
      <FeatureComponent featureId='test-feature' data-testid='feature-wrapper'>
        <span>Enabled content</span>
      </FeatureComponent>
    );

    const wrapper = await screen.findByTestId('feature-wrapper');
    await waitFor(() => expect(wrapper).toHaveAttribute('data-feature-enabled', 'false'));
    expect(wrapper).toHaveAttribute('hidden');
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByText('Enabled content')).not.toBeInTheDocument();
  });
});
