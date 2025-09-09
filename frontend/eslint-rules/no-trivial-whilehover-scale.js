/* global module */
/**
 * Rule: no-trivial-whilehover-scale
 * Flags Framer Motion `whileHover` / `whileTap` props that are ONLY a single scale transform
 * object literal (e.g., whileHover={{ scale: 1.05 }}) where policy prefers Tailwind utility classes.
 *
 * Heuristics:
 *  - JSXAttribute name is whileHover or whileTap
 *  - Value is a JSXExpressionContainer with ObjectExpression
 *  - ObjectExpression has exactly 1 Property key: 'scale'
 *  - scale value is Literal or TemplateLiteral with numeric content
 *
 * Exemptions:
 *  - If the object has more than one property (e.g., scale + rotate) → allowed
 *  - If value references identifier / spread (dynamic variant) → allowed
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow trivial single-property scale usage in whileHover/whileTap; use Tailwind scale utilities instead.',
      recommended: false
    },
    messages: {
      trivialScale: 'Trivial scale-only {{prop}} detected. Prefer Tailwind hover:scale-*/active:scale-* utilities for basic interaction feedback.'
    },
    schema: []
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (!node.name || !node.name.name) return;
        const attrName = node.name.name;
        if (attrName !== 'whileHover' && attrName !== 'whileTap') return;

        if (!node.value || node.value.type !== 'JSXExpressionContainer') return;
        const expr = node.value.expression;

        if (expr.type !== 'ObjectExpression') return; // dynamic or variant usage allowed
        if (expr.properties.length !== 1) return; // multi-property animations allowed

        const onlyProp = expr.properties[0];
        if (onlyProp.type !== 'Property') return;
        const keyName = onlyProp.key && (onlyProp.key.name || onlyProp.key.value);
        if (keyName !== 'scale') return;

        // Confirm literal value or simple numeric template
        const val = onlyProp.value;
        const isNumericLiteral = val.type === 'Literal' && typeof val.value === 'number';
        const isTemplateNumeric = val.type === 'TemplateLiteral' && val.expressions.length === 0 && /^\d+(\.\d+)?$/.test(val.quasis[0].value.raw);
        if (!(isNumericLiteral || isTemplateNumeric)) return; // complex / dynamic scale considered meaningful

        context.report({
          node,
          messageId: 'trivialScale',
          data: { prop: attrName }
        });
      }
    };
  }
};