import { useEffect, useMemo, useState } from "react";
import type { XliffDocument } from "xliff-simple";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { Sidebar } from "./components/Sidebar";
import { TranslationTable } from "./components/TranslationTable";
import { EmptyState } from "./components/EmptyState";
import { SearchBar } from "./components/SearchBar";
import { NewLanguageDialog } from "./components/NewLanguageDialog";
import { SettingsDialog } from "./components/SettingsDialog";
import { SyncPanel } from "./components/SyncPanel";
import { T3FileGroup } from "./components/FileTree";
import { useDialogs } from "./hooks/useDialogs";
import { useNotifications } from "./hooks/useNotifications";
import { useFileOperations, FileData } from "./hooks/useFileOperations";
import { useSettings } from "./contexts/SettingsContext";
import { useSync, detectChanges, needsSync } from "./hooks/useSync";
import { EventsOn } from "../wailsjs/runtime/runtime";
import { Stat, InstallCLI, UninstallCLI } from "../wailsjs/go/main/App";

const cloneXliffData = (data: XliffDocument): XliffDocument =>
  JSON.parse(JSON.stringify(data));

function AppContent() {
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [fileDataMap, setFileDataMap] = useState<Map<string, FileData>>(
    new Map(),
  );
  const [fileGroups, setFileGroups] = useState<T3FileGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [showNewLanguageDialog, setShowNewLanguageDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedBaseName, setSelectedBaseName] = useState<string>("");

  const { showMessage, confirmDialog, openFileDialog, openFolderDialog } = useDialogs();
  const { notify } = useNotifications();
  const { getIndentString } = useSettings();
  const {
    loadFile,
    saveFile,
    scanForXliffFiles,
    checkFileExists,
    deleteFile,
    parseT3FileName,
  } = useFileOperations();

  // Sync system
  const {
    syncState,
    pendingOperations,
    autoSyncEnabled,
    queueOperation,
    triggerSync,
    toggleAutoSync,
    updateProgress,
  } = useSync({
    autoSync: true,
    syncDelay: 1000,
    onSyncStart: () => {
      notify("Syncing files...", "File synchronization started");
    },
    onSyncComplete: (operations) => {
      notify(
        "Sync complete",
        `Synchronized ${operations.reduce((acc, op) => acc + op.filesAffected.length, 0)} files`
      );
    },
    onSyncError: (error) => {
      showMessage(error.message, "Sync Error", "error");
    },
  });

  const handleFileOpen = async (filePath: string) => {
    const fileData = await loadFile(filePath, showMessage);

    if (!fileData) {
      return;
    }
    const newMap = new Map(fileDataMap);

    newMap.set(filePath, fileData);
    setFileDataMap(newMap);
    setCurrentFile(filePath);
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
      await showMessage(
        `Failed to open folder: ${error}`,
        "Folder error",
        "error",
      );
    }
  };

  const handleSave = async (
    oldId: string,
    newId: string,
    source: string,
    target: string,
  ) => {
    if (!currentFile) return;
    const fileData = fileDataMap.get(currentFile);

    if (!fileData) return;

    const updatedData = cloneXliffData(fileData.xliffData);
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

    await saveFile(currentFile, updatedData, showMessage, getIndentString());

    const updatedUnits = fileData.units.map((unit) =>
      unit.id === oldId ? { id: newId, source, target: nextTarget } : unit,
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
      "Remove key",
    );

    if (!confirmed) return;

    const fileData = fileDataMap.get(currentFile);

    if (!fileData) return;

    const updatedData = cloneXliffData(fileData.xliffData);

    for (const file of updatedData.files) {
      file.units = file.units.filter((unit) => unit.id !== id);
    }

    await saveFile(currentFile, updatedData, showMessage, getIndentString());

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

    const updatedData = cloneXliffData(fileData.xliffData);
    let changed = false;

    updatedData.files.forEach((file) => {
      file.units = file.units.map((unit) => {
        if (unit.id === id) {
          changed = true;

          return { ...unit, target: "" };
        }

        return unit;
      });
    });

    if (!changed) return;

    await saveFile(currentFile, updatedData, showMessage, getIndentString());

    const updatedUnits = fileData.units.map((unit) =>
      unit.id === id ? { ...unit, target: "" } : unit,
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
        "warning",
      );

      return;
    }

    const updatedData = cloneXliffData(fileData.xliffData);

    if (updatedData.files.length > 0) {
      updatedData.files[0].units.push({
        id,
        source,
        target: "",
      });
    }

    await saveFile(currentFile, updatedData, showMessage, getIndentString());

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

    // Find all related files (same baseName, different languages)
    const currentBaseName = fileData.baseName;
    const relatedFiles = Array.from(fileDataMap.entries()).filter(
      ([, data]) => data.baseName === currentBaseName,
    );

    const newMap = new Map(fileDataMap);

    // Update version for all related files
    for (const [filePath, relatedFileData] of relatedFiles) {
      const updatedData = cloneXliffData(relatedFileData.xliffData);

      updatedData.version = version;

      await saveFile(filePath, updatedData, showMessage, getIndentString());

      newMap.set(filePath, {
        ...relatedFileData,
        xliffData: updatedData,
        version,
      });
    }

    setFileDataMap(newMap);
    notify(
      "Format synchronized",
      `Updated ${relatedFiles.length} files to XLIFF ${version}`,
    );
  };

  const handleReorder = async (
    newOrder: Array<{ id: string; source: string; target: string }>,
  ) => {
    if (!currentFile) return;

    const fileData = fileDataMap.get(currentFile);

    if (!fileData) return;

    // Find all related files (same baseName, different languages)
    const currentBaseName = fileData.baseName;
    const relatedFiles = Array.from(fileDataMap.entries()).filter(
      ([, data]) => data.baseName === currentBaseName,
    );

    // Queue sync operation
    queueOperation({
      id: `reorder-${Date.now()}`,
      type: 'reorder',
      baseName: currentBaseName,
      timestamp: new Date(),
      filesAffected: relatedFiles.map(([path]) => path),
    });

    // Create order map from new order
    const orderMap = new Map(newOrder.map((unit, index) => [unit.id, index]));

    const newMap = new Map(fileDataMap);
    let progress = 0;

    // Update all related files with the same order
    for (const [filePath, relatedFileData] of relatedFiles) {
      const updatedData = cloneXliffData(relatedFileData.xliffData);

      if (updatedData.files.length > 0) {
        // Sort units based on the order from newOrder
        const sortedUnits = [...updatedData.files[0].units].sort((a, b) => {
          const aIndex = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
          const bIndex = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;

          return aIndex - bIndex;
        });

        updatedData.files[0].units = sortedUnits;
      }

      await saveFile(filePath, updatedData, showMessage, getIndentString());

      newMap.set(filePath, {
        ...relatedFileData,
        xliffData: updatedData,
        units: updatedData.files[0].units.map((unit) => ({
          ...unit,
          target: unit.target ? String(unit.target) : "",
        })),
      });

      progress += (100 / relatedFiles.length);
      updateProgress(Math.round(progress));
    }

    setFileDataMap(newMap);
  };

  const handleNewLanguage = async (languageCode: string) => {
    if (!folderPath || !selectedBaseName) return;

    const targetGroup = fileGroups.find((g) => g.baseName === selectedBaseName);

    if (!targetGroup) {
      await showMessage("File group not found", "Error", "error");

      return;
    }

    const defaultFile = targetGroup.files.find((f) => f.language === "default");

    if (!defaultFile) {
      await showMessage("No default file found", "Language code", "warning");

      return;
    }

    const defaultData = fileDataMap.get(defaultFile.path);

    if (!defaultData) return;

    const defaultDir = defaultFile.path.substring(
      0,
      defaultFile.path.lastIndexOf("/"),
    );

    // Extract just the filename from baseName (which might contain relative path)
    const actualBaseName =
      selectedBaseName.split("/").pop() || selectedBaseName;
    const newFileName = `${languageCode}.${actualBaseName}.xlf`;
    const newFilePath = `${defaultDir}/${newFileName}`;

    try {
      if (await checkFileExists(newFilePath)) {
        await showMessage(
          `File ${newFileName} already exists!`,
          "Duplicate file",
          "warning",
        );

        return;
      }

      const newXliffData = cloneXliffData(defaultData.xliffData);

      if (newXliffData.files.length > 0) {
        newXliffData.files[0].targetLanguage = languageCode;
        newXliffData.files[0].units.forEach((unit) => {
          unit.target = "";
        });
      }

      await saveFile(newFilePath, newXliffData, showMessage, getIndentString());

      await handleFolderOpen(folderPath);
      setCurrentFile(newFilePath);
      setShowNewLanguageDialog(false);
      setSelectedBaseName("");
      notify(
        "Language file created",
        `${languageCode.toUpperCase()} ready to translate`,
      );
    } catch (error) {
      await showMessage(
        `Failed to create language file: ${error}`,
        "Language error",
        "error",
      );
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    const confirmed = await confirmDialog(
      "Delete this language file?\n\nThis action cannot be undone.",
      "Delete file",
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
    const unsubscribe = EventsOn("open-path", async (path: string) => {
      try {
        const fileInfo = await Stat(path);

        if (fileInfo.isDirectory) {
          await handleFolderOpen(path);
        } else if (fileInfo.isFile) {
          await handleFileOpen(path);
        }
      } catch (error) {
        await showMessage(`Failed to open: ${error}`, "Error", "error");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribeFile = EventsOn("menu-open-file", async () => {
      try {
        const selected = await openFileDialog();

        if (selected) {
          await handleFileOpen(selected);
        }
      } catch (error) {
        await showMessage(
          `Failed to open file: ${error}`,
          "File error",
          "error",
        );
      }
    });

    const unsubscribeFolder = EventsOn("menu-open-folder", async () => {
      try {
        const selected = await openFolderDialog();

        if (selected) {
          await handleFolderOpen(selected);
        }
      } catch (error) {
        await showMessage(
          `Failed to open folder: ${error}`,
          "Folder error",
          "error",
        );
      }
    });

    const unsubscribeInstallCli = EventsOn("menu-install-cli", async () => {
      try {
        const result = await InstallCLI();

        await showMessage(result, "CLI Installation", "info");
        notify("CLI Installed", 'You can now use "t3lang" in the terminal');
      } catch (error) {
        if (error !== "Installation cancelled.") {
          await showMessage(`${error}`, "Installation Error", "error");
        }
      }
    });

    const unsubscribeUninstallCli = EventsOn("menu-uninstall-cli", async () => {
      try {
        const result = await UninstallCLI();

        await showMessage(result, "CLI Uninstallation", "info");
        notify("CLI Uninstalled", '"t3lang" command removed');
      } catch (error) {
        if (error !== "Uninstallation cancelled.") {
          await showMessage(`${error}`, "Uninstallation Error", "error");
        }
      }
    });

    const unsubscribeSettings = EventsOn("menu-settings", () => {
      setShowSettingsDialog(true);
    });

    return () => {
      unsubscribeFile();
      unsubscribeFolder();
      unsubscribeInstallCli();
      unsubscribeUninstallCli();
      unsubscribeSettings();
    };
  }, []);

  return (
    <div
      className="flex h-screen flex-col"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      <div className="flex flex-1 overflow-hidden">
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
          fileDataMap={fileDataMap}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <AnimatePresence>
            {currentFileData && (
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
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
                  transition={{ duration: 0.12, ease: "easeOut" }}
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

      <SettingsDialog
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
      />

      {/* Sync Panel */}
      <SyncPanel
        syncState={syncState}
        pendingOperations={pendingOperations}
        autoSyncEnabled={autoSyncEnabled}
        onToggleAutoSync={toggleAutoSync}
        onManualSync={triggerSync}
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
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
