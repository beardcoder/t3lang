import { motion } from 'motion/react';
import { Languages, Sparkles } from 'lucide-react';

export function EmptyState() {
  return (
    <motion.div
      key="empty-state"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="flex h-full items-center justify-center"
      style={{ backgroundColor: 'var(--color-bg-app)' }}
    >
      <div className="text-center max-w-md px-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.15 }}
          className="relative mb-8 inline-block"
        >
          <div
            className="absolute inset-0 animate-pulse rounded-full blur-2xl"
            style={{
              background: 'radial-gradient(circle, var(--color-accent-light) 0%, transparent 70%)',
            }}
          />
          <div
            className="relative rounded-2xl p-6"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <Languages
              size={56}
              strokeWidth={1.5}
              style={{ color: 'var(--color-accent)' }}
            />
            <Sparkles
              size={20}
              className="absolute -top-2 -right-2"
              style={{ color: 'var(--color-warning)' }}
            />
          </div>
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.15 }}
          className="mb-3 text-3xl font-bold gradient-text"
        >
          Welcome to T3Lang
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.11, duration: 0.15 }}
          className="text-base leading-relaxed mb-8"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Your TYPO3 XLIFF translation workspace. Open a folder or file from the sidebar to start managing your translations.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.14, duration: 0.15 }}
          className="flex gap-4 justify-center items-center text-xs"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-success)' }} />
            <span>.xlf & .xliff support</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
            <span>Real-time editing</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
