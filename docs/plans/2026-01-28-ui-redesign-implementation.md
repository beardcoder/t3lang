# UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current UI with a developer-focused Dashboard + Editor layout, add a conversion panel, and implement system-dependent light/dark theming.

**Architecture:** Keep data in App state (file groups + file data map), introduce a Dashboard for overview and a TopBar for editor actions. Use small, testable utilities for language matrix, missing translations, and auto-sorting. Styling is driven by CSS variables with light/dark palettes.

**Tech Stack:** React + TypeScript + Vite + Tailwind CSS + Motion + Wails.

### Task 1: Add frontend test harness (Vitest + Testing Library)

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Create: `frontend/src/test/setup.ts`

**Step 1: Add test tooling (configuration only)**

Update `frontend/package.json` devDependencies and scripts:
```json
{
  "scripts": {
    "test": "vitest"
  },
  "devDependencies": {
    "vitest": "^1.6.0",
    "@testing-library/react": "^14.3.1",
    "@testing-library/jest-dom": "^6.4.6",
    "@testing-library/user-event": "^14.6.1",
    "jsdom": "^24.0.0"
  }
}
```

**Step 2: Configure Vitest**

Update `frontend/vite.config.ts`:
```ts
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts'
  }
})
```

**Step 3: Add test setup**

Create `frontend/src/test/setup.ts`:
```ts
import '@testing-library/jest-dom';
```

**Step 4: Commit**
```bash
git add frontend/package.json frontend/vite.config.ts frontend/src/test/setup.ts
git commit -m "test: add vitest + testing library"
```

### Task 2: Dashboard utilities (language matrix + missing translations)

**Files:**
- Create: `frontend/src/utils/dashboard.ts`
- Create: `frontend/src/utils/__tests__/dashboard.test.ts`

**Step 1: Write failing tests** (@superpowers:test-driven-development)

`frontend/src/utils/__tests__/dashboard.test.ts`:
```ts
import { buildLanguageMatrix, collectMissingTranslations } from '../dashboard';

const fileGroups = [
  {
    baseName: 'labels',
    files: [
      { name: 'default.labels.xlf', path: '/a/default.labels.xlf', language: 'default', baseName: 'labels' },
      { name: 'de.labels.xlf', path: '/a/de.labels.xlf', language: 'de', baseName: 'labels' }
    ]
  },
  {
    baseName: 'messages',
    files: [
      { name: 'default.messages.xlf', path: '/a/default.messages.xlf', language: 'default', baseName: 'messages' },
      { name: 'fr.messages.xlf', path: '/a/fr.messages.xlf', language: 'fr', baseName: 'messages' }
    ]
  }
];

const fileDataMap = new Map([
  ['/a/de.labels.xlf', { units: [{ id: 'a', source: 'A', target: '' }], isSourceOnly: false }],
  ['/a/fr.messages.xlf', { units: [{ id: 'b', source: 'B', target: 'BB' }], isSourceOnly: false }]
]);

test('buildLanguageMatrix returns languages and per-group status', () => {
  const matrix = buildLanguageMatrix(fileGroups);
  expect(matrix.languages).toEqual(['default', 'de', 'fr']);
  expect(matrix.byGroup.get('labels')?.get('fr')).toBe('missing');
  expect(matrix.byGroup.get('messages')?.get('de')).toBe('missing');
});

test('collectMissingTranslations returns only missing targets', () => {
  const missing = collectMissingTranslations(fileDataMap);
  expect(missing).toHaveLength(1);
  expect(missing[0].id).toBe('a');
});
```

**Step 2: Run tests to verify failure**

Run: `cd frontend && npm test -- dashboard.test.ts`
Expected: FAIL (module not found: `../dashboard`).

**Step 3: Implement utilities**

