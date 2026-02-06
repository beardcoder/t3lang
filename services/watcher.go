package services

import (
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/fsnotify/fsnotify"
)

// FileWatchEvent represents a file system event
type FileWatchEvent struct {
	Type    string `json:"type"`    // "create", "modify", "delete", "rename"
	Path    string `json:"path"`    // Affected file path
	OldPath string `json:"oldPath"` // For rename events only
}

// WatcherCallback is called when a file event occurs
type WatcherCallback func(event FileWatchEvent)

// WorkspaceWatcher watches a workspace directory for file changes
type WorkspaceWatcher struct {
	watcher   *fsnotify.Watcher
	rootPath  string
	callback  WatcherCallback
	stopCh    chan struct{}
	stoppedCh chan struct{}
	mu        sync.Mutex
	running   bool
}

// NewWorkspaceWatcher creates a new workspace watcher
func NewWorkspaceWatcher(rootPath string, callback WatcherCallback) (*WorkspaceWatcher, error) {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, err
	}

	return &WorkspaceWatcher{
		watcher:   watcher,
		rootPath:  rootPath,
		callback:  callback,
		stopCh:    make(chan struct{}),
		stoppedCh: make(chan struct{}),
	}, nil
}

// Start begins watching the workspace
func (w *WorkspaceWatcher) Start() error {
	w.mu.Lock()
	if w.running {
		w.mu.Unlock()
		return nil
	}
	w.running = true
	w.mu.Unlock()

	// Add the root path and all subdirectories
	err := filepath.WalkDir(w.rootPath, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		// Skip hidden directories
		if d.IsDir() && strings.HasPrefix(d.Name(), ".") && path != w.rootPath {
			return filepath.SkipDir
		}

		if d.IsDir() {
			return w.watcher.Add(path)
		}
		return nil
	})

	if err != nil {
		return err
	}

	// Start event loop
	go w.eventLoop()

	return nil
}

// Stop stops watching the workspace
func (w *WorkspaceWatcher) Stop() {
	w.mu.Lock()
	if !w.running {
		w.mu.Unlock()
		return
	}
	w.running = false
	w.mu.Unlock()

	close(w.stopCh)
	<-w.stoppedCh
	w.watcher.Close()
}

// eventLoop processes file system events
func (w *WorkspaceWatcher) eventLoop() {
	defer close(w.stoppedCh)

	for {
		select {
		case <-w.stopCh:
			return

		case event, ok := <-w.watcher.Events:
			if !ok {
				return
			}

			// Only process XLIFF files
			if !isXliffFile(event.Name) {
				// But watch new directories
				if event.Has(fsnotify.Create) {
					info, err := os.Stat(event.Name)
					if err == nil && info.IsDir() {
						w.watcher.Add(event.Name)
					}
				}
				continue
			}

			// Convert fsnotify event to our event type
			watchEvent := w.convertEvent(event)
			if watchEvent != nil {
				w.callback(*watchEvent)
			}

		case _, ok := <-w.watcher.Errors:
			if !ok {
				return
			}
			// Log error but continue watching
		}
	}
}

// convertEvent converts an fsnotify event to a FileWatchEvent
func (w *WorkspaceWatcher) convertEvent(event fsnotify.Event) *FileWatchEvent {
	switch {
	case event.Has(fsnotify.Create):
		return &FileWatchEvent{
			Type: "create",
			Path: event.Name,
		}

	case event.Has(fsnotify.Write):
		return &FileWatchEvent{
			Type: "modify",
			Path: event.Name,
		}

	case event.Has(fsnotify.Remove):
		return &FileWatchEvent{
			Type: "delete",
			Path: event.Name,
		}

	case event.Has(fsnotify.Rename):
		return &FileWatchEvent{
			Type:    "rename",
			Path:    event.Name,
			OldPath: event.Name,
		}
	}

	return nil
}

// isXliffFile checks if a file is an XLIFF file
func isXliffFile(path string) bool {
	return strings.HasSuffix(path, ".xlf") || strings.HasSuffix(path, ".xliff")
}
