import { FeatureLoggerConfig } from '@/types.ts';
export declare class FeatureLogger {
  private readonly config;
  constructor(config?: Partial<FeatureLoggerConfig>);
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: any): void;
  debug(message: string, data?: any): void;
  private log;
  private shouldLog;
  private createLogEntry;
  private formatLog;
  private writeLog;
  private writeToConsole;
  private writeToFile;
  getLogLevel(): string;
  setLogLevel(level: FeatureLoggerConfig['logLevel']): void;
  getLogFormat(): string;
  setLogFormat(format: FeatureLoggerConfig['logFormat']): void;
  getLogOutput(): string;
  setLogOutput(output: FeatureLoggerConfig['logOutput']): void;
}
