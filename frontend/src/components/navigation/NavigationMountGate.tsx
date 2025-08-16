import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * Event types for navigation mount events
 */
export type NavigationMountEventType = 'NAV_READY' | 'NAV_MOUNT' | 'NAV_UNMOUNT';

/**
 * Navigation mount event data
 */
export interface NavigationMountEvent {
  type: NavigationMountEventType;
  source: string;
  timestamp: number;
  correlationId: string;
  mountedElements: string[];
  readyState: 'loading' | 'mounted' | 'ready' | 'error';
  timeout?: boolean;
}

/**
 * NavigationMountGate props
 */
export interface NavigationMountGateProps {
  /** Children to render */
  children: React.ReactNode;
  
  /** Timeout for navigation ready event (default: 5000ms) */
  timeout?: number;
  
  /** Correlation ID for tracking (auto-generated if not provided) */
  correlationId?: string;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Callback fired when navigation is ready */
  onNavigationReady?: (event: NavigationMountEvent) => void;
  
  /** Callback fired when timeout occurs */
  onTimeout?: (event: NavigationMountEvent) => void;
  
  /** Enable debug logging */
  debug?: boolean;
  
  /** Selectors for navigation elements to watch */
  watchSelectors?: string[];
}

/**
 * Default selectors for navigation elements
 */
const DEFAULT_NAVIGATION_SELECTORS = [
  '[data-navigation="primary"]',
  '[data-navigation="sidebar"]',
  '[role="navigation"]',
  'nav',
  '.navigation',
  '.nav-container',
  '.sidebar'
];

/**
 * NavigationMountGate - Tracks navigation element mounting and emits NAV_READY event
 * 
 * This component monitors the DOM for primary navigation elements (sidebars, nav bars, etc.)
 * and emits a "NAV_READY" event when they are properly mounted. This is useful for validators
 * and other components that need to wait for the navigation structure to be available.
 * 
 * Features:
 * - Monitors multiple navigation selectors
 * - Configurable timeout with fallback
 * - Correlation ID for tracking across systems
 * - Event emission via custom events and callbacks
 * - Debug logging for troubleshooting
 * - Portal-based rendering for minimal DOM impact
 * 
 * Usage:
 * ```tsx
 * <NavigationMountGate 
 *   timeout={5000}
 *   correlationId="app-startup-123"
 *   onNavigationReady={(event) => console.log('Nav ready!', event)}
 * >
 *   <YourAppContent />
 * </NavigationMountGate>
 * ```
 */
