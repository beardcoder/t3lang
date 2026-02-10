import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronRight, Settings } from 'lucide-react';
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

  // Debounced search: local state for instant input, debounce store update
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync local state when store changes externally (e.g., Escape clears)
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchQuery(value), 120);
  }, [setSearchQuery]);

  const handleClearSearch = useCallback(() => {
    setLocalSearch('');
    clearTimeout(debounceRef.current);
    setSearchQuery('');
  }, [setSearchQuery]);

  const activeGroup = activeGroupId ? groups.get(activeGroupId) : null;

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
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.length === 0 ? (
          <span className="text-text-tertiary">No project open</span>
        ) : (
          breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-text-tertiary" />
              )}
              <span
                className={`rounded px-1 py-0.5 ${
                  crumb.onClick
                    ? 'hover:bg-bg-tertiary text-text-primary cursor-pointer'
                    : 'text-text-secondary'
                }`}
                onClick={crumb.onClick}
              >
                {crumb.label}
              </span>
            </span>
          ))
        )}
      </nav>

      <div className="flex items-center gap-2">
        {viewMode === 'editor' && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search..."
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-8 w-56 rounded-md border border-border bg-bg-primary pl-8 pr-8 text-sm placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {localSearch && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-tertiary hover:text-text-primary"
              >
                <span className="text-xs">×</span>
              </button>
            )}
          </div>
        )}

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
