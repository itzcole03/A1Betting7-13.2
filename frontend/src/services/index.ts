/**
 * A1Betting Platform - Unified Service Layer
 * Consolidates all services into a clean, organized API
 */

// Core Infrastructure Services
export { default as ApiService } from './unified/ApiService';
// @ts-expect-error TS(2307): Cannot find module './core/CacheService' or its co... Remove this comment to see the full error message
export { default as CacheService } from './core/CacheService';
// @ts-expect-error TS(2307): Cannot find module './core/ConfigService' or its c... Remove this comment to see the full error message
export { default as ConfigService } from './core/ConfigService';
// @ts-expect-error TS(2307): Cannot find module './core/LoggerService' or its c... Remove this comment to see the full error message
export { default as LoggerService } from './core/LoggerService';

// Authentication & User Management
// @ts-expect-error TS(2307): Cannot find module './core/AuthService' or its cor... Remove this comment to see the full error message
export { default as AuthService } from './core/AuthService';
// @ts-expect-error TS(2307): Cannot find module './user/UserService' or its cor... Remove this comment to see the full error message
export { default as UserService } from './user/UserService';

// Data Integration Services
// @ts-expect-error TS(2305): Module '"./data/DataService"' has no exported memb... Remove this comment to see the full error message
export { default as DataService } from './data/DataService';
// @ts-expect-error TS(2307): Cannot find module './data/RealTimeService' or its... Remove this comment to see the full error message
export { default as RealTimeService } from './data/RealTimeService';
// @ts-expect-error TS(2307): Cannot find module './data/LiveDataService' or its... Remove this comment to see the full error message
export { default as LiveDataService } from './data/LiveDataService';

// ML & Prediction Services
export { default as MLService } from './ml/MLService';
// @ts-expect-error TS(2307): Cannot find module './ml/PredictionService' or its... Remove this comment to see the full error message
export { default as PredictionService } from './ml/PredictionService';
// @ts-expect-error TS(2305): Module '"./analytics/AnalyticsService"' has no exp... Remove this comment to see the full error message
export { default as AnalyticsService } from './analytics/AnalyticsService';

// Betting & Finance Services
export { default as BettingService } from './betting/BettingService';
// @ts-expect-error TS(2307): Cannot find module './betting/ArbitrageService' or... Remove this comment to see the full error message
export { default as ArbitrageService } from './betting/ArbitrageService';
// @ts-expect-error TS(2307): Cannot find module './betting/BankrollService' or ... Remove this comment to see the full error message
export { default as BankrollService } from './betting/BankrollService';
// @ts-expect-error TS(2307): Cannot find module './betting/RiskService' or its ... Remove this comment to see the full error message
export { default as RiskService } from './betting/RiskService';

// External API Integrations
// @ts-expect-error TS(2307): Cannot find module './integrations/PrizePicksServi... Remove this comment to see the full error message
export { default as PrizePicksService } from './integrations/PrizePicksService';
// @ts-expect-error TS(2307): Cannot find module './integrations/ESPNService' or... Remove this comment to see the full error message
export { default as ESPNService } from './integrations/ESPNService';
// @ts-expect-error TS(2307): Cannot find module './integrations/WeatherService'... Remove this comment to see the full error message
export { default as WeatherService } from './integrations/WeatherService';
// @ts-expect-error TS(2307): Cannot find module './integrations/NewsService' or... Remove this comment to see the full error message
export { default as NewsService } from './integrations/NewsService';
// @ts-expect-error TS(2307): Cannot find module './integrations/SocialService' ... Remove this comment to see the full error message
export { default as SocialService } from './integrations/SocialService';

// Utility Services
// @ts-expect-error TS(2307): Cannot find module './utils/NotificationService' o... Remove this comment to see the full error message
export { default as NotificationService } from './utils/NotificationService';
// @ts-expect-error TS(2307): Cannot find module './utils/PerformanceService' or... Remove this comment to see the full error message
export { default as PerformanceService } from './utils/PerformanceService';

// Service Manager
export { default as ServiceManager } from './core/ServiceManager';
