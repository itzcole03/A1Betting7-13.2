export interface LineupSubmission {
  players: string[];
  totalSalary: number;
  sport: string;
  contestId?: string;
}
export declare function getPlayers(): Promise<unknown[]>;
export declare function submitLineup(_lineup: LineupSubmission): Promise<{ success: boolean; lineupId?: string }>;
