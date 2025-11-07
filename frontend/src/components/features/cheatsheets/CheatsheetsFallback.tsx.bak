import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface CheatsheetsFallbackProps {
  error?: Error;
  onRetry?: () => void;
}

const CheatsheetsFallback: React.FC<CheatsheetsFallbackProps> = ({ error, onRetry }) => {
  const handleRefresh = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Cheatsheets Dashboard
            </h1>
            <p className="text-gray-400">PropFinder-style betting opportunities</p>
          </div>

          {/* Error Display */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-4">
                Unable to Load Dashboard
              </h2>
              
              {error && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
                  <p className="text-red-300 text-sm font-mono">
                    {error.message}
                  </p>
                </div>
              )}

              <p className="text-gray-400 mb-6">
                The cheatsheets dashboard encountered an error while loading. 
                This is usually temporary and can be resolved by refreshing the page.
              </p>

              <div className="space-y-4">
                <button
                  onClick={handleRefresh}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg mx-auto"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh Dashboard</span>
                </button>

                <div className="text-sm text-gray-500">
                  <p>If the problem persists:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Clear your browser cache</li>
                    <li>• Check your internet connection</li>
                    <li>• Try again in a few minutes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Data Display */}
          <div className="mt-8 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Demo Data Available</h3>
            <p className="text-gray-400 mb-4">
              While the full dashboard loads, here's what you can expect to see:
            </p>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-gray-300">Player Props</span>
                <span className="text-cyan-400">50+ opportunities</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-gray-300">Sports Coverage</span>
                <span className="text-cyan-400">MLB, NBA, NFL</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-gray-300">Edge Calculation</span>
                <span className="text-cyan-400">Real-time analysis</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-300">Export Options</span>
                <span className="text-cyan-400">CSV, JSON</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheatsheetsFallback;
