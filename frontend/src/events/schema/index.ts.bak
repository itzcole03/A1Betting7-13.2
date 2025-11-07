/**
 * Event Schema Registry v1
 * 
 * Centralized registry of all event schemas with versioning support.
 * Each event schema includes type definitions, validation, and metadata.
 */

// Base event structure
export interface BaseEvent<TPayload = unknown> {
  type: string;
  version: string;
  timestamp: number;
  correlationId?: string;
  payload: TPayload;
  metadata?: EventMetadata;
}

export interface EventMetadata {
  source: string;
  priority: EventPriority;
  category: EventCategory;
  retryable?: boolean;
  tags?: string[];
  context?: Record<string, unknown>;
}

export enum EventPriority {
  LOW = "LOW",
  NORMAL = "NORMAL", 
  HIGH = "HIGH",
  CRITICAL = "CRITICAL"
}

export enum EventCategory {
  SYSTEM = "SYSTEM",
  SERVICE = "SERVICE",
  USER = "USER",
  DATA = "DATA",
  ANALYTICS = "ANALYTICS",
  WEBSOCKET = "WEBSOCKET",
  VALIDATION = "VALIDATION",
  CAPABILITY = "CAPABILITY"
}

// Service Capability Events
export interface ServiceStatusChangePayload {
  serviceName: string;
  oldStatus: ServiceStatus;
  newStatus: ServiceStatus;
  responseTimeMs?: number;
  reason?: string;
  healthMetrics?: HealthMetrics;
}

export interface ServiceRegistrationPayload {
  serviceName: string;
  version: string;
  category: ServiceCategory;
  capabilities: ServiceCapability[];
  dependencies: ServiceDependency[];
}

export interface ServiceHealthCheckPayload {
  serviceName: string;
  status: ServiceStatus;
  responseTimeMs: number;
  failureCount: number;
  lastCheck: string; // ISO timestamp
  metrics?: HealthMetrics;
}

export interface CapabilityMatrixUpdatePayload {
  matrixVersion: string;
  globalStatus: ServiceStatus;
  totalServices: number;
  criticalServicesDown: number;
  demoModeServices: string[];
  summary: CapabilityMatrixSummary;
}

// System Events
export interface SystemStartupPayload {
  version: string;
  environment: string;
  startupTimeMs: number;
  loadedServices: string[];
  failedServices: string[];
}

export interface SystemShutdownPayload {
  reason: string;
  graceful: boolean;
  activeConnections: number;
  activeServices: string[];
}

export interface ValidationEventPayload {
  validationType: ValidationType;
  correlationId: string;
  results: ValidationResult[];
  summary: ValidationSummary;
  duration: number;
}

// WebSocket Events  
export interface WebSocketConnectionPayload {
  clientId: string;
  connectionType: "legacy" | "enhanced" | "v2";
  userAgent?: string;
  subscriptions: string[];
}

export interface WebSocketMessagePayload {
  clientId: string;
  messageType: string;
  messageSize: number;
  direction: "inbound" | "outbound";
  processingTimeMs?: number;
}

export interface WebSocketDisconnectionPayload {
  clientId: string;
  reason: string;
  connectionDuration: number;
  messagesSent: number;
  messagesReceived: number;
}

// Data Events
export interface DataFetchEventPayload {
  dataSource: string;
  sport?: string;
  endpoint: string;
  responseTimeMs: number;
  success: boolean;
  error?: string;
  recordCount?: number;
  cacheHit?: boolean;
}

export interface CacheEventPayload {
  operation: "get" | "set" | "delete" | "clear";
  key: string;
  hit?: boolean;
  ttl?: number;
  size?: number;
  tier?: "memory" | "redis" | "file";
}

// User Events
export interface UserActionPayload {
  userId?: string;
  action: string;
  resource: string;
  params?: Record<string, unknown>;
  success: boolean;
  duration?: number;
}

export interface UserPreferenceChangePayload {
  userId: string;
  preference: string;
  oldValue: unknown;
  newValue: unknown;
  scope: "global" | "sport" | "session";
}

// Analytics Events
export interface AnalyticsEventPayload {
  eventName: string;
  properties: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  timestamp: number;
}

export interface PerformanceMetricPayload {
  metric: string;
  value: number;
  unit: string;
  tags: Record<string, string>;
  timestamp: number;
}

// Supporting Types
export enum ServiceStatus {
  UP = "UP",
  DEGRADED = "DEGRADED",
  DOWN = "DOWN",
  DEMO = "DEMO"
}

export enum ServiceCategory {
  CORE = "core",
  DATA = "data",
  ML = "ml",
  ANALYTICS = "analytics",
  EXTERNAL = "external",
  UTILITY = "utility",
  MONITORING = "monitoring"
}

