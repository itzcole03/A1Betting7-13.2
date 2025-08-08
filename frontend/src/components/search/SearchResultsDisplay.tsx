/**
 * Search Results Display Component
 * Advanced display of search results with sorting, filtering, and pagination
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Grid, 
  List, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Filter,
  Download,
  Eye,
  BarChart3,
  Calendar,
  TrendingUp,
  Star,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

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

interface Column {
  key: string;
  title: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'array';
  sortable?: boolean;
  filterable?: boolean;
  formatter?: (value: any, item: any) => React.ReactNode;
}

interface SearchResultsDisplayProps {
  results: SearchResult;
  columns: Column[];
  viewMode?: 'table' | 'cards' | 'list';
  onViewModeChange?: (mode: 'table' | 'cards' | 'list') => void;
  onItemClick?: (item: any) => void;
  onExport?: (format: 'csv' | 'json') => void;
  loading?: boolean;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

const SearchResultsDisplay: React.FC<SearchResultsDisplayProps> = ({
  results,
  columns,
  viewMode = 'table',
  onViewModeChange,
  onItemClick,
  onExport,
  loading = false,
  pageSize = 25,
  currentPage = 1,
  onPageChange
}) => {
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [columnFilters, setColumnFilters] = useState<{ [key: string]: string }>({});

  // Sort and filter results
  const processedItems = useMemo(() => {
    let items = [...results.items];

    // Apply column filters
    Object.entries(columnFilters).forEach(([column, filter]) => {
      if (filter) {
        items = items.filter(item => {
          const value = getNestedValue(item, column);
          return String(value).toLowerCase().includes(filter.toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sortColumn) {
      items.sort((a, b) => {
        const aVal = getNestedValue(a, sortColumn);
        const bVal = getNestedValue(b, sortColumn);
        
        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        if (aVal > bVal) comparison = 1;
        
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return items;
  }, [results.items, columnFilters, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedItems.length / pageSize);
  const paginatedItems = processedItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Helper function to get nested values
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Handle sorting
  const handleSort = useCallback((column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  // Handle column filter
  const handleColumnFilter = useCallback((column: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  }, []);

  // Handle item selection
  const handleItemSelection = useCallback((itemId: string, selected: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  }, []);

  // Handle select all
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedItems(new Set(paginatedItems.map((item, idx) => idx.toString())));
    } else {
      setSelectedItems(new Set());
    }
  }, [paginatedItems]);

  // Format cell value
  const formatCellValue = useCallback((value: any, column: Column, item: any) => {
    if (column.formatter) {
      return column.formatter(value, item);
    }

    if (value === null || value === undefined) {
      return <span className="text-gray-400">-</span>;
    }

    switch (column.dataType) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'date':
        return value ? new Date(value).toLocaleDateString() : value;
      case 'boolean':
        return (
          <span className={`px-2 py-1 rounded text-xs ${
            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {value ? 'Yes' : 'No'}
          </span>
        );
      case 'array':
        return Array.isArray(value) ? (
          <div className="flex flex-wrap gap-1">
            {value.slice(0, 3).map((item, idx) => (
              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {item}
              </span>
            ))}
            {value.length > 3 && (
              <span className="text-xs text-gray-500">+{value.length - 3} more</span>
            )}
          </div>
        ) : value;
      default:
        return value;
    }
  }, []);

  // Render table view
  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedItems.size === paginatedItems.length && paginatedItems.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </th>
            {columns.map(column => (
              <th key={column.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <span>{column.title}</span>
                  {column.sortable && (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {sortColumn === column.key ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      )}
                    </button>
                  )}
                </div>
                {column.filterable && (
                  <input
                    type="text"
                    placeholder={`Filter ${column.title}`}
                    value={columnFilters[column.key] || ''}
                    onChange={(e) => handleColumnFilter(column.key, e.target.value)}
                    className="mt-1 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {paginatedItems.map((item, idx) => (
            <tr 
              key={idx} 
              className={`hover:bg-gray-50 cursor-pointer ${
                selectedItems.has(idx.toString()) ? 'bg-blue-50' : ''
              }`}
              onClick={() => onItemClick?.(item)}
            >
              <td className="px-4 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedItems.has(idx.toString())}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleItemSelection(idx.toString(), e.target.checked);
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </td>
              {columns.map(column => (
                <td key={column.key} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCellValue(getNestedValue(item, column.key), column, item)}
                </td>
              ))}
              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemClick?.(item);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="text-gray-400 hover:text-gray-600">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Render cards view
  const renderCardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {paginatedItems.map((item, idx) => (
        <div 
          key={idx}
          className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md cursor-pointer transition-shadow ${
            selectedItems.has(idx.toString()) ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => onItemClick?.(item)}
        >
          <div className="flex items-start justify-between mb-3">
            <input
              type="checkbox"
              checked={selectedItems.has(idx.toString())}
              onChange={(e) => {
                e.stopPropagation();
                handleItemSelection(idx.toString(), e.target.checked);
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <button className="text-gray-400 hover:text-yellow-500">
              <Star className="w-4 h-4" />
            </button>
          </div>
          
          {columns.slice(0, 4).map(column => {
            const value = getNestedValue(item, column.key);
            return (
              <div key={column.key} className="mb-2">
                <div className="text-xs font-medium text-gray-500 uppercase">
                  {column.title}
                </div>
                <div className="text-sm text-gray-900">
                  {formatCellValue(value, column, item)}
                </div>
              </div>
            );
          })}
          
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onItemClick?.(item);
              }}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
            >
              <Eye className="w-4 h-4" />
              <span>View</span>
            </button>
            <button className="text-gray-400 hover:text-gray-600">
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // Render list view
  const renderListView = () => (
    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
      {paginatedItems.map((item, idx) => (
        <div 
          key={idx}
          className={`p-4 hover:bg-gray-50 cursor-pointer ${
            selectedItems.has(idx.toString()) ? 'bg-blue-50' : ''
          }`}
          onClick={() => onItemClick?.(item)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={selectedItems.has(idx.toString())}
                onChange={(e) => {
                  e.stopPropagation();
                  handleItemSelection(idx.toString(), e.target.checked);
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
              />
              
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  {columns.slice(0, 3).map(column => {
                    const value = getNestedValue(item, column.key);
                    return (
                      <div key={column.key} className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-500">
                          {column.title}:
                        </span>
                        <span className="text-sm text-gray-900">
                          {formatCellValue(value, column, item)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {columns.length > 3 && (
                  <div className="mt-2 flex flex-wrap gap-4">
                    {columns.slice(3).map(column => {
                      const value = getNestedValue(item, column.key);
                      return (
                        <div key={column.key} className="text-xs text-gray-600">
                          <span className="font-medium">{column.title}:</span> {formatCellValue(value, column, item)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onItemClick?.(item);
                }}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Search Results ({processedItems.length})
          </h3>
          
          {selectedItems.size > 0 && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              {selectedItems.size} selected
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* Export */}
          {onExport && (
            <div className="relative">
              <button
                onClick={() => onExport('csv')}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          )}

          {/* View Mode */}
          {onViewModeChange && (
            <div className="flex items-center bg-gray-100 rounded-md p-1">
              <button
                onClick={() => onViewModeChange('table')}
                className={`p-2 rounded ${viewMode === 'table' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('cards')}
                className={`p-2 rounded ${viewMode === 'cards' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : processedItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-2">No results found</div>
          <div className="text-sm text-gray-400">Try adjusting your search criteria</div>
        </div>
      ) : (
        <>
          {viewMode === 'table' && renderTableView()}
          {viewMode === 'cards' && renderCardsView()}
          {viewMode === 'list' && renderListView()}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, processedItems.length)} of {processedItems.length} results
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`px-3 py-2 text-sm rounded ${
                    pageNum === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResultsDisplay;
