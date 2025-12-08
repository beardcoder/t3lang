export function useDialogs() {
  const showMessage = async (
    content: string,
    title = "T3Lang",
    kind: "info" | "warning" | "error" = "info",
  ) => {
    try {
      const { message } = await import("@tauri-apps/plugin-dialog");
      await message(content, { title, kind });
    } catch {
      alert(content);
    }
  };

  const confirmDialog = async (content: string, title = "Confirm") => {
    try {
      const { ask } = await import("@tauri-apps/plugin-dialog");
      return await ask(content, { title, kind: "warning" });
    } catch {
      return confirm(content);
    }
  };

  const openFileDialog = async () => {
    try {
      const { open: openDialog } = await import("@tauri-apps/plugin-dialog");
      const selected = await openDialog({
        multiple: false,
        filters: [
          {
            name: "XLIFF",
            extensions: ["xlf", "xliff"],
          },
        ],
      });

      if (selected && typeof selected === "string") {
        return selected;
      }
      return null;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return null;
    }
  };

  const openFolderDialog = async () => {
    try {
      const { open: openDialog } = await import("@tauri-apps/plugin-dialog");
      const selected = await openDialog({
        directory: true,
        multiple: false,
      });

      if (selected && typeof selected === "string") {
        return selected;
      }
      return null;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
