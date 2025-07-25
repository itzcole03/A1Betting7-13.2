﻿import React, { ReactNode } from 'react.ts';

interface GlassCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  glowing?: boolean;
  animated?: boolean;
  neonColor?: string;
}

declare const _GlassCard: React.FC<GlassCardProps>;
export default GlassCard;
