/**
 * Unified API Configuration
 * Centralizes API base URL and WebSocket URL configuration with environment variable support
 */

import { getEnvVar } from '../bootstrap/getEnv';

// API Base URL configuration
export const API_BASE_URL = getEnvVar('VITE_API_BASE_URL', 'http://localhost:8000') as string;

// WebSocket URL configuration with protocol derivation
const deriveWSUrl = (apiBaseUrl: string): string => {
  const wsUrl = getEnvVar('VITE_WS_URL');
  if (wsUrl) return wsUrl;
  
  // Derive WebSocket URL from API base URL
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return apiBaseUrl.replace(/^https?/, protocol) + "/ws";
};

export const WS_URL = deriveWSUrl(API_BASE_URL);

// Export individual components for backward compatibility
export const WS_BASE_URL = WS_URL.replace("/ws", "");

// Development configuration
export const DEV_CONFIG = {
  API_BASE_URL,
  WS_URL,
  WS_BASE_URL,
  IS_DEVELOPMENT: Boolean(getEnvVar('DEV') || getEnvVar('VITE_DEV') || false),
  IS_PRODUCTION: Boolean(getEnvVar('PROD') || getEnvVar('VITE_PROD') || false),
} as const;