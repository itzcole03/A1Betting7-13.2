import { useEffect, useRef, RefObject } from 'react';

type Event = MouseEvent | TouchEvent;

export const useClickOutside = <T extends HTMLElement = HTMLElement>(
  handler: (event: Event) => void,
  mouseEvent: 'mousedown' | 'mouseup' = 'mousedown'
): RefObject<T> => {
  useEffect(() => {
    const listener = (event: Event) => {
      // Do nothing if clicking ref's element or descendent elements;
      if (!el || el.contains(target)) {
        return;
      }

      handler(event);
    };

    document.addEventListener(mouseEvent, listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener(mouseEvent, listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler, mouseEvent]);

  return ref;
};

// Example usage:
// const ref = useClickOutside<HTMLDivElement>(() => {
//   // Handle click outside;
//   setIsOpen(false);
//});
//
// return (
//   <div ref={ref}>
//     {/* Content */}
//   </div>
// );