Create `frontend/src/utils/dashboard.ts`:
```ts
import type { T3FileGroup } from '../components/FileTree';
import type { FileData } from '../hooks/useFileOperations';

export type LanguageStatus = 'present' | 'missing';

export function buildLanguageMatrix(fileGroups: T3FileGroup[]) {
  const languages = Array.from(
    new Set(fileGroups.flatMap((group) => group.files.map((file) => file.language)))
  ).sort((a, b) => (a === 'default' ? -1 : b === 'default' ? 1 : a.localeCompare(b)));

  const byGroup = new Map<string, Map<string, LanguageStatus>>();

  fileGroups.forEach((group) => {
    const map = new Map<string, LanguageStatus>();
    const present = new Set(group.files.map((f) => f.language));
    languages.forEach((lang) => {
      map.set(lang, present.has(lang) ? 'present' : 'missing');
    });
    byGroup.set(group.baseName, map);
  });

  return { languages, byGroup };
}

export function collectMissingTranslations(fileDataMap: Map<string, FileData>) {
  const missing: Array<{ id: string; source: string; language: string; filePath: string }> = [];

  for (const [path, data] of fileDataMap.entries()) {
    if (data.isSourceOnly) continue;
    const language = data.targetLanguage || '';
    for (const unit of data.units) {
      if (!unit.target || String(unit.target).trim() === '') {
        missing.push({ id: unit.id, source: unit.source, language, filePath: path });
      }
    }
  }

  return missing;
}
```

**Step 4: Run tests to verify pass**

Run: `cd frontend && npm test -- dashboard.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add frontend/src/utils/dashboard.ts frontend/src/utils/__tests__/dashboard.test.ts
git commit -m "feat: add dashboard data utilities"
```

### Task 3: Sorting utilities for auto-sort

**Files:**
- Create: `frontend/src/utils/sort.ts`
- Create: `frontend/src/utils/__tests__/sort.test.ts`
- Modify: `frontend/src/components/TranslationTable.tsx`

**Step 1: Write failing tests** (@superpowers:test-driven-development)

`frontend/src/utils/__tests__/sort.test.ts`:
```ts
import { sortUnits } from '../sort';

const units = [
  { id: 'b.key', source: 'Zebra', target: '' },
  { id: 'a.key', source: 'Apple', target: '' }
];

test('sortUnits sorts by key ascending', () => {
  const sorted = sortUnits(units, 'key-asc');
  expect(sorted.map((u) => u.id)).toEqual(['a.key', 'b.key']);
});

test('sortUnits sorts by source ascending', () => {
  const sorted = sortUnits(units, 'source-asc');
  expect(sorted.map((u) => u.source)).toEqual(['Apple', 'Zebra']);
});
```

**Step 2: Run tests to verify failure**

Run: `cd frontend && npm test -- sort.test.ts`
Expected: FAIL (module not found: `../sort`).

**Step 3: Implement utility**

Create `frontend/src/utils/sort.ts`:
```ts
export type SortMode = 'manual' | 'key-asc' | 'source-asc';

export function sortUnits<T extends { id: string; source: string }>(units: T[], mode: SortMode): T[] {
  if (mode === 'manual') return [...units];
  const next = [...units];
  if (mode === 'key-asc') {
    next.sort((a, b) => a.id.localeCompare(b.id));
  }
  if (mode === 'source-asc') {
    next.sort((a, b) => a.source.localeCompare(b.source));
  }
  return next;
}
```

**Step 4: Run tests to verify pass**

Run: `cd frontend && npm test -- sort.test.ts`
Expected: PASS.

**Step 5: Wire into TranslationTable**

Update `frontend/src/components/TranslationTable.tsx` to add a sort dropdown and “Apply” action that calls `onReorder(sortUnits(...))` and an option to return to manual order.

**Step 6: Commit**
```bash
git add frontend/src/utils/sort.ts frontend/src/utils/__tests__/sort.test.ts frontend/src/components/TranslationTable.tsx
git commit -m "feat: add auto sort for translation table"
```

### Task 4: Dashboard component

**Files:**
- Create: `frontend/src/components/Dashboard.tsx`
- Create: `frontend/src/components/__tests__/Dashboard.test.tsx`
- Modify: `frontend/src/App.tsx`

**Step 1: Write failing component test** (@superpowers:test-driven-development)

`frontend/src/components/__tests__/Dashboard.test.tsx`:
```tsx
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

  expect(screen.getByText(/Open file/i)).toBeInTheDocument();
  expect(screen.getByText(/Open folder/i)).toBeInTheDocument();
});
```

