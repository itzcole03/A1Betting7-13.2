import { BaseService } from './BaseService';

interface StateData {
  [key: string]: any;
}

interface StateListener {
  id: string;
  path: string;
  callback: (newValue: any, oldValue: any) => void;
}

export class UnifiedStateService extends BaseService {
  private static instance: UnifiedStateService;
  private state: StateData = {};
  private listeners: StateListener[] = [];
  private listenerIdCounter = 0;

  protected constructor() {
    super('UnifiedStateService');
    this.initializeDefaultState();
  }

  static getInstance(): UnifiedStateService {
    if (!UnifiedStateService.instance) {
      UnifiedStateService.instance = new UnifiedStateService();
    }
    return UnifiedStateService.instance;
  }

  private initializeDefaultState(): void {
    this.state = {
      user: {
        isAuthenticated: false,
        profile: null,
        preferences: {},
      },
      sports: {
        selectedSport: 'nfl',
        activeFilters: {},
        data: {},
      },
      betting: {
        opportunities: [],
        history: [],
        metrics: {},
      },
      ui: {
        theme: 'cyber-dark',
        sidebarOpen: true,
        notifications: [],
      },
      system: {
        isOnline: true,
        lastSync: null,
        errors: [],
      },
    };
  }

  get<T>(path: string, defaultValue?: T): T {
    const keys = path.split('.');
    let current = this.state;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue as T;
      }
    }

    return current as T;
  }

  set(path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current = this.state;

    // Navigate to the parent object
    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    const oldValue = current[lastKey];
    current[lastKey] = value;

    this.notifyListeners(path, value, oldValue);
    this.logger.debug('State updated', { path, value });
  }

  update(path: string, updater: (current: any) => any): void {
    const currentValue = this.get(path);
    const newValue = updater(currentValue);
    this.set(path, newValue);
  }

  merge(path: string, partial: any): void {
    const currentValue = this.get(path, {});
    const newValue = { ...currentValue, ...partial };
    this.set(path, newValue);
  }

  delete(path: string): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current = this.state;

    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        return; // Path doesn't exist
      }
      current = current[key];
    }

    const oldValue = current[lastKey];
    delete current[lastKey];

    this.notifyListeners(path, undefined, oldValue);
    this.logger.debug('State deleted', { path });
  }

  subscribe(path: string, callback: (newValue: any, oldValue: any) => void): string {
    const id = `listener_${++this.listenerIdCounter}`;
    this.listeners.push({ id, path, callback });

    this.logger.debug('State listener added', { id, path });
    return id;
  }

  unsubscribe(listenerId: string): void {
    const index = this.listeners.findIndex(l => l.id === listenerId);
    if (index >= 0) {
      this.listeners.splice(index, 1);
      this.logger.debug('State listener removed', { listenerId });
    }
  }

  private notifyListeners(changedPath: string, newValue: any, oldValue: any): void {
    for (const listener of this.listeners) {
      if (this.pathMatches(changedPath, listener.path)) {
        try {
          listener.callback(newValue, oldValue);
        } catch (error) {
          this.logger.error('State listener error', {
            listenerId: listener.id,
            path: listener.path,
            error,
          });
        }
      }
    }
  }

  private pathMatches(changedPath: string, listenerPath: string): boolean {
    // Exact match
    if (changedPath === listenerPath) return true;

    // Parent path change affects child listeners
    if (changedPath.length < listenerPath.length) {
      return listenerPath.startsWith(changedPath + '.');
    }

    // Child path change affects parent listeners
    if (changedPath.length > listenerPath.length) {
      return changedPath.startsWith(listenerPath + '.');
    }

    return false;
  }

  getState(): StateData {
    return JSON.parse(JSON.stringify(this.state));
  }

  setState(newState: StateData): void {
    const oldState = this.state;
    this.state = newState;

    // Notify all listeners that root state changed
    this.notifyListeners('', newState, oldState);
    this.logger.info('Full state replaced');
  }

  reset(): void {
    this.initializeDefaultState();
    this.listeners = [];
    this.logger.info('State reset to defaults');
  }

  persist(): void {
    try {
      const serializedState = JSON.stringify(this.state);
      localStorage.setItem('app_state', serializedState);
      this.logger.debug('State persisted to localStorage');
    } catch (error) {
      this.logger.error('Failed to persist state', error);
    }
  }

  restore(): void {
    try {
      const serializedState = localStorage.getItem('app_state');
      if (serializedState) {
        const restoredState = JSON.parse(serializedState);
        this.setState(restoredState);
        this.logger.info('State restored from localStorage');
      }
    } catch (error) {
      this.logger.error('Failed to restore state', error);
      this.initializeDefaultState();
    }
  }
}

export default UnifiedStateService;
