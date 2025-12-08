import { useState } from "react";
import { FileGroup } from "./FileGroup";
import type { FileData } from "../hooks/useFileOperations";

export interface T3File {
  name: string;
  path: string;
  language: string;
  baseName: string;
}

export interface T3FileGroup {
  baseName: string;
  files: T3File[];
}

export type FileDataMap = Map<string, FileData>;

interface FileTreeProps {
  fileGroups: T3FileGroup[];
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
  onAddLanguage: (baseName: string) => void;
  onDeleteFile: (filePath: string) => void;
  fileDataMap: FileDataMap;
}

export function FileTree({
  fileGroups,
  selectedFile,
  onFileSelect,
  onAddLanguage,
  onDeleteFile,
  fileDataMap,
}: FileTreeProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(fileGroups.map((g) => g.baseName)),
  );

  const toggleGroup = (baseName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(baseName)) {
      newExpanded.delete(baseName);
    } else {
      newExpanded.add(baseName);
    }
    setExpandedGroups(newExpanded);
  };

  if (fileGroups.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        No files loaded
      </div>
    );
  }

  return (
    <div className="px-2 pb-3">
      {fileGroups.map((group) => (
        <FileGroup
          key={group.baseName}
          baseName={group.baseName}
          files={group.files}
          isExpanded={expandedGroups.has(group.baseName)}
          selectedFile={selectedFile}
          onToggle={() => toggleGroup(group.baseName)}
          onFileSelect={onFileSelect}
          onAddLanguage={() => onAddLanguage(group.baseName)}
          onDeleteFile={onDeleteFile}
          fileDataMap={fileDataMap}
        />
      ))}
    </div>
  );
}
