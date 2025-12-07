import { Folder, FileText, Plus } from 'lucide-react';
import { FileTree, T3FileGroup } from './FileTree';

interface SidebarProps {
  onFileOpen: (filePath: string) => void;
  onFolderOpen: (folderPath: string) => void;
  onNewLanguage: () => void;
  currentFile: string | null;
  fileGroups: T3FileGroup[];
}

export function Sidebar({ onFileOpen, onFolderOpen, onNewLanguage, currentFile, fileGroups }: SidebarProps) {
  const handleOpenFile = async () => {
    try {
      // @ts-ignore - Tauri dialog API
      const { open: openDialog } = await import('@tauri-apps/plugin-dialog');
      const selected = await openDialog({
        multiple: false,
        filters: [{
          name: 'XLIFF',
          extensions: ['xlf', 'xliff']
        }]
      });

      if (selected && typeof selected === 'string') {
        onFileOpen(selected);
      }
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const handleOpenFolder = async () => {
    try {
      // @ts-ignore - Tauri dialog API
      const { open: openDialog } = await import('@tauri-apps/plugin-dialog');
      const selected = await openDialog({
        directory: true,
        multiple: false
      });

      if (selected && typeof selected === 'string') {
        onFolderOpen(selected);
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  return (
    <div className="w-64 h-full flex flex-col p-3 gap-3" style={{ backgroundColor: 'var(--color-bg-secondary)', borderRight: '1px solid var(--color-border)' }}>
      <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          T3Lang
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Translation deck
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleOpenFolder}
          className="w-full px-3 py-3 rounded-lg font-semibold text-sm flex items-center gap-3 justify-between"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-bg-secondary)',
            boxShadow: '0 8px 24px rgba(30, 215, 96, 0.25)'
          }}
        >
          <span className="flex items-center gap-2">
            <Folder size={18} />
            <span>Open folder</span>
          </span>
          <span className="text-[10px] uppercase tracking-wide opacity-80">browse</span>
        </button>

        <button
          onClick={handleOpenFile}
          className="w-full px-3 py-3 rounded-lg font-semibold text-sm flex items-center gap-3 justify-between"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)'
          }}
        >
          <span className="flex items-center gap-2">
            <FileText size={18} />
            <span>Quick open</span>
          </span>
          <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>file</span>
        </button>

        {fileGroups.length > 0 && (
          <button
            onClick={onNewLanguage}
            className="w-full px-3 py-3 rounded-lg font-semibold text-sm flex items-center gap-3 justify-between"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)'
            }}
          >
            <span className="flex items-center gap-2">
              <Plus size={18} />
              <span>New language</span>
            </span>
            <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>add</span>
          </button>
        )}
      </div>

      {fileGroups.length > 0 && (
        <div className="flex-1 overflow-y-auto rounded-xl" style={{ backgroundColor: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>
          <div className="px-3 py-3 sticky top-0 flex items-center justify-between" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
              Files
            </h2>
            <span className="text-[10px] px-2 py-1 rounded-full" style={{
              backgroundColor: 'var(--color-bg-hover)',
              color: 'var(--color-text-secondary)'
            }}>
              {fileGroups.length} groups
            </span>
          </div>
          <FileTree
            fileGroups={fileGroups}
            selectedFile={currentFile}
            onFileSelect={onFileOpen}
          />
        </div>
      )}
    </div>
  );
}
