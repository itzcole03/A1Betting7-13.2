/**
 * PR9: Inference Audit Panel Component
 * 
 * React component for displaying model inference observability data including
 * active/shadow models, performance metrics, and confidence distribution.
 */

import React from 'react';
import { 
  useInferenceAudit, 
  useConfidenceDistribution, 
  useShadowComparison,
  usePerformanceMetrics,
  AuditEntry 
} from '../inference/useInferenceAudit';

// Utility function for formatting numbers
const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toFixed(decimals);
};

// Utility function for formatting timestamps
const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString();
};

// Color coding for shadow differences
const getShadowDiffColor = (diff: number): string => {
  if (diff < 0.05) return 'text-green-600';
  if (diff < 0.1) return 'text-yellow-600';
  return 'text-red-600';
};

interface InferenceAuditPanelProps {
  className?: string;
  showRecentTable?: boolean;
  maxRecentEntries?: number;
}

export const InferenceAuditPanel: React.FC<InferenceAuditPanelProps> = ({
  className = '',
  showRecentTable = false,
  maxRecentEntries = 25,
}) => {
  const { 
    summary, 
    recentEntries, 
    registryInfo, 
    loading, 
    error, 
    lastUpdated,
    refresh,
    togglePolling,
    isPolling 
  } = useInferenceAudit({ maxRecentEntries });

  const confidenceDistribution = useConfidenceDistribution(summary);
  const shadowComparison = useShadowComparison(summary, recentEntries);
  const performanceMetrics = usePerformanceMetrics(summary, recentEntries);

  if (loading && !summary) {
    return (
      <div className={`inference-audit-panel ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading inference audit data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`inference-audit-panel ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error Loading Audit Data</h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={refresh}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`inference-audit-panel space-y-6 ${className}`}>
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Model Inference Audit</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={togglePolling}
            className={`px-4 py-2 rounded ${
              isPolling 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-gray-100 text-gray-800 border border-gray-200'
            }`}
          >
            {isPolling ? 'Polling On' : 'Polling Off'}
          </button>
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Last updated */}
      {lastUpdated && (
        <div className="text-sm text-gray-500">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}

      {/* Model information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Model</h3>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Version:</span> {registryInfo?.active_version || 'Unknown'}
            </div>
            <div>
              <span className="font-medium">Available Versions:</span> {registryInfo?.available_versions.length || 0}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shadow Model</h3>
          {shadowComparison.enabled ? (
            <div className="space-y-2">
              <div>
                <span className="font-medium">Version:</span> {shadowComparison.shadowModel || 'Unknown'}
              </div>
              <div>
                <span className="font-medium">Avg Difference:</span>{' '}
                {shadowComparison.avgDiff !== null ? (
                  <span className={getShadowDiffColor(shadowComparison.avgDiff)}>
                    {formatNumber(shadowComparison.avgDiff)}
                  </span>
                ) : 'N/A'}
              </div>
              <div>
                <span className="font-medium">Comparisons:</span> {shadowComparison.entryCount}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Shadow mode not enabled</div>
          )}
        </div>
      </div>

      {/* Performance metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">
            {formatNumber(performanceMetrics.avgLatency)} ms
          </div>
          <div className="text-sm text-gray-500">Avg Latency</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {formatNumber(performanceMetrics.successRate * 100, 1)}%
          </div>
          <div className="text-sm text-gray-500">Success Rate</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">
            {performanceMetrics.totalCount}
          </div>
          <div className="text-sm text-gray-500">Total Inferences</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">
            {performanceMetrics.errorCount}
          </div>
          <div className="text-sm text-gray-500">Errors</div>
        </div>
      </div>

      {/* Confidence distribution */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidence Distribution</h3>
        {confidenceDistribution.data.length > 0 ? (
          <div className="space-y-2">
            {confidenceDistribution.data.map(({ range, count }) => (
              <div key={range} className="flex items-center">
                <div className="w-16 text-sm font-mono">{range}</div>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                      style={{
                        width: `${confidenceDistribution.total > 0 
                          ? (count / confidenceDistribution.total) * 100 
                          : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div className="w-12 text-sm text-gray-600 text-right">{count}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">No confidence data available</div>
        )}
      </div>

      {/* Shadow comparison visualization */}
      {shadowComparison.enabled && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shadow Model Comparison</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">
                {shadowComparison.minDiff !== null ? formatNumber(shadowComparison.minDiff) : 'N/A'}
              </div>
              <div className="text-sm text-gray-500">Min Difference</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {shadowComparison.avgDiff !== null ? formatNumber(shadowComparison.avgDiff) : 'N/A'}
              </div>
              <div className="text-sm text-gray-500">Avg Difference</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">
                {shadowComparison.maxDiff !== null ? formatNumber(shadowComparison.maxDiff) : 'N/A'}
              </div>
              <div className="text-sm text-gray-500">Max Difference</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent inferences table (optional) */}
      {showRecentTable && recentEntries.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Inferences ({recentEntries.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">Time</th>
                  <th className="text-left py-2">Model</th>
                  <th className="text-left py-2">Prediction</th>
                  <th className="text-left py-2">Confidence</th>
                  <th className="text-left py-2">Latency</th>
                  <th className="text-left py-2">Shadow Diff</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.slice(0, 25).map((entry: AuditEntry) => (
                  <tr key={entry.request_id} className="border-b border-gray-100">
                    <td className="py-2 font-mono text-xs">
                      {formatTimestamp(entry.timestamp)}
                    </td>
                    <td className="py-2 font-mono text-xs">{entry.model_version}</td>
                    <td className="py-2">{formatNumber(entry.prediction)}</td>
                    <td className="py-2">{formatNumber(entry.confidence)}</td>
                    <td className="py-2">{formatNumber(entry.latency_ms)} ms</td>
                    <td className="py-2">
                      {entry.shadow_diff !== undefined ? (
                        <span className={getShadowDiffColor(entry.shadow_diff)}>
                          {formatNumber(entry.shadow_diff)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        entry.status === 'success' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InferenceAuditPanel;