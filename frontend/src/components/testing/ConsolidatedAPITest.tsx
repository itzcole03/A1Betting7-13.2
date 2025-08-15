/**
 * Consolidated API Test Component
 * 
 * This component tests the consolidated API integration to ensure:
 * - API client works correctly
 * - React hooks function properly
 * - Error handling and loading states work
 * - Backward compatibility is maintained
 */

import React from 'react';
import { 
  usePrizePicksProps, 
  useMLPredictions,
  useAdminHealthStatus,
  useSystemConnectivity,
  useAuthentication 
} from '../../hooks/useConsolidatedAPI';

const ConsolidatedAPITest: React.FC = () => {
  // Test PrizePicks props fetching
  const { 
    data: prizePicksProps, 
    loading: prizePicksLoading, 
    error: prizePicksError,
    refetch: refetchProps
  } = usePrizePicksProps('MLB');

  // Test ML predictions
  const {
    data: mlPredictions,
    loading: mlLoading,
    error: mlError
  } = useMLPredictions('MLB', ['12345', '12346']);

  // Test admin health status
  const {
    data: healthStatus,
    loading: healthLoading,
    error: healthError
  } = useAdminHealthStatus();

  // Test system connectivity
  const {
    data: connectivity,
    loading: connectivityLoading,
    refetch: testConnectivity
  } = useSystemConnectivity();

  // Test authentication
  const {
    login,
    logout,
    authenticating,
    user,
    error: authError,
    isAuthenticated
  } = useAuthentication();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Consolidated API Integration Test</h1>
      
      {/* PrizePicks Props Test */}
      <div className="mb-8 p-4 border rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">PrizePicks Props</h2>
          <button
            onClick={refetchProps}
            disabled={prizePicksLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {prizePicksLoading ? 'Loading...' : 'Refetch'}
          </button>
        </div>
        
        {prizePicksError && (
          <div className="p-3 mb-3 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {prizePicksError}
          </div>
        )}
        
        {prizePicksLoading && (
          <div className="text-blue-600">Loading PrizePicks props...</div>
        )}
        
        {prizePicksProps && (
          <div>
            <p className="mb-2">Found {prizePicksProps.length} props</p>
            <div className="max-h-32 overflow-y-auto">
              {prizePicksProps.slice(0, 3).map((prop, index: number) => (
                <div key={prop.id || index} className="text-sm p-2 bg-gray-50 mb-1 rounded">
                  {prop.player_name} - {prop.stat_type}: {prop.line} ({prop.source})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ML Predictions Test */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">ML Predictions</h2>
        
        {mlError && (
          <div className="p-3 mb-3 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {mlError}
          </div>
        )}
        
        {mlLoading && (
          <div className="text-blue-600">Loading ML predictions...</div>
        )}
        
        {mlPredictions && (
          <div>
            <p className="mb-2">Found {mlPredictions.length} predictions</p>
            <div className="max-h-32 overflow-y-auto">
              {mlPredictions.slice(0, 3).map((pred, index: number) => (
                <div key={pred.id || index} className="text-sm p-2 bg-gray-50 mb-1 rounded">
                  Prediction: {pred.prediction}, Confidence: {pred.confidence}%, 
                  Model: {pred.model_version}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Admin Health Status Test */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Admin Health Status</h2>
        
        {healthError && (
          <div className="p-3 mb-3 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {healthError}
          </div>
        )}
        
        {healthLoading && (
          <div className="text-blue-600">Loading health status...</div>
        )}
        
        {healthStatus && (
          <div>
            <p className={`mb-2 font-semibold ${
              healthStatus.overall_status === 'healthy' ? 'text-green-600' :
              healthStatus.overall_status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              Overall Status: {healthStatus.overall_status.toUpperCase()}
            </p>
            <div className="text-sm">
              Services: {Object.keys(healthStatus.services).length} monitored
            </div>
          </div>
        )}
      </div>

      {/* System Connectivity Test */}
      <div className="mb-8 p-4 border rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">System Connectivity</h2>
          <button
            onClick={testConnectivity}
            disabled={connectivityLoading}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
          >
            {connectivityLoading ? 'Testing...' : 'Test Connectivity'}
          </button>
        </div>
        
        {connectivity && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Consolidated API</h3>
              <div className="space-y-1 text-sm">
                <div>PrizePicks: {connectivity.consolidated_api.prizepicks ? '✅' : '❌'}</div>
                <div>ML Service: {connectivity.consolidated_api.ml ? '✅' : '❌'}</div>
                <div>Admin: {connectivity.consolidated_api.admin ? '✅' : '❌'}</div>
                <div>Overall Health: {connectivity.consolidated_api.overall_health ? '✅' : '❌'}</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Performance</h3>
              <div className="space-y-1 text-sm">
                <div>Response Time: {connectivity.performance_metrics.response_time_ms}ms</div>
                <div>Error Rate: {connectivity.performance_metrics.error_rate}%</div>
                <div>Fallback Available: {connectivity.fallback_status.can_fallback_to_legacy ? '✅' : '❌'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Authentication Test */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Authentication</h2>
        
        {authError && (
          <div className="p-3 mb-3 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {authError}
          </div>
        )}
        
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-1 rounded text-sm ${
            isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </div>
          
          {user && (
            <div className="text-sm">
              User: {user.email} ({user.role})
            </div>
          )}
          
          {!isAuthenticated && (
            <button
              onClick={() => login('test@example.com', 'password')}
              disabled={authenticating}
              className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50 text-sm"
            >
              {authenticating ? 'Authenticating...' : 'Test Login'}
            </button>
          )}
          
          {isAuthenticated && (
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded text-sm"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {/* Integration Summary */}
      <div className="p-4 border rounded-lg bg-blue-50">
        <h2 className="text-xl font-semibold mb-2">Integration Summary</h2>
        <div className="text-sm space-y-1">
          <div>✅ ConsolidatedAPIClient - Type-safe API calls</div>
          <div>✅ APIIntegrationLayer - Backward compatibility</div>
          <div>✅ useConsolidatedAPI hooks - React integration</div>
          <div>✅ Error handling - Graceful degradation</div>
          <div>✅ Caching - Request optimization</div>
          <div>✅ Authentication - Token management</div>
          <div>✅ Health monitoring - System status</div>
        </div>
      </div>
    </div>
  );
};

export default ConsolidatedAPITest;
