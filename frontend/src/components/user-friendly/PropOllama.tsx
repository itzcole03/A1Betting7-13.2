import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import Message from './Message';

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
  const [modelHealth, setModelHealth] = useState<Record<string, any>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const inputEl = document.getElementById('propollama-input');
    if (inputEl) (inputEl as HTMLInputElement).focus();
    // Fetch available models
    fetch('/api/propollama/models')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.models)) {
          setModels(data.models);
          setSelectedModel(data.models[0] || '');
        }
      });
    // Fetch model health
    fetch('/api/propollama/model_health')
      .then(res => res.json())
      .then(data => {
        if (data.model_health) setModelHealth(data.model_health);
      });
  }, []);

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
      // Build payload: send message, context, and selected model
      const payload: any = { message: userMessage.content };
      if (selectedModel) payload.model = selectedModel;
      // If you want to add context, do it here as a dictionary
      // Example: payload.context = { topic: 'sports_betting_analysis' };
      const jsonString = JSON.stringify(payload);
      console.log('[PropOllama] Sending JSON:', jsonString);
      const response = await fetch('/api/propollama/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonString,
      });
      if (!response.ok) {
        let backendError = '';
        try {
          backendError = await response.text();
        } catch {}
        let errorMsg = `HTTP ${response.status}`;
        try {
          const errJson = JSON.parse(backendError);
          if (errJson?.detail) {
            if (typeof errJson.detail === 'string') {
              errorMsg += `: ${errJson.detail}`;
            } else if (typeof errJson.detail === 'object') {
              if (errJson.detail.message) errorMsg += `: ${errJson.detail.message}`;
              if (errJson.detail.trace) errorMsg += `\nTrace: ${errJson.detail.trace}`;
            } else if (Array.isArray(errJson.detail)) {
              errorMsg += `: ${errJson.detail
                .map((d: any) => d?.msg || JSON.stringify(d))
                .join(', ')}`;
            }
          }
        } catch {
          errorMsg += `: ${backendError}`;
        }
        console.error('[PropOllama] Backend error response:', errorMsg);
        setError(errorMsg);
        return;
      }
      // Health check logic (in scope for button)
      const checkHealth = async () => {
        try {
          const res = await fetch('/api/propollama/health');
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          setError(null);
          alert(`PropOllama API Health: ${data.status} - ${data.message}`);
        } catch (err: any) {
          setError(`Health check failed: ${err.message}`);
        }
      };

      // Streaming response handling (if backend supports it)
      const reader = response.body?.getReader();
      let aiMessage: PropOllamaMessage = {
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-ai`,
        type: 'ai',
        content: '',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      let done = false;
      while (reader && !done) {
        const { value, done: streamDone } = await reader.read();
        if (value) {
          const chunk = new TextDecoder().decode(value);
          aiMessage = { ...aiMessage, content: aiMessage.content + chunk };
          setMessages(prev => prev.map(m => (m.id === aiMessage.id ? aiMessage : m)));
        }
        done = streamDone;
      }
    } catch (err: any) {
      console.error('[PropOllama] Error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
                {selectedModel && modelHealth[selectedModel] && (
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
      <div
        className='flex-1 overflow-y-auto p-6 space-y-4'
        aria-live='polite'
        aria-atomic='false'
        role='list'
        aria-label='Chat message history'
      >
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Message
                message={message}
                variant={variant}
                onSuggestionClick={handleSuggestionClick}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='flex justify-start'
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
          <div className='mt-2 text-red-500 text-sm' role='alert' aria-live='assertive'>
            <strong>Error:</strong> {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Input */}
      <div
        className={`p-6 border-t ${
          variant === 'cyber' ? 'border-cyan-400/30' : 'border-gray-200 dark:border-gray-700'
        }`}
      >
        <form
          className='flex space-x-4'
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          aria-label='Send message form'
        >
          <input
            id='propollama-input'
            type='text'
            value={input}
            onChange={e => {
              setInput(e.target.value);
              if (error) setError(null);
            }}
            placeholder='Ask me about props, spreads, strategy, or anything betting related...'
            className={`flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all ${
              variant === 'cyber'
                ? 'bg-gray-900/50 border-cyan-400/30 text-cyan-300 placeholder-cyan-400/50 focus:ring-cyan-400/50'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-blue-500'
            }`}
            disabled={isLoading}
            aria-label='Type your message'
            autoComplete='off'
            required
            aria-invalid={!!error}
            aria-describedby='propollama-input-desc'
          />
          <span id='propollama-input-desc' className='sr-only'>
            Enter your message and press Send or Enter to chat with PropOllama AI.
          </span>
          <button
            type='submit'
            disabled={!input.trim() || isLoading}
            className={`px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
              variant === 'cyber'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:from-cyan-300 hover:to-blue-400'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-400 hover:to-purple-500'
            }`}
            aria-label='Send message'
          >
            {isLoading ? 'Analyzing...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};
export default PropOllama;
