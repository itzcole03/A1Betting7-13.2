/**
 * Legacy Usage Panel
 * 
 * React component for displaying legacy endpoint usage statistics and migration
 * readiness in diagnostics dashboards. Provides color-coded warnings and
 * actionable migration guidance.
 * 
 * Features:
 * - Real-time usage monitoring
 * - Color-coded severity indicators
 * - Migration readiness scoring
 * - Endpoint forwarding information
 * - Sunset date tracking
 */

import React, { useState } from 'react';
import { useLegacyUsage, type LegacyEndpointEntry } from '../legacy/useLegacyUsage';

interface LegacyUsagePanelProps {
  pollInterval?: number;
  threshold?: number;
  onError?: (error: Error) => void;
}

const LegacyUsagePanel: React.FC<LegacyUsagePanelProps> = ({ 
  pollInterval = 30000, 
  threshold = 50,
  onError 
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const { 
    data, 
    readiness, 
    loading, 
    error, 
    refetch, 
    totalCalls, 
    hasHighUsage, 
    isLegacyEnabled 
  } = useLegacyUsage({ 
    pollInterval, 
    threshold, 
    onError,
    includeReadiness: true
  });

  if (error) {
    return (
      <div style={{ fontSize: 12, color: '#ef4444', padding: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px' }}>
        <strong>Legacy Usage Error:</strong> {error}
        <button 
          onClick={refetch} 
          style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 6px' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div style={{ fontSize: 12, color: '#6b7280', padding: '8px' }}>
        Loading legacy usage data...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ fontSize: 12, color: '#6b7280', padding: '8px' }}>
        No legacy usage data available
      </div>
    );
  }

  // Determine overall status color based on various factors
  const getStatusColor = (): string => {
    if (!isLegacyEnabled) return '#ef4444'; // Red - endpoints disabled
    if (hasHighUsage) return '#f59e0b'; // Orange - high usage
    if (totalCalls > 100) return '#eab308'; // Yellow - moderate usage
    return '#10b981'; // Green - low usage
  };

  const getStatusText = (): string => {
    if (!isLegacyEnabled) return 'DISABLED';
    if (hasHighUsage) return 'HIGH USAGE';
    if (totalCalls > 100) return 'MODERATE USAGE';
    return 'LOW USAGE';
  };

  const getReadinessColor = (score: number): string => {
    if (score >= 0.8) return '#10b981'; // Green
    if (score >= 0.5) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const formatTimestamp = (timestamp?: number): string => {
    if (!timestamp) return 'Never';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  return (
    <div style={{ 
      fontSize: 12, 
      border: '1px solid #e5e7eb', 
      borderRadius: '6px', 
      padding: '12px',
      backgroundColor: '#ffffff'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getStatusColor()
            }}
          />
          <strong>Legacy Endpoints ({getStatusText()})</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#6b7280' }}>
            {totalCalls} total calls
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '12px',
              color: '#3b82f6',
              cursor: 'pointer'
            }}
          >
            {expanded ? '▼' : '▶'} Details
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: expanded ? '12px' : '0' }}>
        <div>
          <span style={{ color: '#6b7280' }}>Enabled: </span>
          <span style={{ color: isLegacyEnabled ? '#10b981' : '#ef4444' }}>
            {isLegacyEnabled ? 'Yes' : 'No'}
          </span>
        </div>
        <div>
          <span style={{ color: '#6b7280' }}>Endpoints: </span>
          <span>{data.endpoints.length}</span>
        </div>
        <div>
          <span style={{ color: '#6b7280' }}>Runtime: </span>
          <span>{formatDuration(data.since_seconds)}</span>
        </div>
        {data.sunset_date && (
          <div>
            <span style={{ color: '#6b7280' }}>Sunset: </span>
            <span style={{ color: '#f59e0b' }}>{data.sunset_date}</span>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
          {/* Migration Readiness */}
          {readiness && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '13px', 
                fontWeight: 'bold' 
              }}>
                Migration Readiness
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px' 
                }}>
                  <span>Score:</span>
                  <span style={{ 
                    color: getReadinessColor(readiness.score),
                    fontWeight: 'bold'
                  }}>
                    {(readiness.score * 100).toFixed(0)}%
                  </span>
                  <span style={{ color: '#6b7280' }}>
                    ({readiness.readiness_level})
                  </span>
                </div>
                <div style={{ color: '#6b7280' }}>
                  {readiness.usage_rate_per_hour.toFixed(1)} calls/hour
                </div>
              </div>
              
              {/* Recommendations */}
              {readiness.analysis.recommendations.length > 0 && (
                <div style={{ 
                  backgroundColor: '#f9fafb', 
                  padding: '8px', 
                  borderRadius: '4px',
                  fontSize: '11px'
                }}>
                  {readiness.analysis.recommendations.map((rec, index) => (
                    <div key={index} style={{ marginBottom: '2px' }}>
                      {rec}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Endpoint List */}
          <div>
            <h4 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '13px', 
              fontWeight: 'bold' 
            }}>
              Legacy Endpoints
            </h4>
            
            {data.endpoints.length === 0 ? (
              <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
                No legacy endpoints accessed yet
              </div>
            ) : (
              <div style={{ 
                maxHeight: '200px', 
                overflowY: 'auto',
                border: '1px solid #e5e7eb',
                borderRadius: '4px'
              }}>
                {data.endpoints
                  .sort((a, b) => b.count - a.count)
                  .map((endpoint: LegacyEndpointEntry, index: number) => (
                    <div 
                      key={endpoint.path} 
                      style={{ 
                        padding: '6px 8px',
                        borderBottom: index < data.endpoints.length - 1 ? '1px solid #f3f4f6' : 'none',
                        backgroundColor: endpoint.count > threshold ? '#fef3cd' : 'transparent'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' 
                      }}>
                        <div>
                          <code style={{ 
                            backgroundColor: '#f3f4f6', 
                            padding: '1px 4px', 
                            borderRadius: '3px',
                            fontSize: '10px'
                          }}>
                            {endpoint.path}
                          </code>
                          {endpoint.forward && (
                            <div style={{ 
                              fontSize: '10px', 
                              color: '#6b7280',
                              marginTop: '2px'
                            }}>
                              → <code>{endpoint.forward}</code>
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ 
                            fontWeight: 'bold',
                            color: endpoint.count > threshold ? '#d97706' : '#374151'
                          }}>
                            {endpoint.count}
                          </div>
                          <div style={{ fontSize: '10px', color: '#6b7280' }}>
                            {formatTimestamp(endpoint.last_access_ts)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <div style={{ marginTop: '12px', textAlign: 'right' }}>
            <button
              onClick={refetch}
              disabled={loading}
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegacyUsagePanel;