import { create } from 'zustand';
import type { UIState, Notification, ComponentType } from '@/types';
import { generateId } from '@/lib/utils';

const UI_STORAGE_KEY = 'frameprompt-ui';

export interface AlignmentGuide {
  axis: 'x' | 'y';
  position: number;
  from: number;
  to: number;
}

interface UIStore extends UIState {
  // Active drag state
  activeDragId: string | null;
  activeSidebarType: ComponentType | null;
  setActiveDrag: (id: string | null, sidebarType: ComponentType | null) => void;

  // Insert position indicator
  insertIndex: number | null;
  insertParentId: string | null;
  insertSide: 'top' | 'bottom' | 'left' | 'right' | null;
  insertAlignment: 'flex-start' | 'center' | 'flex-end' | null;
  setInsertPosition: (parentId: string | null, index: number | null, side?: 'top' | 'bottom' | 'left' | 'right' | null, alignment?: 'flex-start' | 'center' | 'flex-end' | null) => void;

  // Dragged element dimensions (for placeholder skeleton)
  dragActiveHeight: number | null;
  dragActiveWidth: number | null;
  setDragActiveDimensions: (h: number | null, w: number | null) => void;

  // Alignment snap guides
  alignmentGuides: AlignmentGuide[];
  setAlignmentGuides: (guides: AlignmentGuide[]) => void;

  // UI toggles
  toggleSidebar: () => void;
  toggleInspector: () => void;
  setHistoryOpen: (open: boolean) => void;
  setSearchQuery: (q: string) => void;
  setHoveredId: (id: string | null) => void;
  setDragOverId: (id: string | null) => void;
  setIsPanning: (v: boolean) => void;
  setIsResizing: (v: boolean) => void;
  showNotification: (type: Notification['type'], message: string, duration?: number) => void;
  dismissNotification: () => void;
  
  // Split mode: which canvas is active (receives new components)
  splitActiveCanvas: 'mobile' | 'desktop';
  setSplitActiveCanvas: (canvas: 'mobile' | 'desktop') => void;

  // Mobile: which panel sheet is open
  mobilePanelOpen: 'components' | 'inspector' | null;
  setMobilePanelOpen: (panel: 'components' | 'inspector' | null) => void;

  startupModalOpen: boolean;
  setStartupModalOpen: (open: boolean) => void;

  // Tutorial
  tutorialOpen: boolean;
  tutorialStep: number;
  hasSeenTutorial: boolean;
  setTutorialOpen: (open: boolean) => void;
  setTutorialStep: (step: number) => void;
  setHasSeenTutorial: (seen: boolean) => void;
}

// Function to load initial state from localStorage
const getPersistedUIState = () => {
  const initial = {
    sidebarCollapsed: false,
    inspectorCollapsed: false,
    historyOpen: false,
    searchQuery: '',
    hoveredId: null,
    dragOverId: null,
    isPanning: false,
    isResizing: false,
    notification: null,
    activeDragId: null,
    activeSidebarType: null,
    insertIndex: null,
    insertParentId: null,
    insertSide: null,
    insertAlignment: null,
    dragActiveHeight: null,
    dragActiveWidth: null,
    alignmentGuides: [],
    splitActiveCanvas: 'mobile',
    mobilePanelOpen: null,
    startupModalOpen: false,
    tutorialOpen: false,
    tutorialStep: 0,
    hasSeenTutorial: false,
  };

  try {
    const raw = localStorage.getItem(UI_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return { ...initial, hasSeenTutorial: data.hasSeenTutorial ?? false };
    }
  } catch {
    // Ignore corrupted state
  }
  return initial;
};

export const useUIStore = create<UIStore>()((set, get) => ({
  ...getPersistedUIState(),

  setActiveDrag: (id, sidebarType) => set({ activeDragId: id, activeSidebarType: sidebarType }),

  setInsertPosition: (parentId, index, side = null, alignment = null) => set({ insertParentId: parentId, insertIndex: index, insertSide: side, insertAlignment: alignment }),

  setDragActiveDimensions: (dragActiveHeight, dragActiveWidth) => set({ dragActiveHeight, dragActiveWidth }),

  setAlignmentGuides: (guides) => set({ alignmentGuides: guides }),

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleInspector: () => set((s) => ({ inspectorCollapsed: !s.inspectorCollapsed })),
  setHistoryOpen: (open) => set({ historyOpen: open }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setHoveredId: (hoveredId) => set({ hoveredId }),
  setDragOverId: (dragOverId) => set({ dragOverId }),
  setIsPanning: (isPanning) => set({ isPanning }),
  setIsResizing: (isResizing) => set({ isResizing }),

  setSplitActiveCanvas: (canvas) => set({ splitActiveCanvas: canvas }),
  setMobilePanelOpen: (panel) => set({ mobilePanelOpen: panel }),

  setStartupModalOpen: (open) => set({ startupModalOpen: open }),

  // Tutorial
  setTutorialOpen: (open) => set({ tutorialOpen: open }),
  setTutorialStep: (step) => set({ tutorialStep: step }),
  setHasSeenTutorial: (seen) => {
    set({ hasSeenTutorial: seen });
    // Persist to localStorage
    const data = { hasSeenTutorial: seen };
    localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(data));
  },

  showNotification: (type, message, duration = 3000) => {
    const id = generateId('notif');
    set({ notification: { id, type, message, duration } });
    if (duration > 0) {
      setTimeout(() => {
        const current = get().notification;
        if (current?.id === id) set({ notification: null });
      }, duration);
    }
  },

  dismissNotification: () => set({ notification: null }),
}));
