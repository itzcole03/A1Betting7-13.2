/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    screens: {
      xs: '475px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        cyber: ['Orbitron', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        electric: {
          400: '#06ffa5',
          500: '#00ff88',
          600: '#00e676',
        },
        cyber: {
          primary: '#06ffa5',
          secondary: '#00ff88',
          accent: '#00d4ff',
          purple: '#7c3aed',
          dark: '#0f172a',
          darker: '#020617',
          glass: 'rgba(255, 255, 255, 0.02)',
          border: 'rgba(255, 255, 255, 0.05)',
        },
        neon: {
          pink: '#ff10f0',
          purple: '#7c3aed',
          blue: '#00d4ff',
          green: '#39ff14',
          orange: '#ff6b35',
          cyan: '#00fff9',
        },
        quantum: {
          100: '#f0f9ff',
          200: '#e0f2fe',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        float: 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite alternate',
        'slide-in-up': 'slide-in-up 0.6s ease-out',
        'slide-in-right': 'slide-in-right 0.6s ease-out',
        'cyber-pulse': 'cyber-pulse 3s ease-in-out infinite',
        'data-flow': 'data-flow 20s linear infinite',
        'quantum-spin': 'quantum-spin 8s linear infinite',
        'neural-pulse': 'neural-pulse 4s ease-in-out infinite',
        'matrix-rain': 'matrix-rain 15s linear infinite',
        'hologram-flicker': 'hologram-flicker 2s ease-in-out infinite',
        'energy-wave': 'energy-wave 3s ease-in-out infinite',
      },
      boxShadow: {
        neon: '0 0 20px rgba(0,255,136,0.6), 0 0 40px rgba(0,255,136,0.4)',
        'neon-pink': '0 0 20px rgba(255,16,240,0.6), 0 0 40px rgba(255,16,240,0.4)',
        'neon-blue': '0 0 20px rgba(0,212,255,0.6), 0 0 40px rgba(0,212,255,0.4)',
        'neon-purple': '0 0 20px rgba(124,58,237,0.6), 0 0 40px rgba(124,58,237,0.4)',
        glass: '0 8px 32px rgba(31,38,135,0.37), inset 0 1px 0 rgba(255,255,255,0.1)',
        quantum: '0 0 30px rgba(14,165,233,0.5), 0 0 60px rgba(14,165,233,0.3)',
      },
      backgroundImage: {
        'quantum-grid':
          'radial-gradient(circle at 1px 1px, rgba(0,255,136,0.15) 1px, transparent 0)',
        'neural-network':
          "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300ff88' fill-opacity='0.1'%3E%3Ccircle cx='10' cy='10' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'cyber-gradient': 'linear-gradient(135deg, #020617 0%, #1a1b3e 50%, #0f172a 100%)',
        'cyber-glass':
          'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%)',
      },
      backdropBlur: {
        xs: '2px',
        '4xl': '80px',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'glow-pulse': {
          '0%': { boxShadow: '0 0 20px rgba(0,255,136,0.4)' },
          '100%': { boxShadow: '0 0 40px rgba(0,255,136,0.8)' },
        },
        'slide-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'cyber-pulse': {
          '0%, 100%': { textShadow: '0 0 10px rgba(0,255,136,0.8)' },
          '50%': {
            textShadow: '0 0 20px rgba(0,255,136,1), 0 0 30px rgba(0,255,136,0.8)',
          },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
