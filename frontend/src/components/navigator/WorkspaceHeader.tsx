import { ChevronLeft, FolderOpen } from 'lucide-react';
import { useWorkspaceStore, useUIStore } from '../../stores';

export function WorkspaceHeader() {
  const projectRoot = useWorkspaceStore((state) => state.projectRoot);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  const projectName = projectRoot
    ? projectRoot.split('/').pop() || projectRoot
    : 'T3Lang';

  return (
    <div className="flex h-12 items-center justify-between border-b border-border px-3">
      <div className="flex items-center gap-2 overflow-hidden">
        <FolderOpen className="h-4 w-4 flex-shrink-0 text-text-secondary" />
        <span className="truncate text-sm font-medium text-text-primary" title={projectRoot || undefined}>
          {projectName}
        </span>
      </div>

      <button
        onClick={toggleSidebar}
        className="rounded p-1 text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary"
        title="Collapse sidebar"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    </div>
  );
}
