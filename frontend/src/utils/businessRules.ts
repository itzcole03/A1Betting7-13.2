// [TEMPORARY] Local type definitions for missing types
interface PlayerProp {
  confidence: number;
  teamId: string;
  // Add other fields as needed
}
interface Entry {
  props: PlayerProp[];
  // Add other fields as needed
}

// Centralized business rules for the app;

// Minimum win rate (e.g., 84%)
export const _MIN_WIN_RATE = 0.84;

// Example: Enforce team diversification (no more than X players from the same team)
export function isTeamDiversified(_props: PlayerProp[], _maxPerTeam = 2): boolean {
  const _teamCounts: Record<string, number> = {};
  for (const _prop of props) {
    const _teamId = prop.teamId;
    teamCounts[teamId] = (teamCounts[teamId] || 0) + 1;
    if (teamCounts[teamId] > maxPerTeam) return false;
  }
  return true;
}

/**
 * Returns the multiplier for a given entry type.
 * Extend this logic as new types or business rules are added.
 */
export function getMultiplier(_type: 'goblin' | 'normal' | 'demon'): number {
  switch (type) {
    case 'goblin':
      return 1.5;
    case 'demon':
      return 3.0;
    case 'normal':
    default:
      return 2.0;
  }
}

// Validate entry against all business rules;
export function validateEntry(_entry: Entry): string[] {
  const _errors: string[] = [];
  // Enforce minimum win rate;
  if (entry.props.some((prop: PlayerProp) => prop.confidence < MIN_WIN_RATE)) {
    errors.push(`All props must have at least ${(MIN_WIN_RATE * 100).toFixed(0)}% win rate.`);
  }
  // Enforce team diversification;
  if (!isTeamDiversified(entry.props)) {
    errors.push('Too many props from the same team.');
  }
  // Add more rules as needed;
  return errors;
}
