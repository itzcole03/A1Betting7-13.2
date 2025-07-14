import React from 'react';
import { motion } from 'framer-motion';

interface HolographicTextProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  intensity?: 'low' | 'medium' | 'high' | 'extreme';
  animate?: boolean;
  glow?: boolean;
}

export const HolographicText: React.FC<HolographicTextProps> = ({
  children,
  size = 'md',
  className = '',
  intensity = 'medium',
  animate = true,
  glow = true,
}) => {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
  };

  const intensityConfig = {
    low: {
      gradient: 'from-cyan-200 via-blue-300 to-purple-200',
      shadow: 'drop-shadow-sm',
      blur: '0 0 10px rgba(59, 130, 246, 0.3)',
    },
    medium: {
      gradient: 'from-cyan-300 via-blue-400 to-purple-400',
      shadow: 'drop-shadow-md',
      blur: '0 0 20px rgba(59, 130, 246, 0.5)',
    },
    high: {
      gradient: 'from-cyan-400 via-blue-500 to-purple-500',
      shadow: 'drop-shadow-lg',
      blur: '0 0 30px rgba(59, 130, 246, 0.7)',
    },
    extreme: {
      gradient: 'from-cyan-500 via-blue-600 to-purple-600',
      shadow: 'drop-shadow-xl',
      blur: '0 0 50px rgba(59, 130, 246, 0.9)',
    },
  };

  const config = intensityConfig[intensity];

  const textVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
    glow: {
      textShadow: [
        '0 0 7px rgb(255 255 255 / 80%)',
        '0 0 10px rgb(59 130 246 / 60%)',
        '0 0 21px rgb(59 130 246 / 40%)',
        '0 0 42px rgb(59 130 246 / 20%)',
      ].join(', '),
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: 'reverse' as const,
      },
    },
  };

  const baseClasses = `
    bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent 
    font-bold ${sizeClasses[size]} ${config.shadow}
    ${className}
  `;

  const styles = glow
    ? {
        filter: config.blur,
      }
    : {};

  if (animate) {
    return (
      <motion.span
        className={baseClasses}
        style={styles}
        variants={textVariants}
        initial='hidden'
        animate={glow ? 'glow' : 'visible'}
      >
        {children}
      </motion.span>
    );
  }

  return (
    <span className={baseClasses} style={styles}>
      {children}
    </span>
  );
};

export default HolographicText;
