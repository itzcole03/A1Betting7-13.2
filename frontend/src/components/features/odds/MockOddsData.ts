/**
 * Mock odds data for demo mode when backend is unavailable
 */

export const mockOddsData = {
  best_lines: [
    {
      market: "LAD vs SF",
      player_name: "Mookie Betts",
      stat_type: "hits",
      best_over_book: "DraftKings",
      best_over_price: -105,
      best_over_line: 1.5,
      best_under_book: "FanDuel", 
      best_under_price: -115,
      best_under_line: 1.5,
      no_vig_fair_price: 0.52,
      arbitrage_opportunity: false,
      arbitrage_profit: 0.0,
      books_count: 4
    },
    {
      market: "NYY vs BOS",
      player_name: "Aaron Judge",
      stat_type: "home_runs",
      best_over_book: "BetMGM",
      best_over_price: +105,
      best_over_line: 0.5,
      best_under_book: "Caesars",
      best_under_price: -125,
      best_under_line: 0.5,
      no_vig_fair_price: 0.48,
      arbitrage_opportunity: true,
      arbitrage_profit: 2.3,
      books_count: 5
    },
    {
      market: "ATL vs NYM",
      player_name: "Ronald Acuna Jr.",
      stat_type: "total_bases",
      best_over_book: "PointsBet",
      best_over_price: -110,
      best_over_line: 2.5,
      best_under_book: "FanDuel",
      best_under_price: -110,
      best_under_line: 2.5,
      no_vig_fair_price: 0.50,
      arbitrage_opportunity: false,
      arbitrage_profit: 0.0,
      books_count: 3
    }
  ],
  arbitrage_opportunities: [
    {
      market: "NYY vs BOS",
      player_name: "Aaron Judge", 
      stat_type: "home_runs",
      over_book: "BetMGM",
      over_price: +105,
      over_line: 0.5,
      under_book: "Caesars",
      under_price: -125,
      under_line: 0.5,
      profit_percentage: 2.3,
      stake_distribution: {
        over: 48.2,
        under: 51.8
      },
      timestamp: new Date().toISOString()
    }
  ]
};

export const mockCheatsheetData = {
  opportunities: [
    {
      id: "1",
      player_name: "Aaron Judge",
      stat_type: "hits",
      line: 1.5,
      recommended_side: "over",
      edge_percentage: 4.2,
      confidence: 78.5,
      best_odds: -105,
      best_book: "DraftKings",
      fair_price: 0.548,
      implied_probability: 0.512,
      recent_performance: "7 of last 10 games over",
      sample_size: 15,
      last_updated: new Date().toISOString(),
      sport: "MLB",
      team: "NYY",
      opponent: "BOS",
      venue: "home",
      market_efficiency: 0.85,
      volatility_score: 0.32,
      trend_direction: "bullish"
    },
    {
      id: "2", 
      player_name: "Mookie Betts",
      stat_type: "total_bases",
      line: 2.5,
      recommended_side: "under",
      edge_percentage: 3.1,
      confidence: 72.3,
      best_odds: +110,
      best_book: "FanDuel",
      fair_price: 0.425,
      implied_probability: 0.476,
      recent_performance: "4 of last 10 games under",
      sample_size: 12,
      last_updated: new Date().toISOString(),
      sport: "MLB", 
      team: "LAD",
      opponent: "SF",
      venue: "away",
      market_efficiency: 0.78,
      volatility_score: 0.45,
      trend_direction: "neutral"
    }
  ]
};
