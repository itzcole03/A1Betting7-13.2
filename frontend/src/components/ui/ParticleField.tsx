import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

interface ParticleFieldProps {
  variant?: 'default' | 'cyber' | 'quantum' | 'matrix' | 'stars';
  density?: 'low' | 'medium' | 'high';
  speed?: 'slow' | 'medium' | 'fast';
  interactive?: boolean;
  className?: string;
}

export const ParticleField: React.FC<ParticleFieldProps> = ({
  variant = 'default',
  density = 'medium',
  speed = 'medium',
  interactive = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });

  const config = {
    default: {
      colors: ['#3b82f6', '#8b5cf6', '#06b6d4'],
      particleCount: { low: 30, medium: 50, high: 80 },
      particleSize: [1, 3],
    },
    cyber: {
      colors: ['#00ffff', '#0080ff', '#0040ff'],
      particleCount: { low: 40, medium: 70, high: 100 },
      particleSize: [1, 2],
    },
    quantum: {
      colors: ['#a855f7', '#ec4899', '#8b5cf6'],
      particleCount: { low: 25, medium: 45, high: 70 },
      particleSize: [2, 4],
    },
    matrix: {
      colors: ['#00ff00', '#00cc00', '#009900'],
      particleCount: { low: 60, medium: 100, high: 150 },
      particleSize: [1, 2],
    },
    stars: {
      colors: ['#ffffff', '#f0f0f0', '#e0e0e0'],
      particleCount: { low: 100, medium: 200, high: 300 },
      particleSize: [0.5, 2],
    },
  };

  const speedConfig = {
    slow: 0.5,
    medium: 1,
    fast: 2,
  };

  const currentConfig = config[variant];
  const particleCount = currentConfig.particleCount[density];
  const speedMultiplier = speedConfig[speed];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    const createParticle = (): Particle => {
      const [minSize, maxSize] = currentConfig.particleSize;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * speedMultiplier,
        vy: (Math.random() - 0.5) * speedMultiplier,
        size: Math.random() * (maxSize - minSize) + minSize,
        opacity: Math.random() * 0.8 + 0.2,
        color: currentConfig.colors[Math.floor(Math.random() * currentConfig.colors.length)],
      };
    };

    const initParticles = () => {
      particlesRef.current = Array.from({ length: particleCount }, createParticle);
    };

    const updateParticles = () => {
      particlesRef.current.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Interactive mouse effect
        if (interactive) {
          const dx = mouseRef.current.x - particle.x;
          const dy = mouseRef.current.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            const force = (100 - distance) / 100;
            particle.vx += (dx / distance) * force * 0.01;
            particle.vy += (dy / distance) * force * 0.01;
          }
        }

        // Boundary conditions
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Keep particles in bounds
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));

        // Add some velocity damping
        particle.vx *= 0.99;
        particle.vy *= 0.99;

        // Ensure minimum velocity
        const minVel = speedMultiplier * 0.1;
        if (Math.abs(particle.vx) < minVel) {
          particle.vx = (Math.random() - 0.5) * speedMultiplier;
        }
        if (Math.abs(particle.vy) < minVel) {
          particle.vy = (Math.random() - 0.5) * speedMultiplier;
        }
      });
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections (for cyber and quantum variants)
      if (variant === 'cyber' || variant === 'quantum') {
        ctx.strokeStyle =
          variant === 'cyber' ? 'rgba(0, 255, 255, 0.1)' : 'rgba(168, 85, 247, 0.1)';
        ctx.lineWidth = 1;

        for (let i = 0; i < particlesRef.current.length; i++) {
          for (let j = i + 1; j < particlesRef.current.length; j++) {
            const p1 = particlesRef.current[i];
            const p2 = particlesRef.current[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
              const opacity = ((100 - distance) / 100) * 0.2;
              ctx.globalAlpha = opacity;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }

      // Draw particles
      particlesRef.current.forEach(particle => {
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;

        if (variant === 'stars') {
          // Draw twinkling stars
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();

          // Add cross sparkle
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particle.x - particle.size * 2, particle.y);
          ctx.lineTo(particle.x + particle.size * 2, particle.y);
          ctx.moveTo(particle.x, particle.y - particle.size * 2);
          ctx.lineTo(particle.x, particle.y + particle.size * 2);
          ctx.stroke();
        } else if (variant === 'matrix') {
          // Draw matrix-style characters
          ctx.font = `${particle.size * 8}px monospace`;
          ctx.fillText(Math.random() > 0.5 ? '1' : '0', particle.x, particle.y);
        } else {
          // Draw regular particles
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();

          // Add glow effect
          if (variant === 'quantum') {
            ctx.shadowBlur = 10;
            ctx.shadowColor = particle.color;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      });

      ctx.globalAlpha = 1;
    };

    const animate = () => {
      updateParticles();
      drawParticles();
      animationRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    // Initialize
    resizeCanvas();
    initParticles();
    animate();

    // Event listeners
    window.addEventListener('resize', resizeCanvas);
    if (interactive) {
      canvas.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (interactive) {
        canvas.removeEventListener('mousemove', handleMouseMove);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [variant, density, speed, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default ParticleField;
