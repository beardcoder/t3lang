import { useState } from 'react';
import { ChevronRight, FileText, Globe, Plus, X } from 'lucide-react';

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
  onAddLanguage: (baseName: string) => void;
  onDeleteFile: (filePath: string) => void;
}

export function FileTree({ fileGroups, selectedFile, onFileSelect, onAddLanguage, onDeleteFile }: FileTreeProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(fileGroups.map(g => g.baseName))
  );
  const [hoveredFile, setHoveredFile] = useState<string | null>(null);

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
    <div className="px-2 pb-3">
      {fileGroups.map((group) => {
        const isExpanded = expandedGroups.has(group.baseName);
        const defaultFile = group.files.find(f => f.language === 'default');
        const translationFiles = group.files.filter(f => f.language !== 'default');

        return (
          <div key={group.baseName} className="mb-2">
            <button
              onClick={() => toggleGroup(group.baseName)}
              className="w-full flex items-center gap-2 px-3 py-3 text-left rounded-xl border"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-primary)',
                borderColor: 'var(--color-border)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'}
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
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)'
              }}>
                {group.files.length}
              </span>
            </button>

            {isExpanded && (
              <div className="ml-4 mt-2 space-y-2">
                {defaultFile && (
                  <button
                    onClick={() => onFileSelect(defaultFile.path)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg"
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
                    <span className="text-[10px] px-2 py-1 rounded-full font-semibold" style={{
                      backgroundColor: 'var(--color-accent)',
                      color: 'var(--color-bg-secondary)'
                    }}>
                      Source
                    </span>
                  </button>
                )}

                {translationFiles.map((file) => (
                  <div
                    key={file.path}
                    className="relative"
                    onMouseEnter={() => setHoveredFile(file.path)}
                    onMouseLeave={() => setHoveredFile(null)}
                  >
                    <button
                      onClick={() => onFileSelect(file.path)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg"
                      style={{
                        backgroundColor: selectedFile === file.path ? 'var(--color-bg-hover)' : 'transparent',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      <Globe size={14} />
                      <span className="text-sm flex-1 truncate">{file.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border)'
                      }}>
                        {file.language.toUpperCase()}
                      </span>
                    </button>
                    {hoveredFile === file.path && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFile(file.path);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:scale-110"
                        style={{
                          backgroundColor: 'var(--color-danger)',
                          color: 'white'
                        }}
                        title="Delete language file"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => onAddLanguage(group.baseName)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg border border-dashed"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--color-text-secondary)',
                    borderColor: 'var(--color-border)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                    e.currentTarget.style.color = 'var(--color-text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }}
                >
                  <Plus size={14} />
                  <span className="text-sm">Add language</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
