# UI Redesign Design - t3lang

Date: 2026-01-28

## Summary
Redesign the UI around two core modes: Dashboard (overview and entry) and Editor (focused work). The product is developer-first and optimized for managing language files: editing, extending, sorting, and converting XLIFF. The visual direction is a mix of pro-tool clarity and editorial boldness. Theme follows the system (light and dark).

## Goals
- Make the app feel stable, readable, and fast for daily developer workflows.
- Put the two primary workflows front and center: edit/search and file management.
- Provide a clear dashboard overview with language presence status and missing translations.
- Keep conversion (XLIFF 1.2 <-> 2.0) available without mode switching.
- Support both manual and automatic sorting with apply-to-all-languages.
- Respect system-dependent light and dark mode.

## Non-goals
- Adding new file formats beyond XLIFF 1.2 and 2.0.
- Building a full project analytics suite.
- Designing a public-facing marketing UI.

## Users and primary workflows
- Developers maintaining translation files in repositories.
- Primary workflows:
  - Search and edit translation keys in a focused editor.
  - Manage language files and add new languages.

## Information architecture
- Two main modes:
  - Dashboard (default entry)
  - Editor (active file)
- Conversion available as a panel or modal from the Editor top bar.
- Sidebar is toggleable (on or off) in Editor mode.

## Dashboard
- Dateigruppen board
  - Group cards by base name.
  - Language status chips per group (present or missing).
  - Click group to open Editor; click a language chip to open that file.
- Missing translations list
  - Focused list with quick filters (language, missing only).
  - Shows key + source; optional inline target edit for fast fixes.
- Primary CTAs
  - Open file
  - Open folder
  - Continue last file (when available)

## Editor
- Utility top bar (always visible)
  - Search and filter
  - Convert (XLIFF 1.2 <-> 2.0)
  - Settings and sync status
- Translation table
  - Inline edit, clear target, delete row
  - Strong focus and selection states
- Sorting
  - Manual drag and drop with per-row handle
  - Automatic sorting (A-Z by key, by source)
  - Apply-to-all-languages option for both modes
- Sidebar (toggle)
  - File groups and language list with status
  - Quick file switching

## Conversion panel
- Opened from the top bar
- Select target XLIFF version (1.2 or 2.0)
- Confirm action, show short summary
- No mode switch, returns to Editor on close

## Visual direction
- Mix of pro-tool compactness and editorial hierarchy
- Clear, bold headings and calm, readable table typography
- Light background with subtle texture or gradient
- High contrast accent color for primary actions

## Theming
- System-dependent theme using prefers-color-scheme.
- Automatically updates when the OS theme changes.
- Theme tokens drive background, text, borders, and focus states.

## Motion
- Short, subtle transitions for mode switches and panels.
- Use motion to reinforce focus, not for decoration.

## Data flow
- Dashboard and Editor are both driven by the existing file group and file data map.
- Dashboard links into Editor by selecting current file.
- Sorting and conversion update related language files consistently.

## Error handling
- Inline validation for duplicate keys and invalid operations.
- Clear error dialogs for file IO or conversion failures.

## Accessibility
- Visible focus states for keyboard navigation.
- Sufficient contrast in both themes.
- Table rows and actions reachable by keyboard.

## Testing
- Manual smoke test of the main flows:
  - Open folder, view dashboard, open file, edit, save, convert, sort.
- Theme test: switching OS theme updates UI.

## Open questions
- None at this stage.
