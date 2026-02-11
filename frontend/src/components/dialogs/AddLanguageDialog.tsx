import { useState } from 'react';
import { Globe, Plus } from 'lucide-react';
import { DialogBase } from './DialogBase';
import { useUIStore, useWorkspaceStore, selectDialogProps } from '../../stores';
import { CreateLanguageFile } from '../../../wailsjs/go/main/App';

// Common language codes
const COMMON_LANGUAGES = [
  { code: 'de', name: 'German' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
];

export function AddLanguageDialog() {
  const activeDialog = useUIStore((state) => state.activeDialog);
  const closeDialog = useUIStore((state) => state.closeDialog);
  const addNotification = useUIStore((state) => state.addNotification);

  const groups = useWorkspaceStore((state) => state.groups);
  const addFileToGroup = useWorkspaceStore((state) => state.addFileToGroup);

  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [customLanguage, setCustomLanguage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOpen = activeDialog.type === 'add-language';
  const props = selectDialogProps<{ groupId: string }>(useUIStore.getState());
  const groupId = props?.groupId;

  const group = groupId ? groups.get(groupId) : null;
  const existingLanguages = group ? new Set(group.files.keys()) : new Set<string>();

  // Filter out already existing languages
  const availableLanguages = COMMON_LANGUAGES.filter((lang) => !existingLanguages.has(lang.code));

  const handleClose = () => {
    setSelectedLanguage('');
    setCustomLanguage('');
    closeDialog();
  };

  const handleSubmit = async () => {
    if (!group) return;

    const langCode = selectedLanguage === 'custom' ? customLanguage.toLowerCase().trim() : selectedLanguage;

    if (!langCode || langCode?.length !== 2) {
      addNotification({
        type: 'error',
        title: 'Invalid language code',
        message: 'Please enter a valid 2-letter language code',
      });

      return;
    }

    if (existingLanguages.has(langCode)) {
      addNotification({
        type: 'error',
        title: 'Language exists',
        message: `${langCode.toUpperCase()} already exists in this group`,
      });

      return;
    }

    setIsSubmitting(true);

    try {
      // Find the source file (default language)
      const sourceFile = group.sourceFile || group.files.values().next().value;

      if (!sourceFile) {
        throw new Error('No source file found');
      }

      // Generate new file path
      const directory = sourceFile.directory;
      const baseName = sourceFile.baseName;
      const newFileName = `${langCode}.${baseName}.xlf`;
      const newPath = `${directory}/${newFileName}`;

      // Create the file using Go backend
      await CreateLanguageFile(sourceFile.path, newPath, langCode);

      // Add to workspace store
      addFileToGroup(groupId!, langCode, {
        path: newPath,
        name: newFileName,
        language: langCode,
        baseName: baseName,
        directory: directory,
      });

      addNotification({
        type: 'success',
        title: 'Language added',
        message: `Created ${langCode.toUpperCase()} translation file`,
      });

      handleClose();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to create file',
        message: String(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Language"
      size="md"
      footer={
        <>
          <button
            onClick={handleClose}
            className="rounded-full px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedLanguage || (selectedLanguage === 'custom' && !customLanguage) || isSubmitting}
            className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm text-white shadow-(--shadow-sm) transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {isSubmitting ? 'Creating...' : 'Add Language'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm">
          Add a new language to <strong>{group?.baseName}</strong>. A new translation file will be created.
        </p>

        {/* Language grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {availableLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLanguage(lang.code)}
              className={`flex items-center gap-2 rounded-xl border p-2 text-left text-sm transition-colors ${
                selectedLanguage === lang.code
                  ? 'border-accent/45 bg-accent-light text-accent'
                  : 'border-border-subtle bg-bg-tertiary/55 hover:bg-bg-tertiary'
              }`}
            >
              <Globe className="h-4 w-4" />
              <div>
                <span className="font-medium">{lang.code.toUpperCase()}</span>
                <span className="ml-1 text-xs text-text-tertiary">{lang.name}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Custom language option */}
        <div className="border-t border-border pt-4">
          <button
            onClick={() => setSelectedLanguage('custom')}
            className={`flex w-full items-center gap-2 rounded-xl border p-3 text-left text-sm transition-colors ${
              selectedLanguage === 'custom'
                ? 'border-accent/45 bg-accent-light text-accent'
                : 'border-border-subtle bg-bg-tertiary/55 hover:bg-bg-tertiary'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Custom language code</span>
          </button>

          {selectedLanguage === 'custom' && (
            <input
              type="text"
              value={customLanguage}
              onChange={(e) => setCustomLanguage(e.target.value)}
              placeholder="e.g., sv, da, fi"
              maxLength={2}
              className="mt-2 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-accent focus:outline-hidden focus:ring-1 focus:ring-accent"
              autoFocus
            />
          )}
        </div>
      </div>
    </DialogBase>
  );
}
