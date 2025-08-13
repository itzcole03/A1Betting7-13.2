// Mocked NBA props for E2E/UI tests
import { FeaturedProp } from './FeaturedPropsService';

export const mockProps: FeaturedProp[] = [
  {
    id: 'mlb-1',
    player: 'Aaron Judge',
    matchup: 'Yankees vs Red Sox',
    stat: 'Home Runs',
    line: 1.5,
    overOdds: 2.1,
    underOdds: 1.7,
    confidence: 92,
    sport: 'MLB',
    gameTime: '2025-07-29T20:00:00Z',
    pickType: 'Home Runs',
  },
  {
    id: 'mlb-2',
    player: 'Shohei Ohtani',
    matchup: 'Angels vs Astros',
    stat: 'Strikeouts',
    line: 8.5,
    overOdds: 1.95,
    underOdds: 1.85,
    confidence: 88,
    sport: 'MLB',
    gameTime: '2025-07-29T21:00:00Z',
    pickType: 'Strikeouts',
  },
  {
    id: 'nba-1',
    player: 'LeBron James',
    matchup: 'Lakers vs Warriors',
    stat: 'Points',
    line: 28.5,
    overOdds: 1.8,
    underOdds: 2.0,
    confidence: 85,
    sport: 'NBA',
    gameTime: '2025-07-29T19:00:00Z',
    pickType: 'Points',
  },
  {
    id: 'nba-2',
    player: 'Stephen Curry',
    matchup: 'Lakers vs Warriors',
    stat: '3PT Made',
    line: 4.5,
    overOdds: 1.9,
    underOdds: 1.9,
    confidence: 78,
    sport: 'NBA',
    gameTime: '2025-07-29T19:00:00Z',
    pickType: '3PT Made',
  },
];

export default mockProps;
