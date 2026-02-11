import { FolderOpen } from 'lucide-react';
import { OpenFolderDialog } from '../../../wailsjs/go/main/App';

export function NavigatorFooter() {
  const isMac = typeof navigator !== 'undefined' && /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent);

  const handleOpenFolder = async () => {
    try {
      const path = await OpenFolderDialog();

      if (path) {
        globalThis.dispatchEvent(new CustomEvent('open-workspace', { detail: path }));
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  return (
    <div className="border-t border-(--color-glass-border) p-2">
      <button
        onClick={handleOpenFolder}
        className="flex w-full items-center gap-2 rounded-lg border border-border-subtle/70 bg-bg-tertiary/75 px-2.5 py-2 text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
      >
        <FolderOpen className="h-4 w-4 text-accent" />
        <span>Open Folder</span>
        <kbd className="ml-auto rounded bg-bg-secondary px-1.5 py-0.5 text-[10px] text-text-tertiary opacity-80">
          {isMac ? '⌘O' : 'Ctrl+O'}
        </kbd>
      </button>
    </div>
  );
}
