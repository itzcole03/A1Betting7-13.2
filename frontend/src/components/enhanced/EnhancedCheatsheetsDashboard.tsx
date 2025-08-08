/**
 * Enhanced Cheatsheets Dashboard with Advanced Search
 * Integrates advanced search and filtering with cheatsheets data
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  BookOpen, 
  TrendingUp, 
  Star, 
  Clock, 
  Users,
  BarChart3,
  Target,
  Zap,
  Trophy,
  Bookmark
} from 'lucide-react';

import AdvancedSearchPanel from '../search/AdvancedSearchPanel';
import SearchResultsDisplay from '../search/SearchResultsDisplay';
import useAdvancedSearch from '../../hooks/useAdvancedSearch';

interface CheatsheetData {
  id: string;
  title: string;
  sport: string;
  category: string;
  difficulty: string;
  rating: number;
  usage_count: number;
  last_updated: string;
  author: string;
  tags: string[];
  description: string;
  profit_potential: string;
  win_rate: number;
  roi: number;
  sample_size: number;
}

const EnhancedCheatsheetsDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'list'>('cards');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [mockCheatsheets, setMockCheatsheets] = useState<CheatsheetData[]>([]);

  // Initialize advanced search
  const {
    query,
    results,
    isLoading,
    error,
    executeSearch,
    updateQuery,
    clearQuery,
    exportResults
  } = useAdvancedSearch({
    dataType: 'custom',
    cacheResults: true,
    autoSearch: false
  });

  // Mock cheatsheets data
  useEffect(() => {
    const mockData: CheatsheetData[] = [
      {
        id: 'cs1',
        title: 'NBA Player Props Value Finder',
        sport: 'NBA',
        category: 'Player Props',
        difficulty: 'Intermediate',
        rating: 4.7,
        usage_count: 1234,
        last_updated: '2024-01-20T10:00:00Z',
        author: 'ProBettor',
        tags: ['props', 'value', 'nba', 'analytics'],
        description: 'Advanced system for finding undervalued NBA player prop bets using statistical models',
        profit_potential: 'High',
        win_rate: 67.3,
        roi: 15.2,
        sample_size: 500
      },
      {
        id: 'cs2',
        title: 'NFL Over/Under Weather System',
        sport: 'NFL',
        category: 'Totals',
        difficulty: 'Advanced',
        rating: 4.9,
        usage_count: 892,
        last_updated: '2024-01-19T15:30:00Z',
        author: 'WeatherBets',
        tags: ['nfl', 'totals', 'weather', 'system'],
        description: 'Exploit weather conditions in NFL totals betting with proven methodology',
        profit_potential: 'Very High',
        win_rate: 71.8,
        roi: 22.1,
        sample_size: 234
      },
      {
        id: 'cs3',
        title: 'MLB Run Line Value Model',
        sport: 'MLB',
        category: 'Run Lines',
        difficulty: 'Beginner',
        rating: 4.2,
        usage_count: 1567,
        last_updated: '2024-01-18T09:15:00Z',
        author: 'BaseballPro',
        tags: ['mlb', 'run-line', 'model', 'value'],
        description: 'Simple but effective MLB run line betting strategy for beginners',
        profit_potential: 'Medium',
        win_rate: 58.4,
        roi: 8.7,
        sample_size: 1200
      },
      {
        id: 'cs4',
        title: 'NBA Live Betting Momentum',
        sport: 'NBA',
        category: 'Live Betting',
        difficulty: 'Expert',
        rating: 4.6,
        usage_count: 678,
        last_updated: '2024-01-17T20:45:00Z',
        author: 'LiveEdge',
        tags: ['nba', 'live', 'momentum', 'advanced'],
        description: 'Capitalize on momentum shifts in NBA live betting markets',
        profit_potential: 'Very High',
        win_rate: 64.2,
        roi: 18.9,
        sample_size: 156
      },
      {
        id: 'cs5',
        title: 'UFC Fighter Styles Matrix',
        sport: 'UFC',
        category: 'MMA',
        difficulty: 'Intermediate',
        rating: 4.4,
        usage_count: 445,
        last_updated: '2024-01-16T14:20:00Z',
        author: 'FightAnalyst',
        tags: ['ufc', 'mma', 'styles', 'matchups'],
        description: 'Analyze fighter style matchups for profitable UFC betting opportunities',
        profit_potential: 'High',
        win_rate: 62.7,
        roi: 12.8,
        sample_size: 89
      }
    ];

    setMockCheatsheets(mockData);
  }, []);

  // Column definitions for cheatsheets
  const cheatsheetColumns = [
    { 
      key: 'title', 
      title: 'Title', 
      dataType: 'string' as const, 
      sortable: true, 
      filterable: true,
      formatter: (value: string, item: CheatsheetData) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{item.description}</div>
          </div>
        </div>
      )
    },
    { 
      key: 'sport', 
      title: 'Sport', 
      dataType: 'string' as const, 
      sortable: true, 
      filterable: true,
      formatter: (value: string) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
          {value}
        </span>
      )
    },
    { 
      key: 'category', 
      title: 'Category', 
      dataType: 'string' as const, 
      sortable: true, 
      filterable: true,
      formatter: (value: string) => (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
          {value}
        </span>
      )
    },
    { 
      key: 'rating', 
      title: 'Rating', 
      dataType: 'number' as const, 
      sortable: true,
      formatter: (value: number) => (
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    { 
      key: 'win_rate', 
      title: 'Win Rate', 
      dataType: 'number' as const, 
      sortable: true,
      formatter: (value: number) => (
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full" 
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-sm font-medium">{value}%</span>
        </div>
      )
    },
    { 
      key: 'roi', 
      title: 'ROI', 
      dataType: 'number' as const, 
      sortable: true,
      formatter: (value: number) => (
        <span className={`font-medium ${value > 10 ? 'text-green-600' : value > 5 ? 'text-yellow-600' : 'text-gray-600'}`}>
          {value > 0 ? '+' : ''}{value}%
        </span>
      )
    },
    { 
      key: 'usage_count', 
      title: 'Usage', 
      dataType: 'number' as const, 
      sortable: true,
      formatter: (value: number) => (
        <div className="flex items-center space-x-1">
          <Users className="w-4 h-4 text-gray-500" />
          <span>{value.toLocaleString()}</span>
        </div>
      )
    },
    { 
      key: 'difficulty', 
      title: 'Difficulty', 
      dataType: 'string' as const, 
      sortable: true, 
      filterable: true,
      formatter: (value: string) => {
        const colorMap = {
          'Beginner': 'bg-green-100 text-green-800',
          'Intermediate': 'bg-yellow-100 text-yellow-800',
          'Advanced': 'bg-orange-100 text-orange-800',
          'Expert': 'bg-red-100 text-red-800'
        };
        return (
          <span className={`px-2 py-1 text-sm rounded ${colorMap[value as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'}`}>
            {value}
          </span>
        );
      }
    }
  ];

  // Handle search
  const handleSearch = useCallback(async (searchQuery: any) => {
    // Convert cheatsheets data to search format and execute
    const searchData = {
      query: searchQuery,
      data: mockCheatsheets.map(sheet => ({
        id: sheet.id,
        name: sheet.title,
        title: sheet.title,
        sport: sheet.sport,
        category: sheet.category,
        difficulty: sheet.difficulty,
        rating: sheet.rating,
        usage_count: sheet.usage_count,
        win_rate: sheet.win_rate,
        roi: sheet.roi,
        author: sheet.author,
        tags: sheet.tags,
        type: 'cheatsheet'
      })),
      facet_fields: ['sport', 'category', 'difficulty', 'author']
    };

    // Simulate API call with mock data
    const mockResults = {
      items: searchData.data.filter(item => {
        // Simple text search simulation
        if (searchQuery.textSearch) {
          const searchText = searchQuery.textSearch.toLowerCase();
          return item.title.toLowerCase().includes(searchText) ||
                 item.sport.toLowerCase().includes(searchText) ||
                 item.category.toLowerCase().includes(searchText);
        }
        return true;
      }),
      totalCount: searchData.data.length,
      filteredCount: 0,
      facets: [
        {
          field: 'sport',
          values: { 'NBA': 2, 'NFL': 1, 'MLB': 1, 'UFC': 1 }
        },
        {
          field: 'category', 
          values: { 'Player Props': 1, 'Totals': 1, 'Run Lines': 1, 'Live Betting': 1, 'MMA': 1 }
        }
      ],
      queryTimeMs: Math.random() * 100 + 20
    };

    mockResults.filteredCount = mockResults.items.length;
    return mockResults;
  }, [mockCheatsheets]);

  // Handle search results
  const handleSearchResults = useCallback((searchResults: any) => {
    // Results are handled by the search hook
  }, []);

  // Handle item click
  const handleItemClick = useCallback((item: any) => {
    console.log('Cheatsheet clicked:', item);
    // Could open cheatsheet detail modal or navigate to detail page
  }, []);

  // Filter options
  const sportOptions = ['all', 'NBA', 'NFL', 'MLB', 'UFC', 'NHL'];
  const categoryOptions = ['all', 'Player Props', 'Totals', 'Run Lines', 'Live Betting', 'MMA'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
                Enhanced Cheatsheets
              </h1>
              <p className="text-gray-600 mt-2">
                Discover winning strategies with advanced search and filtering
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <Bookmark className="w-4 h-4" />
                <span>My Bookmarks</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Cheatsheets</p>
                <p className="text-2xl font-semibold text-gray-900">{mockCheatsheets.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Win Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {(mockCheatsheets.reduce((sum, sheet) => sum + sheet.win_rate, 0) / mockCheatsheets.length).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg ROI</p>
                <p className="text-2xl font-semibold text-gray-900">
                  +{(mockCheatsheets.reduce((sum, sheet) => sum + sheet.roi, 0) / mockCheatsheets.length).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Usage</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {mockCheatsheets.reduce((sum, sheet) => sum + sheet.usage_count, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Filters */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Filters</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
                  <select
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {sportOptions.map(sport => (
                      <option key={sport} value={sport}>
                        {sport === 'all' ? 'All Sports' : sport}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categoryOptions.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Top Rated */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                Top Rated
              </h3>
              <div className="space-y-3">
                {mockCheatsheets
                  .sort((a, b) => b.rating - a.rating)
                  .slice(0, 3)
                  .map((sheet) => (
                    <div key={sheet.id} className="border-l-4 border-yellow-500 pl-3">
                      <div className="text-sm font-medium text-gray-800">{sheet.title}</div>
                      <div className="text-xs text-gray-500 flex items-center justify-between">
                        <span>{sheet.sport}</span>
                        <span className="flex items-center">
                          <Star className="w-3 h-3 text-yellow-500 fill-current mr-1" />
                          {sheet.rating}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Most Used */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Zap className="w-5 h-5 text-blue-500 mr-2" />
                Most Popular
              </h3>
              <div className="space-y-3">
                {mockCheatsheets
                  .sort((a, b) => b.usage_count - a.usage_count)
                  .slice(0, 3)
                  .map((sheet) => (
                    <div key={sheet.id} className="border-l-4 border-blue-500 pl-3">
                      <div className="text-sm font-medium text-gray-800">{sheet.title}</div>
                      <div className="text-xs text-gray-500 flex items-center justify-between">
                        <span>{sheet.sport}</span>
                        <span className="flex items-center">
                          <Users className="w-3 h-3 text-blue-500 mr-1" />
                          {sheet.usage_count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Enhanced Search Panel */}
            <AdvancedSearchPanel
              dataType="custom"
              onSearch={handleSearch}
              onResults={handleSearchResults}
              isLoading={isLoading}
              availableFields={{
                title: 'string',
                sport: 'string',
                category: 'string',
                difficulty: 'string',
                rating: 'float',
                usage_count: 'integer',
                win_rate: 'float',
                roi: 'float',
                author: 'string'
              }}
            />

            {/* Results Display */}
            <SearchResultsDisplay
              results={results || {
                items: mockCheatsheets,
                totalCount: mockCheatsheets.length,
                filteredCount: mockCheatsheets.length,
                facets: [],
                queryTimeMs: 0
              }}
              columns={cheatsheetColumns}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onItemClick={handleItemClick}
              onExport={exportResults}
              loading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCheatsheetsDashboard;
