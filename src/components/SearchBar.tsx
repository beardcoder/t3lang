import { motion } from "motion/react";
import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search translations...",
}: SearchBarProps) {
  return (
    <motion.div
      key="searchbar"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.15 }}
      className="border-b px-6 py-3"
      style={{
        borderColor: "rgba(255, 255, 255, 0.06)",
      }}
    >
      <div className="relative">
        <div className="absolute top-1/2 left-3 -translate-y-1/2">
          <Search size={16} style={{ color: "var(--color-text-secondary)" }} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border py-2 pr-3 pl-10 text-sm transition-all"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            color: "var(--color-text-primary)",
            borderColor: "transparent",
          }}
        />
      </div>
    </motion.div>
  );
}
