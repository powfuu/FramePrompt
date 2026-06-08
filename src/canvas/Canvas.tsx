import { useCallback, useRef, useEffect, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { useCanvasStore } from '@/store/canvasStore';
import { useUIStore } from '@/store/uiStore';
import { CanvasComponentNode } from './CanvasComponent';
import type { ComponentType } from '@/types';
import { cn } from '@/lib/utils';
import { DeviceFrame } from './DeviceFrame';
import { COMPONENT_DEFINITIONS } from '@/lib/components';

export function Canvas() {
  const projectId = useCanvasStore((s) => s.projectId);
  const currentScreenId = useCanvasStore((s) => s.currentScreenId);
  const rootIds = useCanvasStore((s) => {
    const screen = s.screens.find((sc) => sc.id === s.currentScreenId);
    return screen?.rootIds ?? { mobile: [], desktop: [] };
  });
  const viewport = useCanvasStore((s) => s.viewport);
  const deviceMode = useCanvasStore((s) => s.deviceMode);
  const frameWidths = useCanvasStore((s) => s.frameWidths);
  const frameSizes = useCanvasStore((s) => s.frameSizes);
  const selectNone = useCanvasStore((s) => s.selectNone);
  const setZoom = useCanvasStore((s) => s.setZoom);
  const setPan = useCanvasStore((s) => s.setPan);
  const removeComponent = useCanvasStore((s) => s.removeComponent);
  const duplicateComponent = useCanvasStore((s) => s.duplicateComponent);
  const resetViewport = useCanvasStore((s) => s.resetViewport);

  // Handle window resize for large screen zoom and initial load
  useEffect(() => {
    resetViewport();
    
    const handleResize = () => {
      resetViewport();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [resetViewport]);

  const isPanning = useUIStore((s) => s.isPanning);
  const setIsPanning = useUIStore((s) => s.setIsPanning);
  const activeDragId = useUIStore((s) => s.activeDragId);
  const activeSidebarType = useUIStore((s) => s.activeSidebarType);
  const alignmentGuides = useUIStore((s) => s.alignmentGuides);

  const canvasRef = useRef<HTMLDivElement>(null);
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  // ─── Ctrl+Scroll zoom ─────────────────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      const current = useCanvasStore.getState().viewport.zoom;
      const delta = -e.deltaY * 0.0008;
      useCanvasStore.getState().setZoom(current * (1 + delta));
    } else {
      // Allow scrolling if the target is within a scrollable element
      const target = e.target as HTMLElement;
      if (target && target.closest && target.closest('.device-frame-scrollable')) {
        // Let it scroll natively! Don't prevent default.
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      const state = useCanvasStore.getState();
      useCanvasStore.getState().setPan(
        state.viewport.panX - e.deltaX,
        state.viewport.panY - e.deltaY,
      );
    }
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const isTyping = () =>
      ['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement as HTMLElement)?.tagName ?? '');

    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !isTyping()) {
        e.preventDefault();
        setIsPanning(true);
      }
      if (!isTyping()) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          const ids = useCanvasStore.getState().selectedIds;
          if (ids.length > 0) {
            e.preventDefault(); // Prevent browser 'back' navigation
            useCanvasStore.getState().removeComponents(ids);
          }
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
          e.preventDefault();
          const ids = useCanvasStore.getState().selectedIds;
          if (ids.length > 0) duplicateComponent(ids[0]);
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          useCanvasStore.getState().undo();
        }
        if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
          e.preventDefault();
          useCanvasStore.getState().redo();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
          e.preventDefault();
          useCanvasStore.getState().selectAll();
        }
        if (e.key === 'Escape') {
          useCanvasStore.getState().selectNone();
        }
      }
    };
    const upHandler = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsPanning(false);
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('keyup', upHandler);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [removeComponent, setIsPanning, duplicateComponent]);

  // ─── Pan (middle mouse or space+drag) ─────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (isPanning && e.button === 0)) {
      e.preventDefault();
      const state = useCanvasStore.getState();
      panStart.current = { x: e.clientX, y: e.clientY, panX: state.viewport.panX, panY: state.viewport.panY };
    }
  }, [isPanning]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (panStart.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan(panStart.current.panX + dx, panStart.current.panY + dy);
    }
  }, [setPan]);

  const handleMouseUp = useCallback(() => { panStart.current = null; }, []);

  const isDragging = !!activeDragId || !!activeSidebarType;

  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // ─── Drag to select multiple ──────────────────────────────────────────────
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Left click only and not panning
    if (e.button !== 0 || isPanning) return;
    
    // We only want to start drag selection if we click directly on the canvas background.
    // Ensure the target is actually the background element or a non-interactive wrapper.
    const target = e.target as HTMLElement;
    const isClickingOnComponent = target.closest('[data-component-id]') !== null;
    
    // Check if we hit the actual canvas background layer
    if (!isClickingOnComponent || e.target === e.currentTarget) {
      setDragStartPos({ x: e.clientX, y: e.clientY });
      setIsSelecting(false); // Will become true on first move
    }
  }, [isPanning]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    // If we have a start position but haven't marked as dragging yet
    if (dragStartPos && !isSelecting) {
      // Calculate distance moved to avoid accidental drags on simple clicks
      const dx = Math.abs(e.clientX - dragStartPos.x);
      const dy = Math.abs(e.clientY - dragStartPos.y);
      // Trigger drag selection immediately if mouse moves even a tiny bit (2px)
      if (dx > 2 || dy > 2) {
        setIsSelecting(true);
      }
    }
  }, [dragStartPos, isSelecting]);

  const handleCanvasMouseUp = useCallback((e: React.MouseEvent) => {
    // If we're not tracking a drag start, we don't care
    if (!dragStartPos) {
      // Handle simple click-to-deselect if we click on background
      const target = e.target as HTMLElement;
      const isClickingOnComponent = target.closest('[data-component-id]') !== null;
      if (!isClickingOnComponent && !e.shiftKey) {
        selectNone();
      }
      return;
    }

    if (isSelecting) {
      // We actually dragged
      setIsSelecting(false);
      
      const endX = e.clientX;
      const endY = e.clientY;
      
      const left = Math.min(dragStartPos.x, endX);
      const right = Math.max(dragStartPos.x, endX);
      const top = Math.min(dragStartPos.y, endY);
      const bottom = Math.max(dragStartPos.y, endY);

      // Only do selection if we actually dragged a box
      if (right - left > 2 || bottom - top > 2) {
        const selectedIds: string[] = [];
        document.querySelectorAll('[data-component-id]').forEach(el => {
          const rect = el.getBoundingClientRect();
          // Check for intersection
          const isInside = !(
            rect.right < left || 
            rect.left > right || 
            rect.bottom < top || 
            rect.top > bottom
          );
          if (isInside) {
            const id = el.getAttribute('data-component-id');
            if (id) selectedIds.push(id);
          }
        });
        
        if (selectedIds.length > 0) {
          // If shift is pressed, append to selection. Otherwise replace.
          if (e.shiftKey) {
            const currentSelected = useCanvasStore.getState().selectedIds;
            const newSelection = Array.from(new Set([...currentSelected, ...selectedIds]));
            useCanvasStore.setState({ selectedIds: newSelection });
          } else {
            useCanvasStore.setState({ selectedIds });
          }
        } else if (!e.shiftKey) {
          // If we dragged in empty space and shift is not pressed, clear selection
          selectNone();
        }
      }
    } else {
      // It was just a click (mouse didn't move enough to trigger drag)
      if (!e.shiftKey) {
        selectNone();
      }
    }
    
    setDragStartPos(null);
  }, [dragStartPos, isSelecting, selectNone]);

  return (
    <div
      ref={canvasRef}
      className={cn(
        'relative flex-1 overflow-hidden canvas-grid-dark bg-background',
        isDragging ? 'cursor-grabbing' : isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
        dragStartPos && !isDragging && 'cursor-crosshair'
      )}
      onMouseDown={(e) => {
        handleMouseDown(e);
        handleCanvasMouseDown(e);
      }}
      onMouseMove={(e) => {
        handleMouseMove(e);
        handleCanvasMouseMove(e);
      }}
      onMouseUp={(e) => {
        handleMouseUp();
        handleCanvasMouseUp(e);
      }}
      onMouseLeave={(e) => {
        handleMouseUp();
        if (isSelecting) {
          setIsSelecting(false);
          setDragStartPos(null);
        }
      }}
      data-canvas-bg="true"
    >
      {/* Transform container */}
      <motion.div
        key={currentScreenId}
        className={cn(
          "absolute inset-0 flex justify-center",
          deviceMode === 'split' ? "items-center" : "items-start pt-12"
        )}
        style={{
          transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,
          transformOrigin: deviceMode === 'split' ? '50% 50%' : '50% 0',
          willChange: 'transform',
        }}
      >
        {deviceMode === 'split' ? (
          <div
            key={`split-${projectId}`}
            className="flex gap-12 items-center"
          >
            <DeviceFrame
              frameKey="mobile"
              label={`Mobile · ${frameSizes.mobile.w}px`}
            >
              <CanvasContent rootIds={rootIds?.mobile || []} containerId="root-mobile" />
            </DeviceFrame>
            <DeviceFrame
              frameKey="desktop"
              label={`Desktop · ${frameSizes.desktop.w}px`}
            >
              <CanvasContent rootIds={rootIds?.desktop || []} containerId="root-desktop" />
            </DeviceFrame>
          </div>
        ) : (
          <div
            key={`${deviceMode}-${projectId}`}
            className="flex"
          >
            <DeviceFrame
              frameKey={deviceMode === 'mobile' ? 'mobile' : 'desktop'}
              label={deviceMode === 'mobile'
                ? `Mobile · ${frameSizes.mobile.w}px`
                : `Desktop · ${frameSizes.desktop.w}px`}
            >
              <CanvasContent 
                rootIds={deviceMode === 'mobile' ? (rootIds?.mobile || []) : (rootIds?.desktop || [])} 
                containerId={`root-${deviceMode}`} 
              />
            </DeviceFrame>
          </div>
        )}
      </motion.div>

      {/* Drag Selection Box overlay */}
      {dragStartPos && isSelecting && (
        <SelectionBox startPos={dragStartPos} />
      )}

      {/* Alignment Guides overlay (Figma-style) */}
      {alignmentGuides.map((guide, i) => (
        <div
          key={i}
          className="absolute bg-primary z-[999]"
          style={{
            left: guide.axis === 'x' ? guide.position : 0,
            top: guide.axis === 'y' ? guide.position : 0,
            width: guide.axis === 'x' ? 1 : '100%',
            height: guide.axis === 'y' ? 1 : '100%',
          }}
        />
      ))}

      {/* Center view button — top right */}
      <button
        onClick={() => useCanvasStore.getState().resetViewport()}
        className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary/10 border border-primary/20 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors backdrop-blur-sm"
        title="Center view (reset zoom & pan)"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
        Center
      </button>

      {/* Zoom indicator */}
      <AnimatePresence>
        {viewport.zoom !== 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-4 right-4 px-2 py-1 rounded-md bg-surface-overlay border border-border text-xs text-muted-foreground pointer-events-none select-none font-mono"
          >
            {Math.round(viewport.zoom * 100)}%
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimap hint — desktop only */}
      <div className="hidden md:block absolute bottom-4 left-4 text-[10px] text-muted-foreground/40 select-none pointer-events-none">
        ⌘+scroll to zoom · Space+drag to pan
      </div>
    </div>
  );
}

