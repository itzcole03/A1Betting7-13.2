import { getBackendUrl } from '../utils/getBackendUrl';

export interface TrendingSuggestion {
  prompt: string;
  type: 'moneyline' | 'spread' | 'total' | 'prop' | 'default';
  teams?: string[];
  odds?: any[];
  category?: string;
  confidence?: number;
}

export interface TrendingTopic {
  id: string;
  keyword: string;
  volume: number;
  sentiment: number;
  growth: number;
  category: string;
  relevantGames: string[];
  impact: 'high' | 'medium' | 'low';
}

class TrendingSuggestionsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getBackendUrl();
  }

  async getTrendingSuggestions(): Promise<TrendingSuggestion[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/trending-suggestions`, {
        timeout: 3000, // 3 second timeout
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : this.getFallbackSuggestions();
    } catch (error) {
      // Silently handle expected API unavailability and use fallbacks
      console.warn('Trending API unavailable, using fallback suggestions');
      return this.getFallbackSuggestions();
    }
  }

  private getFallbackSuggestions(): TrendingSuggestion[] {
    return [
      {
        prompt: "What are today's best NBA picks?",
        type: 'default',
        category: 'NBA',
        confidence: 0.8
      },
      {
        prompt: "Show me high-confidence NFL props",
        type: 'prop',
        category: 'NFL',
        confidence: 0.85
      },
      {
        prompt: "What's trending in NBA player props?",
        type: 'prop',
        category: 'NBA',
        confidence: 0.75
      },
      {
        prompt: "Give me today's money line locks",
        type: 'moneyline',
        category: 'General',
        confidence: 0.9
      },
      {
        prompt: "What are the sharp bettors playing?",
        type: 'default',
        category: 'Sharp Action',
        confidence: 0.82
      },
      {
        prompt: "Show me live betting opportunities",
        type: 'default',
        category: 'Live Betting',
        confidence: 0.78
      },
      {
        prompt: "Which teams have the best value today?",
        type: 'default',
        category: 'Value Bets',
        confidence: 0.73
      },
      {
        prompt: "Show me player prop arbitrage opportunities",
        type: 'prop',
        category: 'Arbitrage',
        confidence: 0.87
      },
      {
        prompt: "What's the public betting heavily?",
        type: 'default',
        category: 'Public Action',
        confidence: 0.71
      },
      {
        prompt: "Any weather-affected games today?",
        type: 'default',
        category: 'Weather',
        confidence: 0.69
      }
    ];
  }

  // Generate dynamic suggestions based on trending topics
  generateSuggestionsFromTopics(topics: TrendingTopic[]): TrendingSuggestion[] {
    return topics.slice(0, 4).map(topic => ({
      prompt: `Tell me about ${topic.keyword} impact on betting`,
      type: 'default' as const,
      category: topic.category,
      confidence: Math.abs(topic.sentiment)
    }));
  }

  // Get time-based suggestions
  getTimeBasedSuggestions(): TrendingSuggestion[] {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 12) {
      // Morning suggestions
      return [
        { prompt: "What are today's early picks?", type: 'default', category: 'Morning Lines' },
        { prompt: "Show me opening line movement", type: 'default', category: 'Line Movement' },
        { prompt: "Any injury updates affecting today's games?", type: 'default', category: 'Injury News' }
      ];
    } else if (hour >= 12 && hour < 18) {
      // Afternoon suggestions
      return [
        { prompt: "What's the sharp money on?", type: 'default', category: 'Sharp Action' },
        { prompt: "Show me best live betting spots", type: 'default', category: 'Live Betting' },
        { prompt: "Any late breaking news?", type: 'default', category: 'Breaking News' }
      ];
    } else {
      // Evening/Night suggestions
      return [
        { prompt: "What are tonight's best bets?", type: 'default', category: 'Prime Time' },
        { prompt: "Show me late game props", type: 'prop', category: 'Props' },
        { prompt: "Any late line value?", type: 'default', category: 'Line Shopping' }
      ];
    }
  }
}

export const trendingSuggestionsService = new TrendingSuggestionsService();
