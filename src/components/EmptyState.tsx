import { motion } from "motion/react";
import { Globe } from "lucide-react";

export function EmptyState() {
  return (
    <motion.div
      key="empty-state"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className="h-full flex items-center justify-center"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      <motion.div
        className="text-center"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.2 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Globe
            className="mx-auto mb-6"
            size={80}
            style={{
              color: "var(--color-text-secondary)",
            }}
          />
        </motion.div>
        <motion.h2
          className="text-3xl font-bold mb-3"
          style={{ color: "var(--color-text-primary)" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          T3Lang
        </motion.h2>
        <motion.p
          className="text-base"
          style={{ color: "var(--color-text-secondary)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Open a folder or file to get started
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
