import { ShowMessage, ConfirmDialog as WailsConfirmDialog, OpenFileDialog as WailsOpenFileDialog, OpenFolderDialog as WailsOpenFolderDialog } from '../../wailsjs/go/main/App';

export function useDialogs() {
  const showMessage = async (content: string, title = 'T3Lang', kind: 'info' | 'warning' | 'error' = 'info') => {
    try {
      await ShowMessage(content, title, kind);
    } catch {
      alert(content);
    }
  };

  const confirmDialog = async (content: string, title = 'Confirm') => {
    try {
      return await WailsConfirmDialog(content, title);
    } catch {
      return confirm(content);
    }
  };

  const openFileDialog = async () => {
    try {
      const selected = await WailsOpenFileDialog();

      if (selected) {
        return selected;
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  const openFolderDialog = async () => {
    try {
      const selected = await WailsOpenFolderDialog();

      if (selected) {
        return selected;
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  return {
    showMessage,
    confirmDialog,
    openFileDialog,
    openFolderDialog,
  };
}
