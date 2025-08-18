// Stub injury service for Research Dashboard

export interface PlayerInjury {
  playerId: string;
  playerName: string;
  team: string;
  injury: string;
  severity: 'minor' | 'moderate' | 'major' | 'questionable';
  status: 'active' | 'day-to-day' | 'out' | 'ir';
  lastUpdate: Date;
  expectedReturn?: Date;
  impact: number;
}

export interface InjuryReport {
  id: string;
  playerId: string;
  playerName: string;
  team: string;
  injury: string;
  severity: 'minor' | 'moderate' | 'major' | 'questionable';
  status: 'active' | 'day-to-day' | 'out' | 'ir';
  lastUpdate: Date;
  expectedReturn?: Date;
  impact: number;
}

export interface InjuryTrend {
  id: string;
  playerId: string;
  trend: 'improving' | 'worsening' | 'stable';
  timeline: string;
}

export interface HealthAlert {
  id: string;
  playerId: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  timestamp: Date;
}

class InjuryService {
  async getInjuries(): Promise<PlayerInjury[]> {
    // Mock data for development
    return [
      {
        playerId: '1',
        playerName: 'Fernando Tatis Jr.',
        team: 'SD',
        injury: 'Shoulder Inflammation',
        severity: 'questionable',
        status: 'day-to-day',
        lastUpdate: new Date(),
        expectedReturn: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        impact: 6
      },
      {
        playerId: '2',
        playerName: 'Jacob deGrom',
        team: 'TEX',
        injury: 'Elbow Soreness',
        severity: 'moderate',
        status: 'out',
        lastUpdate: new Date(),
        expectedReturn: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        impact: 8
      }
    ];
  }

  async getInjuryReports(): Promise<InjuryReport[]> {
    const injuries = await this.getInjuries();
    return injuries.map(injury => ({
      id: injury.playerId,
      ...injury
    }));
  }

  async getInjuryTrends(): Promise<InjuryTrend[]> {
    return [];
  }

  async getHealthAlerts(): Promise<HealthAlert[]> {
    return [];
  }
}

export const injuryService = new InjuryService();
