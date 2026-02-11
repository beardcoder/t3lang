import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText, Globe, Settings, FolderOpen, Save, RefreshCw,
  ArrowLeftRight, Plus, Search
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useWorkspaceStore, useEditorStore, useUIStore, usePersistenceStore, selectGroupsList } from '../../stores';
import { OpenFolderDialog } from '../../../wailsjs/go/main/App';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: 'file' | 'action' | 'recent';
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const groups = useWorkspaceStore(useShallow(selectGroupsList));
  const activeGroupId = useWorkspaceStore((state) => state.activeGroupId);
  const setActiveGroup = useWorkspaceStore((state) => state.setActiveGroup);
  const setActiveLanguage = useWorkspaceStore((state) => state.setActiveLanguage);
  const setViewMode = useWorkspaceStore((state) => state.setViewMode);
  const projectRoot = useWorkspaceStore((state) => state.projectRoot);

  const hasUnsavedChanges = useEditorStore((state) => state.dirtyUnits.size > 0);

  const openDialog = useUIStore((state) => state.openDialog);

  const recentWorkspaces = usePersistenceStore((state) => state.recentWorkspaces);

  const isMac = navigator.platform.includes('Mac');
  const mod = isMac ? '⌘' : 'Ctrl+';

  // Build command list
  const commands = useMemo((): CommandItem[] => {
    const items: CommandItem[] = [];

    // File navigation - groups and their languages
    for (const group of groups) {
      items.push({
        id: `group-${group.id}`,
        label: group.baseName,
        description: `${group.files.size} files · ${group.directory}`,
        icon: <FileText className="h-4 w-4" />,
        category: 'file',
        action: () => {
          setActiveGroup(group.id);
          setViewMode('editor');
        },
      });

      // Add language entries for the group
      for (const [lang, file] of group.files.entries()) {
        if (lang === 'default') continue;
        items.push({
          id: `file-${group.id}-${lang}`,
          label: `${group.baseName} → ${lang.toUpperCase()}`,
          description: file.name,
          icon: <Globe className="h-4 w-4" />,
          category: 'file',
          action: () => {
            setActiveGroup(group.id);
            setActiveLanguage(lang);
            setViewMode('editor');
          },
        });
      }
    }

    // Actions
    items.push({
      id: 'action-open',
      label: 'Open Folder',
      description: 'Open a workspace folder',
      icon: <FolderOpen className="h-4 w-4" />,
      shortcut: `${mod}O`,
      category: 'action',
      action: () => {
        OpenFolderDialog().then((path) => {
          if (path) {
            window.dispatchEvent(new CustomEvent('open-workspace', { detail: path }));
          }
        });
      },
    });

    items.push({
      id: 'action-save-all',
      label: 'Save All',
      description: hasUnsavedChanges ? 'Save all unsaved changes' : 'No unsaved changes',
      icon: <Save className="h-4 w-4" />,
      shortcut: `${mod}⇧S`,
      category: 'action',
      action: () => {
        window.dispatchEvent(new CustomEvent('save-all'));
      },
    });

    items.push({
      id: 'action-dashboard',
      label: 'Go to Dashboard',
      description: 'View project overview',
      icon: <Search className="h-4 w-4" />,
      category: 'action',
      action: () => setViewMode('dashboard'),
    });

    items.push({
      id: 'action-settings',
      label: 'Settings',
      description: 'Open application settings',
      icon: <Settings className="h-4 w-4" />,
      shortcut: `${mod},`,
      category: 'action',
      action: () => openDialog('settings'),
    });

    if (activeGroupId) {
      items.push({
        id: 'action-convert',
        label: 'Convert XLIFF Version',
        description: 'Convert between XLIFF 1.2 and 2.0',
        icon: <ArrowLeftRight className="h-4 w-4" />,
        category: 'action',
        action: () => openDialog('conversion', { groupId: activeGroupId }),
      });

      items.push({
        id: 'action-add-lang',
        label: 'Add Language',
        description: 'Add a new language to the current group',
        icon: <Plus className="h-4 w-4" />,
        category: 'action',
        action: () => openDialog('add-language', { groupId: activeGroupId }),
      });
    }

    // Recent workspaces (when no project is open)
    if (!projectRoot) {
      for (const workspace of recentWorkspaces) {
        items.push({
          id: `recent-${workspace.path}`,
          label: workspace.name,
          description: workspace.path,
          icon: <FolderOpen className="h-4 w-4" />,
          category: 'recent',
          action: () => {
            window.dispatchEvent(new CustomEvent('open-workspace', { detail: workspace.path }));
          },
        });
      }
    }

    return items;
  }, [groups, activeGroupId, projectRoot, recentWorkspaces, hasUnsavedChanges, mod, setActiveGroup, setActiveLanguage, setViewMode, openDialog]);

  // Filter commands by query
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Open/close on keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Cmd+P or Cmd+K to open
      if (cmdOrCtrl && (e.key === 'p' || e.key === 'k') && !e.shiftKey) {
        e.preventDefault();
        setIsOpen(true);
        setQuery('');
        setSelectedIndex(0);
      }

      // Cmd+Shift+P for command mode (prepend >)
      if (cmdOrCtrl && e.key === 'p' && e.shiftKey) {
        e.preventDefault();
        setIsOpen(true);
        setQuery('>');
        setSelectedIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMac]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[selectedIndex] as HTMLElement;
    if (item) {
      item.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  const execute = useCallback((item: CommandItem) => {
    close();
    // Delay action slightly to let the palette close
    requestAnimationFrame(() => item.action());
  }, [close]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[selectedIndex]) {
          execute(filtered[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  }, [filtered, selectedIndex, execute, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-black/25 backdrop-blur-xs"
            onClick={close}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.1 }}
            className="fixed left-1/2 top-[15%] z-60 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-(--color-glass-border) bg-(--color-glass) backdrop-blur-xl shadow-2xl"
          >
            {/* Search input */}
            <div className="flex items-center gap-2 border-b border-(--color-glass-border) px-4 py-3">
              <Search className="h-4 w-4 text-text-tertiary" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search files, actions..."
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-hidden"
              />
              <kbd className="rounded border border-border bg-bg-tertiary px-1.5 py-0.5 text-[10px] text-text-tertiary">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-80 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-text-tertiary">
                  No results found
                </div>
              ) : (
                filtered.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => execute(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                      index === selectedIndex
                        ? 'bg-accent text-white'
                        : 'text-text-primary hover:bg-black/4 dark:hover:bg-white/6'
                    }`}
                  >
                    <span className={index === selectedIndex ? 'text-white/80' : 'text-text-tertiary'}>
                      {item.icon}
                    </span>
                    <div className="flex-1 overflow-hidden">
                      <span className="truncate">{item.label}</span>
                      {item.description && (
                        <span className="ml-2 truncate text-xs text-text-tertiary">
                          {item.description}
                        </span>
                      )}
                    </div>
                    {item.shortcut && (
                      <kbd className="shrink-0 rounded border border-border bg-bg-tertiary px-1.5 py-0.5 text-[10px] text-text-tertiary">
                        {item.shortcut}
                      </kbd>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
