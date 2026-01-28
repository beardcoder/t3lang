import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Plus, FolderOpen } from 'lucide-react';
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
    const translatedCount = fileData.units.filter((unit) =>
      unit.target && typeof unit.target === 'string' && unit.target.trim() !== ''
    ).length;

    return Math.round((translatedCount / fileData.units.length) * 100);
  };

  const totalProgress = translationFiles.length > 0
    ? Math.round(translationFiles.reduce((sum, file) => sum + calculateProgress(file.path), 0) / translationFiles.length)
    : 0;

  return (
    <div className="mb-2">
      <motion.button
        onClick={onToggle}
        className="group flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-left transition-colors hover:bg-[var(--color-bg-tertiary)]"
        style={{
          backgroundColor: isExpanded ? 'var(--color-bg-tertiary)' : 'transparent',
          border: `1px solid ${isExpanded ? 'var(--color-border)' : 'transparent'}`,
        }}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.12 }}
        >
          <ChevronRight
            size={16}
            style={{ color: 'var(--color-text-tertiary)' }}
          />
        </motion.div>

        <FolderOpen
          size={16}
          style={{ color: isExpanded ? 'var(--color-warning)' : 'var(--color-text-tertiary)' }}
          className="transition-colors"
        />

        <span
          className="flex-1 truncate font-mono text-sm font-semibold leading-snug"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {baseName}
        </span>

        {translationFiles.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="badge" style={{ fontSize: '11px' }}>
              {totalProgress}%
            </span>
            <span className="badge">
              {files.length}
            </span>
          </div>
        )}

        {translationFiles.length === 0 && (
          <span className="badge">
            {files.length}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-2 ml-6 space-y-2.5 border-l-2 pl-3" style={{ borderColor: 'var(--color-border-subtle)' }}>
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

              <motion.button
                onClick={onAddLanguage}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors hover:bg-[var(--color-bg-tertiary)]"
                style={{
                  color: 'var(--color-text-tertiary)',
                  backgroundColor: 'transparent',
                }}
              >
                <Plus size={14} />
                <span>Add language</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
