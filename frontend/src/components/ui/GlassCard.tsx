import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'frosted' | 'crystal' | 'hologram' | 'neon';
  blur?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  opacity?: number;
  border?: boolean;
  shadow?: boolean;
  animate?: boolean;
  hover?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  variant = 'default',
  blur = 'md',
  opacity = 0.1,
  border = true,
  shadow = true,
  animate = true,
  hover = true,
}) => {
  const blurClasses = {
    none: '',
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  };

  const variantConfig = {
    default: {
      background: `rgba(255, 255, 255, ${opacity})`,
      border: 'border-white/20',
      shadow: 'shadow-lg',
      backdrop: blurClasses[blur],
    },
    frosted: {
      background: `rgba(255, 255, 255, ${opacity * 0.8})`,
      border: 'border-white/30',
      shadow: 'shadow-xl',
      backdrop: `${blurClasses[blur]} backdrop-saturate-150`,
    },
    crystal: {
      background: `linear-gradient(135deg, rgba(255, 255, 255, ${opacity * 1.2}) 0%, rgba(255, 255, 255, ${opacity * 0.8}) 100%)`,
      border: 'border-white/40',
      shadow: 'shadow-2xl',
      backdrop: `${blurClasses[blur]} backdrop-brightness-110`,
    },
    hologram: {
      background: `linear-gradient(135deg, rgba(34, 211, 238, ${opacity}) 0%, rgba(168, 85, 247, ${opacity}) 50%, rgba(236, 72, 153, ${opacity}) 100%)`,
      border: 'border-cyan-400/30',
      shadow: 'shadow-cyan-500/25',
      backdrop: blurClasses[blur],
    },
    neon: {
      background: `rgba(0, 255, 255, ${opacity * 0.6})`,
      border: 'border-cyan-400/50',
      shadow: 'shadow-cyan-500/50',
      backdrop: `${blurClasses[blur]} backdrop-hue-rotate-180`,
    },
  };

  const config = variantConfig[variant];

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
      rotateX: -10,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
    hover: hover
      ? {
          y: -5,
          scale: 1.02,
          rotateX: 5,
          transition: {
            duration: 0.3,
            ease: 'easeOut',
          },
        }
      : {},
  };

  const baseClasses = `
    relative rounded-xl p-6 overflow-hidden
    ${config.backdrop}
    ${border ? config.border + ' border' : ''}
    ${shadow ? config.shadow : ''}
    transition-all duration-300
    ${className}
  `;

  const backgroundStyle =
    variant === 'crystal' || variant === 'hologram'
      ? { backgroundImage: config.background }
      : { backgroundColor: config.background };

  return (
    <motion.div
      className={baseClasses}
      style={{
        ...backgroundStyle,
        transform: 'translateZ(0)', // Force hardware acceleration
      }}
      variants={cardVariants}
      initial={animate ? 'hidden' : 'visible'}
      animate='visible'
      whileHover={hover ? 'hover' : undefined}
    >
      {/* Noise texture overlay */}
      <div
        className='absolute inset-0 opacity-5 mix-blend-overlay'
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Gradient overlay for depth */}
      <div
        className='absolute inset-0 opacity-20'
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
        }}
      />

      {/* Animated light reflection */}
      <div className='absolute inset-0 overflow-hidden rounded-xl'>
        <motion.div
          className='absolute -top-full -left-full w-full h-full bg-gradient-to-br from-white/20 via-transparent to-transparent rotate-45'
          animate={{
            x: ['0%', '200%'],
            y: ['0%', '200%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Content */}
      <div className='relative z-10'>{children}</div>

      {/* Border highlight */}
      {border && (
        <div className='absolute inset-0 rounded-xl'>
          <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300' />
        </div>
      )}

      {/* Corner indicators */}
      <div className='absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-current opacity-20 rounded-tl' />
      <div className='absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-current opacity-20 rounded-tr' />
      <div className='absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-current opacity-20 rounded-bl' />
      <div className='absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-current opacity-20 rounded-br' />
    </motion.div>
  );
};

export default GlassCard;
