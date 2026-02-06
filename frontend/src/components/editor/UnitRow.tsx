import { useState, useCallback, useEffect, useRef } from 'react';
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

export function UnitRow({ unit, filePath, isSourceOnly, isFocused, onFocus, onDelete }: UnitRowProps) {
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
      inputRef.current.select();
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
    }
  }, [unit.target, stopEditing]);

  const handleDoubleClick = useCallback(() => {
    if (!isSourceOnly) {
      startEditing(unit.id, 'target');
    }
  }, [isSourceOnly, unit.id, startEditing]);

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
      className={`flex h-full border-b border-border-subtle transition-colors ${
        isFocused ? 'bg-accent-light' : 'hover:bg-bg-tertiary'
      }`}
      onClick={onFocus}
      onContextMenu={handleContextMenu}
    >
      {/* Key column */}
      <div className="w-1/4 min-w-[150px] p-3">
        <div className="flex items-start gap-2">
          {isDirty && (
            <Circle className="mt-1 h-2 w-2 flex-shrink-0 fill-amber-500 text-amber-500" />
          )}
          <code className="break-all text-xs text-text-secondary">{unit.id}</code>
        </div>
      </div>

      {/* Source column */}
      <div className="flex-1 overflow-hidden p-3">
        <p className="whitespace-pre-wrap text-sm text-text-primary">{unit.source}</p>
      </div>

      {/* Target column */}
      {!isSourceOnly && (
        <div className="flex-1 overflow-hidden p-3" onDoubleClick={handleDoubleClick}>
          {isEditing && editingField === 'target' ? (
            <textarea
              ref={inputRef}
              value={localTarget}
              onChange={(e) => handleTargetChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="h-full w-full resize-none rounded border border-accent bg-bg-primary p-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              rows={2}
            />
          ) : (
            <p
              className={`cursor-text whitespace-pre-wrap text-sm ${
                isMissing
                  ? 'italic text-text-muted'
                  : 'text-text-primary'
              }`}
            >
              {isMissing ? 'Click to add translation...' : localTarget}
            </p>
          )}
        </div>
      )}

      {/* Context menu (rendered via portal) */}
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
}
