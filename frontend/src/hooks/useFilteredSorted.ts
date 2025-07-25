import { useMemo } from 'react';

export interface FilterSortOptions {
  sport?: string;
  searchTerm?: string;
  sortBy?: 'confidence' | 'value' | 'player';
  timeFilter?: 'today' | 'tomorrow' | 'week' | 'all';
}

export function useFilteredSorted<
  T extends {
    sport?: string;
    player?: string;
    team?: string;
    confidence?: number;
    value?: number;
    gameTime?: string;
  }
>(items: T[], options: FilterSortOptions): T[] {
  return useMemo(() => {
    let filtered = items;
    if (options.sport && options.sport !== 'All') {
      filtered = filtered.filter(item => item.sport === options.sport);
    }
    if (options.searchTerm) {
      const term = options.searchTerm.toLowerCase();
      filtered = filtered.filter(
        item =>
          (item.player && item.player.toLowerCase().includes(term)) ||
          (item.team && item.team.toLowerCase().includes(term))
      );
    }
    if (options.timeFilter && items[0]?.gameTime) {
      const today = new Date().toDateString();
      filtered = filtered.filter(item => {
        if (!item.gameTime) return true;
        const gameDate = new Date(item.gameTime).toDateString();
        if (options.timeFilter === 'today') return gameDate === today;
        // Extend for other time filters as needed
        return true;
      });
    }
    if (options.sortBy) {
      filtered = [...filtered].sort((a, b) => {
        if (options.sortBy === 'confidence') return (b.confidence ?? 0) - (a.confidence ?? 0);
        if (options.sortBy === 'value') return (b.value ?? 0) - (a.value ?? 0);
        if (options.sortBy === 'player') return (a.player ?? '').localeCompare(b.player ?? '');
        return 0;
      });
    }
    return filtered;
  }, [items, options]);
}
