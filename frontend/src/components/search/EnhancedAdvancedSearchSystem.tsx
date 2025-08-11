/**
 * Enhanced Advanced Search System
 * Phase 3: Comprehensive search and filtering capabilities
 * 
 * Features:
 * - Real-time multi-field search
 * - Advanced filtering with facets
 * - Saved searches and query history
 * - Intelligent autocomplete
 * - Export capabilities
 * - AI-powered search suggestions
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Save, 
  History, 
  Download,
  Brain,
  Zap,
  Layers,
  Settings,
  Bookmark,
  Clock,
  Star,
  X,
  Plus,
  ChevronDown,
  TrendingUp,
  BarChart3,
  Eye,
  Target
} from 'lucide-react';

import { useAdvancedSearch } from '../../hooks/useAdvancedSearch';

interface SearchFilter {
  id: string;
  name: string;
  field: string;
  type: 'text' | 'number' | 'date' | 'select' | 'range' | 'boolean';
  operator: string;
  value: any;
  options?: string[];
  enabled: boolean;
}

interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  query: any;
  createdAt: string;
  lastUsed: string;
  useCount: number;
  tags: string[];
  isPublic: boolean;
}

interface SmartSuggestion {
  type: 'ai' | 'trending' | 'recent' | 'popular';
  text: string;
  confidence: number;
  metadata: any;
}

interface EnhancedAdvancedSearchSystemProps {
  dataType: 'players' | 'odds' | 'props' | 'games' | 'teams';
  onResultsChange?: (results: any) => void;
  enableAI?: boolean;
  enableExport?: boolean;
  enableSavedSearches?: boolean;
  maxResults?: number;
  className?: string;
}

const EnhancedAdvancedSearchSystem: React.FC<EnhancedAdvancedSearchSystemProps> = ({
  dataType,
  onResultsChange,
  enableAI = true,
  enableExport = true,
  enableSavedSearches = true,
  maxResults = 100,
  className = ''
}) => {
  // Search hook
  const {
    query,
    results,
    isLoading,
    error,
    executeSearch,
    updateQuery,
    addCondition,
    removeCondition,
    clearQuery,
    getSuggestions,
    saveSearch,
    loadSavedSearch,
    exportResults,
    availableFields,
    savedSearches,
    searchHistory
  } = useAdvancedSearch({ dataType, autoSearch: false });

  // Component state
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'filters' | 'saved' | 'history'>('search');
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number>(-1);

  // Field configurations based on data type
  const fieldConfigurations = useMemo(() => {
    switch (dataType) {
      case 'players':
        return {
          name: { type: 'text', label: 'Player Name', operators: ['contains', 'equals', 'starts_with'] },
          team: { type: 'select', label: 'Team', operators: ['equals', 'in'] },
          position: { type: 'select', label: 'Position', operators: ['equals', 'in'] },
          sport: { type: 'select', label: 'Sport', operators: ['equals'] },
          age: { type: 'range', label: 'Age', operators: ['range', 'equals', 'greater_than', 'less_than'] },
          salary: { type: 'range', label: 'Salary', operators: ['range', 'greater_than', 'less_than'] },
          isActive: { type: 'boolean', label: 'Active Status', operators: ['equals'] }
        };
      case 'odds':
        return {
          sportsbook: { type: 'select', label: 'Sportsbook', operators: ['equals', 'in'] },
          sport: { type: 'select', label: 'Sport', operators: ['equals'] },
          market: { type: 'select', label: 'Market Type', operators: ['equals', 'in'] },
          odds: { type: 'range', label: 'Odds', operators: ['range', 'greater_than', 'less_than'] },
          line: { type: 'range', label: 'Line', operators: ['range', 'equals'] },
          date: { type: 'date', label: 'Game Date', operators: ['equals', 'range', 'after', 'before'] }
        };
      case 'props':
        return {
          playerName: { type: 'text', label: 'Player', operators: ['contains', 'equals'] },
          propType: { type: 'select', label: 'Prop Type', operators: ['equals', 'in'] },
          line: { type: 'range', label: 'Line', operators: ['range', 'equals'] },
          prediction: { type: 'range', label: 'Prediction', operators: ['range', 'greater_than'] },
          confidence: { type: 'range', label: 'Confidence', operators: ['range', 'greater_than'] },
          ev: { type: 'range', label: 'Expected Value', operators: ['range', 'greater_than'] },
          sport: { type: 'select', label: 'Sport', operators: ['equals'] }
        };
      default:
        return {};
    }
  }, [dataType]);

  // Generate smart suggestions
  const generateSmartSuggestions = useCallback(async (text: string) => {
    if (!enableAI || text.length < 2) {
      setSmartSuggestions([]);
      return;
    }

    try {
      // AI-powered suggestions
      const aiResponse = await fetch('/api/v1/search/ai-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          dataType, 
          context: { recentSearches: searchHistory.slice(0, 5) }
        })
      });

      if (aiResponse.ok) {
        const aiSuggestions = await aiResponse.json();
        setSmartSuggestions(aiSuggestions.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
    }
  }, [enableAI, dataType, searchHistory]);

  // Handle search text change
  const handleSearchTextChange = useCallback((text: string) => {
    setSearchText(text);
    updateQuery({ textSearch: text });
    generateSmartSuggestions(text);
  }, [updateQuery, generateSmartSuggestions]);

  // Add new filter
  const addFilter = useCallback(() => {
    const availableFieldKeys = Object.keys(fieldConfigurations);
    if (availableFieldKeys.length === 0) return;

    const newFilter: SearchFilter = {
      id: `filter_${Date.now()}`,
      name: `Filter ${filters.length + 1}`,
      field: availableFieldKeys[0],
      type: fieldConfigurations[availableFieldKeys[0]].type as any,
      operator: fieldConfigurations[availableFieldKeys[0]].operators[0],
      value: '',
      enabled: true
    };

    setFilters(prev => [...prev, newFilter]);
  }, [filters, fieldConfigurations]);

  // Update filter
  const updateFilter = useCallback((filterId: string, updates: Partial<SearchFilter>) => {
    setFilters(prev => prev.map(filter => 
      filter.id === filterId ? { ...filter, ...updates } : filter
    ));
  }, []);

  // Remove filter
  const removeFilter = useCallback((filterId: string) => {
    setFilters(prev => prev.filter(filter => filter.id !== filterId));
  }, []);

  // Execute search with current filters
  const handleSearch = useCallback(async () => {
    const activeFilters = filters.filter(f => f.enabled && f.value !== '' && f.value != null);
    
    const conditions = activeFilters.map(filter => ({
      field: filter.field,
      operator: filter.operator,
      value: filter.value,
      dataType: filter.type,
      caseSensitive: filter.type === 'text'
    }));

    const searchQuery = {
      ...query,
      conditions,
      textSearch: searchText,
      textFields: Object.keys(fieldConfigurations).filter(field => 
        fieldConfigurations[field].type === 'text'
      )
    };

    await executeSearch(searchQuery);
  }, [filters, query, searchText, fieldConfigurations, executeSearch]);

  // Handle save search
  const handleSaveSearch = useCallback(async () => {
    if (!saveSearchName.trim()) return;

    try {
      await saveSearch(saveSearchName, `Saved search for ${dataType}`);
      setShowSaveDialog(false);
      setSaveSearchName('');
    } catch (error) {
      console.error('Failed to save search:', error);
    }
  }, [saveSearchName, saveSearch, dataType]);

  // Effect to notify parent of results changes
  useEffect(() => {
    if (results && onResultsChange) {
      onResultsChange(results);
    }
  }, [results, onResultsChange]);

  return (
    <div className={`enhanced-advanced-search-system bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              Advanced Search & Filter
            </h3>
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              {dataType.toUpperCase()}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {results && (
              <span className="text-sm text-gray-600">
                {results.filteredCount} of {results.totalCount} results
              </span>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ChevronDown className={`w-4 h-4 transform transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`} />
            </button>
          </div>
        </div>

        {/* Main Search Bar */}
        <div className="mt-4 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => handleSearchTextChange(e.target.value)}
              placeholder={`Search ${dataType}...`}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
              {enableAI && (
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Brain className="w-4 h-4 text-purple-600" />
                </button>
              )}
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Search'}
              </button>
            </div>
          </div>

          {/* Smart Suggestions */}
          {smartSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {smartSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleSearchTextChange(suggestion.text);
                    setSmartSuggestions([]);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 ${
                    index === selectedSuggestion ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex-shrink-0">
                    {suggestion.type === 'ai' && <Brain className="w-4 h-4 text-purple-600" />}
                    {suggestion.type === 'trending' && <TrendingUp className="w-4 h-4 text-green-600" />}
                    {suggestion.type === 'recent' && <Clock className="w-4 h-4 text-blue-600" />}
                    {suggestion.type === 'popular' && <Star className="w-4 h-4 text-yellow-600" />}
                  </div>
                  <span className="flex-1">{suggestion.text}</span>
                  <span className="text-xs text-gray-500">{Math.round(suggestion.confidence * 100)}%</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'search', label: 'Quick Search', icon: Zap },
              { id: 'filters', label: 'Advanced Filters', icon: Filter },
              { id: 'saved', label: 'Saved Searches', icon: Bookmark },
              { id: 'history', label: 'History', icon: History }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'search' && (
              <QuickSearchTab
                dataType={dataType}
                fieldConfigurations={fieldConfigurations}
                onSearch={handleSearch}
              />
            )}

            {activeTab === 'filters' && (
              <AdvancedFiltersTab
                filters={filters}
                fieldConfigurations={fieldConfigurations}
                onAddFilter={addFilter}
                onUpdateFilter={updateFilter}
                onRemoveFilter={removeFilter}
                onSearch={handleSearch}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'saved' && enableSavedSearches && (
              <SavedSearchesTab
                savedSearches={savedSearches}
                onLoadSearch={loadSavedSearch}
                onSaveSearch={() => setShowSaveDialog(true)}
              />
            )}

            {activeTab === 'history' && (
              <SearchHistoryTab
                searchHistory={searchHistory}
                onLoadSearch={(search) => {
                  setSearchText(search.textSearch || '');
                  updateQuery(search);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Results Summary */}
      {results && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Found {results.filteredCount} results in {results.queryTimeMs}ms
              </span>
              {results.facets.length > 0 && (
                <button className="text-sm text-blue-600 hover:text-blue-700">
                  View Facets ({results.facets.length})
                </button>
              )}
            </div>
            
            {enableExport && results.items.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={() => exportResults('csv')}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  <Download className="w-4 h-4" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => exportResults('json')}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  <Download className="w-4 h-4" />
                  <span>JSON</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Save Search</h3>
            <input
              type="text"
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              placeholder="Enter search name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSaveSearch}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Quick Search Tab Component
const QuickSearchTab: React.FC<{
  dataType: string;
  fieldConfigurations: any;
  onSearch: () => void;
}> = ({ dataType, fieldConfigurations, onSearch }) => {
  const quickFilters = useMemo(() => {
    switch (dataType) {
      case 'players':
        return [
          { label: 'Active Players', filter: 'isActive', value: true },
          { label: 'NBA Players', filter: 'sport', value: 'NBA' },
          { label: 'MLB Players', filter: 'sport', value: 'MLB' },
          { label: 'Top Salary', filter: 'salary', value: 'top_10_percent' }
        ];
      case 'props':
        return [
          { label: 'High Confidence', filter: 'confidence', value: '>0.8' },
          { label: 'Positive EV', filter: 'ev', value: '>0' },
          { label: 'Points Props', filter: 'propType', value: 'points' },
          { label: 'Today\'s Games', filter: 'date', value: 'today' }
        ];
      default:
        return [];
    }
  }, [dataType]);

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-800">Quick Filters</h4>
      <div className="grid grid-cols-2 gap-2">
        {quickFilters.map((filter, index) => (
          <button
            key={index}
            onClick={onSearch}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-left"
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Advanced Filters Tab Component
const AdvancedFiltersTab: React.FC<{
  filters: SearchFilter[];
  fieldConfigurations: any;
  onAddFilter: () => void;
  onUpdateFilter: (id: string, updates: Partial<SearchFilter>) => void;
  onRemoveFilter: (id: string) => void;
  onSearch: () => void;
  isLoading: boolean;
}> = ({ filters, fieldConfigurations, onAddFilter, onUpdateFilter, onRemoveFilter, onSearch, isLoading }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-800">Custom Filters</h4>
        <button
          onClick={onAddFilter}
          className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Filter</span>
        </button>
      </div>

      <div className="space-y-3">
        {filters.map((filter) => (
          <FilterRow
            key={filter.id}
            filter={filter}
            fieldConfigurations={fieldConfigurations}
            onUpdate={(updates) => onUpdateFilter(filter.id, updates)}
            onRemove={() => onRemoveFilter(filter.id)}
          />
        ))}
      </div>

      {filters.length > 0 && (
        <button
          onClick={onSearch}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? 'Searching...' : 'Apply Filters'}
        </button>
      )}
    </div>
  );
};

// Filter Row Component
const FilterRow: React.FC<{
  filter: SearchFilter;
  fieldConfigurations: any;
  onUpdate: (updates: Partial<SearchFilter>) => void;
  onRemove: () => void;
}> = ({ filter, fieldConfigurations, onUpdate, onRemove }) => {
  const fieldConfig = fieldConfigurations[filter.field] || {};

  return (
    <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md">
      <input
        type="checkbox"
        checked={filter.enabled}
        onChange={(e) => onUpdate({ enabled: e.target.checked })}
        className="h-4 w-4"
      />
      
      <select
        value={filter.field}
        onChange={(e) => onUpdate({ field: e.target.value })}
        className="px-2 py-1 border border-gray-300 rounded text-sm"
      >
        {Object.entries(fieldConfigurations).map(([key, config]: [string, any]) => (
          <option key={key} value={key}>{config.label}</option>
        ))}
      </select>

      <select
        value={filter.operator}
        onChange={(e) => onUpdate({ operator: e.target.value })}
        className="px-2 py-1 border border-gray-300 rounded text-sm"
      >
        {(fieldConfig.operators || ['equals']).map((op: string) => (
          <option key={op} value={op}>{op.replace('_', ' ')}</option>
        ))}
      </select>

      <input
        type={filter.type === 'number' ? 'number' : 'text'}
        value={filter.value}
        onChange={(e) => onUpdate({ value: e.target.value })}
        placeholder="Value..."
        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
      />

      <button
        onClick={onRemove}
        className="p-1 text-red-600 hover:bg-red-50 rounded"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Saved Searches Tab Component
const SavedSearchesTab: React.FC<{
  savedSearches: SavedSearch[];
  onLoadSearch: (searchId: string) => void;
  onSaveSearch: () => void;
}> = ({ savedSearches, onLoadSearch, onSaveSearch }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-800">Saved Searches</h4>
        <button
          onClick={onSaveSearch}
          className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Save className="w-4 h-4" />
          <span>Save Current</span>
        </button>
      </div>

      <div className="space-y-2">
        {savedSearches.map((search) => (
          <div key={search.id} className="p-3 border border-gray-200 rounded-md hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-800">{search.name}</h5>
                <p className="text-sm text-gray-600">{search.description}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500">Used {search.useCount} times</span>
                  <span className="text-xs text-gray-500">Last: {new Date(search.lastUsed).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                onClick={() => onLoadSearch(search.id)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Load
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Search History Tab Component
const SearchHistoryTab: React.FC<{
  searchHistory: any[];
  onLoadSearch: (search: any) => void;
}> = ({ searchHistory, onLoadSearch }) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-800">Recent Searches</h4>
      <div className="space-y-2">
        {searchHistory.slice(0, 10).map((search, index) => (
          <div key={index} className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
               onClick={() => onLoadSearch(search)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {search.textSearch || 'Advanced Filter Search'}
                </p>
                <p className="text-xs text-gray-600">
                  {search.conditions?.length || 0} filters • {new Date(search.timestamp).toLocaleString()}
                </p>
              </div>
              <Clock className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnhancedAdvancedSearchSystem;
