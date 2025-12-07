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
      transition={{ duration: 0.18 }}
      className="px-6 py-4"
      style={{
        backgroundColor: "var(--color-bg-primary)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <motion.div
        initial={{ scale: 0.99 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.18 }}
        className="relative"
      >
        <motion.div
          className="absolute left-4 top-1/2 -translate-y-1/2"
          animate={{ scale: value ? 1.1 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          <Search size={18} style={{ color: "var(--color-text-secondary)" }} />
        </motion.div>
        <motion.input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3 rounded-full text-sm"
          style={{
            backgroundColor: "var(--color-bg-hover)",
            color: "var(--color-text-primary)",
            border: "2px solid transparent",
          }}
          whileFocus={{
            borderColor: "var(--color-accent)",
            boxShadow: "0 0 0 3px rgba(30, 215, 96, 0.1)",
          }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>
    </motion.div>
  );
}
