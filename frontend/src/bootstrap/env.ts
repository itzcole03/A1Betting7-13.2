/**
 * Environment abstraction module for consistent environment detection
 * across the A1Betting platform.
 * 
 * Provides unified environment detection avoiding mismatched logs like
 * "Production Mode" when actually running in development.
 * 
 * @module bootstrap/env
 */

/**
 * Runtime environment information
 */
export interface RuntimeEnv {
  mode: 'development' | 'production' | 'test';
  isDev: boolean;
  isProd: boolean;
  isTest: boolean;
  source: 'vite' | 'node' | 'fallback';
}

/**
 * Get runtime environment information with fallback detection
 * 
 * Priority order:
 * 1. Vite's import.meta.env.MODE (browser/Vite builds)
 * 2. Node.js process.env.NODE_ENV (SSR/Node environments) 
 * 3. Fallback to 'development'
 * 
 * @returns {RuntimeEnv} Complete environment information
 */
export function getRuntimeEnv(): RuntimeEnv {
  let mode: 'development' | 'production' | 'test' = 'development';
  let source: 'vite' | 'node' | 'fallback' = 'fallback';

  // Vite environment (preferred for frontend)
  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE) {
    const viteMode = import.meta.env.MODE;
    if (viteMode === 'production' || viteMode === 'development' || viteMode === 'test') {
      mode = viteMode as 'development' | 'production' | 'test';
      source = 'vite';
    }
  }
  // Node.js environment (fallback)
  else if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'production' || nodeEnv === 'development' || nodeEnv === 'test') {
      mode = nodeEnv as 'development' | 'production' | 'test';
      source = 'node';
    }
  }

  const isDev = mode === 'development';
  const isProd = mode === 'production';
  const isTest = mode === 'test';

  return {
    mode,
    isDev,
    isProd,
    isTest,
    source,
  };
}

/**
 * Convenience function for development environment detection
 * @returns {boolean} True if running in development mode
 */
export function isDev(): boolean {
  return getRuntimeEnv().isDev;
}

/**
 * Convenience function for production environment detection
 * @returns {boolean} True if running in production mode
 */
export function isProd(): boolean {
  return getRuntimeEnv().isProd;
}

/**
 * Convenience function for test environment detection
 * @returns {boolean} True if running in test mode
 */
export function isTest(): boolean {
  return getRuntimeEnv().isTest;
}

/**
 * Get environment mode as string
 * @returns {'development' | 'production' | 'test'} Current environment mode
 */
export function getMode(): 'development' | 'production' | 'test' {
  return getRuntimeEnv().mode;
}