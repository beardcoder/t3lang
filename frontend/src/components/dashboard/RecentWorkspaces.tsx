import { Clock, FolderOpen, X } from 'lucide-react';
import { usePersistenceStore } from '../../stores';

export function RecentWorkspaces() {
  const recentWorkspaces = usePersistenceStore((state) => state.recentWorkspaces);
  const removeRecentWorkspace = usePersistenceStore((state) => state.removeRecentWorkspace);

  const handleOpenRecent = (path: string) => {
    window.dispatchEvent(new CustomEvent('open-workspace', { detail: path }));
  };

  if (recentWorkspaces.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-bg-secondary p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-text-primary">
        <Clock className="h-4 w-4" />
        Recent Projects
      </div>

      <div className="space-y-1">
        {recentWorkspaces.map((workspace) => (
          <div
            key={workspace.path}
            className="group flex items-center justify-between rounded-md bg-bg-tertiary p-2 transition-colors hover:bg-bg-hover"
          >
            <button
              onClick={() => handleOpenRecent(workspace.path)}
              className="flex flex-1 items-center gap-2 text-left"
            >
              <FolderOpen className="h-4 w-4 text-text-tertiary" />
              <div className="overflow-hidden">
                <p className="truncate text-sm text-text-primary">{workspace.name}</p>
                <p className="truncate text-xs text-text-muted">{workspace.path}</p>
              </div>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                removeRecentWorkspace(workspace.path);
              }}
              className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-bg-secondary"
              title="Remove from recent"
            >
              <X className="h-3 w-3 text-text-tertiary" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
