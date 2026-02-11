import { ShowNotification } from '../../wailsjs/go/main/App';

export function useNotifications() {
  const notify = async (title: string, body: string) => {
    try {
      await ShowNotification(title, body);
    } catch {
      // do nothing if notifications are not available
    }
  };

  return { notify };
}
