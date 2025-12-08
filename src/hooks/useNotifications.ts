export function useNotifications() {
  const notify = async (title: string, body: string) => {
    try {
      const { isPermissionGranted, requestPermission, sendNotification } =
        await import("@tauri-apps/plugin-notification");
      let permission = await isPermissionGranted();
      if (!permission) {
        const request = await requestPermission();
        permission = request === "granted";
      }
      if (permission) {
        sendNotification({ title, body });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // do nothing if notifications are not available
    }
  };

  return { notify };
}
