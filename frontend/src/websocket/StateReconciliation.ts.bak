/**
 * WebSocket State Reconciliation System
 * 
 * Ensures client and server state consistency through snapshot requests,
 * incremental updates, and conflict resolution. Handles connection 
 * interruptions gracefully with automatic state synchronization.
 */

import { 
  WSMessageEnvelope,
  WSSnapshotRequestPayload,
  WSSnapshotResponsePayload,
  WSStateValidator,
  WSValidationResult,
  WSStateDiff,
  WS_MESSAGE_TYPES,
  WS_PROTOCOL_VERSION
} from './protocol-types';

export interface StateCategory {
  name: string;
  validator: (data: unknown) => boolean;
  merger: (local: unknown[], remote: unknown[]) => unknown[];
  keyExtractor: (item: unknown) => string;
  timestampExtractor: (item: unknown) => number;
}

export interface ReconciliationConfig {
  /** Maximum time between reconciliation attempts */
  maxReconciliationIntervalMs: number;
  /** Timeout for snapshot requests */
  snapshotTimeoutMs: number;
  /** Maximum number of items per snapshot chunk */
  maxSnapshotChunkSize: number;
  /** Enable automatic periodic reconciliation */
  enablePeriodicReconciliation: boolean;
  /** Conflict resolution strategy */
  conflictResolution: 'server_wins' | 'latest_timestamp' | 'merge';
}

export interface ReconciliationState {
  lastReconciliationTime: number;
  pendingSnapshots: Set<string>;
  reconciliationInProgress: boolean;
  lastSyncTimestamp: Record<string, number>;
  stateChecksums: Record<string, string>;
}

const DEFAULT_CONFIG: ReconciliationConfig = {
  maxReconciliationIntervalMs: 300000, // 5 minutes
  snapshotTimeoutMs: 30000, // 30 seconds
  maxSnapshotChunkSize: 1000,
  enablePeriodicReconciliation: true,
  conflictResolution: 'latest_timestamp'
};

export class StateReconciliationManager {
  private config: ReconciliationConfig;
  private state: ReconciliationState;
  private categories: Map<string, StateCategory>;
  private localState: Map<string, unknown[]>;
  private sendMessage: (message: WSMessageEnvelope) => void;
  private onStateUpdate: (category: string, data: unknown[]) => void;
  private validator: WSStateValidator;
  private reconciliationTimer: NodeJS.Timeout | null = null;
  private snapshotTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    config: Partial<ReconciliationConfig> = {},
    sendMessage: (message: WSMessageEnvelope) => void,
    onStateUpdate: (category: string, data: unknown[]) => void
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sendMessage = sendMessage;
    this.onStateUpdate = onStateUpdate;
    this.validator = new DefaultStateValidator();
    this.categories = new Map();
    this.localState = new Map();
    this.state = this.createInitialState();
    
    this.initializeDefaultCategories();
    
