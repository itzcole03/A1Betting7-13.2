import { logger as utilsLogger } from '../../utils/logger';
import canonicalDefault, { logger as canonicalLogger } from '../logging/logger';
import unifiedLoggerDefault, {
  logger as coreLogger,
  UnifiedLogger as coreUnifiedLogger,
  getInstance,
  getLogger,
  setLevel,
} from '../UnifiedLogger';

describe('UnifiedLogger facade', () => {
  it('aliases the canonical logger across import paths', () => {
    expect(coreUnifiedLogger).toBe(canonicalLogger);
    expect(coreLogger).toBe(canonicalLogger);
    expect(unifiedLoggerDefault).toBe(canonicalLogger);
    expect(utilsLogger).toBe(canonicalLogger);
    expect(getInstance()).toBe(canonicalLogger);

    const attachedGetInstance = (
      coreUnifiedLogger as typeof coreUnifiedLogger & {
        getInstance?: () => typeof canonicalLogger;
      }
    ).getInstance;

    expect(attachedGetInstance?.()).toBe(canonicalLogger);
    expect(canonicalDefault).toBe(canonicalLogger);
  });

  it('scoped loggers emit records with the scoped context', () => {
    const transport = {
      name: `jest_${Date.now()}`,
      write: jest.fn(),
    };

    canonicalLogger.addTransport(transport);

    try {
      const scoped = getLogger('test/component');
      scoped.info('hello world', { foo: 'bar' });

      expect(transport.write).toHaveBeenCalledTimes(1);
      const record = transport.write.mock.calls[0][0];
      expect(record.context).toBe('test/component');
      expect(record.message).toBe('hello world');
      expect(record.data).toEqual({ foo: 'bar' });
    } finally {
      canonicalLogger.removeTransport(transport.name);
    }
  });

  it('setLevel adjusts the console transport threshold and preserves scoped context in output', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      setLevel('warn');
      warnSpy.mockClear();
      errorSpy.mockClear();

      const scoped = getLogger('test/threshold');
      scoped.debug('debug hidden');
      scoped.info('info hidden');
      scoped.warn('warn visible', { flag: true });
      scoped.error('error visible');

      expect(debugSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();

      expect(warnSpy).toHaveBeenCalled();
      const [warnMessage] = warnSpy.mock.calls[0] ?? [];
      expect(typeof warnMessage).toBe('string');
      expect(warnMessage).toEqual(expect.stringContaining('[test/threshold]'));

      expect(errorSpy).toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = originalEnv;
      setLevel('debug');
      debugSpy.mockRestore();
      infoSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });
});
