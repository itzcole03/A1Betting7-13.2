import type { UserContext } from '../utils/FeatureFlags';
import { FeatureFlags } from '../utils/FeatureFlags';

const featureFlagManager = FeatureFlags.getInstance();

void featureFlagManager.initialize().catch(error => {
  console.error('Failed to initialize feature flags', error);
});

export const isFeatureEnabled = async (
  featureId: string,
  context?: UserContext
): Promise<boolean> => {
  try {
    await featureFlagManager.initialize();
    return featureFlagManager.isFeatureEnabled(featureId, context);
  } catch (error) {
    console.error(`Error checking feature flag ${featureId}:`, error);
    return false;
  }
};

export const getAllFeatures = async (): Promise<Record<string, boolean>> => {
  try {
    await featureFlagManager.initialize();
    const featureIds = ['INJURIES', 'NEWS', 'WEATHER', 'REALTIME', 'ESPN', 'ODDS', 'ANALYTICS'];

    const entries = featureIds.map(
      featureId => [featureId, featureFlagManager.isFeatureEnabled(featureId)] as const
    );

    return Object.fromEntries(entries);
  } catch (error) {
    console.error('Error getting all features:', error);
    return {};
  }
};

export const configService = {
  isFeatureEnabled,
  getAllFeatures,
  features: {
    INJURIES: true,
    NEWS: true,
    WEATHER: true,
    REALTIME: true,
    ESPN: true,
    ODDS: true,
    ANALYTICS: true,
  },
};

export default configService;
