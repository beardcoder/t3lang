import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { RecentWorkspace } from '../types';

const MAX_RECENT_WORKSPACES = 10;

interface PersistenceState {
  // Recent workspaces
  recentWorkspaces: RecentWorkspace[];

  // Last session state
  lastWorkspace: string | null;
  lastGroupId: string | null;
  lastLanguage: string | null;

  // Actions
  addRecentWorkspace: (path: string, name: string, groupCount: number) => void;
  removeRecentWorkspace: (path: string) => void;
  clearRecentWorkspaces: () => void;
  updateLastSession: (workspace: string | null, groupId?: string | null, language?: string | null) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  recentWorkspaces: [] as RecentWorkspace[],
  lastWorkspace: null,
  lastGroupId: null,
  lastLanguage: null,
};

export const usePersistenceStore = create<PersistenceState>()(
  persist(
    immer((set) => ({
      ...initialState,

      addRecentWorkspace: (path, name, groupCount) =>
        set((state) => {
          // Remove if already exists
          const existingIdx = state.recentWorkspaces.findIndex((w) => w.path === path);

          if (existingIdx !== -1) {
            state.recentWorkspaces.splice(existingIdx, 1);
          }

          // Add to beginning
          state.recentWorkspaces.unshift({
            path,
            name,
            lastOpened: Date.now(),
            groupCount,
          });

          // Limit size
          while (state.recentWorkspaces.length > MAX_RECENT_WORKSPACES) {
            state.recentWorkspaces.pop();
          }
        }),

      removeRecentWorkspace: (path) =>
        set((state) => {
          const idx = state.recentWorkspaces.findIndex((w) => w.path === path);

          if (idx !== -1) {
            state.recentWorkspaces.splice(idx, 1);
          }

          // Clear last session if it was this workspace
          if (state.lastWorkspace === path) {
            state.lastWorkspace = null;
            state.lastGroupId = null;
            state.lastLanguage = null;
          }
        }),

      clearRecentWorkspaces: () =>
        set((state) => {
          state.recentWorkspaces = [];
        }),

      updateLastSession: (workspace, groupId, language) =>
        set((state) => {
          state.lastWorkspace = workspace;
          if (groupId !== undefined) {
            state.lastGroupId = groupId;
          }
          if (language !== undefined) {
            state.lastLanguage = language;
          }
        }),

      reset: () => set(initialState),
    })),
    {
      name: 't3lang-persistence',
    },
  ),
);

// Selectors
export const selectRecentWorkspaces = (state: PersistenceState) => state.recentWorkspaces;

export const selectHasRecentWorkspaces = (state: PersistenceState) => state.recentWorkspaces.length > 0;

export const selectLastSession = (state: PersistenceState) => ({
  workspace: state.lastWorkspace,
  groupId: state.lastGroupId,
  language: state.lastLanguage,
});
