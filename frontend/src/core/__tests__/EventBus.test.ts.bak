import { EventBus } from '../EventBus';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = EventBus.getInstance();
    bus.reset();
  });

  it('invokes remaining handlers even when one throws', () => {
    const first = jest.fn(() => {
      throw new Error('boom');
    });
    const second = jest.fn();

    bus.on('test', first);
    bus.on('test', second);

    expect(() => bus.emit('test', 42)).not.toThrow();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('allows handlers to unsubscribe via disposer', () => {
    const handler = jest.fn();
    const dispose = bus.on('test', handler);

    dispose();

    bus.emit('test', 'payload');

    expect(handler).not.toHaveBeenCalled();
    expect(bus.listenerCount('test')).toBe(0);
  });

  it('removes handlers when abort signal fires', () => {
    const handler = jest.fn();
    const controller = new AbortController();

    bus.on('test', handler, { signal: controller.signal });
    controller.abort();

    bus.emit('test');

    expect(handler).not.toHaveBeenCalled();
    expect(bus.listenerCount('test')).toBe(0);
  });

  it('supports once option for single invocation', () => {
    const handler = jest.fn();

    bus.on('test', handler, { once: true });

    bus.emit('test');
    bus.emit('test');

    expect(handler).toHaveBeenCalledTimes(1);
    expect(bus.listenerCount('test')).toBe(0);
  });

  it('cleans up handlers via cleanup call', () => {
    const handler = jest.fn();

    bus.on('test', handler);
    bus.cleanup('test');

    expect(bus.listenerCount('test')).toBe(0);

    bus.emit('test');

    expect(handler).not.toHaveBeenCalled();
  });

  it('awaits async handlers in emitAsync', async () => {
    const sequence: string[] = [];

    bus.on('test', async () => {
      sequence.push('async');
    });

    await expect(bus.emitAsync('test')).resolves.toBeUndefined();
    expect(sequence).toEqual(['async']);
  });
});
