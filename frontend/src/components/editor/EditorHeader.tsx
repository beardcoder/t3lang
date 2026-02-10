import { Globe, ArrowLeftRight, Filter, FilterX } from 'lucide-react';
import { useWorkspaceStore, useEditorStore, useUIStore } from '../../stores';
import type { TranslationGroup, FileData } from '../../types';

interface EditorHeaderProps {
  group: TranslationGroup;
  activeLanguage: string | null;
  fileData: FileData;
}

export function EditorHeader({ group, activeLanguage, fileData }: EditorHeaderProps) {
  const setActiveLanguage = useWorkspaceStore((state) => state.setActiveLanguage);
  const showOnlyMissing = useEditorStore((state) => state.showOnlyMissing);
  const setShowOnlyMissing = useEditorStore((state) => state.setShowOnlyMissing);
  const openDialog = useUIStore((state) => state.openDialog);

  // Get available languages (excluding default/source)
  const languages = Array.from(group.files.keys())
    .filter(l => l !== 'default')
    .sort((a, b) => a.localeCompare(b));

  return (
    <div className="flex h-12 items-center justify-between border-b border-border bg-bg-secondary px-4">
      {/* Left: Language tabs */}
      <div className="flex items-center gap-1">
        {languages.map((lang) => (
          <button
            key={lang}
            onClick={() => setActiveLanguage(lang)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
              activeLanguage === lang
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            {lang.toUpperCase()}
          </button>
        ))}

        {languages.length === 0 && (
          <span className="text-sm text-text-tertiary">
            Source file (no translations)
          </span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Filter: Show only missing */}
        <button
          onClick={() => setShowOnlyMissing(!showOnlyMissing)}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm ${
            showOnlyMissing
              ? 'bg-warning-light text-warning'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
          }`}
          title={showOnlyMissing ? 'Show all translations' : 'Show only missing translations'}
        >
          {showOnlyMissing ? (
            <FilterX className="h-4 w-4" />
          ) : (
            <Filter className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {showOnlyMissing ? 'Missing only' : 'All'}
          </span>
        </button>

        {/* Version conversion */}
        <button
          onClick={() => openDialog('conversion', { groupId: group.id })}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
          title="Convert XLIFF version"
        >
          <ArrowLeftRight className="h-4 w-4" />
          <span className="hidden sm:inline">
            XLIFF {fileData.version}
          </span>
        </button>
      </div>
    </div>
  );
}
