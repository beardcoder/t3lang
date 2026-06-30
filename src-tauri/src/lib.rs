use serde::Serialize;
use std::fs;
use std::path::Path;
use std::sync::Mutex;
use walkdir::WalkDir;

/// Project folder passed on the command line (if any), resolved at startup.
struct LaunchArgs(Mutex<Option<String>>);

/// Returns the project folder the app was launched with (`t3lang <folder>`).
#[tauri::command]
fn initial_project(state: tauri::State<LaunchArgs>) -> Option<String> {
    state.0.lock().ok().and_then(|g| g.clone())
}

/// Resolve a CLI argument into an absolute project directory.
fn resolve_launch_dir() -> Option<String> {
    let arg = std::env::args().skip(1).find(|a| !a.starts_with('-'))?;
    let abs = fs::canonicalize(&arg).ok()?;
    let dir = if abs.is_dir() {
        abs
    } else {
        abs.parent()?.to_path_buf()
    };
    Some(dir.to_string_lossy().to_string())
}

#[derive(Serialize)]
pub struct ScannedFile {
    /// Absolute path of the .xlf file
    path: String,
    /// Path relative to the scanned root
    rel_path: String,
    /// Directory of the file relative to the root (empty for root)
    rel_dir: String,
    /// File name only, e.g. "de.locallang.xlf"
    name: String,
    /// File size in bytes
    size: u64,
}

/// Recursively scan a directory for XLIFF files (.xlf / .xliff).
#[tauri::command]
fn scan_project(root: String) -> Result<Vec<ScannedFile>, String> {
    let root_path = Path::new(&root);
    if !root_path.is_dir() {
        return Err(format!("Not a directory: {root}"));
    }
    let mut out = Vec::new();
    for entry in WalkDir::new(root_path)
        .follow_links(false)
        .into_iter()
        .filter_entry(|e| {
            // skip common noise directories
            let name = e.file_name().to_string_lossy();
            !matches!(
                name.as_ref(),
                "node_modules" | "vendor" | ".git" | ".ddev" | "var"
            )
        })
        .filter_map(|e| e.ok())
    {
        if !entry.file_type().is_file() {
            continue;
        }
        let p = entry.path();
        let ext = p
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_ascii_lowercase())
            .unwrap_or_default();
        if ext != "xlf" && ext != "xliff" {
            continue;
        }
        let rel = p.strip_prefix(root_path).unwrap_or(p);
        let rel_path = rel.to_string_lossy().replace('\\', "/");
        let rel_dir = rel
            .parent()
            .map(|d| d.to_string_lossy().replace('\\', "/"))
            .unwrap_or_default();
        let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
        out.push(ScannedFile {
            path: p.to_string_lossy().to_string(),
            rel_path,
            rel_dir,
            name: p.file_name().unwrap().to_string_lossy().to_string(),
            size,
        });
    }
    out.sort_by(|a, b| a.rel_path.cmp(&b.rel_path));
    Ok(out)
}

#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("{path}: {e}"))
}

#[tauri::command]
fn write_text_file(path: String, contents: String) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| format!("{}: {e}", parent.display()))?;
    }
    fs::write(&path, contents).map_err(|e| format!("{path}: {e}"))
}

#[tauri::command]
fn file_exists(path: String) -> bool {
    Path::new(&path).exists()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(LaunchArgs(Mutex::new(resolve_launch_dir())))
        .setup(|_app| {
            #[cfg(target_os = "macos")]
            {
                use tauri::Manager;
                use window_vibrancy::{
                    apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState,
                };
                if let Some(window) = _app.get_webview_window("main") {
                    let _ = apply_vibrancy(
                        &window,
                        NSVisualEffectMaterial::Sidebar,
                        Some(NSVisualEffectState::Active),
                        Some(12.0),
                    );
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            scan_project,
            read_text_file,
            write_text_file,
            file_exists,
            initial_project
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
