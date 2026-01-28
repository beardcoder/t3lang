import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Check, AlertCircle, Clock, Zap, ZapOff, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { SyncState, SyncOperation } from '../hooks/useSync';

interface SyncPanelProps {
  syncState: SyncState;
  pendingOperations: SyncOperation[];
  autoSyncEnabled: boolean;
  onToggleAutoSync: () => void;
  onManualSync: () => void;
  isCollapsed?: boolean;
}

export function SyncPanel({
  syncState,
  pendingOperations,
  autoSyncEnabled,
  onToggleAutoSync,
  onManualSync,
}: SyncPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = () => {
    switch (syncState.status) {
      case 'synced':
        return 'var(--color-success)';
      case 'syncing':
        return 'var(--color-accent)';
      case 'pending':
        return 'var(--color-warning)';
      case 'error':
        return 'var(--color-danger)';
      default:
        return 'var(--color-text-tertiary)';
    }
  };

  const getStatusIcon = () => {
    switch (syncState.status) {
      case 'synced':
        return <Check size={16} />;
      case 'syncing':
        return <RefreshCw size={16} className="animate-spin" />;
      case 'pending':
        return <Clock size={16} />;
      case 'error':
        return <AlertCircle size={16} />;
      default:
        return <RefreshCw size={16} />;
    }
  };

  const getStatusText = () => {
    switch (syncState.status) {
      case 'synced':
        return 'All files synced';
      case 'syncing':
        return `Syncing ${syncState.filesAffected.length} files...`;
      case 'pending':
        return `${pendingOperations.length} pending`;
      case 'error':
        return 'Sync failed';
      default:
        return 'Sync idle';
    }
  };

  const showPanel = syncState.status !== 'idle' || pendingOperations.length > 0;

  return (
    <AnimatePresence>
      {showPanel && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="fixed bottom-6 right-6 z-50 rounded-xl overflow-hidden shadow-2xl"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            minWidth: '320px',
            maxWidth: '400px',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b cursor-pointer"
            style={{
              borderColor: 'var(--color-border-subtle)',
              backgroundColor: 'var(--color-bg-secondary)',
            }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{
                  backgroundColor: `${getStatusColor()}20`,
                  color: getStatusColor(),
                }}
              >
                {getStatusIcon()}
              </div>
              <div>
                <div
                  className="text-sm font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  File Synchronization
                </div>
                <div
                  className="text-xs"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {getStatusText()}
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1 rounded-md transition-colors"
              style={{ color: 'var(--color-text-tertiary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </motion.button>
          </div>

          {/* Progress Bar */}
          {syncState.status === 'syncing' && (
            <div className="h-1 bg-black/20 overflow-hidden">
              <motion.div
                className="h-full"
                style={{ backgroundColor: getStatusColor() }}
                initial={{ width: '0%' }}
                animate={{ width: `${syncState.progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          )}

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  {/* Auto-sync Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {autoSyncEnabled ? (
                        <Zap size={14} style={{ color: 'var(--color-accent)' }} />
                      ) : (
                        <ZapOff size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                      )}
                      <span
                        className="text-sm font-medium"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        Auto-sync
                      </span>
                    </div>
                    <motion.button
                      onClick={onToggleAutoSync}
                      className="relative w-11 h-6 rounded-full transition-colors"
                      style={{
                        backgroundColor: autoSyncEnabled
                          ? 'var(--color-accent)'
                          : 'var(--color-bg-tertiary)',
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
                        animate={{ left: autoSyncEnabled ? '22px' : '4px' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </motion.button>
                  </div>

                  {/* Manual Sync Button */}
                  <motion.button
                    onClick={onManualSync}
                    disabled={syncState.status === 'syncing' || pendingOperations.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: 'var(--color-accent)',
                      color: 'white',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RefreshCw size={14} />
                    <span>Sync Now</span>
                  </motion.button>

                  {/* Pending Operations */}
                  {pendingOperations.length > 0 && (
                    <div className="space-y-2">
                      <div
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        Pending Operations
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {pendingOperations.map((op, index) => (
                          <motion.div
                            key={op.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="flex items-center gap-2 text-xs px-3 py-2 rounded-md"
                            style={{
                              backgroundColor: 'var(--color-bg-tertiary)',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            <Clock size={12} />
                            <span className="flex-1 truncate">
                              {op.type.replace('-', ' ')} - {op.baseName}
                            </span>
                            <span
                              className="badge"
                              style={{ fontSize: '9px' }}
                            >
                              {op.filesAffected.length}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Last Sync */}
                  {syncState.lastSync && (
                    <div
                      className="text-xs text-center"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Last synced: {syncState.lastSync.toLocaleTimeString()}
                    </div>
                  )}

                  {/* Error Message */}
                  {syncState.error && (
                    <div
                      className="text-xs px-3 py-2 rounded-md"
                      style={{
                        backgroundColor: 'var(--color-danger-light)',
                        color: 'var(--color-danger)',
                      }}
                    >
                      {syncState.error}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
