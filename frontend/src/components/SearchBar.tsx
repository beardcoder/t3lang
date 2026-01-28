import { motion } from 'motion/react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search translations...' }: SearchBarProps) {
  return (
    <motion.div
      key="searchbar"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className="border-b px-6 py-4"
      style={{
        borderColor: 'var(--color-border-subtle)',
        backgroundColor: 'var(--color-bg-secondary)',
      }}
    >
      <div className="relative">
        <div className="absolute top-1/2 left-3.5 -translate-y-1/2 transition-colors">
          <Search size={16} style={{ color: value ? 'var(--color-accent)' : 'var(--color-text-tertiary)' }} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border py-2.5 pr-10 pl-10 text-sm transition-all focus:ring-2"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            borderColor: value ? 'var(--color-accent)' : 'var(--color-border)',
          }}
        />
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => onChange('')}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 transition-colors hover:bg-white/10"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <X size={14} />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
