import { useState, useEffect } from 'react';
import { trendingSuggestionsService, TrendingSuggestion } from '../services/trendingSuggestionsService';

export const useTrendingSuggestions = () => {
  const [suggestions, setSuggestions] = useState<TrendingSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get API suggestions
      const apiSuggestions = await trendingSuggestionsService.getTrendingSuggestions();
      
      // Get time-based suggestions
      const timeSuggestions = trendingSuggestionsService.getTimeBasedSuggestions();
      
      // Combine and shuffle suggestions
      const allSuggestions = [...apiSuggestions, ...timeSuggestions];
      const shuffled = allSuggestions.sort(() => Math.random() - 0.5);
      
      // Take top 10 suggestions to ensure we have more than 6
      setSuggestions(shuffled.slice(0, 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
    
    // Refresh suggestions every 5 minutes
    const interval = setInterval(loadSuggestions, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    suggestions,
    loading,
    error,
    refresh: loadSuggestions
  };
};
