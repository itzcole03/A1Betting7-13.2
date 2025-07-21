// @ts-expect-error TS(2307): Cannot find module '@/models/User' or its correspo... Remove this comment to see the full error message
import { User } from '@/models/User';
// @ts-expect-error TS(2307): Cannot find module '@/models/Bet' or its correspon... Remove this comment to see the full error message
import { Bet } from '@/models/Bet';
// @ts-expect-error TS(2307): Cannot find module '@/models/Prediction' or its co... Remove this comment to see the full error message
import { Prediction } from '@/models/Prediction';
import { EventEmitter } from 'events';

// Types for clustering and profiles
interface UserProfile {
  user: User;
  bets: Bet[];
  predictions: Prediction[];
  clusterId?: number;
  stats?: any;
}

interface Cluster {
  id: number;
  centroid: any;
  members: UserProfile[];
  stats: any;
}

export class UserPersonalizationService extends EventEmitter {
  private static instance: UserPersonalizationService;
  private userProfiles: Map<string, UserProfile> = new Map();
  private clusters: Cluster[] = [];
  private readonly minClusterSize = 3;
  private readonly maxClusters = 10;

  private constructor() {
    super();
  }

  static getInstance(): UserPersonalizationService {
    if (!UserPersonalizationService.instance) {
      UserPersonalizationService.instance = new UserPersonalizationService();
    }
    return UserPersonalizationService.instance;
  }

  async initialize(): Promise<void> {
    // Optionally load persisted profiles/clusters
    // For now, do nothing
  }

  updateUserProfile(user: User, bet: Bet, prediction: Prediction): void {
    let profile = this.userProfiles.get(user.id);
    if (!profile) {
      profile = { user, bets: [], predictions: [] };
      this.userProfiles.set(user.id, profile);
    }
    profile.bets.push(bet);
    profile.predictions.push(prediction);
    this.createOrUpdateProfileStats(profile);
    this.updateClusters();
    this.emit('profileUpdated', user.id);
  }

  private createOrUpdateProfileStats(profile: UserProfile) {
    // Calculate stats: ROI, win rate, average odds, etc.
    const bets = profile.bets;
    const winCount = bets.filter(b => b.result === 'won').length;
    const roi = bets.length ? bets.reduce((acc, b) => acc + (b.payout - b.stake), 0) / bets.length : 0;
    profile.stats = {
      winRate: bets.length ? winCount / bets.length : 0,
      roi,
      avgOdds: bets.length ? bets.reduce((acc, b) => acc + b.odds, 0) / bets.length : 0,
      stakeVariation: bets.length ? Math.sqrt(bets.reduce((acc, b) => acc + Math.pow(b.stake - (bets.reduce((a, b) => a + b.stake, 0) / bets.length), 2), 0) / bets.length) : 0,
    };
  }

  private updateClusters() {
    // Simple k-means-like clustering on ROI and win rate
    const profiles = Array.from(this.userProfiles.values());
    if (profiles.length < this.minClusterSize) return;
    // For simplicity, cluster on [roi, winRate]
    const data = profiles.map(p => [p.stats.roi, p.stats.winRate]);
    // Initialize centroids
    let centroids = this.initializeCentroids(data, Math.min(this.maxClusters, profiles.length));
    let assignments = new Array(data.length).fill(0);
    let changed = true;
    while (changed) {
      // Assign to nearest centroid
      const newAssignments = data.map(point => this.assignToCentroid(point, centroids));
      changed = !this.areAssignmentsEqual(assignments, newAssignments);
      assignments = newAssignments;
      // Update centroids
      centroids = this.updateCentroids(data, assignments, centroids.length);
    }
    // Build clusters
    this.clusters = centroids.map((centroid, i) => ({
      id: i,
      centroid,
      members: profiles.filter((_, idx) => assignments[idx] === i),
      stats: {},
    }));
    // Update profile clusterId
    profiles.forEach((p, idx) => { p.clusterId = assignments[idx]; });
  }

  private initializeCentroids(data: number[][], k: number): number[][] {
    // Randomly pick k points as initial centroids
    const shuffled = data.slice().sort(() => Math.random() - 0.5);
    return shuffled.slice(0, k);
  }

  private assignToCentroid(point: number[], centroids: number[][]): number {
    let minDist = Infinity, minIdx = 0;
    centroids.forEach((c, i) => {
      const dist = this.calculateDistance(point, c);
      if (dist < minDist) { minDist = dist; minIdx = i; }
    });
    return minIdx;
  }

  private updateCentroids(data: number[][], assignments: number[], k: number): number[][] {
    const centroids: number[][] = [];
    for (let i = 0; i < k; i++) {
      const clusterPoints = data.filter((_, idx) => assignments[idx] === i);
      if (clusterPoints.length) {
        const mean = clusterPoints[0].map((_, dim) => clusterPoints.reduce((acc, p) => acc + p[dim], 0) / clusterPoints.length);
        centroids.push(mean);
      } else {
        centroids.push([0, 0]);
      }
    }
    return centroids;
  }

  private calculateDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((acc, val, i) => acc + Math.pow(val - b[i], 2), 0));
  }

  private areAssignmentsEqual(a: number[], b: number[]): boolean {
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }

  async getPersonalizedPrediction(userId: string, prediction: Prediction): Promise<Prediction> {
    const profile = this.userProfiles.get(userId);
    if (!profile) return prediction;
    // Adjust prediction based on user stats and cluster
    let adjusted = { ...prediction };
    if (profile.stats) {
      // Example: boost confidence for high win rate users
      adjusted.confidence = Math.min(1, adjusted.confidence + profile.stats.winRate * 0.1);
      // Example: adjust odds preference
      if (profile.stats.avgOdds > 2.5) adjusted.odds += 0.05;
    }
    if (profile.clusterId !== undefined) {
      // Example: cluster-based adjustment
      adjusted.confidence += (profile.clusterId || 0) * 0.01;
    }
    return adjusted;
  }
}

export const userPersonalizationService = UserPersonalizationService.getInstance();
