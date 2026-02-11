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
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync local state when store changes externally (e.g., Escape clears)
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearch(value);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setSearchQuery(value), 120);
    },
    [setSearchQuery],
  );

  const handleClearSearch = useCallback(() => {
    setLocalSearch('');
    clearTimeout(debounceRef.current);
    setSearchQuery('');
  }, [setSearchQuery]);

  const activeGroup = activeGroupId ? groups.get(activeGroupId) : null;
  const isMac = typeof navigator !== 'undefined' && /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent);

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
    <div className="flex h-12 items-center justify-between border-b border-(--color-glass-border) px-3 sm:px-4">
      <nav className="flex min-w-0 items-center gap-1 text-sm">
        {breadcrumbs.length === 0 ? (
          <span className="truncate text-[12px] text-text-tertiary">
            No project open yet. Start with one folder, one clear focus.
          </span>
        ) : (
          breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            let crumbClassName = 'rounded px-1 py-0.5 ';

            if (crumb.onClick) {
              crumbClassName += 'cursor-pointer rounded-full px-2.5 py-1 text-text-primary hover:bg-bg-tertiary';
            } else if (isLast) {
              crumbClassName += 'rounded-full bg-accent-light px-2.5 py-1 font-medium text-accent';
            } else {
              crumbClassName += 'max-w-44 truncate rounded-full bg-bg-tertiary/70 px-2.5 py-1 text-text-tertiary';
            }

            return (
              <span key={`breadcrumb-${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1">
                {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-text-tertiary/75" />}
                {crumb.onClick ? (
                  <button type="button" className={crumbClassName} onClick={crumb.onClick}>
                    {crumb.label}
                  </button>
                ) : (
                  <span className={crumbClassName}>{crumb.label}</span>
                )}
              </span>
            );
          })
        )}
      </nav>

      <div className="flex items-center gap-2">
        {viewMode === 'editor' && (
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search..."
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-8 w-56 rounded-full border border-border-subtle/70 /70 pl-9 pr-[4.2rem] text-sm text-text-primary placeholder:text-text-muted shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] focus:border-accent focus:bg-bg-elevated focus:outline-hidden focus:ring-1 focus:ring-accent"
            />
            {localSearch && (
              <button
                onClick={handleClearSearch}
                className="absolute right-8 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-tertiary hover:text-text-primary"
              >
                <span className="text-xs">×</span>
              </button>
            )}
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-bg-tertiary px-1.5 py-0.5 text-[10px] text-text-tertiary">
              {isMac ? '⌘F' : 'Ctrl+F'}
            </kbd>
          </div>
        )}

        <button
          onClick={() => openDialog('settings')}
          className="flex items-center gap-1.5 rounded-full border border-border-subtle/80 bg-bg-tertiary/70 px-2.5 py-1.5 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden text-xs font-medium sm:inline">Settings</span>
        </button>
      </div>
    </div>
  );
}
