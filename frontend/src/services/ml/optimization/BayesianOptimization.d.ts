import {
  OptimizationStrategy,
  OptimizationConfig,
  //   OptimizationResult
} from './OptimizationStrategy.ts';
export declare class BayesianOptimization extends OptimizationStrategy {
  private gp;
  private observedPoints;
  private observedValues;
  private acquisitionFunction;
  constructor(config: OptimizationConfig);
  optimize(): Promise<OptimizationResult>;
  private initializeRandomPoints;
  private getDimension;
  private generateRandomPoint;
  private getAcquisitionFunction;
  private findNextPoint;
  private normalCDF;
  private normalPDF;
  protected checkConvergence(): boolean;
}
