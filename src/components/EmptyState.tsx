import { motion } from 'motion/react';
import { Globe } from 'lucide-react';

export function EmptyState() {
  return (
    <motion.div
      key="empty-state"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex h-full items-center justify-center"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      <div className="text-center">
        <Globe
          className="mx-auto mb-4"
          size={64}
          style={{
            color: 'var(--color-text-secondary)',
            opacity: 0.3,
          }}
        />
        <h2 className="mb-2 text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          t3lang
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Open a folder or file to get started
        </p>
      </div>
    </motion.div>
  );
}
