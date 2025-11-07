/**
 * Advanced Search and Filter Panel
 * Comprehensive search interface with filtering, facets, and autocomplete
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  X, 
  ChevronDown, 
  Save, 
  History, 
  TrendingUp,
  Calendar,
  Hash,
  Type,
  ToggleLeft,
  List,
  Clock
} from 'lucide-react';

interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: any;
  dataType: string;
  caseSensitive: boolean;
}

interface SearchQuery {
  conditions: FilterCondition[];
  logicOperator: string;
  textSearch: string;
  textFields: string[];
  sortBy: string;
  sortOrder: string;
  limit: number;
  offset: number;
}

interface SearchResult {
  items: any[];
  totalCount: number;
  filteredCount: number;
  facets: Array<{
    field: string;
    values: { [key: string]: number };
  }>;
  queryTimeMs: number;
}

interface AdvancedSearchPanelProps {
  dataType: 'players' | 'odds' | 'custom';
  onSearch: (query: SearchQuery) => void;
  onResults: (results: SearchResult) => void;
  availableFields?: { [key: string]: string };
  isLoading?: boolean;
  initialQuery?: Partial<SearchQuery>;
}

const AdvancedSearchPanel: React.FC<AdvancedSearchPanelProps> = ({
  dataType,
  onSearch,
  onResults,
  availableFields,
  isLoading = false,
  initialQuery
}) => {
  // Search state
  const [query, setQuery] = useState<SearchQuery>({
    conditions: [],
    logicOperator: 'AND',
    textSearch: '',
    textFields: [],
    sortBy: '',
    sortOrder: 'asc',
    limit: 50,
    offset: 0,
    ...initialQuery
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<{ [key: string]: string[] }>({});
  const [fieldStats, setFieldStats] = useState<{ [key: string]: any }>({});
  const [results, setResults] = useState<SearchResult | null>(null);

  // Field definitions
  const [fields, setFields] = useState<{ [key: string]: string }>(availableFields || {});
  const [operators, setOperators] = useState<{ [key: string]: string[] }>({});

  // Load field definitions and operators
  useEffect(() => {
    const loadSearchMetadata = async () => {
      try {
        const [fieldsResponse, operatorsResponse] = await Promise.all([
          fetch('/api/v1/search/fields'),
          fetch('/api/v1/search/operators')
        ]);

        if (fieldsResponse.ok) {
          const fieldsData = await fieldsResponse.json();
          setFields(fieldsData[dataType] || {});
        }

        if (operatorsResponse.ok) {
          const operatorsData = await operatorsResponse.json();
          setOperators(operatorsData);
        }
      } catch (error) {
        console.error('Failed to load search metadata:', error);
      }
    };

    loadSearchMetadata();
  }, [dataType]);

  // Load saved searches
  useEffect(() => {
    const loadSavedSearches = async () => {
      try {
        const response = await fetch('/api/v1/search/saved-searches');
        if (response.ok) {
          const searches = await response.json();
          setSavedSearches(searches);
        }
      } catch (error) {
        console.error('Failed to load saved searches:', error);
      }
    };

    loadSavedSearches();
  }, []);

  // Get operators for data type
  const getOperatorsForDataType = useCallback((dataType: string) => {
    switch (dataType) {
      case 'string':
        return operators.string || ['eq', 'contains', 'starts_with', 'ends_with'];
      case 'integer':
      case 'float':
        return operators.numeric || ['eq', 'gt', 'gte', 'lt', 'lte', 'between'];
      case 'boolean':
        return operators.boolean || ['eq'];
      case 'date':
      case 'datetime':
        return operators.date || ['eq', 'gt', 'gte', 'lt', 'lte', 'between'];
      default:
        return ['eq', 'contains'];
    }
  }, [operators]);

  // Add new filter condition
  const addCondition = useCallback(() => {
    const newCondition: FilterCondition = {
      id: Date.now().toString(),
      field: Object.keys(fields)[0] || '',
      operator: 'eq',
      value: '',
      dataType: 'string',
      caseSensitive: false
    };

    setQuery(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  }, [fields]);

  // Update filter condition
  const updateCondition = useCallback((id: string, updates: Partial<FilterCondition>) => {
    setQuery(prev => ({
      ...prev,
      conditions: prev.conditions.map(condition =>
        condition.id === id ? { ...condition, ...updates } : condition
      )
    }));
  }, []);

  // Remove filter condition
  const removeCondition = useCallback((id: string) => {
    setQuery(prev => ({
      ...prev,
      conditions: prev.conditions.filter(condition => condition.id !== id)
    }));
  }, []);

  // Get autocomplete suggestions
  const getSuggestions = useCallback(async (field: string, text: string) => {
    if (!text || text.length < 2) return;

    try {
      const response = await fetch(
        `/api/v1/search/suggestions/${field}?text=${encodeURIComponent(text)}&data_type=${dataType}`
      );

      if (response.ok) {
        const suggestions = await response.json();
        setSuggestions(prev => ({ ...prev, [field]: suggestions }));
      }
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    }
  }, [dataType]);

  // Get field statistics
  const getFieldStats = useCallback(async (field: string) => {
    try {
      const response = await fetch(`/api/v1/search/statistics/${field}?data_type=${dataType}`);
      
      if (response.ok) {
        const stats = await response.json();
        setFieldStats(prev => ({ ...prev, [field]: stats }));
      }
    } catch (error) {
      console.error('Failed to get field statistics:', error);
    }
  }, [dataType]);

  // Execute search
  const executeSearch = useCallback(async () => {
    const searchData = {
      query: {
        conditions: query.conditions.map(condition => ({
          field: condition.field,
          operator: condition.operator,
          value: condition.value,
          data_type: condition.dataType,
          case_sensitive: condition.caseSensitive
        })),
        logic_operator: query.logicOperator,
        text_search: query.textSearch || null,
        text_fields: query.textFields,
        sort_by: query.sortBy || null,
        sort_order: query.sortOrder,
        limit: query.limit,
        offset: query.offset
      },
      data: [], // This would be populated with actual data
      facet_fields: Object.keys(fields).slice(0, 5) // Limit facets
    };

    try {
      // For demo, use the specific endpoint based on data type
      let endpoint = '/api/v1/search/execute';
      const params = new URLSearchParams();

      if (dataType === 'players') {
        endpoint = '/api/v1/search/players';
        if (query.textSearch) params.append('player_name', query.textSearch);
        query.conditions.forEach(condition => {
          if (condition.field === 'sport' && condition.value) {
            params.append('sport', condition.value);
          }
          if (condition.field === 'team' && condition.value) {
            params.append('team', condition.value);
          }
          if (condition.field === 'position' && condition.value) {
            params.append('position', condition.value);
          }
        });
      } else if (dataType === 'odds') {
        endpoint = '/api/v1/search/odds';
        if (query.textSearch) params.append('player_name', query.textSearch);
        query.conditions.forEach(condition => {
          if (condition.field === 'sport' && condition.value) {
            params.append('sport', condition.value);
          }
          if (condition.field === 'bet_type' && condition.value) {
            params.append('bet_type', condition.value);
          }
          if (condition.field === 'provider' && condition.value) {
            params.append('sportsbook', condition.value);
          }
        });
      }

      const url = params.toString() ? `${endpoint}?${params.toString()}` : endpoint;
      
      let response;
      if (dataType === 'custom') {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchData)
        });
      } else {
        response = await fetch(url);
      }

      if (response.ok) {
        const searchResults = await response.json();
        setResults(searchResults);
        onResults(searchResults);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }

    onSearch(query);
  }, [query, dataType, fields, onSearch, onResults]);

  // Save search query
  const saveSearch = useCallback(async (name: string, description?: string) => {
    try {
      const response = await fetch('/api/v1/search/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          query,
          description
        })
      });

      if (response.ok) {
        setShowSaveDialog(false);
        // Reload saved searches
        const searchesResponse = await fetch('/api/v1/search/saved-searches');
        if (searchesResponse.ok) {
          const searches = await searchesResponse.json();
          setSavedSearches(searches);
        }
      }
    } catch (error) {
      console.error('Failed to save search:', error);
    }
  }, [query]);

  // Load saved search
  const loadSavedSearch = useCallback((savedSearch: any) => {
    const loadedQuery = {
      ...query,
      ...savedSearch.query,
      conditions: savedSearch.query.conditions.map((condition: any) => ({
        ...condition,
        id: Date.now().toString() + Math.random()
      }))
    };
    setQuery(loadedQuery);
  }, [query]);

  // Render operator label
  const getOperatorLabel = (operator: string) => {
    const labels: { [key: string]: string } = {
      eq: 'Equals',
      ne: 'Not Equals',
      contains: 'Contains',
      not_contains: 'Does Not Contain',
      starts_with: 'Starts With',
      ends_with: 'Ends With',
      gt: 'Greater Than',
      gte: 'Greater Than or Equal',
      lt: 'Less Than',
      lte: 'Less Than or Equal',
      between: 'Between',
      in: 'In List',
      not_in: 'Not In List',
      regex: 'Regex',
      fuzzy: 'Fuzzy Match'
    };
    return labels[operator] || operator;
  };

  // Get field icon
  const getFieldIcon = (dataType: string) => {
    switch (dataType) {
      case 'string': return <Type className="w-4 h-4" />;
      case 'integer':
      case 'float': return <Hash className="w-4 h-4" />;
      case 'boolean': return <ToggleLeft className="w-4 h-4" />;
      case 'date':
      case 'datetime': return <Calendar className="w-4 h-4" />;
      case 'array': return <List className="w-4 h-4" />;
      default: return <Type className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Search className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Advanced Search</h3>
          {results && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              {results.filteredCount} results in {results.queryTimeMs.toFixed(1)}ms
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSaveDialog(true)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md"
            title="Save Search"
          >
            <Save className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex space-x-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query.textSearch}
                onChange={(e) => setQuery(prev => ({ ...prev, textSearch: e.target.value }))}
                placeholder={`Search ${dataType}...`}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && executeSearch()}
              />
            </div>
          </div>
          
          <button
            onClick={executeSearch}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          {/* Logic Operator */}
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-sm font-medium text-gray-700">Match:</span>
            <select
              value={query.logicOperator}
              onChange={(e) => setQuery(prev => ({ ...prev, logicOperator: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="AND">All conditions (AND)</option>
              <option value="OR">Any condition (OR)</option>
            </select>
          </div>

          {/* Filter Conditions */}
          <div className="space-y-3">
            {query.conditions.map((condition, index) => (
              <div key={condition.id} className="flex items-center space-x-3 bg-white p-3 rounded border border-gray-200">
                {/* Field */}
                <div className="flex-1">
                  <select
                    value={condition.field}
                    onChange={(e) => {
                      const field = e.target.value;
                      const dataType = fields[field] || 'string';
                      updateCondition(condition.id, { 
                        field, 
                        dataType,
                        operator: getOperatorsForDataType(dataType)[0] || 'eq'
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(fields).map(([field, type]) => (
                      <option key={field} value={field}>
                        {field.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Operator */}
                <div className="flex-1">
                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(condition.id, { operator: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {getOperatorsForDataType(condition.dataType).map(operator => (
                      <option key={operator} value={operator}>
                        {getOperatorLabel(operator)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Value */}
                <div className="flex-1">
                  {condition.operator === 'between' ? (
                    <div className="flex space-x-2">
                      <input
                        type={condition.dataType === 'integer' || condition.dataType === 'float' ? 'number' : 'text'}
                        value={Array.isArray(condition.value) ? condition.value[0] : ''}
                        onChange={(e) => {
                          const newValue = [e.target.value, Array.isArray(condition.value) ? condition.value[1] : ''];
                          updateCondition(condition.id, { value: newValue });
                        }}
                        placeholder="Min"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type={condition.dataType === 'integer' || condition.dataType === 'float' ? 'number' : 'text'}
                        value={Array.isArray(condition.value) ? condition.value[1] : ''}
                        onChange={(e) => {
                          const newValue = [Array.isArray(condition.value) ? condition.value[0] : '', e.target.value];
                          updateCondition(condition.id, { value: newValue });
                        }}
                        placeholder="Max"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ) : condition.dataType === 'boolean' ? (
                    <select
                      value={condition.value}
                      onChange={(e) => updateCondition(condition.id, { value: e.target.value === 'true' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  ) : (
                    <div className="relative">
                      <input
                        type={condition.dataType === 'integer' || condition.dataType === 'float' ? 'number' : 
                              condition.dataType === 'date' ? 'date' : 
                              condition.dataType === 'datetime' ? 'datetime-local' : 'text'}
                        value={condition.value}
                        onChange={(e) => {
                          updateCondition(condition.id, { value: e.target.value });
                          if (condition.dataType === 'string' && e.target.value.length > 1) {
                            getSuggestions(condition.field, e.target.value);
                          }
                        }}
                        placeholder={`Enter ${condition.field.replace(/_/g, ' ')}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      
                      {/* Autocomplete suggestions */}
                      {suggestions[condition.field] && suggestions[condition.field].length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                          {suggestions[condition.field].map((suggestion, idx) => (
                            <div
                              key={idx}
                              onClick={() => updateCondition(condition.id, { value: suggestion })}
                              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                            >
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeCondition(condition.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Add condition button */}
            <button
              onClick={addCondition}
              className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-dashed border-blue-300"
            >
              <Plus className="w-4 h-4" />
              <span>Add Filter</span>
            </button>
          </div>

          {/* Sort Options */}
          <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={query.sortBy}
              onChange={(e) => setQuery(prev => ({ ...prev, sortBy: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Default</option>
              {Object.keys(fields).map(field => (
                <option key={field} value={field}>
                  {field.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            
            <select
              value={query.sortOrder}
              onChange={(e) => setQuery(prev => ({ ...prev, sortOrder: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>

            <span className="text-sm font-medium text-gray-700">Limit:</span>
            <select
              value={query.limit}
              onChange={(e) => setQuery(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>
        </div>
      )}

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <History className="w-4 h-4 mr-2" />
            Saved Searches
          </h4>
          <div className="flex flex-wrap gap-2">
            {savedSearches.slice(0, 5).map((search) => (
              <button
                key={search.id}
                onClick={() => loadSavedSearch(search)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 flex items-center space-x-1"
              >
                <span>{search.name}</span>
                <span className="text-xs text-gray-500">({search.usage_count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Summary */}
      {results && (
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Showing {results.items.length} of {results.filteredCount} results
              </span>
              <span className="text-xs text-gray-500 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {results.queryTimeMs.toFixed(1)}ms
              </span>
            </div>

            {/* Facets */}
            {results.facets.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Filters:</span>
                {results.facets.map((facet) => (
                  <div key={facet.field} className="flex flex-wrap gap-1">
                    {Object.entries(facet.values).slice(0, 3).map(([value, count]) => (
                      <span
                        key={value}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded cursor-pointer hover:bg-blue-200"
                        onClick={() => {
                          const existingCondition = query.conditions.find(c => c.field === facet.field);
                          if (!existingCondition) {
                            addCondition();
                            setTimeout(() => {
                              setQuery(prev => ({
                                ...prev,
                                conditions: prev.conditions.map((condition, idx) => 
                                  idx === prev.conditions.length - 1 
                                    ? { ...condition, field: facet.field, value, dataType: fields[facet.field] || 'string' }
                                    : condition
                                )
                              }));
                            }, 0);
                          }
                        }}
                      >
                        {value} ({count})
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Save Search Query</h3>
            <input
              type="text"
              placeholder="Search name"
              className="w-full px-3 py-2 border border-gray-300 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  saveSearch(e.currentTarget.value);
                }
              }}
            />
            <textarea
              placeholder="Description (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const nameInput = document.querySelector('input[placeholder="Search name"]') as HTMLInputElement;
                  const descInput = document.querySelector('textarea[placeholder="Description (optional)"]') as HTMLTextAreaElement;
                  saveSearch(nameInput.value, descInput.value);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchPanel;