export interface ServiceCapability {
  name: string;
  version: string;
  description: string;
  required: boolean;
  status: ServiceStatus;
}

export interface ServiceDependency {
  serviceName: string;
  required: boolean;
  minimumStatus: ServiceStatus;
}

export interface HealthMetrics {
  responseTime: number;
  successRate: number;
  throughput: number;
  errorRate: number;
  lastCheck: string;
}

export interface CapabilityMatrixSummary {
  totalServices: number;
  statusBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  overallHealth: number;
  criticalServicesDown: number;
  requiredServices: number;
  optionalServices: number;
}

export enum ValidationType {
  BOOTSTRAP = "bootstrap",
  HEALTH_CHECK = "health_check",
  CAPABILITY_MATRIX = "capability_matrix",
  SERVICE_REGISTRATION = "service_registration"
}

export interface ValidationResult {
  type: ValidationType;
  success: boolean;
  message: string;
  severity: "info" | "warning" | "error" | "critical";
  suggestions?: string[];
}

export interface ValidationSummary {
  totalValidations: number;
  passed: number;
  warnings: number;
  errors: number;
  critical: number;
}

// Event Type Definitions with Versioning
export type ServiceStatusChangeEvent = BaseEvent<ServiceStatusChangePayload> & {
  type: "service.status.changed";
  version: "validator.event.v1";
};

export type ServiceRegistrationEvent = BaseEvent<ServiceRegistrationPayload> & {
  type: "service.registered";
  version: "validator.event.v1";
};

export type ServiceHealthCheckEvent = BaseEvent<ServiceHealthCheckPayload> & {
  type: "service.health.check";
  version: "validator.event.v1";
};

export type CapabilityMatrixUpdateEvent = BaseEvent<CapabilityMatrixUpdatePayload> & {
  type: "capability.matrix.updated";
  version: "validator.event.v1";
};

export type SystemStartupEvent = BaseEvent<SystemStartupPayload> & {
  type: "system.startup";
  version: "validator.event.v1";
};

export type SystemShutdownEvent = BaseEvent<SystemShutdownPayload> & {
  type: "system.shutdown";
  version: "validator.event.v1";
};

export type ValidationEvent = BaseEvent<ValidationEventPayload> & {
  type: "validation.completed";
  version: "validator.event.v1";
};

export type WebSocketConnectionEvent = BaseEvent<WebSocketConnectionPayload> & {
  type: "websocket.connected";
  version: "validator.event.v1";
};

export type WebSocketMessageEvent = BaseEvent<WebSocketMessagePayload> & {
  type: "websocket.message";
  version: "validator.event.v1";
};

export type WebSocketDisconnectionEvent = BaseEvent<WebSocketDisconnectionPayload> & {
  type: "websocket.disconnected";
  version: "validator.event.v1";
};

export type DataFetchEvent = BaseEvent<DataFetchEventPayload> & {
  type: "data.fetched";
  version: "validator.event.v1";
};

export type CacheEvent = BaseEvent<CacheEventPayload> & {
  type: "cache.operation";
  version: "validator.event.v1";
};

export type UserActionEvent = BaseEvent<UserActionPayload> & {
  type: "user.action";
  version: "validator.event.v1";
};

export type UserPreferenceChangeEvent = BaseEvent<UserPreferenceChangePayload> & {
  type: "user.preference.changed";
  version: "validator.event.v1";
};

export type AnalyticsEvent = BaseEvent<AnalyticsEventPayload> & {
  type: "analytics.tracked";
  version: "validator.event.v1";
};

export type PerformanceMetricEvent = BaseEvent<PerformanceMetricPayload> & {
  type: "performance.metric";
  version: "validator.event.v1";
};

// Union type for all events
export type ValidatorEvent = 
  | ServiceStatusChangeEvent
  | ServiceRegistrationEvent
  | ServiceHealthCheckEvent
  | CapabilityMatrixUpdateEvent
  | SystemStartupEvent
  | SystemShutdownEvent
  | ValidationEvent
  | WebSocketConnectionEvent
  | WebSocketMessageEvent
  | WebSocketDisconnectionEvent
  | DataFetchEvent
  | CacheEvent
  | UserActionEvent
  | UserPreferenceChangeEvent
  | AnalyticsEvent
  | PerformanceMetricEvent;

// Event Schema Registry
export class EventSchemaRegistry {
  private static instance: EventSchemaRegistry;
  private schemas: Map<string, EventSchema> = new Map();
  
  private constructor() {
    this.registerDefaultSchemas();
  }
  
