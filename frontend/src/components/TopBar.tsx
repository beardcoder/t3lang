import { Search, Sliders, PanelLeft, PanelRight, ArrowLeftRight, RefreshCw, Check, AlertCircle, Clock } from 'lucide-react';
import type { SyncOperation, SyncState } from '../hooks/useSync';

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onOpenConvert: () => void;
  onOpenSettings: () => void;
  onToggleSidebar: () => void;
  isSidebarVisible: boolean;
  syncState: SyncState;
  pendingOperations: SyncOperation[];
}

export function TopBar({
  searchQuery,
  onSearchChange,
  onOpenConvert,
  onOpenSettings,
  onToggleSidebar,
  isSidebarVisible,
  syncState,
  pendingOperations,
}: TopBarProps) {
  const statusColor = (() => {
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
  })();

  const statusLabel = (() => {
    switch (syncState.status) {
      case 'synced':
        return 'Synced';
      case 'syncing':
        return `Syncing ${syncState.filesAffected.length} files`;
      case 'pending':
        return `${pendingOperations.length} pending`;
      case 'error':
        return 'Sync error';
      default:
        return 'Sync idle';
    }
  })();

  const statusIcon = (() => {
    switch (syncState.status) {
      case 'synced':
        return <Check size={14} />;
      case 'syncing':
        return <RefreshCw size={14} className="animate-spin" />;
      case 'pending':
        return <Clock size={14} />;
      case 'error':
        return <AlertCircle size={14} />;
      default:
        return <RefreshCw size={14} />;
    }
  })();

  return (
    <div className="flex items-center justify-between border-b px-6 py-3" style={{ borderColor: 'var(--color-border-subtle)' }}>
      <div className="flex flex-1 items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2"
          aria-label={isSidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
          style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
        >
          {isSidebarVisible ? <PanelLeft size={16} /> : <PanelRight size={16} />}
        </button>

        <div className="relative w-full max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: searchQuery ? 'var(--color-accent)' : 'var(--color-text-tertiary)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search translations..."
            className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              borderColor: 'var(--color-border-subtle)',
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenConvert}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
          style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
        >
          <ArrowLeftRight size={14} />
          Convert
        </button>

        <div
          className="flex items-center gap-2 rounded-full px-3 py-1 text-xs"
          style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
        >
          <span style={{ color: statusColor }}>{statusIcon}</span>
          <span>{statusLabel}</span>
        </div>

        <button
          onClick={onOpenSettings}
          className="rounded-lg p-2"
          aria-label="Open settings"
          style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
        >
          <Sliders size={16} />
        </button>
      </div>
    </div>
  );
}
