import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';
import { useCanvasStore } from '@/store/canvasStore';

export function AlignmentGuides() {
  const guides = useUIStore((s) => s.alignmentGuides);
  const setAlignmentGuides = useUIStore((s) => s.setAlignmentGuides);
  const activeDragId = useUIStore((s) => s.activeDragId);
  const components = useCanvasStore((s) => s.components);

  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!activeDragId) {
      setAlignmentGuides([]);
      return;
    }

    const compute = () => {
      const dragged = document.querySelector(`[data-component-id="${activeDragId}"]`);
      if (!dragged) return;

      const dragRect = dragged.getBoundingClientRect();
      const others = document.querySelectorAll('[data-component-id]');
      const guides: ReturnType<typeof useUIStore.getState>['alignmentGuides'] = [];
      const THRESHOLD = 6;

      others.forEach((el) => {
        const otherId = el.getAttribute('data-component-id');
        if (!otherId || otherId === activeDragId) return;

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        // Left edges align
        if (Math.abs(dragRect.left - rect.left) < THRESHOLD) {
          guides.push({ axis: 'y', position: rect.left, from: Math.min(dragRect.top, rect.top), to: Math.max(dragRect.bottom, rect.bottom) });
        }
        // Right edges align
        if (Math.abs(dragRect.right - rect.right) < THRESHOLD) {
          guides.push({ axis: 'y', position: rect.right, from: Math.min(dragRect.top, rect.top), to: Math.max(dragRect.bottom, rect.bottom) });
        }
        // Center X align
        if (Math.abs((dragRect.left + dragRect.right) / 2 - (rect.left + rect.right) / 2) < THRESHOLD) {
          guides.push({ axis: 'y', position: (rect.left + rect.right) / 2, from: Math.min(dragRect.top, rect.top), to: Math.max(dragRect.bottom, rect.bottom) });
        }
        // Top edges align
        if (Math.abs(dragRect.top - rect.top) < THRESHOLD) {
          guides.push({ axis: 'x', position: rect.top, from: Math.min(dragRect.left, rect.left), to: Math.max(dragRect.right, rect.right) });
        }
        // Bottom edges align
        if (Math.abs(dragRect.bottom - rect.bottom) < THRESHOLD) {
          guides.push({ axis: 'x', position: rect.bottom, from: Math.min(dragRect.left, rect.left), to: Math.max(dragRect.right, rect.right) });
        }
        // Center Y align
        if (Math.abs((dragRect.top + dragRect.bottom) / 2 - (rect.top + rect.bottom) / 2) < THRESHOLD) {
          guides.push({ axis: 'x', position: (rect.top + rect.bottom) / 2, from: Math.min(dragRect.left, rect.left), to: Math.max(dragRect.right, rect.right) });
        }
      });

      setAlignmentGuides(guides.slice(0, 6));
      frameRef.current = requestAnimationFrame(compute);
    };

    frameRef.current = requestAnimationFrame(compute);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [activeDragId, setAlignmentGuides]);

  return (
    <AnimatePresence>
      {guides.map((guide, i) => (
        <motion.div
          key={`guide-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.05 }}
          className="fixed pointer-events-none z-[150]"
          style={
            guide.axis === 'x'
              ? {
                  top: guide.position,
                  left: guide.from,
                  width: guide.to - guide.from,
                  height: 1,
                  background: 'linear-gradient(90deg, transparent, hsl(210 100% 56%), transparent)',
                  boxShadow: '0 0 4px 1px hsl(210 100% 56% / 0.4)',
                }
              : {
                  left: guide.position,
                  top: guide.from,
                  height: guide.to - guide.from,
                  width: 1,
                  background: 'linear-gradient(180deg, transparent, hsl(210 100% 56%), transparent)',
                  boxShadow: '0 0 4px 1px hsl(210 100% 56% / 0.4)',
                }
          }
        />
      ))}
    </AnimatePresence>
  );
}
