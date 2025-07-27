// Centralized Vite env access for Jest compatibility
// Add all VITE_ env variables used in the codebase here

export const VITE_API_URL = process.env.VITE_API_URL || 'http://localhost:8000';
export const VITE_WS_ENDPOINT = process.env.VITE_WS_ENDPOINT || 'ws://localhost:8000/ws';
export const VITE_WS_URL = process.env.VITE_WS_URL || 'ws://localhost:8000/ws';
export const VITE_THEODDS_API_KEY = process.env.VITE_THEODDS_API_KEY;
export const VITE_SPORTRADAR_API_KEY = process.env.VITE_SPORTRADAR_API_KEY;
export const VITE_DAILYFANTASY_API_KEY = process.env.VITE_DAILYFANTASY_API_KEY;
export const VITE_PRIZEPICKS_API_KEY = process.env.VITE_PRIZEPICKS_API_KEY;
export const VITE_PRIZEPICKS_API_URL = process.env.VITE_PRIZEPICKS_API_URL;
export const VITE_SENTIMENT_API_URL = process.env.VITE_SENTIMENT_API_URL;
export const VITE_SENTIMENT_API_KEY = process.env.VITE_SENTIMENT_API_KEY;
export const VITE_ENABLE_SENTIMENT = process.env.VITE_ENABLE_SENTIMENT;
export const VITE_DISABLE_SOCIAL_SENTIMENT = process.env.VITE_DISABLE_SOCIAL_SENTIMENT;
export const VITE_SPORTRADAR_API_ENDPOINT = process.env.VITE_SPORTRADAR_API_ENDPOINT;
export const VITE_ODDS_API_ENDPOINT = process.env.VITE_ODDS_API_ENDPOINT;
export const VITE_ESPN_API_ENDPOINT = process.env.VITE_ESPN_API_ENDPOINT;
export const VITE_SOCIAL_API_ENDPOINT = process.env.VITE_SOCIAL_API_ENDPOINT;
