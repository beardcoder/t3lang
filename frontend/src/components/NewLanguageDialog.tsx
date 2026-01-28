import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Button } from './Button';

interface NewLanguageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (languageCode: string) => void;
}

export function NewLanguageDialog({ isOpen, onClose, onConfirm }: NewLanguageDialogProps) {
  const [languageCode, setLanguageCode] = useState('');

  const handleConfirm = () => {
    if (languageCode.trim().length === 2) {
      onConfirm(languageCode.trim().toLowerCase());
      setLanguageCode('');
    }
  };

  const handleClose = () => {
    onClose();
    setLanguageCode('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16 }}
            className="border-border w-full max-w-md rounded-xl border p-7 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.h3
              className="mb-6 text-2xl font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Add New Language
            </motion.h3>

            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <div>
                <label
                  className="mb-2 block font-mono text-sm font-semibold tracking-[0.08em] uppercase"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Language Code (2 letters)
                </label>
                <motion.input
                  type="text"
                  value={languageCode}
                  onChange={(e) => setLanguageCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirm();
                    if (e.key === 'Escape') handleClose();
                  }}
                  placeholder="e.g., de, fr, es"
                  maxLength={2}
                  className="w-full rounded-lg border px-4 py-3 font-mono uppercase"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-primary)',
                    borderColor: 'var(--color-border)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                  }}
                  autoFocus
                  whileFocus={{
                    borderColor: 'var(--color-accent)',
                    boxShadow: '0 0 0 3px rgba(103, 232, 249, 0.12)',
                  }}
                />
                <motion.p
                  className="mt-2 font-mono text-xs text-white/60"
                  style={{ color: 'var(--color-text-secondary)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Common codes: de (German), fr (French), es (Spanish), it (Italian), nl (Dutch)
                </motion.p>
              </div>

              <motion.div
                className="flex gap-3 pt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Button
                  onClick={handleConfirm}
                  disabled={languageCode.trim().length !== 2}
                  variant="primary"
                  className="flex-1 !rounded-lg"
                >
                  Create Language File
                </Button>
                <Button onClick={handleClose} variant="secondary" className="flex-1 !rounded-lg">
                  Cancel
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
