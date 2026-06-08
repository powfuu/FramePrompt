import { useCallback, useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

export function ResizeHandles({ id }: { id: string }) {
  const updateComponent = useCanvasStore((s) => s.updateComponent);
  const component = useCanvasStore((s) => s.components[id]);
  const setIsResizing = useUIStore((s) => s.setIsResizing);

  const startPos = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const activeHandle = useRef<'top' | 'right' | 'bottom' | 'left' | null>(null);
  const rafRef = useRef<number | null>(null);
  
  const [currentSize, setCurrentSize] = useState<{ w: number; h: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent, handle: 'top' | 'right' | 'bottom' | 'left') => {
    e.preventDefault();
    e.stopPropagation();
    
    const el = document.querySelector(`[data-component-id="${id}"]`) as HTMLElement;
    if (!el) return;
    
    const rect = el.getBoundingClientRect();
    const zoom = useCanvasStore.getState().viewport.zoom;

    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      w: rect.width / zoom,
      h: rect.height / zoom,
    };
    activeHandle.current = handle;
    setIsResizing(true);
    setCurrentSize({ w: startPos.current.w, h: startPos.current.h });
    
    // Lock the component's inline style directly to bypass React state for smooth dragging
    el.style.willChange = 'width, height';
    
    // Force global cursor to avoid flicker
    document.body.style.cursor = handle === 'left' || handle === 'right' ? 'col-resize' : 'row-resize';
  }, [id, setIsResizing]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!startPos.current || !activeHandle.current) return;

      // Use native event coordinates
      const clientX = e.clientX;
      const clientY = e.clientY;

      const zoom = useCanvasStore.getState().viewport.zoom;
      const dx = (clientX - startPos.current.x) / zoom;
      const dy = (clientY - startPos.current.y) / zoom;

      let newWidth = startPos.current.w;
      let newHeight = startPos.current.h;

      if (activeHandle.current === 'right') newWidth = Math.max(20, startPos.current.w + dx);
      if (activeHandle.current === 'left') newWidth = Math.max(20, startPos.current.w - dx);
      if (activeHandle.current === 'bottom') newHeight = Math.max(20, startPos.current.h + dy);
      if (activeHandle.current === 'top') newHeight = Math.max(20, startPos.current.h - dy);

      setCurrentSize({ w: newWidth, h: newHeight });
      
      // Update component in store live
      const updates: any = {};
      if (activeHandle.current === 'right' || activeHandle.current === 'left') updates.width = Math.round(newWidth);
      if (activeHandle.current === 'bottom' || activeHandle.current === 'top') updates.height = Math.round(newHeight);
      
      const state = useCanvasStore.getState();
      const currentComp = state.components[id];
      if (currentComp) {
        updateComponent(id, { layout: { ...currentComp.layout, ...updates } });
      }
    };

    const handlePointerUp = () => {
      if (!startPos.current || !activeHandle.current) return;
      
      // Commit history only once at the end
      useCanvasStore.getState().pushHistory();

      const el = document.querySelector(`[data-component-id="${id}"]`) as HTMLElement;
      if (el) el.style.willChange = 'auto';
      
      document.body.style.cursor = '';
      
      startPos.current = null;
      activeHandle.current = null;
      setIsResizing(false);
      setCurrentSize(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [id, updateComponent, setIsResizing]);

  return (
    <>
      <AnimatePresence>
        {currentSize && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-medium shadow-lg z-[100] whitespace-nowrap pointer-events-none"
          >
            {Math.round(currentSize.w)} × {Math.round(currentSize.h)}
          </motion.div>
        )}
      </AnimatePresence>
      
      <div 
        className="absolute top-0 bottom-0 -right-1 w-2 cursor-col-resize z-50 flex items-center justify-center group"
        onPointerDown={(e) => handlePointerDown(e, 'right')}
      >
        <div className="w-1 h-4 rounded-full bg-primary/0 group-hover:bg-primary/80 transition-colors" />
      </div>
      <div 
        className="absolute top-0 bottom-0 -left-1 w-2 cursor-col-resize z-50 flex items-center justify-center group"
        onPointerDown={(e) => handlePointerDown(e, 'left')}
      >
        <div className="w-1 h-4 rounded-full bg-primary/0 group-hover:bg-primary/80 transition-colors" />
      </div>
      <div 
        className="absolute left-0 right-0 -bottom-1 h-2 cursor-row-resize z-50 flex items-center justify-center group"
        onPointerDown={(e) => handlePointerDown(e, 'bottom')}
      >
        <div className="h-1 w-4 rounded-full bg-primary/0 group-hover:bg-primary/80 transition-colors" />
      </div>
      <div 
        className="absolute left-0 right-0 -top-1 h-2 cursor-row-resize z-50 flex items-center justify-center group"
        onPointerDown={(e) => handlePointerDown(e, 'top')}
      >
        <div className="h-1 w-4 rounded-full bg-primary/0 group-hover:bg-primary/80 transition-colors" />
      </div>
    </>
  );
}