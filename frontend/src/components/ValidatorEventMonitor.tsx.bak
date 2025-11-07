/**
 * Validator Event Monitor Component
 * 
 * Demonstrates the validator observability events by listening to them
 * and displaying recent events in development mode.
 */

import React, { useState, useEffect } from 'react';
import { _eventBus } from '../core/EventBus';

interface ValidatorEvent {
  event_type: 'validator.cycle' | 'validator.cycle.fail' | 'validator.bootstrap' | 'validator.performance';
  phase: string;
  status: 'pass' | 'fail' | 'warn' | 'timeout';
  attempt?: number;
  duration_ms: number;
  timestamp: number;
  details?: {
    error?: string;
    warning?: string;
    functionName?: string;
    performanceImpact?: boolean;
  };
}

interface ValidatorEventMonitorProps {
  maxEvents?: number;
  showOnlyFailures?: boolean;
}

export const ValidatorEventMonitor: React.FC<ValidatorEventMonitorProps> = ({ 
  maxEvents = 10, 
  showOnlyFailures = false 
}) => {
  const [events, setEvents] = useState<ValidatorEvent[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleValidatorEvent = (data: unknown) => {
      const event = data as ValidatorEvent;
      
      // Validate that this is actually a validator event
      if (!event.event_type || !event.phase || !event.status) {
        return;
      }
      
      // Filter events if showOnlyFailures is true
      if (showOnlyFailures && event.status !== 'fail') {
        return;
      }

      setEvents(prevEvents => {
        const newEvents = [event, ...prevEvents].slice(0, maxEvents);
        return newEvents;
      });
    };

    // Listen to all validator events
    _eventBus.on('validator.event', handleValidatorEvent);
    _eventBus.on('validator.cycle', handleValidatorEvent);
    _eventBus.on('validator.cycle.fail', handleValidatorEvent);
    _eventBus.on('validator.bootstrap', handleValidatorEvent);

    return () => {
      _eventBus.off('validator.event', handleValidatorEvent);
      _eventBus.off('validator.cycle', handleValidatorEvent);
      _eventBus.off('validator.cycle.fail', handleValidatorEvent);
      _eventBus.off('validator.bootstrap', handleValidatorEvent);
    };
  }, [maxEvents, showOnlyFailures]);

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-400';
      case 'fail': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'timeout': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'validator.bootstrap': return '🚀';
      case 'validator.cycle.fail': return '❌';
      case 'validator.cycle': return '🔄';
      case 'validator.performance': return '⚡';
      default: return '📊';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors mb-2"
        title="Toggle Validator Event Monitor"
      >
        📊 Validator Events ({events.length})
      </button>

      {/* Event monitor panel */}
      {isVisible && (
        <div className="bg-gray-900 text-white p-4 rounded-lg shadow-xl max-w-md max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold">Validator Events</h3>
            <button
              onClick={() => setEvents([])}
              className="text-xs text-gray-400 hover:text-white"
            >
              Clear
            </button>
          </div>

          {events.length === 0 ? (
            <p className="text-gray-400 text-sm">No events yet...</p>
          ) : (
            <div className="space-y-2">
              {events.map((event, index) => (
                <div key={`${event.timestamp}-${index}`} className="border-l-2 border-gray-700 pl-3 py-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center space-x-1">
                      <span>{getEventTypeIcon(event.event_type)}</span>
                      <span className={getStatusColor(event.status)}>
                        {event.phase}
                      </span>
                    </span>
                    <span className="text-gray-400">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-300 mt-1">
                    Duration: {event.duration_ms.toFixed(1)}ms
                  </div>
                  
                  {event.details?.error && (
                    <div className="text-xs text-red-300 mt-1 truncate">
                      Error: {event.details.error}
                    </div>
                  )}
                  
                  {event.details?.warning && (
                    <div className="text-xs text-yellow-300 mt-1 truncate">
                      Warning: {event.details.warning}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ValidatorEventMonitor;