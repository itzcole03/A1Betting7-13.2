import type { UnifiedPropCardProps, PropCardVariant } from './PropCard';

/**
 * Convert old prop format to new unified format
 */
export const convertToUnifiedFormat = (
  oldProp: any,
  variant: PropCardVariant = 'standard'
): UnifiedPropCardProps => {
  return {
    variant,
    player: {
      name: oldProp.player || oldProp.playerName,
      team: oldProp.team,
      position: oldProp.position,
      headshot: oldProp.headshot,
      espnPlayerId: oldProp.espnPlayerId
    },
    game: {
      matchup: oldProp.matchup,
      opponent: oldProp.opponent,
      date: oldProp.date,
      time: oldProp.time,
      venue: oldProp.venue
    },
    prop: {
      type: oldProp.stat || oldProp.propType,
      stat: oldProp.stat,
      line: oldProp.line,
      confidence: oldProp.confidence,
      overOdds: oldProp.overOdds,
      underOdds: oldProp.underOdds,
      recommendation: oldProp.recommendation
    },
    analysis: {
      summary: oldProp.summary,
      analysis: oldProp.analysis,
      stats: oldProp.stats || [],
      insights: oldProp.insights || []
    },
    // Pass through additional props
    isExpanded: oldProp.isExpanded,
    isAnalysisLoading: oldProp.isAnalysisLoading,
    hasAnalysis: oldProp.hasAnalysis,
    showStatcastMetrics: oldProp.showStatcastMetrics,
    accentColor: oldProp.accentColor,
    bookmarked: oldProp.bookmarked,
    logoUrl: oldProp.logoUrl,
    maxScore: oldProp.maxScore,
    onClick: oldProp.onClick,
    onCollapse: oldProp.onCollapse,
    onRequestAnalysis: oldProp.onRequestAnalysis,
    fetchEnhancedAnalysis: oldProp.fetchEnhancedAnalysis,
    enhancedAnalysisCache: oldProp.enhancedAnalysisCache,
    loadingAnalysis: oldProp.loadingAnalysis,
    statcastData: oldProp.statcastData,
    alternativeProps: oldProp.alternativeProps
  };
};

/**
 * Extract team from matchup string
 */
export const extractTeamFromMatchup = (matchup: string): string => {
  if (!matchup) return '';
  
  try {
    // Handle various matchup formats:
    // "Team1 vs Team2", "Team1 @ Team2", "Player vs Team", etc.
    const vsMatch = matchup.match(/^(.+?)(?:\s+(?:vs|@|versus)\s+)/i);
    if (vsMatch) {
      return vsMatch[1].trim();
    }

    // Handle "Team1 - Team2" format
    const dashMatch = matchup.match(/^(.+?)\s-\s/);
    if (dashMatch) {
      return dashMatch[1].trim();
    }

    // Fallback to first word/token
    const parts = matchup.split(' ');
    return parts[0] || '';
  } catch (error) {
    console.warn('Error extracting team from matchup:', error);
    return '';
  }
};

/**
 * Extract opponent from matchup string
 */
export const extractOpponentFromMatchup = (matchup: string): string => {
  if (!matchup || matchup === 'N/A') return 'TBD';

  try {
    // Handle various matchup formats:
    // "Team1 vs Team2", "Team1 @ Team2", "Player vs Team", etc.
    const vsMatch = matchup.match(/(?:vs|@|versus)\s+(.+?)(?:\s|$)/i);
    if (vsMatch) {
      return vsMatch[1].trim();
    }

    // Handle "Team1 - Team2" format
    const dashMatch = matchup.match(/\s-\s(.+?)(?:\s|$)/);
    if (dashMatch) {
      return dashMatch[1].trim();
    }

    // If no clear pattern, return the matchup as-is (truncated if too long)
    return matchup.length > 20 ? matchup.substring(0, 20) + '...' : matchup;
  } catch (error) {
    console.warn('Error extracting opponent from matchup:', error);
    return 'TBD';
  }
};

/**
 * Generate summary from prop data
 */
