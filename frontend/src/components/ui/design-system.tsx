import React, { useState } from 'react';
// @ts-expect-error TS(2307): Cannot find module '@/lib/utils' or its correspond... Remove this comment to see the full error message
import { cn } from '@/lib/utils';

// Import all the components we've created
// @ts-expect-error TS(6142): Module './button' was resolved to 'C:/Users/bcmad/... Remove this comment to see the full error message
import { Button } from './button';
// @ts-expect-error TS(6142): Module './badge' was resolved to 'C:/Users/bcmad/D... Remove this comment to see the full error message
import { Badge } from './badge';
// @ts-expect-error TS(6142): Module './card' was resolved to 'C:/Users/bcmad/Do... Remove this comment to see the full error message
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
// @ts-expect-error TS(6142): Module './input' was resolved to 'C:/Users/bcmad/D... Remove this comment to see the full error message
import { Input } from './input';
// @ts-expect-error TS(6142): Module './label' was resolved to 'C:/Users/bcmad/D... Remove this comment to see the full error message
import { Label } from './label';
// @ts-expect-error TS(6142): Module './tabs' was resolved to 'C:/Users/bcmad/Do... Remove this comment to see the full error message
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
// @ts-expect-error TS(6142): Module './select' was resolved to 'C:/Users/bcmad/... Remove this comment to see the full error message
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
// @ts-expect-error TS(6142): Module './progress' was resolved to 'C:/Users/bcma... Remove this comment to see the full error message
import { Progress } from './progress';
// @ts-expect-error TS(6142): Module './slider' was resolved to 'C:/Users/bcmad/... Remove this comment to see the full error message
import { Slider } from './slider';
// @ts-expect-error TS(6142): Module './alert' was resolved to 'C:/Users/bcmad/D... Remove this comment to see the full error message
import { Alert } from './alert';
// @ts-expect-error TS(6142): Module './HolographicText' was resolved to 'C:/Use... Remove this comment to see the full error message
import { HolographicText } from './HolographicText';
// @ts-expect-error TS(6142): Module './CyberButton' was resolved to 'C:/Users/b... Remove this comment to see the full error message
import { CyberButton } from './CyberButton';
// @ts-expect-error TS(6142): Module './GlowCard' was resolved to 'C:/Users/bcma... Remove this comment to see the full error message
import { GlowCard } from './GlowCard';
// @ts-expect-error TS(6142): Module './GlassCard' was resolved to 'C:/Users/bcm... Remove this comment to see the full error message
import { GlassCard } from './GlassCard';
// @ts-expect-error TS(6142): Module './LoadingWave' was resolved to 'C:/Users/b... Remove this comment to see the full error message
import { LoadingWave, LoadingSpinner, LoadingPulse } from './LoadingWave';
// @ts-expect-error TS(6142): Module './ParticleField' was resolved to 'C:/Users... Remove this comment to see the full error message
import { ParticleField } from './ParticleField';
// @ts-expect-error TS(6142): Module './Skeleton' was resolved to 'C:/Users/bcma... Remove this comment to see the full error message
import { Skeleton } from './Skeleton';
// @ts-expect-error TS(6142): Module './LoadingOverlay' was resolved to 'C:/User... Remove this comment to see the full error message
import { LoadingOverlay } from './LoadingOverlay';
// @ts-expect-error TS(6142): Module './MetricCard' was resolved to 'C:/Users/bc... Remove this comment to see the full error message
import { MetricCard } from './MetricCard';
// @ts-expect-error TS(6142): Module './StatusIndicator' was resolved to 'C:/Use... Remove this comment to see the full error message
import { StatusIndicator } from './StatusIndicator';
// @ts-expect-error TS(6142): Module './GlowButton' was resolved to 'C:/Users/bc... Remove this comment to see the full error message
import { GlowButton } from './GlowButton';

// Types for design system
interface ComponentExample {
  id: string;
  name: string;
  category: string;
  description: string;
  component: React.ReactNode;
  code?: string;
  props?: Record<string, any>;
}

interface DesignSystemProps {
  variant?: 'default' | 'cyber' | 'showcase';
  showCode?: boolean;
  interactive?: boolean;
  className?: string;
}

