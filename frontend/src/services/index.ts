/**
 * A1Betting Platform - Unified Service Layer
 * Consolidates all services into a clean, organized API
 */

// Core Infrastructure Services
export { default as ApiService } from './unified/ApiService';
export { default as CacheService } from './core/CacheService';
export { default as ConfigService } from './core/ConfigService';
export { default as LoggerService } from './core/LoggerService';

// Authentication & User Management
export { default as AuthService } from './core/AuthService';
export { default as UserService } from './user/UserService';

// Data Integration Services
export { default as DataService } from './data/DataService';
export { default as RealTimeService } from './data/RealTimeService';
export { default as LiveDataService } from './data/LiveDataService';

// ML & Prediction Services
export { default as MLService } from './ml/MLService';
export { default as PredictionService } from './ml/PredictionService';
export { default as AnalyticsService } from './analytics/AnalyticsService';

// Betting & Finance Services
export { default as BettingService } from './betting/BettingService';
export { default as ArbitrageService } from './betting/ArbitrageService';
export { default as BankrollService } from './betting/BankrollService';
export { default as RiskService } from './betting/RiskService';

// External API Integrations
export { default as PrizePicksService } from './integrations/PrizePicksService';
export { default as ESPNService } from './integrations/ESPNService';
export { default as WeatherService } from './integrations/WeatherService';
export { default as NewsService } from './integrations/NewsService';
export { default as SocialService } from './integrations/SocialService';

// Utility Services
export { default as NotificationService } from './utils/NotificationService';
export { default as PerformanceService } from './utils/PerformanceService';

// Service Manager
export { default as ServiceManager } from './core/ServiceManager';
