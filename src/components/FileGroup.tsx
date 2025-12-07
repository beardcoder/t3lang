import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Plus } from "lucide-react";
import { FileItem } from "./FileItem";
import { T3File } from "./FileTree";

interface FileGroupProps {
  baseName: string;
  files: T3File[];
  isExpanded: boolean;
  selectedFile: string | null;
  onToggle: () => void;
  onFileSelect: (path: string) => void;
  onAddLanguage: () => void;
  onDeleteFile: (filePath: string) => void;
}

export function FileGroup({
  baseName,
  files,
  isExpanded,
  selectedFile,
  onToggle,
  onFileSelect,
  onAddLanguage,
  onDeleteFile,
}: FileGroupProps) {
  const defaultFile = files.find((f) => f.language === "default");
  const translationFiles = files.filter((f) => f.language !== "default");

  return (
    <motion.div
      className="mb-2 relative z-0"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      layout
    >
      <motion.button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-3 text-left rounded-xl border"
        style={{
          backgroundColor: "var(--color-bg-tertiary)",
          color: "var(--color-text-primary)",
          borderColor: "var(--color-border)",
        }}
        whileHover={{
          backgroundColor: "var(--color-bg-hover)",
          scale: 1.01,
        }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <ChevronRight
            size={14}
            style={{ color: "var(--color-text-secondary)" }}
          />
        </motion.div>
        <span className="text-xs font-semibold flex-1 truncate">
          {baseName}
        </span>
        <motion.span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{
            backgroundColor: "var(--color-bg-hover)",
            color: "var(--color-text-secondary)",
            border: "1px solid var(--color-border)",
          }}
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {files.length}
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="ml-4 mt-2 space-y-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {defaultFile && (
              <FileItem
                name={defaultFile.name}
                path={defaultFile.path}
                language={defaultFile.language}
                isSelected={selectedFile === defaultFile.path}
                isSource
                onSelect={() => onFileSelect(defaultFile.path)}
              />
            )}

            {translationFiles.map((file) => (
              <FileItem
                key={file.path}
                name={file.name}
                path={file.path}
                language={file.language}
                isSelected={selectedFile === file.path}
                onSelect={() => onFileSelect(file.path)}
                onDelete={() => onDeleteFile(file.path)}
              />
            ))}

            <motion.button
              onClick={onAddLanguage}
              className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg border border-dashed"
              style={{
                backgroundColor: "transparent",
                color: "var(--color-text-secondary)",
                borderColor: "var(--color-border)",
              }}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{
                backgroundColor: "var(--color-bg-hover)",
                color: "var(--color-text-primary)",
                x: 4,
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div
                whileHover={{ rotate: 90 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <Plus size={14} />
              </motion.div>
              <span className="text-sm">Add language</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
