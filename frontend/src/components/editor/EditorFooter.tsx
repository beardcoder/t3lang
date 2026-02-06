import { Plus, Save, AlertTriangle } from 'lucide-react';
import { useEditorStore, useUIStore, selectDirtyCount } from '../../stores';

interface EditorFooterProps {
  totalUnits: number;
  filteredUnits: number;
  missingCount: number;
}

export function EditorFooter({ totalUnits, filteredUnits, missingCount }: EditorFooterProps) {
  const dirtyCount = useEditorStore(selectDirtyCount);
  const openDialog = useUIStore((state) => state.openDialog);

  const isFiltered = filteredUnits !== totalUnits;
  const completionPercent = totalUnits > 0
    ? Math.round(((totalUnits - missingCount) / totalUnits) * 100)
    : 100;

  return (
    <div className="flex h-10 items-center justify-between border-t border-border bg-bg-secondary px-4 text-xs">
      {/* Left: Stats */}
      <div className="flex items-center gap-4 text-text-tertiary">
        <span>
          {isFiltered ? (
            <>
              Showing {filteredUnits} of {totalUnits} units
            </>
          ) : (
            <>{totalUnits} units</>
          )}
        </span>

        {missingCount > 0 && (
          <span className="flex items-center gap-1 text-warning">
            <AlertTriangle className="h-3 w-3" />
            {missingCount} missing
          </span>
        )}

        <span className={completionPercent === 100 ? 'text-success' : ''}>
          {completionPercent}% complete
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {dirtyCount > 0 && (
          <span className="mr-2 text-amber-500">
            {dirtyCount} unsaved
          </span>
        )}

        <button
          onClick={() => openDialog('add-unit')}
          className="flex items-center gap-1 rounded px-2 py-1 text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          title="Add translation unit"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Unit</span>
        </button>

        {dirtyCount > 0 && (
          <button
            className="flex items-center gap-1 rounded bg-accent px-2 py-1 text-white transition-colors hover:bg-accent-hover"
            title="Save all changes (Cmd+S)"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save</span>
          </button>
        )}
      </div>
    </div>
  );
}
