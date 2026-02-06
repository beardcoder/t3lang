import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { AppSettings, DialogState, Notification } from '../types';

type Theme = 'system' | 'light' | 'dark';

interface UIState {
  // Sidebar
  sidebarCollapsed: boolean;
  sidebarWidth: number;

  // Theme
  theme: Theme;
  resolvedTheme: 'light' | 'dark';

  // Settings
  settings: AppSettings;

  // Dialogs
  activeDialog: DialogState;

  // Notifications (toast messages)
  notifications: Notification[];

  // Loading states
  isLoading: boolean;
  loadingMessage: string | null;

  // Actions - Sidebar
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;

  // Actions - Theme
  setTheme: (theme: Theme) => void;
  setResolvedTheme: (resolved: 'light' | 'dark') => void;

  // Actions - Settings
  updateSettings: (updates: Partial<AppSettings>) => void;
  getIndentString: () => string;

  // Actions - Dialogs
  openDialog: (type: DialogState['type'], props?: Record<string, unknown>) => void;
  closeDialog: () => void;

  // Actions - Notifications
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Actions - Loading
  setLoading: (loading: boolean, message?: string | null) => void;

  // Reset
  reset: () => void;
}

const defaultSettings: AppSettings = {
  indentType: 'tabs',
  indentSize: 4,
  theme: 'system',
};

const initialState = {
  sidebarCollapsed: false,
  sidebarWidth: 280,
  theme: 'system' as Theme,
  resolvedTheme: 'light' as 'light' | 'dark',
  settings: defaultSettings,
  activeDialog: { type: null } as DialogState,
  notifications: [] as Notification[],
  isLoading: false,
  loadingMessage: null,
};

const generateNotificationId = () => `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useUIStore = create<UIState>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      toggleSidebar: () => set((state) => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
      }),

      setSidebarCollapsed: (collapsed) => set((state) => {
        state.sidebarCollapsed = collapsed;
      }),

      setSidebarWidth: (width) => set((state) => {
        state.sidebarWidth = Math.max(200, Math.min(500, width));
      }),

      setTheme: (theme) => set((state) => {
        state.theme = theme;
        state.settings.theme = theme;
      }),

      setResolvedTheme: (resolved) => set((state) => {
        state.resolvedTheme = resolved;
      }),

      updateSettings: (updates) => set((state) => {
        Object.assign(state.settings, updates);
        if (updates.theme) {
          state.theme = updates.theme;
        }
      }),

      getIndentString: () => {
        const { settings } = get();
        return settings.indentType === 'tabs'
          ? '\t'
          : ' '.repeat(settings.indentSize);
      },

      openDialog: (type, props) => set((state) => {
        state.activeDialog = { type, props };
      }),

      closeDialog: () => set((state) => {
        state.activeDialog = { type: null };
      }),

      addNotification: (notification) => set((state) => {
        const id = generateNotificationId();
        state.notifications.push({ ...notification, id });

        // Auto-remove after duration
        const duration = notification.duration ?? 5000;
        if (duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, duration);
        }
      }),

      removeNotification: (id) => set((state) => {
        const idx = state.notifications.findIndex(n => n.id === id);
        if (idx !== -1) {
          state.notifications.splice(idx, 1);
        }
      }),

      clearNotifications: () => set((state) => {
        state.notifications = [];
      }),

      setLoading: (loading, message = null) => set((state) => {
        state.isLoading = loading;
        state.loadingMessage = message;
      }),

      reset: () => set({
        ...initialState,
        // Preserve persisted settings
        settings: get().settings,
        theme: get().theme,
        sidebarWidth: get().sidebarWidth,
      }),
    })),
    {
      name: 't3lang-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarWidth: state.sidebarWidth,
        theme: state.theme,
        settings: state.settings,
      }),
    }
  )
);

// Theme effect hook helper
export const initializeTheme = () => {
  const { theme, setResolvedTheme } = useUIStore.getState();

  const updateResolvedTheme = () => {
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setResolvedTheme(isDark ? 'dark' : 'light');
    } else {
      setResolvedTheme(theme);
    }
  };

  // Initial set
  updateResolvedTheme();

  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', updateResolvedTheme);

  // Subscribe to theme changes
  const unsubscribe = useUIStore.subscribe((state) => {
    if (state.theme !== theme) {
      updateResolvedTheme();
    }
  });

  return () => {
    mediaQuery.removeEventListener('change', updateResolvedTheme);
    unsubscribe();
  };
};

// Selectors
export const selectIsDialogOpen = (state: UIState, type: DialogState['type']): boolean =>
  state.activeDialog.type === type;

export const selectDialogProps = <T extends Record<string, unknown>>(state: UIState): T | undefined =>
  state.activeDialog.props as T | undefined;
