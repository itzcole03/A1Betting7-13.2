/**
 * Advanced Search Dashboard
 * Complete search interface with advanced filtering, faceted search, and analytics
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Settings, BarChart3, Download, Clock, Users, TrendingUp } from 'lucide-react';
import AdvancedSearchPanel from './AdvancedSearchPanel';
import SearchResultsDisplay from './SearchResultsDisplay';

interface SearchDashboardProps {
  defaultDataType?: 'players' | 'odds' | 'custom';
  title?: string;
  subtitle?: string;
}

const AdvancedSearchDashboard: React.FC<SearchDashboardProps> = ({
  defaultDataType = 'players',
  title = 'Advanced Search Dashboard',
  subtitle = 'Discover data with powerful search and filtering capabilities'
}) => {
  const [dataType, setDataType] = useState<'players' | 'odds' | 'custom'>(defaultDataType);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'list'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchStats, setSearchStats] = useState({
    totalSearches: 0,
    avgQueryTime: 0,
    mostPopularFields: [] as string[],
    recentSearches: [] as any[]
  });

  // Column definitions for different data types
  const columnDefinitions = {
    players: [
      { key: 'player_name', title: 'Player Name', dataType: 'string' as const, sortable: true, filterable: true },
      { key: 'team', title: 'Team', dataType: 'string' as const, sortable: true, filterable: true },
      { key: 'sport', title: 'Sport', dataType: 'string' as const, sortable: true, filterable: true },
      { key: 'position', title: 'Position', dataType: 'string' as const, sortable: true, filterable: true },
      { key: 'age', title: 'Age', dataType: 'number' as const, sortable: true },
      { 
        key: 'points_per_game', 
        title: 'PPG', 
        dataType: 'number' as const, 
        sortable: true,
        formatter: (value: number) => value ? value.toFixed(1) : '-'
      },
      { 
        key: 'rebounds_per_game', 
        title: 'RPG', 
        dataType: 'number' as const, 
        sortable: true,
        formatter: (value: number) => value ? value.toFixed(1) : '-'
      },
      { 
        key: 'assists_per_game', 
        title: 'APG', 
        dataType: 'number' as const, 
        sortable: true,
        formatter: (value: number) => value ? value.toFixed(1) : '-'
      }
    ],
    odds: [
      { key: 'player_name', title: 'Player', dataType: 'string' as const, sortable: true, filterable: true },
      { key: 'sport', title: 'Sport', dataType: 'string' as const, sortable: true, filterable: true },
      { key: 'bet_type', title: 'Bet Type', dataType: 'string' as const, sortable: true, filterable: true },
      { key: 'line', title: 'Line', dataType: 'number' as const, sortable: true },
      { 
        key: 'odds', 
        title: 'Odds', 
        dataType: 'number' as const, 
        sortable: true,
        formatter: (value: number) => value > 0 ? `+${value}` : value.toString()
      },
      { key: 'provider', title: 'Sportsbook', dataType: 'string' as const, sortable: true, filterable: true },
      { key: 'side', title: 'Side', dataType: 'string' as const, sortable: true, filterable: true },
      { 
        key: 'timestamp', 
        title: 'Last Updated', 
        dataType: 'date' as const, 
        sortable: true,
        formatter: (value: string) => new Date(value).toLocaleTimeString()
      }
    ],
    custom: [
      { key: 'id', title: 'ID', dataType: 'string' as const, sortable: true },
      { key: 'name', title: 'Name', dataType: 'string' as const, sortable: true, filterable: true },
      { key: 'value', title: 'Value', dataType: 'string' as const, sortable: true },
      { key: 'type', title: 'Type', dataType: 'string' as const, sortable: true, filterable: true }
    ]
  };

  // Load search statistics
  const loadSearchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/search/health');
      if (response.ok) {
        const health = await response.json();
        setSearchStats(prev => ({
          ...prev,
          totalSearches: prev.totalSearches + 1,
          // Mock data for demo
          avgQueryTime: 45.2,
          mostPopularFields: ['player_name', 'sport', 'team'],
          recentSearches: [
            { query: 'LeBron James', type: 'players', time: '2 min ago' },
            { query: 'NBA Points > 25', type: 'odds', time: '5 min ago' },
            { query: 'Golden State Warriors', type: 'players', time: '8 min ago' }
          ]
        }));
      }
    } catch (error) {
      console.error('Failed to load search stats:', error);
    }
  }, []);

  useEffect(() => {
    loadSearchStats();
  }, [loadSearchStats]);

  // Handle search execution
  const handleSearch = useCallback(async (query: any) => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update stats
      setSearchStats(prev => ({
        ...prev,
        totalSearches: prev.totalSearches + 1,
        avgQueryTime: (prev.avgQueryTime + Math.random() * 100) / 2
      }));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle search results
  const handleSearchResults = useCallback((results: any) => {
    setSearchResults(results);
    setCurrentPage(1); // Reset to first page
  }, []);

  // Handle item click
  const handleItemClick = useCallback((item: any) => {
    console.log('Item clicked:', item);
    // Could open modal or navigate to detail page
  }, []);

  // Handle export
  const handleExport = useCallback((format: 'csv' | 'json') => {
    if (!searchResults) return;
    
    const data = searchResults.items;
    if (format === 'csv') {
      // Convert to CSV
      const headers = columnDefinitions[dataType].map(col => col.title);
      const rows = data.map((item: any) => 
        columnDefinitions[dataType].map(col => item[col.key] || '')
      );
      
      const csvContent = [
        headers.join(','),
        ...rows.map((row: any) => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search_results_${dataType}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      // Export as JSON
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search_results_${dataType}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }, [searchResults, dataType, columnDefinitions]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <Search className="w-8 h-8 text-blue-600 mr-3" />
                {title}
              </h1>
              <p className="text-gray-600 mt-2">{subtitle}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Data Type Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Data Type:</span>
                <select
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="players">Players</option>
                  <option value="odds">Odds</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Search className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Searches</p>
                <p className="text-2xl font-semibold text-gray-900">{searchStats.totalSearches}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Query Time</p>
                <p className="text-2xl font-semibold text-gray-900">{searchStats.avgQueryTime.toFixed(1)}ms</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Results Found</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {searchResults?.filteredCount || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <p className="text-2xl font-semibold text-gray-900">98.5%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Popular Fields */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Popular Fields</h3>
              <div className="space-y-2">
                {searchStats.mostPopularFields.map((field, idx) => (
                  <div key={field} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{field.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-gray-500">#{idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Searches */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Searches</h3>
              <div className="space-y-3">
                {searchStats.recentSearches.map((search, idx) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-3">
                    <div className="text-sm font-medium text-gray-800">{search.query}</div>
                    <div className="text-xs text-gray-500 flex items-center justify-between">
                      <span>{search.type}</span>
                      <span>{search.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Filters */}
            {dataType === 'players' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Filters</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
                    Top Scorers (>25 PPG)
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
                    NBA All-Stars
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
                    Rookies
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
                    Free Agents
                  </button>
                </div>
              </div>
            )}

            {dataType === 'odds' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Filters</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
                    Positive Odds
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
                    Points Props
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
                    Tonight's Games
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
                    Value Bets
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search Panel */}
            <AdvancedSearchPanel
              dataType={dataType}
              onSearch={handleSearch}
              onResults={handleSearchResults}
              isLoading={isLoading}
            />

            {/* Results Display */}
            {searchResults && (
              <SearchResultsDisplay
                results={searchResults}
                columns={columnDefinitions[dataType]}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onItemClick={handleItemClick}
                onExport={handleExport}
                loading={isLoading}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            )}

            {/* Empty State */}
            {!searchResults && !isLoading && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Start Your Search
                </h3>
                <p className="text-gray-600 mb-6">
                  Use the search panel above to find {dataType} with advanced filtering capabilities.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Text Search</h4>
                    <p className="text-sm text-blue-700">
                      Search across all fields with intelligent text matching
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Advanced Filters</h4>
                    <p className="text-sm text-green-700">
                      Use multiple conditions with AND/OR logic
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-2">Faceted Search</h4>
                    <p className="text-sm text-purple-700">
                      Explore data with dynamic facets and statistics
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchDashboard;