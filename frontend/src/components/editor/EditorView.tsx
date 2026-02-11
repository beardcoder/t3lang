import { useCallback, useMemo } from "react";
import {
  useWorkspaceStore,
  useEditorStore,
  useUIStore,
  selectActiveFile,
  selectFilteredUnits,
} from "../../stores";
import { EditorHeader } from "./EditorHeader";
import { VirtualUnitList } from "./VirtualUnitList";
import { EditorFooter } from "./EditorFooter";
import { EmptyEditor } from "./EmptyEditor";

export function EditorView() {
  const activeFile = useWorkspaceStore(selectActiveFile);
  const activeGroupId = useWorkspaceStore((state) => state.activeGroupId);
  const groups = useWorkspaceStore((state) => state.groups);
  const activeLanguage = useWorkspaceStore((state) => state.activeLanguage);
  const cacheFileData = useWorkspaceStore((state) => state.cacheFileData);
  const fileCache = useWorkspaceStore((state) => state.fileCache);

  const searchQuery = useEditorStore((state) => state.searchQuery);
  const showOnlyMissing = useEditorStore((state) => state.showOnlyMissing);

  const openDialog = useUIStore((state) => state.openDialog);

  const activeGroup = activeGroupId ? groups.get(activeGroupId) : null;

  // Delete a unit from all files in the group
  // Always define hooks - they handle null cases internally
  const handleDeleteUnit = useCallback(
    (unitId: string) => {
      if (!activeGroup) return;

      openDialog("confirm", {
        title: "Delete Translation Unit",
        message: `Remove "${unitId}" from all language files in this group?`,
        confirmLabel: "Delete",
        danger: true,
        onConfirm: () => {
          // Remove from all files in the group
          for (const fileMeta of activeGroup.files.values()) {
            const fileData = fileCache.get(fileMeta.path);
            if (!fileData) continue;

            const updatedUnits = fileData.units.filter((u) => u.id !== unitId);

            // Also remove from xliffData
            const updatedXliff = JSON.parse(JSON.stringify(fileData.xliffData));
            for (const file of updatedXliff.files) {
              file.units = file.units.filter(
                (u: { id: string }) => u.id !== unitId,
              );
            }

            cacheFileData(fileMeta.path, {
              ...fileData,
              xliffData: updatedXliff,
              units: updatedUnits,
            });

            // Mark file as dirty so it gets saved
            useEditorStore.getState().trackChange(fileMeta.path, {
              unitId: `__deleted__${unitId}`,
              field: "id",
              oldValue: unitId,
              newValue: "",
              timestamp: Date.now(),
            });
          }
        },
      });
    },
    [activeGroup, fileCache, cacheFileData, openDialog],
  );

  // Memoize filtered units to avoid recomputing on every render
  // Handle null activeFile case with empty array
  const filteredUnits = useMemo(
    () =>
      activeFile
        ? selectFilteredUnits(activeFile.units, searchQuery, showOnlyMissing)
        : [],
    [activeFile, searchQuery, showOnlyMissing],
  );

  // Memoize missing count to avoid inline .filter() on every render
  // Handle null activeFile case with 0
  const missingCount = useMemo(
    () =>
      activeFile
        ? activeFile.units.filter((u) => !u.target || u.target.trim() === "")
            .length
        : 0,
    [activeFile],
  );

  // If no file is loaded, show empty state (after all hooks are defined)
  if (!activeFile || !activeGroup) {
    return <EmptyEditor />;
  }

  return (
    <div className="flex h-full flex-col /35">
      <EditorHeader
        group={activeGroup}
        activeLanguage={activeLanguage}
        fileData={activeFile}
      />

      <div className="flex-1 overflow-hidden">
        <VirtualUnitList
          units={filteredUnits}
          filePath={activeFile.path}
          isSourceOnly={activeFile.isSourceOnly}
          onDeleteUnit={handleDeleteUnit}
        />
      </div>

      <EditorFooter
        totalUnits={activeFile.units.length}
        filteredUnits={filteredUnits.length}
        missingCount={missingCount}
      />
    </div>
  );
}
