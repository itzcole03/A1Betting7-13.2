/**
 * Betting Components Cleanup Utility
 * 
 * This utility helps identify and clean up inconsistencies in betting components
 * according to the A1Betting Component Coding Standards.
 */

export interface ComponentAnalysis {
  filePath: string;
  isEmpty: boolean;
  hasProperInterface: boolean;
  followsNamingConvention: boolean;
  hasDefaultExport: boolean;
  usesStandardImports: boolean;
  issues: string[];
  recommendations: string[];
}

export interface CleanupReport {
  totalFiles: number;
  emptyFiles: number;
  filesToRemove: string[];
  filesToRefactor: string[];
  duplicateComponents: Array<{
    name: string;
    locations: string[];
  }>;
  recommendations: string[];
}

export const EMPTY_FILE_PATTERNS = [
  /^export\s*\{\s*\};?\s*$/,
  /^\/\*[\s\S]*?\*\/\s*export\s*\{\s*\};?\s*$/,
  /^\/\/.*\nexport\s*\{\s*\};?\s*$/,
  /^\s*$/, // Completely empty
];

export const STANDARD_IMPORTS = [
  'react',
  'framer-motion',
  'lucide-react',
  '@/lib/utils',
  '@/types',
  '@/services',
  '@/hooks',
  '@/components'
];

export function analyzeComponentFile(filePath: string, content: string): ComponentAnalysis {
  const fileName = filePath.split('/').pop()?.replace('.tsx', '') || '';
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check if file is empty
  const isEmpty = EMPTY_FILE_PATTERNS.some(pattern => pattern.test(content.trim()));

  // Check for proper interface naming
  const hasProperInterface = content.includes(`interface ${fileName}Props`) || 
                             content.includes(`type ${fileName}Props`);

  // Check naming convention (PascalCase)
  const followsNamingConvention = /^[A-Z][a-zA-Z0-9]*$/.test(fileName);

  // Check for default export
  const hasDefaultExport = content.includes('export default') || 
                           content.includes(`export { ${fileName} as default }`);

  // Check for standard imports
  const usesStandardImports = STANDARD_IMPORTS.some(standardImport => 
    content.includes(`from '${standardImport}'`) || 
    content.includes(`from "@${standardImport.replace('@/', '')}`)
  );

  // Identify issues
  if (isEmpty) {
    issues.push('File is empty or contains only export {}');
    recommendations.push('Remove file or implement proper component');
  }

  if (!followsNamingConvention) {
    issues.push('File name does not follow PascalCase convention');
    recommendations.push(`Rename to ${fileName.charAt(0).toUpperCase() + fileName.slice(1)}`);
  }

  if (!hasProperInterface && !isEmpty) {
    issues.push('Missing standardized Props interface');
    recommendations.push(`Add interface ${fileName}Props`);
  }

  if (!hasDefaultExport && !isEmpty) {
    issues.push('Missing default export');
    recommendations.push('Add default export for component');
  }

  if (content.includes('../../') || content.includes('../../../')) {
    issues.push('Uses deep relative imports');
    recommendations.push('Replace with absolute imports using @/ alias');
  }

  if (content.includes('@ts-expect-error') || content.includes('@ts-ignore')) {
    issues.push('Contains TypeScript error suppressions');
    recommendations.push('Fix TypeScript errors instead of suppressing them');
  }

  return {
    filePath,
    isEmpty,
    hasProperInterface,
    followsNamingConvention,
    hasDefaultExport,
    usesStandardImports,
    issues,
    recommendations
  };
}

export function generateCleanupReport(analyses: ComponentAnalysis[]): CleanupReport {
  const emptyFiles = analyses.filter(a => a.isEmpty);
  const filesToRemove = emptyFiles.map(a => a.filePath);
  const filesToRefactor = analyses.filter(a => !a.isEmpty && a.issues.length > 0);

  // Find duplicate component names
  const componentNames = new Map<string, string[]>();
  analyses.forEach(analysis => {
    const name = analysis.filePath.split('/').pop()?.replace('.tsx', '') || '';
    if (!componentNames.has(name)) {
      componentNames.set(name, []);
    }
    componentNames.get(name)?.push(analysis.filePath);
  });

  const duplicateComponents = Array.from(componentNames.entries())
    .filter(([, locations]) => locations.length > 1)
    .map(([name, locations]) => ({ name, locations }));

  const recommendations: string[] = [
    `Remove ${emptyFiles.length} empty files to clean up codebase`,
    `Refactor ${filesToRefactor.length} files to follow coding standards`,
    `Consolidate ${duplicateComponents.length} duplicate components`,
    'Implement proper TypeScript interfaces for all components',
    'Standardize import patterns using absolute paths',
    'Add comprehensive JSDoc documentation',
    'Implement proper error boundaries',
    'Add unit tests for all components'
  ];

  return {
    totalFiles: analyses.length,
    emptyFiles: emptyFiles.length,
    filesToRemove,
    filesToRefactor: filesToRefactor.map(a => a.filePath),
    duplicateComponents,
    recommendations
  };
}

export function generateRefactoringPlan(report: CleanupReport): {
  phase1: string[];
  phase2: string[];
  phase3: string[];
} {
  return {
    phase1: [
      'Remove all empty files',
      'Fix critical TypeScript errors',
      'Standardize import patterns',
      'Remove duplicate components'
    ],
    phase2: [
      'Implement proper Props interfaces',
      'Add default exports where missing',
      'Standardize component structure',
      'Add proper JSDoc documentation'
    ],
    phase3: [
      'Add comprehensive unit tests',
      'Implement error boundaries',
      'Add performance optimizations',
      'Create comprehensive documentation'
    ]
  };
}

export const COMPONENT_TEMPLATES = {
  basic: `/**
 * {ComponentName} - Brief description
 * 
 * @description Detailed description of the component's purpose and functionality.
 * 
 * @example
 * \`\`\`tsx
 * <{ComponentName}
 *   prop1={value1}
 *   prop2={value2}
 * />
 * \`\`\`
 */

import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { {ComponentName}Props } from '../types';

const {ComponentName}: React.FC<{ComponentName}Props> = ({
  // Destructure props here
  className
}) => {
  // Component logic here

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('default-classes', className)}
    >
      {/* Component content */}
    </motion.div>
  );
};

export default {ComponentName};`,

  withHooks: `/**
 * {ComponentName} - Brief description with custom hooks
 */

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { {ComponentName}Props } from '../types';

const {ComponentName}: React.FC<{ComponentName}Props> = ({
  // Destructure props
  className
}) => {
  // State
  const [state, setState] = useState(initialValue);

  // Memoized values
  const memoizedValue = useMemo(() => {
    return calculateValue();
  }, [dependencies]);

  // Event handlers
  const handleAction = useCallback(() => {
    // Handle action
  }, [dependencies]);

  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('default-classes', className)}
    >
      {/* Component content */}
    </motion.div>
  );
};

export default {ComponentName};`
};

export default {
  analyzeComponentFile,
  generateCleanupReport,
  generateRefactoringPlan,
  COMPONENT_TEMPLATES,
  EMPTY_FILE_PATTERNS,
  STANDARD_IMPORTS
};
