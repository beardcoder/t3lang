import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Sidebar } from "./components/Sidebar";
import { TranslationTable } from "./components/TranslationTable";
import { EmptyState } from "./components/EmptyState";
import { SearchBar } from "./components/SearchBar";
import { NewLanguageDialog } from "./components/NewLanguageDialog";
import { T3FileGroup } from "./components/FileTree";
import { useDialogs } from "./hooks/useDialogs";
import { useNotifications } from "./hooks/useNotifications";
import { useFileOperations, FileData } from "./hooks/useFileOperations";

function AppContent() {
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [fileDataMap, setFileDataMap] = useState<Map<string, FileData>>(
    new Map()
  );
  const [fileGroups, setFileGroups] = useState<T3FileGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [showNewLanguageDialog, setShowNewLanguageDialog] = useState(false);
  const [selectedBaseName, setSelectedBaseName] = useState<string>("");

  const { showMessage, confirmDialog } = useDialogs();
  const { notify } = useNotifications();
  const {
    loadFile,
    saveFile,
    scanForXliffFiles,
    checkFileExists,
    deleteFile,
    parseT3FileName,
  } = useFileOperations();

  const handleFileOpen = async (filePath: string) => {
    const fileData = await loadFile(filePath, showMessage);
    if (fileData) {
      const newMap = new Map(fileDataMap);
      newMap.set(filePath, fileData);
      setFileDataMap(newMap);
      setCurrentFile(filePath);
    }
  };

  const handleFolderOpen = async (folderPathValue: string) => {
    try {
      const xliffFiles = await scanForXliffFiles(folderPathValue);

      const newMap = new Map<string, FileData>();
      const t3Files: Array<{
        name: string;
        path: string;
        language: string;
        baseName: string;
      }> = [];

      for (const file of xliffFiles) {
        const fileData = await loadFile(file.path, showMessage);

        if (fileData) {
          newMap.set(file.path, fileData);

          const { baseName, language } = parseT3FileName(file.name);
          t3Files.push({
            name: file.name,
            path: file.path,
            language,
            baseName,
          });
        }
      }

      const groups = new Map<string, typeof t3Files>();
      t3Files.forEach((file) => {
        const directory = file.path.substring(0, file.path.lastIndexOf("/"));
        const groupKey = `${directory}/${file.baseName}`;

        if (!groups.has(groupKey)) {
          groups.set(groupKey, []);
        }
        groups.get(groupKey)!.push(file);
      });

      const groupArray: T3FileGroup[] = Array.from(groups.entries())
        .map(([groupKey, files]) => {
          const baseName = groupKey.substring(groupKey.lastIndexOf("/") + 1);
          const directory = groupKey.substring(0, groupKey.lastIndexOf("/"));

          const relativePath = directory
            .replace(folderPathValue, "")
            .replace(/^\//, "");
          const displayName = relativePath
            ? `${relativePath}/${baseName}`
            : baseName;

          return {
            baseName: displayName,
            files: files.sort((a, b) => {
              if (a.language === "default") return -1;
              if (b.language === "default") return 1;
              return a.language.localeCompare(b.language);
            }),
          };
        })
        .sort((a, b) => a.baseName.localeCompare(b.baseName));

      setFileDataMap(newMap);
      setFileGroups(groupArray);
      setFolderPath(folderPathValue);

      if (t3Files.length > 0) {
        setCurrentFile(t3Files[0].path);
      }
    } catch (error) {
      console.error("Failed to open folder:", error);
      await showMessage(
        `Failed to open folder: ${error}`,
        "Folder error",
        "error"
      );
    }
  };

  const handleSave = async (
    oldId: string,
    newId: string,
    source: string,
    target: string
  ) => {
    if (!currentFile) return;
    const fileData = fileDataMap.get(currentFile);
    if (!fileData) return;

    const updatedData = JSON.parse(JSON.stringify(fileData.xliffData));
    const nextTarget = fileData.isSourceOnly ? "" : target;
    let found = false;
    for (const file of updatedData.files) {
      for (const unit of file.units) {
        if (unit.id === oldId) {
          unit.id = newId;
          unit.source = source;
          unit.target = nextTarget;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    await saveFile(currentFile, updatedData, showMessage);

    const updatedUnits = fileData.units.map((unit) =>
      unit.id === oldId ? { id: newId, source, target: nextTarget } : unit
    );

    const newMap = new Map(fileDataMap);
    newMap.set(currentFile, {
      ...fileData,
      xliffData: updatedData,
      units: updatedUnits,
    });
    setFileDataMap(newMap);
    notify("Saved translation", `${newId} was updated`);
  };

  const handleDelete = async (id: string) => {
    if (!currentFile) return;
    const confirmed = await confirmDialog(
      `Delete translation key "${id}"?`,
      "Remove key"
    );
    if (!confirmed) return;

    const fileData = fileDataMap.get(currentFile);
    if (!fileData) return;

    const updatedData = JSON.parse(JSON.stringify(fileData.xliffData));
    for (const file of updatedData.files) {
      file.units = file.units.filter((unit: any) => unit.id !== id);
    }

    await saveFile(currentFile, updatedData, showMessage);

    const updatedUnits = fileData.units.filter((unit) => unit.id !== id);

    const newMap = new Map(fileDataMap);
    newMap.set(currentFile, {
      ...fileData,
      xliffData: updatedData,
      units: updatedUnits,
    });
    setFileDataMap(newMap);
    notify("Deleted translation", `${id} was removed`);
  };

  const handleClearTranslation = async (id: string) => {
    if (!currentFile) return;
    const fileData = fileDataMap.get(currentFile);
    if (!fileData || fileData.isSourceOnly) return;

    const updatedData = JSON.parse(JSON.stringify(fileData.xliffData));
    let changed = false;

    updatedData.files.forEach((file: any) => {
      file.units = file.units.map((unit: any) => {
        if (unit.id === id) {
          changed = true;
          return { ...unit, target: "" };
        }
        return unit;
      });
    });

    if (!changed) return;

    await saveFile(currentFile, updatedData, showMessage);

    const updatedUnits = fileData.units.map((unit) =>
      unit.id === id ? { ...unit, target: "" } : unit
    );

    const newMap = new Map(fileDataMap);
    newMap.set(currentFile, {
      ...fileData,
      xliffData: updatedData,
      units: updatedUnits,
    });
    setFileDataMap(newMap);
    notify("Cleared translation", `${id} target cleared`);
  };

  const handleAddKey = async (id: string, source: string) => {
    if (!currentFile) return;

    const fileData = fileDataMap.get(currentFile);
    if (!fileData) return;

    if (fileData.units.some((u) => u.id === id)) {
      await showMessage(
        `Translation key "${id}" already exists!`,
        "Duplicate key",
        "warning"
      );
      return;
    }

    const updatedData = JSON.parse(JSON.stringify(fileData.xliffData));
    if (updatedData.files.length > 0) {
      updatedData.files[0].units.push({
        id,
        source,
        target: "",
      });
    }

    await saveFile(currentFile, updatedData, showMessage);

    const updatedUnits = [...fileData.units, { id, source, target: "" }];

    const newMap = new Map(fileDataMap);
    newMap.set(currentFile, {
      ...fileData,
      xliffData: updatedData,
      units: updatedUnits,
    });
    setFileDataMap(newMap);
    notify("Added key", `${id} created in ${fileData.baseName}`);
  };

  const handleVersionChange = async (version: "1.2" | "2.0") => {
    if (!currentFile) return;

    const fileData = fileDataMap.get(currentFile);
    if (!fileData) return;

    const updatedData = JSON.parse(JSON.stringify(fileData.xliffData));
    updatedData.version = version;

    await saveFile(currentFile, updatedData, showMessage);

    const newMap = new Map(fileDataMap);
    newMap.set(currentFile, {
      ...fileData,
      xliffData: updatedData,
      version,
    });
    setFileDataMap(newMap);
  };

  const handleReorder = async (newOrder: Array<{ id: string; source: string; target: string }>) => {
    if (!currentFile) return;

    const fileData = fileDataMap.get(currentFile);
    if (!fileData) return;

    const updatedData = JSON.parse(JSON.stringify(fileData.xliffData));

    // Replace units array with the new order
    if (updatedData.files.length > 0) {
      updatedData.files[0].units = newOrder;
    }

    await saveFile(currentFile, updatedData, showMessage);

    const newMap = new Map(fileDataMap);
    newMap.set(currentFile, {
      ...fileData,
      xliffData: updatedData,
      units: newOrder,
    });
    setFileDataMap(newMap);
  };

  const handleNewLanguage = async (languageCode: string) => {
    if (!folderPath || !selectedBaseName) return;

    const targetGroup = fileGroups.find((g) => g.baseName === selectedBaseName);
    if (!targetGroup) {
      await showMessage("File group not found", "Error", "error");
      return;
    }

    const defaultFile = targetGroup.files.find(
      (f) => f.language === "default"
    );
    if (!defaultFile) {
      await showMessage("No default file found", "Language code", "warning");
      return;
    }

    const defaultData = fileDataMap.get(defaultFile.path);
    if (!defaultData) return;

    const defaultDir = defaultFile.path.substring(
      0,
      defaultFile.path.lastIndexOf("/")
    );

    // Extract just the filename from baseName (which might contain relative path)
    const actualBaseName = selectedBaseName.split('/').pop() || selectedBaseName;
    const newFileName = `${languageCode}.${actualBaseName}.xlf`;
    const newFilePath = `${defaultDir}/${newFileName}`;

    try {
      if (await checkFileExists(newFilePath)) {
        await showMessage(
          `File ${newFileName} already exists!`,
          "Duplicate file",
          "warning"
        );
        return;
      }

      const newXliffData = JSON.parse(JSON.stringify(defaultData.xliffData));
      if (newXliffData.files.length > 0) {
        newXliffData.files[0].targetLanguage = languageCode;
        newXliffData.files[0].units.forEach((unit: any) => {
          unit.target = "";
        });
      }

      await saveFile(newFilePath, newXliffData, showMessage);

      await handleFolderOpen(folderPath);
      setCurrentFile(newFilePath);
      setShowNewLanguageDialog(false);
      setSelectedBaseName("");
      notify(
        "Language file created",
        `${languageCode.toUpperCase()} ready to translate`
      );
    } catch (error) {
      console.error("Failed to create language file:", error);
      await showMessage(
        `Failed to create language file: ${error}`,
        "Language error",
        "error"
      );
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    const confirmed = await confirmDialog(
      `Delete this language file?\n\nThis action cannot be undone.`,
      "Delete file"
    );
    if (!confirmed) return;

    const success = await deleteFile(filePath, showMessage);
    if (!success) return;

    if (currentFile === filePath) {
      setCurrentFile(null);
    }

    if (folderPath) {
      await handleFolderOpen(folderPath);
    }

    notify("File deleted", "Language file removed");
  };

  const currentFileData = currentFile ? fileDataMap.get(currentFile) : null;
  const parsedMeta = useMemo(() => {
    if (!currentFile) return null;
    const name = currentFile.split(/[\\/]/).pop() || currentFile;
    return parseT3FileName(name);
  }, [currentFile]);

  const isSourceOnly =
    currentFileData?.isSourceOnly ?? parsedMeta?.language === "default";
  const targetLanguage =
    currentFileData?.targetLanguage ?? parsedMeta?.language ?? "";

  useEffect(() => {
    let unlistenFile: (() => void) | undefined;
    let unlistenFolder: (() => void) | undefined;

    const setupListeners = async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");

        unlistenFile = await listen("menu-open-file", async () => {
          try {
            const { open: openDialog } = await import(
              "@tauri-apps/plugin-dialog"
            );
            const selected = await openDialog({
              multiple: false,
              filters: [
                {
                  name: "XLIFF",
                  extensions: ["xlf", "xliff"],
                },
              ],
            });

            if (selected && typeof selected === "string") {
              handleFileOpen(selected);
            }
          } catch (error) {
            console.error("Failed to open file:", error);
          }
        });

        unlistenFolder = await listen("menu-open-folder", async () => {
          try {
            const { open: openDialog } = await import(
              "@tauri-apps/plugin-dialog"
            );
            const selected = await openDialog({
              directory: true,
              multiple: false,
            });

            if (selected && typeof selected === "string") {
              handleFolderOpen(selected);
            }
          } catch (error) {
            console.error("Failed to open folder:", error);
          }
        });
      } catch (error) {
        console.debug("Menu listeners not available:", error);
      }
    };

    setupListeners();

    return () => {
      unlistenFile?.();
      unlistenFolder?.();
    };
  }, []);

  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-bg-secondary)" }}
    >
      <div
        data-tauri-drag-region
        className="h-8 shrink-0"
        style={{
          backgroundColor: "var(--color-bg-secondary)",
        }}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          onFileOpen={handleFileOpen}
          onFolderOpen={handleFolderOpen}
          onAddLanguage={(baseName) => {
            setSelectedBaseName(baseName);
            setShowNewLanguageDialog(true);
          }}
          onDeleteFile={handleDeleteFile}
          currentFile={currentFile}
          fileGroups={fileGroups}
          fileDataMap={fileDataMap as any}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <AnimatePresence>
            {currentFileData && (
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
              />
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {currentFileData ? (
                <motion.div
                  key={currentFile}
                  initial={{ opacity: 0, y: 6, scale: 0.995 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.995 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="h-full"
                >
                  <TranslationTable
                    units={currentFileData.units}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onAddKey={handleAddKey}
                    onClearTranslation={handleClearTranslation}
                    onReorder={handleReorder}
                    searchQuery={searchQuery}
                    sourceLanguage={currentFileData.sourceLanguage}
                    targetLanguage={targetLanguage}
                    xliffVersion={currentFileData.version}
                    onVersionChange={handleVersionChange}
                    isSourceOnly={isSourceOnly}
                  />
                </motion.div>
              ) : (
                <EmptyState />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <NewLanguageDialog
        isOpen={showNewLanguageDialog}
        onClose={() => {
          setShowNewLanguageDialog(false);
          setSelectedBaseName("");
        }}
        onConfirm={handleNewLanguage}
      />
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig
      transition={{ duration: 0.2, ease: "easeOut" }}
      reducedMotion="user"
    >
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </MotionConfig>
  );
}
