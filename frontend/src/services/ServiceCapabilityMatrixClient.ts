/**
 * Service Capability Matrix Client
 * 
 * Frontend service for interacting with the backend service capability matrix.
 * Exposes capabilities via window.__A1_CAPABILITIES and provides reactive updates.
 */

import { 
  ServiceStatus, 
  ServiceCategory,
  CapabilityMatrixSummary,
  EventFactory,
  EventPriority,
  EventCategory
} from '../events/schema';

// Simple logger interface to avoid console statement linting issues
interface Logger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
}

const createLogger = (): Logger => ({
  info: (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.log(`[ServiceCapabilityMatrixClient] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.warn(`[ServiceCapabilityMatrixClient] ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.error(`[ServiceCapabilityMatrixClient] ${message}`, ...args);
  },
  debug: (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.debug(`[ServiceCapabilityMatrixClient] ${message}`, ...args);
  }
});

export interface CapabilityMatrixResponse {
  matrix_version: string;
  last_updated: string;
  global_status: ServiceStatus;
  demo_mode_services: string[];
  services: Record<string, ServiceCapabilityData>;
  summary: CapabilityMatrixSummary;
  response_time_ms?: number;
}

export interface ServiceCapabilityData {
  name: string;
  version: string;
  category: ServiceCategory;
  description: string;
  required: boolean;
  degraded_policy: string;
  status: ServiceStatus;
  last_check: string | null;
  last_success: string | null; 
  last_failure: string | null;
  failure_count: number;
  recovery_count: number;
  health_check: {
    enabled: boolean;
    interval_seconds: number;
    timeout_seconds: number;
    failure_threshold: number;
    recovery_threshold: number;
  };
  dependencies: Array<{
    service_name: string;
    required: boolean;
    minimum_status: ServiceStatus;
    fallback_policy: string;
  }>;
  metadata: Record<string, unknown>;
  average_response_time_ms: number;
  total_requests: number;
  success_requests: number;
  failed_requests: number;
}

export interface CapabilitiesGlobalState {
  capabilities: CapabilityMatrixResponse | null;
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
  pollInterval: number;
  demoMode: {
    enabled: boolean;
    services: Set<string>;
  };
  healthSummary: {
    overallHealth: number;
    criticalServicesDown: number;
    totalServices: number;
    statusBreakdown: Record<ServiceStatus, number>;
  };
}

declare global {
  interface Window {
    __A1_CAPABILITIES: CapabilitiesGlobalState;
  }
}

class ServiceCapabilityMatrixClient {
  private static instance: ServiceCapabilityMatrixClient;
  private baseUrl: string = '';
  private pollIntervalId: number | null = null;
  private subscribers: Set<(state: CapabilitiesGlobalState) => void> = new Set();
  private logger: Logger;
  
  private constructor() {
    this.logger = createLogger();
    
    // Determine base URL from current location or environment
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const port = hostname === 'localhost' ? '8000' : window.location.port;
      this.baseUrl = `${protocol}//${hostname}:${port}`;
    }
    
    this.initializeGlobalState();
  }
  
  static getInstance(): ServiceCapabilityMatrixClient {
    if (!ServiceCapabilityMatrixClient.instance) {
      ServiceCapabilityMatrixClient.instance = new ServiceCapabilityMatrixClient();
    }
    return ServiceCapabilityMatrixClient.instance;
  }
  
  private initializeGlobalState(): void {
    if (typeof window === 'undefined') return;
    
    window.__A1_CAPABILITIES = {
      capabilities: null,
      lastUpdated: null,
      isLoading: false,
      error: null,
      pollInterval: 60000, // 1 minute default
      demoMode: {
        enabled: false,
        services: new Set()
      },
      healthSummary: {
        overallHealth: 0,
        criticalServicesDown: 0,
        totalServices: 0,
        statusBreakdown: {
          [ServiceStatus.UP]: 0,
          [ServiceStatus.DEGRADED]: 0,
          [ServiceStatus.DOWN]: 0,
          [ServiceStatus.DEMO]: 0
        }
      }
    };
    
    // Log initialization
    this.logger.info('🔧 Service Capability Matrix Client initialized');
    this.logger.info('📊 Access capabilities via window.__A1_CAPABILITIES');
  }
  
  private updateGlobalState(updates: Partial<CapabilitiesGlobalState>): void {
    if (typeof window === 'undefined') return;
    
    const currentState = window.__A1_CAPABILITIES;
    const newState = { ...currentState, ...updates };
    
    // Update demo mode services if capabilities changed
    if (updates.capabilities) {
      newState.demoMode.services = new Set(updates.capabilities.demo_mode_services);
      newState.demoMode.enabled = updates.capabilities.demo_mode_services.length > 0;
      
      // Update health summary
      newState.healthSummary = this.calculateHealthSummary(updates.capabilities);
    }
    
    window.__A1_CAPABILITIES = newState;
    
    // Notify subscribers
    this.subscribers.forEach(callback => {
      try {
        callback(newState);
      } catch (error) {
        this.logger.error('Error in capability matrix subscriber:', error);
      }
    });
  }
  
  private calculateHealthSummary(capabilities: CapabilityMatrixResponse): CapabilitiesGlobalState['healthSummary'] {
    const services = Object.values(capabilities.services);
    const statusBreakdown = {
      [ServiceStatus.UP]: 0,
      [ServiceStatus.DEGRADED]: 0,
      [ServiceStatus.DOWN]: 0,
      [ServiceStatus.DEMO]: 0
    };
    
    let criticalServicesDown = 0;
    let totalHealth = 0;
    
    services.forEach(service => {
      statusBreakdown[service.status]++;
      
      if (service.required && service.status === ServiceStatus.DOWN) {
        criticalServicesDown++;
      }
      
      // Calculate health score contribution
      switch (service.status) {
        case ServiceStatus.UP:
          totalHealth += 1.0;
          break;
        case ServiceStatus.DEGRADED:
          totalHealth += 0.7;
          break;
        case ServiceStatus.DEMO:
          totalHealth += 0.5;
          break;
        case ServiceStatus.DOWN:
          totalHealth += 0.0;
          break;
      }
    });
    
    const overallHealth = services.length > 0 ? (totalHealth / services.length) * 100 : 0;
    
    return {
      overallHealth: Math.round(overallHealth * 100) / 100,
      criticalServicesDown,
      totalServices: services.length,
      statusBreakdown
    };
  }
  
  async fetchCapabilities(format: 'full' | 'summary' | 'minimal' = 'full'): Promise<CapabilityMatrixResponse> {
    this.updateGlobalState({ isLoading: true, error: null });
    
    try {
      const url = new URL('/api/system/capabilities', this.baseUrl);
      url.searchParams.set('format', format);
      url.searchParams.set('include_metadata', 'true');
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const capabilities = await response.json() as CapabilityMatrixResponse;
      
      this.updateGlobalState({ 
        capabilities,
        lastUpdated: new Date(),
        isLoading: false,
        error: null
      });
      
      // Emit capability matrix update event
      try {
        const event = EventFactory.createCapabilityMatrixUpdateEvent({
          matrixVersion: capabilities.matrix_version,
          globalStatus: capabilities.global_status,
          totalServices: capabilities.summary.totalServices,
          criticalServicesDown: capabilities.summary.criticalServicesDown,
          demoModeServices: capabilities.demo_mode_services,
          summary: capabilities.summary
        }, {
          source: 'capability-matrix-client',
          priority: EventPriority.NORMAL,
          category: EventCategory.CAPABILITY,
          tags: ['frontend', 'capability-matrix', 'update']
        });
        
        this.emitEvent(event);
      } catch (eventError) {
        this.logger.warn('Failed to emit capability matrix update event:', eventError);
      }
      
      return capabilities;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching capabilities';
      
      this.updateGlobalState({
        isLoading: false,
        error: errorMessage
      });
      
      this.logger.error('Failed to fetch service capabilities:', error);
      throw error;
    }
  }
  
  async fetchServiceCapability(serviceName: string): Promise<ServiceCapabilityData> {
    try {
      const url = new URL(`/api/system/capabilities/${serviceName}`, this.baseUrl);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.capability as ServiceCapabilityData;
      
    } catch (error) {
      this.logger.error(`Failed to fetch capability for service ${serviceName}:`, error);
      throw error;
    }
  }
  
  async updateServiceStatus(serviceName: string, status: ServiceStatus, responseTimeMs?: number): Promise<boolean> {
    try {
      const url = new URL(`/api/system/capabilities/${serviceName}/status`, this.baseUrl);
      
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: status.toUpperCase(),
          response_time_ms: responseTimeMs
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Refresh capabilities after status update
      await this.fetchCapabilities();
      
      return true;
      
    } catch (error) {
      this.logger.error(`Failed to update status for service ${serviceName}:`, error);
      return false;
    }
  }
  
  subscribe(callback: (state: CapabilitiesGlobalState) => void): () => void {
    this.subscribers.add(callback);
    
    // Immediately call with current state
    if (typeof window !== 'undefined') {
      callback(window.__A1_CAPABILITIES);
    }
    
    return () => {
      this.subscribers.delete(callback);
    };
  }
  
  startPolling(intervalMs: number = 60000): void {
    this.stopPolling();
    
    this.updateGlobalState({ pollInterval: intervalMs });
    
    // Initial fetch
    this.fetchCapabilities().catch(error => {
      this.logger.warn('Initial capability fetch failed:', error);
    });
    
    // Set up polling
    this.pollIntervalId = window.setInterval(() => {
      this.fetchCapabilities('summary').catch(error => {
        this.logger.warn('Polling capability fetch failed:', error);
      });
    }, intervalMs);
    
    this.logger.info(`🔄 Started capability matrix polling (${intervalMs}ms interval)`);
  }
  
  stopPolling(): void {
    if (this.pollIntervalId) {
      window.clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
      this.logger.info('⏹️ Stopped capability matrix polling');
    }
  }
  
  // Service availability checks
  isServiceAvailable(serviceName: string, minimumStatus: ServiceStatus = ServiceStatus.UP): boolean {
    const capabilities = window.__A1_CAPABILITIES?.capabilities;
    if (!capabilities) return false;
    
    const service = capabilities.services[serviceName];
    if (!service) return false;
    
    const statusHierarchy = {
      [ServiceStatus.UP]: 4,
      [ServiceStatus.DEGRADED]: 3,
      [ServiceStatus.DEMO]: 2,
      [ServiceStatus.DOWN]: 1
    };
    
    return statusHierarchy[service.status] >= statusHierarchy[minimumStatus];
  }
  
  getServicesByCategory(category: ServiceCategory): ServiceCapabilityData[] {
    const capabilities = window.__A1_CAPABILITIES?.capabilities;
    if (!capabilities) return [];
    
    return Object.values(capabilities.services).filter(service => service.category === category);
  }
  
  getCriticalServices(): ServiceCapabilityData[] {
    const capabilities = window.__A1_CAPABILITIES?.capabilities;
    if (!capabilities) return [];
    
    return Object.values(capabilities.services).filter(service => service.required);
  }
  
  getServicesInDemoMode(): ServiceCapabilityData[] {
    const capabilities = window.__A1_CAPABILITIES?.capabilities;
    if (!capabilities) return [];
    
    return Object.values(capabilities.services).filter(service => service.status === ServiceStatus.DEMO);
  }
  
  // Demo mode helpers
  isDemoModeEnabled(): boolean {
    return window.__A1_CAPABILITIES?.demoMode.enabled ?? false;
  }
  
  isServiceInDemoMode(serviceName: string): boolean {
    return window.__A1_CAPABILITIES?.demoMode.services.has(serviceName) ?? false;
  }
  
  // Health summary helpers
  getOverallHealth(): number {
    return window.__A1_CAPABILITIES?.healthSummary.overallHealth ?? 0;
  }
  
  getCriticalServicesDownCount(): number {
    return window.__A1_CAPABILITIES?.healthSummary.criticalServicesDown ?? 0;
  }
  
  getStatusBreakdown(): Record<ServiceStatus, number> {
    return window.__A1_CAPABILITIES?.healthSummary.statusBreakdown ?? {
      [ServiceStatus.UP]: 0,
      [ServiceStatus.DEGRADED]: 0,
      [ServiceStatus.DOWN]: 0,
      [ServiceStatus.DEMO]: 0
    };
  }
  
  // Event emission (could be enhanced with event bus integration)
  private emitEvent(event: unknown): void {
    // For now, just log the event. In a full implementation,
    // this would integrate with the event bus system
    this.logger.debug('Capability Matrix Event:', event);
    
    // Could emit to event bus, WebSocket, or analytics system
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      const customEvent = new CustomEvent('capability-matrix-event', {
        detail: event
      });
      window.dispatchEvent(customEvent);
    }
  }
  
  // Utility methods
  getCapabilitiesSnapshot(): CapabilitiesGlobalState | null {
    return typeof window !== 'undefined' ? window.__A1_CAPABILITIES : null;
  }
  
  async refreshCapabilities(): Promise<void> {
    await this.fetchCapabilities();
  }
  
  getLastUpdateTime(): Date | null {
    return window.__A1_CAPABILITIES?.lastUpdated ?? null;
  }
  
  isLoading(): boolean {
    return window.__A1_CAPABILITIES?.isLoading ?? false;
  }
  
  getLastError(): string | null {
    return window.__A1_CAPABILITIES?.error ?? null;
  }
}

// Create and export the singleton instance
export const serviceCapabilityClient = ServiceCapabilityMatrixClient.getInstance();

// Auto-initialize when module is imported in browser environment
if (typeof window !== 'undefined') {
  // Start polling with default interval after a short delay
  setTimeout(() => {
    serviceCapabilityClient.startPolling();
  }, 1000);
  
  // Stop polling on page unload
  window.addEventListener('beforeunload', () => {
    serviceCapabilityClient.stopPolling();
  });
}

// Export types and client
export default ServiceCapabilityMatrixClient;
export { ServiceCapabilityMatrixClient };