export const NavigationMountGate: React.FC<NavigationMountGateProps> = ({
  children,
  timeout = 5000,
  correlationId: providedCorrelationId,
  className,
  onNavigationReady,
  onTimeout,
  debug = false,
  watchSelectors = DEFAULT_NAVIGATION_SELECTORS
}) => {
  const [readyState, setReadyState] = useState<NavigationMountEvent['readyState']>('loading');
  const [mountedElements, setMountedElements] = useState<string[]>([]);
  const correlationId = useRef(providedCorrelationId || `nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const readyEmittedRef = useRef(false);

  const log = useCallback((message: string, data?: any) => {
    if (debug) {
      console.log(`[NavigationMountGate:${correlationId.current}] ${message}`, data || '');
    }
  }, [debug]);

  /**
   * Emit navigation event via CustomEvent and callback
   */
  const emitNavigationEvent = useCallback((
    type: NavigationMountEventType, 
    additionalData: Partial<NavigationMountEvent> = {}
  ) => {
    const event: NavigationMountEvent = {
      type,
      source: 'NavigationMountGate',
      timestamp: Date.now(),
      correlationId: correlationId.current,
      mountedElements: [...mountedElements],
      readyState,
      ...additionalData
    };

    log(`Emitting ${type} event`, event);

    // Emit as CustomEvent for global listening
    const customEvent = new CustomEvent(type, {
      detail: event,
      bubbles: true,
      cancelable: false
    });
    
    window.dispatchEvent(customEvent);
    document.dispatchEvent(customEvent);

    // Call specific callbacks
    if (type === 'NAV_READY' && onNavigationReady) {
      onNavigationReady(event);
    }
    
    if (additionalData.timeout && onTimeout) {
      onTimeout(event);
    }

  }, [mountedElements, readyState, log, onNavigationReady, onTimeout]);

  /**
   * Check if navigation elements are mounted
   */
  const checkNavigationElements = useCallback(() => {
    const found: string[] = [];
    let hasNavigation = false;

    for (const selector of watchSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        found.push(`${selector} (${elements.length})`);
        hasNavigation = true;
        log(`Found navigation elements for selector: ${selector}`, elements.length);
      }
    }

    setMountedElements(found);

    if (hasNavigation && readyState !== 'ready' && !readyEmittedRef.current) {
      log('Navigation elements detected, transitioning to ready state');
      setReadyState('ready');
      readyEmittedRef.current = true;
      
      // Clear timeout since we found navigation
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Emit NAV_READY event
      emitNavigationEvent('NAV_READY', {
        mountedElements: found,
        readyState: 'ready'
      });
    }

    return hasNavigation;
  }, [watchSelectors, readyState, log, emitNavigationEvent]);

  /**
   * Setup DOM observation for navigation elements
   */
  useEffect(() => {
    log('Setting up navigation mount gate', { 
      timeout, 
      correlationId: correlationId.current,
      watchSelectors 
    });

    setReadyState('loading');

    // Emit initial mount event
    emitNavigationEvent('NAV_MOUNT', {
      readyState: 'loading'
    });

    // Initial check for existing navigation elements
    const initialCheck = checkNavigationElements();
    
    if (!initialCheck) {
      log('No navigation elements found initially, setting up observer and timeout');

      // Setup MutationObserver to watch for navigation elements
      observerRef.current = new MutationObserver((mutations) => {
        let shouldCheck = false;
        
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Check if any added nodes might contain navigation elements
            for (const node of Array.from(mutation.addedNodes)) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                
                // Check if the added node itself matches navigation selectors
                const matchesSelector = watchSelectors.some(selector => {
                  try {
                    return element.matches(selector);
                  } catch {
                    return false;
                  }
                });

                // Check if the added node contains navigation elements
                const containsNavigation = watchSelectors.some(selector => {
                  try {
                    return element.querySelector(selector) !== null;
                  } catch {
                    return false;
                  }
                });

                if (matchesSelector || containsNavigation) {
                  shouldCheck = true;
                  log('Navigation-related DOM changes detected');
                  break;
                }
              }
            }
          }
          
          if (shouldCheck) break;
        }

        if (shouldCheck) {
          // Small delay to allow for complete mounting
          setTimeout(checkNavigationElements, 10);
        }
      });

      // Start observing
      observerRef.current.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        attributeOldValue: false,
        characterData: false
      });

      // Setup timeout fallback
      timeoutRef.current = setTimeout(() => {
        if (!readyEmittedRef.current) {
          log('Navigation ready timeout reached, emitting timeout event');
          setReadyState('error');
          
          emitNavigationEvent('NAV_READY', {
            readyState: 'error',
            timeout: true
          });
          
          readyEmittedRef.current = true;
        }
      }, timeout);
    }

    return () => {
      log('Cleaning up navigation mount gate');
      
      // Cleanup observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      // Cleanup timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Emit unmount event
      emitNavigationEvent('NAV_UNMOUNT', {
        readyState: 'loading'
      });
    };
  }, [timeout, checkNavigationElements, emitNavigationEvent, log, watchSelectors]);

  // Return the children wrapped in a minimal container
  // Using portal to avoid affecting the normal DOM structure
  return (
    <>
      {children}
      {debug && (
        <div 
          className={`navigation-mount-gate-debug ${className || ''}`}
          data-correlation-id={correlationId.current}
          data-ready-state={readyState}
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 9999,
            fontFamily: 'monospace'
          }}
        >
          <div>Nav Gate: {readyState}</div>
          <div>Correlation: {correlationId.current.split('-').pop()}</div>
          <div>Elements: {mountedElements.length}</div>
          {mountedElements.slice(0, 3).map((element, idx) => (
            <div key={idx} style={{ fontSize: '10px', opacity: 0.7 }}>
              {element}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

/**
 * Hook for listening to navigation mount events
 */
export const useNavigationMountListener = (
  callback: (event: NavigationMountEvent) => void,
  eventTypes: NavigationMountEventType[] = ['NAV_READY']
) => {
  useEffect(() => {
    const handlers: Array<{ type: string; handler: (event: Event) => void }> = [];

    eventTypes.forEach(eventType => {
      const handler = (event: Event) => {
        const customEvent = event as CustomEvent<NavigationMountEvent>;
        if (customEvent.detail) {
          callback(customEvent.detail);
        }
      };

      window.addEventListener(eventType, handler);
      handlers.push({ type: eventType, handler });
    });

    return () => {
      handlers.forEach(({ type, handler }) => {
        window.removeEventListener(type, handler);
      });
    };
  }, [callback, eventTypes]);
};

/**
 * Utility function to wait for navigation ready event
 */
export const waitForNavigationReady = (
  timeout: number = 5000,
  correlationId?: string
): Promise<NavigationMountEvent> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`Navigation ready timeout after ${timeout}ms`));
    }, timeout);

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<NavigationMountEvent>;
      const eventData = customEvent.detail;
      
      // If correlationId is provided, only resolve for matching events
      if (correlationId && eventData.correlationId !== correlationId) {
        return;
      }

      cleanup();
      resolve(eventData);
    };

    const cleanup = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('NAV_READY', handler);
    };

    window.addEventListener('NAV_READY', handler);
  });
};

export default NavigationMountGate;