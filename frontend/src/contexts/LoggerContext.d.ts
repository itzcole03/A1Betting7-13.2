/**
 * LoggerContextType
 * Provides unified logging utilities for the app.
 */
export interface LoggerContextType {
  logger: any;
  log: (msg: string, level?: string) => void;
}

export {};
