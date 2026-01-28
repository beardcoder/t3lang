import { useState, useCallback, useEffect, useRef } from 'react';

export type SyncStatus = 'idle' | 'pending' | 'syncing' | 'synced' | 'error';

export interface SyncState {
  status: SyncStatus;
  progress: number;
  filesAffected: string[];
  error?: string;
  lastSync?: Date;
}

export interface SyncOperation {
  id: string;
  type: 'reorder' | 'source-change' | 'add-key' | 'delete-key';
  baseName: string;
  timestamp: Date;
  filesAffected: string[];
}

export interface FileDataMap extends Map<string, FileData> {}

export interface FileData {
  path: string;
  baseName: string;
  language: string;
  isSourceOnly: boolean;
  xliffData: any;
  units: any[];
}

export interface UseSyncOptions {
  autoSync?: boolean;
  syncDelay?: number;
  onSyncStart?: () => void;
  onSyncComplete?: (operations: SyncOperation[]) => void;
  onSyncError?: (error: Error) => void;
}

export function useSync(options: UseSyncOptions = {}) {
  const {
    autoSync = true,
    syncDelay = 500,
    onSyncStart,
    onSyncComplete,
    onSyncError,
  } = options;

  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    progress: 0,
    filesAffected: [],
  });

  const [pendingOperations, setPendingOperations] = useState<SyncOperation[]>([]);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(autoSync);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const operationQueueRef = useRef<SyncOperation[]>([]);

  // Queue a sync operation
  const queueOperation = useCallback((operation: SyncOperation) => {
    operationQueueRef.current.push(operation);
    setPendingOperations([...operationQueueRef.current]);

    setSyncState(prev => ({
      ...prev,
      status: 'pending',
      filesAffected: Array.from(new Set([
        ...prev.filesAffected,
        ...operation.filesAffected
      ])),
    }));

    // Auto-sync if enabled
    if (autoSyncEnabled) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = setTimeout(() => {
        performSync();
      }, syncDelay);
    }
  }, [autoSyncEnabled, syncDelay]);

  // Perform synchronization
  const performSync = useCallback(async () => {
    if (operationQueueRef.current.length === 0) return;

    const operations = [...operationQueueRef.current];
    operationQueueRef.current = [];
    setPendingOperations([]);

    setSyncState({
      status: 'syncing',
      progress: 0,
      filesAffected: Array.from(new Set(
        operations.flatMap(op => op.filesAffected)
      )),
    });

    onSyncStart?.();

    try {
      // Process operations (this will be called by the parent component)
      // We're just managing state here

      setSyncState({
        status: 'synced',
        progress: 100,
        filesAffected: [],
        lastSync: new Date(),
      });

      onSyncComplete?.(operations);

      // Reset to idle after a short delay
      setTimeout(() => {
        setSyncState(prev => ({
          ...prev,
          status: 'idle',
          progress: 0,
        }));
      }, 2000);

    } catch (error) {
      setSyncState({
        status: 'error',
        progress: 0,
        filesAffected: [],
        error: error instanceof Error ? error.message : 'Sync failed',
      });

      onSyncError?.(error instanceof Error ? error : new Error('Sync failed'));
    }
  }, [onSyncStart, onSyncComplete, onSyncError]);

  // Manual sync trigger
  const triggerSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    performSync();
  }, [performSync]);

  // Clear sync state
  const clearSync = useCallback(() => {
    operationQueueRef.current = [];
    setPendingOperations([]);
    setSyncState({
      status: 'idle',
      progress: 0,
      filesAffected: [],
    });
  }, []);

  // Toggle auto-sync
  const toggleAutoSync = useCallback(() => {
    setAutoSyncEnabled(prev => !prev);
  }, []);

  // Update progress
  const updateProgress = useCallback((progress: number) => {
    setSyncState(prev => ({
      ...prev,
      progress,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    syncState,
    pendingOperations,
    autoSyncEnabled,
    queueOperation,
    triggerSync,
    clearSync,
    toggleAutoSync,
    updateProgress,
    hasPendingChanges: pendingOperations.length > 0,
  };
}

// Helper to detect changes between file data
export function detectChanges(
  source: FileData,
  target: FileData
): { added: string[]; removed: string[]; modified: string[] } {
  const sourceIds = new Set(source.units.map(u => u.id));
  const targetIds = new Set(target.units.map(u => u.id));

  const added = source.units
    .filter(u => !targetIds.has(u.id))
    .map(u => u.id);

  const removed = target.units
    .filter(u => !sourceIds.has(u.id))
    .map(u => u.id);

  const modified = source.units
    .filter(u => {
      const targetUnit = target.units.find(tu => tu.id === u.id);
      return targetUnit && targetUnit.source !== u.source;
    })
    .map(u => u.id);

  return { added, removed, modified };
}

// Helper to check if files need syncing
export function needsSync(
  sourceFile: FileData,
  targetFile: FileData
): boolean {
  const changes = detectChanges(sourceFile, targetFile);
  return changes.added.length > 0 || changes.removed.length > 0 || changes.modified.length > 0;
}
