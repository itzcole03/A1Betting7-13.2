import * as React from 'react';

const actual = jest.requireActual('framer-motion');

const FALLBACK_MOTION_PROPS = new Set([
  'animate',
  'initial',
  'exit',
  'transition',
  'variants',
  'whileHover',
  'whileTap',
  'whileFocus',
  'whileInView',
  'whileDrag',
  'whileTapStart',
  'whileDragStart',
  'whileDragEnd',
  'layout',
  'layoutId',
  'drag',
  'dragControls',
  'dragConstraints',
  'dragElastic',
  'dragMomentum',
  'dragListener',
  'dragSnapToOrigin',
  'onAnimationComplete',
  'onAnimationStart',
  'onUpdate',
  'viewport',
]);

const shouldForwardProp = (key: string) => {
  if (typeof actual.isValidMotionProp === 'function') {
    return !actual.isValidMotionProp(key);
  }
  return !FALLBACK_MOTION_PROPS.has(key);
};

function custom(Component: string | React.ComponentType<any>) {
  return React.forwardRef((props: any = {}, ref: any) => {
    const regularProps = Object.entries(props).reduce((acc: any, [key, value]) => {
      if (shouldForwardProp(key)) {
        acc[key] = value;
      }
      return acc;
    }, {});
    return React.createElement(Component, { ref, ...regularProps });
  });
}

const componentCache = new Map<string, any>();
const motion = new Proxy(custom, {
  get: (_target, key: string) => {
    if (!componentCache.has(key)) {
      componentCache.set(key, custom(key));
    }
    return componentCache.get(key)!;
  },
});

const AnimatePresence = ({ children }: { children: React.ReactNode }) =>
  React.createElement(React.Fragment, null, children);

module.exports = {
  ...actual,
  AnimatePresence,
  motion,
};
