import { FileText, Globe, X } from 'lucide-react';
import { useState } from 'react';

interface FileItemProps {
  name: string;
  path: string;
  language: string;
  isSelected: boolean;
  isSource?: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  translationProgress?: number;
}

export function FileItem({
  name,
  language,
  isSelected,
  isSource,
  onSelect,
  onDelete,
  translationProgress = 0,
}: FileItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="group relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <button
        onClick={onSelect}
        className={`relative flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors ${
          isSelected
            ? 'border-border bg-white/5'
            : 'hover:border-border border-transparent bg-transparent hover:bg-white/5'
        }`}
      >
        <div className={`rounded-md p-2 ${isSelected ? 'bg-white/10 text-white' : 'bg-white/5 text-white/70'}`}>
          {isSource ? <FileText size={15} /> : <Globe size={15} />}
        </div>
        <div className="flex-1 truncate">
          <div className={`truncate text-xs font-semibold ${isSelected ? 'text-white' : 'text-white/90'}`}>{name}</div>
          <div className="font-mono text-[11px] tracking-[0.08em] text-white/60 uppercase">
            {isSource ? 'source' : language}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {!isSource && translationProgress !== undefined && (
            <span className="border-border rounded-md border bg-white/5 px-2 py-0.5 font-mono text-[10px] font-semibold text-white/80">
              {translationProgress}%
            </span>
          )}
          <span
            className={`rounded-md border font-semibold ${
              isSource
                ? 'bg-accent text-primary border-transparent px-2 py-0.5 text-[10px]'
                : 'border-border bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/70'
            }`}
          >
            {isSource ? 'Source' : language.toUpperCase()}
          </span>
        </div>
      </button>
      {onDelete && isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="bg-danger hover:bg-danger-hover absolute top-2 right-2 rounded-md p-1.5 text-white shadow-lg transition-all"
          title="Delete language file"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
