import { FolderOpen } from 'lucide-react';
import { OpenFolderDialog } from '../../../wailsjs/go/main/App';

export function NavigatorFooter() {
  const isMac = navigator.platform.includes('Mac');

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

  return (
    <div className="border-t border-(--color-glass-border) p-2">
      <button
        onClick={handleOpenFolder}
        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
      >
        <FolderOpen className="h-4 w-4" />
        <span>Open Folder</span>
        <kbd className="ml-auto text-[10px] text-text-tertiary opacity-60">{isMac ? '⌘O' : 'Ctrl+O'}</kbd>
      </button>
    </div>
  );
}
