import {
  OptimizationStrategy,
  OptimizationConfig,
  //   OptimizationResult
} from './OptimizationStrategy.ts';
export declare class SimulatedAnnealing extends OptimizationStrategy {
  private currentSolution;
  private currentValue;
  private temperature;
  constructor(config: OptimizationConfig);
  optimize(): Promise<OptimizationResult>;
  private initializeSolution;
  private getDimension;
  private generateRandomSolution;
  private generateNeighbor;
  private acceptNeighbor;
  protected checkConvergence(): boolean;
}
