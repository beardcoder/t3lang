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
    <div className="w-64 h-full flex flex-col p-2 gap-2" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
      {/* Header */}
      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          T3Lang
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Translation Manager
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
        <button
          onClick={handleOpenFolder}
          className="w-full px-3 py-2 rounded-md font-medium text-sm flex items-center gap-3 hover:scale-[1.02]"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: 'white'
          }}
        >
          <Folder size={18} />
          <span>Open Folder</span>
        </button>

        <button
          onClick={handleOpenFile}
          className="w-full px-3 py-2 rounded-md font-medium text-sm flex items-center gap-3"
          style={{
            backgroundColor: 'var(--color-bg-hover)',
            color: 'var(--color-text-primary)'
          }}
        >
          <FileText size={18} />
          <span>Open File</span>
        </button>

        {fileGroups.length > 0 && (
          <button
            onClick={onNewLanguage}
            className="w-full px-3 py-2 rounded-md font-medium text-sm flex items-center gap-3"
            style={{
              backgroundColor: 'var(--color-bg-hover)',
              color: 'var(--color-text-primary)'
            }}
          >
            <Plus size={18} />
            <span>New Language</span>
          </button>
        )}
      </div>

      {/* File Tree */}
      {fileGroups.length > 0 && (
        <div className="flex-1 overflow-y-auto rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
          <div className="px-3 py-3 sticky top-0" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
              Files
            </h2>
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
