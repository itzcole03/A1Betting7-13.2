import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import Message from './Message';
import PropOllamaMessages from './PropOllamaMessages'; // Import new message display component
import PropOllamaInput from './PropOllamaInput'; // Import new input component
import { propOllamaService, ScraperHealth, ModelHealthStatus, PropOllamaRequest } from '../../services/propOllamaService';

// Props interface for PropOllama
export interface PropOllamaProps {
  variant?: 'cyber' | 'classic';
  className?: string;
}

// Message interface for chat messages
export interface PropOllamaMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  confidence?: number;
  suggestions?: string[];
  shap_explanation?: Record<string, number>;
}

const PropOllama: React.FC<PropOllamaProps> = ({ variant = 'cyber', className = '' }) => {
  const baseClasses = `w-full h-screen flex flex-col rounded-lg border transition-all duration-200 ${
    variant === 'cyber'
      ? 'border-cyan-400/30 bg-gray-900 text-cyan-100'
      : 'border-gray-200 bg-white text-gray-900 dark:bg-gray-900 dark:text-white'
  }`;
  const [messages, setMessages] = useState<PropOllamaMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [modelHealth, setModelHealth] = useState<Record<string, ModelHealthStatus>>({});
  // messagesEndRef is now managed inside PropOllamaMessages
  // const messagesEndRef = useRef<HTMLDivElement>(null);

  // Health check logic
  const checkHealth = async () => {
    try {
      const healthData = await propOllamaService.getPropOllamaHealth();
      setError(null);
      alert(`PropOllama API Health: ${healthData.status} - ${healthData.message}`);
    } catch (err: any) {
      setError(err.message || 'Health check failed');
    }
  };

  useEffect(() => {
    const inputEl = document.getElementById('propollama-input');
    if (inputEl) (inputEl as HTMLInputElement).focus();

    // Fetch available models
    propOllamaService.getAvailableModels()
      .then(modelsArray => {
        setModels(modelsArray);
        if (modelsArray.length > 0) {
          setSelectedModel(modelsArray[0]);
        }
      })
      .catch(err => setError(`Failed to fetch models: ${err.message}`));

    // Fetch model health
    const fetchModelHealth = async () => {
      if (selectedModel) {
        try {
          const health = await propOllamaService.getModelHealth(selectedModel);
          setModelHealth(prev => ({ ...prev, [selectedModel]: health }));
        } catch (err: any) {
          setError(`Failed to fetch model health for ${selectedModel}: ${err.message}`);
        }
      } else if (models.length > 0) {
        const firstModel = models[0];
        setSelectedModel(firstModel);
        try {
          const health = await propOllamaService.getModelHealth(firstModel);
          setModelHealth(prev => ({ ...prev, [firstModel]: health }));
        } catch (err: any) {
          setError(`Failed to fetch model health for ${firstModel}: ${err.message}`);
        }
      }
    };
    fetchModelHealth();
  }, [selectedModel, models.length]);

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    // Optionally, auto-send suggestion:
    // setTimeout(() => handleSendMessage(), 100);
  };

  // Send user message and handle streaming LLM response
  const handleSendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setError(null);
    setIsLoading(true);
    const userMessage: PropOllamaMessage = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-user`,
      type: 'user',
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const payload: PropOllamaRequest = {
        message: userMessage.content,
        model: selectedModel,
        analysisType: 'general', // Explicitly cast to valid type
        includeWebResearch: true,
        requestBestBets:
          trimmed.toLowerCase().includes('best bets') ||
          trimmed.toLowerCase().includes('recommendations'),
      };

      const aiResponseData = await propOllamaService.sendChatMessage(payload);

      const aiResponse: PropOllamaMessage = {
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-ai`,
        type: 'ai',
        content: aiResponseData.content,
        timestamp: new Date(),
        confidence: aiResponseData.confidence,
        suggestions: aiResponseData.suggestions,
        shap_explanation: aiResponseData.shap_explanation,
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (err: any) {
      console.error('[PropOllama] Error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setIsLoading(false);
      // messagesEndRef is now managed inside PropOllamaMessages
      // setTimeout(() => {
      //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      // }, 100);
    }
  };

  // Scroll to bottom on new message (now handled by PropOllamaMessages)
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [messages]);

  return (
    <div
      className={`${baseClasses} ${className}`}
      role='main'
      aria-label='PropOllama chat interface'
    >
      {/* Header */}
      <div
        className={`p-6 border-b ${
          variant === 'cyber' ? 'border-cyan-400/30' : 'border-gray-200 dark:border-gray-700'
        }`}
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <div className={`text-2xl ${variant === 'cyber' ? 'text-cyan-400' : 'text-blue-600'}`}>
              🤖
            </div>
            <div>
              <h1
                className={`text-2xl font-bold ${
                  variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900 dark:text-white'
                }`}
              >
                PropOllama AI
              </h1>
              <p
                className={`text-sm ${
                  variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Powered by 96.4% Accuracy ML Ensemble
              </p>
              <button
                type='button'
                onClick={checkHealth}
                className={`mt-2 px-3 py-1 rounded text-xs font-medium border ${
                  variant === 'cyber'
                    ? 'bg-cyan-900/30 text-cyan-300 border-cyan-400/30 hover:bg-cyan-800/50'
                    : 'bg-gray-100 text-blue-600 border-blue-200 hover:bg-blue-50'
                }`}
                aria-label='Check PropOllama API health'
              >
                Check API Health
              </button>
              {/* Model selection dropdown and health */}
              <div className='mt-2 flex items-center gap-2'>
                <label htmlFor='model-select' className='font-semibold'>
                  Model:
                </label>
                <select
                  id='model-select'
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                  className='bg-gray-800 text-cyan-100 border border-cyan-400 rounded px-2 py-1'
                >
                  {models.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                {/* Model health status */}
                {selectedModel &&
                  modelHealth[selectedModel] &&
                  'status' in modelHealth[selectedModel] && (
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs ${
                        modelHealth[selectedModel].status === 'ready'
                          ? 'bg-green-700 text-green-100'
                          : 'bg-red-700 text-red-100'
                      }`}
                    >
                      {modelHealth[selectedModel].status}
                      {modelHealth[selectedModel].last_error
                        ? ` (${modelHealth[selectedModel].last_error})`
                        : ''}
                    </span>
                  )}
              </div>
            </div>
          </div>
          {/* Status Indicators */}
          <div className='flex space-x-2'>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                variant === 'cyber'
                  ? 'bg-green-400/10 text-green-400 border border-green-400/30'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}
            >
              🎯 96.4% Accuracy
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                variant === 'cyber'
                  ? 'bg-purple-400/10 text-purple-400 border border-purple-400/30'
                  : 'bg-purple-50 text-purple-700 border border-purple-200'
              }`}
            >
              🧠 SHAP AI
            </div>
          </div>
        </div>
      </div>
      {/* Messages */}
      <PropOllamaMessages
        messages={messages}
        onSuggestionClick={handleSuggestionClick}
                variant={variant}
              />

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          className='flex justify-start p-6' // Added p-6 for spacing
            aria-live='assertive'
            aria-busy='true'
          >
            <div
              className={`max-w-md rounded-lg p-4 flex items-center space-x-3 ${
                variant === 'cyber'
                  ? 'bg-gray-900/50 border border-cyan-400/20'
                  : 'bg-gray-50 border border-gray-200'
              }`}
              role='status'
              aria-label='Loading AI response'
            >
              <span className='sr-only'>Loading AI response...</span>
              <svg
                className={`animate-spin h-6 w-6 ${
                  variant === 'cyber' ? 'text-cyan-400' : 'text-blue-600'
                }`}
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                aria-hidden='true'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8z'></path>
              </svg>
              <span
                className={`text-sm ${variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'}`}
              >
                Analyzing with 96.4% accuracy models...
              </span>
            </div>
          </motion.div>
        )}
        {/* Error Message */}
        {error && (
        <div className='mt-2 text-red-500 text-sm p-6' role='alert' aria-live='assertive'> {/* Added p-6 for spacing */}
            <strong>Error:</strong> {error}
          </div>
        )}
      {/* Input */}
      <PropOllamaInput
        input={input}
        setInput={setInput}
        handleSendMessage={handleSendMessage}
        isLoading={isLoading}
        error={error}
        setError={setError}
        variant={variant}
      />
    </div>
  );
};
export default PropOllama;
