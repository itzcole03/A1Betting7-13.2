import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Activity,
  Server,
  Wifi,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Bug,
} from 'lucide-react';
import cheatsheetsService from '../../../services/cheatsheetsService';
import APITester from '../../../utils/apiTester';

interface DiagnosticInfo {
  apiHealthy: boolean;
  responseTime?: number;
  errorDetails?: string;
  backendConnected: boolean;
  diagnosticData?: any;
  lastChecked: Date;
}

interface CheatsheetsDiagnosticProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage?: string;
}

const CheatsheetsDiagnostic: React.FC<CheatsheetsDiagnosticProps> = ({
  isOpen,
  onClose,
  errorMessage
}) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      console.log('[Diagnostics] Starting comprehensive API diagnostics...');
      
      // Run comprehensive API health report
      const healthReport = await APITester.generateHealthReport();
      
      // Test basic service health
      const serviceHealthy = await cheatsheetsService.healthCheck();
      
      // Get detailed diagnostic info
      let diagnosticData = null;
      try {
        diagnosticData = await cheatsheetsService.getDiagnosticInfo();
      } catch (diagError) {
        console.warn('Could not fetch diagnostic data:', diagError);
      }

      // Compile error details from health report
      let errorDetails = '';
      if (healthReport.overall.issues.length > 0) {
        errorDetails = healthReport.overall.issues.join('\n');
        
        // Add specific endpoint details
        if (!healthReport.endpoints.opportunities.success) {
          errorDetails += `\n\nOpportunities Endpoint Details:\n`;
          errorDetails += `Status: ${healthReport.endpoints.opportunities.status || 'N/A'}\n`;
          errorDetails += `Error: ${healthReport.endpoints.opportunities.error || 'Unknown'}\n`;
          if (healthReport.endpoints.opportunities.responseBody) {
            errorDetails += `Response: ${JSON.stringify(healthReport.endpoints.opportunities.responseBody, null, 2)}`;
          }
        }
      }

      setDiagnostics({
        apiHealthy: healthReport.overall.healthy,
        responseTime: healthReport.endpoints.health.responseTime || 0,
        errorDetails: errorDetails || undefined,
        backendConnected: serviceHealthy,
        diagnosticData: {
          serviceHealth: serviceHealthy,
          healthReport,
          customDiagnostics: diagnosticData
        },
        lastChecked: new Date(),
      });

      console.log('[Diagnostics] Diagnostics completed', healthReport);

    } catch (error) {
      console.error('[Diagnostics] Diagnostics failed:', error);
      setDiagnostics({
        apiHealthy: false,
        backendConnected: false,
        errorDetails: error instanceof Error ? error.message : String(error),
        lastChecked: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    await runDiagnostics();
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getStatusIcon = (healthy: boolean) => {
    return healthy ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getStatusBadge = (healthy: boolean, text: string = healthy ? 'HEALTHY' : 'ERROR') => {
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${
        healthy ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
      }`}>
        {text}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4 bg-slate-800 border border-slate-700 rounded-xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bug className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-bold text-white">Cheatsheets API Diagnostics</h2>
            </div>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded border border-slate-600"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Error Summary */}
          {errorMessage && (
            <div className="border border-red-500 bg-red-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-red-700">
                  <strong>Current Error:</strong> {errorMessage}
                </span>
              </div>
            </div>
          )}

          {/* Control Panel */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleRetry} 
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Running...' : 'Run Diagnostics'}</span>
            </button>
            {retryCount > 0 && (
              <span className="text-sm text-gray-500">
                Attempts: {retryCount}
              </span>
            )}
          </div>

          {/* Diagnostic Results */}
          {diagnostics && (
            <div className="space-y-4">
              {/* API Status */}
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Server className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-semibold text-white">API Status</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">Health Check</span>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(diagnostics.apiHealthy)}
                      {getStatusBadge(diagnostics.apiHealthy)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">Response Time</span>
                    <span className="text-sm text-gray-300">
                      {diagnostics.responseTime ? `${diagnostics.responseTime}ms` : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">Last Checked</span>
                    <span className="text-sm text-gray-300">
                      {diagnostics.lastChecked.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Details */}
              {diagnostics.errorDetails && (
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-4 text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Error Details</h3>
                  </div>
                  <div className="bg-red-950 border border-red-800 rounded-lg p-4">
                    <pre className="text-sm text-red-300 whitespace-pre-wrap">
                      {diagnostics.errorDetails}
                    </pre>
                  </div>
                </div>
              )}

              {/* Backend Connection */}
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Wifi className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-semibold text-white">Backend Connection</h3>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Connection Status</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(diagnostics.backendConnected)}
                    {getStatusBadge(diagnostics.backendConnected)}
                  </div>
                </div>
              </div>

              {/* Diagnostic Data */}
              {diagnostics.diagnosticData && (
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Database className="w-5 h-5 text-white" />
                    <h3 className="text-lg font-semibold text-white">Backend Information</h3>
                  </div>
                  <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-auto max-h-60">
                      {JSON.stringify(diagnostics.diagnosticData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Troubleshooting Steps */}
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Activity className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-semibold text-white">Troubleshooting Steps</h3>
                </div>
                <div className="space-y-3">
                  {diagnostics.errorDetails?.includes('500') && (
                    <div className="border border-orange-500 bg-orange-950 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-orange-400" />
                        <span className="text-orange-300">
                          <strong>Server Error (500):</strong> This indicates a backend API issue. 
                          Check backend logs for database connections, API route handlers, or server configuration problems.
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-white">Common Solutions:</h4>
                    <ul className="text-sm space-y-1 text-gray-300">
                      <li>• Check if the backend server is running</li>
                      <li>• Verify database connections are working</li>
                      <li>• Check backend API route configurations</li>
                      <li>• Review backend server logs for errors</li>
                      <li>• Ensure all required environment variables are set</li>
                      <li>• Test API endpoints directly using tools like Postman</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-400">Running diagnostics...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheatsheetsDiagnostic;
