import React, { useEffect, useState } from 'react';
import { FeaturedProp } from '../services/unified/FeaturedPropsService';
import { EnhancedApiClient } from '../utils/enhancedApiClient';

interface ComprehensivePropsLoaderProps {
  gameId: number;
  onPropsGenerated: (props: FeaturedProp[]) => void;
}

interface ComprehensivePropsResponse {
  status: string;
  game_id: number;
  props: any[];
  summary: {
    total_props: number;
    high_confidence_props: number;
    unique_players: number;
    generation_timestamp: string;
    source: string;
  };
  message: string;
}

const ComprehensivePropsLoader: React.FC<ComprehensivePropsLoaderProps> = ({
  gameId,
  onPropsGenerated,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ComprehensivePropsResponse['summary'] | null>(null);

  // Create API client instance
  const apiClient = new EnhancedApiClient();

  useEffect(() => {
    generateComprehensiveProps();
  }, [gameId]);

  const generateComprehensiveProps = async () => {
    if (!gameId) return;

    setIsGenerating(true);
    setError(null);
    setGenerationStatus('Fetching game roster...');

    try {
      console.log(`[ComprehensivePropsLoader] Generating props for game ${gameId}`);

      // Add status updates
      setGenerationStatus('Analyzing player statistics...');

      // Small delay to show status
      await new Promise(resolve => setTimeout(resolve, 500));

      setGenerationStatus('Calculating prop targets...');

      // Call our comprehensive prop generation API
      const response = await apiClient.get(`/mlb/comprehensive-props/${gameId}`, {
        cache: false,
        timeout: 30000, // Longer timeout for prop generation
      });

      // Check if response was successful
      if (response.status === 200 && response.data && response.data.status === 'success') {
        setGenerationStatus('Applying ML confidence scoring...');

        // Small delay to show final status
        await new Promise(resolve => setTimeout(resolve, 500));

        const comprehensiveResponse = response.data as ComprehensivePropsResponse;

        // Transform raw props into FeaturedProp format using fetchFeaturedProps
        // Create a pseudo sport configuration that will use our generated props
        const mockSportConfig = {
          type: 'player' as const,
          sport: 'MLB',
          subType: 'comprehensive_generated',
          date: new Date().toISOString().split('T')[0],
        };

        // Convert the generated props to the format expected by the frontend
        const transformedProps: FeaturedProp[] = comprehensiveResponse.props.map(
          (prop: any, index: number) => ({
            id: prop.id || `generated_${gameId}_${index}`,
            player: prop.player_name,
            stat: prop.stat_type,
            line: prop.line || prop.target_value,
            overOdds: prop.over_odds || -110,
            underOdds: prop.under_odds || -110,
            confidence: prop.confidence || 60,
            gameTime: prop.game_time || new Date().toISOString(),
            matchup: `${prop.opposing_team || 'vs TBD'}`,
            sport: 'MLB',
            pickType: 'player',
            // Optional properties for enhanced display
            espnPlayerId: prop.espn_player_id,
            _originalData: prop, // Preserve the original comprehensive prop data
          })
        );

        console.log(
          `[ComprehensivePropsLoader] Generated ${transformedProps.length} props for game ${gameId}`
        );

        // Update summary
        setSummary(comprehensiveResponse.summary);

        // Pass props to parent component
        onPropsGenerated(transformedProps);

        setGenerationStatus(
          `✅ Generated ${comprehensiveResponse.summary.total_props} props for ${comprehensiveResponse.summary.unique_players} players`
        );
      } else {
        throw new Error(response.data?.message || 'Failed to generate props');
      }
    } catch (err: any) {
      console.error(`[ComprehensivePropsLoader] Error generating props:`, err);
      setError(err.message || 'Failed to generate comprehensive props');
      setGenerationStatus('❌ Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const retryGeneration = () => {
    setError(null);
    generateComprehensiveProps();
  };

  return (
    <div className='comprehensive-props-loader p-6 bg-slate-800 rounded-lg border border-slate-700'>
      <div className='text-center'>
        {/* Header */}
        <div className='mb-4'>
          <h3 className='text-lg font-semibold text-white mb-2'>🧠 AI Prop Generation System</h3>
          <p className='text-sm text-gray-400'>
            Creating comprehensive props for all game participants
          </p>
        </div>

        {/* Status */}
        <div className='mb-4'>
          <div className='text-sm text-yellow-400 mb-2'>{generationStatus}</div>

          {isGenerating && (
            <div className='flex justify-center'>
              <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400'></div>
            </div>
          )}
        </div>

        {/* Summary */}
        {summary && !isGenerating && !error && (
          <div className='bg-slate-700 rounded p-4 mb-4'>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <div className='text-gray-400'>Total Props</div>
                <div className='text-white font-semibold'>{summary.total_props}</div>
              </div>
              <div>
                <div className='text-gray-400'>High Confidence</div>
                <div className='text-green-400 font-semibold'>{summary.high_confidence_props}</div>
              </div>
              <div>
                <div className='text-gray-400'>Players Covered</div>
                <div className='text-white font-semibold'>{summary.unique_players}</div>
              </div>
              <div>
                <div className='text-gray-400'>Source</div>
                <div className='text-blue-400 font-semibold text-xs'>
                  {summary.source.replace('AI_', '').replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className='bg-red-900/20 border border-red-500 rounded p-4 mb-4'>
            <div className='text-red-400 text-sm mb-2'>⚠️ Generation Failed</div>
            <div className='text-red-300 text-xs mb-3'>{error}</div>
            <button
              onClick={retryGeneration}
              className='px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors'
            >
              Retry Generation
            </button>
          </div>
        )}

        {/* Features info */}
        {!error && (
          <div className='text-xs text-gray-500'>
            <div className='mb-1'>🔍 Historical statistics analysis</div>
            <div className='mb-1'>🧮 Position-based prop generation</div>
            <div className='mb-1'>🤖 ML confidence scoring</div>
            <div>⚡ Real-time target calculation</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComprehensivePropsLoader;
