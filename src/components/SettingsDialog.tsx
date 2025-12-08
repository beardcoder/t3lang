import { motion, AnimatePresence } from "motion/react";
import { Button } from "./Button";
import { useSettings, IndentType } from "../contexts/SettingsContext";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const { settings, updateSettings } = useSettings();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 200, damping: 16 }}
            className="border-border w-full max-w-md rounded-xl border p-7 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
            style={{
              backgroundColor: "var(--color-bg-secondary)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.h3
              className="mb-6 text-2xl font-semibold"
              style={{ color: "var(--color-text-primary)" }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Settings
            </motion.h3>

            <motion.div
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {/* Indent Type */}
              <div>
                <label
                  className="mb-3 block font-mono text-sm font-semibold tracking-[0.08em] uppercase"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Indentation
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateSettings({ indentType: "tabs" })}
                    className="flex-1 rounded-lg border px-4 py-3 font-medium transition-all"
                    style={{
                      backgroundColor:
                        settings.indentType === "tabs"
                          ? "var(--color-accent)"
                          : "var(--color-bg-tertiary)",
                      color:
                        settings.indentType === "tabs"
                          ? "#000"
                          : "var(--color-text-primary)",
                      borderColor:
                        settings.indentType === "tabs"
                          ? "var(--color-accent)"
                          : "var(--color-border)",
                    }}
                  >
                    Tabs
                  </button>
                  <button
                    onClick={() => updateSettings({ indentType: "spaces" })}
                    className="flex-1 rounded-lg border px-4 py-3 font-medium transition-all"
                    style={{
                      backgroundColor:
                        settings.indentType === "spaces"
                          ? "var(--color-accent)"
                          : "var(--color-bg-tertiary)",
                      color:
                        settings.indentType === "spaces"
                          ? "#000"
                          : "var(--color-text-primary)",
                      borderColor:
                        settings.indentType === "spaces"
                          ? "var(--color-accent)"
                          : "var(--color-border)",
                    }}
                  >
                    Spaces
                  </button>
                </div>
              </div>

              {/* Indent Size (only for spaces) */}
              <AnimatePresence>
                {settings.indentType === "spaces" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label
                      className="mb-3 block font-mono text-sm font-semibold tracking-[0.08em] uppercase"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Indent Size
                    </label>
                    <div className="flex gap-2">
                      {[2, 4].map((size) => (
                        <button
                          key={size}
                          onClick={() => updateSettings({ indentSize: size })}
                          className="flex-1 rounded-lg border px-4 py-3 font-mono font-medium transition-all"
                          style={{
                            backgroundColor:
                              settings.indentSize === size
                                ? "var(--color-accent)"
                                : "var(--color-bg-tertiary)",
                            color:
                              settings.indentSize === size
                                ? "#000"
                                : "var(--color-text-primary)",
                            borderColor:
                              settings.indentSize === size
                                ? "var(--color-accent)"
                                : "var(--color-border)",
                          }}
                        >
                          {size} spaces
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Preview */}
              <div>
                <label
                  className="mb-3 block font-mono text-sm font-semibold tracking-[0.08em] uppercase"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Preview
                </label>
                <pre
                  className="overflow-x-auto rounded-lg border p-4 font-mono text-xs"
                  style={{
                    backgroundColor: "var(--color-bg-tertiary)",
                    color: "var(--color-text-primary)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  {generatePreview(settings.indentType, settings.indentSize)}
                </pre>
              </div>

              <motion.div
                className="flex gap-3 pt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Button
                  onClick={onClose}
                  variant="primary"
                  className="flex-1 !rounded-lg"
                >
                  Done
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function generatePreview(indentType: IndentType, indentSize: number): string {
  const showChar = indentType === "tabs" ? "→   " : "·".repeat(indentSize);

  return `<xliff version="1.2">
${showChar}<file>
${showChar}${showChar}<body>
${showChar}${showChar}${showChar}<trans-unit id="key">
${showChar}${showChar}${showChar}${showChar}<source>Hello</source>
${showChar}${showChar}${showChar}</trans-unit>
${showChar}${showChar}</body>
${showChar}</file>
</xliff>`;
}
