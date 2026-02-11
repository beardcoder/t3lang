import { FolderOpen, FileText, Globe, AlertTriangle, Sparkles } from 'lucide-react';
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

  for (const fileData of fileCache.values()) {
    totalUnits += fileData.units.length;
    totalMissing += fileData.units.filter((u) => !u.target || u.target.trim() === '').length;
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

  if (!projectRoot) {
    return (
      <div className="soft-scroll h-full overflow-auto px-4 py-6 sm:px-8">
        <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col items-center justify-center gap-7">
          <div className="relative">
            <div className="absolute inset-0 rounded-[28px] bg-accent-light/70 blur-xl" />
            <div className="surface-panel relative flex items-center gap-4 rounded-[28px] px-6 py-5">
              <div className="rounded-2xl bg-accent-light p-3">
                <Sparkles className="h-7 w-7 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-text-primary">T3Lang</h1>
                <p className="mt-1 text-sm text-text-secondary">
                  Calm workspace for fast, precise translation work.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenFolder}
            className="flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-md)] hover:bg-accent-hover"
          >
            <FolderOpen className="h-4 w-4" />
            Open Workspace Folder
          </button>

          <p className="max-w-md text-center text-xs leading-relaxed text-text-tertiary">
            Pick the folder that holds your XLIFF files. T3Lang keeps your flow simple:
            scan, focus, translate, save.
          </p>

          {recentWorkspaces.length > 0 && (
            <div className="mt-2 w-full max-w-2xl">
              <RecentWorkspaces />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="soft-scroll h-full overflow-auto p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="surface-panel rounded-2xl px-5 py-4 sm:px-6">
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">
            {projectRoot.split('/').pop()}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">{projectRoot}</p>
        </div>

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
            label="Units"
            value={totalUnits}
            color="accent"
          />
          <StatsCard
            icon={AlertTriangle}
            label="Missing"
            value={totalMissing}
            color={totalMissing > 0 ? 'warning' : 'success'}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="surface-panel rounded-2xl p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">
                Translation Groups
              </h2>
              <span className="rounded-full bg-bg-tertiary px-2 py-0.5 text-xs text-text-tertiary">
                {groups.length}
              </span>
            </div>
            <p className="mb-3 text-xs text-text-tertiary">
              {totalFiles} files detected across all groups.
            </p>
            <div className="space-y-2">
              {groups.slice(0, 10).map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleOpenGroup(group.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-border-subtle/80 bg-bg-tertiary/60 p-3 text-left hover:border-accent/40 hover:bg-bg-tertiary"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-accent-light p-1.5">
                      <FileText className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <span className="text-sm text-text-primary">{group.baseName}</span>
                  </div>
                  <span className="rounded-full bg-bg-secondary px-2 py-0.5 text-xs text-text-tertiary">
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

          <MissingTranslations groups={groups} fileCache={fileCache} onOpenGroup={handleOpenGroup} />
        </div>
      </div>
    </div>
  );
}