// ─── Canvas content (the droppable root) ──────────────────────────────────────

function CanvasContent({ rootIds, containerId }: { rootIds: string[]; containerId: string }) {
  const insertIndex = useUIStore((s) => s.insertIndex);
  const insertParentId = useUIStore((s) => s.insertParentId);
  const activeSidebarType = useUIStore((s) => s.activeSidebarType);
  const activeDragId = useUIStore((s) => s.activeDragId);

  const insertSide = useUIStore((s) => s.insertSide);

  const isDragging = !!(activeSidebarType || activeDragId);
  const draggedComponent = useCanvasStore((s) => activeDragId ? s.components[activeDragId] : null);
  const isSameContainer = draggedComponent ? (draggedComponent.parentId === null && rootIds.includes(activeDragId as string)) : false;
  // Don't show the root placeholder if we are side-dropping on a specific item
  const showInsert = isDragging && insertParentId === null && !isSameContainer && !insertSide;

  const { setNodeRef, isOver } = useDroppable({
    id: containerId,
    data: { parentId: null, type: 'root' },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'w-full flex flex-col gap-1 min-h-[500px] p-2 transition-all duration-300 rounded-xl',
        isOver && 'bg-primary/[0.03] shadow-[inset_0_0_30px_rgba(0,112,243,0.08)]',
      )}
    >
      <SortableContext items={rootIds} strategy={verticalListSortingStrategy}>
        {rootIds.map((id, idx) => {
          return (
            <div key={id} className="relative">
              {showInsert && insertIndex === idx && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0.5 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="overflow-visible"
                >
                  <InsertPlaceholder isRow={false} />
                </motion.div>
              )}
              <CanvasComponentNode id={id} depth={0} />
            </div>
          );})}
        {showInsert && insertIndex === rootIds.length && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0.5 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="overflow-visible"
          >
            <InsertPlaceholder isRow={false} />
          </motion.div>
        )}
      </SortableContext>

      {rootIds.length === 0 && !isDragging && <EmptyCanvas />}

      {rootIds.length === 0 && isDragging && (
        <DropZoneHint />
      )}
    </div>
  );
}

