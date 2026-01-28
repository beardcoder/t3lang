import type { T3FileGroup } from '../components/FileTree';
import type { FileData } from '../hooks/useFileOperations';

export type LanguageStatus = 'present' | 'missing';

export function buildLanguageMatrix(fileGroups: T3FileGroup[]) {
  const languages = Array.from(
    new Set(fileGroups.flatMap((group) => group.files.map((file) => file.language))),
  ).sort((a, b) => {
    if (a === 'default') return -1;
    if (b === 'default') return 1;
    return a.localeCompare(b);
  });

  const byGroup = new Map<string, Map<string, LanguageStatus>>();

  fileGroups.forEach((group) => {
    const map = new Map<string, LanguageStatus>();
    const present = new Set(group.files.map((f) => f.language));

    languages.forEach((lang) => {
      map.set(lang, present.has(lang) ? 'present' : 'missing');
    });

    byGroup.set(group.baseName, map);
  });

  return { languages, byGroup };
}

export function collectMissingTranslations(fileDataMap: Map<string, FileData>) {
  const missing: Array<{ id: string; source: string; language: string; filePath: string }> = [];

  for (const [path, data] of fileDataMap.entries()) {
    if (data.isSourceOnly) continue;

    const language = data.targetLanguage || data.language || '';

    for (const unit of data.units) {
      if (!unit.target || String(unit.target).trim() === '') {
        missing.push({
          id: unit.id,
          source: unit.source,
          language,
          filePath: path,
        });
      }
    }
  }

  return missing;
}
