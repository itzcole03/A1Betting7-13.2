export interface LineupSubmission {
  players: string[];
  totalSalary: number;
  sport: string;
  contestId?: string;
}
export declare function getPlayers(): Promise<any[]>;
export declare function submitLineup(
  lineup: LineupSubmission
): Promise<{ success: boolean; lineupId?: string }>;
