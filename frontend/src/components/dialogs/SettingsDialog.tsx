import { DialogBase } from "./DialogBase";
import { useUIStore, selectIsDialogOpen } from "../../stores";
import { Sun, Moon, Monitor, AlignLeft, Space } from "lucide-react";

export function SettingsDialog() {
  const isOpen = useUIStore((state) => selectIsDialogOpen(state, "settings"));
  const closeDialog = useUIStore((state) => state.closeDialog);
  const settings = useUIStore((state) => state.settings);
  const updateSettings = useUIStore((state) => state.updateSettings);
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={closeDialog}
      title="Settings"
      size="md"
      footer={
        <button
          onClick={closeDialog}
          className="rounded-full border border-border-subtle bg-bg-tertiary px-4 py-2 text-sm text-text-primary hover:bg-bg-hover"
        >
          Done
        </button>
      }
    >
      <div className="space-y-6">
        {/* Theme */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-text-primary">Theme</h3>
          <div className="flex gap-2">
            {[
              { value: "light", icon: Sun, label: "Light" },
              { value: "dark", icon: Moon, label: "Dark" },
              { value: "system", icon: Monitor, label: "System" },
            ].map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value as "light" | "dark" | "system")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 text-sm transition-colors ${
                  theme === value
                    ? "border-accent/45 bg-accent-light text-accent"
                    : "border-border-subtle bg-bg-tertiary/55 hover:bg-bg-tertiary"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Indentation */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-text-primary">
            Indentation
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => updateSettings({ indentType: "tabs" })}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 text-sm transition-colors ${
                settings.indentType === "tabs"
                  ? "border-accent/45 bg-accent-light text-accent"
                  : "border-border-subtle bg-bg-tertiary/55 hover:bg-bg-tertiary"
              }`}
            >
              <AlignLeft className="h-4 w-4" />
              Tabs
            </button>
            <button
              onClick={() => updateSettings({ indentType: "spaces" })}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 text-sm transition-colors ${
                settings.indentType === "spaces"
                  ? "border-accent/45 bg-accent-light text-accent"
                  : "border-border-subtle bg-bg-tertiary/55 hover:bg-bg-tertiary"
              }`}
            >
              <Space className="h-4 w-4" />
              Spaces
            </button>
          </div>

          {settings.indentType === "spaces" && (
            <div className="mt-3">
              <label className="mb-1 block text-xs text-text-tertiary">
                Space count
              </label>
              <select
                value={settings.indentSize}
                onChange={(e) =>
                  updateSettings({ indentSize: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-border  px-3 py-2 text-sm focus:border-accent focus:outline-hidden"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
                <option value={8}>8 spaces</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </DialogBase>
  );
}
