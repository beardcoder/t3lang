# T3Lang

A modern, cross-platform desktop application for managing XLIFF translation files. Built with Wails v2, T3Lang provides a fast, developer-friendly interface for editing, organizing, and converting translation files in your projects.

![T3Lang Screenshot](docs/screenshot.png)

## Features

- **Dual-Mode Interface**
  - **Dashboard Mode**: Overview of all translation files with language presence status and missing translations
  - **Editor Mode**: Focused editing environment with search, filter, and inline editing

- **XLIFF Support**
  - Full support for XLIFF 1.2 and 2.0 formats
  - Seamless conversion between XLIFF versions
  - Automatic detection and parsing of `.xlf` and `.xliff` files

- **Developer-Focused Workflow**
  - File watching with auto-reload
  - Keyboard shortcuts for common operations
  - Search and filter across all translation units
  - Bulk operations across languages
  - Atomic file writes to prevent corruption

- **Cross-Platform**
  - Native performance on macOS, Linux, and Windows
  - System theme support (light/dark mode)
  - CLI tool installation for terminal workflows
  - Platform-native notifications

- **Language Management**
  - Create new language files from templates
  - Group files by base name
  - Track missing translations per language
  - Inline editing for quick fixes

## Installation

### macOS

Download the latest `.app.zip` from the [releases page](https://github.com/beardcoder/t3lang/releases), extract it, and move `T3Lang.app` to your Applications folder.

```bash
# Optional: Install CLI tool
# Open the app, go to Tools > Install CLI
```

### Linux

Download the latest `.tar.gz` from the [releases page](https://github.com/beardcoder/t3lang/releases) and extract it:

```bash
tar -xzf t3lang-Linux.tar.gz
sudo mv t3lang /usr/local/bin/
```

Or use the CLI installer from within the app (Tools > Install CLI) which installs to `~/.local/bin/t3lang`.

### Windows

Download the latest `.zip` from the [releases page](https://github.com/beardcoder/t3lang/releases) and extract the executable.

To install the CLI tool, open the app and go to Tools > Install CLI. This will copy the executable to `%APPDATA%\T3Lang\bin\` (you'll need to add this to your PATH).

## Usage

### GUI Application

1. **Open a workspace**: Click "Open Folder" to scan a directory for XLIFF files
2. **Browse files**: View all translation file groups in the Dashboard
3. **Edit translations**: Click a language chip to open the Editor
4. **Convert formats**: Use the Convert button to switch between XLIFF 1.2 and 2.0
5. **Search**: Use Cmd/Ctrl+F to search across all translation units

### CLI Usage

After installing the CLI tool, you can open files directly from the terminal:

```bash
t3lang path/to/translations.xlf
```

### Keyboard Shortcuts

- `Cmd/Ctrl + O` - Open file
- `Cmd/Ctrl + Shift + O` - Open folder
- `Cmd/Ctrl + S` - Save current file
- `Cmd/Ctrl + Shift + S` - Save all files
- `Cmd/Ctrl + F` - Search/Filter
- `Cmd/Ctrl + ,` - Settings
- `Cmd/Ctrl + Z` - Undo
- `Cmd/Ctrl + Shift + Z` - Redo

## Development

### Prerequisites

- Go 1.23 or later
- Node.js 20 or later
- Wails CLI v2.11.0 or later

**Platform-specific requirements:**

- **macOS**: Xcode command line tools
- **Linux**: `build-essential`, `libgtk-3-dev`, `libwebkit2gtk-4.0-dev`, `pkg-config`
- **Windows**: [Go](https://golang.org/dl/) and [Node.js](https://nodejs.org/) installers

### Setup

1. Clone the repository:
```bash
git clone https://github.com/beardcoder/t3lang.git
cd t3lang
```

2. Install Wails CLI:
```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

3. Install dependencies:
```bash
# Frontend dependencies
cd frontend
npm install
cd ..
```

### Live Development

Run the app in development mode with hot reload:

```bash
wails dev
```

This starts a Vite development server for fast frontend updates. The app will reload automatically when you make changes.

You can also access the app in a browser at `http://localhost:34115` to use browser DevTools.

### Building

Build a production binary:

```bash
wails build
```

The built application will be in `build/bin/`.

Build for a specific platform:

```bash
# macOS (universal binary for Intel and Apple Silicon)
wails build -platform darwin/universal

# Linux
wails build -platform linux/amd64

# Windows
wails build -platform windows/amd64
```

### Running Tests

Frontend tests:
```bash
cd frontend
npm test
```

## Project Structure

```
t3lang/
├── frontend/           # React + TypeScript frontend
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── stores/     # Zustand state management
│   │   ├── hooks/      # Custom React hooks
│   │   └── types/      # TypeScript types
│   └── wailsjs/        # Generated Wails bindings
├── services/           # Go services
│   ├── workspace.go    # Workspace scanning
│   └── watcher.go      # File watching
├── app.go              # Main app logic and API
├── main.go             # Wails application entry point
└── wails.json          # Wails configuration
```

## Technology Stack

- **Backend**: Go 1.23 with Wails v2
- **Frontend**: React 19, TypeScript, Vite
- **UI**: Tailwind CSS, Lucide icons, Motion (Framer Motion)
- **State Management**: Zustand
- **Build System**: Wails CLI, Vite

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Wails](https://wails.io/) - Amazing framework for building desktop apps with Go
- Uses [xliff-simple](https://github.com/locize/xliff) for XLIFF parsing
- UI components inspired by modern developer tools

## Author

**Markus Sommer** - [markus@letsbenow.de](mailto:markus@letsbenow.de)

---

For more information about the project configuration, see [wails.json](wails.json).
For detailed architecture and design decisions, see the [docs/plans](docs/plans) directory.
