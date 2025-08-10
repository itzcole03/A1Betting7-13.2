 
import * as React from 'react';

const actual = jest.requireActual('framer-motion');

function custom(Component: string | React.ComponentType<any>) {
  return React.forwardRef((props: any, ref: any) => {
    const regularProps = Object.entries(props || {}).reduce((acc: any, [key, value]) => {
      if (!actual.isValidMotionProp || !actual.isValidMotionProp(key)) {
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
