/**
 * Unified API Configuration
 * Centralizes API base URL and WebSocket URL configuration with environment variable support
 */

import { getEnvVar } from '../bootstrap/getEnv';

const resolveApiBaseUrl = (): string => {
  const explicit = getEnvVar('VITE_API_BASE_URL');
  if (typeof explicit === 'string' && explicit.trim().length > 0) {
    return explicit.trim();
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    const devPorts = new Set(['5173', '5174', '4173']);
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isLocalHost && devPorts.has(port)) {
      return `${protocol}//${window.location.host}`;
    }
  }

  return 'http://127.0.0.1:8000';
};

// API Base URL configuration
export const API_BASE_URL = resolveApiBaseUrl();

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