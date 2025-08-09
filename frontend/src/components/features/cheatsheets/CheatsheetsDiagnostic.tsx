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

  const getStatusBadge = (healthy: boolean) => {
    return (
      <Badge className={healthy ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
        {healthy ? 'HEALTHY' : 'ERROR'}
      </Badge>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Bug className="w-6 h-6 text-red-500" />
              <span>Cheatsheets API Diagnostics</span>
            </CardTitle>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Summary */}
          {errorMessage && (
            <Alert className="border-red-500 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                <strong>Current Error:</strong> {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Control Panel */}
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleRetry} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Running...' : 'Run Diagnostics'}
            </Button>
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
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Server className="w-5 h-5" />
                    <span>API Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Health Check</span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(diagnostics.apiHealthy)}
                        {getStatusBadge(diagnostics.apiHealthy)}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Response Time</span>
                      <span className="text-sm">
                        {diagnostics.responseTime ? `${diagnostics.responseTime}ms` : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Last Checked</span>
                      <span className="text-sm">
                        {diagnostics.lastChecked.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Error Details */}
              {diagnostics.errorDetails && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2 text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                      <span>Error Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <pre className="text-sm text-red-700 whitespace-pre-wrap">
                        {diagnostics.errorDetails}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Backend Connection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Wifi className="w-5 h-5" />
                    <span>Backend Connection</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Connection Status</span>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(diagnostics.backendConnected)}
                      {getStatusBadge(diagnostics.backendConnected)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Diagnostic Data */}
              {diagnostics.diagnosticData && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Database className="w-5 h-5" />
                      <span>Backend Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 border rounded-lg p-4">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(diagnostics.diagnosticData, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Troubleshooting Steps */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Troubleshooting Steps</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {diagnostics.errorDetails?.includes('500') && (
                      <Alert className="border-orange-500 bg-orange-50">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-700">
                          <strong>Server Error (500):</strong> This indicates a backend API issue. 
                          Check backend logs for database connections, API route handlers, or server configuration problems.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Common Solutions:</h4>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li>• Check if the backend server is running</li>
                        <li>• Verify database connections are working</li>
                        <li>• Check backend API route configurations</li>
                        <li>• Review backend server logs for errors</li>
                        <li>• Ensure all required environment variables are set</li>
                        <li>• Test API endpoints directly using tools like Postman</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Running diagnostics...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CheatsheetsDiagnostic;
