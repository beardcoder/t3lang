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
    <div
      className="flex h-full w-72 flex-col gap-4 p-5"
      style={{
        backgroundColor: "var(--color-bg-secondary)",
        borderRight: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      <div className="px-1 pt-8">
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="mb-1 text-xl font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              t3lang
            </h1>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Translation workspace
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleOpenFolder}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors"
          style={{
            backgroundColor: "transparent",
            color: "var(--color-text-primary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <Folder size={18} style={{ color: "var(--color-text-secondary)" }} />
          <span className="font-medium">Open workspace</span>
        </button>

        <button
          onClick={handleOpenFile}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors"
          style={{
            backgroundColor: "transparent",
            color: "var(--color-text-primary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <FileText
            size={18}
            style={{ color: "var(--color-text-secondary)" }}
          />
          <span className="font-medium">Open file</span>
        </button>
      </div>

      <AnimatePresence>
        {fileGroups.length > 0 && (
          <motion.div
            className="flex-1 overflow-y-auto rounded-lg"
            style={{
              backgroundColor: "transparent",
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="sticky top-0 z-10 mb-1 flex items-center justify-between px-2 py-2"
              style={{
                backgroundColor: "rgba(31, 31, 31, 0.95)",
                backdropFilter: "blur(8px)",
              }}
            >
              <h2
                className="text-xs font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Files
              </h2>
              <span
                className="rounded px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {fileGroups.length}
              </span>
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
    </div>
  );
}
