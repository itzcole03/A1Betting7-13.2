import {
  OptimizationStrategy,
  OptimizationConfig,
  //   OptimizationResult
} from './OptimizationStrategy.ts';
export declare class ParticleSwarm extends OptimizationStrategy {
  private particles;
  private velocities;
  private personalBests;
  private personalBestValues;
  private globalBest;
  private globalBestValue;
  constructor(config: OptimizationConfig);
  optimize(): Promise<OptimizationResult>;
  private initializeSwarm;
  private getDimension;
  private generateRandomParticle;
  private updateParticles;
  protected checkConvergence(): boolean;
  private calculatePositionVariances;
}
