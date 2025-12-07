import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Plus } from "lucide-react";
import { FileItem } from "./FileItem";
import { T3File, FileDataMap } from "./FileTree";

interface FileGroupProps {
  baseName: string;
  files: T3File[];
  isExpanded: boolean;
  selectedFile: string | null;
  onToggle: () => void;
  onFileSelect: (path: string) => void;
  onAddLanguage: () => void;
  onDeleteFile: (filePath: string) => void;
  fileDataMap: FileDataMap;
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
  fileDataMap,
}: FileGroupProps) {
  const defaultFile = files.find((f) => f.language === "default");
  const translationFiles = files.filter((f) => f.language !== "default");

  const calculateProgress = (filePath: string): number => {
    const fileData = fileDataMap.get(filePath);
    if (!fileData || fileData.isSourceOnly || fileData.units.length === 0)
      return 0;
    const translatedCount = fileData.units.filter(
      (unit) => unit.target && unit.target.trim() !== ""
    ).length;
    return Math.round((translatedCount / fileData.units.length) * 100);
  };

  return (
    <div className="mb-2 relative z-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-3 text-left rounded-xl border"
        style={{
          backgroundColor: "var(--color-bg-tertiary)",
          color: "var(--color-text-primary)",
          borderColor: "var(--color-border)",
        }}
      >
        <div>
          <ChevronRight
            size={14}
            style={{ color: "var(--color-text-secondary)" }}
          />
        </div>
        <span className="text-xs font-semibold flex-1 truncate">
          {baseName}
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{
            backgroundColor: "var(--color-bg-hover)",
            color: "var(--color-text-secondary)",
            border: "1px solid var(--color-border)",
          }}
        >
          {files.length}
        </span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <div className="ml-4 mt-2 space-y-2">
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
                translationProgress={calculateProgress(file.path)}
              />
            ))}

            <button
              onClick={onAddLanguage}
              className="w-full flex text-xs items-center gap-2 px-3 py-2 hover:bg-(--color-bg-hover) cursor-pointer"
            >
              <Plus size={14} />
              <span>Add language</span>
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
