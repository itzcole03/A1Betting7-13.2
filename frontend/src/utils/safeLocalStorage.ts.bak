/**
 * Safe localStorage utilities with debugging and fallback handling
 * Prevents errors when localStorage is unavailable or when dealing with clientId persistence
 */

/**
 * Safe localStorage access with detailed logging for debugging
 */
class SafeLocalStorage {
  private available: boolean;
  private fallbackStorage: Map<string, string> = new Map();

  constructor() {
    this.available = this.checkAvailability();
    
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[ClientIdDiag] SafeLocalStorage initialized:', {
        available: this.available,
        fallbackStorageSize: this.fallbackStorage.size
      });
    }
  }

  private checkAvailability(): boolean {
    try {
      if (typeof Storage === 'undefined' || typeof localStorage === 'undefined') {
        return false;
      }
      
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[ClientIdDiag] LocalStorage not available:', error);
      }
      return false;
    }
  }

  public getItem(key: string): string | null {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[ClientIdDiag] Getting item:', key);
    }
    
    try {
      if (this.available) {
        const value = localStorage.getItem(key);
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('[ClientIdDiag] Retrieved from localStorage:', { key, value });
        }
        return value;
      } else {
        const value = this.fallbackStorage.get(key) || null;
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('[ClientIdDiag] Retrieved from fallback storage:', { key, value });
        }
        return value;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('[ClientIdDiag] Error getting item:', { key, error });
      }
      return this.fallbackStorage.get(key) || null;
    }
  }

  public setItem(key: string, value: string): boolean {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[ClientIdDiag] Setting item:', { key, value });
    }
    
    try {
      if (this.available) {
        localStorage.setItem(key, value);
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('[ClientIdDiag] Stored in localStorage successfully:', { key, value });
        }
        return true;
      } else {
        this.fallbackStorage.set(key, value);
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('[ClientIdDiag] Stored in fallback storage:', { key, value });
        }
        return true;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('[ClientIdDiag] Error setting item, using fallback:', { key, value, error });
      }
      this.fallbackStorage.set(key, value);
      return false;
    }
  }

  public removeItem(key: string): void {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[ClientIdDiag] Removing item:', key);
    }
    
    try {
      if (this.available) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('[ClientIdDiag] Error removing item from localStorage:', { key, error });
      }
    }
    
    this.fallbackStorage.delete(key);
  }

  public getAllKeys(): string[] {
    try {
      if (this.available) {
        const keys = Object.keys(localStorage);
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('[ClientIdDiag] Retrieved all localStorage keys:', keys);
        }
        return keys;
      } else {
        const keys = Array.from(this.fallbackStorage.keys());
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('[ClientIdDiag] Retrieved all fallback storage keys:', keys);
        }
        return keys;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('[ClientIdDiag] Error getting all keys:', error);
      }
      return Array.from(this.fallbackStorage.keys());
    }
  }

  public isAvailable(): boolean {
    return this.available;
  }
}

// Singleton instance
const safeLocalStorage = new SafeLocalStorage();

/**
 * Client ID management with safe persistence and detailed logging
 */
export class ClientIdManager {
  private static readonly CLIENT_ID_KEY = 'ws_client_id';
  private static readonly CLIENT_ID_PREFIX = 'client_';
  private currentClientId: string | null = null;

  constructor() {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[ClientIdDiag] ClientIdManager initialized');
      this.logCurrentState();
    }
  }

  /**
   * Generate a new client ID
   */
  public generateClientId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const clientId = `${ClientIdManager.CLIENT_ID_PREFIX}${timestamp}_${random}`;
    
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[ClientIdDiag] Generated new client ID:', clientId);
    }
    
    return clientId;
  }

  /**
   * Get or create a client ID with persistence
   */
  public getOrCreateClientId(providedClientId?: string): string {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[ClientIdDiag] Getting or creating client ID:', {
        providedClientId,
        currentClientId: this.currentClientId
      });
    }

    // Use provided client ID if given
    if (providedClientId) {
      this.currentClientId = providedClientId;
      this.persistClientId(providedClientId);
      return providedClientId;
    }

    // Return cached client ID if available
    if (this.currentClientId) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[ClientIdDiag] Using cached client ID:', this.currentClientId);
      }
      return this.currentClientId;
    }

    // Try to load from storage
    const storedClientId = this.loadClientId();
    if (storedClientId) {
      this.currentClientId = storedClientId;
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[ClientIdDiag] Loaded client ID from storage:', storedClientId);
      }
      return storedClientId;
    }

    // Generate new client ID
    const newClientId = this.generateClientId();
    this.currentClientId = newClientId;
    this.persistClientId(newClientId);
    
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[ClientIdDiag] Created and persisted new client ID:', newClientId);
    }

    return newClientId;
  }

  /**
   * Load client ID from storage
   */
  private loadClientId(): string | null {
    try {
      const clientId = safeLocalStorage.getItem(ClientIdManager.CLIENT_ID_KEY);
      
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[ClientIdDiag] Attempted to load client ID from storage:', {
          key: ClientIdManager.CLIENT_ID_KEY,
          result: clientId,
          storageAvailable: safeLocalStorage.isAvailable()
        });
      }
      
      return clientId;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('[ClientIdDiag] Error loading client ID:', error);
      }
      return null;
    }
  }

  /**
   * Persist client ID to storage
   */
  private persistClientId(clientId: string): void {
    try {
      const success = safeLocalStorage.setItem(ClientIdManager.CLIENT_ID_KEY, clientId);
      
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[ClientIdDiag] Client ID persistence result:', {
          clientId,
          success,
          storageAvailable: safeLocalStorage.isAvailable()
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('[ClientIdDiag] Error persisting client ID:', { clientId, error });
      }
    }
  }

  /**
   * Clear stored client ID
   */
  public clearClientId(): void {
    this.currentClientId = null;
    safeLocalStorage.removeItem(ClientIdManager.CLIENT_ID_KEY);
    
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[ClientIdDiag] Cleared client ID');
    }
  }

  /**
   * Get current client ID without creating a new one
   */
  public getCurrentClientId(): string | null {
    return this.currentClientId;
  }

  /**
   * Debug logging for current state
   */
  private logCurrentState(): void {
    if (process.env.NODE_ENV === 'development') {
      const allKeys = safeLocalStorage.getAllKeys();
      const storedClientId = safeLocalStorage.getItem(ClientIdManager.CLIENT_ID_KEY);
      
      // eslint-disable-next-line no-console
      console.group('[ClientIdDiag] Current State');
      // eslint-disable-next-line no-console
      console.log('[ClientIdDiag] Storage available:', safeLocalStorage.isAvailable());
      // eslint-disable-next-line no-console
      console.log('[ClientIdDiag] Current client ID:', this.currentClientId);
      // eslint-disable-next-line no-console
      console.log('[ClientIdDiag] Stored client ID:', storedClientId);
      // eslint-disable-next-line no-console
      console.log('[ClientIdDiag] All storage keys:', allKeys);
      // eslint-disable-next-line no-console
      console.groupEnd();
    }
  }
}

// Export both the singleton instance and the class for flexibility
export const clientIdManager = new ClientIdManager();
export { safeLocalStorage };

export default {
  ClientIdManager,
  clientIdManager,
  safeLocalStorage,
};