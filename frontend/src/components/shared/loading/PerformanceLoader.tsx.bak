import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, Target, Activity } from 'lucide-react';

interface PerformanceLoaderProps {
  message?: string;
  showProgress?: boolean;
  duration?: number;
  size?: 'sm' | 'md' | 'lg';
}

const PerformanceLoader: React.FC<PerformanceLoaderProps> = ({
  message = 'Loading PropFinder Killer...',
  showProgress = false,
  duration = 3000,
  size = 'md',
}) => {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(message);

  const loadingMessages = [
    'Initializing AI engine...',
    'Loading prop database...',
    'Calibrating confidence models...',
    'Analyzing market inefficiencies...',
    'Optimizing performance...',
    'Ready to dominate!',
  ];

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  useEffect(() => {
    if (!showProgress) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + 100 / (duration / 100), 100);
        
        // Update message based on progress
        const messageIndex = Math.floor((newProgress / 100) * (loadingMessages.length - 1));
        setCurrentMessage(loadingMessages[messageIndex] || message);
        
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [showProgress, duration, message]);

  const icons = [Brain, Zap, Target, Activity];

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Main Loader */}
      <div className="relative mb-6">
        {/* Outer Ring */}
        <motion.div
          className={`${sizeClasses[size]} border-4 border-slate-700 rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Inner Ring */}
        <motion.div
          className={`absolute inset-2 border-4 border-cyan-500 rounded-full border-t-transparent border-r-transparent`}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Center Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            {React.createElement(icons[Math.floor(Date.now() / 1000) % icons.length], {
              className: 'w-6 h-6 text-cyan-400'
            })}
          </motion.div>
        </div>

        {/* Particle Effects */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-400 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                transformOrigin: `${20 + size === 'lg' ? 40 : size === 'md' ? 30 : 20}px 0`,
              }}
              animate={{
                rotate: [0, 360],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      </div>

      {/* Loading Message */}
      <motion.div
        key={currentMessage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-center mb-4"
      >
        <h3 className="text-lg font-semibold text-white mb-2">
          {currentMessage}
        </h3>
        <p className="text-sm text-gray-400">
          Optimizing for 4x faster performance
        </p>
      </motion.div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="w-64 bg-slate-800 rounded-full h-2 mb-4">
          <motion.div
            className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}

      {/* Performance Stats */}
      <div className="grid grid-cols-3 gap-4 text-center text-xs">
        <div>
          <div className="text-green-400 font-bold">99.9%</div>
          <div className="text-gray-400">Uptime</div>
        </div>
        <div>
          <div className="text-cyan-400 font-bold">&lt;50ms</div>
          <div className="text-gray-400">Response</div>
        </div>
        <div>
          <div className="text-purple-400 font-bold">4x</div>
          <div className="text-gray-400">Faster</div>
        </div>
      </div>

      {/* Pulsing Dots */}
      <div className="flex space-x-1 mt-6">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-cyan-400 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default PerformanceLoader;
