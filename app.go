package main

import (
	"context"
	"fmt"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// FileEntry represents a file or directory entry
type FileEntry struct {
	Name        string `json:"name"`
	Path        string `json:"path"`
	IsDirectory bool   `json:"isDirectory"`
}

// FileInfo represents file metadata
type FileInfo struct {
	IsFile      bool `json:"isFile"`
	IsDirectory bool `json:"isDirectory"`
}

// ReadTextFile reads a text file and returns its content
func (a *App) ReadTextFile(path string) (string, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(content), nil
}

// WriteTextFile writes content to a text file
func (a *App) WriteTextFile(path, content string) error {
	return os.WriteFile(path, []byte(content), 0644)
}

// ReadDir recursively scans a directory for .xlf and .xliff files
func (a *App) ReadDir(path string) ([]FileEntry, error) {
	var entries []FileEntry

	err := filepath.WalkDir(path, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if !d.IsDir() {
			name := d.Name()
			if strings.HasSuffix(name, ".xlf") || strings.HasSuffix(name, ".xliff") {
				entries = append(entries, FileEntry{
					Name:        name,
					Path:        p,
					IsDirectory: false,
				})
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return entries, nil
}

// Exists checks if a file or directory exists
func (a *App) Exists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

// Remove deletes a file
func (a *App) Remove(path string) error {
	return os.Remove(path)
}

// Stat returns file metadata
func (a *App) Stat(path string) (*FileInfo, error) {
	info, err := os.Stat(path)
	if err != nil {
		return nil, err
	}

	return &FileInfo{
		IsFile:      !info.IsDir(),
		IsDirectory: info.IsDir(),
	}, nil
}

// OpenFileDialog opens a file picker dialog for XLIFF files
func (a *App) OpenFileDialog() (string, error) {
	file, err := wailsRuntime.OpenFileDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: "Open XLIFF File",
		Filters: []wailsRuntime.FileFilter{
			{
				DisplayName: "XLIFF Files",
				Pattern:     "*.xlf;*.xliff",
			},
		},
	})

	if err != nil {
		return "", err
	}

	return file, nil
}

// OpenFolderDialog opens a folder picker dialog
func (a *App) OpenFolderDialog() (string, error) {
	folder, err := wailsRuntime.OpenDirectoryDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: "Open Folder",
	})

	if err != nil {
		return "", err
	}

	return folder, nil
}

// ShowMessage displays a message dialog
func (a *App) ShowMessage(content, title, kind string) error {
	var dialogType wailsRuntime.DialogType

	switch kind {
	case "error":
		dialogType = wailsRuntime.ErrorDialog
	case "warning":
		dialogType = wailsRuntime.WarningDialog
	default:
		dialogType = wailsRuntime.InfoDialog
	}

	_, err := wailsRuntime.MessageDialog(a.ctx, wailsRuntime.MessageDialogOptions{
		Type:    dialogType,
		Title:   title,
		Message: content,
	})

	return err
}

// ConfirmDialog displays a confirmation dialog
func (a *App) ConfirmDialog(content, title string) (bool, error) {
	result, err := wailsRuntime.MessageDialog(a.ctx, wailsRuntime.MessageDialogOptions{
		Type:    wailsRuntime.QuestionDialog,
		Title:   title,
		Message: content,
		Buttons: []string{"Yes", "No"},
	})

	if err != nil {
		return false, err
	}

	return result == "Yes", nil
}

// InstallCLI installs the CLI symlink to PATH
func (a *App) InstallCLI() (string, error) {
	switch runtime.GOOS {
	case "darwin":
		return a.installCLIMacOS()
	case "linux":
		return a.installCLILinux()
	case "windows":
		return a.installCLIWindows()
	default:
		return "", fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}
}

func (a *App) installCLIMacOS() (string, error) {
	target := "/usr/local/bin/t3lang"
	source := "/Applications/T3Lang.app/Contents/MacOS/t3lang"

	if _, err := os.Stat(source); os.IsNotExist(err) {
		return "", fmt.Errorf("application binary not found at %s", source)
	}

	script := fmt.Sprintf(`do shell script "ln -sf '%s' '%s'" with administrator privileges`, source, target)
	cmd := exec.Command("osascript", "-e", script)

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("failed to create symlink: %w", err)
	}

	return fmt.Sprintf("CLI installed successfully at %s", target), nil
}

