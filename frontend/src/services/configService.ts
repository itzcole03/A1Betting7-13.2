import { FeatureFlags } from '../utils/FeatureFlags';

// Initialize the feature flag manager
const _featureFlagManager = FeatureFlags.getInstance();

// Initialize feature flags (this could be done elsewhere in the app startup)
featureFlagManager.initialize().catch(console.error);

/**
 * Check if a feature is enabled
 * @param featureId - The feature identifier to check
 * @param context - Optional user context for feature flag evaluation
 * @returns Promise<boolean> - Whether the feature is enabled
 */
export const _isFeatureEnabled = async (featureId: string, context?: unknown): Promise<boolean> => {
  try {
    // Ensure feature flags are initialized
    await featureFlagManager.initialize();

    // Use the feature flag manager to check if feature is enabled
    return featureFlagManager.isFeatureEnabled(featureId, context);
  } catch (error) {
    console.error(`Error checking feature flag ${featureId}:`, error);
    // Return false by default if there's an error
    return false;
  }
};

/**
 * Get all feature flags status
 * @returns Promise<Record<string, boolean>> - Object with feature status
 */
export const _getAllFeatures = async (): Promise<Record<string, boolean>> => {
  try {
    await featureFlagManager.initialize();
    const _features = ['INJURIES', 'NEWS', 'WEATHER', 'REALTIME', 'ESPN', 'ODDS', 'ANALYTICS'];
    const _result: Record<string, boolean> = {};

    for (const _feature of features) {
      result[feature] = featureFlagManager.isFeatureEnabled(feature);
    }

    return result;
  } catch (error) {
    console.error('Error getting all features:', error);
    return {};
  }
};

/**
 * Configuration service for app-wide settings
 */
export const _configService = {
  isFeatureEnabled,
  getAllFeatures,

  // Default feature configurations
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
