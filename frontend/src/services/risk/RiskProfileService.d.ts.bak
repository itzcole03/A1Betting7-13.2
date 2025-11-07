import { RiskProfile } from '@/types/core.ts';
export declare class RiskProfileService {
  private static instance;
  private readonly eventBus;
  private readonly errorHandler;
  private readonly performanceMonitor;
  private readonly config;
  private activeProfile;
  private profiles;
  private constructor();
  static getInstance(): RiskProfileService;
  private initializeDefaultProfiles;
  private setupEventListeners;
  private handlePredictionUpdate;
  private handleRiskProfileUpdate;
  private assessPredictionRisk;
  private calculateRiskLevel;
  private calculateMaxStake;
  getActiveProfile(): RiskProfile;
  getProfile(id: string): RiskProfile | undefined;
  getAllProfiles(): RiskProfile[0];
  updateProfile(profile: RiskProfile): void;
  setActiveProfile(id: string): void;
}
