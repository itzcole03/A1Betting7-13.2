/**
 * BookmarkService - Local-first bookmark persistence with backend-ready abstraction
 * Phase 4.2 implementation using localStorage with prepared API integration stubs
 */

export interface BookmarkData {
  opportunityId: string;
  userId?: string;
  timestamp: number;
  metadata?: {
    player?: string;
    market?: string;
    sport?: string;
    evPercent?: number;
  };
}

export interface BookmarkSyncResult {
  success: boolean;
  syncedCount: number;
  errors?: string[];
}

class BookmarkService {
  private static instance: BookmarkService;
  private readonly STORAGE_KEY = 'propfinder.bookmarks';
  private readonly SYNC_QUEUE_KEY = 'propfinder.bookmarks.syncQueue';
  
  // In-memory cache for performance
  private bookmarks: Set<string> = new Set();
  private initialized = false;
  // Fallback snapshot to handle environments/tests where localStorage.getItem
  // returns null or storage is unavailable. Maintains last known bookmark list
  // so recently added metadata can still be retrieved.
  private lastSnapshot: BookmarkData[] = [];
  private readonly MAX_SNAPSHOT_ENTRIES = 5000;

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): BookmarkService {
    if (!BookmarkService.instance) {
      BookmarkService.instance = new BookmarkService();
    }
    return BookmarkService.instance;
  }

  /**
   * Initialize the service and load existing bookmarks
   */
  private loadFromStorage(): void {
    try {
      if (typeof localStorage === 'undefined') {
        // localStorage not available in this environment
        this.initialized = true;
        return;
      }

      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const bookmarkData: BookmarkData[] = JSON.parse(stored);
        this.bookmarks = new Set(bookmarkData.map(b => b.opportunityId));
        this.lastSnapshot = bookmarkData;
      }

      this.initialized = true;
    } catch {
      // Failed to load bookmarks from storage, continue with empty set
      this.bookmarks = new Set();
      this.lastSnapshot = [];
      this.initialized = true;
    }
  }

  /**
   * Save bookmarks to localStorage
   */
  private saveToStorage(bookmarkDataArray: BookmarkData[]): void {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bookmarkDataArray));
    } catch {
      // Failed to save - continue without persisting
    }
  }

  /**
   * Get all bookmark data with metadata
   */
  private getAllBookmarkData(): BookmarkData[] {
    try {
      if (typeof localStorage === 'undefined') {
        return this.lastSnapshot.length ? [...this.lastSnapshot] : [];
      }

      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed: BookmarkData[] = JSON.parse(stored);
        if (parsed && parsed.length) {
          this.lastSnapshot = parsed;
        }
        return parsed;
      }
      return this.lastSnapshot.length ? [...this.lastSnapshot] : [];
    } catch {
      return this.lastSnapshot.length ? [...this.lastSnapshot] : [];
    }
  }

  /**
   * Persist current snapshot explicitly (used in tests or deferred write strategies)
   */
  flushToStorage(): void {
    if (!this.lastSnapshot.length) return;
    try {
      this.saveToStorage(this.lastSnapshot);
    } catch {
      // Swallow errors - non critical
    }
  }

  /**
   * Check if an opportunity is bookmarked
   */
  isBookmarked(opportunityId: string): boolean {
    if (!this.initialized) {
      this.loadFromStorage();
    }
    return this.bookmarks.has(opportunityId);
  }

  /**
   * Add a bookmark
   */
  addBookmark(
    opportunityId: string, 
    metadata?: { 
      player?: string; 
      market?: string; 
      sport?: string; 
      evPercent?: number;
    }
  ): boolean {
    try {
      if (!this.initialized) {
        this.loadFromStorage();
      }

      // Add to in-memory cache
      this.bookmarks.add(opportunityId);

      // Update localStorage with metadata
      const allBookmarks = this.getAllBookmarkData();
      const existing = allBookmarks.find(b => b.opportunityId === opportunityId);
      
      if (!existing) {
        const newBookmark: BookmarkData = {
          opportunityId,
          timestamp: Date.now(),
          metadata,
        };
        allBookmarks.push(newBookmark);
      } else {
        // Update existing bookmark metadata
        existing.timestamp = Date.now();
        existing.metadata = { ...existing.metadata, ...metadata };
      }

      this.saveToStorage(allBookmarks);
      this.lastSnapshot = allBookmarks;
      if (this.lastSnapshot.length > this.MAX_SNAPSHOT_ENTRIES) {
        // Trim oldest entries (simple FIFO) to avoid unbounded memory
        const overflow = this.lastSnapshot.length - this.MAX_SNAPSHOT_ENTRIES;
        if (overflow > 0) {
          this.lastSnapshot.splice(0, overflow);
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove a bookmark
   */
  removeBookmark(opportunityId: string): boolean {
    try {
      if (!this.initialized) {
        this.loadFromStorage();
      }

      // Remove from in-memory cache
      this.bookmarks.delete(opportunityId);

      // Update localStorage
      const allBookmarks = this.getAllBookmarkData();
      const filtered = allBookmarks.filter(b => b.opportunityId !== opportunityId);
      this.saveToStorage(filtered);
      this.lastSnapshot = filtered;

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Toggle bookmark status
   */
  toggleBookmark(
    opportunityId: string,
    metadata?: {
      player?: string;
      market?: string;
      sport?: string;
      evPercent?: number;
    }
  ): boolean {
    if (this.isBookmarked(opportunityId)) {
      this.removeBookmark(opportunityId);
      return false;
    } else {
      this.addBookmark(opportunityId, metadata);
      return true;
    }
  }

  /**
   * Get all bookmarked opportunity IDs
   */
  getAllBookmarkIds(): string[] {
    if (!this.initialized) {
      this.loadFromStorage();
    }
    return Array.from(this.bookmarks);
  }

  /**
   * Get all bookmark data with metadata
   */
  getAllBookmarks(): BookmarkData[] {
    return this.getAllBookmarkData();
  }

  /**
   * Get bookmark count
   */
  getBookmarkCount(): number {
    if (!this.initialized) {
      this.loadFromStorage();
    }
    return this.bookmarks.size;
  }

  /**
   * Clear all bookmarks
   */
  clearAllBookmarks(): boolean {
    try {
      this.bookmarks.clear();
      
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.SYNC_QUEUE_KEY);
      }
      this.lastSnapshot = [];

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Export bookmarks for backup or analysis
   */
  exportBookmarks(): string {
    return JSON.stringify(this.getAllBookmarkData(), null, 2);
  }

  /**
   * Import bookmarks from JSON string
   */
  importBookmarks(jsonString: string, merge: boolean = false): { success: boolean; count: number } {
    try {
      const importedData: BookmarkData[] = JSON.parse(jsonString);
      
      if (!Array.isArray(importedData)) {
        throw new Error('Invalid bookmark data format');
      }

      const existingData = merge ? this.getAllBookmarkData() : [];
      
      // Merge with existing data, avoiding duplicates
      for (const bookmark of importedData) {
        const exists = existingData.some(b => b.opportunityId === bookmark.opportunityId);
        if (!exists) {
          existingData.push(bookmark);
          this.bookmarks.add(bookmark.opportunityId);
        }
      }

      this.saveToStorage(existingData);
      this.lastSnapshot = existingData;
      if (this.lastSnapshot.length > this.MAX_SNAPSHOT_ENTRIES) {
        const overflow = this.lastSnapshot.length - this.MAX_SNAPSHOT_ENTRIES;
        if (overflow > 0) {
          this.lastSnapshot.splice(0, overflow);
        }
      }
      return { success: true, count: importedData.length };
    } catch {
      return { success: false, count: 0 };
    }
  }

  // === BACKEND INTEGRATION STUBS (Future Implementation) ===

  /**
   * STUB: Sync local bookmarks to backend API
   */
  async syncToBackend(_userId: string): Promise<BookmarkSyncResult> {
    // TODO: Implement when backend bookmark API is available
    return {
      success: false,
      syncedCount: 0,
      errors: ['Backend sync not implemented']
    };
  }

  /**
   * STUB: Load bookmarks from backend API
   */
  async loadFromBackend(_userId: string): Promise<BookmarkSyncResult> {
    // TODO: Implement when backend bookmark API is available
    return {
      success: false,
      syncedCount: 0,
      errors: ['Backend load not implemented']
    };
  }

  /**
   * STUB: Enable automatic sync with backend
   */
  enableAutoSync(_userId: string, _intervalMs: number = 300000): void {
    // TODO: Implement when backend bookmark API is available
  }

  /**
   * Get service status and configuration
   */
  getStatus(): {
    initialized: boolean;
    storageAvailable: boolean;
    bookmarkCount: number;
    lastSync?: Date;
    backendEnabled: boolean;
  } {
    return {
      initialized: this.initialized,
      storageAvailable: typeof localStorage !== 'undefined',
      bookmarkCount: this.getBookmarkCount(),
      lastSync: undefined, // TODO: Track when backend sync is implemented
      backendEnabled: false, // TODO: Set to true when backend is ready
    };
  }
}

// Export singleton instance
export const bookmarkService = BookmarkService.getInstance();

// Telemetry logging for EV integration
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    const status = bookmarkService.getStatus();
    // eslint-disable-next-line no-console
    console.info('[PropFinder] EV integration active with BookmarkService', {
      bookmarkCount: status.bookmarkCount,
      storageAvailable: status.storageAvailable,
    });
  });
}