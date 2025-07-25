import React, { ReactNode, createContext, useContext } from 'react';

/**
 * LoggerContextType
 * Provides unified logging utilities for the app.
 * @property {any} logger - Logger instance
 * @property {(msg: string, level?: LoggerLevel) => void} log - Log a message
 */
export type LoggerLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';
export interface LoggerContextType {
  logger: unknown;
  log: (msg: string, level?: LoggerLevel) => void;
}

const _LoggerContext = createContext<LoggerContextType | undefined>(undefined);

// Simple logger implementation (replace with real logger as needed)
const _logger = {
  log: (msg: string, level: LoggerLevel = 'info') => {
    switch (level) {
      case 'log':
        console.log(msg);
        break;
      case 'info':
        console.info(msg);
        break;
      case 'warn':
        console.warn(msg);
        break;
      case 'error':
        console.error(msg);
        break;
      case 'debug':
        console.debug(msg);
        break;
      default:
        console.log(msg);
    }
  },
};

/**
 * LoggerProvider
 * Wrap your app with this provider to enable logging utilities.
 * @param {ReactNode} children
 */
export const _LoggerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const _log = (msg: string, level: LoggerLevel = 'info') => _logger.log(msg, level);
  // Removed unused @ts-expect-error: JSX is supported in this environment
  return (
    <_LoggerContext.Provider value={{ logger: _logger, log: _log }}>
      {children}
    </_LoggerContext.Provider>
  );
};

/**
 * useLogger
 * Access the logger context in any component.
 */
export const _useLogger = () => {
  const _ctx = useContext(_LoggerContext);
  if (!_ctx) throw new Error('useLogger must be used within LoggerProvider');
  return _ctx;
};
