import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { HistoryEntry, UnitChange } from '../types';

const MAX_HISTORY_ENTRIES = 50;

interface HistoryStack {
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
}

interface HistoryState {
  // Per-file history stacks
  fileHistory: Map<string, HistoryStack>;

  // Actions
  pushEntry: (filePath: string, changes: UnitChange[]) => void;
  undo: (filePath: string) => HistoryEntry | null;
  redo: (filePath: string) => HistoryEntry | null;
  canUndo: (filePath: string) => boolean;
  canRedo: (filePath: string) => boolean;
  getUndoDescription: (filePath: string) => string | null;
  getRedoDescription: (filePath: string) => string | null;
  clearHistory: (filePath?: string) => void;

  // Reset
  reset: () => void;
}

const createEmptyStack = (): HistoryStack => ({
  undoStack: [],
  redoStack: [],
});

const generateEntryId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const describeChanges = (changes: UnitChange[]): string => {
  if (changes.length === 0) return '';

  if (changes.length === 1) {
    const change = changes[0];
    switch (change.field) {
      case 'id':
        return `Rename "${change.oldValue}" → "${change.newValue}"`;
      case 'source':
        return `Edit source for "${change.unitId}"`;
      case 'target':
        return `Edit translation for "${change.unitId}"`;
    }
  }

  const fields = new Set(changes.map(c => c.field));
  if (fields.size === 1) {
    const field = changes[0].field;
    return `Edit ${field} for ${changes.length} units`;
  }

  return `Edit ${changes.length} changes`;
};

export const useHistoryStore = create<HistoryState>()(
  immer((set, get) => ({
    fileHistory: new Map<string, HistoryStack>(),

    pushEntry: (filePath, changes) => set((state) => {
      if (changes.length === 0) return;

      if (!state.fileHistory.has(filePath)) {
        state.fileHistory.set(filePath, createEmptyStack());
      }

      const stack = state.fileHistory.get(filePath)!;

      const entry: HistoryEntry = {
        id: generateEntryId(),
        filePath,
        changes,
        timestamp: Date.now(),
      };

      stack.undoStack.push(entry);

      // Limit history size
      while (stack.undoStack.length > MAX_HISTORY_ENTRIES) {
        stack.undoStack.shift();
      }

      // Clear redo stack when new action is performed
      stack.redoStack = [];
    }),

    undo: (filePath) => {
      const state = get();
      const stack = state.fileHistory.get(filePath);
      if (!stack || stack.undoStack.length === 0) return null;

      let entry: HistoryEntry | undefined;

      set((state) => {
        const stack = state.fileHistory.get(filePath)!;
        entry = stack.undoStack.pop();
        if (entry) {
          stack.redoStack.push(entry);
        }
      });

      return entry || null;
    },

    redo: (filePath) => {
      const state = get();
      const stack = state.fileHistory.get(filePath);
      if (!stack || stack.redoStack.length === 0) return null;

      let entry: HistoryEntry | undefined;

      set((state) => {
        const stack = state.fileHistory.get(filePath)!;
        entry = stack.redoStack.pop();
        if (entry) {
          stack.undoStack.push(entry);
        }
      });

      return entry || null;
    },

    canUndo: (filePath) => {
      const stack = get().fileHistory.get(filePath);
      return stack ? stack.undoStack.length > 0 : false;
    },

    canRedo: (filePath) => {
      const stack = get().fileHistory.get(filePath);
      return stack ? stack.redoStack.length > 0 : false;
    },

    getUndoDescription: (filePath) => {
      const stack = get().fileHistory.get(filePath);
      if (!stack || stack.undoStack.length === 0) return null;
      const entry = stack.undoStack[stack.undoStack.length - 1];
      return describeChanges(entry.changes);
    },

    getRedoDescription: (filePath) => {
      const stack = get().fileHistory.get(filePath);
      if (!stack || stack.redoStack.length === 0) return null;
      const entry = stack.redoStack[stack.redoStack.length - 1];
      return describeChanges(entry.changes);
    },

    clearHistory: (filePath) => set((state) => {
      if (filePath) {
        state.fileHistory.delete(filePath);
      } else {
        state.fileHistory = new Map();
      }
    }),

    reset: () => set({ fileHistory: new Map() }),
  }))
);

// Selectors
export const selectUndoStackSize = (state: HistoryState, filePath: string): number => {
  const stack = state.fileHistory.get(filePath);
  return stack ? stack.undoStack.length : 0;
};

export const selectRedoStackSize = (state: HistoryState, filePath: string): number => {
  const stack = state.fileHistory.get(filePath);
  return stack ? stack.redoStack.length : 0;
};
