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
    <div className="flex h-screen flex-col  text-text-primary">
      <div className="flex flex-1 overflow-hidden">
        <Navigator collapsed={sidebarCollapsed} width={sidebarWidth} />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <ContextBar />

          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </div>

      <StatusBar />
    </div>
  );
}
