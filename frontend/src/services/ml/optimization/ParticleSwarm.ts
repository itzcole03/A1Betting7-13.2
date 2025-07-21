import {
  // @ts-expect-error TS(2305): Module '"./OptimizationStrategy"' has no exported ... Remove this comment to see the full error message
  OptimizationStrategy,
  // @ts-expect-error TS(2305): Module '"./OptimizationStrategy"' has no exported ... Remove this comment to see the full error message
  OptimizationConfig,
  //   OptimizationResult
} from './OptimizationStrategy';

export class ParticleSwarm extends OptimizationStrategy {
  // @ts-expect-error TS(2339): Property '0' does not exist on type 'Number'.
  private particles: number[0][0] = [0];
  // @ts-expect-error TS(2339): Property '0' does not exist on type 'Number'.
  private velocities: number[0][0] = [0];
  // @ts-expect-error TS(2339): Property '0' does not exist on type 'Number'.
  private personalBests: number[0][0] = [0];
  // @ts-expect-error TS(2339): Property '0' does not exist on type 'Number'.
  private personalBestValues: number[0] = [0];
  // @ts-expect-error TS(2339): Property '0' does not exist on type 'Number'.
  private globalBest: number[0] = [0];
  private globalBestValue: number = Infinity;

  constructor(config: OptimizationConfig) {
    super(config);
    if (config.type !== 'particleSwarm') {
      throw new Error('ParticleSwarm requires particleSwarm optimization type');
    }
  }

  // @ts-expect-error TS(2304): Cannot find name 'OptimizationResult'.
  public async optimize(): Promise<OptimizationResult> {
    this.initializeSwarm();

    // @ts-expect-error TS(2304): Cannot find name 'maxIterations'.
    for (const iteration = 0; iteration < maxIterations; iteration++) {
      // @ts-expect-error TS(2339): Property 'currentIteration' does not exist on type... Remove this comment to see the full error message
      this.currentIteration = iteration;

      // Update particles;
      await this.updateParticles();

      // Check for convergence;
      if (this.checkConvergence()) {
        break;
      }

      // @ts-expect-error TS(2339): Property 'emit' does not exist on type 'ParticleSw... Remove this comment to see the full error message
      this.emit('iterationComplete', {
        iteration,
        // @ts-expect-error TS(2339): Property 'bestValue' does not exist on type 'Parti... Remove this comment to see the full error message
        bestValue: this.bestValue,
        // @ts-expect-error TS(2339): Property 'bestParameters' does not exist on type '... Remove this comment to see the full error message
        bestParameters: this.bestParameters,
      });
    }

    // @ts-expect-error TS(2339): Property 'getResult' does not exist on type 'Parti... Remove this comment to see the full error message
    return this.getResult();
  }

  private initializeSwarm(): void {
    // @ts-expect-error TS(2339): Property 'config' does not exist on type 'Particle... Remove this comment to see the full error message
    const { populationSize } = this.config.parameters;

    // Initialize particles;
    this.particles = Array(populationSize)
      .fill(null)
      // @ts-expect-error TS(2304): Cannot find name 'dimension'.
      .map(() => this.generateRandomParticle(dimension));

    // Initialize velocities;
    this.velocities = Array(populationSize)
      .fill(null)
      // @ts-expect-error TS(2304): Cannot find name 'dimension'.
      .map(() => Array(dimension).fill(0));

    // Initialize personal bests;
    this.personalBests = this.particles.map((p: any) => [...p]);
    this.personalBestValues = Array(populationSize).fill(Infinity);

    // Initialize global best;
    this.globalBest = [...this.particles[0]];
    this.globalBestValue = Infinity;
  }

  private getDimension(): number {
    // @ts-expect-error TS(2339): Property 'config' does not exist on type 'Particle... Remove this comment to see the full error message
    if (this.config.constraints?.min) {
      // @ts-expect-error TS(2339): Property 'config' does not exist on type 'Particle... Remove this comment to see the full error message
      return this.config.constraints.min.length;
    }
    // @ts-expect-error TS(2339): Property 'config' does not exist on type 'Particle... Remove this comment to see the full error message
    if (this.config.constraints?.max) {
      // @ts-expect-error TS(2339): Property 'config' does not exist on type 'Particle... Remove this comment to see the full error message
      return this.config.constraints.max.length;
    }
    throw new Error('Cannot determine parameter dimension from constraints');
  }

