import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Plus, Pencil, Copy, Trash2 } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import type { Screen } from '@/types';
import { DeleteScreenModal } from '@/editor/TopBar';

// Helper function to calculate component count for a specific screen
function getComponentCountForScreen(screen: Screen, components: Record<string, any>): number {
  const allIds = [...new Set([...screen.rootIds.mobile, ...screen.rootIds.desktop])];
  const collect = (ids: string[]): number => {
    let count = 0;
    for (const id of ids) {
      const comp = components[id];
      if (comp) { count += 1 + collect(comp.children); }
    }
    return count;
  };
  return collect(allIds);
}

// multi-screen-AC-3
function ScreenRow({ 
  screen, 
  isActive,
  onDeleteClick
}: { 
  screen: Screen; 
  isActive: boolean;
  onDeleteClick: (screen: Screen) => void;
}) {
  const switchScreen = useCanvasStore((s) => s.switchScreen);
  const renameScreen = useCanvasStore((s) => s.renameScreen);
  const duplicateScreen = useCanvasStore((s) => s.duplicateScreen);
  const screens = useCanvasStore((s) => s.screens);
  const components = useCanvasStore((s) => s.components);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(screen.name);
  const [hovering, setHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const componentCount = [...new Set([...screen.rootIds.mobile, ...screen.rootIds.desktop])].filter(id => components[id]).length;

  useEffect(() => {
    if (editing) {
      setDraft(screen.name);
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [editing, screen.name]);

  const commitRename = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== screen.name) {
      renameScreen(screen.id, trimmed);
    }
    setEditing(false);
  }, [draft, screen.id, screen.name, renameScreen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') { setDraft(screen.name); setEditing(false); }
  };

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -6 }}
        transition={{ duration: 0.12 }}
        className={cn(
          'relative flex items-center gap-1.5 px-2 py-[5px] rounded-md cursor-pointer transition-colors select-none',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-surface-raised hover:text-foreground',
        )}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={() => !editing && switchScreen(screen.id)}
        onDoubleClick={() => setEditing(true)}
      >
        {/* Active indicator — full row height */}
        {isActive && (
          <div className="absolute left-0 inset-y-[2px] w-[3px] bg-primary rounded-full" />
        )}

        <Monitor size={11} className="flex-shrink-0 ml-1" />

        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 text-[11px] bg-surface-raised border border-primary/50 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
          />
        ) : (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <span className="text-[11px] font-medium truncate">{screen.name}</span>
            <span className="text-[9px] text-primary/70 whitespace-nowrap">
              {componentCount} {componentCount === 1 ? 'component' : 'components'}
            </span>
          </div>
        )}

        {/* Actions */}
        {!editing && (hovering || isActive) && (
          <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(true); }}
              title="Rename"
              className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            >
              <Pencil size={9} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); duplicateScreen(screen.id); }}
              title="Duplicate"
              className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            >
              <Copy size={9} />
            </button>
            {screens.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteClick(screen); }}
                title="Delete screen"
                className="w-5 h-5 rounded flex items-center justify-center text-destructive hover:bg-destructive/15 transition-colors"
              >
                <Trash2 size={9} />
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// multi-screen-AC-3
export function ScreensPanel() {
  const screens = useCanvasStore((s) => s.screens);
  const currentScreenId = useCanvasStore((s) => s.currentScreenId);
  const addScreen = useCanvasStore((s) => s.addScreen);
  const deleteScreen = useCanvasStore((s) => s.deleteScreen);
  const components = useCanvasStore((s) => s.components);
  const totalComponents = screens.reduce((sum, sc) =>
    sum + [...new Set([...sc.rootIds.mobile, ...sc.rootIds.desktop])].filter(id => components[id]).length, 0);
  const showNotification = useUIStore((s) => s.showNotification);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [screenToDelete, setScreenToDelete] = useState<Screen | null>(null);

  const handleDeleteClick = useCallback((screen: Screen) => {
    setScreenToDelete(screen);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (screenToDelete) {
      deleteScreen(screenToDelete.id);
      showNotification('success', `"${screenToDelete.name}" deleted`);
    }
    setDeleteModalOpen(false);
    setScreenToDelete(null);
  }, [screenToDelete, deleteScreen, showNotification]);

  const handleCloseModal = useCallback(() => {
    setDeleteModalOpen(false);
    setScreenToDelete(null);
  }, []);

  const componentCountForScreen = screenToDelete 
    ? getComponentCountForScreen(screenToDelete, components) 
    : 0;

  return (
    <div className="pt-2 pb-1">
      <div className="flex items-center justify-between px-3 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Screens
          </span>
          {totalComponents > 0 && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
              {totalComponents} components
            </span>
          )}
        </div>
        <button
          onClick={() => addScreen()}
          title="Add screen"
          className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
        >
          <Plus size={11} />
        </button>
      </div>

      {/* Scrollable list with max-height */}
      <div className="px-2 max-h-[160px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {screens.map((screen) => (
            <ScreenRow
              key={screen.id}
              screen={screen}
              isActive={screen.id === currentScreenId}
              onDeleteClick={handleDeleteClick}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Delete screen modal */}
      {screenToDelete && (
        <DeleteScreenModal
          open={deleteModalOpen}
          screenName={screenToDelete.name}
          componentCount={componentCountForScreen}
          isOnlyScreen={screens.length <= 1}
          onClose={handleCloseModal}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}