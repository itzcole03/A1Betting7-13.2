// Path constants for consistent imports across the application

export const COMPONENT_PATHS = {
  // Core components
  UI: '@/components/ui',
  CORE: '@/components/core',
  AUTH: '@/components/auth',
  
  // Features
  FEATURES: '@/components/features',
  MONEY_MAKER: '@/components/MoneyMaker',
  
  // Services
  SERVICES: '@/services',
  API: '@/api',
  
  // Utils
  UTILS: '@/utils',
  HOOKS: '@/hooks',
  CONTEXTS: '@/contexts',
} as const;

// Helper function for consistent import paths
export const getComponentPath = (category: keyof typeof COMPONENT_PATHS, component: string) => {
  return `${COMPONENT_PATHS[category]}/${component}`;
};
