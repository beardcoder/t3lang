# t3lang

A desktop app for managing **TYPO3 XLIFF translations**. Built with **Tauri 2**,
**Svelte 5**, **Skeleton v4** and **Tailwind CSS v4** — bundles natively for
macOS, Windows and Linux.

The UI is lightly inspired by macOS: native window vibrancy, system font,
floating translucent panels, soft borders and rounded corners.

## Download & install

Grab the latest installer from the
[**Releases**](https://github.com/BreathCodeFlow/t3lang/releases/latest) page:

| Platform | File |
| --- | --- |
| macOS (Apple Silicon) | `t3lang_<version>_aarch64.dmg` |
| macOS (Intel) | `t3lang_<version>_x64.dmg` |
| Windows | `t3lang_<version>_x64-setup.exe` / `.msi` |
| Linux | `t3lang_<version>_amd64.AppImage` / `.deb` |

### macOS Gatekeeper note

Release builds are **ad-hoc signed**. Unless the project is built with a paid
Apple Developer ID (and notarized), macOS may warn that the app is from an
unidentified developer or "damaged". Either right-click the app → **Open**, or
clear the quarantine flag:

```bash
xattr -dr com.apple.quarantine /Applications/t3lang.app
```

If a maintainer adds the Apple signing secrets to the repo (see below), the
release pipeline produces fully signed & notarized macOS builds automatically.

## Features

- **Open a whole project folder** — recursively scans for `.xlf` / `.xliff`
  files and groups them into _catalogs_ (a source file + all its translations).
- **Launch from the command line with a folder** — `t3lang ./my-extension`
  opens that folder as a project on startup (a file path opens its directory).
- **Convert between XLIFF 1.2 and 2.0** — click the version badge in the
  toolbar; translation states are remapped to the target version.
- **Open a single file** — also pulls in sibling translations of the same base.
- **Create new catalogs** from scratch (choose folder, base name, source
  language, XLIFF version).
- **Add languages** — creates the TYPO3-conventional `<lang>.<base>.xlf` file.
- **Add / duplicate / delete entries** (trans-units).
- **Reorder entries** by drag & drop — the order is applied across every
  language file on save.
- **Inline editing** of source, every target language, translation `state`,
  v1.2 `approved` flag, `resname`, `xml:space`, and notes.
- **Full XLIFF 1.2 & 2.0 support**, including TYPO3 specifics:
  - File naming (`locallang.xlf`, `de.locallang.xlf`, `pt_BR.locallang.xlf`).
  - `<file>` attributes: `source-language`, `target-language`, `datatype`,
    `original`, `product-name`, `date`, the `t3:` namespace.
  - `trans-unit` `id` / `resname` / `approved` / `xml:space`, `<note from priority>`.
  - XLIFF 2.0 `srcLang`/`trgLang`, `<unit>`, `<segment state>`, `<notes>`,
    and **inline markup** (`<g>`, `<ph>`, `<pc>`, …) is preserved round-trip.
  - Unknown attributes are preserved for loss-less editing.
- **XML preview / export** per catalog, with copy-to-clipboard.
- `⌘S` / `Ctrl+S` saves all changed catalogs.

## Development

```bash
bun install
bun run app:dev      # launch the app with hot reload
bun run check        # type-check
```

## Bundling

```bash
# Current platform (produces .app + .dmg on macOS, .msi/.exe on Windows,
# .deb/.AppImage on Linux):
bun run app:build

# macOS universal binary (Intel + Apple Silicon):
bun run app:build:mac-universal
```

Build each platform on its own OS (or via CI). Output lands in
`src-tauri/target/release/bundle/`.

## Command-line usage

After building, the binary accepts a folder (or file) path and opens it as a
project:

```bash
# from the build output
./src-tauri/target/release/t3lang ./path/to/extension

# the installed macOS app
/Applications/t3lang.app/Contents/MacOS/t3lang ~/projects/my_extension
```

## Sample data

`sample/` contains example XLIFF files (v1.2 source + German translation, and a
v2.0 file with inline markup) — open the `sample/` folder in the app to try it.

## Releases & CI

- **`.github/workflows/ci.yml`** — on every push/PR: type-checks the frontend,
  builds it, and runs `cargo fmt --check` + `clippy -D warnings`.
- **`.github/workflows/release.yml`** — on a `v*` tag (or manual dispatch):
  builds macOS (arm64 + x64), Windows and Linux bundles with
  [`tauri-action`](https://github.com/tauri-apps/tauri-action) and publishes a
  GitHub Release with all installers + a signed `latest.json` for auto-updates.
- **`.github/dependabot.yml`** — weekly updates for npm, Cargo and Actions.

### Cutting a release

Bump the version in `package.json`, `src-tauri/Cargo.toml` and
`src-tauri/tauri.conf.json`, then push a matching tag — the tag triggers the
release workflow:

```bash
git commit -am "release: v3.0.1"
git tag v3.0.1
git push origin main --tags
```

### Signing secrets

The repo already has the **Tauri updater** signing key configured
(`TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`), so update
artifacts are cryptographically signed.

For **full macOS Developer ID signing + notarization**, add these repo secrets
(the workflow uses them automatically when present):

| Secret | Purpose |
| --- | --- |
| `APPLE_CERTIFICATE` | base64 of your Developer ID `.p12` |
| `APPLE_CERTIFICATE_PASSWORD` | password for the `.p12` |
| `APPLE_SIGNING_IDENTITY` | e.g. `Developer ID Application: Name (TEAMID)` |
| `APPLE_ID` | Apple ID email |
| `APPLE_PASSWORD` | app-specific password |
| `APPLE_TEAM_ID` | Apple Developer Team ID |

Without them, macOS builds fall back to ad-hoc signing (see the Gatekeeper note
above).

## Architecture

- `src-tauri/src/lib.rs` — Rust backend: `scan_project`, `read_text_file`,
  `write_text_file`, `file_exists`; native folder/file dialogs.
- `src/lib/xliff/` — version-agnostic XLIFF model: `parse.ts`, `serialize.ts`,
  `typo3.ts` (naming + language list), `types.ts`.
- `src/lib/project.ts` — groups files into catalogs and splits them back for
  saving.
- `src/lib/state.svelte.ts` — global app state (Svelte 5 runes).
- `src/lib/components/` — UI (TitleBar, Sidebar, CatalogView, Modal, …).
