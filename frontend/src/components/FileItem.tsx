import { motion } from 'motion/react';
import { FileText, Globe, Trash2, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { SyncStatus } from '../hooks/useSync';

interface FileItemProps {
  name: string;
  path: string;
  language: string;
  isSelected: boolean;
  isSource?: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  translationProgress?: number;
  syncStatus?: SyncStatus;
  needsSync?: boolean;
}

export function FileItem({
  name,
  language,
  isSelected,
  isSource,
  onSelect,
  onDelete,
  translationProgress = 0,
  syncStatus = 'idle',
  needsSync = false,
}: FileItemProps) {
  const getSyncIcon = () => {
    if (!needsSync && syncStatus !== 'syncing') return null;

    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw size={10} className="animate-spin" />;
      case 'error':
        return <AlertCircle size={10} />;
      default:
        return needsSync ? <AlertCircle size={10} /> : <Check size={10} />;
    }
  };

  const getSyncColor = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'var(--color-accent)';
      case 'error':
        return 'var(--color-danger)';
      default:
        return needsSync ? 'var(--color-warning)' : 'var(--color-success)';
    }
  };

  const getProgressColor = () => {
    if (translationProgress === 100) return 'var(--color-success)';
    if (translationProgress >= 75) return 'var(--color-accent)';
    if (translationProgress >= 50) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  return (
    <div className="group relative">
      <motion.button
        onClick={onSelect}
        className="relative flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors overflow-hidden min-h-[56px] hover:bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border)]"
        style={{
          backgroundColor: isSelected ? 'var(--color-bg-elevated)' : 'transparent',
          border: `1px solid ${isSelected ? 'var(--color-border)' : 'transparent'}`,
        }}
      >
        {/* Selection indicator */}
        {isSelected && (
          <motion.div
            layoutId="selected-file"
            className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
            style={{ backgroundColor: 'var(--color-accent)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
          />
        )}

        {/* Icon */}
        <div
          className="rounded-md p-2 transition-colors"
          style={{
            backgroundColor: isSelected
              ? 'var(--color-accent-light)'
              : 'var(--color-bg-tertiary)',
            color: isSelected
              ? 'var(--color-accent)'
              : 'var(--color-text-tertiary)',
          }}
        >
          {isSource ? (
            <FileText size={16} />
          ) : (
            <Globe size={16} />
          )}
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <div
            className="truncate text-sm font-medium leading-tight"
            style={{
              color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            }}
          >
            {name}
          </div>
          <div
            className="mt-0.5 font-mono text-xs uppercase tracking-wider"
            style={{
              color: 'var(--color-text-tertiary)',
            }}
          >
            {isSource ? 'source' : language}
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Sync Status Badge */}
          {(needsSync || syncStatus === 'syncing') && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center justify-center w-5 h-5 rounded-full"
              style={{
                backgroundColor: `${getSyncColor()}20`,
                color: getSyncColor(),
                border: `1px solid ${getSyncColor()}40`,
              }}
              title={syncStatus === 'syncing' ? 'Syncing...' : needsSync ? 'Needs sync' : 'Synced'}
            >
              {getSyncIcon()}
            </motion.span>
          )}

          {!isSource && translationProgress !== undefined && (
            <span
              className="px-2.5 py-1 font-mono text-xs font-semibold rounded-md"
              style={{
                backgroundColor: `${getProgressColor()}20`,
                color: getProgressColor(),
                border: `1px solid ${getProgressColor()}40`,
              }}
            >
              {translationProgress}%
            </span>
          )}

          {isSource && (
            <span
              className="px-2.5 py-1 text-xs font-semibold rounded-md"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'white',
              }}
            >
              SRC
            </span>
          )}
        </div>
      </motion.button>

      {/* Delete button */}
      {onDelete && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto pointer-events-none"
          style={{
            backgroundColor: 'var(--color-danger)',
            color: 'white',
            boxShadow: 'var(--shadow-md)',
          }}
          whileTap={{ scale: 0.95 }}
          title="Delete language file"
        >
          <Trash2 size={12} />
        </motion.button>
      )}
    </div>
  );
}
