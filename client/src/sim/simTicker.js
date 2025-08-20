// src/sim/simTicker.js
import { useProcessSimStore } from '@/stores/useProcessSimStore';

let rafId = 0;
export function startSimTicker() {
  const store = useProcessSimStore();
  function loop(t) {
    store.tick(t || performance.now());
    rafId = requestAnimationFrame(loop);
  }
  if (!rafId) rafId = requestAnimationFrame(loop);
}
export function stopSimTicker() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
}
