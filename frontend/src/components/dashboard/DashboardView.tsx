import { FolderOpen, FileText, Globe, AlertTriangle } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useWorkspaceStore, usePersistenceStore, selectGroupsList } from '../../stores';
import { StatsCard } from './StatsCard';
import { RecentWorkspaces } from './RecentWorkspaces';
import { MissingTranslations } from './MissingTranslations';
import { OpenFolderDialog } from '../../../wailsjs/go/main/App';

export function DashboardView() {
  const projectRoot = useWorkspaceStore((state) => state.projectRoot);
  const groups = useWorkspaceStore(useShallow(selectGroupsList));
  const fileCache = useWorkspaceStore((state) => state.fileCache);
  const setViewMode = useWorkspaceStore((state) => state.setViewMode);
  const setActiveGroup = useWorkspaceStore((state) => state.setActiveGroup);
  const recentWorkspaces = usePersistenceStore((state) => state.recentWorkspaces);

  // Calculate stats
  let totalFiles = 0;
  let totalUnits = 0;
  let totalMissing = 0;
  const languagesSet = new Set<string>();

  for (const group of groups) {
    totalFiles += group.files.size;
    for (const lang of group.files.keys()) {
      if (lang !== 'default') {
        languagesSet.add(lang);
      }
    }
  }

  // Count units from cached files
  for (const fileData of fileCache.values()) {
    totalUnits += fileData.units.length;
    totalMissing += fileData.units.filter(u => !u.target || u.target.trim() === '').length;
  }

  const handleOpenFolder = async () => {
    try {
      const path = await OpenFolderDialog();
      if (path) {
        window.dispatchEvent(new CustomEvent('open-workspace', { detail: path }));
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  const handleOpenGroup = (groupId: string) => {
    setActiveGroup(groupId);
    setViewMode('editor');
  };

  // Show empty state when no project is open
  if (!projectRoot) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-5 p-8">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-text-primary">T3Lang</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Open a folder containing XLIFF files
          </p>
        </div>

        <button
          onClick={handleOpenFolder}
          className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          <FolderOpen className="h-4 w-4" />
          Open Folder
        </button>

        {recentWorkspaces.length > 0 && (
          <div className="mt-4 w-full max-w-md">
            <RecentWorkspaces />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            {projectRoot.split('/').pop()}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">{projectRoot}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatsCard
            icon={FileText}
            label="Groups"
            value={groups.length}
            color="accent"
          />
          <StatsCard
            icon={Globe}
            label="Languages"
            value={languagesSet.size}
            color="success"
          />
          <StatsCard
            icon={FileText}
            label="Files"
            value={totalFiles}
            color="accent"
          />
          <StatsCard
            icon={AlertTriangle}
            label="Missing"
            value={totalMissing}
            color={totalMissing > 0 ? 'warning' : 'success'}
          />
        </div>

        {/* Main content grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Translation groups */}
          <div className="rounded-lg border border-border bg-bg-secondary p-4">
            <h2 className="mb-4 text-sm font-medium text-text-primary">
              Translation Groups ({groups.length})
            </h2>
            <div className="space-y-2">
              {groups.slice(0, 10).map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleOpenGroup(group.id)}
                  className="flex w-full items-center justify-between rounded-md bg-bg-tertiary p-3 text-left hover:bg-bg-hover"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-text-tertiary" />
                    <span className="text-sm text-text-primary">{group.baseName}</span>
                  </div>
                  <span className="rounded bg-bg-secondary px-2 py-0.5 text-xs text-text-tertiary">
                    {group.files.size} files
                  </span>
                </button>
              ))}
              {groups.length > 10 && (
                <p className="pt-2 text-center text-xs text-text-tertiary">
                  +{groups.length - 10} more groups
                </p>
              )}
            </div>
          </div>

          {/* Missing translations */}
          <MissingTranslations groups={groups} fileCache={fileCache} onOpenGroup={handleOpenGroup} />
        </div>
      </div>
    </div>
  );
}
