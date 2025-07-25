import { BaseService } from './BaseService';

interface StateData {
  [key: string]: unknown;
}

interface StateListener {
  id: string;
  path: string;
  callback: (newValue: unknown, oldValue: unknown) => void;
}

export class UnifiedStateService extends BaseService {
  private static instance: UnifiedStateService;
  private state: StateData = {};
  private listeners: StateListener[] = [];
  private listenerIdCounter = 0;

  protected constructor() {
    // @ts-expect-error TS(2554): Expected 2 arguments, but got 1.
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
    const _keys = path.split('.');
    let _current = this.state;

    for (const _key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue as T;
      }
    }

    return current as T;
  }

  set(path: string, value: unknown): void {
    const _keys = path.split('.');
    const _lastKey = keys.pop()!;
    let _current = this.state;

    // Navigate to the parent object
    for (const _key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    const _oldValue = current[lastKey];
    current[lastKey] = value;

    this.notifyListeners(path, value, oldValue);
    this.logger.debug('State updated', { path, value });
  }

  update(path: string, updater: (current: unknown) => unknown): void {
    const _currentValue = this.get(path);
    const _newValue = updater(currentValue);
    this.set(path, newValue);
  }

  merge(path: string, partial: unknown): void {
    const _currentValue = this.get(path, {});
    const _newValue = { ...currentValue, ...partial };
    this.set(path, newValue);
  }

  delete(path: string): void {
    const _keys = path.split('.');
    const _lastKey = keys.pop()!;
    let _current = this.state;

    for (const _key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        return; // Path doesn't exist
      }
      current = current[key];
    }

    const _oldValue = current[lastKey];
    delete current[lastKey];

    this.notifyListeners(path, undefined, oldValue);
    this.logger.debug('State deleted', { path });
  }

  subscribe(path: string, callback: (newValue: unknown, oldValue: unknown) => void): string {
    const _id = `listener_${++this.listenerIdCounter}`;
    this.listeners.push({ id, path, callback });

    this.logger.debug('State listener added', { id, path });
    return id;
  }

  unsubscribe(listenerId: string): void {
    const _index = this.listeners.findIndex(l => l.id === listenerId);
    if (index >= 0) {
      this.listeners.splice(index, 1);
      this.logger.debug('State listener removed', { listenerId });
    }
  }

  private notifyListeners(changedPath: string, newValue: unknown, oldValue: unknown): void {
    for (const _listener of this.listeners) {
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
    const _oldState = this.state;
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
      const _serializedState = JSON.stringify(this.state);
      localStorage.setItem('app_state', serializedState);
      this.logger.debug('State persisted to localStorage');
    } catch (error) {
      this.logger.error('Failed to persist state', error);
    }
  }

  restore(): void {
    try {
      const _serializedState = localStorage.getItem('app_state');
      if (serializedState) {
        const _restoredState = JSON.parse(serializedState);
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
