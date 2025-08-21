/**
 * Service Worker Registration - 2025 Best Practices
 *
 * Features:
 * - Automatic registration with update detection
 * - User-friendly update prompts
 * - Background sync capability
 * - Push notification support
 */

import React from 'react';
import { enhancedLogger } from '../utils/enhancedLogger';

interface ServiceWorkerUpdateState {
  hasUpdate: boolean;
  newWorker: ServiceWorker | null;
  isInstalling: boolean;
  error: string | null;
}

type UpdateCallback = (state: ServiceWorkerUpdateState) => void;

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateCallbacks: Set<UpdateCallback> = new Set();
  private state: ServiceWorkerUpdateState = {
    hasUpdate: false,
    newWorker: null,
    isInstalling: false,
    error: null,
  };

  /**
   * Register the service worker with automatic update detection
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      enhancedLogger.warn('ServiceWorker', 'register', 'Not supported in this browser');
      return null;
    }

    try {
  enhancedLogger.info('ServiceWorker', 'register', 'Registering with 2025 best practices...');

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none', // Always check for updates
      });

      this.registration = registration;

      // Set up update detection
      this.setupUpdateHandling(registration);

      // Enable background sync
      this.enableBackgroundSync(registration);

  // Track registration success
  enhancedLogger.info('ServiceWorker', 'register', 'Registration tracking: success');

  enhancedLogger.info('ServiceWorker', 'register', 'Successfully registered');
      return registration;
    } catch (error) {
  enhancedLogger.error('ServiceWorker', 'register', 'Registration failed', undefined, error as Error);
  enhancedLogger.warn('ServiceWorker', 'register', 'Registration tracking: error');

      this.updateState({
        error: `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });

      return null;
    }
  }

  /**
   * Set up update detection and handling
   */
  private setupUpdateHandling(registration: ServiceWorkerRegistration): void {
    // Check for updates periodically
    setInterval(() => {
  registration.update().catch((e: any) => enhancedLogger.error('ServiceWorker', 'update', 'Update failed', undefined, e as Error));
    }, 60000); // Check every minute

    // Handle installation of new service worker
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

  enhancedLogger.info('ServiceWorker', 'updatefound', 'New version found, installing...');

      this.updateState({
        isInstalling: true,
        newWorker,
      });

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New version available
            enhancedLogger.info('ServiceWorker', 'update', 'New version ready');
            this.updateState({
              hasUpdate: true,
              isInstalling: false,
              newWorker,
            });
          } else {
            // First time installation
            enhancedLogger.info('ServiceWorker', 'update', 'App is ready for offline use');
            this.updateState({
              isInstalling: false,
            });
          }
        }
      });
    });

    // Handle controller change (when new SW becomes active)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
  enhancedLogger.info('ServiceWorker', 'controllerchange', 'New version is now controlling the app');
      // Optionally reload the page or show notification
      window.location.reload();
    });
  }

  /**
   * Enable background sync for offline analytics
   */
  private enableBackgroundSync(registration: ServiceWorkerRegistration): void {
    // Check if sync is supported
    if ('sync' in registration) {
      try {
        // Add error handling for sync registration
        const syncManager = (registration as any).sync;
        if (syncManager && typeof syncManager.register === 'function') {
          syncManager.register('analytics-sync').catch((error: any) => {
            enhancedLogger.error('ServiceWorker', 'sync', 'Sync registration failed', undefined, error as Error);
          });
          enhancedLogger.info('ServiceWorker', 'sync', 'Background sync enabled');
        }
        } catch (error) {
          enhancedLogger.warn('ServiceWorker', 'sync', 'Background sync not available', undefined, error as Error);
        }
    }
  }

  /**
   * Apply pending service worker update
   */
  applyUpdate(): void {
    if (this.state.newWorker) {
      this.state.newWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  /**
   * Subscribe to update notifications
   */
  onUpdate(callback: UpdateCallback): () => void {
    this.updateCallbacks.add(callback);

    // Immediately call with current state
    callback(this.state);

    // Return unsubscribe function
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  /**
   * Request permission for push notifications
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted' && this.registration) {
      // Subscribe to push notifications
      try {
        const subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          // Cast to any to accept various BufferSource implementations across browsers
          applicationServerKey: this.urlBase64ToUint8Array(process.env.VITE_VAPID_PUBLIC_KEY || '') as any,
        } as any);

        // Send subscription to backend
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscription),
        });

  enhancedLogger.info('ServiceWorker', 'push', 'Push notifications enabled');
      } catch (error) {
  enhancedLogger.error('ServiceWorker', 'push', 'Push subscription failed', undefined, error as Error);
      }
    }

    return permission;
  }

  /**
   * Get current registration
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  /**
   * Update internal state and notify callbacks
   */
  private updateState(updates: Partial<ServiceWorkerUpdateState>): void {
    this.state = { ...this.state, ...updates };
  this.updateCallbacks.forEach(callback => callback(this.state));
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

// Export singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

/**
 * React hook for service worker updates
 */
export function useServiceWorkerUpdate() {
  const [updateState, setUpdateState] = React.useState<ServiceWorkerUpdateState>({
    hasUpdate: false,
    newWorker: null,
    isInstalling: false,
    error: null,
  });

  React.useEffect(() => {
    const unsubscribe = serviceWorkerManager.onUpdate(setUpdateState);
    return unsubscribe;
  }, []);

  const applyUpdate = React.useCallback(() => {
    serviceWorkerManager.applyUpdate();
  }, []);

  const requestNotifications = React.useCallback(() => {
    return serviceWorkerManager.requestNotificationPermission();
  }, []);

  return {
    ...updateState,
    applyUpdate,
    requestNotifications,
  };
}

export default serviceWorkerManager;
