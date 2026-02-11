import { DialogBase } from './DialogBase';
import { useUIStore, selectIsDialogOpen, selectDialogProps } from '../../stores';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps extends Record<string, unknown> {
  title?: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm?: () => void;
}

export function ConfirmDialog() {
  const isOpen = useUIStore((state) => selectIsDialogOpen(state, 'confirm'));
  const closeDialog = useUIStore((state) => state.closeDialog);

  const props = selectDialogProps<ConfirmDialogProps>(useUIStore.getState());

  const handleConfirm = () => {
    props?.onConfirm?.();
    closeDialog();
  };

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={closeDialog}
      title={props?.title || 'Confirm'}
      size="sm"
      footer={
        <>
          <button
            onClick={closeDialog}
            className="rounded-full px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`rounded-full px-4 py-2 text-sm text-white shadow-[var(--shadow-sm)] transition-colors ${
              props?.danger
                ? 'bg-danger hover:brightness-95'
                : 'bg-accent hover:bg-accent-hover'
            }`}
          >
            {props?.confirmLabel || 'Confirm'}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        {props?.danger && (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
        )}
        <p className="text-sm">{props?.message || 'Are you sure?'}</p>
      </div>
    </DialogBase>
  );
}
