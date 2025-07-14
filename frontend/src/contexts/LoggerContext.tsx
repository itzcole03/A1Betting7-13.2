import React, { ReactNode, createContext, useContext } from 'react';

/**
 * LoggerContextType
 * Provides unified logging utilities for the app.
 * @property {any} logger - Logger instance
 * @property {(msg: string, level?: LoggerLevel) => void} log - Log a message
 */
export type LoggerLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';
export interface LoggerContextType {
  logger: any;
  log: (msg: string, level?: LoggerLevel) => void;
}

const LoggerContext = createContext<LoggerContextType | undefined>(undefined);

// Simple logger implementation (replace with real logger as needed)
const logger = {
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
export const LoggerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const log = (msg: string, level: LoggerLevel = 'info') => logger.log(msg, level);
  return <LoggerContext.Provider value={{ logger, log }}>{children}</LoggerContext.Provider>;
};

/**
 * useLogger
 * Access the logger context in any component.
 */
export const useLogger = () => {
  const ctx = useContext(LoggerContext);
  if (!ctx) throw new Error('useLogger must be used within LoggerProvider');
  return ctx;
};