  static getInstance(): EventSchemaRegistry {
    if (!EventSchemaRegistry.instance) {
      EventSchemaRegistry.instance = new EventSchemaRegistry();
    }
    return EventSchemaRegistry.instance;
  }
  
  private registerDefaultSchemas() {
    // Service Events
    this.registerSchema({
      type: "service.status.changed",
      version: "validator.event.v1",
      category: EventCategory.SERVICE,
      priority: EventPriority.HIGH,
      description: "Service status changed event",
      payloadSchema: "ServiceStatusChangePayload",
      retryable: false
    });
    
    this.registerSchema({
      type: "service.registered",
      version: "validator.event.v1", 
      category: EventCategory.SERVICE,
      priority: EventPriority.NORMAL,
      description: "Service registration event",
      payloadSchema: "ServiceRegistrationPayload",
      retryable: true
    });
    
    this.registerSchema({
      type: "service.health.check",
      version: "validator.event.v1",
      category: EventCategory.SERVICE,
      priority: EventPriority.LOW,
      description: "Service health check event",
      payloadSchema: "ServiceHealthCheckPayload",
      retryable: false
    });
    
    this.registerSchema({
      type: "capability.matrix.updated",
      version: "validator.event.v1",
      category: EventCategory.CAPABILITY,
      priority: EventPriority.HIGH,
      description: "Capability matrix update event",
      payloadSchema: "CapabilityMatrixUpdatePayload",
      retryable: false
    });
    
    // System Events
    this.registerSchema({
      type: "system.startup",
      version: "validator.event.v1",
      category: EventCategory.SYSTEM,
      priority: EventPriority.CRITICAL,
      description: "System startup event",
      payloadSchema: "SystemStartupPayload",
      retryable: false
    });
    
    this.registerSchema({
      type: "system.shutdown",
      version: "validator.event.v1",
      category: EventCategory.SYSTEM,
      priority: EventPriority.CRITICAL,
      description: "System shutdown event",
      payloadSchema: "SystemShutdownPayload",
      retryable: false
    });
    
    // WebSocket Events
    this.registerSchema({
      type: "websocket.connected",
      version: "validator.event.v1",
      category: EventCategory.WEBSOCKET,
      priority: EventPriority.NORMAL,
      description: "WebSocket connection event",
      payloadSchema: "WebSocketConnectionPayload",
      retryable: false
    });
    
    this.registerSchema({
      type: "websocket.message",
      version: "validator.event.v1",
      category: EventCategory.WEBSOCKET,
      priority: EventPriority.LOW,
      description: "WebSocket message event",
      payloadSchema: "WebSocketMessagePayload",
      retryable: false
    });
    
    this.registerSchema({
      type: "websocket.disconnected",
      version: "validator.event.v1",
      category: EventCategory.WEBSOCKET,
      priority: EventPriority.NORMAL,
      description: "WebSocket disconnection event",
      payloadSchema: "WebSocketDisconnectionPayload",
      retryable: false
    });
    
    // Data Events
    this.registerSchema({
      type: "data.fetched",
      version: "validator.event.v1",
      category: EventCategory.DATA,
      priority: EventPriority.LOW,
      description: "Data fetch event",
      payloadSchema: "DataFetchEventPayload",
      retryable: true
    });
    
    this.registerSchema({
      type: "cache.operation",
      version: "validator.event.v1",
      category: EventCategory.DATA,
      priority: EventPriority.LOW,
      description: "Cache operation event",
      payloadSchema: "CacheEventPayload",
      retryable: false
    });
    
    // User Events
    this.registerSchema({
      type: "user.action",
      version: "validator.event.v1",
      category: EventCategory.USER,
      priority: EventPriority.NORMAL,
      description: "User action event",
      payloadSchema: "UserActionPayload",
      retryable: true
    });
    
    this.registerSchema({
      type: "user.preference.changed",
      version: "validator.event.v1",
      category: EventCategory.USER,
      priority: EventPriority.NORMAL,
      description: "User preference change event",
      payloadSchema: "UserPreferenceChangePayload",
      retryable: true
    });
    
    // Analytics Events
    this.registerSchema({
      type: "analytics.tracked",
      version: "validator.event.v1",
      category: EventCategory.ANALYTICS,
      priority: EventPriority.LOW,
      description: "Analytics tracking event",
      payloadSchema: "AnalyticsEventPayload",
      retryable: true
    });
    
    this.registerSchema({
      type: "performance.metric",
      version: "validator.event.v1",
      category: EventCategory.ANALYTICS,
      priority: EventPriority.LOW,
      description: "Performance metric event",
      payloadSchema: "PerformanceMetricPayload",
      retryable: false
    });
    
    // Validation Events
    this.registerSchema({
      type: "validation.completed",
      version: "validator.event.v1",
      category: EventCategory.VALIDATION,
      priority: EventPriority.NORMAL,
      description: "Validation completed event",
      payloadSchema: "ValidationEventPayload",
      retryable: false
    });
  }
  
