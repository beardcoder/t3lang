import { ChevronRight, Plus } from 'lucide-react';
import { FileItem } from './FileItem';
import { T3File, FileDataMap } from './FileTree';

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
  const defaultFile = files.find((f) => f.language === 'default');
  const translationFiles = files.filter((f) => f.language !== 'default');

  const calculateProgress = (filePath: string): number => {
    const fileData = fileDataMap.get(filePath);

    if (!fileData || fileData.isSourceOnly || fileData.units.length === 0) return 0;
    const translatedCount = fileData.units.filter((unit) => unit.target && unit.target.trim() !== '').length;

    return Math.round((translatedCount / fileData.units.length) * 100);
  };

  return (
    <div className="mb-3">
      <button
        onClick={onToggle}
        className={`flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-all ${
          isExpanded
            ? 'border-border bg-white/5'
            : 'hover:border-border border-transparent bg-transparent hover:bg-white/5'
        }`}
      >
        <ChevronRight size={16} className={`text-secondary transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        <span className="flex-1 truncate font-mono text-sm font-semibold text-white/90">{baseName}</span>
        <span className="border-border rounded-md border bg-white/5 px-2 py-0.5 font-mono text-[11px] font-medium text-white/70">
          {files.length} files
        </span>
      </button>

      {isExpanded && (
        <div className="mt-1.5 space-y-1">
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
            className="hover:text-accent ml-0 flex w-full items-center gap-2 rounded-md px-3 py-2 font-mono text-xs text-white/70 transition-all hover:bg-white/5"
          >
            <Plus size={14} />
            <span>Add language</span>
          </button>
        </div>
      )}
    </div>
  );
}
