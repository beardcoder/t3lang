import { FolderOpen, Clock, Settings } from 'lucide-react';
import { useWorkspaceStore, useUIStore, usePersistenceStore } from '../../stores';
import { OpenFolderDialog } from '../../../wailsjs/go/main/App';

export function NavigatorFooter() {
  const openDialog = useUIStore((state) => state.openDialog);
  const setViewMode = useWorkspaceStore((state) => state.setViewMode);
  const recentWorkspaces = usePersistenceStore((state) => state.recentWorkspaces);

  const handleOpenFolder = async () => {
    try {
      const path = await OpenFolderDialog();
      if (path) {
        // Will be handled by workspace scanning logic
        window.dispatchEvent(new CustomEvent('open-workspace', { detail: path }));
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  return (
    <div className="border-t border-border p-2 space-y-1">
      <button
        onClick={handleOpenFolder}
        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
      >
        <FolderOpen className="h-4 w-4" />
        <span>Open Folder</span>
        <kbd className="ml-auto text-[10px] text-text-tertiary opacity-60">{navigator.platform.includes('Mac') ? '⌘O' : 'Ctrl+O'}</kbd>
      </button>

      {recentWorkspaces.length > 0 && (
        <button
          onClick={() => setViewMode('dashboard')}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        >
          <Clock className="h-4 w-4" />
          <span>Recent Projects</span>
          <span className="ml-auto rounded bg-bg-tertiary px-1.5 py-0.5 text-xs">
            {recentWorkspaces.length}
          </span>
        </button>
      )}

      <button
        onClick={() => openDialog('settings')}
        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
      >
        <Settings className="h-4 w-4" />
        <span>Settings</span>
      </button>
    </div>
  );
}
