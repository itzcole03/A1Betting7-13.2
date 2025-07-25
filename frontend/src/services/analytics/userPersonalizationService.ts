import { EventEmitter } from 'events';
import { Bet } from '../../models/Bet';
import { Prediction } from '../../models/Prediction';
import { User } from '../../models/User';

// Types for clustering and profiles
interface ProfileStats {
  winRate: number;
  roi: number;
  avgOdds: number;
  stakeVariation: number;
}

interface UserProfile {
  user: User;
  bets: Bet[];
  predictions: Prediction[];
  clusterId?: number;
  stats?: ProfileStats;
}

interface Cluster {
  id: number;
  centroid: unknown;
  members: UserProfile[];
  stats: unknown;
}

/**
 * Singleton service for user personalization, clustering, and profile management.
 *
 * Extends EventEmitter to allow event-driven updates.
 */
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
    let _profile = this.userProfiles.get(user.id);
    if (!_profile) {
      _profile = { user, bets: [], predictions: [] };
      this.userProfiles.set(user.id, _profile);
    }
    _profile.bets.push(bet);
    _profile.predictions.push(prediction);
    this.createOrUpdateProfileStats(_profile);
    this.updateClusters();
    this.emit('profileUpdated', user.id);
  }

  private createOrUpdateProfileStats(profile: UserProfile) {
    // Calculate stats: ROI, win rate, average odds, etc.
    const _bets = profile.bets;
    const _winCount = _bets.filter(b => b.result === 'won').length;
    const _roi = _bets.length
      ? _bets.reduce((acc, b) => acc + (b.payout - b.stake), 0) / _bets.length
      : 0;
    profile.stats = {
      winRate: _bets.length ? _winCount / _bets.length : 0,
      roi: _roi,
      avgOdds: _bets.length ? _bets.reduce((acc, b) => acc + b.odds, 0) / _bets.length : 0,
      stakeVariation: _bets.length
        ? Math.sqrt(
            _bets.reduce(
              (acc, b) =>
                acc + Math.pow(b.stake - _bets.reduce((a, b) => a + b.stake, 0) / _bets.length, 2),
              0
            ) / _bets.length
          )
        : 0,
    };
  }

  private updateClusters() {
    // Simple k-means-like clustering on ROI and win rate
    const _profiles = Array.from(this.userProfiles.values());
    const _profilesWithStats = _profiles.filter(
      p => p.stats !== undefined && p.stats.roi !== undefined && p.stats.winRate !== undefined
    );
    if (_profilesWithStats.length < this.minClusterSize) return;
    // For simplicity, cluster on [roi, winRate]
    const _data = _profilesWithStats.map(p => [p.stats!.roi, p.stats!.winRate]);
    // Initialize centroids
    let _centroids = this.initializeCentroids(_data, Math.min(this.maxClusters, _profiles.length));
    let _assignments = new Array(_data.length).fill(0);
    let _changed = true;
    while (_changed) {
      // Assign to nearest centroid
      const _newAssignments = _data.map(point => this.assignToCentroid(point, _centroids));
      _changed = !this.areAssignmentsEqual(_assignments, _newAssignments);
      _assignments = _newAssignments;
      // Update centroids
      _centroids = this.updateCentroids(_data, _assignments, _centroids.length);
    }
    // Build clusters
    this.clusters = _centroids.map((centroid, i) => ({
      id: i,
      centroid,
      members: _profiles.filter((_, idx) => _assignments[idx] === i),
      stats: {},
    }));
    // Update profile clusterId
    _profiles.forEach((p, idx) => {
      p.clusterId = _assignments[idx];
    });
  }

  private initializeCentroids(data: number[][], k: number): number[][] {
    // Randomly pick k points as initial centroids
    const _shuffled = data.slice().sort(() => Math.random() - 0.5);
    return _shuffled.slice(0, k);
  }

  private assignToCentroid(point: number[], centroids: number[][]): number {
    let _minDist = Infinity,
      _minIdx = 0;
    centroids.forEach((c, i) => {
      const _dist = this.calculateDistance(point, c);
      if (_dist < _minDist) {
        _minDist = _dist;
        _minIdx = i;
      }
    });
    return _minIdx;
  }

  private updateCentroids(data: number[][], assignments: number[], k: number): number[][] {
    const _centroids: number[][] = [];
    for (let _i = 0; _i < k; _i++) {
      const _clusterPoints = data.filter((_, idx) => assignments[idx] === _i);
      if (_clusterPoints.length) {
        const _mean = _clusterPoints[0].map(
          (_, dim) => _clusterPoints.reduce((acc, p) => acc + p[dim], 0) / _clusterPoints.length
        );
        _centroids.push(_mean);
      } else {
        _centroids.push([0, 0]);
      }
    }
    return _centroids;
  }

  private calculateDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((acc, val, i) => acc + Math.pow(val - b[i], 2), 0));
  }

  private areAssignmentsEqual(a: number[], b: number[]): boolean {
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }

  async getPersonalizedPrediction(userId: string, prediction: Prediction): Promise<Prediction> {
    const _profile = this.userProfiles.get(userId);
    if (!_profile) return prediction;
    // Adjust prediction based on user stats and cluster
    let _adjusted = { ...prediction };
    if (_profile.stats) {
      // Example: boost confidence for high win rate users
      _adjusted.confidence = Math.min(1, _adjusted.confidence + _profile.stats.winRate * 0.1);
      // Example: adjust odds preference
      if (_profile.stats.avgOdds > 2.5) _adjusted.odds += 0.05;
    }
    if (_profile.clusterId !== undefined) {
      // Example: cluster-based adjustment
      _adjusted.confidence += (_profile.clusterId || 0) * 0.01;
    }
    return _adjusted;
  }
}

export const _userPersonalizationService = UserPersonalizationService.getInstance();
