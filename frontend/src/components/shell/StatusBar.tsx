import { Circle, CloudOff, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useWorkspaceStore, useEditorStore, selectDirtyCount } from '../../stores';

export function StatusBar() {
  const projectRoot = useWorkspaceStore((state) => state.projectRoot);
  const groups = useWorkspaceStore((state) => state.groups);
  const isScanning = useWorkspaceStore((state) => state.isScanning);

  const dirtyCount = useEditorStore(selectDirtyCount);
  const hasUnsavedChanges = useEditorStore((state) => state.hasUnsavedChanges());

  // Calculate stats
  const totalGroups = groups.size;
  let totalFiles = 0;
  for (const group of groups.values()) {
    totalFiles += group.files.size;
  }

  return (
    <footer className="flex h-6 items-center justify-between border-t border-border bg-bg-secondary px-3 text-xs text-text-tertiary">
      {/* Left side - Sync status */}
      <div className="flex items-center gap-3">
        {/* Dirty indicator */}
        {hasUnsavedChanges ? (
          <div className="flex items-center gap-1.5 text-amber-500">
            <Circle className="h-2 w-2 fill-current" />
            <span>{dirtyCount} unsaved</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-green-500">
            <Check className="h-3 w-3" />
            <span>Saved</span>
          </div>
        )}

        {/* Scanning indicator */}
        {isScanning && (
          <div className="flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Scanning...</span>
          </div>
        )}
      </div>

      {/* Center - Project info */}
      <div className="flex items-center gap-4">
        {projectRoot ? (
          <>
            <span>{totalGroups} groups</span>
            <span>•</span>
            <span>{totalFiles} files</span>
          </>
        ) : (
          <span>No project open</span>
        )}
      </div>

      {/* Right side - Connection status */}
      <div className="flex items-center gap-2">
        {/* File watcher status - could be enhanced */}
        {projectRoot ? (
          <div className="flex items-center gap-1 text-green-500" title="Watching for changes">
            <Circle className="h-2 w-2 fill-current" />
            <span>Watching</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-text-tertiary" title="No project open">
            <CloudOff className="h-3 w-3" />
            <span>Idle</span>
          </div>
        )}
      </div>
    </footer>
  );
}
