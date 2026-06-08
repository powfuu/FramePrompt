import { useState, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Search, ChevronDown, X } from 'lucide-react';
import { COMPONENT_CATEGORIES } from '@/lib/components';
import { useUIStore } from '@/store/uiStore';
import { useIsMobile } from '@/lib/hooks';
import { SidebarItem } from './SidebarItem';
import { ScreensPanel } from './ScreensPanel';
import { cn } from '@/lib/utils';
import type { ComponentDefinition } from '@/types';

const CATEGORIES = [
  { key: 'basic' as const, label: 'Basic', items: COMPONENT_CATEGORIES.basic },
  { key: 'form' as const, label: 'Form', items: COMPONENT_CATEGORIES.form },
  { key: 'feedback' as const, label: 'Feedback', items: COMPONENT_CATEGORIES.feedback },
  { key: 'navigation' as const, label: 'Navigation', items: COMPONENT_CATEGORIES.navigation },
  { key: 'layout' as const, label: 'Layout', items: COMPONENT_CATEGORIES.layout },
  { key: 'blocks' as const, label: 'Blocks', items: COMPONENT_CATEGORIES.blocks },
];

function CategorySection({
  label,
  items,
  defaultOpen = true,
}: {
  label: string;
  items: ComponentDefinition[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        className="flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-muted-foreground transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <span>{label}</span>
        <motion.span animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={12} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-0.5 px-2 pb-2">
              {items.map((def) => (
                <SidebarItem key={def.type} definition={def} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarBody({
  searchQuery,
  setSearchQuery,
  filtered,
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filtered: ComponentDefinition[] | null;
}) {
  return (
    <>
      <ScreensPanel />
      <div className="mx-3 h-px bg-border/60" />
      <div className="px-3 pt-2 pb-2">
        <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1.5">Components</p>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-7 pr-3 py-1.5 text-xs bg-surface-raised border border-border rounded-md placeholder:text-muted-foreground/50 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto border-t border-border/40">
        {filtered !== null ? (
          <div>
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Results ({filtered.length})
            </p>
            <div className="flex flex-col gap-0.5 px-2">
              {filtered.length > 0 ? (
                filtered.map((def) => <SidebarItem key={def.type} definition={def} />)
              ) : (
                <p className="px-3 py-4 text-xs text-muted-foreground/60 text-center">No matches</p>
              )}
            </div>
          </div>
        ) : (
          CATEGORIES.map((cat) => (
            <CategorySection key={cat.key} label={cat.label} items={cat.items} defaultOpen={true} />
          ))
        )}
      </div>
    </>
  );
}

export function MobileSheet({
  title,
  onClose,
  children,
  maxHeight = '82vh',
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;
}) {
  const dragControls = useDragControls();

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/60 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.aside
        className="fixed inset-x-0 bottom-0 bg-surface rounded-t-2xl z-50 flex flex-col overflow-hidden"
        style={{ maxHeight }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0, bottom: 0.3 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 80 || info.velocity.y > 400) onClose();
        }}
      >
        {/* Drag handle — pointer down here starts the drag */}
        <div
          className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="w-10 h-1 rounded-full bg-border/80" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border flex-shrink-0">
          <span className="text-sm font-semibold">{title}</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-surface-raised transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex flex-col flex-1 overflow-hidden">
          {children}
        </div>
      </motion.aside>
    </>
  );
}

export function Sidebar() {
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const mobilePanelOpen = useUIStore((s) => s.mobilePanelOpen);
  const setMobilePanelOpen = useUIStore((s) => s.setMobilePanelOpen);
  const isMobile = useIsMobile();

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return CATEGORIES.flatMap((c) =>
      c.items.filter(
        (d) =>
          d.label.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.type.toLowerCase().includes(q)
      )
    );
  }, [searchQuery]);

  const bodyProps = { searchQuery, setSearchQuery, filtered };

  // ── Mobile: bottom sheet ──────────────────────────────────────────────────
  if (isMobile) {
    const isOpen = mobilePanelOpen === 'components';
    return (
      <AnimatePresence>
        {isOpen && (
          <MobileSheet key="sidebar-sheet" onClose={() => setMobilePanelOpen(null)} title="Components">
            <SidebarBody {...bodyProps} />
          </MobileSheet>
        )}
      </AnimatePresence>
    );
  }

  // ── Desktop: side panel ───────────────────────────────────────────────────
  return (
    <AnimatePresence initial={false}>
      {!sidebarCollapsed && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 220, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="flex-shrink-0 border-r border-border bg-surface overflow-hidden flex flex-col"
        >
          <SidebarBody {...bodyProps} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