const componentExamples: ComponentExample[] = [
  {
    id: 'button-basic',
    name: 'Button',
    category: 'Core',
    description: 'Basic button component with multiple variants',
    component: (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='space-x-2'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Button variant='default'>Default</Button>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Button variant='destructive'>Destructive</Button>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Button variant='outline'>Outline</Button>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Button variant='secondary'>Secondary</Button>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Button variant='ghost'>Ghost</Button>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Button variant='link'>Link</Button>
      </div>
    ),
  },
  {
    id: 'cyber-button',
    name: 'CyberButton',
    category: 'Enhanced',
    description: 'Futuristic button with glow effects and animations',
    component: (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='space-x-2'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <CyberButton variant='primary' animated>
          Primary Cyber
        </CyberButton>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <CyberButton variant='secondary' glowing>
          Secondary Glow
        </CyberButton>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <CyberButton variant='outline' pulsing>
          Outline Pulse
        </CyberButton>
      </div>
    ),
  },
  {
    id: 'glow-button',
    name: 'GlowButton',
    category: 'Enhanced',
    description: 'Button with customizable glow effects',
    component: (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='space-x-2'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <GlowButton variant='cyber' glowIntensity='intense' animated>
          Cyber Glow
        </GlowButton>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <GlowButton variant='neon' glowIntensity='medium'>
          Neon Style
        </GlowButton>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <GlowButton variant='quantum' glowIntensity='extreme'>
          Quantum
        </GlowButton>
      </div>
    ),
  },
  {
    id: 'badge',
    name: 'Badge',
    category: 'Core',
    description: 'Small status and labeling component',
    component: (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='space-x-2'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Badge variant='default'>Default</Badge>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Badge variant='secondary'>Secondary</Badge>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Badge variant='destructive'>Destructive</Badge>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Badge variant='outline'>Outline</Badge>
      </div>
    ),
  },
  {
    id: 'input',
    name: 'Input',
    category: 'Core',
    description: 'Input field with multiple variants and features',
    component: (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='space-y-2 max-w-sm'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Input placeholder='Default input' />
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Input variant='cyber' placeholder='Cyber variant' />
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Input variant='glass' placeholder='Glass variant' />
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Input type='password' placeholder='Password' showPasswordToggle />
      </div>
    ),
  },
  {
    id: 'progress',
    name: 'Progress',
    category: 'Core',
    description: 'Progress indicator with multiple styles',
    component: (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='space-y-4 max-w-sm'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Progress value={33} variant='default' showLabel />
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Progress value={66} variant='cyber' showLabel />
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Progress value={80} variant='gradient' color='green' showLabel />
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Progress value={25} variant='pulse' color='red' showLabel />
      </div>
    ),
  },
  {
    id: 'alert',
    name: 'Alert',
    category: 'Core',
    description: 'Alert messages with different severity levels',
    component: (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='space-y-2 max-w-md'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Alert variant='default'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='font-medium'>Default Alert</div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-sm'>This is a default alert message.</div>
        </Alert>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Alert variant='cyber'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='font-medium'>Cyber Alert</div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-sm'>Futuristic alert with cyber styling.</div>
        </Alert>
      </div>
    ),
  },
  {
    id: 'holographic-text',
    name: 'HolographicText',
    category: 'Enhanced',
    description: 'Text with holographic visual effects',
    component: (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='space-y-2'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <HolographicText size='lg' intensity='medium'>
          Holographic Text Effect
        </HolographicText>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <HolographicText size='xl' intensity='high' animated>
          Animated Hologram
        </HolographicText>
      </div>
    ),
  },
  {
    id: 'cards',
    name: 'Cards',
    category: 'Enhanced',
    description: 'Enhanced card components with special effects',
    component: (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <GlowCard variant='default'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <CardHeader>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <CardTitle>Glow Card</CardTitle>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <CardDescription>Card with glow effects</CardDescription>
          </CardHeader>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <CardContent>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p className='text-sm'>This card has a subtle glow effect around the edges.</p>
          </CardContent>
        </GlowCard>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <GlassCard variant='frosted'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <CardHeader>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <CardTitle>Glass Card</CardTitle>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <CardDescription>Glassmorphism design</CardDescription>
          </CardHeader>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <CardContent>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p className='text-sm'>This card uses glassmorphism design principles.</p>
          </CardContent>
        </GlassCard>
      </div>
    ),
  },
  {
    id: 'loading',
    name: 'Loading Components',
    category: 'Enhanced',
    description: 'Various loading animations and indicators',
    component: (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid grid-cols-3 gap-4 max-w-md'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex flex-col items-center space-y-2'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <LoadingWave size='md' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <span className='text-xs'>Wave</span>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex flex-col items-center space-y-2'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <LoadingSpinner size='md' variant='cyber' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <span className='text-xs'>Spinner</span>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex flex-col items-center space-y-2'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <LoadingPulse size='md' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <span className='text-xs'>Pulse</span>
        </div>
      </div>
    ),
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    category: 'Enhanced',
    description: 'Loading skeletons with multiple variants',
    component: (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='space-y-4 max-w-md'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Skeleton variant='default' className='h-4 w-full' />
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Skeleton variant='cyber' className='h-4 w-3/4' />
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Skeleton variant='pulse' shape='circle' className='w-12 h-12' />
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='space-y-2'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Skeleton variant='wave' className='h-4 w-full' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Skeleton variant='wave' className='h-4 w-5/6' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Skeleton variant='wave' className='h-4 w-4/6' />
        </div>
      </div>
    ),
  },
  {
    id: 'status-indicator',
    name: 'StatusIndicator',
    category: 'Core',
    description: 'Status indicators with multiple states',
    component: (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='space-y-3'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <StatusIndicator status='online' variant='default' showLabel />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <StatusIndicator status='busy' variant='default' showLabel />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <StatusIndicator status='offline' variant='default' showLabel />
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <StatusIndicator status='success' variant='cyber' showLabel />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <StatusIndicator status='warning' variant='cyber' showLabel />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <StatusIndicator status='error' variant='cyber' showLabel />
        </div>
      </div>
    ),
  },
  {
    id: 'metric-card',
    name: 'MetricCard',
    category: 'Enhanced',
    description: 'Cards for displaying metrics and data',
    component: (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <MetricCard
          title='Total Revenue'
          value='$12,345'
          // @ts-expect-error TS(2322): Type 'number' is not assignable to type '{ value: ... Remove this comment to see the full error message
          change={15.2}
          // @ts-expect-error TS(2322): Type 'string' is not assignable to type '{ value: ... Remove this comment to see the full error message
          trend='up'
          variant='default'
        />
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <MetricCard
          title='Active Users'
          value='1,234'
          // @ts-expect-error TS(2322): Type 'number' is not assignable to type '{ value: ... Remove this comment to see the full error message
          change={-5.1}
          // @ts-expect-error TS(2322): Type 'string' is not assignable to type '{ value: ... Remove this comment to see the full error message
          trend='down'
          variant='cyber'
          loading={false}
        />
      </div>
    ),
  },
];

