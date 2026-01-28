import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { FolderOpen, FileText, Layers } from 'lucide-react';
import type { FileDataMap, T3FileGroup } from './FileTree';
import { collectMissingTranslations } from '../utils/dashboard';

interface DashboardProps {
  fileGroups: T3FileGroup[];
  fileDataMap: FileDataMap;
  onOpenFile: () => void;
  onOpenFolder: () => void;
  onOpenGroupFile: (filePath: string) => void;
}

export function Dashboard({ fileGroups, fileDataMap, onOpenFile, onOpenFolder, onOpenGroupFile }: DashboardProps) {
  const missing = useMemo(() => collectMissingTranslations(fileDataMap), [fileDataMap]);
  const [languageFilter, setLanguageFilter] = useState('all');

  const languageOptions = useMemo(() => {
    const langs = Array.from(new Set(missing.map((entry) => entry.language))).sort();
    return ['all', ...langs];
  }, [missing]);

  const filteredMissing = languageFilter === 'all'
    ? missing
    : missing.filter((entry) => entry.language === languageFilter);

  if (fileGroups.length === 0) {
    return (
      <div className="flex h-full items-center justify-center" style={{ backgroundColor: 'var(--color-bg-app)' }}>
        <div className="max-w-2xl px-8 text-center">
          <div className="mb-6 flex items-center justify-center">
            <div
              className="rounded-2xl p-5"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <Layers size={48} style={{ color: 'var(--color-accent)' }} />
            </div>
          </div>
          <h2 className="mb-3 text-3xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Translation Workspace
          </h2>
          <p className="mb-8 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Open a folder to view language groups and missing translations, or open a single file to start editing.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenFolder}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'white',
              }}
            >
              <FolderOpen size={16} />
              Open folder
            </button>
            <button
              onClick={onOpenFile}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-primary)',
              }}
            >
              <FileText size={16} />
              Open file
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: 'var(--color-bg-app)' }}>
      <div className="flex items-center justify-between border-b px-8 py-6" style={{ borderColor: 'var(--color-border-subtle)' }}>
        <div>
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--color-text-tertiary)' }}>
            Dashboard
          </p>
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Missing translations
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenFolder}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
          >
            <FolderOpen size={16} />
            Open folder
          </button>
          <button
            onClick={onOpenFile}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
          >
            <FileText size={16} />
            Open file
          </button>
        </div>
      </div>

      <div className="h-full overflow-auto px-8 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {filteredMissing.length} missing keys
          </div>
          <select
            value={languageFilter}
            onChange={(event) => setLanguageFilter(event.target.value)}
            className="rounded-md border px-2 py-1 text-xs"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-subtle)',
              color: 'var(--color-text-primary)',
            }}
          >
            {languageOptions.map((lang) => (
              <option key={lang} value={lang}>
                {lang === 'all' ? 'All languages' : lang.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-subtle)' }}
        >
          {filteredMissing.length === 0 ? (
            <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              No missing translations for this filter.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMissing.map((entry) => (
                <div key={`${entry.filePath}-${entry.id}`} className="flex items-center justify-between gap-6">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {entry.id}
                    </div>
                    <div className="truncate text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {entry.source}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase"
                      style={{
                        borderColor: 'var(--color-border-subtle)',
                        color: 'var(--color-text-tertiary)',
                      }}
                    >
                      {entry.language}
                    </span>
                    <button
                      onClick={() => onOpenGroupFile(entry.filePath)}
                      className="rounded-md px-3 py-1.5 text-xs"
                      style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
                    >
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