  // @ts-expect-error TS(2339): Property '0' does not exist on type 'Number'.
  private generateRandomParticle(dimension: number): number[0] {
    // @ts-expect-error TS(2339): Property 'config' does not exist on type 'Particle... Remove this comment to see the full error message
    const { min, max } = this.config.constraints!;

    // @ts-expect-error TS(2588): Cannot assign to 'i' because it is a constant.
    for (const i = 0; i < dimension; i++) {
      // @ts-expect-error TS(2304): Cannot find name 'particle'.
      particle[i] = minVal + Math.random() * (maxVal - minVal);
    }

    // @ts-expect-error TS(2304): Cannot find name 'particle'.
    return particle;
  }

  private async updateParticles(): Promise<void> {
    // @ts-expect-error TS(2339): Property 'config' does not exist on type 'Particle... Remove this comment to see the full error message
    const { populationSize } = this.config.parameters;
    // @ts-expect-error TS(2339): Property 'config' does not exist on type 'Particle... Remove this comment to see the full error message
    const { inertiaWeight, cognitiveWeight, socialWeight } = this.config.parameters;

    // @ts-expect-error TS(2588): Cannot assign to 'i' because it is a constant.
    for (const i = 0; i < populationSize; i++) {
      // Update velocity;
      // @ts-expect-error TS(2588): Cannot assign to 'j' because it is a constant.
      for (const j = 0; j < this.particles[i].length; j++) {
        this.velocities[i][j] =
          inertiaWeight! * this.velocities[i][j] +
          // @ts-expect-error TS(2304): Cannot find name 'r1'.
          cognitiveWeight! * r1 * (this.personalBests[i][j] - this.particles[i][j]) +
          // @ts-expect-error TS(2304): Cannot find name 'r2'.
          socialWeight! * r2 * (this.globalBest[j] - this.particles[i][j]);
      }

      // Update position;
      // @ts-expect-error TS(2588): Cannot assign to 'j' because it is a constant.
      for (const j = 0; j < this.particles[i].length; j++) {
        this.particles[i][j] += this.velocities[i][j];

        // Apply bounds;
        // @ts-expect-error TS(2339): Property 'config' does not exist on type 'Particle... Remove this comment to see the full error message
        const { min, max } = this.config.constraints!;
        if (min) {
          this.particles[i][j] = Math.max(this.particles[i][j], min[j]);
        }
        if (max) {
          this.particles[i][j] = Math.min(this.particles[i][j], max[j]);
        }
      }

      // Evaluate new position;
      // @ts-expect-error TS(2339): Property 'checkConstraints' does not exist on type... Remove this comment to see the full error message
      if (this.checkConstraints(this.particles[i])) {
        // Update personal best;
        // @ts-expect-error TS(2304): Cannot find name 'value'.
        if (value < this.personalBestValues[i]) {
          // @ts-expect-error TS(2304): Cannot find name 'value'.
          this.personalBestValues[i] = value;
          this.personalBests[i] = [...this.particles[i]];

          // Update global best;
          // @ts-expect-error TS(2304): Cannot find name 'value'.
          if (value < this.globalBestValue) {
            // @ts-expect-error TS(2304): Cannot find name 'value'.
            this.globalBestValue = value;
            this.globalBest = [...this.particles[i]];
            // @ts-expect-error TS(2339): Property 'updateBest' does not exist on type 'Part... Remove this comment to see the full error message
            this.updateBest(this.particles[i], value);
          }
        }
      }
    }
  }

  protected checkConvergence(): boolean {
    // @ts-expect-error TS(2339): Property 'history' does not exist on type 'Particl... Remove this comment to see the full error message
    if (this.history.length < 10) {
      return false;
    }

    // Check if particles have converged to a small region;

    const avgVariance =
      // @ts-expect-error TS(2304): Cannot find name 'positionVariances'.
      positionVariances.reduce((sum: any, variance: any) => sum + variance, 0) / positionVariances.length;

    // @ts-expect-error TS(2304): Cannot find name 'valueConvergence'.
    return avgVariance < 1e-6 || valueConvergence;
  }

  // @ts-expect-error TS(2339): Property '0' does not exist on type 'Number'.
  private calculatePositionVariances(): number[0] {
    // @ts-expect-error TS(2339): Property '0' does not exist on type 'Number'.
    const variances: number[0] = [0];

    // @ts-expect-error TS(2304): Cannot find name 'dimension'.
    for (const j = 0; j < dimension; j++) {
      const variance =
        // @ts-expect-error TS(2304): Cannot find name 'positions'.
        positions.reduce((sum: any, pos: any) => sum + Math.pow(pos - mean, 2), 0) / positions.length;
      variances.push(variance);
    }

    return variances;
  }
}
