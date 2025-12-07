import { motion, AnimatePresence } from "motion/react";
import { Folder, FileText } from "lucide-react";
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
      className="w-64 h-full flex flex-col p-2.5 gap-2.5"
      style={{
        backgroundColor: "var(--color-bg-secondary)",
        borderRight: "1px solid var(--color-border)",
      }}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.div
        className="p-3 rounded-xl"
        style={{
          backgroundColor: "var(--color-bg-tertiary)",
          border: "1px solid var(--color-border)",
        }}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
      >
        <h1
          className="text-lg font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          T3Lang
        </h1>
        <p
          className="text-[10px] mt-0.5"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Translation deck
        </p>
      </motion.div>

      <motion.div
        className="flex flex-col gap-1.5"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <motion.button
          onClick={handleOpenFolder}
          className="w-full px-3 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 justify-between"
          style={{
            backgroundColor: "var(--color-accent)",
            color: "var(--color-bg-secondary)",
            boxShadow: "0 8px 24px rgba(30, 215, 96, 0.25)",
          }}
          whileHover={{
            scale: 1.02,
            boxShadow: "0 12px 32px rgba(30, 215, 96, 0.35)",
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <span className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <Folder size={18} />
            </motion.div>
            <span>Open folder</span>
          </span>
          <span className="text-[9px] uppercase tracking-wide opacity-70">
            browse
          </span>
        </motion.button>

        <motion.button
          onClick={handleOpenFile}
          className="w-full px-3 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 justify-between"
          style={{
            backgroundColor: "var(--color-bg-tertiary)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border)",
          }}
          whileHover={{
            scale: 1.02,
            backgroundColor: "var(--color-bg-hover)",
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <span className="flex items-center gap-2">
            <motion.div
              whileHover={{ y: -2, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <FileText size={18} />
            </motion.div>
            <span>Quick open</span>
          </span>
          <span
            className="text-[9px] uppercase tracking-wide opacity-70"
            style={{ color: "var(--color-text-secondary)" }}
          >
            file
          </span>
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {fileGroups.length > 0 && (
          <motion.div
            className="flex-1 overflow-y-auto rounded-xl"
            style={{
              backgroundColor: "var(--color-bg-tertiary)",
              border: "1px solid var(--color-border)",
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <div
              className="px-2.5 py-2 sticky top-0 flex items-center justify-between z-10"
              style={{ backgroundColor: "var(--color-bg-tertiary)" }}
            >
              <h2
                className="text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Files
              </h2>
              <motion.span
                className="text-[9px] px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: "var(--color-bg-hover)",
                  color: "var(--color-text-secondary)",
                }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {fileGroups.length} groups
              </motion.span>
            </div>
            <FileTree
              fileGroups={fileGroups}
              selectedFile={currentFile}
              onFileSelect={onFileOpen}
              onAddLanguage={onAddLanguage}
              onDeleteFile={onDeleteFile}
              fileDataMap={fileDataMap}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
