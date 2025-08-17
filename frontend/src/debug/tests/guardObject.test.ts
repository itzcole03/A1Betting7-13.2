/**
 * Object Guard Tests - Verify the guard functions work correctly
 * 
 * @module debug/tests/guardObject.test.ts
 */

import { guardObject, clearEvents } from '../objectGuardDiagnostics';
import { clearEventBuffer, getRecent } from '../runtimeEventBuffer';

describe('guardObject', () => {
  beforeEach(() => {
    clearEvents();
    clearEventBuffer();
    
    // Mock console.error to avoid spam in test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return the original value for valid objects', () => {
    const testObj = { test: 'value' };
    const result = guardObject('TestLabel', testObj);
    expect(result).toBe(testObj);
  });

  it('should return empty object for null values', () => {
    const result = guardObject('TestLabel', null);
    expect(result).toEqual({});
  });

  it('should return empty object for undefined values', () => {
    const result = guardObject('TestLabel', undefined);
    expect(result).toEqual({});
  });

  it('should log and record null access events', () => {
    guardObject('TestLabel', null);
    
    const events = getRecent('NullObjectAccess', 1);
    expect(events).toHaveLength(1);
    expect(events[0].payload.label).toBe('TestLabel');
    expect(events[0].payload.typeof).toBe('object');
  });

  it('should prevent Object.keys from throwing on null', () => {
    const result = guardObject('TestLabel', null);
    expect(() => Object.keys(result as object)).not.toThrow();
  });
});