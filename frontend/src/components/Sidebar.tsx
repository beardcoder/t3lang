import { motion, AnimatePresence } from "motion/react";
import { Folder, FileText, Sparkles } from "lucide-react";
import { FileTree, T3FileGroup, FileDataMap } from "./FileTree";
import { useDialogs } from "../hooks/useDialogs";

interface SidebarProps {
  onFileOpen: (filePath: string) => void;
  onFolderOpen: (folderPath: string) => void;
  onAddLanguage: (baseName: string) => void;
  onDeleteFile: (filePath: string) => void;
  currentFile: string | null;
  fileGroups: T3FileGroup[];
  fileDataMap: FileDataMap;
}

export function Sidebar({
  onFileOpen,
  onFolderOpen,
  onAddLanguage,
  onDeleteFile,
  currentFile,
  fileGroups,
  fileDataMap,
}: SidebarProps) {
  const { openFileDialog, openFolderDialog } = useDialogs();

  const handleOpenFile = async () => {
    const selected = await openFileDialog();

    if (selected) {
      onFileOpen(selected);
    }
  };

  const handleOpenFolder = async () => {
    const selected = await openFolderDialog();

    if (selected) {
      onFolderOpen(selected);
    }
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="flex h-full w-[22rem] flex-col gap-6 p-6 border-r"
      style={{
        backgroundColor: "var(--color-bg-primary)",
        borderColor: "var(--color-border-subtle)",
      }}
    >
      {/* Header */}
      <div className="pt-6 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={20} style={{ color: "var(--color-accent)" }} />
          <h1 className="text-2xl font-bold gradient-text">
            T3Lang
          </h1>
        </div>
        <p
          className="text-sm"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          TYPO3 Translation Manager
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-2">
        <motion.button
          onClick={handleOpenFolder}
          className="group flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border)]"
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          <Folder
            size={18}
            className="transition-colors"
            style={{ color: "var(--color-accent)" }}
          />
          <span>Open Workspace</span>
        </motion.button>

        <motion.button
          onClick={handleOpenFile}
          className="group flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border)]"
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          <FileText
            size={18}
            className="transition-colors"
            style={{ color: "var(--color-success)" }}
          />
          <span>Open File</span>
        </motion.button>
      </div>

      {/* File Tree */}
      <AnimatePresence>
        {fileGroups.length > 0 && (
          <motion.div
            className="flex-1 overflow-hidden rounded-lg"
            style={{
              backgroundColor: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border-subtle)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 backdrop-blur-sm"
              style={{
                backgroundColor: "var(--color-bg-secondary)",
                borderBottom: "1px solid var(--color-border-subtle)",
              }}
            >
              <h2
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Workspace Files
              </h2>
              <span
                className="badge badge-accent"
              >
                {fileGroups.length}
              </span>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(100% - 3rem)" }}>
              <FileTree
                fileGroups={fileGroups}
                selectedFile={currentFile}
                onFileSelect={onFileOpen}
                onAddLanguage={onAddLanguage}
                onDeleteFile={onDeleteFile}
                fileDataMap={fileDataMap}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
