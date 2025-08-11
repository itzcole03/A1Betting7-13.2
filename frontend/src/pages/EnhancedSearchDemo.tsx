/**
 * Enhanced Search Demo Page
 * Phase 3: Advanced UI Features - Comprehensive Search and Filtering Demo
 * 
 * Showcases:
 * - AI-powered search suggestions
 * - Advanced filtering capabilities
 * - Saved searches and history
 * - Real-time results with facets
 * - Export functionality
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  Filter, 
  BarChart3, 
  Users, 
  Target,
  TrendingUp,
  Star,
  Download,
  Settings
} from 'lucide-react';

import EnhancedAdvancedSearchSystem from '../components/search/EnhancedAdvancedSearchSystem';

interface DemoStats {
  totalSearches: number;
  activeFilters: number;
  resultsFound: number;
  avgResponseTime: number;
}

const EnhancedSearchDemo: React.FC = () => {
  const [selectedDataType, setSelectedDataType] = useState<'players' | 'odds' | 'props' | 'games' | 'teams'>('props');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [demoStats, setDemoStats] = useState<DemoStats>({
    totalSearches: 0,
    activeFilters: 0,
    resultsFound: 0,
    avgResponseTime: 0
  });

  const handleResultsChange = (results: any) => {
    setSearchResults(results);
    setDemoStats(prev => ({
      ...prev,
      resultsFound: results?.filteredCount || 0,
      totalSearches: prev.totalSearches + 1,
      avgResponseTime: results?.queryTimeMs || 0
    }));
  };

  const dataTypeConfigs = {
    props: {
      title: 'Player Props',
      description: 'Search player propositions with AI-powered suggestions',
      icon: Target,
      color: 'bg-blue-500',
      examples: ['LeBron James points over', 'High confidence props', 'NBA assists props']
    },
    players: {
      title: 'Players',
      description: 'Find players across all sports with advanced filtering',
      icon: Users,
      color: 'bg-green-500',
      examples: ['NBA guards', 'Injury report', 'Starting lineup today']
    },
    odds: {
      title: 'Odds Comparison',
      description: 'Compare odds across multiple sportsbooks',
      icon: TrendingUp,
      color: 'bg-purple-500',
      examples: ['Best moneyline odds', 'Line movement', 'Arbitrage opportunities']
    },
    games: {
      title: 'Games & Matchups',
      description: 'Search upcoming and completed games',
      icon: BarChart3,
      color: 'bg-orange-500',
      examples: ['Tonight\'s games', 'High scoring games', 'Close spreads']
    },
    teams: {
      title: 'Teams & Stats',
      description: 'Team statistics and performance data',
      icon: Star,
      color: 'bg-red-500',
      examples: ['Top offensive teams', 'Home favorites', 'Recent form']
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <span>Enhanced Search & Filter System</span>
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Phase 3: AI-powered search with advanced filtering capabilities
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Phase 3 Status</p>
                  <p className="text-lg font-semibold text-green-600">Advanced UI Features</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Data Type Selector */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Search Categories</h3>
              <div className="space-y-3">
                {Object.entries(dataTypeConfigs).map(([key, config]) => {
                  const IconComponent = config.icon;
                  const isSelected = selectedDataType === key;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDataType(key as any)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-md ${config.color}`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                            {config.title}
                          </h4>
                          <p className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                            {config.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Demo Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-800 mb-3">Session Stats</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Searches:</span>
                    <span className="font-medium">{demoStats.totalSearches}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Results Found:</span>
                    <span className="font-medium">{demoStats.resultsFound}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Response:</span>
                    <span className="font-medium">{demoStats.avgResponseTime.toFixed(0)}ms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Example Searches */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Try These Searches</h3>
              <div className="space-y-2">
                {dataTypeConfigs[selectedDataType].examples.map((example, index) => (
                  <button
                    key={index}
                    className="w-full p-2 text-left text-sm text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200 hover:border-blue-300"
                  >
                    "{example}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Search Interface */}
          <div className="lg:col-span-3">
            <EnhancedAdvancedSearchSystem
              dataType={selectedDataType}
              onResultsChange={handleResultsChange}
              enableAI={true}
              enableExport={true}
              enableSavedSearches={true}
              maxResults={100}
              className="mb-6"
            />

            {/* Search Results Display */}
            {searchResults && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Search Results ({searchResults.filteredCount} of {searchResults.totalCount})
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        Found in {searchResults.queryTimeMs?.toFixed(0)}ms
                      </span>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {searchResults.items.length > 0 ? (
                    <div className="space-y-4">
                      {searchResults.items.map((item: any, index: number) => (
                        <SearchResultCard
                          key={index}
                          item={item}
                          dataType={selectedDataType}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-600 mb-2">No results found</h4>
                      <p className="text-gray-500">Try adjusting your search criteria or filters</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <FeatureCard
                icon={Sparkles}
                title="AI-Powered Suggestions"
                description="Intelligent search suggestions powered by machine learning"
                color="bg-purple-500"
              />
              <FeatureCard
                icon={Filter}
                title="Advanced Filtering"
                description="Multi-field filtering with custom operators and faceted search"
                color="bg-blue-500"
              />
              <FeatureCard
                icon={TrendingUp}
                title="Real-time Analytics"
                description="Live search analytics with performance optimization"
                color="bg-green-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Search Result Card Component
const SearchResultCard: React.FC<{
  item: any;
  dataType: string;
}> = ({ item, dataType }) => {
  const renderContent = () => {
    switch (dataType) {
      case 'props':
        return (
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-800">{item.player}</h4>
              <p className="text-sm text-gray-600">{item.prop_type} • Line: {item.line}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-blue-600">Pred: {item.prediction}</p>
              <p className="text-sm text-gray-600">Conf: {Math.round(item.confidence * 100)}%</p>
            </div>
          </div>
        );
      case 'players':
        return (
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-800">{item.name}</h4>
              <p className="text-sm text-gray-600">{item.team} • {item.position} • Age {item.age}</p>
            </div>
            <div className="text-right">
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {item.sport}
              </span>
            </div>
          </div>
        );
      case 'odds':
        return (
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-800">{item.sportsbook}</h4>
              <p className="text-sm text-gray-600">{item.sport} • {item.market}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-green-600">{item.odds}</p>
              {item.line && <p className="text-sm text-gray-600">Line: {item.line}</p>}
            </div>
          </div>
        );
      default:
        return (
          <div>
            <h4 className="font-medium text-gray-800">Search Result</h4>
            <p className="text-sm text-gray-600">Item details</p>
          </div>
        );
    }
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
      {renderContent()}
    </div>
  );
};

// Feature Card Component
const FeatureCard: React.FC<{
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  color: string;
}> = ({ icon: Icon, title, description, color }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-3 mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default EnhancedSearchDemo;
