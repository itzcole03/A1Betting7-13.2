import React from 'react';
import { EnhancedPropAnalysis } from '../services/EnhancedPropAnalysisService';
import { FeaturedProp } from '../services/unified/FeaturedPropsService';
import PropCard from './PropCard';

interface EnhancedPropCardProps {
  proj: FeaturedProp;
  analysisNode: React.ReactNode;
  onCollapse: () => void;
  fetchEnhancedAnalysis: (proj: FeaturedProp) => Promise<EnhancedPropAnalysis | null>;
  enhancedAnalysisCache: Map<string, EnhancedPropAnalysis>;
  loadingAnalysis: Set<string>;
}

const EnhancedPropCard: React.FC<EnhancedPropCardProps> = ({
  proj,
  analysisNode,
  onCollapse,
  fetchEnhancedAnalysis,
  enhancedAnalysisCache,
  loadingAnalysis,
}) => {
  const [enhancedData, setEnhancedData] = React.useState<EnhancedPropAnalysis | null>(null);
  const [isLoadingEnhanced, setIsLoadingEnhanced] = React.useState(false);
  const [hasRequestedAnalysis, setHasRequestedAnalysis] = React.useState(false);

  const cacheKey = `${proj.id}-${proj.player}-${proj.stat}`;

  // Check if analysis is already cached
  React.useEffect(() => {
    const cached = enhancedAnalysisCache.get(cacheKey);
    if (cached) {
      setEnhancedData(cached);
      setHasRequestedAnalysis(true);
    }
  }, [cacheKey, enhancedAnalysisCache]);

  // Handle analysis request when user clicks the toggle
  const handleRequestAnalysis = async () => {
    if (hasRequestedAnalysis || loadingAnalysis.has(cacheKey)) {
      return;
    }

    setIsLoadingEnhanced(true);
    setHasRequestedAnalysis(true);

    try {
      const analysis = await fetchEnhancedAnalysis(proj);
      if (analysis) {
        setEnhancedData(analysis);
      }
    } finally {
      setIsLoadingEnhanced(false);
    }
  };

  // Get real stats and insights, or fallback to mock data
  const getStatsAndInsights = () => {
    if (enhancedData) {
      return {
        stats: enhancedData.statistics,
        insights: enhancedData.insights.map(insight => ({
          icon: getInsightIcon(insight.type),
          text: insight.text,
        })),
        summary: generateBettingRecommendation(proj),
        deepAnalysis: enhancedData.deep_analysis,
      };
    }

    // Fallback to mock data if enhanced data not available
    return {
      stats: [
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
      ],
      insights: [
        {
          icon: '🔥',
          text: `${proj.player} has consistently gone UNDER 1.5 hits + RBIs in his last 10 games, hitting this mark only twice during this stretch.`,
        },
        {
          icon: '🔒',
          text: `The defense ranks #6 in the league, allowing a mere estimated batting average of .256, contributing to a tougher matchup for ${proj.player}.`,
        },
        {
          icon: '⚡',
          text: `With the opposing pitcher allowing an xwOBA of .359 but a solid xBA of .298 against ${proj.player}, this suggests he may struggle against today's opposing pitcher.`,
        },
      ],
      summary: generateBettingRecommendation(proj),
      deepAnalysis: '',
    };
  };

  // Helper function to generate actionable betting recommendations
  const generateBettingRecommendation = (proj: FeaturedProp): string => {
    try {
      // Extract basic information with fallbacks
      const player = proj.player || 'Unknown Player';
      const stat = proj.stat || 'Unknown Stat';
      const line = proj.line || 0;
      const confidence = proj.confidence || 0;

      // Determine OVER/UNDER recommendation based on confidence
      // Higher confidence (>65%) suggests the player will exceed the line (OVER)
      // Lower confidence suggests they won't exceed the line (UNDER)
      const recommendation = confidence > 65 ? 'OVER' : 'UNDER';

      // Extract opponent from matchup string
      const opponent = extractOpponentFromMatchup(proj.matchup);

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
      return proj.stat ? `Prop type: ${proj.stat}` : 'No summary available.';
    }
  };

  // Helper function to extract opponent from matchup string
  const extractOpponentFromMatchup = (matchup: string): string => {
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

  // Helper function to format stat names for better readability
  const formatStatName = (stat: string, line: number): string => {
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

  const { stats, insights, summary, deepAnalysis } = getStatsAndInsights();

  // Keep the summary clean and concise - just show the betting recommendation
  // Don't append additional metadata about alternative props
  return (
    <PropCard
      player={proj.player}
      team={proj.matchup || ''}
      position={''}
      score={Math.round(proj.confidence || 0)}
      summary={summary}
      analysis={enhancedData?.deep_analysis || analysisNode}
      onCollapse={onCollapse}
      onRequestAnalysis={handleRequestAnalysis}
      isAnalysisLoading={isLoadingEnhanced || loadingAnalysis.has(cacheKey)}
      hasAnalysis={!!enhancedData?.deep_analysis || hasRequestedAnalysis}
      stats={stats}
      insights={insights}
    />
  );
};

// Helper function to get appropriate icon for insight type
const getInsightIcon = (type: string): string => {
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

export default EnhancedPropCard;
