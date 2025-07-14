import React, { useState } from 'react';
import { cn } from '@/lib/utils';

// Import all the components we've created
import { Button } from './button';
import { Badge } from './badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import { Input } from './input';
import { Label } from './label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Progress } from './progress';
import { Slider } from './slider';
import { Alert } from './alert';
import { HolographicText } from './HolographicText';
import { CyberButton } from './CyberButton';
import { GlowCard } from './GlowCard';
import { GlassCard } from './GlassCard';
import { LoadingWave, LoadingSpinner, LoadingPulse } from './LoadingWave';
import { ParticleField } from './ParticleField';
import { Skeleton } from './Skeleton';
import { LoadingOverlay } from './LoadingOverlay';
import { MetricCard } from './MetricCard';
import { StatusIndicator } from './StatusIndicator';
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
      <div className='space-x-2'>
        <Button variant='default'>Default</Button>
        <Button variant='destructive'>Destructive</Button>
        <Button variant='outline'>Outline</Button>
        <Button variant='secondary'>Secondary</Button>
        <Button variant='ghost'>Ghost</Button>
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
      <div className='space-x-2'>
        <CyberButton variant='primary' animated>
          Primary Cyber
        </CyberButton>
        <CyberButton variant='secondary' glowing>
          Secondary Glow
        </CyberButton>
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
      <div className='space-x-2'>
        <GlowButton variant='cyber' glowIntensity='intense' animated>
          Cyber Glow
        </GlowButton>
        <GlowButton variant='neon' glowIntensity='medium'>
          Neon Style
        </GlowButton>
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
      <div className='space-x-2'>
        <Badge variant='default'>Default</Badge>
        <Badge variant='secondary'>Secondary</Badge>
        <Badge variant='destructive'>Destructive</Badge>
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
      <div className='space-y-2 max-w-sm'>
        <Input placeholder='Default input' />
        <Input variant='cyber' placeholder='Cyber variant' />
        <Input variant='glass' placeholder='Glass variant' />
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
      <div className='space-y-4 max-w-sm'>
        <Progress value={33} variant='default' showLabel />
        <Progress value={66} variant='cyber' showLabel />
        <Progress value={80} variant='gradient' color='green' showLabel />
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
      <div className='space-y-2 max-w-md'>
        <Alert variant='default'>
          <div className='font-medium'>Default Alert</div>
          <div className='text-sm'>This is a default alert message.</div>
        </Alert>
        <Alert variant='cyber'>
          <div className='font-medium'>Cyber Alert</div>
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
      <div className='space-y-2'>
        <HolographicText size='lg' intensity='medium'>
          Holographic Text Effect
        </HolographicText>
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
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl'>
        <GlowCard variant='default'>
          <CardHeader>
            <CardTitle>Glow Card</CardTitle>
            <CardDescription>Card with glow effects</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm'>This card has a subtle glow effect around the edges.</p>
          </CardContent>
        </GlowCard>

        <GlassCard variant='frosted'>
          <CardHeader>
            <CardTitle>Glass Card</CardTitle>
            <CardDescription>Glassmorphism design</CardDescription>
          </CardHeader>
          <CardContent>
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
      <div className='grid grid-cols-3 gap-4 max-w-md'>
        <div className='flex flex-col items-center space-y-2'>
          <LoadingWave size='md' />
          <span className='text-xs'>Wave</span>
        </div>
        <div className='flex flex-col items-center space-y-2'>
          <LoadingSpinner size='md' variant='cyber' />
          <span className='text-xs'>Spinner</span>
        </div>
        <div className='flex flex-col items-center space-y-2'>
          <LoadingPulse size='md' />
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
      <div className='space-y-4 max-w-md'>
        <Skeleton variant='default' className='h-4 w-full' />
        <Skeleton variant='cyber' className='h-4 w-3/4' />
        <Skeleton variant='pulse' shape='circle' className='w-12 h-12' />
        <div className='space-y-2'>
          <Skeleton variant='wave' className='h-4 w-full' />
          <Skeleton variant='wave' className='h-4 w-5/6' />
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
      <div className='space-y-3'>
        <div className='flex items-center space-x-4'>
          <StatusIndicator status='online' variant='default' showLabel />
          <StatusIndicator status='busy' variant='default' showLabel />
          <StatusIndicator status='offline' variant='default' showLabel />
        </div>
        <div className='flex items-center space-x-4'>
          <StatusIndicator status='success' variant='cyber' showLabel />
          <StatusIndicator status='warning' variant='cyber' showLabel />
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
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl'>
        <MetricCard
          title='Total Revenue'
          value='$12,345'
          change={15.2}
          trend='up'
          variant='default'
        />
        <MetricCard
          title='Active Users'
          value='1,234'
          change={-5.1}
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
    <div
      className={cn(
        'min-h-screen transition-all duration-300',
        variantClasses[variant],
        isDarkMode && 'dark',
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'border-b p-6',
          variant === 'cyber' ? 'border-cyan-500/30 bg-slate-800/50' : 'border-gray-200 bg-white'
        )}
      >
        <div className='max-w-7xl mx-auto'>
          <div className='flex items-center justify-between'>
            <div>
              <h1
                className={cn(
                  'text-3xl font-bold',
                  variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                )}
              >
                {variant === 'cyber' ? (
                  <HolographicText size='xl' intensity='medium'>
                    A1 Design System
                  </HolographicText>
                ) : (
                  'A1 Design System'
                )}
              </h1>
              <p
                className={cn(
                  'text-lg mt-2',
                  variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600'
                )}
              >
                Comprehensive UI components for the A1 Betting Platform
              </p>
            </div>

            <div className='flex items-center space-x-3'>
              <Button
                variant='outline'
                onClick={() => setIsDarkMode(!isDarkMode)}
                className='flex items-center space-x-2'
              >
                <span>{isDarkMode ? '☀️' : '🌙'}</span>
                <span>{isDarkMode ? 'Light' : 'Dark'}</span>
              </Button>

              {variant !== 'cyber' && (
                <CyberButton variant='primary' animated onClick={() => window.location.reload()}>
                  Cyber Mode
                </CyberButton>
              )}
            </div>
          </div>

          {/* Search and Filter */}
          <div className='mt-6 flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <Input
                placeholder='Search components...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                variant={variant === 'cyber' ? 'cyber' : 'default'}
              />
            </div>

            <div className='flex space-x-2'>
              <Button
                variant={selectedCategory === 'All' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('All')}
                size='sm'
              >
                All
              </Button>
              {categories.map(category => (
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
      <div className='max-w-7xl mx-auto p-6'>
        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
          <MetricCard
            title='Total Components'
            value={componentExamples.length.toString()}
            variant={variant === 'cyber' ? 'cyber' : 'default'}
          />
          <MetricCard
            title='Categories'
            value={categories.length.toString()}
            variant={variant === 'cyber' ? 'cyber' : 'default'}
          />
          <MetricCard
            title='Enhanced Components'
            value={componentExamples.filter(ex => ex.category === 'Enhanced').length.toString()}
            variant={variant === 'cyber' ? 'cyber' : 'default'}
          />
          <MetricCard
            title='Core Components'
            value={componentExamples.filter(ex => ex.category === 'Core').length.toString()}
            variant={variant === 'cyber' ? 'cyber' : 'default'}
          />
        </div>

        {/* Component Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {filteredExamples.map(example => (
            <Card
              key={example.id}
              className={cn(
                'overflow-hidden transition-all duration-200 hover:shadow-lg',
                variant === 'cyber' && 'border-cyan-500/30 bg-slate-800/50'
              )}
            >
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle
                    className={cn(variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900')}
                  >
                    {example.name}
                  </CardTitle>
                  <Badge variant={example.category === 'Enhanced' ? 'default' : 'secondary'}>
                    {example.category}
                  </Badge>
                </div>
                <CardDescription
                  className={cn(variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600')}
                >
                  {example.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
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
                <CardFooter>
                  <pre
                    className={cn(
                      'text-xs p-3 rounded border w-full overflow-x-auto',
                      variant === 'cyber'
                        ? 'border-cyan-500/20 bg-slate-900 text-cyan-400'
                        : 'border-gray-200 bg-gray-100 text-gray-800'
                    )}
                  >
                    <code>{example.code}</code>
                  </pre>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>

        {/* Color Palette Section */}
        <div className='mt-12'>
          <h2
            className={cn(
              'text-2xl font-bold mb-6',
              variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
            )}
          >
            Color Palette
          </h2>

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
              <div key={colorInfo.name} className='text-center'>
                <div
                  className={cn(
                    'h-16 rounded-lg mb-2 flex items-center justify-center',
                    colorInfo.color,
                    colorInfo.text
                  )}
                >
                  {colorInfo.name}
                </div>
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
        <div className='mt-12'>
          <h2
            className={cn(
              'text-2xl font-bold mb-6',
              variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
            )}
          >
            Typography
          </h2>

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
              <div key={typo.name} className='flex items-center space-x-4'>
                <div
                  className={cn(
                    'w-24 text-xs',
                    variant === 'cyber' ? 'text-cyan-400' : 'text-gray-500'
                  )}
                >
                  {typo.name}
                </div>
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
        <>
          <ParticleField
            variant='cyber'
            density='medium'
            className='fixed inset-0 pointer-events-none z-0'
          />
          <div className='fixed inset-0 bg-grid-white/[0.02] pointer-events-none z-0' />
        </>
      )}
    </div>
  );
};

export default DesignSystem;
