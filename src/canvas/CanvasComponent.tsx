import { memo, useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import type { CanvasComponent } from '@/types';
import { useCanvasStore } from '@/store/canvasStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { ComponentWireframe } from './ComponentWireframe';
import { CanvasChildren } from './CanvasChildren';
import { ResizeHandles } from './ResizeHandles';

interface Props {
  id: string;
  depth?: number;
}

interface ContextMenuState {
  x: number;
  y: number;
}

const CONTAINER_TYPES = new Set(['container', 'row', 'column', 'section', 'card', 'navbar', 'footer', 'hero', 'modal']);

export const CanvasComponentNode = memo(function CanvasComponentNode({ id, depth = 0 }: Props) {
  const component = useCanvasStore((s) => s.components[id]);
  const selectComponent = useCanvasStore((s) => s.selectComponent);
  const removeComponent = useCanvasStore((s) => s.removeComponent);
  const duplicateComponent = useCanvasStore((s) => s.duplicateComponent);
  const reorderComponent = useCanvasStore((s) => s.reorderComponent);

  const setHoveredId = useUIStore((s) => s.setHoveredId);
  const isResizing = useUIStore((s) => s.isResizing);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const isSelected = useCanvasStore((s) => s.selectedIds.includes(id));
  const isHovered = useUIStore((s) => s.hoveredId === id);
  const isDragOver = useUIStore((s) => s.dragOverId === id || s.dragOverId === `droppable-${id}`);
  const insertSide = useUIStore((s) => s.insertSide);
  const isDraggingThis = useUIStore((s) => s.activeDragId === id);
  const isDraggingAny = useUIStore((s) => !!s.activeDragId || !!s.activeSidebarType);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isDraggingSortable,
  } = useSortable({
    id,
    data: { type: 'canvas-component', componentId: id, parentId: component?.parentId, canHaveChildren: CONTAINER_TYPES.has(component.type) },
  });

  if (!component) return null;

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isResizing ? 'none' : (transition || 'transform 250ms cubic-bezier(0.18, 0.67, 0.6, 1.22)'),
  };

  // Apply layout margin, align/justify, width, height, and borderRadius to the main node
  if (component.layout?.margin !== undefined) style.margin = component.layout.margin;
  if (component.layout?.marginTop !== undefined) style.marginTop = component.layout.marginTop;
  if (component.layout?.marginRight !== undefined) style.marginRight = component.layout.marginRight;
  if (component.layout?.marginBottom !== undefined) style.marginBottom = component.layout.marginBottom;
  if (component.layout?.marginLeft !== undefined) style.marginLeft = component.layout.marginLeft;
  if (component.layout?.alignSelf && component.layout.alignSelf !== 'auto') style.alignSelf = component.layout.alignSelf;
  if (component.layout?.justifySelf && component.layout.justifySelf !== 'auto') style.justifySelf = component.layout.justifySelf;
  if (component.layout?.borderRadius !== undefined) style.borderRadius = component.layout.borderRadius;
  
  // Apply width to outer div; 'auto' → fit-content so flex-stretch doesn't expand to 100%
  if (component.layout?.width !== undefined && component.layout?.width !== 'fit') {
    style.width = component.layout.width === 'auto'
      ? 'fit-content'
      : typeof component.layout.width === 'number' ? `${component.layout.width}px` : component.layout.width;
  }
  if (component.layout?.height !== undefined) {
    style.height = typeof component.layout.height === 'number' ? `${component.layout.height}px` : component.layout.height;
  }

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // Only multi-select if explicitly using shift key
      selectComponent(id, e.shiftKey);
    },
    [id, selectComponent]
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setHoveredId(id);
    },
    [id, setHoveredId]
  );

  const handleMouseLeave = useCallback(() => setHoveredId(null), [setHoveredId]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    selectComponent(id);
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, [id, selectComponent]);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const canHaveChildren = CONTAINER_TYPES.has(component.type);

  const parentType = useCanvasStore((s) => (component.parentId ? s.components[component.parentId]?.type : null));
  const isParentRow = parentType === 'row';
  
  const showSideDropPreview = isDragOver && !isDraggingThis && insertSide !== null;

  return (
    <>
      <motion.div
        ref={setNodeRef}
        style={style}
        data-component-id={id}
        className={cn(
          'relative group select-none overflow-visible',
          isDraggingSortable && 'opacity-25 pointer-events-none',
        )}
        {...listeners}
        {...attributes}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
      >
        {/* Resize Handles (only when selected and not dragging) */}
        {isSelected && !isDraggingAny && !isParentRow && <ResizeHandles id={id} />}

        {/* Selection / hover ring */}
        <div
          style={{ borderRadius: component.layout.borderRadius }}
          className={cn(
            'absolute inset-0 pointer-events-none z-10 transition-all duration-100',
            isSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-background shadow-[0_0_0_3px] shadow-primary/10',
            !isSelected && isHovered && !isDraggingAny && 'ring-1 ring-border/80 ring-offset-[0.5px] ring-offset-background',
            isDragOver && !isDraggingThis && !insertSide && canHaveChildren && 'ring-2 ring-primary/80 bg-primary/[0.05] shadow-[inset_0_0_15px_rgba(0,112,243,0.1)]',
          )}
        />
        
        {/* Side Drop Preview (Blue Line Indicator) */}
        <AnimatePresence>
          {showSideDropPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute bg-primary shadow-[0_0_8px_rgba(0,112,243,0.7)] pointer-events-none z-50 rounded-full',
                insertSide === 'left' && 'top-0 bottom-0 -left-[3px] w-[3px]',
                insertSide === 'right' && 'top-0 bottom-0 -right-[3px] w-[3px]',
                insertSide === 'top' && 'left-0 right-0 -top-[3px] h-[3px]',
                insertSide === 'bottom' && 'left-0 right-0 -bottom-[3px] h-[3px]',
              )}
            />
          )}
        </AnimatePresence>


        {/* Wireframe content */}
        <ComponentWireframe component={component} isSelected={isSelected} depth={depth} isResizing={isResizing}>
          {canHaveChildren && (
            <CanvasChildren
              childIds={component.children}
              depth={depth + 1}
              parentId={id}
            />
          )}
        </ComponentWireframe>
      </motion.div>

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={closeContextMenu}
            onDuplicate={() => { duplicateComponent(id); closeContextMenu(); }}
            onDelete={() => { removeComponent(id); closeContextMenu(); }}
            onMoveUp={() => { reorderComponent(id, 'up'); closeContextMenu(); }}
            onMoveDown={() => { reorderComponent(id, 'down'); closeContextMenu(); }}
            componentName={component.name}
          />
        )}
      </AnimatePresence>
    </>
  );
});

