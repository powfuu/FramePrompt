import { create } from 'zustand';
import type { Project, CanvasState } from '@/types';
import { generateId } from '@/lib/utils';

const STORAGE_KEY = 'frameprompt_projects';

interface ProjectStore {
  projects: Project[];
  load: () => void;
  saveProject: (state: CanvasState) => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
}

export const useProjectStore = create<ProjectStore>()((set, get) => ({
  projects: [],
  
  load: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        set({ projects: JSON.parse(raw) });
      }
    } catch {
      // Ignore
    }
  },

  saveProject: (state) => {
    set((store) => {
      const existingIdx = store.projects.findIndex((p) => p.id === state.projectId);
      const proj: Project = {
        id: state.projectId,
        name: state.projectName,
        updatedAt: Date.now(),
        createdAt: existingIdx >= 0 ? store.projects[existingIdx].createdAt : Date.now(),
        state: {
          projectId: state.projectId,
          projectName: state.projectName,
          components: state.components,
          screens: state.screens,
          currentScreenId: state.currentScreenId,
          viewport: state.viewport,
          deviceMode: state.deviceMode,
          frameWidths: state.frameWidths,
          frameSizes: state.frameSizes,
        },
      };

      const newProjects = [...store.projects];
      if (existingIdx >= 0) {
        newProjects[existingIdx] = proj;
      } else {
        newProjects.unshift(proj);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProjects));
      return { projects: newProjects };
    });
  },

  deleteProject: (id) => {
    set((store) => {
      const newProjects = store.projects.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProjects));
      return { projects: newProjects };
    });
  },

  getProject: (id) => get().projects.find((p) => p.id === id),
}));
