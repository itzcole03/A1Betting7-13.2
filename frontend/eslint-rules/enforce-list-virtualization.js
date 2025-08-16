/**
 * ESLint Rule: enforce-list-virtualization
 * 
 * Enforces that large lists (>100 items) use virtualization
 * to prevent performance issues with DOM rendering.
 */

module.exports = {
  meta: {
    type: 'performance',
    docs: {
      description: 'enforce virtualization for large lists to prevent performance issues',
      category: 'Performance',
      recommended: true,
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          maxListSize: {
            type: 'integer',
            minimum: 1,
            default: 100
          },
          allowedVirtualizedComponents: {
            type: 'array',
            items: { type: 'string' },
            default: ['VirtualizedPropList', 'VirtualizedList', 'FixedSizeList', 'VariableSizeList']
          },
          exemptComponents: {
            type: 'array',
            items: { type: 'string' },
            default: []
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      enforceVirtualization: 'List rendering potentially large number of items should use virtualization. Consider using {{suggestedComponent}} or add conditional virtualization.',
      missingVirtualizationCheck: 'Large list detected without virtualization check. Add conditional logic to use virtualization when items.length > {{maxSize}}.',
      inefficientMapRendering: 'Rendering with .map() can cause performance issues for large lists. Use virtualization for lists > {{maxSize}} items.',
      suggestVirtualization: 'Consider using one of: {{allowedComponents}}'
    }
  },

  create(context) {
    const options = context.options[0] || {};
    const maxListSize = options.maxListSize || 100;
    const allowedVirtualizedComponents = options.allowedVirtualizedComponents || [
      'VirtualizedPropList', 'VirtualizedList', 'FixedSizeList', 'VariableSizeList'
    ];
    const exemptComponents = options.exemptComponents || [];
    
    const virtualizedComponents = new Set();
    
    function checkForListRendering(node) {
      const elementName = node.openingElement.name.name;
      
      // Skip if this is already a virtualized component
      if (allowedVirtualizedComponents.includes(elementName) || 
          exemptComponents.includes(elementName)) {
        return;
      }
      
      // Look for props that suggest list size
      const attributes = node.openingElement.attributes || [];
      
      for (const attr of attributes) {
        if (attr.type === 'JSXAttribute' && attr.name && attr.value) {
          const propName = attr.name.name;
          
          // Check for array props that might indicate list size
          if ((propName === 'items' || propName === 'data' || propName === 'props' ||
               propName === 'projections' || propName === 'opportunities' ||
               propName === 'bets' || propName === 'recommendations') &&
              attr.value.type === 'JSXExpressionContainer') {
            
            // Check if there's a length check or virtualization
            const hasVirtualizationCheck = checkForVirtualizationPattern(node);
            
            if (!hasVirtualizationCheck) {
              context.report({
                node: node,
                messageId: 'missingVirtualizationCheck',
                data: {
                  maxSize: maxListSize
                }
              });
            }
          }
        }
      }
    }
    
    function checkMapExpression(node) {
      // Check if .map() is being used on potentially large arrays
      const callee = node.callee.object;
      
      // Look for props or variables that might be large arrays
      if (callee.type === 'Identifier') {
        const varName = callee.name;
        
        // Common large array variable names
        const largeArrayNames = [
          'props', 'projections', 'opportunities', 'items', 'data',
          'bets', 'recommendations', 'players', 'games'
        ];
        
        if (largeArrayNames.some(name => varName.toLowerCase().includes(name.toLowerCase()))) {
          // Check if we're in a JSX context (rendering)
          let parent = node.parent;
          let inJSX = false;
          
          while (parent) {
            if (parent.type === 'JSXExpressionContainer') {
              inJSX = true;
              break;
            }
            parent = parent.parent;
          }
          
          if (inJSX) {
            // Check if there's a virtualization pattern
            const hasVirtualizationCheck = checkForVirtualizationPattern(node);
            
            if (!hasVirtualizationCheck) {
              context.report({
                node: node,
                messageId: 'inefficientMapRendering',
                data: {
                  maxSize: maxListSize
                },
                suggest: [
                  {
                    messageId: 'suggestVirtualization',
                    data: {
                      allowedComponents: allowedVirtualizedComponents.join(', ')
                    }
                  }
                ]
              });
            }
          }
        }
      }
    }
    
    function checkForVirtualizationPattern(startNode) {
      // Look for virtualization patterns in the component
      let parent = startNode;
      
      // Traverse up to find the component
      while (parent && parent.type !== 'FunctionDeclaration' && 
             parent.type !== 'VariableDeclarator' && parent.type !== 'ArrowFunctionExpression') {
        parent = parent.parent;
      }
      
      if (!parent) return false;
      
      // Look for conditional rendering based on array length
      const componentBody = parent.type === 'FunctionDeclaration' ? parent.body : 
                           parent.type === 'VariableDeclarator' ? parent.init.body :
                           parent.body;
      
      if (!componentBody) return false;
      
      // Simple check for virtualization patterns
      const sourceCode = context.getSourceCode();
      const componentText = sourceCode.getText(componentBody).toLowerCase();
      
      // Check for virtualization keywords
      const virtualizationKeywords = [
        'virtualized', 'virtualizer', 'usevirtualizer', 'fixedsizelist', 
        'variablesizelist', 'virtualizedlist', 'virtualizedproplist'
      ];
      
      const hasVirtualizationKeyword = virtualizationKeywords.some(keyword => 
        componentText.includes(keyword)
      );
      
      // Check for length-based conditional rendering
      const hasLengthCheck = componentText.includes('.length >') || 
                            componentText.includes('.length <') ||
                            componentText.includes('length > 100') ||
                            componentText.includes('length < 100');
      
      return hasVirtualizationKeyword || hasLengthCheck;
    }
    
    return {
      // Track imports of virtualized components
      ImportDeclaration(node) {
        if (node.source.value.includes('@tanstack/react-virtual') ||
            node.source.value.includes('react-window') ||
            node.source.value.includes('VirtualizedPropList')) {
          
          // Track which virtualized components are imported
          node.specifiers.forEach(spec => {
            if (spec.type === 'ImportDefaultSpecifier' || spec.type === 'ImportSpecifier') {
              virtualizedComponents.add(spec.local.name);
            }
          });
        }
      },
      
      // Check JSX elements for list rendering patterns
      JSXElement(node) {
        checkForListRendering(node);
      },
      
      // Check for .map() calls that might render large lists
      CallExpression(node) {
        if (node.callee && 
            node.callee.type === 'MemberExpression' && 
            node.callee.property && 
            node.callee.property.name === 'map') {
          
          checkMapExpression(node);
        }
      }
    };
  }
};