func (a *App) installCLILinux() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	binDir := filepath.Join(homeDir, ".local", "bin")
	target := filepath.Join(binDir, "t3lang")

	if err := os.MkdirAll(binDir, 0755); err != nil {
		return "", err
	}

	exePath, err := os.Executable()
	if err != nil {
		return "", err
	}

	if err := os.Remove(target); err != nil && !os.IsNotExist(err) {
		return "", err
	}

	if err := os.Symlink(exePath, target); err != nil {
		return "", err
	}

	return fmt.Sprintf("CLI installed successfully at %s", target), nil
}

func (a *App) installCLIWindows() (string, error) {
	appDataDir := os.Getenv("APPDATA")
	if appDataDir == "" {
		return "", fmt.Errorf("APPDATA environment variable not set")
	}

	binDir := filepath.Join(appDataDir, "T3Lang", "bin")
	target := filepath.Join(binDir, "t3lang.exe")

	if err := os.MkdirAll(binDir, 0755); err != nil {
		return "", err
	}

	exePath, err := os.Executable()
	if err != nil {
		return "", err
	}

	input, err := os.ReadFile(exePath)
	if err != nil {
		return "", err
	}

	if err := os.WriteFile(target, input, 0755); err != nil {
		return "", err
	}

	// Add to PATH (requires restart or new terminal)
	return fmt.Sprintf("CLI installed at %s\nAdd %s to your PATH environment variable", target, binDir), nil
}

// UninstallCLI removes the CLI symlink
func (a *App) UninstallCLI() (string, error) {
	switch runtime.GOOS {
	case "darwin":
		return a.uninstallCLIMacOS()
	case "linux":
		return a.uninstallCLILinux()
	case "windows":
		return a.uninstallCLIWindows()
	default:
		return "", fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}
}

func (a *App) uninstallCLIMacOS() (string, error) {
	target := "/usr/local/bin/t3lang"

	script := fmt.Sprintf(`do shell script "rm -f '%s'" with administrator privileges`, target)
	cmd := exec.Command("osascript", "-e", script)

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("failed to remove symlink: %w", err)
	}

	return "CLI uninstalled successfully", nil
}

func (a *App) uninstallCLILinux() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	target := filepath.Join(homeDir, ".local", "bin", "t3lang")

	if err := os.Remove(target); err != nil && !os.IsNotExist(err) {
		return "", err
	}

	return "CLI uninstalled successfully", nil
}

func (a *App) uninstallCLIWindows() (string, error) {
	appDataDir := os.Getenv("APPDATA")
	if appDataDir == "" {
		return "", fmt.Errorf("APPDATA environment variable not set")
	}

	target := filepath.Join(appDataDir, "T3Lang", "bin", "t3lang.exe")

	if err := os.Remove(target); err != nil && !os.IsNotExist(err) {
		return "", err
	}

	return "CLI uninstalled successfully", nil
}

// IsCliInstalled checks if the CLI is installed
func (a *App) IsCliInstalled() bool {
	var target string

	switch runtime.GOOS {
	case "darwin":
		target = "/usr/local/bin/t3lang"
	case "linux":
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return false
		}
		target = filepath.Join(homeDir, ".local", "bin", "t3lang")
	case "windows":
		appDataDir := os.Getenv("APPDATA")
		if appDataDir == "" {
			return false
		}
		target = filepath.Join(appDataDir, "T3Lang", "bin", "t3lang.exe")
	default:
		return false
	}

	_, err := os.Stat(target)
	return err == nil
}

// ShowNotification displays a platform-native notification
func (a *App) ShowNotification(title, body string) error {
	switch runtime.GOOS {
	case "darwin":
		return a.showNotificationMacOS(title, body)
	case "linux":
		return a.showNotificationLinux(title, body)
	case "windows":
		return a.showNotificationWindows(title, body)
	default:
		return fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}
}

func (a *App) showNotificationMacOS(title, body string) error {
	script := fmt.Sprintf(`display notification "%s" with title "%s"`, body, title)
	cmd := exec.Command("osascript", "-e", script)
	return cmd.Run()
}

func (a *App) showNotificationLinux(title, body string) error {
	cmd := exec.Command("notify-send", title, body)
	return cmd.Run()
}

func (a *App) showNotificationWindows(title, body string) error {
	// For Windows, we'll use a simple powershell notification
	// A more sophisticated approach would use github.com/go-toast/toast
	script := fmt.Sprintf(`
		[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
		[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
		$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
		$xml.LoadXml('<toast><visual><binding template="ToastText02"><text id="1">%s</text><text id="2">%s</text></binding></visual></toast>')
		$toast = New-Object Windows.UI.Notifications.ToastNotification $xml
		[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("T3Lang").Show($toast)
	`, title, body)

	cmd := exec.Command("powershell", "-Command", script)
	return cmd.Run()
}
