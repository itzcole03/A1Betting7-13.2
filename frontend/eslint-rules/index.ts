/**
 * Custom ESLint Plugin for A1Betting Event Schema Governance
 * 
 * This plugin provides custom lint rules specific to the A1Betting
 * application architecture, focusing on event schema enforcement.
 */

import eventSchemaGovernanceRule from './event-schema-governance';

const plugin = {
  rules: {
    'event-schema-governance': eventSchemaGovernanceRule
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

export = plugin;