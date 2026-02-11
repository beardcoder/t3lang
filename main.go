package main

import (
	"context"
	"embed"
	"os"
	gort "runtime"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	linuxoptions "github.com/wailsapp/wails/v2/pkg/options/linux"
	macoptions "github.com/wailsapp/wails/v2/pkg/options/mac"
	windowsoptions "github.com/wailsapp/wails/v2/pkg/options/windows"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:frontend/dist
var assets embed.FS

var cliPath string

func setupMenu(app *App) *menu.Menu {
	appMenu := menu.NewMenu()

	// Application menu (macOS)
	if gort.GOOS == "darwin" {
		appMenu.Append(menu.AppMenu())
	}

	// File menu
	fileMenu := appMenu.AddSubmenu("File")
	fileMenu.AddText("Open File...", keys.CmdOrCtrl("o"), func(_ *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu-open-file")
	})
	fileMenu.AddText("Open Folder...", keys.Combo("o", keys.CmdOrCtrlKey, keys.ShiftKey), func(_ *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu-open-folder")
	})
	if gort.GOOS != "darwin" {
		fileMenu.AddSeparator()
		fileMenu.AddText("Quit", keys.CmdOrCtrl("q"), func(_ *menu.CallbackData) {
			runtime.Quit(app.ctx)
		})
	}

	// Edit menu with standard shortcuts
	editMenu := appMenu.AddSubmenu("Edit")
	editMenu.Append(menu.EditMenu())

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
		Title:     "T3Lang",
		Width:     1180,
		Height:    820,
		MinWidth:  980,
		MinHeight: 640,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 245, G: 245, B: 247, A: 1},
		Mac: &macoptions.Options{
			TitleBar:   macoptions.TitleBarDefault(),
			Appearance: macoptions.DefaultAppearance,
			WindowIsTranslucent: true,
			WebviewIsTransparent: true,
		},
		Windows: &windowsoptions.Options{
			Theme:        windowsoptions.SystemDefault,
			BackdropType: windowsoptions.Auto,
		},
		Linux: &linuxoptions.Options{
			ProgramName:      "t3lang",
			WebviewGpuPolicy: linuxoptions.WebviewGpuPolicyOnDemand,
		},
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
		Bind: []any{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
