// Type definitions for feature engineering analytics;
export type FeatureConfig = object;

export type EngineeredFeatures = object;

export type RawPlayerData = object;

// Feature flags interface for configService;
export interface FeatureFlags {
  // Basic features;
  INJURIES?: boolean;
  NEWS?: boolean;
  WEATHER?: boolean;
  REALTIME?: boolean;
  ESPN?: boolean;
  ODDS?: boolean;
  ANALYTICS?: boolean;

  // Extended features;
  enableNews?: boolean;
  enableWeather?: boolean;
  enableInjuries?: boolean;
  enableAnalytics?: boolean;
  enableSocialSentiment?: boolean;
  enableExperimentalOddsCalculation?: boolean;
  showAdvancedAnalyticsDashboard?: boolean;
  useNewSentimentModel?: boolean;

  // Model features;
  enablePvPModel?: boolean;
  enablePlayerFormModel?: boolean;
  enableVenueEffectModel?: boolean;
  enableRefereeImpactModel?: boolean;
  enableLineupSynergyModel?: boolean;

  // Additional features can be added as needed;
  [key: string]: boolean | undefined;
}

// ESPN Headline interface for newsService;
export interface ESPNHeadline {
  id: string;
  title: string;
  summary: string;
  link: string;
  publishedAt: string;
  source: string;
  imageUrl: string;
  category: string;
}

// Shared types for A1Betting frontend
export interface Entry {
  id: string;
  userId: string;
  amount: number;
  status: EntryStatus;
  createdAt: string;
  updatedAt?: string;
}

export type EntryStatus = 'pending' | 'won' | 'lost' | 'cancelled';

export interface PrizePicksProps {
  id: string;
  playerName: string;
  statType: string;
  line: number;
  overOdds: number;
  underOdds: number;
  team?: string;
  position?: string;
}

export interface SocialSentimentData {
  playerId: string;
  sentimentScore: number;
  mentions: number;
  trending: boolean;
}

// Add more shared types/interfaces as needed
