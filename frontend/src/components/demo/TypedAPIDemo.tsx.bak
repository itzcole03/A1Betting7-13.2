import React from 'react';
import { useAPIHealth } from '../../hooks/useTypedAPI';

/**
 * TypedAPIDemo - Simple demonstration of the typed API client
 * 
 * This component showcases basic type-safe API usage:
 * - Health check endpoint with proper typing
 * - Loading states and error handling
 * - TypeScript IntelliSense support
 */
const TypedAPIDemo: React.FC = () => {
  const healthCheck = useAPIHealth();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Typed API Client Demo
      </h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          API Health Status
        </h2>
        
        {healthCheck.loading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Checking API health...</span>
          </div>
        ) : healthCheck.error ? (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded">
            <div className="text-red-600 dark:text-red-400 font-medium">
              ❌ Health check failed
            </div>
            <div className="text-red-500 dark:text-red-300 text-sm mt-1">
              {healthCheck.error.message}
            </div>
          </div>
        ) : healthCheck.data ? (
          <div className="p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded">
            <div className="text-green-600 dark:text-green-400 font-medium">
              ✅ API is healthy
            </div>
            <div className="text-green-700 dark:text-green-300 text-sm mt-1">
              Status: {healthCheck.data.status}
            </div>
          </div>
        ) : (
          <div className="text-gray-600 dark:text-gray-400">
            No health data available
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={() => healthCheck.refetch()}
            disabled={healthCheck.loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
          >
            {healthCheck.loading ? 'Checking...' : 'Refresh Health Check'}
          </button>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
          ✅ Type Safety Features
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Full TypeScript support with IntelliSense</li>
          <li>• Automatic loading state management</li>
          <li>• Comprehensive error handling</li>
          <li>• Type-safe API responses</li>
          <li>• Consistent hook patterns</li>
        </ul>
      </div>
    </div>
  );
};

export default TypedAPIDemo;
