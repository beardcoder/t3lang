import { useState } from 'react';
import { Search, Globe } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { TranslationTable } from './components/TranslationTable';
import { T3File, T3FileGroup } from './components/FileTree';
import * as xliff from 'xliff-simple';

interface TranslationUnit {
  id: string;
  source: string;
  target: string;
}

interface FileData {
  path: string;
  xliffData: any;
  units: TranslationUnit[];
  sourceLanguage: string;
  targetLanguage: string;
  version: '1.2' | '2.0';
}

function parseT3FileName(fileName: string): { baseName: string; language: string } {
  const langMatch = fileName.match(/^([a-z]{2})\.(.+)\.xlf$/);
  if (langMatch) {
    return {
      language: langMatch[1],
      baseName: langMatch[2]
    };
  }

  const baseMatch = fileName.match(/^(.+)\.xlf$/);
  if (baseMatch) {
    return {
      language: 'default',
      baseName: baseMatch[1]
    };
  }

  return {
    language: 'default',
    baseName: fileName
  };
}

function AppContent() {
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [fileDataMap, setFileDataMap] = useState<Map<string, FileData>>(new Map());
  const [fileGroups, setFileGroups] = useState<T3FileGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [showNewLanguageDialog, setShowNewLanguageDialog] = useState(false);
  const [newLanguageCode, setNewLanguageCode] = useState('');

  const loadFile = async (filePath: string): Promise<FileData | null> => {
    try {
      // @ts-ignore - Tauri fs API
      const { readTextFile } = await import('@tauri-apps/plugin-fs');
      const content = await readTextFile(filePath);

      const parsed = xliff.parse(content);
      const extractedUnits: TranslationUnit[] = [];
      let sourceLanguage = 'en';
      let targetLanguage = 'de';
      let version: '1.2' | '2.0' = parsed.version || '1.2';

      parsed.files.forEach((file: any) => {
        if (file.sourceLanguage) sourceLanguage = file.sourceLanguage;
        if (file.targetLanguage) targetLanguage = file.targetLanguage;

        file.units.forEach((unit: any) => {
          extractedUnits.push({
            id: unit.id,
            source: unit.source,
            target: unit.target || ''
          });
        });
      });

      return {
        path: filePath,
        xliffData: parsed,
        units: extractedUnits,
        sourceLanguage,
        targetLanguage,
        version
      };
    } catch (error) {
      console.error('Failed to load file:', error);
      alert(`Failed to load file: ${error}`);
      return null;
    }
  };

  const handleFileOpen = async (filePath: string) => {
    const fileData = await loadFile(filePath);
    if (fileData) {
      const newMap = new Map(fileDataMap);
      newMap.set(filePath, fileData);
      setFileDataMap(newMap);
      setCurrentFile(filePath);
    }
  };

  const handleFolderOpen = async (folderPath: string) => {
    try {
      // @ts-ignore - Tauri fs API
      const { readDir } = await import('@tauri-apps/plugin-fs');
      const entries = await readDir(folderPath);

      const xliffFiles = entries.filter((entry: any) =>
        entry.name?.endsWith('.xlf')
      );

      const newMap = new Map<string, FileData>();
      const t3Files: T3File[] = [];

      for (const entry of xliffFiles) {
        if (!entry.name) continue;

        const filePath = `${folderPath}/${entry.name}`;
        const fileData = await loadFile(filePath);

        if (fileData) {
          newMap.set(filePath, fileData);

          const { baseName, language } = parseT3FileName(entry.name);
          t3Files.push({
            name: entry.name,
            path: filePath,
            language,
            baseName
          });
        }
      }

      const groups = new Map<string, T3File[]>();
      t3Files.forEach(file => {
        if (!groups.has(file.baseName)) {
          groups.set(file.baseName, []);
        }
        groups.get(file.baseName)!.push(file);
      });

      const groupArray: T3FileGroup[] = Array.from(groups.entries())
        .map(([baseName, files]) => ({
          baseName,
          files: files.sort((a, b) => {
            if (a.language === 'default') return -1;
            if (b.language === 'default') return 1;
            return a.language.localeCompare(b.language);
          })
        }))
        .sort((a, b) => a.baseName.localeCompare(b.baseName));

      setFileDataMap(newMap);
      setFileGroups(groupArray);
      setFolderPath(folderPath);

      if (t3Files.length > 0) {
        setCurrentFile(t3Files[0].path);
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
      alert(`Failed to open folder: ${error}`);
    }
  };

  const saveFile = async (filePath: string, xliffData: any) => {
    try {
      const xliffContent = xliff.write(xliffData);
      // @ts-ignore - Tauri fs API
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      await writeTextFile(filePath, xliffContent);
    } catch (error) {
      console.error('Failed to save file:', error);
      alert(`Failed to save: ${error}`);
    }
  };

  const handleSave = async (oldId: string, newId: string, source: string, target: string) => {
    if (!currentFile) return;
    const fileData = fileDataMap.get(currentFile);
    if (!fileData) return;

    const updatedData = JSON.parse(JSON.stringify(fileData.xliffData));
    let found = false;
    for (const file of updatedData.files) {
      for (const unit of file.units) {
        if (unit.id === oldId) {
          unit.id = newId;
          unit.source = source;
          unit.target = target;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    await saveFile(currentFile, updatedData);

    const updatedUnits = fileData.units.map(unit =>
      unit.id === oldId ? { id: newId, source, target } : unit
    );

    const newMap = new Map(fileDataMap);
    newMap.set(currentFile, {
      ...fileData,
      xliffData: updatedData,
      units: updatedUnits
    });
    setFileDataMap(newMap);
  };

  const handleDelete = async (id: string) => {
    if (!currentFile) return;
    if (!confirm(`Delete translation key "${id}"?`)) return;

    const fileData = fileDataMap.get(currentFile);
    if (!fileData) return;

    const updatedData = JSON.parse(JSON.stringify(fileData.xliffData));
    for (const file of updatedData.files) {
      file.units = file.units.filter((unit: any) => unit.id !== id);
    }

    await saveFile(currentFile, updatedData);

    const updatedUnits = fileData.units.filter(unit => unit.id !== id);

    const newMap = new Map(fileDataMap);
    newMap.set(currentFile, {
      ...fileData,
      xliffData: updatedData,
      units: updatedUnits
    });
    setFileDataMap(newMap);
  };

  const handleAddKey = async (id: string, source: string) => {
    if (!currentFile) return;

    const fileData = fileDataMap.get(currentFile);
    if (!fileData) return;

    if (fileData.units.some(u => u.id === id)) {
      alert(`Translation key "${id}" already exists!`);
      return;
    }

    const updatedData = JSON.parse(JSON.stringify(fileData.xliffData));
    if (updatedData.files.length > 0) {
      updatedData.files[0].units.push({
        id,
        source,
        target: ''
      });
    }

    await saveFile(currentFile, updatedData);

    const updatedUnits = [...fileData.units, { id, source, target: '' }];

    const newMap = new Map(fileDataMap);
    newMap.set(currentFile, {
      ...fileData,
      xliffData: updatedData,
      units: updatedUnits
    });
    setFileDataMap(newMap);
  };

  const handleVersionChange = async (version: '1.2' | '2.0') => {
    if (!currentFile) return;

    const fileData = fileDataMap.get(currentFile);
    if (!fileData) return;

    const updatedData = JSON.parse(JSON.stringify(fileData.xliffData));
    updatedData.version = version;

    await saveFile(currentFile, updatedData);

    const newMap = new Map(fileDataMap);
    newMap.set(currentFile, {
      ...fileData,
      xliffData: updatedData,
      version
    });
    setFileDataMap(newMap);
  };

  const handleNewLanguage = async () => {
    if (!folderPath || fileGroups.length === 0) return;

    const languageCode = newLanguageCode.trim().toLowerCase();
    if (!languageCode || languageCode.length !== 2) {
      alert('Please enter a valid 2-letter language code');
      return;
    }

    const baseName = fileGroups[0].baseName;
    const defaultFile = fileGroups[0].files.find(f => f.language === 'default');
    if (!defaultFile) {
      alert('No default file found');
      return;
    }

    const defaultData = fileDataMap.get(defaultFile.path);
    if (!defaultData) return;

    const newFileName = `${languageCode}.${baseName}.xlf`;
    const newFilePath = `${folderPath}/${newFileName}`;

    try {
      // @ts-ignore - Tauri fs API
      const { exists } = await import('@tauri-apps/plugin-fs');
      if (await exists(newFilePath)) {
        alert(`File ${newFileName} already exists!`);
        return;
      }

      const newXliffData = JSON.parse(JSON.stringify(defaultData.xliffData));
      if (newXliffData.files.length > 0) {
        newXliffData.files[0].targetLanguage = languageCode;
        newXliffData.files[0].units.forEach((unit: any) => {
          unit.target = '';
        });
      }

      await saveFile(newFilePath, newXliffData);

      await handleFolderOpen(folderPath);
      setCurrentFile(newFilePath);
      setShowNewLanguageDialog(false);
      setNewLanguageCode('');
    } catch (error) {
      console.error('Failed to create language file:', error);
      alert(`Failed to create language file: ${error}`);
    }
  };

  const currentFileData = currentFile ? fileDataMap.get(currentFile) : null;

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Draggable Title Bar Region */}
      <div
        data-tauri-drag-region
        className="h-8 flex-shrink-0"
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderBottom: '1px solid var(--color-border)'
        }}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          onFileOpen={handleFileOpen}
          onFolderOpen={handleFolderOpen}
          onNewLanguage={() => setShowNewLanguageDialog(true)}
          currentFile={currentFile}
          fileGroups={fileGroups}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {currentFileData && (
            <div className="px-6 py-4" style={{
              backgroundColor: 'var(--color-bg-primary)',
              borderBottom: '1px solid var(--color-border)'
            }}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: 'var(--color-text-secondary)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search translations..."
                className="w-full pl-12 pr-4 py-3 rounded-full text-sm"
                style={{
                  backgroundColor: 'var(--color-bg-hover)',
                  color: 'var(--color-text-primary)',
                  border: '2px solid transparent'
                }}
              />
            </div>
          </div>
        )}

          <div className="flex-1 overflow-hidden">
            {currentFileData ? (
              <TranslationTable
                units={currentFileData.units}
                onSave={handleSave}
                onDelete={handleDelete}
                onAddKey={handleAddKey}
                searchQuery={searchQuery}
                sourceLanguage={currentFileData.sourceLanguage}
                targetLanguage={currentFileData.targetLanguage}
                xliffVersion={currentFileData.version}
                onVersionChange={handleVersionChange}
              />
            ) : (
              <div className="h-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                <div className="text-center">
                  <Globe className="mx-auto mb-6" size={80} style={{ color: 'var(--color-text-secondary)', opacity: 0.2 }} />
                  <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                    T3Lang
                  </h2>
                  <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
                    Open a folder or file to get started
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Language Dialog */}
      {showNewLanguageDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl" style={{
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)'
          }}>
            <h3 className="text-2xl font-semibold mb-6" style={{ color: 'var(--color-text-primary)' }}>
              Add New Language
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Language Code (2 letters)
                </label>
                <input
                  type="text"
                  value={newLanguageCode}
                  onChange={(e) => setNewLanguageCode(e.target.value)}
                  placeholder="e.g., de, fr, es"
                  maxLength={2}
                  className="w-full px-4 py-3 rounded-lg font-mono uppercase"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                    border: '2px solid var(--color-border)'
                  }}
                  autoFocus
                />
                <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Common codes: de (German), fr (French), es (Spanish), it (Italian), nl (Dutch)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleNewLanguage}
                  disabled={newLanguageCode.trim().length !== 2}
                  className="flex-1 px-4 py-3 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'white'
                  }}
                >
                  Create Language File
                </button>
                <button
                  onClick={() => {
                    setShowNewLanguageDialog(false);
                    setNewLanguageCode('');
                  }}
                  className="flex-1 px-4 py-3 rounded-full font-semibold hover:scale-105"
                  style={{
                    backgroundColor: 'var(--color-bg-hover)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
