import { useCallback } from 'react';
import { useHistoryStore, useEditorStore, useWorkspaceStore, useUIStore } from '../stores';
import type { UnitChange } from '../types';

export function useHistory() {
  const pushEntry = useHistoryStore((state) => state.pushEntry);
  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);
  const canUndo = useHistoryStore((state) => state.canUndo);
  const canRedo = useHistoryStore((state) => state.canRedo);

  const trackChange = useEditorStore((state) => state.trackChange);
  const clearChanges = useEditorStore((state) => state.clearChanges);

  const cacheFileData = useWorkspaceStore((state) => state.cacheFileData);
  const fileCache = useWorkspaceStore((state) => state.fileCache);

  const addNotification = useUIStore((state) => state.addNotification);

  // Apply changes to cached file data
  const applyChanges = useCallback(
    (filePath: string, changes: UnitChange[], reverse: boolean) => {
      const fileData = fileCache.get(filePath);

      if (!fileData) return;

      const updatedUnits = fileData.units.map((unit) => {
        const unitChanges = changes.filter((c) => c.unitId === unit.id);

        if (unitChanges.length === 0) return unit;

        const updated = { ...unit };

        for (const change of unitChanges) {
          const value = reverse ? change.oldValue : change.newValue;

          if (change.field === 'id') {
            updated.id = value;
          } else if (change.field === 'source') {
            updated.source = value;
          } else if (change.field === 'target') {
            updated.target = value;
          }
        }

        return updated;
      });

      // Update xliffData as well
      const updatedXliffData = JSON.parse(JSON.stringify(fileData.xliffData));

      for (const file of updatedXliffData.files) {
        for (const unit of file.units) {
          const unitChanges = changes.filter((c) => c.unitId === unit.id);

          for (const change of unitChanges) {
            const value = reverse ? change.oldValue : change.newValue;

            if (change.field === 'id') {
              unit.id = value;
            } else if (change.field === 'source') {
              unit.source = value;
            } else if (change.field === 'target') {
              unit.target = value;
            }
          }
        }
      }

      cacheFileData(filePath, {
        ...fileData,
        units: updatedUnits,
        xliffData: updatedXliffData,
      });
    },
    [fileCache, cacheFileData],
  );

  // Push current dirty changes to history and clear them
  const commitChanges = useCallback(
    (filePath: string) => {
      const dirtyChanges = useEditorStore.getState().getChangesForFile(filePath);

      if (dirtyChanges.size === 0) return;

      // Flatten all changes
      const allChanges: UnitChange[] = [];

      for (const changes of dirtyChanges.values()) {
        allChanges.push(...changes);
      }

      // Push to history
      pushEntry(filePath, allChanges);

      // Clear dirty state
      clearChanges(filePath);
    },
    [pushEntry, clearChanges],
  );

  // Perform undo
  const performUndo = useCallback(
    (filePath: string) => {
      if (!canUndo(filePath)) return;

      const entry = undo(filePath);

      if (!entry) return;

      // Apply changes in reverse
      applyChanges(filePath, entry.changes, true);

      // Track the reverse changes as dirty (so save will write them)
      for (const change of entry.changes) {
        trackChange(filePath, {
          ...change,
          oldValue: change.newValue,
          newValue: change.oldValue,
          timestamp: Date.now(),
        });
      }

      addNotification({
        type: 'info',
        title: 'Undo',
        duration: 2000,
      });
    },
    [canUndo, undo, applyChanges, trackChange, addNotification],
  );

  // Perform redo
  const performRedo = useCallback(
    (filePath: string) => {
      if (!canRedo(filePath)) return;

      const entry = redo(filePath);

      if (!entry) return;

      // Apply changes forward
      applyChanges(filePath, entry.changes, false);

      // Track the changes as dirty
      for (const change of entry.changes) {
        trackChange(filePath, {
          ...change,
          timestamp: Date.now(),
        });
      }

      addNotification({
        type: 'info',
        title: 'Redo',
        duration: 2000,
      });
    },
    [canRedo, redo, applyChanges, trackChange, addNotification],
  );

  return {
    commitChanges,
    performUndo,
    performRedo,
    canUndo,
    canRedo,
  };
}
