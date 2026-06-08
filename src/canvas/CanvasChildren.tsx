import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import { useCanvasStore } from '@/store/canvasStore';
import { useUIStore } from '@/store/uiStore';
import { CanvasComponentNode } from './CanvasComponent';
import { InsertPlaceholder, InsertLine } from './Canvas';
import { cn } from '@/lib/utils';

interface Props {
  childIds: string[];
  depth: number;
  parentId: string;
}

export function CanvasChildren({ childIds, depth, parentId }: Props) {
  const parentType = useCanvasStore((s) => s.components[parentId]?.type);
  const insertIndex = useUIStore((s) => s.insertIndex);
  const insertParentId = useUIStore((s) => s.insertParentId);
  const activeSidebarType = useUIStore((s) => s.activeSidebarType);
  const activeDragId = useUIStore((s) => s.activeDragId);

  const insertSide = useUIStore((s) => s.insertSide);

  const isDragging = !!(activeSidebarType || activeDragId);
  const draggedComponent = useCanvasStore((s) => activeDragId ? s.components[activeDragId] : null);
  const isSameContainer = draggedComponent ? draggedComponent.parentId === parentId : false;
  // If we are dropping "on the side" (top/bottom/left/right of an item), we don't show the standard list placeholder.
  const showInsert = isDragging && insertParentId === parentId && !isSameContainer && !insertSide;
  const isRow = parentType === 'row';

  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${parentId}`,
    data: { parentId, type: 'container' },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'w-full transition-all duration-300',
        isRow ? 'flex flex-row flex-wrap gap-1 items-start relative' : 'flex flex-col gap-1 items-stretch',
        isOver && isDragging && 'bg-primary/[0.06] rounded-lg shadow-[inset_0_0_20px_rgba(0,112,243,0.12)]',
        childIds.length === 0 && 'min-h-[80px]',
      )}
    >
      <SortableContext
        items={childIds}
        strategy={isRow ? horizontalListSortingStrategy : verticalListSortingStrategy}
      >
        {childIds.length === 0 ? (
          <EmptyDropZone isOver={isOver} isDragging={isDragging} parentId={parentId} />
        ) : (
          childIds.map((id, idx) => {
            return (
              <div key={id} className={cn('relative', isRow ? 'w-auto' : '')}>
                {showInsert && insertIndex === idx && (
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0.5 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="overflow-visible"
                  >
                    <InsertPlaceholder isRow={isRow} />
                  </motion.div>
                )}
                <CanvasComponentNode id={id} depth={depth} />
              </div>
            );
          })
        )}
        {showInsert && insertIndex === childIds.length && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0.5 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="overflow-visible"
          >
            <InsertPlaceholder isRow={isRow} />
          </motion.div>
        )}
      </SortableContext>
    </div>
  );
}

function EmptyDropZone({ isOver, isDragging, parentId }: { isOver: boolean; isDragging: boolean; parentId: string }) {
  const parentType = useCanvasStore((s) => s.components[parentId]?.type ?? 'container');
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 min-h-[80px] w-full rounded transition-all duration-300',
        isDragging
          ? isOver
            ? 'border-2 border-primary bg-primary/10 text-primary scale-[1.02] shadow-[0_0_15px] shadow-primary/20'
            : 'border-2 border-dashed border-primary/50 text-primary/50'
          : 'border border-dashed border-border/40 text-muted-foreground/40',
      )}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      <span className="text-[10px] font-medium transition-colors">
        {isOver && isDragging ? 'Drop here' : `Empty ${parentType}`}
      </span>
    </div>
  );
}
