import { useEffect, useCallback } from 'react';
import { useEditorStore, useWorkspaceStore, useUIStore } from '../stores';
import { OpenFolderDialog } from '../../wailsjs/go/main/App';

interface UseKeyboardOptions {
  onSave?: () => void;
  onSaveAll?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function useKeyboard({ onSave, onSaveAll, onUndo, onRedo }: UseKeyboardOptions = {}) {
  const searchQuery = useEditorStore((state) => state.searchQuery);
  const setSearchQuery = useEditorStore((state) => state.setSearchQuery);
  const focusedUnitId = useEditorStore((state) => state.focusedUnitId);
  const editingUnitId = useEditorStore((state) => state.editingUnitId);
  const startEditing = useEditorStore((state) => state.startEditing);
  const stopEditing = useEditorStore((state) => state.stopEditing);

  const viewMode = useWorkspaceStore((state) => state.viewMode);
  const setViewMode = useWorkspaceStore((state) => state.setViewMode);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    // Don't intercept if typing in an input
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable;

    // Cmd+O - Open workspace
    if (cmdOrCtrl && e.key === 'o' && !e.shiftKey) {
      e.preventDefault();
      OpenFolderDialog().then((path) => {
        if (path) {
          window.dispatchEvent(new CustomEvent('open-workspace', { detail: path }));
        }
      });
      return;
    }

    // Cmd+Shift+O - Open folder (same as Cmd+O for now)
    if (cmdOrCtrl && e.key === 'o' && e.shiftKey) {
      e.preventDefault();
      OpenFolderDialog().then((path) => {
        if (path) {
          window.dispatchEvent(new CustomEvent('open-workspace', { detail: path }));
        }
      });
      return;
    }

    // Cmd+S - Save current file
    if (cmdOrCtrl && e.key === 's' && !e.shiftKey) {
      e.preventDefault();
      onSave?.();
      return;
    }

    // Cmd+Shift+S - Save all files
    if (cmdOrCtrl && e.key === 's' && e.shiftKey) {
      e.preventDefault();
      onSaveAll?.();
      return;
    }

    // Cmd+Z - Undo
    if (cmdOrCtrl && e.key === 'z' && !e.shiftKey) {
      if (!isInput) {
        e.preventDefault();
        onUndo?.();
      }
      return;
    }

    // Cmd+Shift+Z - Redo
    if (cmdOrCtrl && e.key === 'z' && e.shiftKey) {
      if (!isInput) {
        e.preventDefault();
        onRedo?.();
      }
      return;
    }

    // Cmd+, - Open settings
    if (cmdOrCtrl && e.key === ',') {
      e.preventDefault();
      useUIStore.getState().openDialog('settings');
      return;
    }

    // Cmd+F - Focus search
    if (cmdOrCtrl && e.key === 'f') {
      e.preventDefault();
      // Focus the search input
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
      return;
    }

    // Escape - Clear search or stop editing
    if (e.key === 'Escape') {
      if (searchQuery) {
        setSearchQuery('');
      }
      if (editingUnitId) {
        stopEditing();
      }
      return;
    }

    // Don't handle navigation keys if in an input
    if (isInput) return;

    // Enter - Start editing focused unit
    if (e.key === 'Enter' && focusedUnitId && !editingUnitId) {
      e.preventDefault();
      startEditing(focusedUnitId, 'target');
      return;
    }

    // Tab - Navigate between cells (handled by UnitRow)

    // Arrow keys for unit navigation are handled by VirtualUnitList

    // 1, 2, 3 - Quick navigation (Dashboard, Editor, etc.)
    if (e.key === '1' && !cmdOrCtrl) {
      setViewMode('dashboard');
      return;
    }
    if (e.key === '2' && !cmdOrCtrl) {
      setViewMode('editor');
      return;
    }

  }, [
    searchQuery,
    setSearchQuery,
    focusedUnitId,
    editingUnitId,
    startEditing,
    stopEditing,
    setViewMode,
    onSave,
    onSaveAll,
    onUndo,
    onRedo,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
