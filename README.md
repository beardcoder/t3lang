# T3Lang - TYPO3 Translation Manager

A modern desktop application for managing TYPO3 translation files (XLIFF format). Built with Tauri v2, React, and Tailwind CSS with a sleek interface inspired by modern web players.

## ✨ Features

### 🎨 Modern UI

- **Clean, minimal design** with dark/light mode
- Rounded buttons and smooth transitions
- Color scheme optimized for both themes
- Hover effects and visual feedback

### 📁 File Management

- **Open entire folders** with TYPO3 translation files
- **File tree view** with expandable groups
- Support for TYPO3 naming convention:
  - `locallang.xlf` - Default language file
  - `de.locallang.xlf` - German translation
  - `fr.locallang.xlf` - French translation
- Visual indicators for file types (DEFAULT/DE/FR badges)

### ✏️ Translation Editing

- **Table view** with 4 columns: ID, Source, Translation, Actions
- **Click to edit** any translation inline
- **Drag and drop** to reorder translation keys
- **Add new translation keys** with dialog
- **Delete translations** with confirmation
- Real-time search across ID, source, and target text
- Keyboard shortcuts (Cmd/Ctrl + S to save, Esc to cancel)

### 🌍 Multi-Language Support

- **Create new language files** with one click
- Automatically copies structure from default file
- Empty translations ready to be filled
- Supports any 2-letter language code (de, fr, es, it, etc.)

### 🔄 XLIFF Version Management

- **Switch between XLIFF v1.2 and v2.0**
- Version selector in the header
- Converts files on the fly
- Version preserved when saving

## 🎯 Tech Stack

- **Tauri v2** - Desktop application framework
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS v3** - Styling
- **xliff-simple** - XLIFF file parsing and building
- **Vite 7** - Build tool

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Rust (latest stable)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## 📖 Usage Guide

### Opening Files

1. **Open Folder** (recommended)

   - Click the green "📁 Open Folder" button
   - Select a folder containing XLIFF files
   - All files are loaded and grouped automatically

2. **Open File**
   - Click "📄 Open File" for single file access
   - Select an .xlf or .xliff file

### Managing Translations

#### Editing Translations

1. Select a file from the sidebar
2. Browse translations in the table
3. Click on any translation cell (empty or filled)
4. Edit the text in the textarea
5. Click "Save" or press Cmd/Ctrl + S
6. Click "Cancel" or press Esc to discard changes

#### Reordering Translation Keys

1. Hover over any translation row
2. Click and hold the grip handle (⋮⋮) on the left
3. Drag the row to the desired position
4. Release to save the new order
5. Changes are saved automatically

#### Adding New Keys

1. Click the green "➕ Add Key" button in the header
2. Enter the Key ID (e.g., `button.submit`)
3. Enter the Source Text
4. Click "Add Key"
5. The new key appears in the table with an empty translation

#### Deleting Keys

1. Hover over any translation row
2. Click the red "Delete" button that appears
3. Confirm the deletion
4. Key is removed from the file

### Creating New Language Files

1. Open a folder with XLIFF files
2. Click "➕ New Language" in the sidebar
3. Enter a 2-letter language code (e.g., `fr` for French)
4. A new file is created (e.g., `fr.locallang.xlf`)
5. The file automatically opens with empty translations ready to fill

### Changing XLIFF Version

1. Look for the "XLIFF" dropdown in the header
2. Select v1.2 or v2.0
3. The file is converted and saved automatically

### Search

- Use the search bar at the top to filter translations
- Searches across:
  - Translation IDs
  - Source text
  - Target text
- Results update in real-time

## ⌨️ Keyboard Shortcuts

- `Cmd/Ctrl + S` - Save current edit
- `Esc` - Cancel current edit or close dialog
- `Click` - Start editing translation

## 🎨 Design Features

### Interface

- **Dark mode by default** with true black background (#000000)
- **Rounded buttons** with pill shape (rounded-full)
- **Accent color** (green #1db954) for primary actions
- **Smooth hover effects** with scale transforms
- **Sticky headers** for better navigation
- **Minimal borders** and subtle shadows

### Color Palette

**Dark Mode:**

- Background: Pure black (#000000)
- Secondary: Dark gray (#121212)
- Hover: Lighter gray (#2a2a2a)
- Accent: Green (#1db954)
- Danger: Red (#e22134)

## 📂 Sample Files

The project includes sample TYPO3 translation files in `typo3-translations/`:

```
typo3-translations/
├── locallang.xlf           # Default (EN)
├── de.locallang.xlf        # German
├── locallang_db.xlf        # Database labels (EN)
└── de.locallang_db.xlf     # Database labels (DE)
```

**Try it:** Run the app and open the `typo3-translations` folder!

## 🏗️ Project Structure

```
t3lang/
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx              # Navigation and actions
│   │   ├── FileTree.tsx             # File tree view
│   │   └── TranslationTable.tsx     # Main editing table
│   ├── contexts/
│   │   └── ThemeContext.tsx         # Dark/light mode
│   ├── App.tsx                      # Main app logic
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Global styles & theme
├── src-tauri/                       # Rust backend
├── typo3-translations/              # Sample files
└── package.json
```

## 🎯 Best Practices

The application follows Tauri v2 best practices:

- ✅ Plugin system for file operations and dialogs
- ✅ Proper capabilities and permissions
- ✅ Security-first approach
- ✅ Native file dialogs
- ✅ Optimized for performance
- ✅ Type-safe TypeScript throughout

## 🚢 Releases

The project uses GitHub Actions for automated builds and releases:

- **Continuous Integration**: Automated builds on every push and PR for macOS, Linux, and Windows
- **Automated Releases**: Create a new release by pushing a tag (e.g., `git tag v0.1.0 && git push origin v0.1.0`)
- **Multi-Platform**: Builds for macOS (Apple Silicon & Intel), Linux, and Windows
- **Draft Releases**: Releases are created as drafts for review before publishing

To create a new release:
```bash
git tag v0.1.0
git push origin v0.1.0
```

The GitHub Actions workflow will automatically build the app for all platforms and create a draft release.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT

---

Made with 🧘🏼 for TYPO3 translators
