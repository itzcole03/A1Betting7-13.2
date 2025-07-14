import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'quantum' | 'neon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  glow?: boolean;
  pulse?: boolean;
  children: React.ReactNode;
}

export const CyberButton: React.FC<CyberButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  glow = true,
  pulse = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };

  const variantConfig = {
    primary: {
      gradient: 'from-cyan-500 to-blue-600',
      border: 'border-cyan-400/50',
      shadow: 'shadow-cyan-500/25',
      glow: 'shadow-[0_0_20px_rgba(34,211,238,0.4)]',
      hover: 'hover:from-cyan-400 hover:to-blue-500',
    },
    secondary: {
      gradient: 'from-purple-500 to-pink-600',
      border: 'border-purple-400/50',
      shadow: 'shadow-purple-500/25',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]',
      hover: 'hover:from-purple-400 hover:to-pink-500',
    },
    danger: {
      gradient: 'from-red-500 to-orange-600',
      border: 'border-red-400/50',
      shadow: 'shadow-red-500/25',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]',
      hover: 'hover:from-red-400 hover:to-orange-500',
    },
    success: {
      gradient: 'from-green-500 to-emerald-600',
      border: 'border-green-400/50',
      shadow: 'shadow-green-500/25',
      glow: 'shadow-[0_0_20px_rgba(34,197,94,0.4)]',
      hover: 'hover:from-green-400 hover:to-emerald-500',
    },
    quantum: {
      gradient: 'from-indigo-500 via-purple-500 to-pink-500',
      border: 'border-indigo-400/50',
      shadow: 'shadow-indigo-500/25',
      glow: 'shadow-[0_0_30px_rgba(99,102,241,0.5)]',
      hover: 'hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400',
    },
    neon: {
      gradient: 'from-yellow-400 to-orange-500',
      border: 'border-yellow-400/50',
      shadow: 'shadow-yellow-500/25',
      glow: 'shadow-[0_0_25px_rgba(251,191,36,0.5)]',
      hover: 'hover:from-yellow-300 hover:to-orange-400',
    },
  };

  const config = variantConfig[variant];

  const buttonVariants = {
    idle: {
      scale: 1,
      boxShadow: glow ? config.glow : `0 4px 14px 0 ${config.shadow}`,
    },
    hover: {
      scale: 1.05,
      boxShadow: glow
        ? `0 0 30px ${config.glow.match(/rgba\([^)]+\)/)?.[0] || 'rgba(59,130,246,0.6)'}`
        : `0 8px 25px 0 ${config.shadow}`,
      transition: { duration: 0.2 },
    },
    tap: {
      scale: 0.95,
      transition: { duration: 0.1 },
    },
    pulse: {
      scale: [1, 1.05, 1],
      boxShadow: [
        glow ? config.glow : `0 4px 14px 0 ${config.shadow}`,
        glow
          ? `0 0 40px ${config.glow.match(/rgba\([^)]+\)/)?.[0] || 'rgba(59,130,246,0.8)'}`
          : `0 12px 35px 0 ${config.shadow}`,
        glow ? config.glow : `0 4px 14px 0 ${config.shadow}`,
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const baseClasses = `
    relative overflow-hidden font-semibold rounded-lg border transition-all duration-300
    bg-gradient-to-r ${config.gradient} ${config.border} ${config.hover}
    ${sizeClasses[size]}
    text-white shadow-lg
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
    disabled:opacity-50 disabled:cursor-not-allowed
    ${className}
  `;

  return (
    <motion.button
      className={baseClasses}
      variants={buttonVariants}
      initial='idle'
      animate={pulse && !disabled ? 'pulse' : 'idle'}
      whileHover={!disabled ? 'hover' : undefined}
      whileTap={!disabled ? 'tap' : undefined}
      disabled={disabled || loading}
      {...props}
    >
      {/* Cyber grid overlay */}
      <div className='absolute inset-0 opacity-20'>
        <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000' />
      </div>

      {/* Content */}
      <div className='relative flex items-center justify-center space-x-2'>
        {loading && <Loader2 className='w-4 h-4 animate-spin' />}
        <span>{children}</span>
      </div>

      {/* Animated border */}
      <div className='absolute inset-0 rounded-lg opacity-75'>
        <div className='absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse' />
      </div>
    </motion.button>
  );
};

export default CyberButton;
