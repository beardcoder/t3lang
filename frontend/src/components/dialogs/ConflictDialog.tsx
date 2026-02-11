import { AlertTriangle, RefreshCw } from 'lucide-react';
import { DialogBase } from './DialogBase';
import { useUIStore, selectDialogProps } from '../../stores';

interface ConflictDialogProps extends Record<string, unknown> {
  filePath: string;
  onReload: () => void;
  onKeepLocal: () => void;
  onDismiss: () => void;
}

export function ConflictDialog() {
  const activeDialog = useUIStore((state) => state.activeDialog);
  const closeDialog = useUIStore((state) => state.closeDialog);
  const addNotification = useUIStore((state) => state.addNotification);

  const props = selectDialogProps<ConflictDialogProps>(useUIStore.getState());

  const isOpen = activeDialog.type === 'conflict';

  const handleReload = async () => {
    if (props?.onReload) {
      props.onReload();
    }
    closeDialog();
    addNotification({
      type: 'info',
      title: 'File reloaded',
      message: 'Loaded external changes',
    });
  };

  const handleKeepLocal = () => {
    if (props?.onKeepLocal) {
      props.onKeepLocal();
    }
    closeDialog();
    addNotification({
      type: 'info',
      title: 'Kept local changes',
      message: 'External changes ignored',
    });
  };

  const handleDismiss = () => {
    if (props?.onDismiss) {
      props.onDismiss();
    }
    closeDialog();
  };

  const fileName = props?.filePath?.split('/').pop() || 'File';

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={handleDismiss}
      title="File Changed"
      size="sm"
      footer={
        <>
          <button
            onClick={handleDismiss}
            className="rounded-full px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary"
          >
            Dismiss
          </button>
          <button
            onClick={handleKeepLocal}
            className="rounded-full border border-border px-4 py-2 text-sm text-text-primary transition-colors hover:bg-bg-tertiary"
          >
            Keep Local
          </button>
          <button
            onClick={handleReload}
            className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm text-white shadow-[var(--shadow-sm)] transition-colors hover:bg-accent-hover"
          >
            <RefreshCw className="h-4 w-4" />
            Reload
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-warning-light p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="font-medium text-warning">External changes detected</p>
            <p className="mt-1 text-sm text-text-secondary">
              <strong>{fileName}</strong> was modified outside of T3Lang.
            </p>
          </div>
        </div>

        <div className="text-sm text-text-secondary">
          <p className="mb-2">What would you like to do?</p>
          <ul className="ml-4 list-disc space-y-1 text-xs">
            <li><strong>Reload</strong> - Load the external changes (your unsaved changes will be lost)</li>
            <li><strong>Keep Local</strong> - Ignore external changes and keep your version</li>
            <li><strong>Dismiss</strong> - Decide later</li>
          </ul>
        </div>
      </div>
    </DialogBase>
  );
}
