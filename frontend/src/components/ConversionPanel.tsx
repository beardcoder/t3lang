import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeftRight } from 'lucide-react';

interface ConversionPanelProps {
  isOpen: boolean;
  currentVersion: '1.2' | '2.0';
  onClose: () => void;
  onConfirm: (version: '1.2' | '2.0') => void;
}

export function ConversionPanel({ isOpen, currentVersion, onClose, onConfirm }: ConversionPanelProps) {
  const [selectedVersion, setSelectedVersion] = useState<'1.2' | '2.0'>(currentVersion);

  useEffect(() => {
    if (isOpen) {
      setSelectedVersion(currentVersion);
    }
  }, [isOpen, currentVersion]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-lg rounded-2xl border p-6 shadow-xl"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-subtle)',
            }}
          >
            <div className="mb-5 flex items-center gap-3">
              <div
                className="rounded-xl p-2"
                style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}
              >
                <ArrowLeftRight size={18} />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Convert XLIFF format
                </h3>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  Applies to all languages in this file group
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-between rounded-lg border p-3 text-sm"
                style={{ borderColor: 'var(--color-border-subtle)' }}
              >
                <span style={{ color: 'var(--color-text-primary)' }}>XLIFF 1.2</span>
                <input
                  type="radio"
                  name="xliff-version"
                  value="1.2"
                  checked={selectedVersion === '1.2'}
                  onChange={() => setSelectedVersion('1.2')}
                  aria-label="XLIFF 1.2"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-lg border p-3 text-sm"
                style={{ borderColor: 'var(--color-border-subtle)' }}
              >
                <span style={{ color: 'var(--color-text-primary)' }}>XLIFF 2.0</span>
                <input
                  type="radio"
                  name="xliff-version"
                  value="2.0"
                  checked={selectedVersion === '2.0'}
                  onChange={() => setSelectedVersion('2.0')}
                  aria-label="XLIFF 2.0"
                />
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(selectedVersion)}
                className="flex-1 rounded-lg px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
              >
                Convert
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
