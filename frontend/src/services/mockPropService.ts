// Simple mock service to ensure PropOllama always has data
export interface MockPropProjection {
  id: string;
  player: string;
  team: string;
  sport: string;
  statType: string;
  line: number;
  overOdds: number;
  underOdds: number;
  confidence: number;
  value: number;
  reasoning: string;
}

export const getMockProjections = (): MockPropProjection[] => [
  {
    id: '1',
    player: 'LeBron James',
    team: 'LAL',
    sport: 'NBA',
    statType: 'Points',
    line: 25.5,
    overOdds: -110,
    underOdds: -110,
    confidence: 87,
    value: 8.2,
    reasoning: 'Strong recent scoring form, favorable matchup vs weak defense'
  },
  {
    id: '2',
    player: 'Josh Allen',
    team: 'BUF',
    sport: 'NFL',
    statType: 'Passing Yards',
    line: 287.5,
    overOdds: -105,
    underOdds: -115,
    confidence: 82,
    value: 7.5,
    reasoning: 'Elite passing offense, dome game conditions favor high passing volume'
  },
  {
    id: '3',
    player: 'Connor McDavid',
    team: 'EDM',
    sport: 'NHL',
    statType: 'Points',
    line: 1.5,
    overOdds: -120,
    underOdds: +100,
    confidence: 78,
    value: 6.8,
    reasoning: 'Leading scorer, home ice advantage against struggling defense'
  },
  {
    id: '4',
    player: 'Mookie Betts',
    team: 'LAD',
    sport: 'MLB',
    statType: 'Hits',
    line: 1.5,
    overOdds: -130,
    underOdds: +110,
    confidence: 75,
    value: 6.2,
    reasoning: 'Good matchup vs left-handed pitching, hitting well at home'
  },
  {
    id: '5',
    player: 'Jayson Tatum',
    team: 'BOS',
    sport: 'NBA',
    statType: 'Rebounds',
    line: 8.5,
    overOdds: -110,
    underOdds: -110,
    confidence: 71,
    value: 5.9,
    reasoning: 'Increased rebounding role with team injuries'
  },
  {
    id: '6',
    player: 'Patrick Mahomes',
    team: 'KC',
    sport: 'NFL',
    statType: 'TD Passes',
    line: 2.5,
    overOdds: +115,
    underOdds: -135,
    confidence: 84,
    value: 7.8,
    reasoning: 'Red zone efficiency leader, facing weak secondary'
  },
  {
    id: '7',
    player: 'Nikola Jokic',
    team: 'DEN',
    sport: 'NBA',
    statType: 'Assists',
    line: 9.5,
    overOdds: -105,
    underOdds: -115,
    confidence: 80,
    value: 7.1,
    reasoning: 'Elite playmaker, team relies heavily on his facilitation'
  },
  {
    id: '8',
    player: 'Davante Adams',
    team: 'LV',
    sport: 'NFL',
    statType: 'Receiving Yards',
    line: 75.5,
    overOdds: -110,
    underOdds: -110,
    confidence: 76,
    value: 6.5,
    reasoning: 'Primary target in high-volume passing attack'
  }
];

export const getStatsByPosition = () => ({
  NBA: ['Points', 'Rebounds', 'Assists', '3-Pointers', 'Steals', 'Blocks'],
  NFL: ['Passing Yards', 'Rushing Yards', 'Receiving Yards', 'TD Passes', 'Receptions'],
  NHL: ['Points', 'Goals', 'Assists', 'Shots', 'Saves'],
  MLB: ['Hits', 'Home Runs', 'RBIs', 'Strikeouts', 'Stolen Bases']
});

export const getTeamsByLeague = () => ({
  NBA: ['LAL', 'BOS', 'GSW', 'MIA', 'DEN', 'PHI', 'MIL', 'DAL'],
  NFL: ['BUF', 'KC', 'LAR', 'TB', 'GB', 'SF', 'CIN', 'LV'],
  NHL: ['EDM', 'CGY', 'TOR', 'BOS', 'NYR', 'VEG', 'COL', 'CAR'],
  MLB: ['LAD', 'NYY', 'HOU', 'ATL', 'SD', 'PHI', 'TOR', 'SF']
});
