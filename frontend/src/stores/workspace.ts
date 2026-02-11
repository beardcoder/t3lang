import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { TranslationGroup, FileData, ViewMode, WorkspaceScan, FileMetadata } from '../types';

interface WorkspaceState {
  // Core state
  projectRoot: string | null;
  groups: Map<string, TranslationGroup>;
  activeGroupId: string | null;
  activeLanguage: string | null;
  viewMode: ViewMode;

  // File data cache (LRU-like, keeps last 10 groups loaded)
  fileCache: Map<string, FileData>;
  loadedGroups: string[]; // Track order for LRU eviction

  // Loading state
  isScanning: boolean;
  scanError: string | null;

  // Actions
  setProjectRoot: (path: string | null) => void;
  setWorkspaceScan: (scan: WorkspaceScan) => void;
  setActiveGroup: (groupId: string | null) => void;
  setActiveLanguage: (language: string | null) => void;
  setViewMode: (mode: ViewMode) => void;

  // File cache management
  cacheFileData: (path: string, data: FileData) => void;
  getFileData: (path: string) => FileData | undefined;
  markGroupLoaded: (groupId: string) => void;
  evictOldGroups: () => void;

  // Group operations
  addGroup: (group: TranslationGroup) => void;
  removeGroup: (groupId: string) => void;
  updateGroupCoverage: (groupId: string, coverage: TranslationGroup['coverage']) => void;
  addFileToGroup: (groupId: string, language: string, file: FileMetadata) => void;
  removeFileFromGroup: (groupId: string, language: string) => void;

  // Loading state
  setScanning: (scanning: boolean) => void;
  setScanError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

const MAX_CACHED_GROUPS = 10;

const initialState = {
  projectRoot: null,
  groups: new Map<string, TranslationGroup>(),
  activeGroupId: null,
  activeLanguage: null,
  viewMode: 'dashboard' as ViewMode,
  fileCache: new Map<string, FileData>(),
  loadedGroups: [] as string[],
  isScanning: false,
  scanError: null,
};

export const useWorkspaceStore = create<WorkspaceState>()(
  immer((set, get) => ({
    ...initialState,

    setProjectRoot: (path) =>
      set((state) => {
        state.projectRoot = path;
        if (!path) {
          // Reset workspace state when closing
          state.groups = new Map();
          state.activeGroupId = null;
          state.activeLanguage = null;
          state.fileCache = new Map();
          state.loadedGroups = [];
        }
      }),

    setWorkspaceScan: (scan) =>
      set((state) => {
        state.projectRoot = scan.rootPath;
        state.groups = new Map(scan.groups.map((g) => [g.id, g]));
        state.isScanning = false;
        state.scanError = null;

        // Auto-select first group if none selected
        if (!state.activeGroupId && scan.groups.length > 0) {
          state.activeGroupId = scan.groups[0].id;
        }
      }),

    setActiveGroup: (groupId) =>
      set((state) => {
        state.activeGroupId = groupId;
        // Reset active language when changing groups
        if (groupId) {
          const group = state.groups.get(groupId);

          if (group) {
            // Default to first non-source language, or source if only one file
            const languages = Array.from(group.files.keys());
            const nonDefault = languages.find((l) => l !== 'default');

            state.activeLanguage = nonDefault || languages[0] || null;
          }
        } else {
          state.activeLanguage = null;
        }
      }),

    setActiveLanguage: (language) =>
      set((state) => {
        state.activeLanguage = language;
      }),

    setViewMode: (mode) =>
      set((state) => {
        state.viewMode = mode;
      }),

    cacheFileData: (path, data) =>
      set((state) => {
        state.fileCache.set(path, data);
      }),

    getFileData: (path) => {
      return get().fileCache.get(path);
    },

    markGroupLoaded: (groupId) =>
      set((state) => {
        // Remove if already in list (to move to end)
        const idx = state.loadedGroups.indexOf(groupId);

        if (idx !== -1) {
          state.loadedGroups.splice(idx, 1);
        }
        state.loadedGroups.push(groupId);
      }),

    evictOldGroups: () =>
      set((state) => {
        while (state.loadedGroups.length > MAX_CACHED_GROUPS) {
          const oldestGroupId = state.loadedGroups.shift();

          if (oldestGroupId) {
            const group = state.groups.get(oldestGroupId);

            if (group) {
              // Remove all cached file data for this group
              for (const file of group.files.values()) {
                state.fileCache.delete(file.path);
              }
            }
          }
        }
      }),

    addGroup: (group) =>
      set((state) => {
        state.groups.set(group.id, group);
      }),

    removeGroup: (groupId) =>
      set((state) => {
        const group = state.groups.get(groupId);

        if (group) {
          // Clean up cached data
          for (const file of group.files.values()) {
            state.fileCache.delete(file.path);
          }
          state.groups.delete(groupId);

          // Update active group if needed
          if (state.activeGroupId === groupId) {
            const remaining = Array.from(state.groups.keys());

            state.activeGroupId = remaining[0] || null;
          }

          // Remove from loaded groups
          const idx = state.loadedGroups.indexOf(groupId);

          if (idx !== -1) {
            state.loadedGroups.splice(idx, 1);
          }
        }
      }),

    updateGroupCoverage: (groupId, coverage) =>
      set((state) => {
        const group = state.groups.get(groupId);

        if (group) {
          group.coverage = coverage;
        }
      }),

    addFileToGroup: (groupId, language, file) =>
      set((state) => {
        const group = state.groups.get(groupId);

        if (group) {
          group.files.set(language, file);
          if (language === 'default') {
            group.sourceFile = file;
          }
        }
      }),

    removeFileFromGroup: (groupId, language) =>
      set((state) => {
        const group = state.groups.get(groupId);

        if (group) {
          const file = group.files.get(language);

          if (file) {
            state.fileCache.delete(file.path);
          }
          group.files.delete(language);
          if (language === 'default') {
            group.sourceFile = null;
          }
        }
      }),

    setScanning: (scanning) =>
      set((state) => {
        state.isScanning = scanning;
      }),

    setScanError: (error) =>
      set((state) => {
        state.scanError = error;
        state.isScanning = false;
      }),

    reset: () => set(initialState),
  })),
);

// Selectors
export const selectActiveGroup = (state: WorkspaceState) =>
  state.activeGroupId ? state.groups.get(state.activeGroupId) : null;

export const selectActiveFile = (state: WorkspaceState) => {
  if (!state.activeGroupId || !state.activeLanguage) return null;
  const group = state.groups.get(state.activeGroupId);

  if (!group) return null;
  const fileMeta = group.files.get(state.activeLanguage);

  if (!fileMeta) return null;

  return state.fileCache.get(fileMeta.path);
};

export const selectGroupsList = (state: WorkspaceState) =>
  Array.from(state.groups.values()).sort((a, b) => a.baseName.localeCompare(b.baseName));

export const selectLanguagesForGroup = (state: WorkspaceState, groupId: string) => {
  const group = state.groups.get(groupId);

  if (!group) return [];

  return Array.from(group.files.keys()).sort((a, b) => {
    if (a === 'default') return -1;
    if (b === 'default') return 1;

    return a.localeCompare(b);
  });
};
