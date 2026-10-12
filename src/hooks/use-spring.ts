'use client';

import { useEffect, useRef } from 'react';

type Tuple3 = [number, number, number];

export type SpringOptions = {
  stiffness?: number;
  damping?: number;
  delay?: number;
  reduced?: boolean;
};

function copy(value: Tuple3): Tuple3 {
  return [value[0], value[1], value[2]];
}

export function useSpring<T extends Element>(
  target: Tuple3,
  paint: (node: T, value: Tuple3) => void,
  options: SpringOptions = {}
) {
  const { stiffness = 120, damping = 13, delay = 0, reduced = false } = options;
  const ref = useRef<T | null>(null);
  const paintRef = useRef(paint);
  paintRef.current = paint;
  const stateRef = useRef<{ current: Tuple3; velocity: Tuple3 }>({ current: copy(target), velocity: [0, 0, 0] });
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduced) {
      stateRef.current = { current: copy(target), velocity: [0, 0, 0] };
      paintRef.current(node, stateRef.current.current);
      return;
    }
    paintRef.current(node, stateRef.current.current);
    const origin = copy(stateRef.current.current);
    const velocity = copy(stateRef.current.velocity);
    const alpha = damping / 2;
    const omega = Math.sqrt(stiffness - alpha * alpha);
    const start = performance.now() + delay * 1000;
    function tick(now: number) {
      if (now < start) { frameRef.current = requestAnimationFrame(tick); return; }
      const t = (now - start) / 1000;
      const decay = Math.exp(-alpha * t);
      const sin = Math.sin(omega * t);
      const cos = Math.cos(omega * t);
      const next: Tuple3 = target.map((value, i) => value + decay * ((origin[i] - value) * cos + (velocity[i] + alpha * (origin[i] - value)) / omega * sin)) as Tuple3;
      const nextVelocity: Tuple3 = target.map((value, i) => decay * (velocity[i] * cos - (stiffness * (origin[i] - value) + alpha * velocity[i]) / omega * sin)) as Tuple3;
      stateRef.current = { current: next, velocity: nextVelocity };
      const nodeRef = ref.current;
      if (nodeRef) paintRef.current(nodeRef, next);
      if (t > 3 || (next.every((value, i) => Math.abs(value - target[i]) < 0.01) && nextVelocity.every(value => Math.abs(value) < 0.01))) {
        stateRef.current = { current: copy(target), velocity: [0, 0, 0] };
        const nodeRef2 = ref.current;
        if (nodeRef2) paintRef.current(nodeRef2, stateRef.current.current);
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target[0], target[1], target[2], stiffness, damping, delay, reduced]);

  return ref;
}