  registerSchema(schema: EventSchema): void {
    const key = `${schema.type}:${schema.version}`;
    this.schemas.set(key, schema);
  }
  
  getSchema(type: string, version: string): EventSchema | undefined {
    const key = `${type}:${version}`;
    return this.schemas.get(key);
  }
  
  getAllSchemas(): EventSchema[] {
    return Array.from(this.schemas.values());
  }
  
  getSchemasByCategory(category: EventCategory): EventSchema[] {
    return Array.from(this.schemas.values()).filter(schema => schema.category === category);
  }
  
  validateEvent(event: BaseEvent): ValidationResult {
    const schema = this.getSchema(event.type, event.version);
    if (!schema) {
      return {
        type: ValidationType.SERVICE_REGISTRATION,
        success: false,
        message: `Unknown event type: ${event.type} version: ${event.version}`,
        severity: "error"
      };
    }
    
    // Basic validation - could be enhanced with detailed payload validation
    const hasRequiredFields = event.type && event.version && event.timestamp && event.payload;
    if (!hasRequiredFields) {
      return {
        type: ValidationType.SERVICE_REGISTRATION,
        success: false,
        message: "Missing required event fields",
        severity: "error"
      };
    }
    
    return {
      type: ValidationType.SERVICE_REGISTRATION,
      success: true,
      message: "Event validated successfully",
      severity: "info"
    };
  }
}

export interface EventSchema {
  type: string;
  version: string;
  category: EventCategory;
  priority: EventPriority;
  description: string;
  payloadSchema: string;
  retryable: boolean;
  tags?: string[];
}

// Event Factory
export class EventFactory {
  private static correlationId = 0;
  
  static createServiceStatusChangeEvent(
    payload: ServiceStatusChangePayload,
    metadata?: Partial<EventMetadata>
  ): ServiceStatusChangeEvent {
    return {
      type: "service.status.changed",
      version: "validator.event.v1",
      timestamp: Date.now(),
      correlationId: `evt-${++EventFactory.correlationId}`,
      payload,
      metadata: {
        source: "service-capability-matrix",
        priority: EventPriority.HIGH,
        category: EventCategory.SERVICE,
        retryable: false,
        ...metadata
      }
    };
  }
  
  static createCapabilityMatrixUpdateEvent(
    payload: CapabilityMatrixUpdatePayload,
    metadata?: Partial<EventMetadata>
  ): CapabilityMatrixUpdateEvent {
    return {
      type: "capability.matrix.updated",
      version: "validator.event.v1",
      timestamp: Date.now(),
      correlationId: `evt-${++EventFactory.correlationId}`,
      payload,
      metadata: {
        source: "service-capability-matrix",
        priority: EventPriority.HIGH,
        category: EventCategory.CAPABILITY,
        retryable: false,
        ...metadata
      }
    };
  }
  
  static createWebSocketEvent<T extends WebSocketConnectionPayload | WebSocketMessagePayload | WebSocketDisconnectionPayload>(
    eventType: "websocket.connected" | "websocket.message" | "websocket.disconnected",
    payload: T,
    metadata?: Partial<EventMetadata>
  ): BaseEvent<T> & { type: typeof eventType; version: "validator.event.v1" } {
    return {
      type: eventType,
      version: "validator.event.v1",
      timestamp: Date.now(),
      correlationId: `evt-${++EventFactory.correlationId}`,
      payload,
      metadata: {
        source: "websocket-service",
        priority: EventPriority.NORMAL,
        category: EventCategory.WEBSOCKET,
        retryable: false,
        ...metadata
      }
    };
  }
  
  static createValidationEvent(
    payload: ValidationEventPayload,
    metadata?: Partial<EventMetadata>
  ): ValidationEvent {
    return {
      type: "validation.completed",
      version: "validator.event.v1",
      timestamp: Date.now(),
      correlationId: `evt-${++EventFactory.correlationId}`,
      payload,
      metadata: {
        source: "bootstrap-validator",
        priority: EventPriority.NORMAL,
        category: EventCategory.VALIDATION,
        retryable: false,
        ...metadata
      }
    };
  }
}

// Export the singleton registry instance
export const eventSchemaRegistry = EventSchemaRegistry.getInstance();

// Version constant
export const EVENT_SCHEMA_VERSION = "validator.event.v1";