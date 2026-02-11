import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { Circle, Trash2, Copy, ClipboardPaste } from 'lucide-react';
import { useEditorStore, selectIsUnitDirty } from '../../stores';
import { ContextMenu, type ContextMenuItem } from '../common/ContextMenu';
import type { TranslationUnit } from '../../types';

interface UnitRowProps {
  unit: TranslationUnit;
  filePath: string;
  isSourceOnly: boolean;
  isFocused: boolean;
  onFocus: () => void;
  onDelete: (unitId: string) => void;
}

export const UnitRow = memo(function UnitRow({ unit, filePath, isSourceOnly, isFocused, onFocus, onDelete }: UnitRowProps) {
  const isDirty = useEditorStore((state) => selectIsUnitDirty(state, filePath, unit.id));
  const trackChange = useEditorStore((state) => state.trackChange);
  const editingUnitId = useEditorStore((state) => state.editingUnitId);
  const editingField = useEditorStore((state) => state.editingField);
  const startEditing = useEditorStore((state) => state.startEditing);
  const stopEditing = useEditorStore((state) => state.stopEditing);

  const isEditing = editingUnitId === unit.id;
  const [localTarget, setLocalTarget] = useState(unit.target);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync local state with unit when it changes externally
  useEffect(() => {
    if (!isEditing) {
      setLocalTarget(unit.target);
    }
  }, [unit.target, isEditing]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && editingField === 'target' && inputRef.current) {
      inputRef.current.focus();
      // Place cursor at end instead of selecting all text
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isEditing, editingField]);

  const handleTargetChange = useCallback((value: string) => {
    setLocalTarget(value);
    trackChange(filePath, {
      unitId: unit.id,
      field: 'target',
      oldValue: unit.target,
      newValue: value,
      timestamp: Date.now(),
    });
  }, [filePath, unit.id, unit.target, trackChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      stopEditing();
    } else if (e.key === 'Escape') {
      setLocalTarget(unit.target);
      stopEditing();
    } else if (e.key === 'Tab') {
      // Tab/Shift+Tab to move to next/previous row
      e.preventDefault();
      stopEditing();
      const direction = e.shiftKey ? 'up' : 'down';
      window.dispatchEvent(new CustomEvent('unit-tab-navigate', { detail: { direction, fromUnitId: unit.id } }));
    }
  }, [unit.target, unit.id, stopEditing]);

  // Single click on target to start editing
  const handleTargetClick = useCallback(() => {
    if (!isSourceOnly && !isEditing) {
      onFocus();
      startEditing(unit.id, 'target');
    }
  }, [isSourceOnly, isEditing, unit.id, startEditing, onFocus]);

  const handleBlur = useCallback(() => {
    stopEditing();
  }, [stopEditing]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onFocus();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, [onFocus]);

  const contextMenuItems: ContextMenuItem[] = [
    {
      label: 'Copy Key',
      icon: <Copy className="h-3.5 w-3.5" />,
      action: () => navigator.clipboard.writeText(unit.id),
    },
    {
      label: 'Copy Source',
      icon: <Copy className="h-3.5 w-3.5" />,
      action: () => navigator.clipboard.writeText(unit.source),
    },
    ...(!isSourceOnly ? [{
      label: 'Paste as Translation',
      icon: <ClipboardPaste className="h-3.5 w-3.5" />,
      action: () => {
        navigator.clipboard.readText().then((text) => {
          handleTargetChange(text);
        });
      },
    }] : []),
    {
      label: 'Delete Unit',
      icon: <Trash2 className="h-3.5 w-3.5" />,
      shortcut: '⌫',
      danger: true,
      action: () => onDelete(unit.id),
    },
  ];

  const isMissing = !unit.target || unit.target.trim() === '';

  return (
    <div
      className={`relative flex h-full border-b border-border-subtle/45 transition-colors ${
        isFocused
          ? 'bg-accent-light/75 shadow-[inset_0_0_0_1px_rgba(47,123,106,0.25)]'
          : 'bg-bg-secondary/20 hover:bg-bg-tertiary/45'
      }`}
      onClick={onFocus}
      onContextMenu={handleContextMenu}
    >
      <div className="w-1/4 min-w-[150px] border-r border-border-subtle/45 bg-bg-tertiary/45 p-3">
        <div className="flex items-start gap-2">
          {isDirty && (
            <Circle className="mt-1 h-2 w-2 shrink-0 fill-warning text-warning" />
          )}
          <code className="break-all text-xs text-text-secondary">{unit.id}</code>
        </div>
      </div>

      <div className={`flex-1 overflow-hidden p-3 ${!isSourceOnly ? 'border-r border-border-subtle/40' : ''}`}>
        <p className="whitespace-pre-wrap text-sm text-text-primary">{unit.source}</p>
      </div>

      {!isSourceOnly && (
        <div className="flex-1 cursor-text overflow-hidden p-3" onClick={handleTargetClick}>
          {isEditing && editingField === 'target' ? (
            <textarea
              ref={inputRef}
              value={localTarget}
              onChange={(e) => handleTargetChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="h-full w-full resize-none rounded-xl border border-accent bg-bg-elevated p-2.5 text-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] focus:outline-hidden focus:ring-1 focus:ring-accent"
              rows={2}
            />
          ) : (
            <p
              className={`whitespace-pre-wrap text-sm ${
                isMissing
                  ? 'italic text-text-muted'
                  : 'text-text-primary'
              }`}
            >
              {isMissing ? 'Click to translate...' : localTarget}
            </p>
          )}
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
});
