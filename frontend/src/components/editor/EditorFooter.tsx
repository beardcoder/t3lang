import { Save, AlertTriangle } from 'lucide-react';
import { useEditorStore, selectDirtyCount } from '../../stores';

interface EditorFooterProps {
  totalUnits: number;
  filteredUnits: number;
  missingCount: number;
}

export function EditorFooter({ totalUnits, filteredUnits, missingCount }: EditorFooterProps) {
  const dirtyCount = useEditorStore(selectDirtyCount);

  const isFiltered = filteredUnits !== totalUnits;
  const completionPercent = totalUnits > 0
    ? Math.round(((totalUnits - missingCount) / totalUnits) * 100)
    : 100;

  return (
    <div className="flex h-10 items-center justify-between border-t border-border bg-bg-secondary px-4 text-xs">
      <div className="flex items-center gap-4 text-text-tertiary">
        <span>
          {isFiltered ? (
            <>
              {filteredUnits} / {totalUnits} units
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
          {completionPercent}%
        </span>
      </div>

      <div className="flex items-center gap-2">
        {dirtyCount > 0 && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('save-all'))}
            className="flex items-center gap-1 rounded bg-accent px-2.5 py-1 text-white hover:bg-accent-hover active:scale-[0.97]"
            title="Save all changes"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{dirtyCount} unsaved</span>
          </button>
        )}
      </div>
    </div>
  );
}
