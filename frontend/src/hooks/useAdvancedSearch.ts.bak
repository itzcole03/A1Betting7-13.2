/**
 * React Hook for Advanced Search
 * Provides comprehensive search functionality with caching and state management
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { ConsolidatedCacheManager } from '../services/ConsolidatedCacheManager';

export interface FilterCondition {
  field: string;
  operator: string;
  value: any;
  dataType: string;
  caseSensitive: boolean;
}

export interface SearchQuery {
  conditions: FilterCondition[];
  logicOperator: string;
  textSearch: string;
  textFields: string[];
  sortBy: string;
  sortOrder: string;
  limit: number;
  offset: number;
}

export interface SearchResult {
  items: any[];
  totalCount: number;
  filteredCount: number;
  facets: Array<{
    field: string;
    values: { [key: string]: number };
  }>;
  queryTimeMs: number;
}

export interface UseAdvancedSearchOptions {
  dataType: 'players' | 'odds' | 'custom';
  cacheResults?: boolean;
  cacheTTL?: number;
  autoSearch?: boolean;
  debounceMs?: number;
}

export interface UseAdvancedSearchReturn {
  // State
  query: SearchQuery;
  results: SearchResult | null;
  isLoading: boolean;
  error: string | null;
  
  // Search actions
  executeSearch: (customQuery?: Partial<SearchQuery>) => Promise<void>;
  updateQuery: (updates: Partial<SearchQuery>) => void;
  addCondition: (condition: Partial<FilterCondition>) => void;
  updateCondition: (index: number, updates: Partial<FilterCondition>) => void;
  removeCondition: (index: number) => void;
  clearQuery: () => void;
  
  // Utility actions
  getSuggestions: (field: string, text: string) => Promise<string[]>;
  getFieldStatistics: (field: string) => Promise<any>;
  saveSearch: (name: string, description?: string) => Promise<void>;
  loadSavedSearch: (searchId: string) => Promise<void>;
  exportResults: (format: 'csv' | 'json') => void;
  
  // Meta data
  availableFields: { [key: string]: string };
  operators: { [key: string]: string[] };
  savedSearches: any[];
  searchHistory: any[];
}

export const useAdvancedSearch = (options: UseAdvancedSearchOptions): UseAdvancedSearchReturn => {
  const {
    dataType,
    cacheResults = true,
    cacheTTL = 300000, // 5 minutes
    autoSearch = false,
    debounceMs = 500
  } = options;

  // State
  const [query, setQuery] = useState<SearchQuery>({
    conditions: [],
    logicOperator: 'AND',
    textSearch: '',
    textFields: [],
    sortBy: '',
    sortOrder: 'asc',
    limit: 50,
    offset: 0
  });

  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableFields, setAvailableFields] = useState<{ [key: string]: string }>({});
  const [operators, setOperators] = useState<{ [key: string]: string[] }>({});
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);

  // Cache manager
  const cache = useMemo(() => new ConsolidatedCacheManager(), []);

  // Initialize cache
  useEffect(() => {
    cache.initializeCache('search_results', { maxSize: 100, ttl: cacheTTL });
    cache.initializeCache('search_metadata', { maxSize: 50, ttl: 3600000 }); // 1 hour
  }, [cache, cacheTTL]);

  // Load metadata on mount
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        // Try to get from cache first
        const cachedFields = cache.get('search_metadata', `fields_${dataType}`);
        const cachedOperators = cache.get('search_metadata', 'operators');

        if (cachedFields && cachedOperators) {
          setAvailableFields(cachedFields);
          setOperators(cachedOperators);
          return;
        }

        // Fetch from API
        const [fieldsResponse, operatorsResponse] = await Promise.all([
          fetch('/api/v1/search/fields'),
          fetch('/api/v1/search/operators')
        ]);

        if (fieldsResponse.ok) {
          const fieldsData = await fieldsResponse.json();
          const fields = fieldsData[dataType] || {};
          setAvailableFields(fields);
          cache.set('search_metadata', `fields_${dataType}`, fields);
        }

        if (operatorsResponse.ok) {
          const operatorsData = await operatorsResponse.json();
          setOperators(operatorsData);
          cache.set('search_metadata', 'operators', operatorsData);
        }
      } catch (error) {
        console.error('Failed to load search metadata:', error);
        setError('Failed to load search metadata');
      }
    };

    loadMetadata();
  }, [dataType, cache]);

  // Load saved searches
  useEffect(() => {
    const loadSavedSearches = async () => {
      try {
        const cached = cache.get('search_metadata', 'saved_searches');
        if (cached) {
          setSavedSearches(cached);
          return;
        }

        const response = await fetch('/api/v1/search/saved-searches');
        if (response.ok) {
          const searches = await response.json();
          setSavedSearches(searches);
          cache.set('search_metadata', 'saved_searches', searches);
        }
      } catch (error) {
        console.error('Failed to load saved searches:', error);
      }
    };

    loadSavedSearches();
  }, [cache]);

  // Auto-search with debouncing
  useEffect(() => {
    if (!autoSearch) return;

    const timeoutId = setTimeout(() => {
      if (query.textSearch || query.conditions.length > 0) {
        executeSearch();
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, autoSearch, debounceMs]);

  // Generate cache key for query
  const getCacheKey = useCallback((searchQuery: SearchQuery) => {
    return `search_${dataType}_${JSON.stringify(searchQuery)}`;
  }, [dataType]);

  // Execute search
  const executeSearch = useCallback(async (customQuery?: Partial<SearchQuery>) => {
    const searchQuery = customQuery ? { ...query, ...customQuery } : query;
    
    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      if (cacheResults) {
        const cacheKey = getCacheKey(searchQuery);
        const cachedResult = cache.get('search_results', cacheKey);
        if (cachedResult) {
          setResults(cachedResult);
          setIsLoading(false);
          return;
        }
      }

      let endpoint = '/api/v1/search/execute';
      let requestOptions: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: {
            conditions: searchQuery.conditions.map(condition => ({
              field: condition.field,
              operator: condition.operator,
              value: condition.value,
              data_type: condition.dataType,
              case_sensitive: condition.caseSensitive
            })),
            logic_operator: searchQuery.logicOperator,
            text_search: searchQuery.textSearch || null,
            text_fields: searchQuery.textFields,
            sort_by: searchQuery.sortBy || null,
            sort_order: searchQuery.sortOrder,
            limit: searchQuery.limit,
            offset: searchQuery.offset
          },
          data: [], // This would be populated with actual data in a real implementation
          facet_fields: Object.keys(availableFields).slice(0, 5)
        })
      };

      // Use specific endpoints for players and odds
      if (dataType === 'players' || dataType === 'odds') {
        endpoint = `/api/v1/search/${dataType}`;
        const params = new URLSearchParams();
        
        if (searchQuery.textSearch) {
          params.append(dataType === 'players' ? 'player_name' : 'player_name', searchQuery.textSearch);
        }
        
        searchQuery.conditions.forEach(condition => {
          if (condition.value) {
            const paramName = condition.field === 'provider' ? 'sportsbook' : condition.field;
            params.append(paramName, condition.value);
          }
        });

        if (searchQuery.limit) params.append('limit', searchQuery.limit.toString());
        if (searchQuery.offset) params.append('offset', searchQuery.offset.toString());

        endpoint += params.toString() ? `?${params.toString()}` : '';
        requestOptions = { method: 'GET' };
      }

      const response = await fetch(endpoint, requestOptions);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const searchResults = await response.json();
      
      // Cache results
      if (cacheResults) {
        const cacheKey = getCacheKey(searchQuery);
        cache.set('search_results', cacheKey, searchResults);
      }

      setResults(searchResults);
      
      // Add to search history
      const historyEntry = {
        query: searchQuery,
        timestamp: new Date().toISOString(),
        resultCount: searchResults.filteredCount,
        queryTime: searchResults.queryTimeMs
      };
      
      setSearchHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [query, dataType, cacheResults, getCacheKey, cache, availableFields]);

  // Update query
  const updateQuery = useCallback((updates: Partial<SearchQuery>) => {
    setQuery(prev => ({ ...prev, ...updates }));
  }, []);

  // Add condition
  const addCondition = useCallback((condition: Partial<FilterCondition>) => {
    const newCondition: FilterCondition = {
      field: Object.keys(availableFields)[0] || '',
      operator: 'eq',
      value: '',
      dataType: 'string',
      caseSensitive: false,
      ...condition
    };

    setQuery(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  }, [availableFields]);

  // Update condition
  const updateCondition = useCallback((index: number, updates: Partial<FilterCondition>) => {
    setQuery(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) =>
        i === index ? { ...condition, ...updates } : condition
      )
    }));
  }, []);

  // Remove condition
  const removeCondition = useCallback((index: number) => {
    setQuery(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  }, []);

  // Clear query
  const clearQuery = useCallback(() => {
    setQuery({
      conditions: [],
      logicOperator: 'AND',
      textSearch: '',
      textFields: [],
      sortBy: '',
      sortOrder: 'asc',
      limit: 50,
      offset: 0
    });
    setResults(null);
    setError(null);
  }, []);

  // Get suggestions
  const getSuggestions = useCallback(async (field: string, text: string): Promise<string[]> => {
    try {
      const cacheKey = `suggestions_${field}_${text}`;
      const cached = cache.get('search_metadata', cacheKey);
      if (cached) return cached;

      const response = await fetch(
        `/api/v1/search/suggestions/${field}?text=${encodeURIComponent(text)}&data_type=${dataType}`
      );

      if (response.ok) {
        const suggestions = await response.json();
        cache.set('search_metadata', cacheKey, suggestions);
        return suggestions;
      }
      return [];
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }, [dataType, cache]);

  // Get field statistics
  const getFieldStatistics = useCallback(async (field: string): Promise<any> => {
    try {
      const cacheKey = `stats_${field}`;
      const cached = cache.get('search_metadata', cacheKey);
      if (cached) return cached;

      const response = await fetch(`/api/v1/search/statistics/${field}?data_type=${dataType}`);
      
      if (response.ok) {
        const stats = await response.json();
        cache.set('search_metadata', cacheKey, stats);
        return stats;
      }
      return null;
    } catch (error) {
      console.error('Failed to get field statistics:', error);
      return null;
    }
  }, [dataType, cache]);

  // Save search
  const saveSearch = useCallback(async (name: string, description?: string): Promise<void> => {
    try {
      const response = await fetch('/api/v1/search/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, query, description })
      });

      if (response.ok) {
        // Refresh saved searches
        cache.delete('search_metadata', 'saved_searches');
        const searchesResponse = await fetch('/api/v1/search/saved-searches');
        if (searchesResponse.ok) {
          const searches = await searchesResponse.json();
          setSavedSearches(searches);
          cache.set('search_metadata', 'saved_searches', searches);
        }
      }
    } catch (error) {
      console.error('Failed to save search:', error);
      throw error;
    }
  }, [query, cache]);

  // Load saved search
  const loadSavedSearch = useCallback(async (searchId: string): Promise<void> => {
    try {
      const savedSearch = savedSearches.find(s => s.id === searchId);
      if (savedSearch) {
        setQuery(savedSearch.query);
      }
    } catch (error) {
      console.error('Failed to load saved search:', error);
      throw error;
    }
  }, [savedSearches]);

  // Export results
  const exportResults = useCallback((format: 'csv' | 'json') => {
    if (!results) return;

    const data = results.items;
    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      // Convert to CSV
      if (data.length === 0) return;
      
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(item => 
          headers.map(header => {
            const value = item[header];
            return typeof value === 'string' && value.includes(',') 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search_results_${dataType}_${timestamp}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      // Export as JSON
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search_results_${dataType}_${timestamp}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }, [results, dataType]);

  return {
    // State
    query,
    results,
    isLoading,
    error,
    
    // Search actions
    executeSearch,
    updateQuery,
    addCondition,
    updateCondition,
    removeCondition,
    clearQuery,
    
    // Utility actions
    getSuggestions,
    getFieldStatistics,
    saveSearch,
    loadSavedSearch,
    exportResults,
    
    // Meta data
    availableFields,
    operators,
    savedSearches,
    searchHistory
  };
};

export default useAdvancedSearch;
