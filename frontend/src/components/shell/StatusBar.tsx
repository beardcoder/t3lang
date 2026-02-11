import { Circle, Loader2 } from 'lucide-react';
import { useWorkspaceStore, useEditorStore, selectDirtyCount } from '../../stores';

export function StatusBar() {
  const projectRoot = useWorkspaceStore((state) => state.projectRoot);
  const groups = useWorkspaceStore((state) => state.groups);
  const isScanning = useWorkspaceStore((state) => state.isScanning);

  const dirtyCount = useEditorStore(selectDirtyCount);
  const hasUnsavedChanges = dirtyCount > 0;

  let totalFiles = 0;
  for (const group of groups.values()) {
    totalFiles += group.files.size;
  }

  return (
    <footer className="flex h-6 items-center justify-between bg-(--color-glass) backdrop-blur-xl px-3 text-xs text-text-tertiary shadow-[0_-1px_2px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-3">
        {isScanning ? (
          <div className="flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Scanning...</span>
          </div>
        ) : hasUnsavedChanges ? (
          <div className="flex items-center gap-1.5 text-amber-500">
            <Circle className="h-2 w-2 fill-current" />
            <span>{dirtyCount} unsaved</span>
          </div>
        ) : projectRoot ? (
          <span>Ready</span>
        ) : null}
      </div>

      {projectRoot && (
        <div className="flex items-center gap-3">
          <span>{groups.size} groups</span>
          <span>{totalFiles} files</span>
        </div>
      )}
    </footer>
  );
}
