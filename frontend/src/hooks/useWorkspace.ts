import { useCallback, useEffect, useRef } from 'react';
import * as xliff from 'xliff-simple';
import {
  useWorkspaceStore,
  useEditorStore,
  usePersistenceStore,
  useUIStore,
} from '../stores';
import {
  ScanWorkspace,
  ReadTextFile,
  WriteFileAtomic,
  StartWatching,
  StopWatching,
} from '../../wailsjs/go/main/App';
import { EventsOn } from '../../wailsjs/runtime/runtime';
import type { FileData, TranslationGroup, TranslationUnit } from '../types';

// Parse T3 file name to extract language and baseName
function parseT3FileName(fileName: string): { language: string; baseName: string } {
  const langMatch = fileName.match(/^([a-z]{2})\.(.+)\.xlf$/);
  if (langMatch) {
    return { language: langMatch[1], baseName: langMatch[2] };
  }

  const baseMatch = fileName.match(/^(.+)\.xlf$/);
  if (baseMatch) {
    return { language: 'default', baseName: baseMatch[1] };
  }

  return { language: 'default', baseName: fileName };
}

export function useWorkspace() {
  const setProjectRoot = useWorkspaceStore((state) => state.setProjectRoot);
  const setWorkspaceScan = useWorkspaceStore((state) => state.setWorkspaceScan);
  const setScanning = useWorkspaceStore((state) => state.setScanning);
  const setScanError = useWorkspaceStore((state) => state.setScanError);
  const cacheFileData = useWorkspaceStore((state) => state.cacheFileData);
  const markGroupLoaded = useWorkspaceStore((state) => state.markGroupLoaded);
  const evictOldGroups = useWorkspaceStore((state) => state.evictOldGroups);
  const groups = useWorkspaceStore((state) => state.groups);
  const fileCache = useWorkspaceStore((state) => state.fileCache);

  const clearAllChanges = useEditorStore((state) => state.clearAllChanges);

  const addRecentWorkspace = usePersistenceStore((state) => state.addRecentWorkspace);
  const updateLastSession = usePersistenceStore((state) => state.updateLastSession);

  const setLoading = useUIStore((state) => state.setLoading);
  const addNotification = useUIStore((state) => state.addNotification);

  // Load a single XLIFF file
  const loadFile = useCallback(async (filePath: string): Promise<FileData | null> => {
    // Check cache first
    const cached = fileCache.get(filePath);
    if (cached) return cached;

    try {
      const content = await ReadTextFile(filePath);
      const fileName = filePath.split(/[\\/]/).pop() || filePath;
      const { baseName, language } = parseT3FileName(fileName);
      const isSourceOnly = language === 'default';

      const parsed = xliff.parse(content);
      const extractedUnits: TranslationUnit[] = [];
      let sourceLanguage = 'en';
      let targetLanguage = isSourceOnly ? '' : language || 'de';
      const version = parsed.version ?? '1.2';

      parsed.files.forEach((file) => {
        if (file.sourceLanguage) {
          sourceLanguage = file.sourceLanguage;
        }
        if (!isSourceOnly && file.targetLanguage) {
          targetLanguage = file.targetLanguage;
        }

        file.units.forEach((unit) => {
          extractedUnits.push({
            id: unit.id,
            source: unit.source,
            target: isSourceOnly ? '' : (unit.target ? String(unit.target) : ''),
            note: unit.note,
            state: unit.state,
          });
        });
      });

      const fileData: FileData = {
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

      cacheFileData(filePath, fileData);
      return fileData;
    } catch (error) {
      console.error(`Failed to load file ${filePath}:`, error);
      return null;
    }
  }, [fileCache, cacheFileData]);

  // Load all files for a group in parallel
  const loadGroup = useCallback(async (group: TranslationGroup) => {
    setLoading(true, `Loading ${group.baseName}...`);

    try {
      const filePaths = Array.from(group.files.values()).map(f => f.path);
      await Promise.all(filePaths.map(path => loadFile(path)));
      markGroupLoaded(group.id);
      evictOldGroups();
    } finally {
      setLoading(false);
    }
  }, [loadFile, markGroupLoaded, evictOldGroups, setLoading]);

  // Open a workspace folder
  const openWorkspace = useCallback(async (folderPath: string) => {
    setScanning(true);
    clearAllChanges();

    try {
      const scan = await ScanWorkspace(folderPath);

      // Convert Go struct to our internal format
      const convertedGroups: TranslationGroup[] = scan.groups.map((g) => ({
        id: g.id,
        baseName: g.baseName,
        directory: g.directory,
        files: new Map(Object.entries(g.files)),
        sourceFile: g.sourceFile || null,
        coverage: {
          totalUnits: 0,
          translatedByLanguage: new Map(),
          missingByLanguage: new Map(),
        },
      }));

      setWorkspaceScan({
        rootPath: scan.rootPath,
        groups: convertedGroups,
        totalFiles: scan.totalFiles,
        totalUnits: 0,
      });

      // Add to recent workspaces
      const projectName = folderPath.split('/').pop() || folderPath;
      addRecentWorkspace(folderPath, projectName, convertedGroups.length);
      updateLastSession(folderPath);

      // Start file watching
      await StartWatching(folderPath);

      // Load first group by default
      if (convertedGroups.length > 0) {
        await loadGroup(convertedGroups[0]);
      }

      addNotification({
        type: 'success',
        title: 'Workspace opened',
        message: `Found ${convertedGroups.length} translation groups`,
      });
    } catch (error) {
      setScanError(String(error));
      addNotification({
        type: 'error',
        title: 'Failed to open workspace',
        message: String(error),
      });
    }
  }, [
    setScanning,
    clearAllChanges,
    setWorkspaceScan,
    setScanError,
    addRecentWorkspace,
    updateLastSession,
    loadGroup,
    addNotification,
  ]);

  // Close current workspace
  const closeWorkspace = useCallback(async () => {
    await StopWatching();
    setProjectRoot(null);
    clearAllChanges();
    updateLastSession(null);
  }, [setProjectRoot, clearAllChanges, updateLastSession]);

  // Track recently saved paths to suppress watcher notifications
  const recentlySaved = useRef(new Set<string>());

  // Save a file with current dirty changes
  const saveFile = useCallback(async (filePath: string) => {
    const fileData = fileCache.get(filePath);
    if (!fileData) return;

    const dirtyChanges = useEditorStore.getState().getChangesForFile(filePath);
    if (dirtyChanges.size === 0) return;

    try {
      // Apply changes to xliffData
      const updatedData = JSON.parse(JSON.stringify(fileData.xliffData));

      for (const [unitId, changes] of dirtyChanges) {
        for (const file of updatedData.files) {
          for (const unit of file.units) {
            if (unit.id === unitId) {
              for (const change of changes) {
                if (change.field === 'target') {
                  unit.target = change.newValue;
                } else if (change.field === 'source') {
                  unit.source = change.newValue;
                } else if (change.field === 'id') {
                  unit.id = change.newValue;
                }
              }
            }
          }
        }
      }

      // Write to file
      const settings = useUIStore.getState().settings;
      const indent = settings.indentType === 'tabs' ? '\t' : ' '.repeat(settings.indentSize);
      const content = xliff.write(updatedData, undefined, { format: true, indent });
      recentlySaved.current.add(filePath);
      await WriteFileAtomic(filePath, content);
      setTimeout(() => recentlySaved.current.delete(filePath), 2000);

      // Update cache and clear dirty state
      const newUnits = fileData.units.map((unit) => {
        const changes = dirtyChanges.get(unit.id);
        if (!changes) return unit;

        const updated = { ...unit };
        for (const change of changes) {
          if (change.field === 'target') updated.target = change.newValue;
          if (change.field === 'source') updated.source = change.newValue;
          if (change.field === 'id') updated.id = change.newValue;
        }
        return updated;
      });

      cacheFileData(filePath, {
        ...fileData,
        xliffData: updatedData,
        units: newUnits,
      });

      useEditorStore.getState().clearChanges(filePath);

      addNotification({
        type: 'success',
        title: 'File saved',
        message: filePath.split('/').pop(),
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Save failed',
        message: String(error),
      });
    }
  }, [fileCache, cacheFileData, addNotification]);

  // Save all dirty files in parallel
  const saveAllFiles = useCallback(async () => {
    const dirtyPaths = useEditorStore.getState().getDirtyPaths();
    await Promise.all(dirtyPaths.map(path => saveFile(path)));
  }, [saveFile]);

  // Listen for custom open-workspace event
  useEffect(() => {
    const handleOpenWorkspace = (e: CustomEvent<string>) => {
      openWorkspace(e.detail);
    };

    window.addEventListener('open-workspace', handleOpenWorkspace as EventListener);
    return () => {
      window.removeEventListener('open-workspace', handleOpenWorkspace as EventListener);
    };
  }, [openWorkspace]);

  // Listen for save-all event (from footer button / command palette)
  useEffect(() => {
    const handleSaveAll = () => { saveAllFiles(); };
    window.addEventListener('save-all', handleSaveAll);
    return () => window.removeEventListener('save-all', handleSaveAll);
  }, [saveAllFiles]);

  const openDialog = useUIStore((state) => state.openDialog);

  // Listen for file change events from watcher
  useEffect(() => {
    const unsubscribe = EventsOn('file-changed', (event: { type: string; path: string }) => {
      // Ignore events triggered by our own saves
      if (recentlySaved.current.has(event.path)) return;

      if (event.type === 'modify') {
        // Check if we have this file cached and if it's dirty
        const cached = fileCache.get(event.path);
        const isDirty = useEditorStore.getState().hasUnsavedChanges(event.path);

        if (cached && isDirty) {
          // Show conflict dialog
          openDialog('conflict', {
            filePath: event.path,
            onReload: async () => {
              // Reload the file from disk
              const newData = await loadFile(event.path);
              if (newData) {
                useEditorStore.getState().clearChanges(event.path);
              }
            },
            onKeepLocal: () => {
              // Do nothing, keep local changes
            },
            onDismiss: () => {
              // Do nothing
            },
          });
        } else if (cached) {
          // No local changes, just notify and reload silently
          loadFile(event.path);
          addNotification({
            type: 'info',
            title: 'File updated',
            message: event.path.split('/').pop(),
            duration: 3000,
          });
        }
      } else if (event.type === 'delete') {
        addNotification({
          type: 'warning',
          title: 'File deleted',
          message: event.path.split('/').pop(),
        });
      }
    });

    return () => unsubscribe();
  }, [fileCache, loadFile, addNotification, openDialog]);

  return {
    openWorkspace,
    closeWorkspace,
    loadFile,
    loadGroup,
    saveFile,
    saveAllFiles,
  };
}