// ─── Context Menu ─────────────────────────────────────────────────────────────

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  componentName: string;
}

function ContextMenu({ x, y, onClose, onDuplicate, onDelete, onMoveUp, onMoveDown, componentName }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (!menuRef.current?.contains(e.target as Node)) onClose();
  }, [onClose]);

  // Adjust position so menu stays within viewport
  const adjustedX = Math.min(x, window.innerWidth - 160);
  const adjustedY = Math.min(y, window.innerHeight - 180);

  return (
    <div className="fixed inset-0 z-[200]" onClick={handleBackdropClick}>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.92, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -4 }}
        transition={{ duration: 0.1 }}
        className="absolute w-44 bg-surface-overlay border border-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden"
        style={{ left: adjustedX, top: adjustedY }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-border/60">
          <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider truncate">{componentName}</p>
        </div>

        {/* Actions */}
        <div className="p-1">
          <MenuAction icon={<Copy size={12} />} label="Duplicate" shortcut="⌘D" onClick={onDuplicate} />
          <MenuAction icon={<ArrowUp size={12} />} label="Move up" onClick={onMoveUp} />
          <MenuAction icon={<ArrowDown size={12} />} label="Move down" onClick={onMoveDown} />
          <div className="my-1 border-t border-border/50" />
          <MenuAction icon={<Trash2 size={12} />} label="Delete" shortcut="⌫" onClick={onDelete} danger />
        </div>
      </motion.div>
    </div>
  );
}

function MenuAction({
  icon,
  label,
  shortcut,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
        danger
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-foreground/80 hover:bg-surface-raised hover:text-foreground',
      )}
    >
      <span className={cn('flex-shrink-0', danger ? 'text-red-400' : 'text-muted-foreground')}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {shortcut && <kbd className="text-[9px] text-muted-foreground/50 font-mono">{shortcut}</kbd>}
    </button>
  );
}