export const generateSummary = (prop: any): string => {
  try {
    // Extract basic information with fallbacks
    const player = prop.player || 'Unknown Player';
    const stat = prop.stat || 'Unknown Stat';
    const line = prop.line || 0;
    const confidence = prop.confidence || 0;

    // Determine OVER/UNDER recommendation based on confidence
    // Higher confidence (>65%) suggests the player will exceed the line (OVER)
    // Lower confidence suggests they won't exceed the line (UNDER)
    const recommendation = confidence > 65 ? 'OVER' : 'UNDER';

    // Extract opponent from matchup string
    const opponent = extractOpponentFromMatchup(prop.matchup);

    // Format stat name for better readability
    const formattedStat = formatStatName(stat, line);

    // Generate recommendation sentence matching PROP app format
    if (confidence < 50) {
      // Low confidence - provide cautious recommendation
      return `Monitoring ${player} (${formattedStat}) versus ${opponent} - proceed with caution`;
    } else if (confidence < 60) {
      // Medium-low confidence - suggest lean
      return `Lean ${recommendation} on ${player} (${formattedStat}) versus ${opponent}`;
    } else {
      // Good confidence - provide strong recommendation
      return `We suggest betting the ${recommendation} on ${player} (${formattedStat}) versus ${opponent}`;
    }
  } catch (error) {
    console.warn('Error generating betting recommendation:', error);
    return prop.stat ? `Prop type: ${prop.stat}` : 'No summary available.';
  }
};

/**
 * Format stat names for better readability
 */
export const formatStatName = (stat: string, line: number): string => {
  try {
    const lowerStat = stat.toLowerCase();

    // Format common stat types with proper line display
    if (lowerStat.includes('hit') && lowerStat.includes('rbi')) {
      return `${line} hits + RBI`;
    } else if (lowerStat.includes('hit')) {
      return `${line} hits`;
    } else if (lowerStat.includes('run') && lowerStat.includes('rbi')) {
      return `${line} runs + RBI`;
    } else if (lowerStat.includes('point')) {
      return `${line} points`;
    } else if (lowerStat.includes('rebound')) {
      return `${line} rebounds`;
    } else if (lowerStat.includes('assist')) {
      return `${line} assists`;
    } else if (lowerStat.includes('yard')) {
      return `${line} yards`;
    } else if (lowerStat.includes('reception')) {
      return `${line} receptions`;
    } else {
      // Generic fallback - just add the line number
      return `${line} ${stat.toLowerCase()}`;
    }
  } catch (error) {
    console.warn('Error formatting stat name:', error);
    return `${line} ${stat}`;
  }
};

/**
 * Convert FeaturedProp to unified format
 */
export const convertFeaturedPropToUnified = (featuredProp: any): UnifiedPropCardProps => {
  return {
    variant: 'enhanced',
    player: {
      name: featuredProp.player,
      team: extractTeamFromMatchup(featuredProp.matchup),
      headshot: featuredProp.headshot,
      espnPlayerId: featuredProp.espnPlayerId
    },
    game: {
      matchup: featuredProp.matchup,
      opponent: extractOpponentFromMatchup(featuredProp.matchup)
    },
    prop: {
      type: featuredProp.stat,
      stat: featuredProp.stat,
      line: featuredProp.line,
      confidence: featuredProp.confidence,
      overOdds: featuredProp.overOdds,
      underOdds: featuredProp.underOdds
    },
    analysis: {
      summary: generateSummary(featuredProp),
      stats: generateMockStats(),
      insights: generateMockInsights(featuredProp)
    }
  };
};

/**
 * Generate mock stats for fallback
 */
export const generateMockStats = () => [
  { label: '7/7', value: 0 },
  { label: '7/8', value: 1 },
  { label: '7/9', value: 0 },
  { label: '7/11', value: 1 },
  { label: '7/12', value: 1 },
  { label: '7/13', value: 0 },
  { label: '7/18', value: 1 },
  { label: '7/20', value: 0 },
  { label: '7/21', value: 0 },
  { label: '7/23', value: 0 },
];

/**
 * Generate mock insights for fallback
 */
export const generateMockInsights = (prop: any) => [
  {
    icon: '🔥',
    text: `${prop.player} has consistently gone UNDER 1.5 hits + RBIs in his last 10 games, hitting this mark only twice during this stretch.`,
  },
  {
    icon: '🔒',
    text: `The defense ranks #6 in the league, allowing a mere estimated batting average of .256, contributing to a tougher matchup for ${prop.player}.`,
  },
  {
    icon: '⚡',
    text: `With the opposing pitcher allowing an xwOBA of .359 but a solid xBA of .298 against ${prop.player}, this suggests he may struggle against today's opposing pitcher.`,
  },
];

/**
 * Helper to get insight icon based on type
 */
export const getInsightIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    feature_importance: '🎯',
    matchup_factor: '⚔️',
    historical_matchup: '📊',
    recent_trend: '📈',
    weather_impact: '🌤️',
    performance_trend: '🔥',
    matchup_advantage: '⚡',
  };
  return iconMap[type] || '💡';
};
