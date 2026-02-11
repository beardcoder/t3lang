import { Save, AlertTriangle } from 'lucide-react';
import { useEditorStore, selectDirtyCount } from '../../stores';

interface EditorFooterProps {
  totalUnits: number;
  filteredUnits: number;
  missingCount: number;
}

export function EditorFooter({ totalUnits, filteredUnits, missingCount }: Readonly<EditorFooterProps>) {
  const dirtyCount = useEditorStore(selectDirtyCount);

  const isFiltered = filteredUnits !== totalUnits;
  const completionPercent = totalUnits > 0 ? Math.round(((totalUnits - missingCount) / totalUnits) * 100) : 100;

  return (
    <div className="flex h-10 items-center justify-between border-t border-(--color-glass-border) px-3 sm:px-4 text-xs">
      <div className="flex items-center gap-2 text-text-tertiary">
        <span className="rounded-full bg-bg-tertiary/75 px-2 py-0.5">
          {isFiltered ? (
            <>
              {filteredUnits} / {totalUnits} units
            </>
          ) : (
            <>{totalUnits} units</>
          )}
        </span>

        {missingCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-warning-light px-2 py-0.5 text-warning">
            <AlertTriangle className="h-3 w-3" />
            {missingCount} missing
          </span>
        )}

        <span
          className={`rounded-full px-2 py-0.5 ${completionPercent === 100 ? 'bg-success-light text-success' : 'bg-bg-tertiary/75 text-text-tertiary'}`}
        >
          {completionPercent}%
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 md:flex">
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-bg-tertiary">
            <div
              className={`h-full rounded-full ${completionPercent === 100 ? 'bg-success' : 'bg-accent'}`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {dirtyCount > 0 && (
          <button
            onClick={() => globalThis.dispatchEvent(new CustomEvent('save-all'))}
            className="flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-white shadow-(--shadow-sm) hover:bg-accent-hover active:scale-[0.97]"
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
