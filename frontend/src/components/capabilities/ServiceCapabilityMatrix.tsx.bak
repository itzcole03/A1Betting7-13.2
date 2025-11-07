/**
 * Service Capability Matrix Component
 * 
 * Displays per-service status badges and capability information
 * Integrates with backend /api/system/capabilities endpoint
 */

import React, { useEffect, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle, Clock, XCircle, Zap } from 'lucide-react';

export interface ServiceCapability {
  name: string;
  status: 'UP' | 'DEGRADED' | 'DOWN' | 'DEMO';
  version: string;
  category: string;
  responseTime?: number;
  allowDemo: boolean;
  required: boolean;
  lastCheck: string;
  errorCount: number;
  uptime: number;
  degradedPolicy?: string;
  dependencies?: string[];
  capabilities?: string[];
}

export interface CapabilityMatrixResponse {
  matrix_version: string;
  last_updated: string;
  global_status: string;
  services: Record<string, ServiceCapability>;
  summary: {
    total_services: number;
    status_breakdown: Record<string, number>;
    category_breakdown: Record<string, number>;
    overall_health: number;
    critical_services_down: number;
    required_services: number;
    optional_services: number;
  };
  demo_mode_services: string[];
  response_time_ms: number;
}

interface ServiceCapabilityMatrixProps {
  refreshInterval?: number;
  showMetadata?: boolean;
  format?: 'summary' | 'full' | 'minimal';
  onStatusChange?: (serviceName: string, oldStatus: string, newStatus: string) => void;
  className?: string;
}

const StatusIcon: React.FC<{ status: string; size?: number }> = ({ status, size = 16 }) => {
  const iconProps = { size, className: "inline" };
  
  switch (status) {
    case 'UP':
      return <CheckCircle {...iconProps} className={`${iconProps.className} text-green-500`} />;
    case 'DEGRADED':
      return <AlertCircle {...iconProps} className={`${iconProps.className} text-yellow-500`} />;
    case 'DOWN':
      return <XCircle {...iconProps} className={`${iconProps.className} text-red-500`} />;
    case 'DEMO':
      return <Zap {...iconProps} className={`${iconProps.className} text-blue-500`} />;
    default:
      return <Clock {...iconProps} className={`${iconProps.className} text-gray-500`} />;
  }
};

