import { Clock, FolderOpen, X } from 'lucide-react';
import { usePersistenceStore } from '../../stores';

export function RecentWorkspaces() {
  const recentWorkspaces = usePersistenceStore((state) => state.recentWorkspaces);
  const removeRecentWorkspace = usePersistenceStore((state) => state.removeRecentWorkspace);

  const handleOpenRecent = (path: string) => {
    globalThis.dispatchEvent(new CustomEvent('open-workspace', { detail: path }));
  };

  if (recentWorkspaces.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
        <div className="rounded-lg bg-accent-light p-1.5">
          <Clock className="h-3.5 w-3.5 text-accent" />
        </div>
        Recent Projects
      </div>

      <div className="space-y-2">
        {recentWorkspaces.map((workspace) => (
          <div
            key={workspace.path}
            className="group flex items-center justify-between rounded-xl border border-border-subtle/70 bg-bg-tertiary/60 p-2.5 transition-colors hover:border-accent/35 hover:bg-bg-tertiary"
          >
            <button
              onClick={() => handleOpenRecent(workspace.path)}
              className="flex flex-1 items-center gap-2 text-left"
            >
              <FolderOpen className="h-4 w-4 text-accent" />
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
              className="rounded-lg p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-bg-secondary"
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
