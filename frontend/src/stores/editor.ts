import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { UnitChange, TranslationUnit, SortMode } from '../types';

// Changes for a single file: Map<unitId, changes[]>
type FileChanges = Map<string, UnitChange[]>;

interface EditorState {
  // Dirty state tracking
  // Map<filePath, Map<unitId, UnitChange[]>>
  dirtyUnits: Map<string, FileChanges>;

  // Currently focused unit
  focusedUnitId: string | null;
  focusedField: 'id' | 'source' | 'target' | null;

  // Editor settings
  sortMode: SortMode;
  searchQuery: string;
  showOnlyMissing: boolean;

  // Editing state
  editingUnitId: string | null;
  editingField: 'id' | 'source' | 'target' | null;

  // Actions
  trackChange: (filePath: string, change: UnitChange) => void;
  clearChanges: (filePath: string, unitId?: string) => void;
  clearAllChanges: () => void;
  getDirtyPaths: () => string[];
  getChangesForFile: (filePath: string) => FileChanges;
  hasUnsavedChanges: (filePath?: string) => boolean;

  // Focus management
  setFocusedUnit: (unitId: string | null, field?: 'id' | 'source' | 'target' | null) => void;
  moveFocus: (direction: 'up' | 'down', units: TranslationUnit[]) => void;

  // Editing management
  startEditing: (unitId: string, field: 'id' | 'source' | 'target') => void;
  stopEditing: () => void;

  // Settings
  setSortMode: (mode: SortMode) => void;
  setSearchQuery: (query: string) => void;
  setShowOnlyMissing: (show: boolean) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  dirtyUnits: new Map<string, FileChanges>(),
  focusedUnitId: null,
  focusedField: null,
  sortMode: 'manual' as SortMode,
  searchQuery: '',
  showOnlyMissing: false,
  editingUnitId: null,
  editingField: null,
};

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    ...initialState,

    trackChange: (filePath, change) => set((state) => {
      if (!state.dirtyUnits.has(filePath)) {
        state.dirtyUnits.set(filePath, new Map());
      }
      const fileChanges = state.dirtyUnits.get(filePath)!;

      if (!fileChanges.has(change.unitId)) {
        fileChanges.set(change.unitId, []);
      }

      const unitChanges = fileChanges.get(change.unitId)!;

      // Check if we already have a change for this field
      const existingIdx = unitChanges.findIndex(c => c.field === change.field);
      if (existingIdx !== -1) {
        // Update existing change, but keep original oldValue
        const existing = unitChanges[existingIdx];
        unitChanges[existingIdx] = {
          ...change,
          oldValue: existing.oldValue,
        };

        // If new value equals original old value, remove the change
        if (change.newValue === existing.oldValue) {
          unitChanges.splice(existingIdx, 1);
          if (unitChanges.length === 0) {
            fileChanges.delete(change.unitId);
          }
          if (fileChanges.size === 0) {
            state.dirtyUnits.delete(filePath);
          }
        }
      } else {
        // Don't track if nothing changed
        if (change.oldValue !== change.newValue) {
          unitChanges.push(change);
        }
      }
    }),

    clearChanges: (filePath, unitId) => set((state) => {
      if (unitId) {
        const fileChanges = state.dirtyUnits.get(filePath);
        if (fileChanges) {
          fileChanges.delete(unitId);
          if (fileChanges.size === 0) {
            state.dirtyUnits.delete(filePath);
          }
        }
      } else {
        state.dirtyUnits.delete(filePath);
      }
    }),

    clearAllChanges: () => set((state) => {
      state.dirtyUnits = new Map();
    }),

    getDirtyPaths: () => {
      return Array.from(get().dirtyUnits.keys());
    },

    getChangesForFile: (filePath) => {
      return get().dirtyUnits.get(filePath) || new Map();
    },

    hasUnsavedChanges: (filePath) => {
      const { dirtyUnits } = get();
      if (filePath) {
        const fileChanges = dirtyUnits.get(filePath);
        return fileChanges ? fileChanges.size > 0 : false;
      }
      return dirtyUnits.size > 0;
    },

    setFocusedUnit: (unitId, field = null) => set((state) => {
      state.focusedUnitId = unitId;
      state.focusedField = field;
    }),

    moveFocus: (direction, units) => set((state) => {
      if (!state.focusedUnitId || units.length === 0) {
        // Focus first unit if nothing focused
        if (units.length > 0) {
          state.focusedUnitId = units[0].id;
          state.focusedField = 'target';
        }
        return;
      }

      const currentIndex = units.findIndex(u => u.id === state.focusedUnitId);
      if (currentIndex === -1) {
        state.focusedUnitId = units[0].id;
        return;
      }

      const newIndex = direction === 'up'
        ? Math.max(0, currentIndex - 1)
        : Math.min(units.length - 1, currentIndex + 1);

      state.focusedUnitId = units[newIndex].id;
    }),

    startEditing: (unitId, field) => set((state) => {
      state.editingUnitId = unitId;
      state.editingField = field;
      state.focusedUnitId = unitId;
      state.focusedField = field;
    }),

    stopEditing: () => set((state) => {
      state.editingUnitId = null;
      state.editingField = null;
    }),

    setSortMode: (mode) => set((state) => {
      state.sortMode = mode;
    }),

    setSearchQuery: (query) => set((state) => {
      state.searchQuery = query;
    }),

    setShowOnlyMissing: (show) => set((state) => {
      state.showOnlyMissing = show;
    }),

    reset: () => set(initialState),
  }))
);

// Selectors
export const selectDirtyCount = (state: EditorState): number => {
  let count = 0;
  for (const fileChanges of state.dirtyUnits.values()) {
    count += fileChanges.size;
  }
  return count;
};

export const selectIsUnitDirty = (state: EditorState, filePath: string, unitId: string): boolean => {
  const fileChanges = state.dirtyUnits.get(filePath);
  return fileChanges ? fileChanges.has(unitId) : false;
};

export const selectFilteredUnits = (
  units: TranslationUnit[],
  searchQuery: string,
  showOnlyMissing: boolean
): TranslationUnit[] => {
  let filtered = units;

  if (showOnlyMissing) {
    filtered = filtered.filter(u => !u.target || u.target.trim() === '');
  }

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(u =>
      u.id.toLowerCase().includes(query) ||
      u.source.toLowerCase().includes(query) ||
      (u.target && u.target.toLowerCase().includes(query))
    );
  }

  return filtered;
};
