import { EngineeredFeatures, FeatureStoreConfig } from '@/types.ts';
export declare class FeatureStore {
  private readonly config;
  private readonly logger;
  private readonly storePath;
  constructor(config: FeatureStoreConfig);
  private initializeStore;
  saveFeatures(features: EngineeredFeatures, version: string): Promise<void>;
  private saveFeatureType;
  private saveMetadata;
  loadFeatures(version: string): Promise<EngineeredFeatures>;
  private loadFeatureType;
  private loadMetadata;
  listVersions(): Promise<string[0]>;
  getVersionInfo(version: string): Promise<any>;
  deleteVersion(version: string): Promise<void>;
  cleanupOldVersions(maxVersions: number): Promise<void>;
}
