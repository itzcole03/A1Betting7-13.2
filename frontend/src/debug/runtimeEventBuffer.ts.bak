/**
 * Runtime Event Buffer - Stores diagnostic events for error correlation
 * 
 * Simple ring buffer for tracking runtime events that can be retrieved
 * during error handling to provide context about what led to failures.
 * 
 * @module debug/runtimeEventBuffer
 */

interface DiagnosticEvent {
  tag: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

// Ring buffer for events
const EVENT_BUFFER: DiagnosticEvent[] = [];
const MAX_EVENTS = 50;

/**
 * Record a diagnostic event
 */
export function recordEvent(tag: string, payload: Record<string, unknown>): void {
  EVENT_BUFFER.push({
    tag,
    payload,
    timestamp: Date.now(),
  });
  
  // Keep only the most recent events
  if (EVENT_BUFFER.length > MAX_EVENTS) {
    EVENT_BUFFER.shift();
  }
}

/**
 * Get recent events by tag
 */
export function getRecent(tag: string, n = 5): DiagnosticEvent[] {
  return EVENT_BUFFER
    .filter(event => event.tag === tag)
    .slice(-n);
}

/**
 * Get all recent events
 */
export function getAllRecent(n = 10): DiagnosticEvent[] {
  return EVENT_BUFFER.slice(-n);
}

/**
 * Clear the event buffer (for testing)
 */
export function clearEventBuffer(): void {
  EVENT_BUFFER.length = 0;
}