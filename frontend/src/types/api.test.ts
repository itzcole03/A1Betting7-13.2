import { describe, expect, it } from 'vitest';
import { WsEvent } from './api';

function getSampleWsSuccess(): WsEvent<{ foo: string }> {
  return {
    success: true,
    data: { foo: 'bar' },
    error: null,
    meta: { event: 'TEST_EVENT', timestamp: '2025-08-12T00:00:00Z' },
    event: 'TEST_EVENT',
  };
}

function getSampleWsError(): WsEvent<null> {
  return {
    success: false,
    data: null,
    error: { code: 'ERR_TEST', message: 'Test error' },
    meta: { event: 'TEST_EVENT', timestamp: '2025-08-12T00:00:00Z' },
    event: 'TEST_EVENT',
  };
}

describe('WsEvent type contract', () => {
  it('accepts valid success event', () => {
    const msg = getSampleWsSuccess();
    expect(msg.success).toBe(true);
    expect(msg.data).toEqual({ foo: 'bar' });
    expect(msg.error).toBeNull();
    expect(msg.meta?.event).toBe('TEST_EVENT');
    expect(msg.event).toBe('TEST_EVENT');
  });

  it('accepts valid error event', () => {
    const msg = getSampleWsError();
    expect(msg.success).toBe(false);
    expect(msg.data).toBeNull();
    expect(msg.error).toEqual({ code: 'ERR_TEST', message: 'Test error' });
    expect(msg.meta?.event).toBe('TEST_EVENT');
    expect(msg.event).toBe('TEST_EVENT');
  });
});
