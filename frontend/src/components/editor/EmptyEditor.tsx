import { FileText, ArrowLeft } from 'lucide-react';
import { useWorkspaceStore } from '../../stores';

export function EmptyEditor() {
  const projectRoot = useWorkspaceStore((state) => state.projectRoot);
  const setViewMode = useWorkspaceStore((state) => state.setViewMode);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <FileText className="h-16 w-16 text-text-tertiary" />

      <div>
        <h2 className="text-lg font-medium text-text-primary">
          {projectRoot ? 'No file selected' : 'No project open'}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {projectRoot
            ? 'Select a translation group from the sidebar to start editing'
            : 'Open a folder containing XLIFF files to get started'}
        </p>
      </div>

      {projectRoot && (
        <button
          onClick={() => setViewMode('dashboard')}
          className="mt-4 flex items-center gap-2 rounded-md bg-bg-tertiary px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      )}
    </div>
  );
}