const categories = Array.from(new Set(componentExamples.map(ex => ex.category)));

const DesignSystem: React.FC<DesignSystemProps> = ({
  variant = 'default',
  showCode = false,
  interactive = true,
  className,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const filteredExamples = componentExamples.filter(example => {
    const matchesCategory = selectedCategory === 'All' || example.category === selectedCategory;
    const matchesSearch =
      example.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      example.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const variantClasses = {
    default: 'bg-white',
    cyber: 'bg-slate-900 text-cyan-300',
    showcase: 'bg-gradient-to-br from-white to-gray-50',
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div
      className={cn(
        'min-h-screen transition-all duration-300',
        variantClasses[variant],
        isDarkMode && 'dark',
        className
      )}
    >
      {/* Header */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn(
          'border-b p-6',
          variant === 'cyber' ? 'border-cyan-500/30 bg-slate-800/50' : 'border-gray-200 bg-white'
        )}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='max-w-7xl mx-auto'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-between'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h1
                className={cn(
                  'text-3xl font-bold',
                  variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                )}
              >
                {variant === 'cyber' ? (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <HolographicText size='xl' intensity='medium'>
                    A1 Design System
                  </HolographicText>
                ) : (
                  'A1 Design System'
                )}
              </h1>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <p
                className={cn(
                  'text-lg mt-2',
                  variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600'
                )}
              >
                Comprehensive UI components for the A1 Betting Platform
              </p>
            </div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-3'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Button
                variant='outline'
                onClick={() => setIsDarkMode(!isDarkMode)}
                className='flex items-center space-x-2'
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span>{isDarkMode ? '☀️' : '🌙'}</span>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span>{isDarkMode ? 'Light' : 'Dark'}</span>
              </Button>

              {variant !== 'cyber' && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CyberButton variant='primary' animated onClick={() => window.location.reload()}>
                  Cyber Mode
                </CyberButton>
              )}
            </div>
          </div>

          {/* Search and Filter */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='mt-6 flex flex-col sm:flex-row gap-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex-1'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Input
                placeholder='Search components...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                variant={variant === 'cyber' ? 'cyber' : 'default'}
              />
            </div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex space-x-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Button
                variant={selectedCategory === 'All' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('All')}
                size='sm'
              >
                All
              </Button>
              {categories.map(category => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                  size='sm'
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='max-w-7xl mx-auto p-6'>
        {/* Stats */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <MetricCard
            title='Total Components'
            value={componentExamples.length.toString()}
            variant={variant === 'cyber' ? 'cyber' : 'default'}
          />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <MetricCard
            title='Categories'
            value={categories.length.toString()}
            variant={variant === 'cyber' ? 'cyber' : 'default'}
          />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <MetricCard
            title='Enhanced Components'
            value={componentExamples.filter(ex => ex.category === 'Enhanced').length.toString()}
            variant={variant === 'cyber' ? 'cyber' : 'default'}
          />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <MetricCard
            title='Core Components'
            value={componentExamples.filter(ex => ex.category === 'Core').length.toString()}
            variant={variant === 'cyber' ? 'cyber' : 'default'}
          />
        </div>

        {/* Component Grid */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {filteredExamples.map(example => (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Card
              key={example.id}
              className={cn(
                'overflow-hidden transition-all duration-200 hover:shadow-lg',
                variant === 'cyber' && 'border-cyan-500/30 bg-slate-800/50'
              )}
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <CardHeader>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-center justify-between'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CardTitle
                    className={cn(variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900')}
                  >
                    {example.name}
                  </CardTitle>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Badge variant={example.category === 'Enhanced' ? 'default' : 'secondary'}>
                    {example.category}
                  </Badge>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardDescription
                  className={cn(variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600')}
                >
                  {example.description}
                </CardDescription>
              </CardHeader>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <CardContent>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div
                  className={cn(
                    'p-4 rounded-lg border min-h-24 flex items-center justify-center',
                    variant === 'cyber'
                      ? 'border-cyan-500/20 bg-slate-900/50'
                      : 'border-gray-200 bg-gray-50'
                  )}
                >
                  {example.component}
                </div>
              </CardContent>

              {showCode && example.code && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CardFooter>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <pre
                    className={cn(
                      'text-xs p-3 rounded border w-full overflow-x-auto',
                      variant === 'cyber'
                        ? 'border-cyan-500/20 bg-slate-900 text-cyan-400'
                        : 'border-gray-200 bg-gray-100 text-gray-800'
                    )}
                  >
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <code>{example.code}</code>
                  </pre>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>

        {/* Color Palette Section */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='mt-12'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h2
            className={cn(
              'text-2xl font-bold mb-6',
              variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
            )}
          >
            Color Palette
          </h2>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4'>
            {[
              { name: 'Primary', color: 'bg-blue-500', text: 'text-white' },
              { name: 'Secondary', color: 'bg-gray-500', text: 'text-white' },
              { name: 'Success', color: 'bg-green-500', text: 'text-white' },
              { name: 'Warning', color: 'bg-yellow-500', text: 'text-black' },
              { name: 'Error', color: 'bg-red-500', text: 'text-white' },
              { name: 'Cyber', color: 'bg-cyan-500', text: 'text-black' },
              { name: 'Neon', color: 'bg-pink-500', text: 'text-white' },
              { name: 'Quantum', color: 'bg-purple-500', text: 'text-white' },
            ].map(colorInfo => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div key={colorInfo.name} className='text-center'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div
                  className={cn(
                    'h-16 rounded-lg mb-2 flex items-center justify-center',
                    colorInfo.color,
                    colorInfo.text
                  )}
                >
                  {colorInfo.name}
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div
                  className={cn('text-xs', variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600')}
                >
                  {colorInfo.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Typography Section */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='mt-12'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h2
            className={cn(
              'text-2xl font-bold mb-6',
              variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
            )}
          >
            Typography
          </h2>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-4'>
            {[
              {
                name: 'Heading 1',
                class: 'text-4xl font-bold',
                text: 'The quick brown fox jumps over the lazy dog',
              },
              {
                name: 'Heading 2',
                class: 'text-3xl font-bold',
                text: 'The quick brown fox jumps over the lazy dog',
              },
              {
                name: 'Heading 3',
                class: 'text-2xl font-bold',
                text: 'The quick brown fox jumps over the lazy dog',
              },
              {
                name: 'Body Large',
                class: 'text-lg',
                text: 'The quick brown fox jumps over the lazy dog',
              },
              {
                name: 'Body',
                class: 'text-base',
                text: 'The quick brown fox jumps over the lazy dog',
              },
              {
                name: 'Body Small',
                class: 'text-sm',
                text: 'The quick brown fox jumps over the lazy dog',
              },
              {
                name: 'Caption',
                class: 'text-xs',
                text: 'The quick brown fox jumps over the lazy dog',
              },
            ].map(typo => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div key={typo.name} className='flex items-center space-x-4'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div
                  className={cn(
                    'w-24 text-xs',
                    variant === 'cyber' ? 'text-cyan-400' : 'text-gray-500'
                  )}
                >
                  {typo.name}
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div
                  className={cn(
                    typo.class,
                    variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                  )}
                >
                  {typo.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Background Effects for Cyber Variant */}
      {variant === 'cyber' && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <ParticleField
            variant='cyber'
            density='medium'
            className='fixed inset-0 pointer-events-none z-0'
          />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='fixed inset-0 bg-grid-white/[0.02] pointer-events-none z-0' />
        </>
      )}
    </div>
  );
};

export default DesignSystem;
