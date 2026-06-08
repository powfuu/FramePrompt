import { type ReactNode, useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCanvasStore } from '@/store/canvasStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

type Edge = 'left' | 'right' | 'top' | 'bottom' | 'none';

interface Props {
  frameKey: 'mobile' | 'desktop';
  label: string;
  children: ReactNode;
}

function countComponents(rootIds: string[], components: any): number {
  let count = 0;
  for (const id of rootIds) {
    count++;
    const comp = components[id];
    if (comp?.children) {
      count += countComponents(comp.children, components);
    }
  }
  return count;
}

export function DeviceFrame({ frameKey, label, children }: Props) {
  const setFrameSize = useCanvasStore((s) => s.setFrameSize);
  const frameSizes = useCanvasStore((s) => s.frameSizes);
  const viewport = useCanvasStore((s) => s.viewport);
  const components = useCanvasStore((s) => s.components);
  const currentScreenId = useCanvasStore((s) => s.currentScreenId);
  const screens = useCanvasStore((s) => s.screens);
  const deviceMode = useCanvasStore((s) => s.deviceMode);
  const splitActiveCanvas = useUIStore((s) => s.splitActiveCanvas);
  const setSplitActiveCanvas = useUIStore((s) => s.setSplitActiveCanvas);

  const isSplit = deviceMode === 'split';
  const isActive = isSplit && splitActiveCanvas === frameKey;
  
  const rootIds = screens.find((sc) => sc.id === currentScreenId)?.rootIds[frameKey] || [];
  const componentCount = countComponents(rootIds, components);

  const size = frameSizes[frameKey];

  const [activeEdge, setActiveEdge] = useState<Edge>('none');
  const [live, setLive] = useState({ w: size.w, h: size.h });
  const dragStart = useRef({ x: 0, y: 0, w: size.w, h: size.h });

  useEffect(() => { setLive({ w: size.w, h: size.h }); }, [size.w, size.h]);

  const startResize = useCallback((e: React.MouseEvent, edge: Edge) => {
    e.preventDefault();
    e.stopPropagation();
    dragStart.current = { x: e.clientX, y: e.clientY, w: live.w, h: live.h };
    setActiveEdge(edge);

    const onMove = (me: MouseEvent) => {
      const dx = (me.clientX - dragStart.current.x) / viewport.zoom;
      const dy = (me.clientY - dragStart.current.y) / viewport.zoom;
      setLive((prev) => {
        const newW = edge === 'right'
          ? Math.max(280, Math.min(3840, Math.round(dragStart.current.w + dx)))
          : edge === 'left'
          ? Math.max(280, Math.min(3840, Math.round(dragStart.current.w - dx)))
          : prev.w;
        const newH = edge === 'bottom'
          ? Math.max(200, Math.min(2160, Math.round(dragStart.current.h + dy)))
          : edge === 'top'
          ? Math.max(200, Math.min(2160, Math.round(dragStart.current.h - dy)))
          : prev.h;
        return { w: newW, h: newH };
      });
    };

    const onUp = (me: MouseEvent) => {
      const dx = (me.clientX - dragStart.current.x) / viewport.zoom;
      const dy = (me.clientY - dragStart.current.y) / viewport.zoom;
      const newW = edge === 'right'
        ? Math.max(280, Math.min(3840, Math.round(dragStart.current.w + dx)))
        : edge === 'left'
        ? Math.max(280, Math.min(3840, Math.round(dragStart.current.w - dx)))
        : dragStart.current.w;
      const newH = edge === 'bottom'
        ? Math.max(200, Math.min(2160, Math.round(dragStart.current.h + dy)))
        : edge === 'top'
        ? Math.max(200, Math.min(2160, Math.round(dragStart.current.h - dy)))
        : dragStart.current.h;
      setFrameSize(frameKey, { w: newW, h: newH });
      setActiveEdge('none');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [live.w, live.h, frameKey, setFrameSize, viewport.zoom]);

  const isResizing = activeEdge !== 'none';

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {/* Size label */}
      <div className="flex items-center gap-2">
        <span className={cn(
          'text-base font-mono transition-colors tracking-wide',
          isResizing ? 'text-primary font-bold' : 'text-muted-foreground/60 font-semibold',
        )}>
          {live.w} × {live.h}
        </span>
        {componentCount > 0 && (
          <span className="text-sm font-semibold text-primary truncate">
            ({componentCount} {componentCount === 1 ? 'component' : 'components'})
          </span>
        )}
        {isSplit && isActive && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
            active
          </span>
        )}
      </div>

      {/* Frame with all-edge resize handles */}
      <div className="relative" style={{ width: live.w + 16, paddingTop: 8, paddingBottom: 8 }}>
        {/* TOP handle */}
        <ResizeHandle
          edge="top"
          active={activeEdge === 'top'}
          onMouseDown={(e) => startResize(e, 'top')}
          style={{ top: 0, left: 12, right: 12, height: 8, cursor: 'ns-resize' }}
          horizontal
        />

        <div className="flex items-stretch">
          {/* LEFT handle */}
          <ResizeHandle
            edge="left"
            active={activeEdge === 'left'}
            onMouseDown={(e) => startResize(e, 'left')}
            style={{ width: 8, flexShrink: 0, cursor: 'ew-resize', alignSelf: 'stretch' }}
            vertical
          />

          {/* The actual frame */}
          <div
            onClick={() => isSplit && setSplitActiveCanvas(frameKey)}
            className={cn(
              'device-frame-scrollable bg-surface-overlay border rounded-xl shadow-2xl overflow-hidden transition-all duration-150 flex-1',
              isResizing && 'shadow-primary/20',
              isSplit && isActive && 'border-primary shadow-[0_0_0_2px] shadow-primary/40',
              isSplit && !isActive && 'border-border/40 cursor-pointer hover:border-border',
              !isSplit && 'border-border/60',
            )}
            style={{
              width: live.w,
              height: live.h,
              transformOrigin: 'top center',
              isolation: 'isolate',
              overflowX: 'hidden',
              overflowY: 'auto',
            }}
          >
            {children}
          </div>

          {/* RIGHT handle */}
          <ResizeHandle
            edge="right"
            active={activeEdge === 'right'}
            onMouseDown={(e) => startResize(e, 'right')}
            style={{ width: 8, flexShrink: 0, cursor: 'ew-resize', alignSelf: 'stretch' }}
            vertical
          />
        </div>

        {/* BOTTOM handle */}
        <ResizeHandle
          edge="bottom"
          active={activeEdge === 'bottom'}
          onMouseDown={(e) => startResize(e, 'bottom')}
          style={{ bottom: 0, left: 12, right: 12, height: 8, cursor: 'ns-resize' }}
          horizontal
        />

        {/* Live size tooltip while dragging */}
        <AnimatePresence>
          {isResizing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-primary text-primary-foreground text-[10px] font-mono font-bold shadow-lg pointer-events-none whitespace-nowrap z-50"
            >
              {live.w} × {live.h}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Resize handle strip ──────────────────────────────────────────────────────

function ResizeHandle({
  edge,
  active,
  onMouseDown,
  style,
  horizontal,
  vertical,
}: {
  edge: Edge;
  active: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  style: React.CSSProperties;
  horizontal?: boolean;
  vertical?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-center justify-center flex-shrink-0"
      style={style}
    >
      <div className="absolute inset-0" />

      {horizontal && (
        <div className={cn(
          'rounded-full transition-all duration-150',
          active ? 'w-12 h-1 bg-primary shadow-[0_0_6px_2px] shadow-primary/50'
            : hovered ? 'w-10 h-0.5 bg-primary/60'
            : 'w-6 h-0.5 bg-border/50',
        )} />
      )}
      {vertical && (
        <div className={cn(
          'rounded-full transition-all duration-150',
          active ? 'h-12 w-1 bg-primary shadow-[0_0_6px_2px] shadow-primary/50'
            : hovered ? 'h-10 w-0.5 bg-primary/60'
            : 'h-6 w-0.5 bg-border/50',
        )} />
      )}
    </div>
  );
}
