import { Search, ChevronRight, Settings, RefreshCw } from 'lucide-react';
import { useWorkspaceStore, useEditorStore, useUIStore } from '../../stores';

export function ContextBar() {
  const projectRoot = useWorkspaceStore((state) => state.projectRoot);
  const activeGroupId = useWorkspaceStore((state) => state.activeGroupId);
  const groups = useWorkspaceStore((state) => state.groups);
  const activeLanguage = useWorkspaceStore((state) => state.activeLanguage);
  const viewMode = useWorkspaceStore((state) => state.viewMode);

  const searchQuery = useEditorStore((state) => state.searchQuery);
  const setSearchQuery = useEditorStore((state) => state.setSearchQuery);

  const openDialog = useUIStore((state) => state.openDialog);

  const activeGroup = activeGroupId ? groups.get(activeGroupId) : null;

  // Build breadcrumb parts
  const breadcrumbs: { label: string; onClick?: () => void }[] = [];

  if (projectRoot) {
    const projectName = projectRoot.split('/').pop() || projectRoot;
    breadcrumbs.push({ label: projectName });
  }

  if (activeGroup && viewMode !== 'dashboard') {
    breadcrumbs.push({ label: activeGroup.baseName });

    if (activeLanguage && viewMode === 'editor') {
      const languageLabel = activeLanguage === 'default' ? 'Source' : activeLanguage.toUpperCase();
      breadcrumbs.push({ label: languageLabel });
    }
  }

  return (
    <div className="flex h-12 items-center justify-between border-b border-border bg-bg-secondary px-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.length === 0 ? (
          <span className="text-text-tertiary">No project open</span>
        ) : (
          breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-text-tertiary" />
              )}
              <button
                onClick={crumb.onClick}
                className={`rounded px-1 py-0.5 transition-colors ${
                  crumb.onClick
                    ? 'hover:bg-bg-tertiary text-text-primary'
                    : 'text-text-secondary cursor-default'
                }`}
                disabled={!crumb.onClick}
              >
                {crumb.label}
              </button>
            </span>
          ))
        )}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Search input */}
        {viewMode === 'editor' && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search translations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-64 rounded-md border border-border bg-bg-primary pl-8 pr-3 text-sm placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary"
              >
                <span className="text-xs">×</span>
              </button>
            )}
          </div>
        )}

        {/* Refresh button */}
        {projectRoot && (
          <button
            className="rounded p-1.5 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
            title="Refresh workspace"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}

        {/* Settings button */}
        <button
          onClick={() => openDialog('settings')}
          className="rounded p-1.5 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
