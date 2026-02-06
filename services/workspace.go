package services

import (
	"io/fs"
	"path/filepath"
	"regexp"
	"strings"
)

// T3FileMetadata represents parsed metadata from a TYPO3 naming convention file
type T3FileMetadata struct {
	Path      string `json:"path"`
	Name      string `json:"name"`
	Language  string `json:"language"`
	BaseName  string `json:"baseName"`
	Directory string `json:"directory"`
}

// TranslationGroup represents a group of related translation files
type TranslationGroup struct {
	ID         string                    `json:"id"`
	BaseName   string                    `json:"baseName"`
	Directory  string                    `json:"directory"`
	Files      map[string]T3FileMetadata `json:"files"` // language -> file metadata
	SourceFile *T3FileMetadata           `json:"sourceFile"`
}

// WorkspaceScan represents the result of scanning a workspace
type WorkspaceScan struct {
	RootPath   string              `json:"rootPath"`
	Groups     []*TranslationGroup `json:"groups"`
	TotalFiles int                 `json:"totalFiles"`
}

// TYPO3 naming pattern: [lang].[basename].xlf or [basename].xlf
var t3FilePattern = regexp.MustCompile(`^([a-z]{2})\.(.+)\.xlf$`)

// ParseT3FileName extracts language and baseName from a TYPO3 file name
func ParseT3FileName(fileName string) (language, baseName string) {
	matches := t3FilePattern.FindStringSubmatch(fileName)
	if matches != nil {
		return matches[1], matches[2]
	}

	// Fallback: no language prefix
	if strings.HasSuffix(fileName, ".xlf") {
		return "default", strings.TrimSuffix(fileName, ".xlf")
	}
	if strings.HasSuffix(fileName, ".xliff") {
		return "default", strings.TrimSuffix(fileName, ".xliff")
	}

	return "default", fileName
}

// ScanWorkspace scans a directory for XLIFF files and groups them
func ScanWorkspace(rootPath string) (*WorkspaceScan, error) {
	// Map to collect files by group key (directory/baseName)
	groupMap := make(map[string]*TranslationGroup)
	totalFiles := 0

	err := filepath.WalkDir(rootPath, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		// Skip hidden directories
		if d.IsDir() && strings.HasPrefix(d.Name(), ".") {
			return filepath.SkipDir
		}

		if d.IsDir() {
			return nil
		}

		name := d.Name()
		if !strings.HasSuffix(name, ".xlf") && !strings.HasSuffix(name, ".xliff") {
			return nil
		}

		totalFiles++

		language, baseName := ParseT3FileName(name)
		directory := filepath.Dir(path)
		groupKey := filepath.Join(directory, baseName)

		// Create or get existing group
		group, exists := groupMap[groupKey]
		if !exists {
			// Create relative display name
			relDir, _ := filepath.Rel(rootPath, directory)
			displayName := baseName
			if relDir != "." && relDir != "" {
				displayName = filepath.Join(relDir, baseName)
			}

			group = &TranslationGroup{
				ID:        groupKey,
				BaseName:  displayName,
				Directory: directory,
				Files:     make(map[string]T3FileMetadata),
			}
			groupMap[groupKey] = group
		}

		// Add file to group
		fileMeta := T3FileMetadata{
			Path:      path,
			Name:      name,
			Language:  language,
			BaseName:  baseName,
			Directory: directory,
		}
		group.Files[language] = fileMeta

		// Track source file
		if language == "default" {
			group.SourceFile = &fileMeta
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Convert map to sorted slice
	groups := make([]*TranslationGroup, 0, len(groupMap))
	for _, group := range groupMap {
		groups = append(groups, group)
	}

	// Sort groups by baseName for consistent ordering
	sortGroups(groups)

	return &WorkspaceScan{
		RootPath:   rootPath,
		Groups:     groups,
		TotalFiles: totalFiles,
	}, nil
}

// sortGroups sorts translation groups alphabetically by baseName
func sortGroups(groups []*TranslationGroup) {
	for i := 0; i < len(groups)-1; i++ {
		for j := i + 1; j < len(groups); j++ {
			if groups[i].BaseName > groups[j].BaseName {
				groups[i], groups[j] = groups[j], groups[i]
			}
		}
	}
}

// GetGroupLanguages returns sorted list of languages for a group
func (g *TranslationGroup) GetGroupLanguages() []string {
	languages := make([]string, 0, len(g.Files))
	for lang := range g.Files {
		languages = append(languages, lang)
	}

	// Sort with "default" first
	sortLanguages(languages)
	return languages
}

// sortLanguages sorts languages with "default" first, then alphabetically
func sortLanguages(languages []string) {
	for i := 0; i < len(languages)-1; i++ {
		for j := i + 1; j < len(languages); j++ {
			// default always goes first
			if languages[j] == "default" {
				languages[i], languages[j] = languages[j], languages[i]
			} else if languages[i] != "default" && languages[i] > languages[j] {
				languages[i], languages[j] = languages[j], languages[i]
			}
		}
	}
}
