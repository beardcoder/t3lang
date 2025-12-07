# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Drag and drop functionality to reorder translation keys
- Visual grip handle indicator for draggable rows
- Automatic save when reordering translations

### Changed
- Updated dependencies with @dnd-kit packages for drag and drop support

### Fixed
- TypeScript errors in Select component
- Removed unused imports in FileGroup and Sidebar components

## [0.1.0] - 2025-12-07

### Added
- Initial release of T3Lang
- Modern desktop application built with Tauri v2 and React 19
- Support for XLIFF v1.2 and v2.0 file formats
- Open and manage entire folders with TYPO3 translation files
- File tree view with expandable groups
- Visual indicators for file types (DEFAULT/DE/FR badges)
- Table view for translation editing with 4 columns: ID, Source, Translation, Actions
- Click-to-edit inline translation editing
- Add new translation keys with dialog
- Delete translations with confirmation
- Real-time search across ID, source, and target text
- Keyboard shortcuts (Cmd/Ctrl + S to save, Esc to cancel)
- Create new language files with one click
- Automatically copy structure from default file
- Switch between XLIFF v1.2 and v2.0
- Dark/light mode support
- Clean, minimal design with rounded buttons and smooth transitions
- Sample TYPO3 translation files included

### Tech Stack
- Tauri v2 for desktop application framework
- React 19 for UI framework
- TypeScript for type safety
- Tailwind CSS v3 for styling
- xliff-simple for XLIFF file parsing
- Vite 7 as build tool

[0.1.0]: https://github.com/beardcoder/t3lang/releases/tag/v0.1.0
