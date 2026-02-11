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
    <footer className="surface-glass flex h-8 items-center justify-between border-t border-(--color-glass-border) px-3 text-xs text-text-tertiary">
      <div className="flex items-center gap-3">
        {isScanning ? (
          <div className="flex items-center gap-1.5 text-accent">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="font-medium">Scanning workspace...</span>
          </div>
        ) : hasUnsavedChanges ? (
          <div className="flex items-center gap-1.5 text-warning">
            <Circle className="h-2 w-2 fill-current" />
            <span className="font-medium">{dirtyCount} unsaved changes</span>
          </div>
        ) : projectRoot ? (
          <span className="rounded-full bg-success-light px-2 py-0.5 text-[11px] font-medium text-success">
            Ready
          </span>
        ) : null}
      </div>

      {projectRoot && (
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-bg-tertiary/75 px-2 py-0.5">
            {groups.size} groups
          </span>
          <span className="rounded-full bg-bg-tertiary/75 px-2 py-0.5">
            {totalFiles} files
          </span>
        </div>
      )}
    </footer>
  );
}
