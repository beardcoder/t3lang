# Wails Release Workflow Design

## Overview

GitHub Actions workflow for building and releasing the T3Lang Wails application across all platforms (macOS, Linux, Windows).

## Trigger

- Git tags matching `v*` pattern (e.g., v1.0.0)
- Manual workflow dispatch

## Build Matrix

Three platforms with specific build targets:
- **macOS-latest**: `darwin/universal` (Intel + ARM)
- **ubuntu-22.04**: `linux/amd64`
- **windows-latest**: `windows/amd64`

## Build Process

### Dependencies

**Go**: Version 1.23 (matches go.mod)
**Node**: Version 20.x
**Linux packages**: build-essential, libgtk-3-dev, libwebkit2gtk-4.0-dev, pkg-config

### Steps

1. Checkout repository
2. Install platform-specific system dependencies (Linux only)
3. Setup Go and Node
4. Install frontend dependencies (`npm install` in frontend directory)
5. Build with `dAppServer/wails-build-action@v3`
   - Uses Wails v2.11.0 (latest)
   - Output: `build/bin/*`
   - Package mode disabled (handled by release step)
6. Create GitHub release with `softprops/action-gh-release@v1`
   - Draft mode enabled
   - Uploads all artifacts from `build/bin/*`

## Release Configuration

- Name: "T3Lang {tag}"
- Body: "See the CHANGELOG.md for details."
- Draft: true (requires manual publish)
- Prerelease: false

## Changes from Tauri

- Removed Rust toolchain and cache
- Removed Bun (frontend now uses npm)
- Added Go toolchain setup
- Changed from `tauri-apps/tauri-action` to `dAppServer/wails-build-action`
- Updated Linux dependencies (GTK3/WebKit2GTK instead of WebKit2GTK 4.1)
- Removed CI workflow (release-only approach)
