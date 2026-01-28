package main

import (
	"context"
	"embed"
	"os"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:frontend/dist
var assets embed.FS

var cliPath string

func setupMenu(app *App) *menu.Menu {
	appMenu := menu.NewMenu()

	// File menu
	fileMenu := appMenu.AddSubmenu("File")
	fileMenu.AddText("Open File...", keys.CmdOrCtrl("o"), func(_ *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu-open-file")
	})
	fileMenu.AddText("Open Folder...", keys.Combo("o", keys.CmdOrCtrlKey, keys.ShiftKey), func(_ *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu-open-folder")
	})

	// Edit menu
	editMenu := appMenu.AddSubmenu("Edit")
	editMenu.AddText("Cut", keys.CmdOrCtrl("x"), func(_ *menu.CallbackData) {
		runtime.ClipboardSetText(app.ctx, "")
	})
	editMenu.AddText("Copy", keys.CmdOrCtrl("c"), func(_ *menu.CallbackData) {
		runtime.ClipboardSetText(app.ctx, "")
	})
	editMenu.AddText("Paste", keys.CmdOrCtrl("v"), func(_ *menu.CallbackData) {
		// Paste functionality handled by browser
	})
	editMenu.AddSeparator()
	editMenu.AddText("Select All", keys.CmdOrCtrl("a"), func(_ *menu.CallbackData) {
		// Select all functionality handled by browser
	})

	// Tools menu with settings and CLI tools
	toolsMenu := appMenu.AddSubmenu("Tools")
	toolsMenu.AddText("Settings", keys.CmdOrCtrl(","), func(_ *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu-settings")
	})
	toolsMenu.AddSeparator()
	toolsMenu.AddText("Install CLI", nil, func(_ *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu-install-cli")
	})
	toolsMenu.AddText("Uninstall CLI", nil, func(_ *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu-uninstall-cli")
	})

	// Window menu
	windowMenu := appMenu.AddSubmenu("Window")
	windowMenu.AddText("Minimize", keys.CmdOrCtrl("m"), func(_ *menu.CallbackData) {
		runtime.WindowMinimise(app.ctx)
	})
	windowMenu.AddText("Zoom", nil, func(_ *menu.CallbackData) {
		runtime.WindowMaximise(app.ctx)
	})

	return appMenu
}

func main() {
	// Parse CLI arguments
	if len(os.Args) > 1 && !strings.HasPrefix(os.Args[1], "-") {
		cliPath = os.Args[1]
	}

	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "T3Lang",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup: func(ctx context.Context) {
			app.startup(ctx)

			// Emit CLI path event after startup delay
			if cliPath != "" {
				go func() {
					time.Sleep(500 * time.Millisecond)
					runtime.EventsEmit(ctx, "open-path", cliPath)
				}()
			}
		},
		Menu: setupMenu(app),
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
