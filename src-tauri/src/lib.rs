use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    Emitter, Manager,
};
use std::process::Command;

#[tauri::command]
fn install_cli() -> Result<String, String> {
    let source = "/Applications/T3Lang.app/Contents/Resources/t3lang";
    let target = "/usr/local/bin/t3lang";

    // Check if source exists
    if !std::path::Path::new(source).exists() {
        return Err("T3Lang is not installed in /Applications. Please move the app there first.".to_string());
    }

    let script = format!(
        r#"do shell script "ln -sf '{}' '{}'" with administrator privileges"#,
        source, target
    );

    let output = Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok("CLI installed successfully! You can now use 't3lang' from the terminal.".to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        if stderr.contains("User canceled") {
            Err("Installation cancelled.".to_string())
        } else {
            Err(format!("Installation failed: {}", stderr))
        }
    }
}

#[tauri::command]
fn uninstall_cli() -> Result<String, String> {
    let script = r#"
        do shell script "rm -f /usr/local/bin/t3lang" with administrator privileges
    "#;

    let output = Command::new("osascript")
        .arg("-e")
        .arg(script)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok("CLI uninstalled successfully.".to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        if stderr.contains("User canceled") {
            Err("Uninstallation cancelled.".to_string())
        } else {
            Err(format!("Uninstallation failed: {}", stderr))
        }
    }
}

#[tauri::command]
fn is_cli_installed() -> bool {
    std::path::Path::new("/usr/local/bin/t3lang").exists()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![install_cli, uninstall_cli, is_cli_installed])
        .setup(|app| {
            // Build menu
            let open_file = MenuItemBuilder::with_id("open-file", "Open File...")
                .accelerator("CmdOrCtrl+O")
                .build(app)?;
            let open_folder = MenuItemBuilder::with_id("open-folder", "Open Folder...")
                .accelerator("CmdOrCtrl+Shift+O")
                .build(app)?;
            let settings_item = MenuItemBuilder::with_id("settings", "Settings...")
                .accelerator("CmdOrCtrl+,")
                .build(app)?;
            let install_cli_item = MenuItemBuilder::with_id("install-cli", "Install 't3lang' command...")
                .build(app)?;
            let uninstall_cli_item = MenuItemBuilder::with_id("uninstall-cli", "Uninstall 't3lang' command...")
                .build(app)?;

            let file_menu = SubmenuBuilder::new(app, "File")
                .item(&open_file)
                .item(&open_folder)
                .separator()
                .item(&settings_item)
                .separator()
                .item(&install_cli_item)
                .item(&uninstall_cli_item)
                .build()?;

            let menu = MenuBuilder::new(app)
                .item(&file_menu)
                .build()?;

            app.set_menu(menu)?;

            // Handle menu events
            app.on_menu_event(move |app_handle, event| {
                let window = app_handle.get_webview_window("main").unwrap();
                match event.id().as_ref() {
                    "open-file" => {
                        let _ = window.emit("menu-open-file", ());
                    }
                    "open-folder" => {
                        let _ = window.emit("menu-open-folder", ());
                    }
                    "settings" => {
                        let _ = window.emit("menu-settings", ());
                    }
                    "install-cli" => {
                        let _ = window.emit("menu-install-cli", ());
                    }
                    "uninstall-cli" => {
                        let _ = window.emit("menu-uninstall-cli", ());
                    }
                    _ => {}
                }
            });

            // Handle CLI arguments
            let args: Vec<String> = std::env::args().collect();
            if args.len() > 1 {
                let path = &args[1];
                if !path.starts_with('-') {
                    let window = app.get_webview_window("main").unwrap();
                    let path_clone = path.clone();
                    std::thread::spawn(move || {
                        std::thread::sleep(std::time::Duration::from_millis(500));
                        let _ = window.emit("open-path", path_clone);
                    });
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
