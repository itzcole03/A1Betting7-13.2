/**
 * Import Refactoring Utility
 * 
 * This utility helps standardize import statements across the A1Betting codebase
 * by replacing deep relative imports with clean absolute imports using path aliases.
 */

export interface ImportRefactorRule {
  pattern: RegExp;
  replacement: string;
  description: string;
}

export const COMMON_IMPORT_RULES: ImportRefactorRule[] = [
  // Utils imports
  {
    pattern: /import\s+(.+)\s+from\s+['"]\.\.\/\.\.\/lib\/utils['"];?/g,
    replacement: "import $1 from '@/lib/utils';",
    description: 'Fix deep relative utils imports'
  },
  {
    pattern: /import\s+(.+)\s+from\s+['"]\.\.\/\.\.\/utils\/(.+)['"];?/g,
    replacement: "import $1 from '@/utils/$2';",
    description: 'Fix deep relative utils imports'
  },
  
  // Services imports  
  {
    pattern: /import\s+(.+)\s+from\s+['"]\.\.\/\.\.\/services\/(.+)['"];?/g,
    replacement: "import $1 from '@/services/$2';",
    description: 'Fix deep relative services imports'
  },
  
  // Hooks imports
  {
    pattern: /import\s+(.+)\s+from\s+['"]\.\.\/\.\.\/hooks\/(.+)['"];?/g,
    replacement: "import $1 from '@/hooks/$2';",
    description: 'Fix deep relative hooks imports'
  },
  
  // Types imports
  {
    pattern: /import\s+(.+)\s+from\s+['"]\.\.\/\.\.\/types\/(.+)['"];?/g,
    replacement: "import $1 from '@/types/$2';",
    description: 'Fix deep relative types imports'
  },
  
  // Components imports
  {
    pattern: /import\s+(.+)\s+from\s+['"]\.\.\/\.\.\/components\/(.+)['"];?/g,
    replacement: "import $1 from '@/components/$2';",
    description: 'Fix deep relative components imports'
  },
  
  // Contexts imports
  {
    pattern: /import\s+(.+)\s+from\s+['"]\.\.\/\.\.\/contexts\/(.+)['"];?/g,
    replacement: "import $1 from '@/contexts/$2';",
    description: 'Fix deep relative contexts imports'
  },
  
  // Constants imports
  {
    pattern: /import\s+(.+)\s+from\s+['"]\.\.\/\.\.\/constants\/(.+)['"];?/g,
    replacement: "import $1 from '@/constants/$2';",
    description: 'Fix deep relative constants imports'
  },
  
  // Core imports
  {
    pattern: /import\s+(.+)\s+from\s+['"]\.\.\/\.\.\/core\/(.+)['"];?/g,
    replacement: "import $1 from '@/core/$2';",
    description: 'Fix deep relative core imports'
  },

  // Remove .ts/.js extensions from imports
  {
    pattern: /from\s+['"](@\/[^'"]*)\.(ts|js)['"];?/g,
    replacement: "from '$1';",
    description: 'Remove unnecessary file extensions'
  },

  // Fix client.js imports
  {
    pattern: /from\s+['"]\.\/client\.js['"];?/g,
    replacement: "from './client';",
    description: 'Remove .js extension from local imports'
  }
];

export function refactorImportsInContent(content: string, rules: ImportRefactorRule[] = COMMON_IMPORT_RULES): {
  content: string;
  changes: Array<{rule: string; count: number}>;
} {
  let refactoredContent = content;
  const changes: Array<{rule: string; count: number}> = [];

  rules.forEach(rule => {
    const matches = content.match(rule.pattern);
    const count = matches ? matches.length : 0;
    
    if (count > 0) {
      refactoredContent = refactoredContent.replace(rule.pattern, rule.replacement);
      changes.push({
        rule: rule.description,
        count
      });
    }
  });

  return {
    content: refactoredContent,
    changes
  };
}

export function generateImportReport(filePath: string, changes: Array<{rule: string; count: number}>): string {
  if (changes.length === 0) {
    return `✅ ${filePath}: No import issues found`;
  }

  const report = [
    `🔧 ${filePath}: Fixed ${changes.reduce((sum, c) => sum + c.count, 0)} import issues:`,
    ...changes.map(change => `  - ${change.rule} (${change.count} instances)`)
  ];

  return report.join('\n');
}

// Component boundary validation
export interface ComponentBoundary {
  domain: string;
  allowedImports: string[];
  description: string;
}

export const COMPONENT_BOUNDARIES: ComponentBoundary[] = [
  {
    domain: 'components/core',
    allowedImports: ['@/lib', '@/utils', '@/types', 'react', 'framer-motion', 'lucide-react'],
    description: 'Core components should only import utilities and base libraries'
  },
  {
    domain: 'components/ui',
    allowedImports: ['@/lib', '@/utils', '@/types', 'react', 'class-variance-authority', 'clsx'],
    description: 'UI components should be pure and not import business logic'
  },
  {
    domain: 'components/features',
    allowedImports: ['@/lib', '@/utils', '@/types', '@/services', '@/hooks', '@/components/core', '@/components/ui', 'react'],
    description: 'Feature components can import services and hooks'
  },
  {
    domain: 'services',
    allowedImports: ['@/types', '@/utils', '@/core'],
    description: 'Services should not import components or hooks'
  },
  {
    domain: 'hooks',
    allowedImports: ['@/services', '@/types', '@/utils', 'react'],
    description: 'Hooks can import services but not components'
  }
];

export function validateComponentBoundary(filePath: string, content: string): {
  isValid: boolean;
  violations: string[];
  boundary?: ComponentBoundary;
} {
  const boundary = COMPONENT_BOUNDARIES.find(b => filePath.includes(b.domain));
  
  if (!boundary) {
    return { isValid: true, violations: [] };
  }

  const imports = content.match(/import\s+.+\s+from\s+['"]([^'"]+)['"];?/g) || [];
  const violations: string[] = [];

  imports.forEach(importStatement => {
    const match = importStatement.match(/from\s+['"]([^'"]+)['"];?/);
    if (!match) return;

    const importPath = match[1];
    
    // Skip relative imports within the same domain
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      return;
    }

    // Check if import is allowed
    const isAllowed = boundary.allowedImports.some(allowed => 
      importPath.startsWith(allowed) || importPath === allowed
    );

    if (!isAllowed) {
      violations.push(`❌ ${boundary.domain} should not import from '${importPath}'`);
    }
  });

  return {
    isValid: violations.length === 0,
    violations,
    boundary
  };
}

export default {
  refactorImportsInContent,
  generateImportReport,
  validateComponentBoundary,
  COMMON_IMPORT_RULES,
  COMPONENT_BOUNDARIES
};