export function InsertLine({ isRow }: { isRow?: boolean }) {
  return (
    <div
      className={cn(
        'relative pointer-events-none z-[60] overflow-visible',
        isRow ? 'w-0 self-stretch flex-shrink-0' : 'h-0 w-full',
      )}
    >
      {isRow ? (
        <div className="absolute top-1 bottom-1 left-0 w-[3px] -translate-x-1/2 rounded-full bg-primary shadow-[0_0_6px_rgba(0,112,243,0.6)]">
          <div className="absolute -top-[4px] left-1/2 -translate-x-1/2 w-[8px] h-[8px] rounded-full bg-primary ring-2 ring-background" />
          <div className="absolute -bottom-[4px] left-1/2 -translate-x-1/2 w-[8px] h-[8px] rounded-full bg-primary ring-2 ring-background" />
        </div>
      ) : (
        <div className="absolute inset-x-2 top-0 h-[3px] -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,112,243,0.7)]">
          <div className="absolute -left-[4px] top-1/2 -translate-y-1/2 w-[8px] h-[8px] rounded-full bg-primary ring-2 ring-background" />
          <div className="absolute -right-[4px] top-1/2 -translate-y-1/2 w-[8px] h-[8px] rounded-full bg-primary ring-2 ring-background" />
        </div>
      )}
    </div>
  );
}

