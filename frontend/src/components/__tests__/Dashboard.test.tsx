import { render, screen } from '@testing-library/react';
import { Dashboard } from '../Dashboard';

const fileGroups = [];

test('dashboard renders open actions when empty', () => {
  render(
    <Dashboard
      fileGroups={fileGroups}
      fileDataMap={new Map()}
      onOpenFile={() => {}}
      onOpenFolder={() => {}}
      onOpenGroupFile={() => {}}
    />
  );

  expect(screen.getByText(/open file/i)).toBeInTheDocument();
  expect(screen.getByText(/open folder/i)).toBeInTheDocument();
});
