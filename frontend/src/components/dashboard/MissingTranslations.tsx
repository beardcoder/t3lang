import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { TranslationGroup, FileData } from '../../types';

interface MissingTranslationsProps {
  groups: TranslationGroup[];
  fileCache: Map<string, FileData>;
  onOpenGroup: (groupId: string) => void;
}

interface MissingItem {
  groupId: string;
  groupName: string;
  language: string;
  missingCount: number;
}

export function MissingTranslations({ groups, fileCache, onOpenGroup }: MissingTranslationsProps) {
  // Collect missing translations by group and language
  const missingItems: MissingItem[] = [];

  for (const group of groups) {
    for (const [lang, fileMeta] of group.files.entries()) {
      if (lang === 'default') continue;

      const fileData = fileCache.get(fileMeta.path);
      if (!fileData) continue;

      const missing = fileData.units.filter(u => !u.target || u.target.trim() === '').length;
      if (missing > 0) {
        missingItems.push({
          groupId: group.id,
          groupName: group.baseName,
          language: lang,
          missingCount: missing,
        });
      }
    }
  }

  // Sort by missing count (highest first)
  missingItems.sort((a, b) => b.missingCount - a.missingCount);

  if (missingItems.length === 0) {
    return (
      <div className="surface-panel rounded-2xl p-4 sm:p-5">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">
          Missing Translations
        </h2>
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <div className="rounded-full bg-success-light p-3">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
          <p className="text-sm text-text-secondary">
            All translations complete!
          </p>
        </div>
      </div>
    );
  }

  const totalMissing = missingItems.reduce((sum, item) => sum + item.missingCount, 0);

  return (
    <div className="surface-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">
          Missing Translations
        </h2>
        <span className="rounded-full bg-warning-light px-2 py-0.5 text-xs font-medium text-warning">
          {totalMissing} total
        </span>
      </div>

      <div className="space-y-2">
        {missingItems.slice(0, 8).map((item, index) => (
          <button
            key={`${item.groupId}-${item.language}-${index}`}
            onClick={() => onOpenGroup(item.groupId)}
            className="flex w-full items-center justify-between rounded-xl border border-border-subtle/75 bg-bg-tertiary/60 p-3 text-left transition-colors hover:border-warning/45 hover:bg-bg-tertiary"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <div>
                <span className="text-sm text-text-primary">{item.groupName}</span>
                <span className="ml-2 rounded-full bg-bg-secondary px-1.5 py-0.5 text-xs text-text-tertiary">
                  {item.language.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-warning">
                {item.missingCount} missing
              </span>
              <ArrowRight className="h-4 w-4 text-text-tertiary" />
            </div>
          </button>
        ))}

        {missingItems.length > 8 && (
          <p className="pt-2 text-center text-xs text-text-tertiary">
            +{missingItems.length - 8} more items with missing translations
          </p>
        )}
      </div>
    </div>
  );
}
