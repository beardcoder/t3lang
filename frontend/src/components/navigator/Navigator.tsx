import { FolderOpen, ChevronRight } from 'lucide-react';
import { useWorkspaceStore, useUIStore, usePersistenceStore } from '../../stores';
import { WorkspaceHeader } from './WorkspaceHeader';
import { GroupList } from './GroupList';
import { NavigatorFooter } from './NavigatorFooter';

interface NavigatorProps {
  collapsed: boolean;
  width: number;
}

export function Navigator({ collapsed, width }: NavigatorProps) {
  const projectRoot = useWorkspaceStore((state) => state.projectRoot);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const recentWorkspaces = usePersistenceStore((state) => state.recentWorkspaces);

  if (collapsed) {
    return (
      <div className="flex w-10 flex-col items-center border-r border-(--color-glass-border) bg-(--color-glass) backdrop-blur-xl py-2">
        <button
          onClick={toggleSidebar}
          className="rounded p-1.5 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
          title="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <aside
      className="flex flex-col border-r border-(--color-glass-border) bg-(--color-glass) backdrop-blur-xl overflow-hidden transition-[width] duration-150 ease-out"
      style={{ width, minWidth: width }}
    >
      <WorkspaceHeader />

      <div className="flex-1 overflow-y-auto">
        {projectRoot ? (
          <GroupList />
        ) : (
          <EmptyNavigator recentCount={recentWorkspaces.length} />
        )}
      </div>

      <NavigatorFooter />
    </aside>
  );
}

function EmptyNavigator({ recentCount }: { recentCount: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
      <FolderOpen className="h-12 w-12 text-text-tertiary" />
      <div>
        <p className="text-sm font-medium text-text-secondary">No project open</p>
        <p className="mt-1 text-xs text-text-tertiary">
          {recentCount > 0
            ? 'Open a recent project or select a folder'
            : 'Open a folder containing XLIFF files'}
        </p>
      </div>
    </div>
  );
}
