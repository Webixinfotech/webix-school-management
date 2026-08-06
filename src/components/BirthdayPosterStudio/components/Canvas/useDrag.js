// src/components/BirthdayPosterStudio/components/Canvas/useDrag.js
import { useRef, useCallback } from 'react';

/**
 * onDrag receives { dx, dy } already converted into canvas-space pixels
 * (i.e. divided by the current preview scale), so callers never need to
 * think about zoom level.
 */
export function useDrag(scale, onDrag, enabled = true) {
  const state = useRef(null);

  const onPointerDown = useCallback((e) => {
    if (!enabled) return;
    e.stopPropagation();
    const p = e.touches ? e.touches[0] : e;
    state.current = { x: p.clientX, y: p.clientY };
  }, [enabled]);

  const onPointerMove = useCallback((e) => {
    if (!state.current) return;
    const p = e.touches ? e.touches[0] : e;
    const dx = (p.clientX - state.current.x) / (scale || 1);
    const dy = (p.clientY - state.current.y) / (scale || 1);
    state.current = { x: p.clientX, y: p.clientY };
    onDrag({ dx, dy });
  }, [scale, onDrag]);

  const onPointerUp = useCallback(() => { state.current = null; }, []);

  return {
    onMouseDown: onPointerDown,
    onMouseMove: onPointerMove,
    onMouseUp: onPointerUp,
    onMouseLeave: onPointerUp,
    onTouchStart: onPointerDown,
    onTouchMove: onPointerMove,
    onTouchEnd: onPointerUp,
  };
}
