import { buildLanguageMatrix, collectMissingTranslations } from '../dashboard';
import type { FileData } from '../../hooks/useFileOperations';
import type { T3FileGroup } from '../../components/FileTree';

const fileGroups: T3FileGroup[] = [
  {
    baseName: 'labels',
    files: [
      { name: 'default.labels.xlf', path: '/a/default.labels.xlf', language: 'default', baseName: 'labels' },
      { name: 'de.labels.xlf', path: '/a/de.labels.xlf', language: 'de', baseName: 'labels' },
    ],
  },
  {
    baseName: 'messages',
    files: [
      { name: 'default.messages.xlf', path: '/a/default.messages.xlf', language: 'default', baseName: 'messages' },
      { name: 'fr.messages.xlf', path: '/a/fr.messages.xlf', language: 'fr', baseName: 'messages' },
    ],
  },
];

const makeFileData = (path: string, language: string, targetLanguage: string, target: string): FileData => ({
  path,
  xliffData: { files: [], version: '1.2' } as FileData['xliffData'],
  units: [
    {
      id: 'a',
      source: 'A',
      target,
    } as FileData['units'][number],
  ],
  sourceLanguage: 'en',
  targetLanguage,
  version: '1.2',
  language,
  baseName: 'labels',
  isSourceOnly: false,
});

test('buildLanguageMatrix returns languages and per-group status', () => {
  const matrix = buildLanguageMatrix(fileGroups);
  expect(matrix.languages).toEqual(['default', 'de', 'fr']);
  expect(matrix.byGroup.get('labels')?.get('fr')).toBe('missing');
  expect(matrix.byGroup.get('messages')?.get('de')).toBe('missing');
});

test('collectMissingTranslations returns only missing targets', () => {
  const fileDataMap = new Map<string, FileData>([
    ['/a/de.labels.xlf', makeFileData('/a/de.labels.xlf', 'de', 'de', '')],
    ['/a/fr.messages.xlf', makeFileData('/a/fr.messages.xlf', 'fr', 'fr', 'BB')],
  ]);

  const missing = collectMissingTranslations(fileDataMap);
  expect(missing).toHaveLength(1);
  expect(missing[0].id).toBe('a');
  expect(missing[0].language).toBe('de');
});
