import { FileText, ArrowLeft } from 'lucide-react';
import { useWorkspaceStore } from '../../stores';

export function EmptyEditor() {
  const projectRoot = useWorkspaceStore((state) => state.projectRoot);
  const setViewMode = useWorkspaceStore((state) => state.setViewMode);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
      <div className="rounded-full bg-accent-light p-5">
        <FileText className="h-10 w-10 text-accent" />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          {projectRoot ? 'No file selected' : 'No project open'}
        </h2>
        <p className="mt-1 max-w-md text-sm text-text-secondary">
          {projectRoot
            ? 'Select a translation group from the sidebar to start editing'
            : 'Open a folder containing XLIFF files to get started'}
        </p>
      </div>

      {projectRoot && (
        <button
          onClick={() => setViewMode('dashboard')}
          className="mt-4 flex items-center gap-2 rounded-full border border-border-subtle bg-bg-tertiary/75 px-4 py-2 text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      )}
    </div>
  );
}
