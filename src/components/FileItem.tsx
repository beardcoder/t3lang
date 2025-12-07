import { motion } from "motion/react";
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
}

export function FileItem({
  name,
  language,
  isSelected,
  isSource,
  onSelect,
  onDelete,
}: FileItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative z-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      style={{ zIndex: isHovered ? 20 : 10 }}
    >
      <button
        onClick={onSelect}
        className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg"
        style={{
          backgroundColor: isSelected ? "var(--color-bg-hover)" : "transparent",
          color: "var(--color-text-primary)",
        }}
      >
        <div>{isSource ? <FileText size={14} /> : <Globe size={14} />}</div>
        <span className="text-xs flex-1 truncate">{name}</span>
        <span
          className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
            isSource ? "" : "text-xs px-2 py-0.5 font-medium"
          }`}
          style={{
            backgroundColor: isSource
              ? "var(--color-accent)"
              : "var(--color-bg-tertiary)",
            color: isSource
              ? "var(--color-bg-secondary)"
              : "var(--color-text-secondary)",
            border: isSource ? "none" : "1px solid var(--color-border)",
          }}
        >
          {isSource ? "Source" : language.toUpperCase()}
        </span>
      </button>
      {onDelete && isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md z-30"
          style={{
            backgroundColor: "var(--color-danger)",
            color: "white",
          }}
          title="Delete language file"
        >
          <X size={12} />
        </button>
      )}
    </motion.div>
  );
}
