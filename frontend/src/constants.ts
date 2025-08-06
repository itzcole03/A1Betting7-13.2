// Centralized environment variable access with Jest compatibility
// This file provides a safe way to access Vite environment variables in both Vite and Jest environments

// Environment variable defaults for testing
const defaultValues = {
  VITE_API_URL: 'http://localhost:8000',
  VITE_WS_ENDPOINT: 'ws://localhost:8000/ws',
  VITE_WS_URL: 'ws://localhost:8000/ws',
  VITE_THEODDS_API_KEY: undefined,
  VITE_SPORTRADAR_API_KEY: undefined,
  VITE_DAILYFANTASY_API_KEY: undefined,
  VITE_PRIZEPICKS_API_KEY: undefined,
  VITE_PRIZEPICKS_API_URL: undefined,
  VITE_SENTIMENT_API_URL: undefined,
  VITE_SENTIMENT_API_KEY: undefined,
  VITE_ENABLE_SENTIMENT: undefined,
  VITE_DISABLE_SOCIAL_SENTIMENT: undefined,
  VITE_SPORTRADAR_API_ENDPOINT: undefined,
  VITE_ODDS_API_ENDPOINT: undefined,
  VITE_ESPN_API_ENDPOINT: undefined,
  VITE_SOCIAL_API_ENDPOINT: undefined,
} as const;

// Function to get environment variables safely
const getEnvVar = (key: keyof typeof defaultValues): string | undefined => {
  // Check if we're in a test environment (Jest)
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return defaultValues[key];
  }

  // Use import.meta.env for Vite environments, fallback to defaults
  if (process.env.NODE_ENV === 'test') {
    // In Jest test environment, use process.env
    return process.env[key] || defaultValues[key];
  }

  // In Vite environment, try to access import.meta.env
  try {
    // Use dynamic evaluation to avoid Jest parsing issues
    const importMeta = new Function('return import.meta')();
    if (importMeta && importMeta.env) {
      return importMeta.env[key] || defaultValues[key];
    }
  } catch (e) {
    // Fallback if import.meta is not available
  }

  // Fallback for environments where import.meta might not be available
  return defaultValues[key];
};

export const VITE_API_URL = getEnvVar('VITE_API_URL')!;
export const VITE_WS_ENDPOINT = getEnvVar('VITE_WS_ENDPOINT')!;
export const VITE_WS_URL = getEnvVar('VITE_WS_URL')!;
export const VITE_THEODDS_API_KEY = getEnvVar('VITE_THEODDS_API_KEY');
export const VITE_SPORTRADAR_API_KEY = getEnvVar('VITE_SPORTRADAR_API_KEY');
export const VITE_DAILYFANTASY_API_KEY = getEnvVar('VITE_DAILYFANTASY_API_KEY');
export const VITE_PRIZEPICKS_API_KEY = getEnvVar('VITE_PRIZEPICKS_API_KEY');
export const VITE_PRIZEPICKS_API_URL = getEnvVar('VITE_PRIZEPICKS_API_URL');
export const VITE_SENTIMENT_API_URL = getEnvVar('VITE_SENTIMENT_API_URL');
export const VITE_SENTIMENT_API_KEY = getEnvVar('VITE_SENTIMENT_API_KEY');
export const VITE_ENABLE_SENTIMENT = getEnvVar('VITE_ENABLE_SENTIMENT');
export const VITE_DISABLE_SOCIAL_SENTIMENT = getEnvVar('VITE_DISABLE_SOCIAL_SENTIMENT');
export const VITE_SPORTRADAR_API_ENDPOINT = getEnvVar('VITE_SPORTRADAR_API_ENDPOINT');
export const VITE_ODDS_API_ENDPOINT = getEnvVar('VITE_ODDS_API_ENDPOINT');
export const VITE_ESPN_API_ENDPOINT = getEnvVar('VITE_ESPN_API_ENDPOINT');
export const VITE_SOCIAL_API_ENDPOINT = getEnvVar('VITE_SOCIAL_API_ENDPOINT');
