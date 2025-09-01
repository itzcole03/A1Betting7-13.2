const React = require('react');

const actual = jest.requireActual('framer-motion');

function custom(Component) {
  return React.forwardRef((props, ref) => {
    const regularProps = Object.entries(props || {}).reduce((acc, [key, value]) => {
      if (!actual.isValidMotionProp || !actual.isValidMotionProp(key)) {
        acc[key] = value;
      }
      return acc;
    }, {});
    return React.createElement(Component, Object.assign({ ref }, regularProps));
  });
}

const componentCache = new Map();
const motion = new Proxy(custom, {
  get: (_target, key) => {
    if (!componentCache.has(key)) {
      componentCache.set(key, custom(key));
    }
    return componentCache.get(key);
  },
});

const AnimatePresence = ({ children }) => React.createElement(React.Fragment, null, children);

module.exports = Object.assign({}, actual, {
  AnimatePresence,
  motion,
});
// __mocks__/framer-motion.js
module.exports = {
  motion: {
    // Pass-through for all motion.div, motion.button, etc.
    // Just render the children
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    // Add more as needed
  },
  AnimatePresence: ({ children }) => <>{children}</>,
};
