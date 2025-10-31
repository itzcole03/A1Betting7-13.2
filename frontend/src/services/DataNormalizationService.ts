/**
 * Data Normalization and Deduplication Service
 * 
 * Provides utilities for:
 * - Normalizing data across different source formats
 * - Deduplicating similar opportunities
 * - Merging data from multiple sources
 * - Creating stable identifiers
 */

export interface NormalizedOpportunity {
  id: string;
  normalizedAt: number;
  source: string;
  sourceId?: string;
  fingerprint: string; // Hash for deduplication
  player?: string;
  team?: string;
  opponent?: string;
  sport?: string;
  market?: string;
  stat?: string;
  line?: number;
  odds?: number;
  confidence?: number;
  edge?: number;
  lastUpdated?: string;
  metadata?: Record<string, any>;
}

export class DataNormalizationService {
  private normalizationCache: Map<string, NormalizedOpportunity> = new Map();
  private deduplicationMap: Map<string, string[]> = new Map(); // fingerprint -> ids

  /**
   * Normalize an opportunity from any source format
   */
  normalizeOpportunity(
    raw: Record<string, any>,
    source: string = 'unknown'
  ): NormalizedOpportunity {
    // Create a stable identifier
    const id = this.createStableId(raw);

    // Extract normalized fields
    const normalized: NormalizedOpportunity = {
      id,
      normalizedAt: Date.now(),
      source,
      sourceId: this.extractSourceId(raw),
      fingerprint: this.createFingerprint(raw),
      player: this.extractField(raw, 'player', 'player_name', 'name'),
      team: this.extractField(raw, 'team', 'team_name'),
      opponent: this.extractField(raw, 'opponent', 'opponent_name'),
      sport: this.extractField(raw, 'sport', 'league'),
      market: this.extractField(raw, 'market', 'market_type', 'stat_type'),
      stat: this.extractField(raw, 'stat', 'stat_type'),
      line: this.extractNumber(raw, 'line', 'line_score', 'threshold'),
      odds: this.extractNumber(raw, 'odds', 'price', 'odds_value'),
      confidence: this.extractNumber(raw, 'confidence', 'confidence_pct'),
      edge: this.extractNumber(raw, 'edge', 'ev_percent'),
      lastUpdated: this.extractString(raw, 'lastUpdated', 'last_updated', 'updated_at'),
      metadata: {
        ...raw,
        _normalized: true,
      },
    };

    return normalized;
  }

  /**
   * Deduplicate opportunities based on fingerprint matching
   */
  deduplicate(opportunities: NormalizedOpportunity[]): NormalizedOpportunity[] {
    const seen = new Set<string>();
    const deduped: NormalizedOpportunity[] = [];

    for (const opp of opportunities) {
      if (!seen.has(opp.fingerprint)) {
        seen.add(opp.fingerprint);
        deduped.push(opp);

        // Track all IDs with this fingerprint
        if (!this.deduplicationMap.has(opp.fingerprint)) {
          this.deduplicationMap.set(opp.fingerprint, []);
        }
        this.deduplicationMap.get(opp.fingerprint)!.push(opp.id);
      }
    }

    return deduped;
  }

  /**
   * Merge opportunities from multiple sources into a single record
   */
  mergeOpportunities(opportunities: NormalizedOpportunity[]): NormalizedOpportunity {
    if (opportunities.length === 0) {
      throw new Error('Cannot merge empty opportunity array');
    }

    if (opportunities.length === 1) {
      return opportunities[0];
    }

    // Sort by most recent first
    const sorted = opportunities.sort(
      (a, b) => (b.normalizedAt ?? 0) - (a.normalizedAt ?? 0)
    );

    const primary = sorted[0];

    // Merge metadata from all sources
    const mergedMetadata: Record<string, any> = {};
    for (const opp of sorted) {
      Object.assign(mergedMetadata, opp.metadata);
    }

    return {
      ...primary,
      metadata: {
        ...mergedMetadata,
        sources: sorted.map(o => o.source),
        sourceIds: sorted.map(o => o.sourceId).filter(Boolean),
        mergedAt: Date.now(),
      },
    };
  }

  /**
   * Get all opportunities that are duplicates of a given fingerprint
   */
  getDuplicates(fingerprint: string): string[] {
    return this.deduplicationMap.get(fingerprint) || [];
  }

  /**
   * Clear normalization cache
   */
  clearCache(): void {
    this.normalizationCache.clear();
    this.deduplicationMap.clear();
  }

  // Private helpers

  private createStableId(raw: Record<string, any>): string {
    // Try to extract or create a stable identifier
    const candidates = [
      raw.id,
      raw.opportunityId,
      raw.opportunity_id,
      raw.eventId,
      raw.event_id,
      raw.propId,
      raw.prop_id,
    ];

    for (const candidate of candidates) {
      if (candidate && typeof candidate === 'string') {
        return candidate;
      }
    }

    // Generate a pseudo-stable ID from player and market
    const player = this.extractField(raw, 'player', 'player_name', 'name') || 'unknown';
    const market = this.extractField(raw, 'market', 'market_type', 'stat_type') || 'unknown';
    const sport = this.extractField(raw, 'sport', 'league') || 'unknown';

    return `${sport}-${player}-${market}`.toLowerCase().replace(/\s+/g, '-');
  }

  private createFingerprint(raw: Record<string, any>): string {
    // Create a hash from key identifying fields
    const fields = [
      this.extractField(raw, 'player', 'player_name', 'name'),
      this.extractField(raw, 'stat', 'stat_type'),
      this.extractNumber(raw, 'line', 'line_score', 'threshold'),
      this.extractField(raw, 'sport', 'league'),
    ];

    const fingerprintStr = JSON.stringify(fields);

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprintStr.length; i++) {
      const char = fingerprintStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return `fp-${Math.abs(hash).toString(36)}`;
  }

  private extractSourceId(raw: Record<string, any>): string | undefined {
    const candidates = ['sourceId', 'source_id', 'externalId', 'external_id', 'providerId'];
    for (const candidate of candidates) {
      const value = raw[candidate];
      if (value) return String(value);
    }
    return undefined;
  }

  private extractField(raw: Record<string, any>, ...fieldNames: string[]): string | undefined {
    for (const fieldName of fieldNames) {
      const value = raw[fieldName];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
      if (typeof value === 'number') {
        return String(value);
      }
    }
    return undefined;
  }

  private extractNumber(raw: Record<string, any>, ...fieldNames: string[]): number | undefined {
    for (const fieldName of fieldNames) {
      const value = raw[fieldName];
      if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
        return value;
      }
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        if (!isNaN(parsed) && isFinite(parsed)) {
          return parsed;
        }
      }
    }
    return undefined;
  }

  private extractString(raw: Record<string, any>, ...fieldNames: string[]): string | undefined {
    for (const fieldName of fieldNames) {
      const value = raw[fieldName];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return undefined;
  }
}

// Global instance
let instance: DataNormalizationService | null = null;

export function getDataNormalizationService(): DataNormalizationService {
  if (!instance) {
    instance = new DataNormalizationService();
  }
  return instance;
}

export const dataNormalizationService = getDataNormalizationService();
