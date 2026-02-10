import { useEffect } from 'react';
import { MotionConfig } from 'motion/react';
import { AppShell } from './components/shell';
import { DashboardView } from './components/dashboard/DashboardView';
import { EditorView } from './components/editor';
import { ToastContainer } from './components/common';
import { CommandPalette } from './components/common/CommandPalette';
import { AddLanguageDialog, SettingsDialog, ConversionDialog, ConflictDialog, ConfirmDialog } from './components/dialogs';
import { useWorkspaceStore, usePersistenceStore } from './stores';
import { useWorkspace, useKeyboard, useHistory } from './hooks';
import { EventsOn } from '../wailsjs/runtime/runtime';
import { Stat } from '../wailsjs/go/main/App';

function AppContent() {
  const viewMode = useWorkspaceStore((state) => state.viewMode);
  const activeGroupId = useWorkspaceStore((state) => state.activeGroupId);
  const groups = useWorkspaceStore((state) => state.groups);
  const fileCache = useWorkspaceStore((state) => state.fileCache);
  const activeLanguage = useWorkspaceStore((state) => state.activeLanguage);

  const lastWorkspace = usePersistenceStore((state) => state.lastWorkspace);

  const { openWorkspace, loadGroup, saveFile, saveAllFiles } = useWorkspace();
  const { performUndo, performRedo } = useHistory();

  // Get active file path for undo/redo
  const activeGroup = activeGroupId ? groups.get(activeGroupId) : null;
  const activeFilePath = activeGroup && activeLanguage
    ? activeGroup.files.get(activeLanguage)?.path
    : null;

  // Undo/Redo handlers
  const handleUndo = () => {
    if (!activeFilePath) return;
    performUndo(activeFilePath);
  };

  const handleRedo = () => {
    if (!activeFilePath) return;
    performRedo(activeFilePath);
  };

  // Keyboard shortcuts
  useKeyboard({
    onSave: () => {
      if (activeFilePath) {
        saveFile(activeFilePath);
      }
    },
    onSaveAll: saveAllFiles,
    onUndo: handleUndo,
    onRedo: handleRedo,
  });

  // Load active group when it changes
  useEffect(() => {
    if (activeGroup && !fileCache.has(activeGroup.files.values().next().value?.path)) {
      loadGroup(activeGroup);
    }
  }, [activeGroupId, activeGroup, fileCache, loadGroup]);

  // Restore last workspace on startup
  useEffect(() => {
    if (lastWorkspace) {
      openWorkspace(lastWorkspace);
    }
  }, []); // Only run once on mount

  // Listen for menu events
  useEffect(() => {
    const unsubscribeOpenPath = EventsOn('open-path', async (path: string) => {
      try {
        const fileInfo = await Stat(path);
        if (fileInfo.isDirectory) {
          await openWorkspace(path);
        }
      } catch (error) {
        console.error('Failed to open:', error);
      }
    });

    return () => {
      unsubscribeOpenPath();
    };
  }, [openWorkspace]);

  return (
    <>
      <AppShell>
        {viewMode === 'dashboard' && <DashboardView />}
        {viewMode === 'editor' && <EditorView />}
      </AppShell>

      {/* Global dialogs */}
      <AddLanguageDialog />
      <SettingsDialog />
      <ConversionDialog />
      <ConflictDialog />
      <ConfirmDialog />

      {/* Command palette */}
      <CommandPalette />

      {/* Toast notifications */}
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <MotionConfig
      transition={{ duration: 0.1, ease: 'easeOut' }}
      reducedMotion="user"
    >
      <AppContent />
    </MotionConfig>
  );
}
