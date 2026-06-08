import { create } from 'zustand';
import type { HistorySnapshot, CanvasState } from '@/types';
import { generateId } from '@/lib/utils';

const STORAGE_KEY = 'frameprompt_history';
const MAX_SNAPSHOTS = 50;

interface HistoryStore {
  snapshots: HistorySnapshot[];
  addSnapshot: (yaml: string, canvasState: CanvasState, description?: string) => HistorySnapshot;
  removeSnapshot: (id: string) => void;
  renameSnapshot: (id: string, name: string) => void;
  renameProjectSnapshots: (projectId: string, name: string) => void;
  getSnapshot: (id: string) => HistorySnapshot | undefined;
  load: () => void;
  save: () => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryStore>()((set, get) => ({
  snapshots: [],

  addSnapshot(yaml, canvasState, description) {
    const { snapshots } = get();
    const projectSnapshots = snapshots.filter(s => s.projectId === canvasState.projectId);
    
    let nextVersion = '0.0.1';
    if (projectSnapshots.length > 0) {
      const lastVersion = projectSnapshots[0].version || '0.0.0';
      const parts = lastVersion.split('.');
      const patch = parseInt(parts[2] || '0', 10);
      nextVersion = `${parts[0]}.${parts[1]}.${patch + 1}`;
    }

    const snapshot: HistorySnapshot = {
      id: generateId('snap'),
      projectId: canvasState.projectId,
      projectName: canvasState.projectName,
      version: nextVersion,
      timestamp: Date.now(),
      yaml,
      canvasState: {
        projectId: canvasState.projectId,
        components: canvasState.components,
        screens: canvasState.screens,
        currentScreenId: canvasState.currentScreenId,
        viewport: canvasState.viewport,
        deviceMode: canvasState.deviceMode,
        projectName: canvasState.projectName,
        frameWidths: canvasState.frameWidths ?? { mobile: 375, desktop: 1280 },
        frameSizes: canvasState.frameSizes ?? { mobile: { w: 375, h: 667 }, desktop: { w: 1280, h: 800 } },
      },
      description,
    };

    set((state) => {
      // Limiting to 50 commits to avoid bloating localStorage
      const newSnapshots = [snapshot, ...state.snapshots].slice(0, 50);
      return { snapshots: newSnapshots };
    });

    get().save();
    return snapshot;
  },

  removeSnapshot(id) {
    set((state) => ({ snapshots: state.snapshots.filter((s) => s.id !== id) }));
    get().save();
  },

  renameSnapshot(id, name) {
    set((state) => ({
      snapshots: state.snapshots.map((s) =>
        s.id === id ? { ...s, projectName: name } : s
      ),
    }));
    get().save();
  },

  renameProjectSnapshots(projectId, name) {
    set((state) => ({
      snapshots: state.snapshots.map((s) =>
        s.projectId === projectId ? { ...s, projectName: name } : s
      ),
    }));
    get().save();
  },

  getSnapshot: (id) => get().snapshots.find((s) => s.id === id),

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      set({ snapshots: Array.isArray(data) ? data : [] });
    } catch {
      // Ignore
    }
  },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(get().snapshots));
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
    set({ snapshots: [] });
  },
}));
