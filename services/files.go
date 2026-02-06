package services

import (
	"fmt"
	"os"
	"path/filepath"
)

// WriteFileAtomic writes content to a file atomically using a temp file and rename
func WriteFileAtomic(path, content string) error {
	dir := filepath.Dir(path)

	// Create temp file in the same directory (for atomic rename)
	tmpFile, err := os.CreateTemp(dir, ".t3lang-*.tmp")
	if err != nil {
		return fmt.Errorf("failed to create temp file: %w", err)
	}
	tmpPath := tmpFile.Name()

	// Ensure cleanup on failure
	success := false
	defer func() {
		if !success {
			os.Remove(tmpPath)
		}
	}()

	// Write content to temp file
	if _, err := tmpFile.WriteString(content); err != nil {
		tmpFile.Close()
		return fmt.Errorf("failed to write to temp file: %w", err)
	}

	// Close temp file before rename
	if err := tmpFile.Close(); err != nil {
		return fmt.Errorf("failed to close temp file: %w", err)
	}

	// Get original file permissions (or use default)
	perm := os.FileMode(0644)
	if info, err := os.Stat(path); err == nil {
		perm = info.Mode()
	}

	// Set permissions on temp file
	if err := os.Chmod(tmpPath, perm); err != nil {
		return fmt.Errorf("failed to set permissions: %w", err)
	}

	// Atomic rename
	if err := os.Rename(tmpPath, path); err != nil {
		return fmt.Errorf("failed to rename temp file: %w", err)
	}

	success = true
	return nil
}

// CreateLanguageFile creates a new language file from a template
func CreateLanguageFile(templatePath, newPath, languageCode string) error {
	// Read template content
	content, err := os.ReadFile(templatePath)
	if err != nil {
		return fmt.Errorf("failed to read template: %w", err)
	}

	// Check if target already exists
	if _, err := os.Stat(newPath); err == nil {
		return fmt.Errorf("file already exists: %s", newPath)
	}

	// Ensure directory exists
	dir := filepath.Dir(newPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	// Write to new path atomically
	return WriteFileAtomic(newPath, string(content))
}

// CopyFile copies a file from src to dst
func CopyFile(src, dst string) error {
	content, err := os.ReadFile(src)
	if err != nil {
		return fmt.Errorf("failed to read source: %w", err)
	}

	return WriteFileAtomic(dst, string(content))
}

// EnsureDirectoryExists creates a directory if it doesn't exist
func EnsureDirectoryExists(path string) error {
	return os.MkdirAll(path, 0755)
}

// DeleteFile deletes a file
func DeleteFile(path string) error {
	return os.Remove(path)
}

// FileExists checks if a file exists
func FileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

// GetFileModTime returns the modification time of a file as Unix timestamp
func GetFileModTime(path string) (int64, error) {
	info, err := os.Stat(path)
	if err != nil {
		return 0, err
	}
	return info.ModTime().UnixMilli(), nil
}
