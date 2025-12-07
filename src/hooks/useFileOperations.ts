import * as xliff from "xliff-simple";

interface TranslationUnit {
  id: string;
  source: string;
  target: string;
}

export interface FileData {
  path: string;
  xliffData: any;
  units: TranslationUnit[];
  sourceLanguage: string;
  targetLanguage: string;
  version: "1.2" | "2.0";
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
      language: "default",
      baseName: baseMatch[1],
    };
  }

  return {
    language: "default",
    baseName: fileName,
  };
}

export function useFileOperations() {
  const loadFile = async (
    filePath: string,
    showError: (message: string, title: string, kind: "error") => Promise<void>
  ): Promise<FileData | null> => {
    try {
      const { readTextFile } = await import("@tauri-apps/plugin-fs");
      const content = await readTextFile(filePath);

      const fileName = filePath.split(/[\\/]/).pop() || filePath;
      const { baseName, language } = parseT3FileName(fileName);
      const isSourceOnly = language === "default";

      const parsed = xliff.parse(content);
      const extractedUnits: TranslationUnit[] = [];
      let sourceLanguage = "en";
      let targetLanguage = isSourceOnly ? "" : language || "de";
      let version: "1.2" | "2.0" = parsed.version || "1.2";

      parsed.files.forEach((file: any) => {
        if (file.sourceLanguage) sourceLanguage = file.sourceLanguage;
        if (!isSourceOnly && file.targetLanguage)
          targetLanguage = file.targetLanguage;

        file.units.forEach((unit: any) => {
          extractedUnits.push({
            id: unit.id,
            source: unit.source,
            target: isSourceOnly ? "" : unit.target || "",
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
      console.error("Failed to load file:", error);
      await showError(`Failed to load file: ${error}`, "File error", "error");
      return null;
    }
  };

  const saveFile = async (
    filePath: string,
    xliffData: any,
    showError: (message: string, title: string, kind: "error") => Promise<void>
  ) => {
    try {
      const xliffContent = xliff.write(xliffData);
      const { writeTextFile } = await import("@tauri-apps/plugin-fs");
      await writeTextFile(filePath, xliffContent);
    } catch (error) {
      console.error("Failed to save file:", error);
      await showError(`Failed to save: ${error}`, "Save error", "error");
    }
  };

  const scanForXliffFiles = async (
    dirPath: string
  ): Promise<Array<{ name: string; path: string }>> => {
    try {
      const { readDir } = await import("@tauri-apps/plugin-fs");
      const entries = await readDir(dirPath);
      const xliffFiles: Array<{ name: string; path: string }> = [];

      for (const entry of entries) {
        if (!entry.name) continue;
        const fullPath = `${dirPath}/${entry.name}`;

        if (entry.isDirectory) {
          const subFiles = await scanForXliffFiles(fullPath);
          xliffFiles.push(...subFiles);
        } else if (entry.name.endsWith(".xlf")) {
          xliffFiles.push({ name: entry.name, path: fullPath });
        }
      }

      return xliffFiles;
    } catch (error) {
      console.warn(`Failed to scan directory ${dirPath}:`, error);
      return [];
    }
  };

  const checkFileExists = async (filePath: string): Promise<boolean> => {
    try {
      const { exists } = await import("@tauri-apps/plugin-fs");
      return await exists(filePath);
    } catch {
      return false;
    }
  };

  const deleteFile = async (
    filePath: string,
    showError: (message: string, title: string, kind: "error") => Promise<void>
  ): Promise<boolean> => {
    try {
      const { remove } = await import("@tauri-apps/plugin-fs");
      await remove(filePath);
      return true;
    } catch (error) {
      console.error("Failed to delete file:", error);
      await showError(
        `Failed to delete file: ${error}`,
        "Delete error",
        "error"
      );
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
