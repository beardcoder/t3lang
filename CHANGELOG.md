# Changelog

All notable changes to T3Lang will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Migrated from Tauri to Wails v2 for improved cross-platform support
- Complete UI redesign with Dashboard and Editor modes
- Improved performance with virtualized lists and optimized rendering

### Added
- Dashboard view with file group management and missing translations overview
- Enhanced editor with search, filter, and inline editing capabilities
- XLIFF conversion between versions 1.2 and 2.0
- File watching and auto-reload functionality
- CLI installation support for all platforms
- Keyboard shortcuts for common operations
- System theme support (light/dark mode)
- Language file creation from templates

### Fixed
- File handling and atomic writes to prevent data corruption
- Cross-platform notification support
- Memory leaks in file watcher

## Release Notes

This version represents a complete rebuild of T3Lang using Wails v2, offering better performance,
improved cross-platform compatibility, and a modernized user interface designed specifically for
managing XLIFF translation files in development workflows.
