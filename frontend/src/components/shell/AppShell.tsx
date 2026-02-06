import { ReactNode, useEffect } from 'react';
import { useUIStore, initializeTheme } from '../../stores';
import { Navigator } from '../navigator/Navigator';
import { ContextBar } from './ContextBar';
import { StatusBar } from './StatusBar';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const sidebarWidth = useUIStore((state) => state.sidebarWidth);
  const resolvedTheme = useUIStore((state) => state.resolvedTheme);

  // Initialize theme system
  useEffect(() => {
    const cleanup = initializeTheme();
    return cleanup;
  }, []);

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  return (
    <div className="flex h-screen flex-col bg-bg-primary text-text-primary">
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigator sidebar */}
        <Navigator
          collapsed={sidebarCollapsed}
          width={sidebarWidth}
        />

        {/* Main panel */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Context bar */}
          <ContextBar />

          {/* Main content */}
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  );
}
