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
    // @ts-expect-error TS(2554): Expected 2 arguments, but got 1. BaseService expects two arguments, but only one is provided here for singleton pattern compatibility.
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

    for (const _key of _keys) {
      if (_current && typeof _current === 'object' && _key in _current) {
        _current = (_current as any)[_key];
      } else {
        return defaultValue as T;
      }
    }

    return _current as T;
  }

  set(path: string, value: unknown): void {
    const _keys = path.split('.');
    const _lastKey = _keys.pop()!;
    let _current = this.state;

    // Navigate to the parent object
    for (const _key of _keys) {
      if (!(_key in _current) || typeof (_current as any)[_key] !== 'object') {
        (_current as any)[_key] = {};
      }
      _current = (_current as any)[_key];
    }

    const _oldValue = (_current as any)[_lastKey];
    (_current as any)[_lastKey] = value;

    this.notifyListeners(path, value, _oldValue);
    this.logger.debug('State updated', { path, value });
  }

  update(path: string, updater: (current: unknown) => unknown): void {
    const _currentValue = this.get(path);
    const _newValue = updater(_currentValue);
    this.set(path, _newValue);
  }

  merge(path: string, partial: unknown): void {
    const _currentValue = this.get(path, {});
    const _newValue = { ...(_currentValue as object), ...(partial as object) };
    this.set(path, _newValue);
  }

  delete(path: string): void {
    const _keys = path.split('.');
    const _lastKey = _keys.pop()!;
    let _current = this.state;

    for (const _key of _keys) {
      if (!(_key in _current) || typeof (_current as any)[_key] !== 'object') {
        return; // Path doesn't exist
      }
      _current = (_current as any)[_key];
    }

    const _oldValue = (_current as any)[_lastKey];
    delete (_current as any)[_lastKey];

    this.notifyListeners(path, undefined, _oldValue);
    this.logger.debug('State deleted', { path });
  }

  subscribe(path: string, callback: (newValue: unknown, oldValue: unknown) => void): string {
    const _id = `listener_${++this.listenerIdCounter}`;
    this.listeners.push({ id: _id, path, callback });

    this.logger.debug('State listener added', { id: _id, path });
    return _id;
  }

  unsubscribe(listenerId: string): void {
    const _index = this.listeners.findIndex(l => l.id === listenerId);
    if (_index >= 0) {
      this.listeners.splice(_index, 1);
      this.logger.debug('State listener removed', { listenerId });
    }
  }

  private notifyListeners(changedPath: string, newValue: unknown, oldValue: unknown): void {
    for (const _listener of this.listeners) {
      if (this.pathMatches(changedPath, _listener.path)) {
        try {
          _listener.callback(newValue, oldValue);
        } catch (error) {
          this.logger.error('State listener error', {
            listenerId: _listener.id,
            path: _listener.path,
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
    this.notifyListeners('', newState, _oldState);
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
      localStorage.setItem('app_state', _serializedState);
      this.logger.debug('State persisted to localStorage');
    } catch (error) {
      this.logger.error('Failed to persist state', error);
    }
  }

  restore(): void {
    try {
      const _serializedState = localStorage.getItem('app_state');
      if (_serializedState) {
        const _restoredState = JSON.parse(_serializedState);
        this.setState(_restoredState);
        this.logger.info('State restored from localStorage');
      }
    } catch (error) {
      this.logger.error('Failed to restore state', error);
      this.initializeDefaultState();
    }
  }
}

export default UnifiedStateService;
