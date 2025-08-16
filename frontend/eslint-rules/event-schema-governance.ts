/**
 * ESLint Rule: Enforce Event Schema Registration
 * 
 * This rule ensures that all events emitted in the application
 * are registered with the event schema registry and use proper
 * versioned event types.
 * 
 * Acceptance Criteria:
 * - events/schema/*.ts enumerates all event interfaces with version
 * - Lint rule forbids emitting events without registered schema import
 * - Event bus publishes schemaVersion in each payload
 */

import { ESLintUtils, AST_NODE_TYPES } from '@typescript-eslint/utils';

type _MessageIds = 'missingSchemaImport' | 'unregisteredEventType' | 'missingSchemaVersion';

interface EventEmission {
  type: string;
  node: import('@typescript-eslint/utils').TSESTree.CallExpression;
  hasSchemaImport: boolean;
  hasVersionField: boolean;
}

export const eventSchemaGovernanceRule = ESLintUtils.RuleCreator(
  name => `A1Betting Event Schema Rule: ${name}`,
)({
  name: 'event-schema-governance',
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce event schema registration and versioning',
      recommended: 'error',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          schemaImportPatterns: {
            type: 'array',
            items: { type: 'string' },
            default: ['../events/schema', '@/events/schema', './events/schema']
          },
          eventEmissionMethods: {
            type: 'array', 
            items: { type: 'string' },
            default: ['emit', 'publish', 'trigger', 'dispatch']
          },
          requiredVersionField: {
            type: 'string',
            default: 'version'
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      missingSchemaImport: 'Event emission detected but no event schema import found. Import from: {{patterns}}',
      unregisteredEventType: 'Event type "{{eventType}}" is not registered in the event schema registry',
      missingSchemaVersion: 'Event emission missing required version field "{{versionField}}"'
    }
  },
  defaultOptions: [
    {
      schemaImportPatterns: ['../events/schema', '@/events/schema', './events/schema'],
      eventEmissionMethods: ['emit', 'publish', 'trigger', 'dispatch'],
      requiredVersionField: 'version'
    }
  ],
  create(context, [options]) {
    const sourceCode = context.getSourceCode();
    const filename = context.getFilename();
    
    // Skip rule for schema definition files themselves
    if (filename.includes('events/schema') || filename.includes('events\\schema')) {
      return {};
    }

    let hasSchemaImport = false;
    const eventEmissions: EventEmission[] = [];
    const registeredEventTypes = new Set<string>();

    return {
      // Track imports from event schema
      ImportDeclaration(node) {
        const importPath = node.source.value as string;
        
        if (options.schemaImportPatterns.some(pattern => importPath.includes(pattern))) {
          hasSchemaImport = true;
          
          // Extract imported event types
          node.specifiers.forEach(specifier => {
            if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
              const eventTypeName = specifier.imported.name;
              if (eventTypeName.includes('Event') || eventTypeName.includes('event')) {
                registeredEventTypes.add(eventTypeName);
              }
            }
          });
        }
      },

      // Track event emissions
      CallExpression(node) {
        const callee = node.callee;
        
        // Check if this is an event emission method call
        let isEventEmission = false;
        let methodName = '';

        if (callee.type === AST_NODE_TYPES.MemberExpression && 
            callee.property.type === AST_NODE_TYPES.Identifier) {
          methodName = callee.property.name;
          isEventEmission = options.eventEmissionMethods.includes(methodName);
        } else if (callee.type === AST_NODE_TYPES.Identifier) {
          methodName = callee.name;
          isEventEmission = options.eventEmissionMethods.includes(methodName);
        }

        if (isEventEmission && node.arguments.length > 0) {
          const firstArg = node.arguments[0];
          let eventType = '';
          let hasVersionField = false;

          // Extract event type from first argument
          if (firstArg.type === AST_NODE_TYPES.Literal) {
            eventType = String(firstArg.value);
          } else if (firstArg.type === AST_NODE_TYPES.ObjectExpression) {
            // Check for type and version fields in event object
            firstArg.properties.forEach(prop => {
              if (prop.type === AST_NODE_TYPES.Property && 
                  prop.key.type === AST_NODE_TYPES.Identifier) {
                if (prop.key.name === 'type' && 
                    prop.value.type === AST_NODE_TYPES.Literal) {
                  eventType = String(prop.value.value);
                }
                if (prop.key.name === options.requiredVersionField) {
                  hasVersionField = true;
                }
              }
            });
          }

          if (eventType) {
            eventEmissions.push({
              type: eventType,
              node,
              hasSchemaImport,
              hasVersionField
            });
          }
        }
      },

      // Validate at end of file
      'Program:exit'() {
        eventEmissions.forEach(emission => {
          // Check for missing schema import
          if (!emission.hasSchemaImport) {
            context.report({
              node: emission.node,
              messageId: 'missingSchemaImport',
              data: {
                patterns: options.schemaImportPatterns.join(', ')
              },
              fix(fixer) {
                // Auto-fix: Add schema import at top of file
                const imports = sourceCode.ast.body.filter(
                  node => node.type === AST_NODE_TYPES.ImportDeclaration
                );
                const lastImport = imports[imports.length - 1];
                const insertAfter = lastImport || sourceCode.ast.body[0];
                
                const importStatement = `import { EventFactory, eventSchemaRegistry } from '${options.schemaImportPatterns[0]}';\n`;
                
                return fixer.insertTextAfter(insertAfter, importStatement);
              }
            });
          }

          // Check for missing version field
          if (!emission.hasVersionField) {
            context.report({
              node: emission.node,
              messageId: 'missingSchemaVersion',
              data: {
                versionField: options.requiredVersionField
              }
            });
          }

          // Check if event type is registered (this would need runtime validation)
          // For now, we check if it follows the expected naming convention
          if (!emission.type.includes('.') || !emission.type.match(/^[a-z]+\.[a-z_]+(\.[a-z_]+)*$/)) {
            context.report({
              node: emission.node,
              messageId: 'unregisteredEventType', 
              data: {
                eventType: emission.type
              }
            });
          }
        });
      }
    };
  }
});

export default eventSchemaGovernanceRule;