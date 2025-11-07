import type { LogRecord, LogTransport } from '../logger';
import { Logger, createNoopTransport, logger as sharedLogger } from '../logger';

describe('core/logging/logger', () => {
  const fixedDate = new Date('2025-01-01T00:00:00.000Z');
  const clock = () => fixedDate;

  function createMemoryTransport(name = 'memory'): {
    transport: LogTransport;
    records: LogRecord[];
  } {
    const records: LogRecord[] = [];
    const transport: LogTransport = {
      name,
      write: (record: LogRecord) => {
        records.push(record);
      },
    };

    return { transport, records };
  }

  it('serializes data and errors for transports', () => {
    const { transport, records } = createMemoryTransport();
    const testLogger = new Logger([transport], { clock });
    const error = new Error('boom');

    testLogger.error('Failure while processing request', error, 'Pipeline');

    expect(records).toHaveLength(1);
    const [record] = records;
    expect(record.level).toBe('error');
    expect(record.message).toBe('Failure while processing request');
    expect(record.context).toBe('Pipeline');
    expect(record.timestamp).toBe(fixedDate);
    expect(record.data).toBeUndefined();
    expect(record.error).toMatchObject({ name: 'Error', message: 'boom' });
  });

  it('handles circular metadata structures gracefully', () => {
    const { transport, records } = createMemoryTransport('circular');
    const testLogger = new Logger([transport], { clock });

    const payload: Record<string, unknown> & { self?: unknown } = { foo: 'bar' };
    payload.self = payload;

    testLogger.info('Serializing circular payload', payload, 'Serializer');

    expect(records).toHaveLength(1);
    const [record] = records;
    expect(record.level).toBe('info');
    expect(record.data).toEqual({ foo: 'bar', self: '[Circular]' });
  });

  it('composes contexts for child loggers', () => {
    const { transport, records } = createMemoryTransport('child');
    const parentLogger = new Logger([transport], { clock, defaultContext: 'Parent' });
    const childLogger = parentLogger.child('Child');

    childLogger.debug('child message');

    expect(records).toHaveLength(1);
    const [record] = records;
    expect(record.context).toBe('Parent/Child');
    expect(record.level).toBe('debug');
  });

  it('allows transports to be removed at runtime', () => {
    const { transport, records } = createMemoryTransport('remove');
    const testLogger = new Logger([transport, createNoopTransport()], { clock });

    expect(testLogger.removeTransport('remove')).toBe(true);
    testLogger.info('Should not be captured');

    expect(records).toHaveLength(0);
  });

  it('exposes default console and noop transports on shared logger', () => {
    const transportNames = sharedLogger.getTransports().map(transport => transport.name);
    expect(transportNames).toEqual(expect.arrayContaining(['console', 'noop']));
  });
});
