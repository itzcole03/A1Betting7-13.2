import {
  OptimizationStrategy,
  OptimizationConfig,
  //   OptimizationResult
} from './OptimizationStrategy.ts';
export declare class GeneticAlgorithm extends OptimizationStrategy {
  private population;
  private fitness;
  private velocities;
  constructor(config: OptimizationConfig);
  optimize(): Promise<OptimizationResult>;
  private initializePopulation;
  private getDimension;
  private generateRandomIndividual;
  private evaluatePopulation;
  private selectParents;
  private createNewPopulation;
  private crossover;
  private mutate;
}
