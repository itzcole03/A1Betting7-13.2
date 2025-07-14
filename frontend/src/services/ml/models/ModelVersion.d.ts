import { ModelMetadata } from './ModelMetadata.ts';
import { ModelMetrics } from '@/types/ModelMetrics.ts';
export declare class ModelVersion {
  private readonly major;
  private readonly minor;
  private readonly patch;
  private readonly metadata;
  private readonly metrics;
  private readonly createdAt;
  private readonly updatedAt;
  constructor(
    major: number,
    minor: number,
    patch: number,
    metadata: ModelMetadata,
    metrics: ModelMetrics
  );
  getVersion(): string;
  getMetadata(): ModelMetadata;
  getMetrics(): ModelMetrics;
  getCreatedAt(): Date;
  getUpdatedAt(): Date;
  isCompatible(other: ModelVersion): boolean;
  isNewerThan(other: ModelVersion): boolean;
  incrementPatch(): ModelVersion;
  incrementMinor(): ModelVersion;
  incrementMajor(): ModelVersion;
  toJSON(): object;
  static fromJSON(json: any): ModelVersion;
}