**Step 2: Run tests to verify failure**

Run: `cd frontend && npm test -- Dashboard.test.tsx`
Expected: FAIL (module not found: `../Dashboard`).

**Step 3: Implement Dashboard**

Create `frontend/src/components/Dashboard.tsx` using `buildLanguageMatrix` and `collectMissingTranslations` to render:
- Group cards with a language status matrix
- Missing translations list with a language filter
- Primary actions: open file/folder

**Step 4: Run tests to verify pass**

Run: `cd frontend && npm test -- Dashboard.test.tsx`
Expected: PASS.

**Step 5: Wire Dashboard into App**

Update `frontend/src/App.tsx` to introduce a `viewMode` state (`dashboard` | `editor`), defaulting to dashboard when a folder opens, and switch to editor when a file is opened.

**Step 6: Commit**
```bash
git add frontend/src/components/Dashboard.tsx frontend/src/components/__tests__/Dashboard.test.tsx frontend/src/App.tsx
git commit -m "feat: add dashboard view"
```

### Task 5: Top bar + conversion panel

**Files:**
- Create: `frontend/src/components/TopBar.tsx`
- Create: `frontend/src/components/__tests__/TopBar.test.tsx`
- Create: `frontend/src/components/ConversionPanel.tsx`
- Modify: `frontend/src/App.tsx`

**Step 1: Write failing tests** (@superpowers:test-driven-development)

`frontend/src/components/__tests__/TopBar.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { TopBar } from '../TopBar';

test('top bar renders search and actions', () => {
  render(
    <TopBar
      searchQuery=""
      onSearchChange={() => {}}
      onOpenConvert={() => {}}
      onOpenSettings={() => {}}
      onToggleSidebar={() => {}}
    />
  );

  expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  expect(screen.getByText(/convert/i)).toBeInTheDocument();
});
```

**Step 2: Run tests to verify failure**

Run: `cd frontend && npm test -- TopBar.test.tsx`
Expected: FAIL (module not found: `../TopBar`).

**Step 3: Implement TopBar + ConversionPanel**

Create `TopBar` and `ConversionPanel` that show:
- Search input
- Convert button (opens panel)
- Sync status indicator + Settings button
- Sidebar toggle

**Step 4: Run tests to verify pass**

Run: `cd frontend && npm test -- TopBar.test.tsx`
Expected: PASS.

**Step 5: Wire into App**

Update `frontend/src/App.tsx` to show TopBar in editor mode and a ConversionPanel that calls `handleVersionChange`.

**Step 6: Commit**
```bash
git add frontend/src/components/TopBar.tsx frontend/src/components/__tests__/TopBar.test.tsx frontend/src/components/ConversionPanel.tsx frontend/src/App.tsx
git commit -m "feat: add editor top bar and conversion panel"
```

### Task 6: Visual redesign (layout + theming)

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/components/Sidebar.tsx`
- Modify: `frontend/src/components/TranslationTable.tsx`
- Modify: `frontend/src/components/SearchBar.tsx`

**Step 1: Update theme tokens**

Adjust `frontend/src/index.css`:
- Add light palette in `:root`
- Add `.dark` overrides for dark palette
- Replace purple accent with teal/blue accent
- Add background gradient/texture
- Add new headline/body font families (non-default)

**Step 2: Update layout styling**

Apply new styles to Sidebar, SearchBar, TranslationTable to match the new look.

**Step 3: Manual verification**

Run: `cd frontend && npm run dev` and verify:
- Light/dark follows system preference
- Dashboard layout aligns with new design
- Editor top bar and table are readable

**Step 4: Commit**
```bash
git add frontend/src/index.css frontend/src/components/Sidebar.tsx frontend/src/components/TranslationTable.tsx frontend/src/components/SearchBar.tsx
git commit -m "style: redesign layout and theme"
```

### Task 7: Final verification

**Step 1: Run tests**

Run: `cd frontend && npm test`
Expected: PASS.

**Step 2: Build frontend**

Run: `cd frontend && npm run build`
Expected: PASS.

**Step 3: Report results**

Summarize changes and confirm next steps.
