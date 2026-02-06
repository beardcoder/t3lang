import { motion, AnimatePresence } from 'motion/react';
import { FolderOpen, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
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

  return (
    <AnimatePresence initial={false}>
      {!collapsed && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="flex flex-col border-r border-border bg-bg-secondary overflow-hidden"
          style={{ minWidth: width }}
        >
          {/* Header with project name and collapse button */}
          <WorkspaceHeader />

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {projectRoot ? (
              <GroupList />
            ) : (
              <EmptyNavigator recentCount={recentWorkspaces.length} />
            )}
          </div>

          {/* Footer with actions */}
          <NavigatorFooter />
        </motion.aside>
      )}

      {/* Collapsed sidebar indicator */}
      {collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex w-10 flex-col items-center border-r border-border bg-bg-secondary py-2"
        >
          <button
            onClick={toggleSidebar}
            className="rounded p-1.5 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
            title="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
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