export function InsertPlaceholder({ isRow }: { isRow?: boolean }) {
  return (
    <div
      className={cn(
        'pointer-events-none z-[60] flex-shrink-0 relative',
        isRow
          ? 'w-0 self-stretch flex items-stretch mx-0.5'
          : 'h-0 w-full flex items-center my-0.5',
      )}
    >
      {isRow ? (
        <div className="w-[3px] self-stretch rounded-full bg-primary shadow-[0_0_10px_rgba(0,112,243,0.9)] relative">
          <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-[10px] h-[10px] rounded-full bg-primary ring-2 ring-background shadow-[0_0_6px] shadow-primary/80" />
          <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-[10px] h-[10px] rounded-full bg-primary ring-2 ring-background shadow-[0_0_6px] shadow-primary/80" />
        </div>
      ) : (
        <div className="relative w-full h-[3px] rounded-full bg-primary shadow-[0_0_10px_rgba(0,112,243,0.9)]">
          <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full bg-primary ring-2 ring-background shadow-[0_0_6px] shadow-primary/80" />
          <div className="absolute -right-[5px] top-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full bg-primary ring-2 ring-background shadow-[0_0_6px] shadow-primary/80" />
        </div>
      )}
    </div>
  );
}

function DropZoneHint() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-primary/50 rounded-xl bg-primary/5 mx-2 shadow-[0_0_20px] shadow-primary/10"
    >
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-primary">Drop here</p>
    </motion.div>
  );
}

function EmptyCanvas() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-24 text-center group"
    >
      <div className="w-12 h-12 rounded-xl bg-surface-raised border border-border flex items-center justify-center mb-4 group-hover:border-primary/50 group-hover:bg-primary/5 transition-colors pointer-events-none">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground group-hover:text-primary transition-colors">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      </div>
      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors pointer-events-none">Start building</p>
      <p className="text-xs text-muted-foreground/60 mt-1 max-w-[160px] pointer-events-none">Drag components here to begin</p>
    </motion.div>
  );
}

// ─── Drag Selection Box ────────────────────────────────────────────────────────

function SelectionBox({ startPos }: { startPos: { x: number; y: number } }) {
  const [currentPos, setCurrentPos] = useState({ x: startPos.x, y: startPos.y });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setCurrentPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const left = Math.min(startPos.x, currentPos.x);
  const top = Math.min(startPos.y, currentPos.y);
  const width = Math.abs(currentPos.x - startPos.x);
  const height = Math.abs(currentPos.y - startPos.y);

  if (width < 5 && height < 5) return null;

  return (
    <div
      className="fixed z-[200] border border-primary bg-primary/10 pointer-events-none"
      style={{
        left,
        top,
        width,
        height,
      }}
    />
  );
}
