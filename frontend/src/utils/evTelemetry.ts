/**
 * EV Integration Telemetry for PropFinder
 * Provides logging and monitoring for EV feature activation
 */

export interface EVTelemetryEvent {
  event: 'ev_integration_active' | 'ev_sort_applied' | 'ev_filter_used' | 'ev_bookmark_toggled';
  timestamp: number;
  data?: {
    sortBy?: 'ev' | 'confidence' | 'profit';
    filterThreshold?: number;
    opportunityId?: string;
    evPercent?: number;
    bookmarkCount?: number;
  };
}

class EVTelemetryService {
  private events: EVTelemetryEvent[] = [];
  private isEnabled: boolean = true;

  /**
   * Log an EV telemetry event
   */
  logEvent(event: EVTelemetryEvent['event'], data?: EVTelemetryEvent['data']): void {
    if (!this.isEnabled) return;

    const telemetryEvent: EVTelemetryEvent = {
      event,
      timestamp: Date.now(),
      data,
    };

    this.events.push(telemetryEvent);

    // Console logging for development
    if (typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.info(`[PropFinder EV] ${event}`, data || '');
    }

    // Keep only last 100 events to prevent memory leak
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
  }

  /**
   * Get all logged events
   */
  getEvents(): EVTelemetryEvent[] {
    return [...this.events];
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: EVTelemetryEvent['event']): EVTelemetryEvent[] {
    return this.events.filter(event => event.event === eventType);
  }

  /**
   * Clear all events
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Enable/disable telemetry
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if telemetry is enabled
   */
  isActive(): boolean {
    return this.isEnabled;
  }

  /**
   * Get telemetry summary
   */
  getSummary(): {
    totalEvents: number;
    evSortUsage: number;
    filterUsage: number;
    bookmarkActions: number;
    lastActivity: number | null;
  } {
    return {
      totalEvents: this.events.length,
      evSortUsage: this.getEventsByType('ev_sort_applied').length,
      filterUsage: this.getEventsByType('ev_filter_used').length,
      bookmarkActions: this.getEventsByType('ev_bookmark_toggled').length,
      lastActivity: this.events.length > 0 ? Math.max(...this.events.map(e => e.timestamp)) : null,
    };
  }
}

export const evTelemetry = new EVTelemetryService();

// Auto-log integration activation
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    evTelemetry.logEvent('ev_integration_active');
  });
}

export default evTelemetry;