import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownAZ, Plus, Trash2, Save, Globe, Eraser, GripVertical } from 'lucide-react';
import { Select } from './Select';
import { sortUnits, SortMode } from '../utils/sort';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TranslationUnit {
  id: string;
  source: string;
  target: string;
}

interface TranslationTableProps {
  units: TranslationUnit[];
  onSave: (oldId: string, newId: string, source: string, target: string) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  onAddKey: (id: string, source: string) => Promise<void> | void;
  onClearTranslation: (id: string) => Promise<void> | void;
  onReorder: (newOrder: TranslationUnit[]) => Promise<void> | void;
  searchQuery: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  xliffVersion: string;
  onVersionChange: (version: '1.2' | '2.0') => void;
  isSourceOnly: boolean;
}

interface SortableRowProps {
  unit: TranslationUnit;
  isSourceOnly: boolean;
  isModified: boolean;
  modifiedValues: { id: string; source: string; target: string };
  onValueChange: (id: string, field: 'id' | 'source' | 'target', value: string) => void;
  onDelete: (id: string) => void;
  onClearTranslation: (id: string) => void;
}

function SortableRow({
  unit,
  isSourceOnly,
  isModified,
  modifiedValues,
  onValueChange,
  onDelete,
  onClearTranslation,
}: SortableRowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: unit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isModified ? 'var(--color-accent-light)' : 'transparent',
    borderLeft: isModified ? '2px solid var(--color-accent)' : '2px solid transparent',
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="group transition-colors duration-150"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag Handle Cell */}
      <td className="w-8 px-3 py-3 align-top">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab rounded p-1 transition-colors hover:bg-white/5 active:cursor-grabbing"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <GripVertical size={16} />
        </div>
      </td>

      {/* ID Cell */}
      <td className="px-3 py-3 align-top text-sm">
        <input
          type="text"
          value={modifiedValues.id}
          onChange={(e) => onValueChange(unit.id, 'id', e.target.value)}
          className="w-full rounded-lg border px-3 py-2.5 font-mono text-sm transition-all"
          style={{
            color: 'var(--color-text-primary)',
            backgroundColor: isModified ? 'var(--color-accent-light)' : 'var(--color-bg-tertiary)',
            borderColor: isModified ? 'var(--color-accent)' : 'var(--color-border-subtle)',
          }}
        />
      </td>

      {/* Source Cell */}
      <td className="px-3 py-3 align-top text-sm">
        <textarea
          value={modifiedValues.source}
          onChange={(e) => onValueChange(unit.id, 'source', e.target.value)}
          className="min-h-[70px] w-full resize-none rounded-lg border px-3 py-2.5 text-sm leading-relaxed transition-all"
          style={{
            color: 'var(--color-text-primary)',
            backgroundColor: isModified ? 'var(--color-accent-light)' : 'var(--color-bg-tertiary)',
            borderColor: isModified ? 'var(--color-accent)' : 'var(--color-border-subtle)',
          }}
        />
      </td>

      {/* Target Cell */}
      {!isSourceOnly && (
        <td className="px-3 py-3 align-top text-sm">
        <textarea
          value={modifiedValues.target}
          onChange={(e) => onValueChange(unit.id, 'target', e.target.value)}
          placeholder="Enter translation..."
          className="min-h-[70px] w-full resize-none rounded-lg border px-3 py-2.5 text-sm leading-relaxed transition-all"
          style={{
            color: 'var(--color-text-primary)',
            backgroundColor: isModified ? 'var(--color-accent-light)' : 'var(--color-bg-tertiary)',
            borderColor: isModified ? 'var(--color-accent)' : 'var(--color-border-subtle)',
          }}
        />
        </td>
      )}

      {/* Actions Cell */}
      <td className="px-3 py-3 align-top text-sm">
        <div className="flex items-center gap-1.5">
          {!isSourceOnly && !!unit.target && (
            <button
              onClick={() => onClearTranslation(unit.id)}
              className="rounded-lg p-2 transition-colors hover:bg-white/5"
              style={{ color: 'var(--color-text-secondary)' }}
              title="Clear translation"
            >
              <Eraser size={16} />
            </button>
          )}
          <button
            onClick={() => onDelete(unit.id)}
            className="rounded-lg p-2 transition-colors hover:bg-danger/10"
            style={{ color: 'var(--color-danger)' }}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function TranslationTable({
  units,
  onSave,
  onDelete,
  onAddKey,
  onClearTranslation,
  onReorder,
  searchQuery,
  sourceLanguage = 'en',
  targetLanguage = 'de',
  xliffVersion,
  onVersionChange,
  isSourceOnly,
}: TranslationTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [modifiedUnits, setModifiedUnits] = useState<Map<string, TranslationUnit>>(new Map());
  const modifiedUnitsRef = useRef<Map<string, TranslationUnit>>(new Map());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newKeyId, setNewKeyId] = useState('');
  const [newKeySource, setNewKeySource] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('manual');

  const filteredUnits = units.filter((unit) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const targetHaystack = isSourceOnly ? [] : [(unit.target && typeof unit.target === 'string' ? unit.target : '').toLowerCase()];

    return (
      unit.id.toLowerCase().includes(query) ||
      unit.source.toLowerCase().includes(query) ||
      targetHaystack.some((value) => value.includes(query))
    );
  });

  const translationProgress = useMemo(() => {
    if (isSourceOnly || units.length === 0) return 0;
    const translatedCount = units.filter((unit) =>
      unit.target && typeof unit.target === 'string' && unit.target.trim() !== ''
    ).length;

    return Math.round((translatedCount / units.length) * 100);
  }, [units, isSourceOnly]);

  const hasChanges = modifiedUnits.size > 0;

  const handleValueChange = (unitId: string, field: 'id' | 'source' | 'target', value: string) => {
    const originalUnit = units.find((u) => u.id === unitId);

    if (!originalUnit) return;

    const currentModified = modifiedUnitsRef.current.get(unitId) || { ...originalUnit };
    const updated = { ...currentModified, [field]: value };

    if (
      updated.id === originalUnit.id &&
      updated.source === originalUnit.source &&
      updated.target === originalUnit.target
    ) {
      const newMap = modifiedUnitsRef.current;
      newMap.delete(unitId);
      modifiedUnitsRef.current = newMap;
      setModifiedUnits(new Map(newMap));

      return;
    }

    const newMap = modifiedUnitsRef.current;
    newMap.set(unitId, updated);
    modifiedUnitsRef.current = newMap;
    setModifiedUnits(new Map(newMap));
  };

  const handleSaveAll = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      for (const [originalId, modifiedUnit] of modifiedUnitsRef.current.entries()) {
        await onSave(originalId, modifiedUnit.id, modifiedUnit.source, isSourceOnly ? '' : modifiedUnit.target);
      }
      modifiedUnitsRef.current = new Map();
      setModifiedUnits(new Map());
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddKey = async () => {
    if (newKeyId.trim() && newKeySource.trim()) {
      await onAddKey(newKeyId.trim(), newKeySource.trim());
      setNewKeyId('');
      setNewKeySource('');
      setShowAddDialog(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredUnits.findIndex((unit) => unit.id === active.id);
      const newIndex = filteredUnits.findIndex((unit) => unit.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(filteredUnits, oldIndex, newIndex);

        const reorderedFullUnits = [...units];
        const idsInNewOrder = newOrder.map((u) => u.id);

        reorderedFullUnits.sort((a, b) => {
          const aIndex = idsInNewOrder.indexOf(a.id);
          const bIndex = idsInNewOrder.indexOf(b.id);

          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;

          return 0;
        });

        onReorder(reorderedFullUnits);
        setSortMode('manual');
      }
    }
  };

  const handleApplySort = () => {
    if (sortMode === 'manual') return;
    onReorder(sortUnits(units, sortMode));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (hasChanges && (e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveAll();
      }
      if (showAddDialog && e.key === 'Escape') {
        setShowAddDialog(false);
        setNewKeyId('');
        setNewKeySource('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasChanges, showAddDialog]);

  if (units.length === 0) {
    return (
      <div className="bg-primary flex h-full items-center justify-center">
        <div className="text-center">
          <Globe className="mx-auto mb-6" size={80} style={{ color: 'var(--color-text-muted)' }} />
          <h2 className="mb-3 text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            No Translations
          </h2>
          <p className="text-base" style={{ color: 'var(--color-text-tertiary)' }}>
            Open a file or folder to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full flex-col" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                {isSourceOnly
                  ? `${sourceLanguage.toUpperCase()} source`
                  : `${sourceLanguage.toUpperCase()} → ${targetLanguage.toUpperCase()}`}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <span>
                {filteredUnits.length} of {units.length}
              </span>
              {!isSourceOnly && (
                <>
                  <span className="opacity-30">•</span>
                  <span>{translationProgress}% translated</span>
                </>
              )}
              {hasChanges && (
                <>
                  <span className="opacity-30">•</span>
                  <span style={{ color: 'var(--color-accent)' }}>{modifiedUnits.size} unsaved</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={xliffVersion}
              onChange={(value) => onVersionChange(value as '1.2' | '2.0')}
              options={[
                { value: '1.2', label: 'XLIFF 1.2' },
                { value: '2.0', label: 'XLIFF 2.0' },
              ]}
              className="w-32"
            />

            <div
              className="flex items-center gap-2 rounded-lg px-2 py-1"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <label htmlFor="sort-order" className="sr-only">
                Sort order
              </label>
              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <ArrowDownAZ size={14} />
                <span>Sort</span>
              </div>
              <select
                id="sort-order"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="rounded-md border px-2 py-1 text-xs"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  borderColor: 'var(--color-border-subtle)',
                }}
              >
                <option value="manual">Manual</option>
                <option value="key-asc">Key A–Z</option>
                <option value="source-asc">Source A–Z</option>
              </select>
              <button
                onClick={handleApplySort}
                disabled={sortMode === 'manual'}
                className="rounded-md px-2 py-1 text-xs font-medium transition-all disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Apply sort
              </button>
            </div>

            {hasChanges && (
              <button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  if (!isSaving) e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-accent)';
                }}
              >
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : `Save ${modifiedUnits.size}`}</span>
              </button>
            )}

            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5"
              style={{ color: 'var(--color-text-primary)' }}
            >
              <Plus size={16} />
              <span>Add key</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table className="w-full table-fixed" style={{ borderCollapse: 'separate', borderSpacing: '0 4px' }}>
              <thead className="sticky top-0 z-5">
                <tr className="backdrop-blur-sm" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                  <th
                    className="w-8 px-3 py-3 text-left text-xs font-medium"
                    style={{ color: 'var(--color-text-secondary)' }}
                  />
                  <th
                    className="w-[20%] px-3 py-3 text-left text-xs font-medium"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    ID
                  </th>
                  <th
                    className="w-[35%] px-3 py-3 text-left text-xs font-medium"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Source
                  </th>
                  {!isSourceOnly && (
                    <th
                      className="w-[35%] px-3 py-3 text-left text-xs font-medium"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Translation
                    </th>
                  )}
                  <th
                    className="w-[10%] px-3 py-3 text-left text-xs font-medium"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <SortableContext items={filteredUnits.map((u) => u.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {filteredUnits.map((unit) => {
                    const modifiedUnit = modifiedUnits.get(unit.id);
                    const isModified = !!modifiedUnit;
                    const displayValues = modifiedUnit || unit;

                    return (
                      <SortableRow
                        key={unit.id}
                        unit={unit}
                        isSourceOnly={isSourceOnly}
                        isModified={isModified}
                        modifiedValues={displayValues}
                        onValueChange={handleValueChange}
                        onDelete={onDelete}
                        onClearTranslation={onClearTranslation}
                      />
                    );
                  })}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      </div>

      {/* Add Key Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-lg rounded-xl p-6"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <div className="mb-5">
              <h3 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Add translation key
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Key ID
                </label>
                <input
                  type="text"
                  value={newKeyId}
                  onChange={(e) => setNewKeyId(e.target.value)}
                  placeholder="e.g., button.submit"
                  className="w-full rounded-lg border px-3 py-2.5 font-mono text-sm transition-all"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-primary)',
                    borderColor: 'var(--color-border-subtle)',
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Source Text
                </label>
                <textarea
                  value={newKeySource}
                  onChange={(e) => setNewKeySource(e.target.value)}
                  placeholder="Enter source text..."
                  className="min-h-[100px] w-full resize-none rounded-lg border px-3 py-2.5 text-sm transition-all"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-primary)',
                    borderColor: 'var(--color-border-subtle)',
                  }}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAddKey}
                  disabled={!newKeyId.trim() || !newKeySource.trim()}
                  className="flex-1 rounded-lg px-4 py-2.5 font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'white',
                  }}
                  onMouseEnter={(e) => {
                    if (newKeyId.trim() && newKeySource.trim()) {
                      e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-accent)';
                  }}
                >
                  Add key
                </button>
                <button
                  onClick={() => {
                    setShowAddDialog(false);
                    setNewKeyId('');
                    setNewKeySource('');
                  }}
                  className="flex-1 rounded-lg px-4 py-2.5 font-medium transition-colors hover:bg-white/5"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
