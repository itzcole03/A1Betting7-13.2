import React from 'react';
import { motion } from 'framer-motion';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'cyber' | 'quantum' | 'neon' | 'premium';
  intensity?: 'low' | 'medium' | 'high' | 'extreme';
  animate?: boolean;
  hover?: boolean;
  pulse?: boolean;
}

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = '',
  variant = 'default',
  intensity = 'medium',
  animate = true,
  hover = true,
  pulse = false,
}) => {
  const variantConfig = {
    default: {
      gradient: 'from-slate-800/50 to-slate-900/50',
      border: 'border-slate-700/50',
      glow: 'shadow-[0_0_20px_rgba(148,163,184,0.3)]',
      hoverGlow: 'shadow-[0_0_30px_rgba(148,163,184,0.5)]',
    },
    cyber: {
      gradient: 'from-cyan-900/20 via-slate-800/50 to-blue-900/20',
      border: 'border-cyan-500/30',
      glow: 'shadow-[0_0_25px_rgba(34,211,238,0.4)]',
      hoverGlow: 'shadow-[0_0_40px_rgba(34,211,238,0.6)]',
    },
    quantum: {
      gradient: 'from-purple-900/20 via-slate-800/50 to-indigo-900/20',
      border: 'border-purple-500/30',
      glow: 'shadow-[0_0_30px_rgba(168,85,247,0.4)]',
      hoverGlow: 'shadow-[0_0_50px_rgba(168,85,247,0.6)]',
    },
    neon: {
      gradient: 'from-green-900/20 via-slate-800/50 to-emerald-900/20',
      border: 'border-green-400/30',
      glow: 'shadow-[0_0_25px_rgba(34,197,94,0.4)]',
      hoverGlow: 'shadow-[0_0_40px_rgba(34,197,94,0.6)]',
    },
    premium: {
      gradient: 'from-yellow-900/20 via-slate-800/50 to-orange-900/20',
      border: 'border-yellow-400/30',
      glow: 'shadow-[0_0_30px_rgba(251,191,36,0.4)]',
      hoverGlow: 'shadow-[0_0_50px_rgba(251,191,36,0.6)]',
    },
  };

  const intensityMultiplier = {
    low: 0.5,
    medium: 1,
    high: 1.5,
    extreme: 2,
  };

  const config = variantConfig[variant];
  const multiplier = intensityMultiplier[intensity];

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
      boxShadow: 'none',
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      boxShadow: config.glow,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
    hover: hover
      ? {
          y: -5,
          scale: 1.02,
          boxShadow: config.hoverGlow,
          transition: {
            duration: 0.3,
            ease: 'easeOut',
          },
        }
      : {},
    pulse: {
      scale: [1, 1.02, 1],
      boxShadow: [config.glow, config.hoverGlow, config.glow],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const baseClasses = `
    relative backdrop-blur-lg border rounded-xl p-6
    bg-gradient-to-br ${config.gradient} ${config.border}
    transition-all duration-300
    ${className}
  `;

  return (
    <motion.div
      className={baseClasses}
      variants={cardVariants}
      initial={animate ? 'hidden' : 'visible'}
      animate={pulse ? 'pulse' : 'visible'}
      whileHover={hover ? 'hover' : undefined}
      style={{
        filter: `brightness(${1 + (multiplier - 1) * 0.2})`,
      }}
    >
      {/* Cyber grid pattern overlay */}
      <div className='absolute inset-0 rounded-xl opacity-10'>
        <div
          className='w-full h-full rounded-xl'
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
      </div>

      {/* Animated border glow */}
      <div className='absolute inset-0 rounded-xl overflow-hidden'>
        <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent transform -translate-x-full animate-[shimmer_3s_infinite] duration-1000' />
      </div>

      {/* Content */}
      <div className='relative z-10'>{children}</div>

      {/* Corner accents */}
      <div className='absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-current rounded-tl opacity-30' />
      <div className='absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-current rounded-tr opacity-30' />
      <div className='absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-current rounded-bl opacity-30' />
      <div className='absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-current rounded-br opacity-30' />
    </motion.div>
  );
};

export default GlowCard;
