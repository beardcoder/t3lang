import { render, screen } from '@testing-library/react';
import { TopBar } from '../TopBar';
import type { SyncState } from '../../hooks/useSync';

const syncState: SyncState = {
  status: 'synced',
  progress: 100,
  filesAffected: [],
};

test('top bar renders search and actions', () => {
  render(
    <TopBar
      searchQuery=""
      onSearchChange={() => {}}
      onOpenConvert={() => {}}
      onOpenSettings={() => {}}
      onToggleSidebar={() => {}}
      isSidebarVisible
      syncState={syncState}
      pendingOperations={[]}
    />
  );

  expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /convert/i })).toBeInTheDocument();
});
