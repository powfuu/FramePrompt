import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { CanvasComponent, CanvasState, ComponentType, DeviceMode, Project, Screen } from '@/types';
import { createComponent } from '@/lib/componentFactory';
import { generateId, deepClone, snapToGrid } from '@/lib/utils';
import { useProjectStore } from './projectStore';
import { useHistoryStore } from './historyStore';
import { useUIStore } from './uiStore';
import { generateYaml } from '@/yaml/generator';

const STORAGE_KEY = 'frameprompt_canvas';

// ─── Internal undo entry ──────────────────────────────────────────────────────

interface UndoEntry {
  components: Record<string, CanvasComponent>;
  screens: Screen[];
  currentScreenId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getActiveRootIds(screens: Screen[], currentScreenId: string) {
  return (
    screens.find((s) => s.id === currentScreenId)?.rootIds ?? {
      mobile: [] as string[],
      desktop: [] as string[],
    }
  );
}

function updateActiveRootIds(
  screens: Screen[],
  currentScreenId: string,
  newRootIds: { mobile: string[]; desktop: string[] },
): Screen[] {
  return screens.map((s) =>
    s.id === currentScreenId ? { ...s, rootIds: newRootIds } : s,
  );
}

function makeHomeScreen(): Screen {
  return { id: generateId('screen'), name: 'Home', rootIds: { mobile: [], desktop: [] } };
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface CanvasStore extends CanvasState {
  changeCounter: number;
  lastActionDescription: string | null;
  actionHistory: string[];
  past: UndoEntry[];
  future: UndoEntry[];

  // Component operations
  addActionToHistory: (desc: string) => void;
  addComponent: (type: ComponentType, parentId?: string, position?: { x: number; y: number }, insertIndex?: number, device?: 'mobile' | 'desktop') => string;
  removeComponent: (id: string) => void;
  removeComponents: (ids: string[]) => void;
  updateComponent: (id: string, patch: Partial<CanvasComponent>) => void;
  duplicateComponent: (id: string) => string;
  moveComponent: (id: string, parentId: string | null, index?: number) => void;
  reparentComponent: (id: string, newParentId: string | null, insertIndex?: number, device?: 'mobile' | 'desktop') => void;
  reorderComponent: (id: string, direction: 'up' | 'down') => void;
  insertNextTo: (draggedId: string | null, newType: ComponentType | null, targetId: string, side: 'left' | 'right' | 'top' | 'bottom') => void;
  setAlignment: (id: string, alignSelf: 'auto' | 'flex-start' | 'center' | 'flex-end' | 'stretch') => void;

  // Screen operations
  addScreen: (name?: string) => string;
  deleteScreen: (id: string) => void;
  renameScreen: (id: string, name: string) => void;
  duplicateScreen: (id: string) => void;
  switchScreen: (id: string) => void;

  // Selection
  selectComponent: (id: string, multi?: boolean) => void;
  selectNone: () => void;
  selectAll: () => void;

  // Viewport
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetViewport: () => void;

  // Device
  setDeviceMode: (mode: DeviceMode) => void;
  setFrameWidth: (frame: 'mobile' | 'desktop', width: number) => void;
  setFrameSize: (frame: 'mobile' | 'desktop', size: Partial<{ w: number; h: number }>) => void;

  // Project
  setProjectName: (name: string) => void;

  // Undo/redo
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // Persistence
  save: () => void;
  load: () => void;
  reset: () => void;
  clearComponents: () => void;
  newProject: () => void;
  loadProject: (project: Project) => void;
}

// ─── Initial state ────────────────────────────────────────────────────────────

function getInitialState(): Omit<CanvasState, 'isDirty'> {
  const home = makeHomeScreen();
  return {
    projectId: generateId('proj'),
    components: {},
    screens: [home],
    currentScreenId: home.id,
    selectedIds: [],
    viewport: { zoom: 0.53, panX: 0, panY: -40 },
    deviceMode: 'split',
    projectName: 'Untitled Project',
    frameWidths: { mobile: 480, desktop: 1318 },
    frameSizes: { mobile: { w: 480, h: 770 }, desktop: { w: 1318, h: 801 } },
  };
}

function collectDescendants(id: string, components: Record<string, CanvasComponent>): string[] {
  const comp = components[id];
  if (!comp) return [];
  const ids: string[] = [id];
  for (const childId of comp.children) {
    ids.push(...collectDescendants(childId, components));
  }
  return ids;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCanvasStore = create<CanvasStore>()(
  subscribeWithSelector((set, get) => ({
    ...getInitialState(),
    isDirty: false,
    changeCounter: 0,
    lastActionDescription: null,
    actionHistory: [],
    past: [],
    future: [],

    pushHistory() {
      const { components, screens, currentScreenId, past, changeCounter } = get();
      const entry: UndoEntry = {
        components: deepClone(components),
        screens: deepClone(screens),
        currentScreenId,
      };
      set({ past: [...past.slice(-49), entry], future: [], isDirty: true, changeCounter: changeCounter + 1 });
    },

    addActionToHistory(desc) {
      set((state) => ({
        actionHistory: [...state.actionHistory, desc].slice(-3),
        lastActionDescription: desc,
      }));
    },

    undo() {
      const { past, future, components, screens, currentScreenId } = get();
      if (past.length === 0) return;
      const prev = past[past.length - 1];
      const current: UndoEntry = { components: deepClone(components), screens: deepClone(screens), currentScreenId };
      set({
        components: prev.components,
        screens: prev.screens,
        currentScreenId: prev.currentScreenId,
        past: past.slice(0, -1),
        future: [current, ...future.slice(0, 49)],
        isDirty: true,
      });
    },

    redo() {
      const { past, future, components, screens, currentScreenId } = get();
      if (future.length === 0) return;
      const next = future[0];
      const current: UndoEntry = { components: deepClone(components), screens: deepClone(screens), currentScreenId };
      set({
        components: next.components,
        screens: next.screens,
        currentScreenId: next.currentScreenId,
        past: [...past.slice(-49), current],
        future: future.slice(1),
        isDirty: true,
      });
    },

    addComponent(type, parentId, position, insertIndex, device) {
      get().pushHistory();
      const comp = createComponent(type);

      if (position) {
        comp.layout.x = snapToGrid(position.x);
        comp.layout.y = snapToGrid(position.y);
      }
      if (parentId) comp.parentId = parentId;

      set((state) => {
        const components = { ...state.components, [comp.id]: comp };

        if (parentId && components[parentId]) {
          const existingChildren = [...components[parentId].children];
          if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= existingChildren.length) {
            existingChildren.splice(insertIndex, 0, comp.id);
          } else {
            existingChildren.push(comp.id);
          }
          components[parentId] = { ...components[parentId], children: existingChildren };
          return { components, selectedIds: [comp.id], isDirty: true };
        }

        const activeDevice = device || (state.deviceMode === 'split'
          ? (useUIStore.getState().splitActiveCanvas ?? 'mobile')
          : state.deviceMode === 'desktop' ? 'desktop' : 'mobile');
        const activeRootIds = getActiveRootIds(state.screens, state.currentScreenId);
        const newRootIds = { mobile: [...activeRootIds.mobile], desktop: [...activeRootIds.desktop] };

        if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= newRootIds[activeDevice].length) {
          newRootIds[activeDevice].splice(insertIndex, 0, comp.id);
        } else {
          newRootIds[activeDevice].push(comp.id);
        }

        return {
          components,
          screens: updateActiveRootIds(state.screens, state.currentScreenId, newRootIds),
          selectedIds: [comp.id],
          isDirty: true,
        };
      });

      get().addActionToHistory(`Added ${type}`);
      return comp.id;
    },

    removeComponent(id) {
      get().removeComponents([id]);
    },

    removeComponents(ids) {
      if (!ids || ids.length === 0) return;

      const { components } = get();
      const validIds = ids.filter((id) => components[id] !== undefined);
      if (validIds.length === 0) return;

      get().pushHistory();

      const toRemove = new Set<string>();
      validIds.forEach((id) => {
        collectDescendants(id, components).forEach((rid) => toRemove.add(rid));
      });

      const newComponents = { ...components };

      validIds.forEach((id) => {
        const comp = components[id];
        if (comp && comp.parentId && newComponents[comp.parentId]) {
          newComponents[comp.parentId] = {
            ...newComponents[comp.parentId],
            children: newComponents[comp.parentId].children.filter((c) => !toRemove.has(c)),
          };
        }
      });

      toRemove.forEach((rid) => delete newComponents[rid]);

      const desc =
        validIds.length === 1
          ? `Removed ${components[validIds[0]].name || components[validIds[0]].type}`
          : `Removed ${validIds.length} components`;

      set((state) => ({
        components: newComponents,
        screens: state.screens.map((s) => ({
          ...s,
          rootIds: {
            mobile: s.rootIds.mobile.filter((r) => !toRemove.has(r)),
            desktop: s.rootIds.desktop.filter((r) => !toRemove.has(r)),
          },
        })),
        selectedIds: state.selectedIds.filter((s) => !toRemove.has(s)),
        isDirty: true,
        changeCounter: state.changeCounter + 1,
      }));

      const updatedState = get();
      const yaml = generateYaml(updatedState);
      useHistoryStore.getState().addSnapshot(yaml, updatedState, desc);
      get().addActionToHistory(desc);
    },

    updateComponent(id, patch) {
      const comp = get().components[id];
      const desc = patch.name
        ? `Renamed ${comp?.name || comp?.type || 'component'} to ${patch.name}`
        : `Updated ${comp?.name || comp?.type || 'component'}`;
      set((state) => ({
        components: {
          ...state.components,
          [id]: { ...state.components[id], ...patch, updatedAt: Date.now() },
        },
        isDirty: true,
        changeCounter: state.changeCounter + 1,
      }));
      get().addActionToHistory(desc);
    },

    duplicateComponent(id) {
      get().pushHistory();
      const { components } = get();
      const comp = components[id];
      if (!comp) return id;

      const newId = generateId(comp.type.slice(0, 3));
      const duplicate: CanvasComponent = {
        ...deepClone(comp),
        id: newId,
        name: `${comp.name} Copy`,
        children: [],
        layout: { ...comp.layout, x: (comp.layout.x as number) + 16, y: (comp.layout.y as number) + 16 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      set((state) => {
        const newComponents = { ...state.components, [newId]: duplicate };

        if (comp.parentId && newComponents[comp.parentId]) {
          const parentChildren = [...newComponents[comp.parentId].children];
          const idx = parentChildren.indexOf(id);
          parentChildren.splice(idx + 1, 0, newId);
          newComponents[comp.parentId] = { ...newComponents[comp.parentId], children: parentChildren };
          return { components: newComponents, selectedIds: [newId], isDirty: true };
        }

        const activeDevice = state.deviceMode === 'desktop' ? 'desktop' : 'mobile';
        const activeRootIds = getActiveRootIds(state.screens, state.currentScreenId);
        const newRootIds = { mobile: [...activeRootIds.mobile], desktop: [...activeRootIds.desktop] };
        newRootIds[activeDevice].push(newId);

        return {
          components: newComponents,
          screens: updateActiveRootIds(state.screens, state.currentScreenId, newRootIds),
          selectedIds: [newId],
          isDirty: true,
        };
      });

      get().addActionToHistory(`Duplicated ${comp.name || comp.type}`);
      return newId;
    },

    moveComponent(id, parentId, index) {
      get().reparentComponent(id, parentId, index);
    },

    reparentComponent(id, newParentId, insertIndex, device) {
      get().pushHistory();
      const { components } = get();
      const comp = components[id];
      if (!comp) return;

      if (newParentId) {
        const descendants = new Set(collectDescendants(id, components));
        if (descendants.has(newParentId)) return;
      }

      const newComponents = { ...components };

      if (comp.parentId && newComponents[comp.parentId]) {
        newComponents[comp.parentId] = {
          ...newComponents[comp.parentId],
          children: newComponents[comp.parentId].children.filter((c) => c !== id),
        };
      }

      newComponents[id] = { ...comp, parentId: newParentId };

      set((state) => {
        const activeDevice = device || (state.deviceMode === 'desktop' ? 'desktop' : 'mobile');

        // Remove from current screen rootIds if it was a root component
        let updatedScreens = state.screens;
        if (comp.parentId === null) {
          updatedScreens = state.screens.map((s) =>
            s.id === state.currentScreenId
              ? {
                  ...s,
                  rootIds: {
                    mobile: s.rootIds.mobile.filter((r) => r !== id),
                    desktop: s.rootIds.desktop.filter((r) => r !== id),
                  },
                }
              : s,
          );
        }

        if (newParentId && newComponents[newParentId]) {
          const children = newComponents[newParentId].children.filter((c) => c !== id);
          if (insertIndex !== undefined && insertIndex >= 0) {
            children.splice(insertIndex, 0, id);
          } else {
            children.push(id);
          }
          newComponents[newParentId] = { ...newComponents[newParentId], children };
          return { components: newComponents, screens: updatedScreens, isDirty: true };
        } else {
          const currentRootIds = getActiveRootIds(updatedScreens, state.currentScreenId);
          const newRootIds = { mobile: [...currentRootIds.mobile], desktop: [...currentRootIds.desktop] };
          if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= newRootIds[activeDevice].length) {
            newRootIds[activeDevice].splice(insertIndex, 0, id);
          } else {
            newRootIds[activeDevice].push(id);
          }
          return {
            components: newComponents,
            screens: updateActiveRootIds(updatedScreens, state.currentScreenId, newRootIds),
            isDirty: true,
          };
        }
      });

      get().addActionToHistory(`Moved ${comp.name || comp.type}`);
    },

    reorderComponent(id, direction) {
      get().pushHistory();
      const { components } = get();
      const comp = components[id];
      if (!comp) return;

      if (comp.parentId) {
        const parent = components[comp.parentId];
        if (!parent) return;
        const children = [...parent.children];
        const idx = children.indexOf(id);
        if (idx < 0) return;
        const newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= children.length) return;
        [children[idx], children[newIdx]] = [children[newIdx], children[idx]];
        set({ components: { ...components, [comp.parentId]: { ...parent, children } }, isDirty: true });
      } else {
        set((state) => {
          const activeDevice = state.deviceMode === 'desktop' ? 'desktop' : 'mobile';
          const activeRootIds = getActiveRootIds(state.screens, state.currentScreenId);
          const roots = [...activeRootIds[activeDevice]];
          const idx = roots.indexOf(id);
          if (idx < 0) return state;
          const newIdx = direction === 'up' ? idx - 1 : idx + 1;
          if (newIdx < 0 || newIdx >= roots.length) return state;
          [roots[idx], roots[newIdx]] = [roots[newIdx], roots[idx]];
          const newRootIds = { ...activeRootIds, [activeDevice]: roots };
          return { screens: updateActiveRootIds(state.screens, state.currentScreenId, newRootIds), isDirty: true };
        });
      }
      get().addActionToHistory(`Reordered ${comp.name || comp.type}`);
    },

    insertNextTo(draggedId, newType, targetId, side) {
      get().pushHistory();
      const state = get();
      const { components } = state;
      const target = components[targetId];
      if (!target) return;

      if (draggedId) {
        if (draggedId === targetId) return;
        const descendants = new Set(collectDescendants(draggedId, components));
        if (descendants.has(targetId)) return;
      }

      const newComponents = { ...components };
      let itemIdToInsert = draggedId;
      const insertedType = newType || (draggedId ? components[draggedId]?.name || components[draggedId]?.type : 'component');

      if (!itemIdToInsert && newType) {
        const newComp = createComponent(newType);
        newComponents[newComp.id] = newComp;
        itemIdToInsert = newComp.id;
      }
      if (!itemIdToInsert) return;

      if (draggedId) {
        const oldParentId = newComponents[draggedId].parentId;
        if (oldParentId && newComponents[oldParentId]) {
          newComponents[oldParentId] = {
            ...newComponents[oldParentId],
            children: newComponents[oldParentId].children.filter((c) => c !== draggedId),
          };
        }
      }

      const parentId = target.parentId;
      const parent = parentId ? newComponents[parentId] : null;
      const targetName = target.name || target.type;
      const isHorizontal = side === 'left' || side === 'right';
      const targetWrapperType = isHorizontal ? 'row' : 'column';

      if (parent && parentId && parent.type === targetWrapperType) {
        const targetIndex = parent.children.indexOf(targetId);
        const insertIndex = side === 'left' || side === 'top' ? targetIndex : targetIndex + 1;
        const newChildren = [...parent.children];
        newChildren.splice(insertIndex, 0, itemIdToInsert);
        newComponents[parentId] = { ...parent, children: newChildren };
        newComponents[itemIdToInsert] = { ...newComponents[itemIdToInsert], parentId };
        if (targetWrapperType === 'row') {
          newComponents[itemIdToInsert] = { ...newComponents[itemIdToInsert], layout: { ...newComponents[itemIdToInsert].layout, width: 'auto' } };
          newComponents[targetId] = { ...newComponents[targetId], layout: { ...newComponents[targetId].layout, width: 'auto' } };
        }
        set({ components: newComponents, isDirty: true, selectedIds: [itemIdToInsert] });
        get().addActionToHistory(`Inserted ${insertedType} next to ${targetName}`);
        return;
      }

      const wrapperComp = createComponent(targetWrapperType);
      wrapperComp.parentId = parentId;
      wrapperComp.children =
        side === 'left' || side === 'top' ? [itemIdToInsert, targetId] : [targetId, itemIdToInsert];
      newComponents[wrapperComp.id] = wrapperComp;
      newComponents[targetId] = {
        ...newComponents[targetId],
        parentId: wrapperComp.id,
        layout: { ...newComponents[targetId].layout, width: targetWrapperType === 'row' ? 'auto' : newComponents[targetId].layout.width },
      };
      newComponents[itemIdToInsert] = {
        ...newComponents[itemIdToInsert],
        parentId: wrapperComp.id,
        layout: { ...newComponents[itemIdToInsert].layout, width: targetWrapperType === 'row' ? 'auto' : newComponents[itemIdToInsert].layout.width },
      };

      if (parent && parentId) {
        const newChildren = parent.children.map((c) => (c === targetId ? wrapperComp.id : c));
        newComponents[parentId] = { ...parent, children: newChildren };
        set({ components: newComponents, isDirty: true, selectedIds: [itemIdToInsert] });
      } else {
        set((st) => {
          const activeRootIds = getActiveRootIds(st.screens, st.currentScreenId);
          const newRootIds = {
            mobile: activeRootIds.mobile.map((r) => (r === targetId ? wrapperComp.id : r)),
            desktop: activeRootIds.desktop.map((r) => (r === targetId ? wrapperComp.id : r)),
          };
          return {
            components: newComponents,
            screens: updateActiveRootIds(st.screens, st.currentScreenId, newRootIds),
            isDirty: true,
            selectedIds: [itemIdToInsert],
          };
        });
      }
      get().addActionToHistory(`Wrapped ${insertedType} and ${targetName} in ${targetWrapperType}`);
    },

    setAlignment(id, alignSelf) {
      const comp = get().components[id];
      if (!comp) return;
      set((state) => ({
        components: { ...state.components, [id]: { ...comp, layout: { ...comp.layout, alignSelf } } },
        isDirty: true,
      }));
      get().addActionToHistory(`Aligned ${comp.name || comp.type}`);
    },

    // ─── Screen operations ──────────────────────────────────────────────────

    // multi-screen-AC-1
    addScreen(name) {
      get().pushHistory();
      const newScreen: Screen = {
        id: generateId('screen'),
        name: name ?? `Screen ${get().screens.length + 1}`,
        rootIds: { mobile: [], desktop: [] },
      };
      set((state) => ({
        screens: [...state.screens, newScreen],
        currentScreenId: newScreen.id,
        selectedIds: [],
        isDirty: true,
        changeCounter: state.changeCounter + 1,
      }));
      get().addActionToHistory(`Added screen ${newScreen.name}`);
      // Version control snapshot
      const afterState = get();
      useHistoryStore.getState().addSnapshot(
        generateYaml(afterState),
        afterState,
        `Screen added: ${newScreen.name}`,
      );
      return newScreen.id;
    },

    // multi-screen-AC-3
    deleteScreen(id) {
      const { screens } = get();
      if (screens.length <= 1) return;

      get().pushHistory();
      const screen = screens.find((s) => s.id === id);
      if (!screen) return;

      const { components } = get();
      const allRootIds = [...new Set([...screen.rootIds.mobile, ...screen.rootIds.desktop])];
      const toRemove = new Set<string>();
      allRootIds.forEach((rootId) => {
        collectDescendants(rootId, components).forEach((rid) => toRemove.add(rid));
      });

      const newComponents = { ...components };
      toRemove.forEach((rid) => delete newComponents[rid]);

      const newScreens = screens.filter((s) => s.id !== id);
      const currentId = get().currentScreenId;
      const newCurrentId = id === currentId ? newScreens[0].id : currentId;

      set({
        screens: newScreens,
        currentScreenId: newCurrentId,
        components: newComponents,
        selectedIds: [],
        isDirty: true,
        changeCounter: get().changeCounter + 1,
      });
      get().addActionToHistory(`Deleted screen ${screen.name}`);
      // Version control snapshot
      const afterState = get();
      useHistoryStore.getState().addSnapshot(
        generateYaml(afterState),
        afterState,
        `Screen deleted: ${screen.name}`,
      );
    },

    renameScreen(id, name) {
      set((state) => ({
        screens: state.screens.map((s) => (s.id === id ? { ...s, name } : s)),
        isDirty: true,
      }));
      get().addActionToHistory(`Renamed screen to ${name}`);
      // Version control snapshot
      const afterState = get();
      useHistoryStore.getState().addSnapshot(
        generateYaml(afterState),
        afterState,
        `Screen renamed: ${name}`,
      );
    },

    // multi-screen-AC-4
    switchScreen(id) {
      if (get().currentScreenId === id) return;
      set({ currentScreenId: id, selectedIds: [] });
    },

    duplicateScreen(id) {
      get().pushHistory();
      const { screens, components } = get();
      const screen = screens.find((s) => s.id === id);
      if (!screen) return;

      // Build id mapping for all components in this screen
      const idMap: Record<string, string> = {};
      const allRootIds = [...new Set([...screen.rootIds.mobile, ...screen.rootIds.desktop])];
      allRootIds.forEach((rootId) => {
        collectDescendants(rootId, components).forEach((compId) => {
          if (!idMap[compId]) {
            const comp = components[compId];
            idMap[compId] = generateId(comp?.type?.slice(0, 3) ?? 'cmp');
          }
        });
      });

      const newComponents = { ...components };
      Object.entries(idMap).forEach(([oldId, newId]) => {
        const comp = components[oldId];
        if (!comp) return;
        newComponents[newId] = {
          ...deepClone(comp),
          id: newId,
          parentId: comp.parentId ? (idMap[comp.parentId] ?? comp.parentId) : null,
          children: comp.children.map((cid) => idMap[cid] ?? cid),
        };
      });

      // Generate unique name: "Home (1)", "Home (2)", etc.
      const existingNames = new Set(get().screens.map((s) => s.name));
      let copyName = `${screen.name} (1)`;
      let n = 1;
      while (existingNames.has(copyName)) { n++; copyName = `${screen.name} (${n})`; }

      const newScreen: Screen = {
        id: generateId('screen'),
        name: copyName,
        rootIds: {
          mobile: screen.rootIds.mobile.map((rid) => idMap[rid] ?? rid),
          desktop: screen.rootIds.desktop.map((rid) => idMap[rid] ?? rid),
        },
      };

      set((state) => ({
        components: newComponents,
        screens: [...state.screens, newScreen],
        currentScreenId: newScreen.id,
        selectedIds: [],
        isDirty: true,
        changeCounter: state.changeCounter + 1,
      }));
      get().addActionToHistory(`Duplicated screen ${screen.name}`);
    },

    // ─── Selection ──────────────────────────────────────────────────────────

    selectComponent(id, multi = false) {
      set((state) => ({
        selectedIds: multi
          ? state.selectedIds.includes(id)
            ? state.selectedIds.filter((s) => s !== id)
            : [...state.selectedIds, id]
          : [id],
      }));
    },

    selectNone: () => set({ selectedIds: [] }),
    selectAll: () => set((state) => ({ selectedIds: Object.keys(state.components) })),

    // ─── Viewport ───────────────────────────────────────────────────────────

    setZoom: (zoom) =>
      set((state) => ({ viewport: { ...state.viewport, zoom: Math.min(Math.max(zoom, 0.1), 4) } })),

    setPan: (x, y) => set((state) => ({ viewport: { ...state.viewport, panX: x, panY: y } })),

    resetViewport: () =>
      set((state) => {
        const w = typeof window !== 'undefined' ? window.innerWidth : 1440;
        const h = typeof window !== 'undefined' ? window.innerHeight : 900;
        const isMobile = w < 768;
        const isLarge = w > 1300 && h > 1000;
        const zoomByMode: Record<string, number> = isMobile
          ? { mobile: 0.75, desktop: 0.38, split: 0.30 }
          : isLarge
          ? { mobile: 1.05, desktop: 1.20, split: 0.95 }
          : { mobile: 0.75, desktop: 0.70, split: 0.53 };
        return { viewport: { ...state.viewport, zoom: zoomByMode[state.deviceMode] ?? (isLarge ? 1.20 : 0.75), panX: 0, panY: state.deviceMode === 'split' ? -40 : 0 } };
      }),

    // ─── Device ─────────────────────────────────────────────────────────────

    setDeviceMode: (mode) =>
      set((state) => {
        const w = typeof window !== 'undefined' ? window.innerWidth : 1440;
        const h = typeof window !== 'undefined' ? window.innerHeight : 900;
        const isMobile = w < 768;
        const isLarge = w > 1300 && h > 1000;
        const zoomByMode: Record<string, number> = isMobile
          ? { mobile: 0.75, desktop: 0.38, split: 0.30 }
          : isLarge
          ? { mobile: 1.05, desktop: 1.20, split: 0.95 }
          : { mobile: 0.75, desktop: 0.70, split: 0.53 };
        return { deviceMode: mode, viewport: { ...state.viewport, zoom: zoomByMode[mode] ?? state.viewport.zoom, panX: 0, panY: mode === 'split' ? -40 : 0 } };
      }),

    setFrameWidth: (frame, width) => {
      set((state) => ({
        frameWidths: { ...state.frameWidths, [frame]: Math.max(280, Math.min(2560, width)) },
        frameSizes: { ...state.frameSizes, [frame]: { ...state.frameSizes[frame], w: Math.max(280, Math.min(2560, width)) } },
      }));
      get().addActionToHistory(`Resized ${frame} frame`);
    },

    setFrameSize: (frame, size) => {
      set((state) => {
        const prev = state.frameSizes[frame];
        const next = {
          w: size.w !== undefined ? Math.max(280, Math.min(2560, Math.round(size.w))) : prev.w,
          h: size.h !== undefined ? Math.max(200, Math.min(2160, Math.round(size.h))) : prev.h,
        };
        return { frameSizes: { ...state.frameSizes, [frame]: next }, frameWidths: { ...state.frameWidths, [frame]: next.w } };
      });
      get().addActionToHistory(`Resized ${frame} frame`);
    },

    // ─── Project ────────────────────────────────────────────────────────────

    setProjectName: (name) => {
      set({ projectName: name, isDirty: true });
      useProjectStore.getState().saveProject(get());
      import('./historyStore').then(({ useHistoryStore }) => {
        useHistoryStore.getState().renameProjectSnapshots(get().projectId, name);
      });
      get().addActionToHistory(`Renamed project to ${name}`);
    },

    // ─── Persistence ────────────────────────────────────────────────────────

    save() {
      const { projectId, components, screens, currentScreenId, viewport, deviceMode, projectName, frameWidths, frameSizes } = get();
      const data = { projectId, components, screens, currentScreenId, viewport, deviceMode, projectName, frameWidths, frameSizes, savedAt: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      useProjectStore.getState().saveProject(get());
      set({ isDirty: false });
    },

    // multi-screen-AC-2
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);

        let screens: Screen[];
        let currentScreenId: string;

        if (data.screens && Array.isArray(data.screens) && data.screens.length > 0) {
          // New schema
          screens = data.screens;
          currentScreenId = data.currentScreenId ?? data.screens[0].id;
        } else {
          // Legacy schema migration: rootIds → screens[0] "Home"
          const home: Screen = {
            id: generateId('screen'),
            name: 'Home',
            rootIds: data.rootIds?.mobile
              ? data.rootIds
              : (Array.isArray(data.rootIds) ? { mobile: data.rootIds, desktop: [] } : { mobile: [], desktop: [] }),
          };
          screens = [home];
          currentScreenId = home.id;
        }

        set({
          projectId: data.projectId ?? generateId('proj'),
          components: data.components ?? {},
          screens,
          currentScreenId,
          viewport: data.viewport ?? { zoom: 0.53, panX: 0, panY: -40 },
          deviceMode: data.deviceMode ?? 'split',
          projectName: data.projectName ?? 'Untitled Project',
          frameWidths: data.frameWidths ?? { mobile: 480, desktop: 1318 },
          frameSizes: data.frameSizes ?? { mobile: { w: 480, h: 770 }, desktop: { w: 1318, h: 801 } },
          isDirty: false,
        });
      } catch {
        // Ignore corrupted state
      }
    },

    reset() {
      localStorage.removeItem(STORAGE_KEY);
      set({ ...getInitialState(), isDirty: false, past: [], future: [] });
    },

    clearComponents() {
      get().pushHistory();
      const home = makeHomeScreen();
      set((state) => ({
        components: {},
        screens: [home],
        currentScreenId: home.id,
        selectedIds: [],
        isDirty: true,
        changeCounter: state.changeCounter + 1,
      }));
    },

    newProject() {
      set({ ...getInitialState(), isDirty: true, past: [], future: [], changeCounter: 0 });
    },

    loadProject(project) {
      const state = project.state as CanvasState & { rootIds?: { mobile: string[]; desktop: string[] } };

      let screens: Screen[];
      let currentScreenId: string;

      if (state.screens && Array.isArray(state.screens) && state.screens.length > 0) {
        screens = state.screens;
        currentScreenId = state.currentScreenId ?? state.screens[0].id;
      } else {
        // Legacy project migration
        const home: Screen = {
          id: generateId('screen'),
          name: 'Home',
          rootIds: (state as any).rootIds ?? { mobile: [], desktop: [] },
        };
        screens = [home];
        currentScreenId = home.id;
      }

      set({
        projectId: state.projectId,
        projectName: state.projectName,
        components: state.components,
        screens,
        currentScreenId,
        viewport: state.viewport,
        deviceMode: state.deviceMode,
        frameWidths: state.frameWidths,
        frameSizes: state.frameSizes,
        selectedIds: [],
        isDirty: false,
        past: [],
        future: [],
        changeCounter: 0,
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(get()));
    },
  })),
);
