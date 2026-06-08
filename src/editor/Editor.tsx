import { useEffect, useCallback, useState, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DragMoveEvent,
  type CollisionDetection,
  pointerWithin,
  closestCenter,
} from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Layers, Settings2, Undo2 } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { useHistoryStore } from '@/store/historyStore';
import { useUIStore } from '@/store/uiStore';
import { useIsMobile } from '@/lib/hooks';
import { TopBar } from './TopBar';
import { Sidebar } from '@/sidebar/Sidebar';
import { Inspector } from '@/inspector/Inspector';
import { Canvas } from '@/canvas/Canvas';
import { HistoryPanel } from '@/history/HistoryPanel';
import { Notification } from './Notification';
import type { ComponentType } from '@/types';
import { generateYaml } from '@/yaml/generator';
import { cn } from '@/lib/utils';

import { StartupModal } from './StartupModal';
import { TutorialModal } from './TutorialModal';

export function Editor() {
  const load = useCanvasStore((s) => s.load);
  const save = useCanvasStore((s) => s.save);
  const isDirty = useCanvasStore((s) => s.isDirty);
  const addComponent = useCanvasStore((s) => s.addComponent);
  const reparentComponent = useCanvasStore((s) => s.reparentComponent);
  const loadHistory = useHistoryStore((s) => s.load);

  const setActiveDrag = useUIStore((s) => s.setActiveDrag);
  const setDragOverId = useUIStore((s) => s.setDragOverId);
  const setInsertPosition = useUIStore((s) => s.setInsertPosition);
  const setDragActiveDimensions = useUIStore((s) => s.setDragActiveDimensions);
  const activeDragId = useUIStore((s) => s.activeDragId);
  const activeSidebarType = useUIStore((s) => s.activeSidebarType);
  const insertIndex = useUIStore((s) => s.insertIndex);
  const insertParentId = useUIStore((s) => s.insertParentId);
  const startupModalOpen = useUIStore((s) => s.startupModalOpen);
  const setStartupModalOpen = useUIStore((s) => s.setStartupModalOpen);
  const tutorialOpen = useUIStore((s) => s.tutorialOpen);
  const setTutorialOpen = useUIStore((s) => s.setTutorialOpen);
  const hasSeenTutorial = useUIStore((s) => s.hasSeenTutorial);
  const setMobilePanelOpen = useUIStore((s) => s.setMobilePanelOpen);
  const isMobile = useIsMobile();
  const selectedIds = useCanvasStore((s) => s.selectedIds);

  // Auto-open inspector sheet when a component is selected on mobile
  useEffect(() => {
    if (isMobile && selectedIds.length === 1) {
      setMobilePanelOpen('inspector');
    }
  }, [selectedIds, isMobile, setMobilePanelOpen]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Track real pointer position for accurate before/after detection within the same element
  const pointerPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragMoveRAF = useRef<number | null>(null);

  // Free-placement collision: prefer component nodes so side-drops work on any element
  const collisionDetection: CollisionDetection = useCallback((args) => {
    // Separate actual component nodes from inner container drop zones and root areas
    const componentNodes = args.droppableContainers.filter((c) => {
      const id = c.id as string;
      return !id.startsWith('droppable-') && id !== 'root-desktop' && id !== 'root-mobile';
    });
    const dropZones = args.droppableContainers.filter((c) => {
      const id = c.id as string;
      return id.startsWith('droppable-') || id === 'root-desktop' || id === 'root-mobile';
    });

    // Component nodes first — this is what enables side-drops on any component including containers
    const nodeHits = pointerWithin({ ...args, droppableContainers: componentNodes });
    if (nodeHits.length > 0) {
      // When multiple nested nodes overlap (e.g. card + button inside it), pick the smallest (deepest)
      const best = nodeHits.reduce((a, b) => {
        const ra = a.rect?.current, rb = b.rect?.current;
        if (!ra) return b;
        if (!rb) return a;
        return ra.width * ra.height <= rb.width * rb.height ? a : b;
      });
      return [best];
    }

    // Fall back to inner container zones and root areas (handles empty containers)
    const zoneHits = pointerWithin({ ...args, droppableContainers: dropZones });
    if (zoneHits.length > 0) return zoneHits;

    return closestCenter(args);
  }, []);

  useEffect(() => {
    const handler = (e: PointerEvent) => { pointerPos.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('pointermove', handler);
    return () => window.removeEventListener('pointermove', handler);
  }, []);


  const changeCounter = useCanvasStore((s) => s.changeCounter);
  const [lastSavedCounter, setLastSavedCounter] = useState(changeCounter);

  useEffect(() => {
    if (changeCounter - lastSavedCounter >= 3) {
      const state = useCanvasStore.getState();
      const yaml = generateYaml(state);
      
      const history = state.actionHistory || [];
      let desc = 'Auto-saved changes';
      if (history.length > 0) {
        desc = history.join(' • ');
      }
      
      useHistoryStore.getState().addSnapshot(yaml, state, desc);
      setLastSavedCounter(changeCounter);
      // Clear action history after saving
      useCanvasStore.setState({ actionHistory: [] });
    }
  }, [changeCounter, lastSavedCounter]);

  // Load persisted state on mount
  useEffect(() => {
    load();
    loadHistory();
    // Use setTimeout to ensure state is fully hydrated before checking
    setTimeout(() => {
      setStartupModalOpen(true);
    }, 0);
  }, [load, loadHistory, setStartupModalOpen]);

  // Show tutorial after startup modal closes on first visit
  useEffect(() => {
    if (!startupModalOpen && !hasSeenTutorial && !tutorialOpen) {
      // Small delay to allow smooth transition
      setTimeout(() => {
        setTutorialOpen(true);
      }, 300);
    }
  }, [startupModalOpen, hasSeenTutorial, tutorialOpen, setTutorialOpen]);

  // Keyboard shortcut for tutorial (Cmd+H / Ctrl+H)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault();
        setTutorialOpen(!tutorialOpen);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tutorialOpen, setTutorialOpen]);

  // Auto-save on dirty
  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(() => save(), 1000);
    return () => clearTimeout(timer);
  }, [isDirty, save]);

  // ─── DnD handlers ────────────────────────────────────────────────────────

  const handleDragStart = useCallback((e: DragStartEvent) => {
    document.documentElement.classList.add('dnd-dragging');
    useUIStore.getState().setAlignmentGuides([]);
    if (isMobile) setMobilePanelOpen(null);

    const data = e.active.data.current;
    if (data?.type === 'sidebar-component') {
      setActiveDrag(null, data.componentType as ComponentType);
      setDragActiveDimensions(null, null);
    } else if (data?.type === 'canvas-component') {
      setActiveDrag(e.active.id as string, null);
      const el = document.querySelector(`[data-component-id="${e.active.id}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        setDragActiveDimensions(rect.height, rect.width);
      } else {
        setDragActiveDimensions(null, null);
      }
    }
  }, [setActiveDrag, setDragActiveDimensions, isMobile, setMobilePanelOpen]);

  const computeInsertPosition = useCallback((
    sortableIdx: number,
    overRect: { top: number; bottom: number; left: number; right: number; height: number; width: number },
    parentId: string | null,
    overId: string
  ): { index: number; side: 'top' | 'bottom' | 'left' | 'right' | null; alignment: 'flex-start' | 'center' | 'flex-end' | null } => {
    const parentType = parentId ? useCanvasStore.getState().components[parentId]?.type : null;
    const px = pointerPos.current.x;
    const py = pointerPos.current.y;

    let side: 'top' | 'bottom' | 'left' | 'right' | null = null;
    let alignment: 'flex-start' | 'center' | 'flex-end' | null = null;

    // Side-drop zones apply to any component node (collision detection already filters out drop zones)
    if (parentType !== 'row') {
      const relX = overRect.width > 0 ? (px - overRect.left) / overRect.width : 0.5;
      const SIDE_ZONE = 0.22;
      if (relX < SIDE_ZONE) {
        side = 'left';
      } else if (relX > 1 - SIDE_ZONE) {
        side = 'right';
      } else {
        if (relX < 0.38) alignment = 'flex-start';
        else if (relX > 0.62) alignment = 'flex-end';
        else alignment = 'center';
      }
    }

    if (parentType === 'row') {
      return { index: px < overRect.left + overRect.width / 2 ? sortableIdx : sortableIdx + 1, side, alignment: null };
    }
    return { index: py < overRect.top + overRect.height / 2 ? sortableIdx : sortableIdx + 1, side, alignment };
  }, []);

  const handleDragOver = useCallback((e: DragOverEvent) => {
    const overId = e.over?.id as string | null;
    const overData = e.over?.data?.current;
    setDragOverId(overId ?? null);

    if (overId && overData) {
      const parentId = (overData.parentId as string | null) ?? null;
      let index: number | undefined;
      let side: 'top' | 'bottom' | 'left' | 'right' | null = null;
      let alignment: 'flex-start' | 'center' | 'flex-end' | null = null;
      let effectiveParentId: string | null = parentId;

      if (overData.type === 'container' || overData.type === 'root') {
        // Inner drop zone of a container (empty containers or gap between children)
        if (parentId) {
          index = useCanvasStore.getState().components[parentId]?.children?.length ?? 0;
        } else if (overId === 'root-desktop') {
          index = useCanvasStore.getState().rootIds?.desktop?.length ?? 0;
        } else if (overId === 'root-mobile') {
          index = useCanvasStore.getState().rootIds?.mobile?.length ?? 0;
        }
      } else {
        const sortableIdx = overData?.sortable?.index as number | undefined;
        if (sortableIdx !== undefined && e.over?.rect) {
          const result = computeInsertPosition(sortableIdx, e.over.rect, parentId, overId);
          index = result.index;
          side = result.side;
          alignment = result.alignment;

          // Container component with pointer in center → drop inside it, not as sibling
          if ((overData as any).canHaveChildren && side === null) {
            effectiveParentId = overId;
            const containerComp = useCanvasStore.getState().components[overId];
            const childCount = containerComp?.children?.length ?? 0;
            const relY = e.over.rect.height > 0
              ? (pointerPos.current.y - e.over.rect.top) / e.over.rect.height
              : 0.5;
            index = relY < 0.5 ? 0 : childCount;
          }
        }
      }

      const idx = index ?? null;
      const cur = useUIStore.getState();
      if (cur.insertParentId !== effectiveParentId || cur.insertIndex !== idx || cur.insertSide !== side || cur.insertAlignment !== alignment) {
        setInsertPosition(effectiveParentId, idx, side, alignment);
      }
    } else {
      const cur = useUIStore.getState();
      if (cur.insertParentId !== null || cur.insertIndex !== null) {
        setInsertPosition(null, null, null, null);
      }
    }
  }, [setDragOverId, setInsertPosition, computeInsertPosition]);

  // onDragMove fires on every pointer move — handles before/after updates within the same element
  const handleDragMove = useCallback((e: DragMoveEvent) => {
    const overData = e.over?.data?.current;
    if (!overData || overData.type === 'container' || overData.type === 'root') return;
    const sortableIdx = overData?.sortable?.index as number | undefined;
    if (sortableIdx === undefined || !e.over?.rect) return;

    const parentId = (overData.parentId as string | null) ?? null;
    const overRect = e.over.rect;
    const overId = e.over.id as string;

    if (dragMoveRAF.current !== null) return; // throttle to 1/frame
    dragMoveRAF.current = requestAnimationFrame(() => {
      dragMoveRAF.current = null;
      const { index: baseIndex, side, alignment } = computeInsertPosition(sortableIdx, overRect, parentId, overId);

      let effectiveParentId: string | null = parentId;
      let index = baseIndex;

      // Container component with pointer in center → drop inside it
      if ((overData as any).canHaveChildren && side === null) {
        effectiveParentId = overId;
        const containerComp = useCanvasStore.getState().components[overId];
        const childCount = containerComp?.children?.length ?? 0;
        const relY = overRect.height > 0 ? (pointerPos.current.y - overRect.top) / overRect.height : 0.5;
        index = relY < 0.5 ? 0 : childCount;
      }

      const cur = useUIStore.getState();
      if (cur.insertParentId === effectiveParentId && cur.insertIndex === index && cur.insertSide === side && cur.insertAlignment === alignment) return;
      setInsertPosition(effectiveParentId, index, side, alignment);
    });
  }, [computeInsertPosition, setInsertPosition]);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    document.documentElement.classList.remove('dnd-dragging');

    const { active, over } = e;

    const prevActiveSidebarType = activeSidebarType;
    const prevActiveDragId = activeDragId;
    // Read directly from store — reactive state may be stale (handleDragMove uses RAF)
    const prevInsertIndex = useUIStore.getState().insertIndex;
    const prevInsertParentId = useUIStore.getState().insertParentId;
    const prevInsertSide = useUIStore.getState().insertSide;
    const prevInsertAlignment = useUIStore.getState().insertAlignment;

    // Clear all drag state
    if (dragMoveRAF.current !== null) { cancelAnimationFrame(dragMoveRAF.current); dragMoveRAF.current = null; }
    setActiveDrag(null, null);
    setDragOverId(null);
    setInsertPosition(null, null, null, null);
    setDragActiveDimensions(null, null);
    useUIStore.getState().setAlignmentGuides([]);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;
    
    // Determine device from over.id if it's root-mobile or root-desktop
    let device: 'mobile' | 'desktop' | undefined;
    if (over.id === 'root-mobile') {
      device = 'mobile';
    } else if (over.id === 'root-desktop') {
      device = 'desktop';
    }

    // Side Drop Logic (Auto-wrap)
    if (prevInsertSide && over.id && overData?.type === 'canvas-component') {
      const targetId = over.id as string;
      const type = (prevActiveSidebarType ?? activeData?.componentType) as ComponentType;

      if (prevActiveSidebarType || activeData?.type === 'sidebar-component') {
        useCanvasStore.getState().insertNextTo(null, type, targetId, prevInsertSide);
      } else {
        useCanvasStore.getState().insertNextTo(active.id as string, null, targetId, prevInsertSide);
      }
      return;
    }

    // Sidebar → canvas
    if (prevActiveSidebarType || activeData?.type === 'sidebar-component') {
      const type = (prevActiveSidebarType ?? activeData?.componentType) as ComponentType;
      const parentId = prevInsertParentId ?? (overData?.parentId as string | null) ?? null;
      const idx = prevInsertIndex ?? undefined;
      const newId = addComponent(type, parentId ?? undefined, undefined, idx, device);
      
      if (prevInsertAlignment && newId) {
        useCanvasStore.getState().setAlignment(newId, prevInsertAlignment);
      }
      return;
    }

    // Canvas reorder / reparent
    if ((prevActiveDragId || activeData?.type === 'canvas-component') && active.id !== over.id) {
      const id = (prevActiveDragId ?? active.id) as string;
      const newParentId = prevInsertParentId ?? (overData?.parentId as string | null) ?? null;
      const idx = prevInsertIndex ?? undefined;
      reparentComponent(id, newParentId, idx, device);
      
      if (prevInsertAlignment) {
        useCanvasStore.getState().setAlignment(id, prevInsertAlignment);
      }
    }
  }, [activeSidebarType, activeDragId, insertIndex, insertParentId, addComponent, reparentComponent, setActiveDrag, setDragOverId, setInsertPosition, setDragActiveDimensions]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
        <TopBar />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar />
          <Canvas />
          <Inspector />
        </div>
        <MobileBottomBar />
        <HistoryPanel />
        <Notification />
      </div>

      {/* Global DragOverlay — renders at root so it's above everything */}
      <DragOverlay modifiers={[snapCenterToCursor]} dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        <DragOverlayContent />
      </DragOverlay>

      <StartupModal open={startupModalOpen} onClose={() => setStartupModalOpen(false)} />
      <TutorialModal />
    </DndContext>
  );
}

function MobileBottomBar() {
  const isMobile = useIsMobile();
  const mobilePanelOpen = useUIStore((s) => s.mobilePanelOpen);
  const setMobilePanelOpen = useUIStore((s) => s.setMobilePanelOpen);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const undo = useCanvasStore((s) => s.undo);
  const past = useCanvasStore((s) => s.past);

  if (!isMobile) return null;

  const toggle = (panel: 'components' | 'inspector') =>
    setMobilePanelOpen(mobilePanelOpen === panel ? null : panel);

  return (
    <div className="flex-shrink-0 h-14 flex items-center justify-around bg-surface border-t border-border px-2 safe-area-inset-bottom">
      <button
        onClick={() => toggle('components')}
        className={cn(
          'flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-colors',
          mobilePanelOpen === 'components' ? 'text-primary bg-primary/10' : 'text-muted-foreground',
        )}
      >
        <Layers size={20} />
        <span className="text-[10px] font-medium">Components</span>
      </button>

      <button
        onClick={() => undo()}
        disabled={past.length === 0}
        className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl text-muted-foreground disabled:opacity-30 transition-colors"
      >
        <Undo2 size={20} />
        <span className="text-[10px] font-medium">Undo</span>
      </button>

      <button
        onClick={() => toggle('inspector')}
        className={cn(
          'flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-colors',
          mobilePanelOpen === 'inspector'
            ? 'text-primary bg-primary/10'
            : selectedIds.length > 0
            ? 'text-foreground'
            : 'text-muted-foreground',
        )}
      >
        <Settings2 size={20} />
        <span className="text-[10px] font-medium">Inspector</span>
      </button>
    </div>
  );
}

function DragOverlayContent() {
  const activeDragId = useUIStore((s) => s.activeDragId);
  const activeSidebarType = useUIStore((s) => s.activeSidebarType);
  const component = useCanvasStore((s) => activeDragId ? s.components[activeDragId] : null);

  const label = component?.name ?? activeSidebarType ?? '';
  const type = component?.type ?? activeSidebarType ?? '';

  if (!label && !type) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-surface-overlay border border-primary/60 rounded-xl shadow-2xl shadow-black/60 text-xs font-semibold text-foreground pointer-events-none select-none backdrop-blur-md max-w-[200px] min-w-[80px]">
      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 shadow-[0_0_6px] shadow-primary/80" />
      <span className="truncate">{label || type}</span>
    </div>
  );
}
