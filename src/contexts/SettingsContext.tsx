import React, { createContext, useContext, useEffect, useState } from "react";

export type IndentType = "tabs" | "spaces";

export interface Settings {
  indentType: IndentType;
  indentSize: number;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  getIndentString: () => string;
}

const defaultSettings: Settings = {
  indentType: "tabs",
  indentSize: 4,
};

const STORAGE_KEY = "t3lang-settings";

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore parse errors
    }

    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const getIndentString = () => {
    if (settings.indentType === "tabs") {
      return "\t";
    }

    return " ".repeat(settings.indentSize);
  };

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, getIndentString }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }

  return context;
}
