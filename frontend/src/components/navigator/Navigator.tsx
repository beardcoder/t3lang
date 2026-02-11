import { FolderOpen, ChevronRight } from 'lucide-react';
import { useWorkspaceStore, useUIStore, usePersistenceStore } from '../../stores';
import { WorkspaceHeader } from './WorkspaceHeader';
import { GroupList } from './GroupList';
import { NavigatorFooter } from './NavigatorFooter';

interface NavigatorProps {
  readonly collapsed: boolean;
  readonly width: number;
}

export function Navigator({ collapsed, width }: Readonly<NavigatorProps>) {
  const projectRoot = useWorkspaceStore((state) => state.projectRoot);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const recentWorkspaces = usePersistenceStore((state) => state.recentWorkspaces);

  if (collapsed) {
    return (
      <div className="sidebar-frosted flex w-11 flex-col items-center border-r border-(--color-glass-border) py-2">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
          title="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <aside
      className="sidebar-frosted flex flex-col overflow-hidden border-r border-(--color-glass-border) transition-[width] duration-150 ease-out"
      style={{ width, minWidth: width }}
    >
      <WorkspaceHeader />

      <div className="flex-1 overflow-y-auto">
        {projectRoot ? <GroupList /> : <EmptyNavigator recentCount={recentWorkspaces.length} />}
      </div>

      <NavigatorFooter />
    </aside>
  );
}

function EmptyNavigator({ recentCount }: Readonly<{ recentCount: number }>) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="rounded-full bg-accent-light p-4">
        <FolderOpen className="h-8 w-8 text-accent" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-secondary">No project open</p>
        <p className="mt-1 text-xs leading-relaxed text-text-tertiary">
          {recentCount > 0 ? 'Open a recent project or select a folder' : 'Open a folder containing XLIFF files'}
        </p>
      </div>
    </div>
  );
}
