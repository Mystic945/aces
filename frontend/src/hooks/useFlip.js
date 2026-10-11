import { useCallback, useLayoutEffect, useRef } from 'react';

const DURATION_MS = 260;
const EASING = 'cubic-bezier(0.2, 0, 0, 1)';

/**
 * Animates keyed children of a container to their new positions when the
 * order changes (FLIP), so a re-ranking reads as cards moving rather than
 * content swapping in place. Returns `register(key)` ref callbacks.
 *
 * Handles being interrupted mid-flight, which happens constantly while a
 * slider is being dragged.
 */
export function useFlip(containerRef) {
  const nodes = useRef(new Map());
  const lastLayout = useRef(new Map());

  const register = useCallback(
    (key) => (node) => {
      if (node) nodes.current.set(key, node);
      else nodes.current.delete(key);
    },
    [],
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const origin = container.getBoundingClientRect();
    const nextLayout = new Map();

    nodes.current.forEach((node, key) => {
      // Where the node appears right now, including any running animation.
      const visual = node.getBoundingClientRect();
      node.getAnimations().forEach((animation) => animation.cancel());
      const settled = node.getBoundingClientRect();
      const layout = { x: settled.left - origin.left, y: settled.top - origin.top };
      nextLayout.set(key, layout);
      if (reduceMotion) return;

      const previous = lastLayout.current.get(key);
      if (!previous) {
        node.animate(
          [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
          { duration: DURATION_MS, easing: EASING },
        );
        return;
      }

      const inFlightX = visual.left - settled.left;
      const inFlightY = visual.top - settled.top;
      const dx = previous.x + inFlightX - layout.x;
      const dy = previous.y + inFlightY - layout.y;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

      node.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
        { duration: DURATION_MS, easing: EASING },
      );
    });

    lastLayout.current = nextLayout;
  });

  return register;
}
