/**
 * AI Explanation Panel - Ollama-powered explanations for player analysis
 * Provides streaming AI insights with stop/start controls
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Brain, Play, Square, AlertCircle, Lightbulb, TrendingUp } from 'lucide-react';
import OllamaService, { type ExplainRequest, type AIResponse } from '../../services/ai/OllamaService';

interface AIExplanationPanelProps {
  context: string;
  question?: string;
  playerIds?: string[];
  sport?: string;
  className?: string;
}

export const AIExplanationPanel: React.FC<AIExplanationPanelProps> = ({
  context,
  question = "Please analyze this player's performance and provide insights for prop research",
  playerIds,
  sport = 'MLB',
  className = '',
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<'unknown' | 'available' | 'unavailable'>('unknown');
  const [savedExplanations, setSavedExplanations] = useState<string[]>([]);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const explanationRef = useRef<HTMLDivElement>(null);

  // Check AI service status on mount
  useEffect(() => {
    checkAIStatus();
  }, []);

  // Auto-scroll explanation to bottom as it streams
  useEffect(() => {
    if (explanationRef.current && isGenerating) {
      explanationRef.current.scrollTop = explanationRef.current.scrollHeight;
    }
  }, [explanation, isGenerating]);

  const checkAIStatus = async () => {
    try {
      const status = await OllamaService.checkHealth();
      setAiStatus(status.ollamaAvailable ? 'available' : 'unavailable');
    } catch (error) {
      setAiStatus('unavailable');
    }
  };

  const generateExplanation = useCallback(async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setExplanation('');

    // Create abort controller for stopping generation
    abortControllerRef.current = new AbortController();

    try {
      const request: ExplainRequest = {
        context,
        question,
        playerIds,
        sport,
        includeTrends: true,
        includeMatchups: true,
      };

      let currentExplanation = '';
      
      for await (const response of OllamaService.streamExplanation(request)) {
        // Check if generation was aborted
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        if (response.type === 'chunk') {
          currentExplanation += response.content;
          setExplanation(currentExplanation);
        } else if (response.type === 'complete') {
          const finalContent = response.fullContent || currentExplanation;
          setExplanation(finalContent);
          
          // Save to local storage (keep last 5)
          const saved = JSON.parse(localStorage.getItem('ai-explanations') || '[]');
          const updated = [finalContent, ...saved.slice(0, 4)];
          localStorage.setItem('ai-explanations', JSON.stringify(updated));
          setSavedExplanations(updated);
          break;
        } else if (response.type === 'error') {
          setError(response.content);
          break;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [context, question, playerIds, sport, isGenerating]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  }, []);

  const loadSavedExplanations = useCallback(() => {
    const saved = JSON.parse(localStorage.getItem('ai-explanations') || '[]');
    setSavedExplanations(saved);
  }, []);

  useEffect(() => {
    loadSavedExplanations();
  }, [loadSavedExplanations]);

  return (
    <div className={`bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 ${className}`}>
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">AI Analysis</h3>
            <div className={`w-2 h-2 rounded-full ${
              aiStatus === 'available' ? 'bg-green-400' : 
              aiStatus === 'unavailable' ? 'bg-red-400' : 'bg-yellow-400'
            }`} title={`AI Status: ${aiStatus}`} />
          </div>
          
          <div className="flex items-center gap-2">
            {isGenerating ? (
              <button
                onClick={stopGeneration}
                className="flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            ) : (
              <button
                onClick={generateExplanation}
                disabled={aiStatus === 'unavailable'}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors"
              >
                <Play className="w-4 h-4" />
                Analyze
              </button>
            )}
          </div>
        </div>

        {aiStatus === 'unavailable' && (
          <div className="mt-2 flex items-center gap-2 text-sm text-orange-400">
            <AlertCircle className="w-4 h-4" />
            AI service unavailable - check if Ollama is running
          </div>
        )}
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-md">
            <div className="flex items-center gap-2 text-red-300">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        <div 
          ref={explanationRef}
          className="min-h-[200px] max-h-[400px] overflow-y-auto bg-slate-900/50 rounded-md p-4 border border-slate-600"
        >
          {isGenerating && !explanation && (
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              Generating analysis...
            </div>
          )}

          {explanation ? (
            <div className="text-slate-200 whitespace-pre-wrap leading-relaxed">
              {explanation}
              {isGenerating && (
                <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse" />
              )}
            </div>
          ) : !isGenerating && (
            <div className="text-slate-400 text-center py-8">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Click "Analyze" to generate AI-powered insights</p>
              <p className="text-sm mt-1">Get explanations for player performance, trends, and prop opportunities</p>
            </div>
          )}
        </div>

        {savedExplanations.length > 0 && (
          <details className="mt-4">
            <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Recent Analysis History ({savedExplanations.length})
            </summary>
            <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
              {savedExplanations.slice(0, 3).map((saved, index) => (
                <button
                  key={index}
                  onClick={() => setExplanation(saved)}
                  className="w-full text-left p-2 bg-slate-700/50 hover:bg-slate-700 rounded text-sm text-slate-300 truncate transition-colors"
                >
                  {saved.slice(0, 100)}...
                </button>
              ))}
            </div>
          </details>
        )}

        <div className="mt-4 text-xs text-slate-500 border-t border-slate-700 pt-3">
          <p>⚠️ AI-generated analysis is for research purposes only (18+/21+)</p>
          <p>Always verify insights with multiple sources • Never bet more than you can afford to lose</p>
        </div>
      </div>
    </div>
  );
};

export default AIExplanationPanel;
