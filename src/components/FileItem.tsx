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
      <motion.button
        onClick={onSelect}
        className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg"
        style={{
          backgroundColor: isSelected
            ? "var(--color-bg-hover)"
            : "transparent",
          color: "var(--color-text-primary)",
        }}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <motion.div
          animate={{ scale: isSelected ? 1.1 : 1, rotate: isSelected ? 5 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          {isSource ? <FileText size={14} /> : <Globe size={14} />}
        </motion.div>
        <span className="text-sm flex-1 truncate">{name}</span>
        <motion.span
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
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {isSource ? "Source" : language.toUpperCase()}
        </motion.span>
      </motion.button>
      {onDelete && isHovered && (
        <motion.button
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
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <X size={12} />
        </motion.button>
      )}
    </motion.div>
  );
}
