export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  child?: (sub: string) => Logger;
}

// Single canonical implementation
function makeLogger(component = 'app'): Logger {
  const fmt = (level: LogLevel, args: any[]) => {
    const ts = new Date().toISOString();
    const payload = { ts, component, level, msg: args[0], meta: args.slice(1) };
    try {
      const str = typeof JSON !== 'undefined' ? JSON.stringify(payload) : String(payload);
      if (level === 'error') console.error(str);
      else if (level === 'warn') console.warn(str);
      else if (level === 'debug') (console.debug || console.log)(str);
      else console.log(str);
    } catch (e) {
      console.log(component, level, ...args);
    }
  };

  return {
    debug: (...args: any[]) => fmt('debug', args),
    info: (...args: any[]) => fmt('info', args),
    warn: (...args: any[]) => fmt('warn', args),
    error: (...args: any[]) => fmt('error', args),
    child: (sub: string) => makeLogger(`${component}/${sub}`),
  };
}

export function getLogger(component = 'app'): Logger {
  return makeLogger(component);
}

export function setLogLevel(_level: LogLevel) {
  // No-op shim
}

export default getLogger;
