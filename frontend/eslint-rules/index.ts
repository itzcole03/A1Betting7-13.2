/**
 * Custom ESLint Plugin for A1Betting Event Schema Governance
 * 
 * This plugin provides custom lint rules specific to the A1Betting
 * application architecture, focusing on event schema enforcement.
 */

import eventSchemaGovernanceRule from './event-schema-governance';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - JS rule file
import noTrivialWhileHoverScale from './no-trivial-whilehover-scale';

const plugin = {
  rules: {
    'event-schema-governance': eventSchemaGovernanceRule,
    'no-trivial-whilehover-scale': noTrivialWhileHoverScale
  },
  configs: {
    recommended: {
      plugins: ['a1betting'],
      rules: {
        'a1betting/event-schema-governance': 'error'
      }
    }
  }
};

// Use CommonJS export for ESLint plugin resolution
module.exports = plugin;