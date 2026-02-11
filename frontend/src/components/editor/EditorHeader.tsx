import { Globe, ArrowLeftRight, Filter, FilterX } from 'lucide-react';
import { useWorkspaceStore, useEditorStore, useUIStore } from '../../stores';
import type { TranslationGroup, FileData } from '../../types';

interface EditorHeaderProps {
  readonly group: TranslationGroup;
  readonly activeLanguage: string | null;
  readonly fileData: FileData;
}

export function EditorHeader({ group, activeLanguage, fileData }: Readonly<EditorHeaderProps>) {
  const setActiveLanguage = useWorkspaceStore((state) => state.setActiveLanguage);
  const showOnlyMissing = useEditorStore((state) => state.showOnlyMissing);
  const setShowOnlyMissing = useEditorStore((state) => state.setShowOnlyMissing);
  const openDialog = useUIStore((state) => state.openDialog);

  // Get available languages (excluding default/source)
  const languages = Array.from(group.files.keys())
    .filter((l) => l !== 'default')
    .sort((a, b) => a.localeCompare(b));

  return (
    <div className="flex h-12 items-center justify-between border-b border-(--color-glass-border) px-3 sm:px-4">
      <div className="flex items-center gap-1 overflow-x-auto">
        {languages.map((lang) => (
          <button
            key={lang}
            onClick={() => setActiveLanguage(lang)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
              activeLanguage === lang
                ? 'border-accent/35 bg-accent-light text-accent shadow-(--shadow-sm)'
                : 'border-transparent text-text-secondary hover:border-border-subtle hover:bg-bg-tertiary/70 hover:text-text-primary'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            {lang.toUpperCase()}
          </button>
        ))}

        {languages.length === 0 && <span className="text-sm text-text-tertiary">Source file (no translations)</span>}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowOnlyMissing(!showOnlyMissing)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${
            showOnlyMissing
              ? 'border-warning/35 bg-warning-light text-warning'
              : 'border-border-subtle/70 bg-bg-tertiary/70 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
          }`}
          title={showOnlyMissing ? 'Show all translations' : 'Show only missing translations'}
        >
          {showOnlyMissing ? <FilterX className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
          <span className="hidden sm:inline">{showOnlyMissing ? 'Missing only' : 'All'}</span>
        </button>

        <button
          onClick={() => openDialog('conversion', { groupId: group.id })}
          className="flex items-center gap-1.5 rounded-full border border-border-subtle/70 bg-bg-tertiary/70 px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
          title="Convert XLIFF version"
        >
          <ArrowLeftRight className="h-4 w-4" />
          <span className="hidden sm:inline">XLIFF {fileData.version}</span>
        </button>
      </div>
    </div>
  );
}