const StatusBadge: React.FC<{ 
  service: ServiceCapability; 
  showDetails?: boolean;
  onClick?: () => void;
}> = ({ service, showDetails = false, onClick }) => {
  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'UP': return 'bg-green-100 text-green-800 border-green-200';
      case 'DEGRADED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DOWN': return 'bg-red-100 text-red-800 border-red-200';
      case 'DEMO': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatLastCheck = (lastCheck: string) => {
    try {
      const date = new Date(lastCheck);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
      return `${Math.floor(diffMinutes / 1440)}d ago`;
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div 
      className={`inline-flex items-center gap-2 px-3 py-1 text-sm border rounded-lg cursor-pointer hover:shadow-md transition-all ${getBadgeColor(service.status)}`}
      onClick={onClick}
      title={`${service.name}: ${service.status} (${formatLastCheck(service.lastCheck)})`}
    >
      <StatusIcon status={service.status} size={14} />
      <span className="font-medium">{service.name}</span>
      {service.required && <span className="text-xs bg-white bg-opacity-50 px-1 rounded">REQ</span>}
      {service.allowDemo && <span className="text-xs bg-white bg-opacity-50 px-1 rounded">DEMO</span>}
      
      {showDetails && (
        <div className="text-xs opacity-75">
          {service.responseTime && `${service.responseTime.toFixed(0)}ms`}
          {service.uptime < 100 && ` | ${service.uptime}% up`}
          {service.errorCount > 0 && ` | ${service.errorCount} errors`}
        </div>
      )}
    </div>
  );
};

export const ServiceCapabilityMatrix: React.FC<ServiceCapabilityMatrixProps> = ({
  refreshInterval = 30000, // 30 seconds
  showMetadata = false,
  format = 'full',
  onStatusChange,
  className = ''
}) => {
  const [capabilityMatrix, setCapabilityMatrix] = useState<CapabilityMatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const fetchCapabilities = useCallback(async () => {
    try {
      const url = new URL('/api/system/capabilities', window.location.origin);
      url.searchParams.set('include_metadata', showMetadata.toString());
      url.searchParams.set('format', format);

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: CapabilityMatrixResponse = await response.json();
      
      // Check for status changes
      if (capabilityMatrix && onStatusChange) {
        Object.entries(data.services).forEach(([serviceName, newService]) => {
          const oldService = capabilityMatrix.services[serviceName];
          if (oldService && oldService.status !== newService.status) {
            onStatusChange(serviceName, oldService.status, newService.status);
          }
        });
      }

      setCapabilityMatrix(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      // Use proper error logging instead of console.error
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error occurred while fetching capabilities');
      }
    } finally {
      setLoading(false);
    }
  }, [showMetadata, format, capabilityMatrix, onStatusChange]);

  useEffect(() => {
    fetchCapabilities();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchCapabilities, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchCapabilities, refreshInterval]);

  const getGlobalStatusColor = (status: string) => {
    switch (status) {
      case 'UP': return 'text-green-600';
      case 'DEGRADED': return 'text-yellow-600';
      case 'DOWN': return 'text-red-600';
      case 'DEMO': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const categorizeServices = (services: Record<string, ServiceCapability>) => {
    const categories: Record<string, ServiceCapability[]> = {};
    
    Object.values(services).forEach(service => {
      const category = service.category || 'other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(service);
    });

    // Sort services within each category by name
    Object.keys(categories).forEach(category => {
      categories[category].sort((a, b) => a.name.localeCompare(b.name));
    });

    return categories;
  };

  const formatResponseTime = (timeMs: number) => {
    if (timeMs < 1) return '<1ms';
    if (timeMs < 1000) return `${Math.round(timeMs)}ms`;
    return `${(timeMs / 1000).toFixed(1)}s`;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-6 ${className}`}>
        <Clock className="animate-spin mr-2" size={20} />
        <span>Loading service capabilities...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 border border-red-200 rounded-lg bg-red-50 ${className}`}>
        <div className="flex items-center mb-2">
          <XCircle className="text-red-500 mr-2" size={20} />
          <span className="font-medium text-red-800">Failed to load capabilities</span>
        </div>
        <p className="text-red-600 mb-3">{error}</p>
        <button 
          onClick={fetchCapabilities}
          className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!capabilityMatrix) {
    return (
      <div className={`p-6 text-center text-gray-500 ${className}`}>
        No capability data available
      </div>
    );
  }

  const categories = categorizeServices(capabilityMatrix.services);
  const { summary } = capabilityMatrix;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Global Status Header */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <StatusIcon status={capabilityMatrix.global_status} size={24} />
            <div>
              <h2 className={`text-xl font-semibold ${getGlobalStatusColor(capabilityMatrix.global_status)}`}>
                System Status: {capabilityMatrix.global_status}
              </h2>
              <p className="text-sm text-gray-600">
                Matrix v{capabilityMatrix.matrix_version} | Last updated: {capabilityMatrix.last_updated}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Response time: {formatResponseTime(capabilityMatrix.response_time_ms)}</p>
            {lastUpdated && (
              <p className="text-xs text-gray-500">
                Refreshed: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{summary.total_services}</div>
            <div className="text-sm text-gray-600">Total Services</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.status_breakdown.UP || 0}</div>
            <div className="text-sm text-gray-600">Healthy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.status_breakdown.DEGRADED || 0}</div>
            <div className="text-sm text-gray-600">Degraded</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{summary.status_breakdown.DOWN || 0}</div>
            <div className="text-sm text-gray-600">Down</div>
          </div>
        </div>

        {/* Demo Mode Services */}
        {capabilityMatrix.demo_mode_services.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center mb-2">
              <Zap className="text-blue-500 mr-2" size={16} />
              <span className="font-medium text-blue-800">Demo Mode Active</span>
            </div>
            <p className="text-sm text-blue-600">
              Services running in demo mode: {capabilityMatrix.demo_mode_services.join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Service Categories */}
      {Object.entries(categories).map(([categoryName, services]) => (
        <div key={categoryName} className="border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-3 capitalize">
            {categoryName} Services ({services.length})
          </h3>
          <div className="flex flex-wrap gap-3">
            {services.map((service) => (
              <StatusBadge
                key={service.name}
                service={service}
                showDetails={showMetadata}
                onClick={() => setSelectedService(selectedService === service.name ? null : service.name)}
              />
            ))}
          </div>

          {/* Service Details */}
          {selectedService && services.find(s => s.name === selectedService) && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              {(() => {
                const service = services.find(s => s.name === selectedService)!;
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{service.name} v{service.version}</h4>
                      <StatusBadge service={service} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Category:</span> {service.category}
                      </div>
                      <div>
                        <span className="font-medium">Required:</span> {service.required ? 'Yes' : 'No'}
                      </div>
                      <div>
                        <span className="font-medium">Demo Allowed:</span> {service.allowDemo ? 'Yes' : 'No'}
                      </div>
                      <div>
                        <span className="font-medium">Uptime:</span> {service.uptime}%
                      </div>
                      {service.responseTime && (
                        <div>
                          <span className="font-medium">Response Time:</span> {formatResponseTime(service.responseTime)}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Error Count:</span> {service.errorCount}
                      </div>
                    </div>
                    
                    {service.dependencies && service.dependencies.length > 0 && (
                      <div>
                        <span className="font-medium">Dependencies:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {service.dependencies.map((dep) => (
                            <span key={dep} className="text-xs bg-gray-200 px-2 py-1 rounded">
                              {dep}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {service.capabilities && service.capabilities.length > 0 && (
                      <div>
                        <span className="font-medium">Capabilities:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {service.capabilities.map((cap) => (
                            <span key={cap} className="text-xs bg-blue-100 px-2 py-1 rounded">
                              {cap}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      ))}

      {/* Refresh Controls */}
      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
        <span>Auto-refresh: {refreshInterval > 0 ? `Every ${refreshInterval / 1000}s` : 'Disabled'}</span>
        <button 
          onClick={fetchCapabilities}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Now'}
        </button>
      </div>
    </div>
  );
};

export default ServiceCapabilityMatrix;