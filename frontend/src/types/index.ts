import type { XliffDocument, XliffVersion, TranslationUnit as XliffUnit } from 'xliff-simple';

// Re-export xliff-simple types
export type { XliffDocument, XliffVersion, TranslationUnit as XliffUnit };

// Translation unit with guaranteed target field
export interface TranslationUnit extends XliffUnit {
  target: string;
}

// File metadata parsed from TYPO3 naming convention
export interface FileMetadata {
  path: string;
  name: string;
  language: string; // 'default' for source-only files, 'de', 'fr', etc.
  baseName: string; // e.g., 'locallang' from 'de.locallang.xlf'
  directory: string;
}

// Parsed XLIFF file data
export interface FileData {
  path: string;
  xliffData: XliffDocument;
  units: TranslationUnit[];
  sourceLanguage: string;
  targetLanguage: string;
  version: XliffVersion;
  language: string;
  baseName: string;
  isSourceOnly: boolean;
}

// Group of related translation files (same baseName, different languages)
export interface TranslationGroup {
  id: string; // Unique identifier (directory/baseName)
  baseName: string; // Display name
  directory: string; // Absolute path to containing directory
  files: Map<string, FileMetadata>; // language -> file metadata
  sourceFile: FileMetadata | null; // Default/source file
  coverage: GroupCoverage;
}

// Translation coverage stats for a group
export interface GroupCoverage {
  totalUnits: number;
  translatedByLanguage: Map<string, number>;
  missingByLanguage: Map<string, string[]>; // language -> unit IDs
}

// Workspace scan result
export interface WorkspaceScan {
  rootPath: string;
  groups: TranslationGroup[];
  totalFiles: number;
  totalUnits: number;
}

// View modes
export type ViewMode = 'dashboard' | 'editor';

// Sort modes for units
export type SortMode = 'manual' | 'key-asc' | 'key-desc' | 'source-asc' | 'source-desc';

// Dirty change tracking
export interface UnitChange {
  unitId: string;
  field: 'id' | 'source' | 'target';
  oldValue: string;
  newValue: string;
  timestamp: number;
}

// History entry for undo/redo
export interface HistoryEntry {
  id: string;
  filePath: string;
  changes: UnitChange[];
  timestamp: number;
}

// Recent workspace entry
export interface RecentWorkspace {
  path: string;
  name: string;
  lastOpened: number;
  groupCount: number;
}

// UI notification
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
}

// Settings
export interface AppSettings {
  indentType: 'tabs' | 'spaces';
  indentSize: number;
  theme: 'system' | 'light' | 'dark';
}

// File watcher event
export interface FileWatchEvent {
  type: 'create' | 'modify' | 'delete' | 'rename';
  path: string;
  oldPath?: string; // For rename events
}

// Dialog types
export type DialogType = 'add-language' | 'add-unit' | 'conversion' | 'settings' | 'confirm' | 'conflict';

export interface DialogState {
  type: DialogType | null;
  props?: Record<string, unknown>;
}
