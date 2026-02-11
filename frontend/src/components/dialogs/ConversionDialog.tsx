import { useState } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { DialogBase } from './DialogBase';
import { useUIStore, useWorkspaceStore, selectDialogProps } from '../../stores';
import * as xliff from 'xliff-simple';
import { ReadTextFile, WriteFileAtomic } from '../../../wailsjs/go/main/App';
import type { XliffVersion } from '../../types';

export function ConversionDialog() {
  const activeDialog = useUIStore((state) => state.activeDialog);
  const closeDialog = useUIStore((state) => state.closeDialog);
  const addNotification = useUIStore((state) => state.addNotification);
  const settings = useUIStore((state) => state.settings);

  const groups = useWorkspaceStore((state) => state.groups);
  const fileCache = useWorkspaceStore((state) => state.fileCache);
  const cacheFileData = useWorkspaceStore((state) => state.cacheFileData);

  const [targetVersion, setTargetVersion] = useState<XliffVersion>('2.0');
  const [isConverting, setIsConverting] = useState(false);

  const isOpen = activeDialog.type === 'conversion';
  const props = selectDialogProps<{ groupId: string }>(useUIStore.getState());
  const groupId = props?.groupId;

  const group = groupId ? groups.get(groupId) : null;

  // Detect current version from first cached file
  const currentVersion: XliffVersion = (() => {
    if (!group) return '1.2';
    for (const fileMeta of group.files.values()) {
      const cached = fileCache.get(fileMeta.path);

      if (cached) return cached.version;
    }

    return '1.2';
  })();

  const handleClose = () => {
    closeDialog();
  };

  const handleConvert = async () => {
    if (!group) return;

    setIsConverting(true);

    const indent = settings.indentType === 'tabs' ? '\t' : ' '.repeat(settings.indentSize);

    let convertedCount = 0;
    let errorCount = 0;

    try {
      for (const fileMeta of group.files.values()) {
        try {
          // Read current content
          const content = await ReadTextFile(fileMeta.path);
          const parsed = xliff.parse(content);

          // Change version
          parsed.version = targetVersion;

          // Write back
          const newContent = xliff.write(parsed, undefined, {
            format: true,
            indent,
          });

          await WriteFileAtomic(fileMeta.path, newContent);

          // Update cache
          const cached = fileCache.get(fileMeta.path);

          if (cached) {
            cacheFileData(fileMeta.path, {
              ...cached,
              version: targetVersion,
              xliffData: parsed,
            });
          }

          convertedCount++;
        } catch (error) {
          console.error(`Failed to convert ${fileMeta.path}:`, error);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        addNotification({
          type: 'success',
          title: 'Conversion complete',
          message: `Converted ${convertedCount} files to XLIFF ${targetVersion}`,
        });
      } else {
        addNotification({
          type: 'warning',
          title: 'Conversion incomplete',
          message: `Converted ${convertedCount} files, ${errorCount} failed`,
        });
      }

      handleClose();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Conversion failed',
        message: String(error),
      });
    } finally {
      setIsConverting(false);
    }
  };

  const fileCount = group ? group.files.size : 0;

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={handleClose}
      title="Convert XLIFF Version"
      size="sm"
      footer={
        <>
          <button
            onClick={handleClose}
            className="rounded-full px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary"
          >
            Cancel
          </button>
          <button
            onClick={handleConvert}
            disabled={isConverting || currentVersion === targetVersion}
            className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm text-white shadow-(--shadow-sm) transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isConverting ? 'animate-spin' : ''}`} />
            {isConverting ? 'Converting...' : 'Convert'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm">
          Convert all files in <strong>{group?.baseName}</strong> to a different XLIFF version.
        </p>

        {/* Version selector */}
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="rounded-xl border border-border-subtle bg-bg-tertiary/65 px-6 py-4 text-center">
            <span className="text-xs text-text-tertiary">Current</span>
            <p className="text-2xl font-bold text-text-primary">{currentVersion}</p>
          </div>

          <ArrowRight className="h-6 w-6 text-text-tertiary" />

          <div className="space-y-2">
            {(['1.2', '2.0'] as const).map((version) => {
              let buttonClassName = 'block w-full rounded-xl border px-6 py-4 text-center transition-colors ';

              if (targetVersion === version) {
                buttonClassName += 'border-accent/45 bg-accent-light text-accent';
              } else if (version === currentVersion) {
                buttonClassName += 'cursor-not-allowed border-border bg-bg-tertiary/70 opacity-50';
              } else {
                buttonClassName += 'border-border-subtle bg-bg-tertiary/45 hover:bg-bg-tertiary';
              }

              return (
                <button
                  key={version}
                  onClick={() => setTargetVersion(version)}
                  className={buttonClassName}
                  disabled={version === currentVersion}
                >
                  <span className="text-xs text-text-tertiary">Target</span>
                  <p className="text-2xl font-bold">{version}</p>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-text-tertiary">
          This will update {fileCount} file{fileCount === 1 ? '' : 's'}
        </p>
      </div>
    </DialogBase>
  );
}
