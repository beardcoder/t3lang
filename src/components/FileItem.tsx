import { FileText, Globe, X } from "lucide-react";
import { useState } from "react";

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
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={onSelect}
        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg transition-all ${
          isSelected
            ? "bg-white/10"
            : "bg-transparent hover:bg-white/5"
        }`}
      >
        <div className={`${isSelected ? "text-white/80" : "text-white/50"}`}>
          {isSource ? <FileText size={15} /> : <Globe size={15} />}
        </div>
        <span className={`text-xs flex-1 truncate ${isSelected ? "text-white/90" : "text-white/80"}`}>
          {name}
        </span>
        <div className="flex items-center gap-1.5">
          {!isSource && translationProgress !== undefined && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-accent/15 text-accent">
              {translationProgress}%
            </span>
          )}
          <span
            className={`rounded-md font-semibold ${
              isSource
                ? "text-[10px] px-2 py-0.5 bg-accent text-white"
                : "text-[10px] px-2 py-0.5 font-medium bg-white/10 text-white/70"
            }`}
          >
            {isSource ? "Source" : language.toUpperCase()}
          </span>
        </div>
      </button>
      {onDelete && isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-danger hover:bg-danger-hover text-white transition-all shadow-lg"
          title="Delete language file"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
