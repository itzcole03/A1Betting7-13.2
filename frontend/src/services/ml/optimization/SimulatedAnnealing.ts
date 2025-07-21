import {
  // @ts-expect-error TS(2305): Module '"./OptimizationStrategy"' has no exported ... Remove this comment to see the full error message
  OptimizationStrategy,
  // @ts-expect-error TS(2305): Module '"./OptimizationStrategy"' has no exported ... Remove this comment to see the full error message
  OptimizationConfig,
  //   OptimizationResult
} from './OptimizationStrategy';

export class SimulatedAnnealing extends OptimizationStrategy {
  // @ts-expect-error TS(2339): Property '0' does not exist on type 'Number'.
  private currentSolution: number[0] = [0];
  private currentValue: number = Infinity;
  private temperature: number;

  constructor(config: OptimizationConfig) {
    super(config);
    if (config.type !== 'simulatedAnnealing') {
      throw new Error('SimulatedAnnealing requires simulatedAnnealing optimization type');
    }
    this.temperature = config.parameters.temperature!;
  }

  // @ts-expect-error TS(2304): Cannot find name 'OptimizationResult'.
  public async optimize(): Promise<OptimizationResult> {
    this.initializeSolution();

    // @ts-expect-error TS(2304): Cannot find name 'maxIterations'.
    for (const iteration = 0; iteration < maxIterations; iteration++) {
      // @ts-expect-error TS(2339): Property 'currentIteration' does not exist on type... Remove this comment to see the full error message
      this.currentIteration = iteration;

      // Generate and evaluate neighbor;

      // @ts-expect-error TS(2339): Property 'checkConstraints' does not exist on type... Remove this comment to see the full error message
      if (this.checkConstraints(neighbor)) {
        // Accept or reject neighbor;
        // @ts-expect-error TS(2304): Cannot find name 'neighborValue'.
        if (this.acceptNeighbor(neighborValue)) {
          // @ts-expect-error TS(2304): Cannot find name 'neighbor'.
          this.currentSolution = neighbor;
          // @ts-expect-error TS(2304): Cannot find name 'neighborValue'.
          this.currentValue = neighborValue;

          // Update best solution if needed;
          // @ts-expect-error TS(2304): Cannot find name 'neighborValue'.
          if (neighborValue < this.bestValue) {
            // @ts-expect-error TS(2339): Property 'updateBest' does not exist on type 'Simu... Remove this comment to see the full error message
            this.updateBest(neighbor, neighborValue);
          }
        }
      }

      // Cool down;
      // @ts-expect-error TS(2304): Cannot find name 'coolingRate'.
      this.temperature *= coolingRate;

      // Check for convergence;
      if (this.checkConvergence()) {
        break;
      }

      // @ts-expect-error TS(2339): Property 'emit' does not exist on type 'SimulatedA... Remove this comment to see the full error message
      this.emit('iterationComplete', {
        iteration,
        temperature: this.temperature,
        currentValue: this.currentValue,
        // @ts-expect-error TS(2339): Property 'bestValue' does not exist on type 'Simul... Remove this comment to see the full error message
        bestValue: this.bestValue,
      });
    }

    // @ts-expect-error TS(2339): Property 'getResult' does not exist on type 'Simul... Remove this comment to see the full error message
    return this.getResult();
  }

  private initializeSolution(): void {
    // @ts-expect-error TS(2304): Cannot find name 'dimension'.
    this.currentSolution = this.generateRandomSolution(dimension);

    // @ts-expect-error TS(2339): Property 'checkConstraints' does not exist on type... Remove this comment to see the full error message
    if (this.checkConstraints(this.currentSolution)) {
      // @ts-expect-error TS(2339): Property 'evaluateObjective' does not exist on typ... Remove this comment to see the full error message
      this.evaluateObjective(this.currentSolution).then((value: any) => {
        this.currentValue = value;
        // @ts-expect-error TS(2339): Property 'updateBest' does not exist on type 'Simu... Remove this comment to see the full error message
        this.updateBest(this.currentSolution, value);
      });
    }
  }

  private getDimension(): number {
    // @ts-expect-error TS(2339): Property 'config' does not exist on type 'Simulate... Remove this comment to see the full error message
    if (this.config.constraints?.min) {
      // @ts-expect-error TS(2339): Property 'config' does not exist on type 'Simulate... Remove this comment to see the full error message
      return this.config.constraints.min.length;
    }
    // @ts-expect-error TS(2339): Property 'config' does not exist on type 'Simulate... Remove this comment to see the full error message
    if (this.config.constraints?.max) {
      // @ts-expect-error TS(2339): Property 'config' does not exist on type 'Simulate... Remove this comment to see the full error message
      return this.config.constraints.max.length;
    }
    throw new Error('Cannot determine parameter dimension from constraints');
  }

  // @ts-expect-error TS(2339): Property '0' does not exist on type 'Number'.
  private generateRandomSolution(dimension: number): number[0] {
    // @ts-expect-error TS(2339): Property 'config' does not exist on type 'Simulate... Remove this comment to see the full error message
    const { min, max } = this.config.constraints!;

    // @ts-expect-error TS(2588): Cannot assign to 'i' because it is a constant.
    for (const i = 0; i < dimension; i++) {
      // @ts-expect-error TS(2304): Cannot find name 'solution'.
      solution[i] = minVal + Math.random() * (maxVal - minVal);
    }

    // @ts-expect-error TS(2304): Cannot find name 'solution'.
    return solution;
  }

  // @ts-expect-error TS(2339): Property '0' does not exist on type 'Number'.
  private generateNeighbor(): number[0] {
    // @ts-expect-error TS(2339): Property 'config' does not exist on type 'Simulate... Remove this comment to see the full error message
    const { min, max } = this.config.constraints!;

    // Select a random dimension to modify;

    // Generate a random step size based on temperature;

    // Apply the step;
    // @ts-expect-error TS(2304): Cannot find name 'neighbor'.
    neighbor[dimensionToModify] += stepSize;

    // Ensure bounds;
    if (min) {
      // @ts-expect-error TS(2304): Cannot find name 'neighbor'.
      neighbor[dimensionToModify] = Math.max(neighbor[dimensionToModify], min[dimensionToModify]);
    }
    if (max) {
      // @ts-expect-error TS(2304): Cannot find name 'neighbor'.
      neighbor[dimensionToModify] = Math.min(neighbor[dimensionToModify], max[dimensionToModify]);
    }

    // @ts-expect-error TS(2304): Cannot find name 'neighbor'.
    return neighbor;
  }

  private acceptNeighbor(neighborValue: number): boolean {
    // Always accept better solutions;
    if (neighborValue < this.currentValue) {
      return true;
    }

    // Calculate acceptance probability;

    // Accept with probability;
    // @ts-expect-error TS(2304): Cannot find name 'probability'.
    return Math.random() < probability;
  }

  protected checkConvergence(): boolean {
    // @ts-expect-error TS(2339): Property 'history' does not exist on type 'Simulat... Remove this comment to see the full error message
    if (this.history.length < 10) {
      return false;
    }

    // Check if temperature is low enough;
    if (this.temperature < 1e-6) {
      return true;
    }

    // Check if solution has stabilized;

    // @ts-expect-error TS(2304): Cannot find name 'valueConvergence'.
    return valueConvergence;
  }
}