    if (this.config.enablePeriodicReconciliation) {
      this.startPeriodicReconciliation();
    }
  }

  /**
   * Register a state category for reconciliation
   */
  registerCategory(category: StateCategory): void {
    this.categories.set(category.name, category);
    this.localState.set(category.name, []);
    this.state.lastSyncTimestamp[category.name] = 0;
    this.state.stateChecksums[category.name] = '';
  }

  /**
   * Start reconciliation process
   */
  async startReconciliation(categories?: string[]): Promise<void> {
    if (this.state.reconciliationInProgress) {
      return;
    }

    this.state.reconciliationInProgress = true;
    this.state.lastReconciliationTime = Date.now();

    const categoriesToSync = categories || Array.from(this.categories.keys());
    
    for (const category of categoriesToSync) {
      await this.requestSnapshot(category);
    }
  }

  /**
   * Request snapshot for a specific category
   */
  private async requestSnapshot(category: string): Promise<void> {
    if (!this.categories.has(category)) {
      return;
    }

    const correlationId = `snapshot-${category}-${Date.now()}`;
    this.state.pendingSnapshots.add(correlationId);

    // Set timeout for snapshot request
    const timeout = setTimeout(() => {
      this.handleSnapshotTimeout(correlationId, category);
    }, this.config.snapshotTimeoutMs);
    
    this.snapshotTimeouts.set(correlationId, timeout);

    // Send snapshot request
    const request: WSMessageEnvelope<WSSnapshotRequestPayload> = {
      type: WS_MESSAGE_TYPES.SNAPSHOT_REQUEST,
      ts: Date.now(),
      correlationId,
      payload: {
        categories: [category],
        lastSyncTimestamp: this.state.lastSyncTimestamp[category],
        checksum: this.state.stateChecksums[category]
      },
      version: WS_PROTOCOL_VERSION
    };

    this.sendMessage(request);
  }

  /**
   * Handle incoming snapshot response
   */
  async handleSnapshotResponse(message: WSMessageEnvelope<WSSnapshotResponsePayload>): Promise<void> {
    const { correlationId, payload } = message;
    
    if (!this.state.pendingSnapshots.has(correlationId)) {
      return; // Unexpected or late response
    }

    // Clear timeout
    const timeout = this.snapshotTimeouts.get(correlationId);
    if (timeout) {
      clearTimeout(timeout);
      this.snapshotTimeouts.delete(correlationId);
    }

    this.state.pendingSnapshots.delete(correlationId);

    try {
      await this.processSnapshotData(payload);
      
      // Check if all snapshots completed
      if (this.state.pendingSnapshots.size === 0) {
        this.state.reconciliationInProgress = false;
      }
    } catch (error) {
      this.handleReconciliationError(payload.category, error as Error);
    }
  }

  /**
   * Process snapshot data and merge with local state
   */
  private async processSnapshotData(payload: WSSnapshotResponsePayload): Promise<void> {
    const { category, data, timestamp, checksum } = payload;
    const categoryDef = this.categories.get(category);
    
    if (!categoryDef) {
      throw new Error(`Unknown category: ${category}`);
    }

    // Validate incoming data
    const validationResult = this.validator.validateState(data);
    if (!validationResult.isValid) {
      throw new Error(`Invalid snapshot data: ${validationResult.errors.join(', ')}`);
    }

    const localData = this.localState.get(category) || [];
    let mergedData: unknown[];

    // Apply conflict resolution strategy
    switch (this.config.conflictResolution) {
      case 'server_wins':
        mergedData = data;
        break;
      case 'latest_timestamp':
        mergedData = this.mergeByTimestamp(localData, data, categoryDef);
        break;
      case 'merge':
        mergedData = categoryDef.merger(localData, data);
        break;
      default:
        mergedData = data;
    }

    // Update local state
    this.localState.set(category, mergedData);
    this.state.lastSyncTimestamp[category] = timestamp;
    this.state.stateChecksums[category] = checksum;

    // Notify about state update
    this.onStateUpdate(category, mergedData);
  }

  /**
   * Merge data by timestamp (latest wins)
   */
  private mergeByTimestamp(local: unknown[], remote: unknown[], category: StateCategory): unknown[] {
    const merged = new Map<string, unknown>();
    
    // Add local items
    local.forEach(item => {
      const key = category.keyExtractor(item);
      merged.set(key, item);
    });
    
    // Add/update with remote items (newer timestamp wins)
    remote.forEach(item => {
      const key = category.keyExtractor(item);
      const remoteTimestamp = category.timestampExtractor(item);
      
      const existing = merged.get(key);
      if (!existing || category.timestampExtractor(existing) < remoteTimestamp) {
        merged.set(key, item);
      }
    });
    
    return Array.from(merged.values());
  }

  /**
   * Handle incremental update
   */
  handleIncrementalUpdate(category: string, operation: 'create' | 'update' | 'delete', item: unknown): void {
    if (!this.categories.has(category)) {
      return;
    }

    const categoryDef = this.categories.get(category)!;
    const localData = this.localState.get(category) || [];
    const itemKey = categoryDef.keyExtractor(item);

    let updatedData: unknown[];

    switch (operation) {
      case 'create':
      case 'update':
        updatedData = this.upsertItem(localData, item, categoryDef);
        break;
      case 'delete':
        updatedData = localData.filter(existing => 
          categoryDef.keyExtractor(existing) !== itemKey
        );
        break;
      default:
        return;
    }

    // Update local state
    this.localState.set(category, updatedData);
    this.updateStateChecksum(category, updatedData);

    // Notify about state update
    this.onStateUpdate(category, updatedData);
  }

  /**
   * Upsert item in local data
   */
  private upsertItem(localData: unknown[], item: unknown, category: StateCategory): unknown[] {
    const itemKey = category.keyExtractor(item);
    const existingIndex = localData.findIndex(existing =>
      category.keyExtractor(existing) === itemKey
    );

    if (existingIndex >= 0) {
      // Update existing item
      const updated = [...localData];
      updated[existingIndex] = item;
      return updated;
    } else {
      // Add new item
      return [...localData, item];
    }
  }

  /**
   * Update state checksum for category
   */
  private updateStateChecksum(category: string, data: unknown[]): void {
    this.state.stateChecksums[category] = this.validator.generateChecksum(data);
  }

  /**
   * Get current state for category
   */
  getState(category: string): unknown[] {
    return this.localState.get(category) || [];
  }

  /**
   * Get reconciliation statistics
   */
  getStats(): {
    lastReconciliation: number;
    reconciliationInProgress: boolean;
    pendingSnapshots: number;
    categoriesRegistered: number;
    totalItems: number;
  } {
    const totalItems = Array.from(this.localState.values())
      .reduce((sum, data) => sum + data.length, 0);

    return {
      lastReconciliation: this.state.lastReconciliationTime,
      reconciliationInProgress: this.state.reconciliationInProgress,
      pendingSnapshots: this.state.pendingSnapshots.size,
      categoriesRegistered: this.categories.size,
      totalItems
    };
  }

  /**
   * Force reconciliation for all categories
   */
  forceReconciliation(): Promise<void> {
    return this.startReconciliation();
  }

  /**
   * Check if reconciliation is needed
   */
  isReconciliationNeeded(): boolean {
    const timeSinceLastReconciliation = Date.now() - this.state.lastReconciliationTime;
    return timeSinceLastReconciliation > this.config.maxReconciliationIntervalMs;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.reconciliationTimer) {
      clearInterval(this.reconciliationTimer);
      this.reconciliationTimer = null;
    }

    this.snapshotTimeouts.forEach(timeout => clearTimeout(timeout));
    this.snapshotTimeouts.clear();
  }

  /**
   * Handle snapshot timeout
   */
  private handleSnapshotTimeout(correlationId: string, _category: string): void {
    this.state.pendingSnapshots.delete(correlationId);
    this.snapshotTimeouts.delete(correlationId);
    
    // If this was the last pending snapshot, mark reconciliation as complete
    if (this.state.pendingSnapshots.size === 0) {
      this.state.reconciliationInProgress = false;
    }
  }

  /**
   * Handle reconciliation error
   */
  private handleReconciliationError(_category: string, _error: Error): void {
    this.state.reconciliationInProgress = false;
    // Log error but don't throw - reconciliation will be retried later
  }

  /**
   * Start periodic reconciliation
   */
  private startPeriodicReconciliation(): void {
    this.reconciliationTimer = setInterval(() => {
      if (this.isReconciliationNeeded() && !this.state.reconciliationInProgress) {
        this.startReconciliation().catch(() => {
          // Reconciliation failed, will retry on next interval
        });
      }
    }, this.config.maxReconciliationIntervalMs);
  }

  /**
   * Create initial reconciliation state
   */
  private createInitialState(): ReconciliationState {
    return {
      lastReconciliationTime: 0,
      pendingSnapshots: new Set(),
      reconciliationInProgress: false,
      lastSyncTimestamp: {},
      stateChecksums: {}
    };
  }

  /**
   * Initialize default state categories
   */
  private initializeDefaultCategories(): void {
    // Props category
    this.registerCategory({
      name: 'props',
      validator: (data: unknown) => Array.isArray(data),
      merger: (local, remote) => remote, // Server wins for props
      keyExtractor: (item: unknown) => {
        const record = item as Record<string, unknown>;
        return String(record.id || record.propId || 'unknown');
      },
      timestampExtractor: (item: unknown) => {
        const record = item as Record<string, unknown>;
        return new Date(String(record.updated || record.timestamp || Date.now())).getTime();
      }
    });

    // Odds category
    this.registerCategory({
      name: 'odds',
      validator: (data: unknown) => Array.isArray(data),
      merger: (local, remote) => remote, // Server wins for odds
      keyExtractor: (item: unknown) => {
        const record = item as Record<string, unknown>;
        return `${record.propId || 'unknown'}-${record.sportsbook || 'unknown'}`;
      },
      timestampExtractor: (item: unknown) => {
        const record = item as Record<string, unknown>;
        return new Date(String(record.timestamp || record.updated || Date.now())).getTime();
      }
    });

    // Games category
    this.registerCategory({
      name: 'games',
      validator: (data: unknown) => Array.isArray(data),
      merger: (local, remote) => remote, // Server wins for games
      keyExtractor: (item: unknown) => {
        const record = item as Record<string, unknown>;
        return String(record.id || record.gameId || 'unknown');
      },
      timestampExtractor: (item: unknown) => {
        const record = item as Record<string, unknown>;
        return new Date(String(record.updated || record.lastUpdate || Date.now())).getTime();
      }
    });
  }
}

/**
 * Default state validator implementation
 */
class DefaultStateValidator implements WSStateValidator {
  validateState(state: unknown): WSValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(state)) {
      errors.push('State must be an array');
      return { isValid: false, errors, warnings };
    }

    // Basic validation - can be extended
    if (state.length > 10000) {
      warnings.push('Large state array may impact performance');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  generateChecksum(state: unknown): string {
    const stateStr = typeof state === 'object' && state !== null
      ? JSON.stringify(state, Object.keys(state as object).sort())
      : JSON.stringify(state);
    return this.simpleHash(stateStr);
  }

  compareChecksums(local: string, remote: string): boolean {
    return local === remote;
  }

  diff(localState: unknown, remoteState: unknown): WSStateDiff[] {
    // Simple diff implementation - can be enhanced with deep comparison
    const diffs: WSStateDiff[] = [];
    
    if (JSON.stringify(localState) !== JSON.stringify(remoteState)) {
      diffs.push({
        path: 'root',
        operation: 'change',
        oldValue: localState,
        newValue: remoteState,
        timestamp: Date.now()
      });
    }

    return diffs;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}