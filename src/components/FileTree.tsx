import { useState } from 'react';
import { ChevronRight, FileText, Globe } from 'lucide-react';

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

interface FileTreeProps {
  fileGroups: T3FileGroup[];
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
}

export function FileTree({ fileGroups, selectedFile, onFileSelect }: FileTreeProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(fileGroups.map(g => g.baseName))
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
      <div className="p-4 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        No files loaded
      </div>
    );
  }

  return (
    <div className="px-2 pb-2">
      {fileGroups.map((group) => {
        const isExpanded = expandedGroups.has(group.baseName);
        const defaultFile = group.files.find(f => f.language === 'default');
        const translationFiles = group.files.filter(f => f.language !== 'default');

        return (
          <div key={group.baseName} className="mb-1">
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group.baseName)}
              className="w-full flex items-center gap-2 px-2 py-2 text-left rounded-md"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--color-text-primary)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ChevronRight
                size={14}
                className="transition-transform"
                style={{
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  color: 'var(--color-text-secondary)'
                }}
              />
              <span className="text-sm font-semibold flex-1 truncate">
                {group.baseName}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                backgroundColor: 'var(--color-bg-hover)',
                color: 'var(--color-text-secondary)'
              }}>
                {group.files.length}
              </span>
            </button>

            {/* Files */}
            {isExpanded && (
              <div className="ml-4 mt-1 space-y-1">
                {defaultFile && (
                  <button
                    onClick={() => onFileSelect(defaultFile.path)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-left rounded-md"
                    style={{
                      backgroundColor: selectedFile === defaultFile.path ? 'var(--color-bg-hover)' : 'transparent',
                      color: 'var(--color-text-primary)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedFile !== defaultFile.path) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <FileText size={14} />
                    <span className="text-sm flex-1 truncate">{defaultFile.name}</span>
                    {selectedFile === defaultFile.path && (
                      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
                    )}
                  </button>
                )}

                {translationFiles.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => onFileSelect(file.path)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-left rounded-md"
                    style={{
                      backgroundColor: selectedFile === file.path ? 'var(--color-bg-hover)' : 'transparent',
                      color: 'var(--color-text-primary)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedFile !== file.path) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <Globe size={14} />
                    <span className="text-sm flex-1 truncate">{file.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                      backgroundColor: 'var(--color-accent)',
                      color: 'white'
                    }}>
                      {file.language.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
