import * as xliff from 'xliff-simple';
import type { TranslationFile, TranslationUnit as XliffUnit, XliffDocument, XliffVersion } from 'xliff-simple';
import { ReadTextFile, WriteTextFile, ReadDir, Exists, Remove } from '../../wailsjs/go/main/App';

type UiTranslationUnit = XliffUnit & { target: string };

export interface FileData {
  path: string;
  xliffData: XliffDocument;
  units: UiTranslationUnit[];
  sourceLanguage: string;
  targetLanguage: string;
  version: XliffVersion;
  language: string;
  baseName: string;
  isSourceOnly: boolean;
}

function parseT3FileName(fileName: string): {
  baseName: string;
  language: string;
} {
  const langMatch = fileName.match(/^([a-z]{2})\.(.+)\.xlf$/);

  if (langMatch) {
    return {
      language: langMatch[1],
      baseName: langMatch[2],
    };
  }

  const baseMatch = fileName.match(/^(.+)\.xlf$/);

  if (baseMatch) {
    return {
      language: 'default',
      baseName: baseMatch[1],
    };
  }

  return {
    language: 'default',
    baseName: fileName,
  };
}

export function useFileOperations() {
  const loadFile = async (
    filePath: string,
    showError: (message: string, title: string, kind: 'error') => Promise<void>,
  ): Promise<FileData | null> => {
    try {
      const content = await ReadTextFile(filePath);

      const fileName = filePath.split(/[\\/]/).pop() || filePath;
      const { baseName, language } = parseT3FileName(fileName);
      const isSourceOnly = language === 'default';

      const parsed = xliff.parse(content);
      const extractedUnits: UiTranslationUnit[] = [];
      let sourceLanguage = 'en';
      let targetLanguage = isSourceOnly ? '' : language || 'de';
      const version: XliffVersion = parsed.version ?? '1.2';

      parsed.files.forEach((file: TranslationFile) => {
        if (file.sourceLanguage) {
          sourceLanguage = file.sourceLanguage;
        }
        if (!isSourceOnly && file.targetLanguage) {
          targetLanguage = file.targetLanguage;
        }

        file.units.forEach((unit: XliffUnit) => {
          extractedUnits.push({
            id: unit.id,
            source: unit.source,
            target: isSourceOnly ? '' : unit.target ? String(unit.target) : '',
            note: unit.note,
            state: unit.state,
          });
        });
      });

      return {
        path: filePath,
        xliffData: parsed,
        units: extractedUnits,
        sourceLanguage,
        targetLanguage,
        version,
        language,
        baseName,
        isSourceOnly,
      };
    } catch (error) {
      await showError(`Failed to load file: ${error}`, 'File error', 'error');

      return null;
    }
  };

  const saveFile = async (
    filePath: string,
    xliffData: XliffDocument,
    showError: (message: string, title: string, kind: 'error') => Promise<void>,
    indent?: string,
  ) => {
    try {
      const xliffContent = xliff.write(xliffData, undefined, {
        format: true,
        indent: indent ?? '\t',
      });

      await WriteTextFile(filePath, xliffContent);
    } catch (error) {
      await showError(`Failed to save: ${error}`, 'Save error', 'error');
    }
  };

  const scanForXliffFiles = async (dirPath: string): Promise<Array<{ name: string; path: string }>> => {
    try {
      const entries = await ReadDir(dirPath);

      return entries.map((entry) => ({
        name: entry.name,
        path: entry.path,
      }));
    } catch {
      return [];
    }
  };

  const checkFileExists = async (filePath: string): Promise<boolean> => {
    try {
      return await Exists(filePath);
    } catch {
      return false;
    }
  };

  const deleteFile = async (
    filePath: string,
    showError: (message: string, title: string, kind: 'error') => Promise<void>,
  ): Promise<boolean> => {
    try {
      await Remove(filePath);

      return true;
    } catch (error) {
      await showError(`Failed to delete file: ${error}`, 'Delete error', 'error');

      return false;
    }
  };

  return {
    loadFile,
    saveFile,
    scanForXliffFiles,
    checkFileExists,
    deleteFile,
    parseT3FileName,
  };
}
