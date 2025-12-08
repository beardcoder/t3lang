import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, Globe, Eraser, GripVertical } from "lucide-react";
import { Select } from "./Select";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  onVersionChange: (version: "1.2" | "2.0") => void;
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: unit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`group ${isModified ? 'bg-green-500/10 border-l-4 border-green-500' : 'bg-secondary'}`}
    >
      {/* Drag Handle Cell */}
      <td className="px-2 py-2.5 align-top first:rounded-l-lg w-8">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-white/10 text-secondary opacity-60"
        >
          <GripVertical size={16} />
        </div>
      </td>

      {/* ID Cell */}
      <td className="px-3 py-2.5 text-sm align-top">
        <input
          type="text"
          value={modifiedValues.id}
          onChange={(e) => onValueChange(unit.id, 'id', e.target.value)}
          className={`w-full px-3 py-2 rounded-md text-sm font-mono bg-secondary text-secondary border-2 ${
            isModified ? 'border-accent' : 'border-transparent'
          }`}
        />
      </td>

      {/* Source Cell */}
      <td className="px-3 py-2.5 text-sm align-top">
        <textarea
          value={modifiedValues.source}
          onChange={(e) => onValueChange(unit.id, 'source', e.target.value)}
          className={`w-full px-3 py-2 rounded-md resize-none bg-secondary text-primary border-2 ${
            isModified ? 'border-accent' : 'border-transparent'
          } min-h-[60px]`}
        />
      </td>

      {/* Target Cell */}
      {!isSourceOnly && (
        <td className="px-3 py-2.5 text-sm align-top">
          <textarea
            value={modifiedValues.target}
            onChange={(e) => onValueChange(unit.id, 'target', e.target.value)}
            placeholder="Enter translation..."
            className={`w-full px-3 py-2 rounded-md resize-none bg-secondary text-primary border-2 ${
              isModified ? 'border-accent' : 'border-transparent'
            } min-h-[60px]`}
          />
        </td>
      )}

      {/* Actions Cell */}
      <td className="px-3 py-2.5 text-sm align-top last:rounded-r-lg">
        <div className="flex gap-2 items-center">
          {!isSourceOnly && !!unit.target && (
            <button
              onClick={() => onClearTranslation(unit.id)}
              className="p-2 rounded-full hover:scale-110 bg-hover text-primary"
              title="Clear translation"
            >
              <Eraser size={16} />
            </button>
          )}
          <button
            onClick={() => onDelete(unit.id)}
            className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:scale-110 bg-danger text-white"
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
  sourceLanguage = "en",
  targetLanguage = "de",
  xliffVersion,
  onVersionChange,
  isSourceOnly,
}: TranslationTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [modifiedUnits, setModifiedUnits] = useState<Map<string, TranslationUnit>>(new Map());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newKeyId, setNewKeyId] = useState("");
  const [newKeySource, setNewKeySource] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filteredUnits = units.filter((unit) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const targetHaystack = isSourceOnly ? [] : [unit.target.toLowerCase()];
    return (
      unit.id.toLowerCase().includes(query) ||
      unit.source.toLowerCase().includes(query) ||
      targetHaystack.some((value) => value.includes(query))
    );
  });

  const translationProgress = useMemo(() => {
    if (isSourceOnly || units.length === 0) return 0;
    const translatedCount = units.filter(
      (unit) => unit.target && unit.target.trim() !== ""
    ).length;
    return Math.round((translatedCount / units.length) * 100);
  }, [units, isSourceOnly]);

  const hasChanges = modifiedUnits.size > 0;

  const handleValueChange = (unitId: string, field: 'id' | 'source' | 'target', value: string) => {
    const originalUnit = units.find((u) => u.id === unitId);
    if (!originalUnit) return;

    const currentModified = modifiedUnits.get(unitId) || { ...originalUnit };
    const updated = { ...currentModified, [field]: value };

    if (
      updated.id === originalUnit.id &&
      updated.source === originalUnit.source &&
      updated.target === originalUnit.target
    ) {
      const newMap = new Map(modifiedUnits);
      newMap.delete(unitId);
      setModifiedUnits(newMap);
    } else {
      const newMap = new Map(modifiedUnits);
      newMap.set(unitId, updated);
      setModifiedUnits(newMap);
    }
  };

  const handleSaveAll = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      for (const [originalId, modifiedUnit] of modifiedUnits.entries()) {
        await onSave(
          originalId,
          modifiedUnit.id,
          modifiedUnit.source,
          isSourceOnly ? "" : modifiedUnit.target
        );
      }
      setModifiedUnits(new Map());
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddKey = async () => {
    if (newKeyId.trim() && newKeySource.trim()) {
      await onAddKey(newKeyId.trim(), newKeySource.trim());
      setNewKeyId("");
      setNewKeySource("");
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
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (hasChanges && (e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSaveAll();
      }
      if (showAddDialog && e.key === "Escape") {
        setShowAddDialog(false);
        setNewKeyId("");
        setNewKeySource("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasChanges, showAddDialog]);

  if (units.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-primary">
        <div className="text-center">
          <Globe className="mx-auto mb-6 text-secondary opacity-20" size={80} />
          <h2 className="text-2xl font-semibold mb-3 text-primary">
            No Translations
          </h2>
          <p className="text-base text-secondary">
            Open a file or folder to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full bg-primary">
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between bg-secondary border-b border-border">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-primary">
                Translations
              </h2>
              <div className="text-xs mt-0.5 flex items-center gap-2 text-secondary">
                <span>
                  {sourceLanguage.toUpperCase()} → {targetLanguage.toUpperCase()}
                </span>
                <span>•</span>
                <span>
                  {filteredUnits.length} of {units.length}
                </span>
                {!isSourceOnly && (
                  <>
                    <span>•</span>
                    <span className={`font-semibold ${translationProgress === 100 ? 'text-accent' : 'text-secondary'}`}>
                      {translationProgress}% translated
                    </span>
                  </>
                )}
                {hasChanges && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-accent">
                      {modifiedUnits.size} unsaved
                    </span>
                  </>
                )}
              </div>
            </div>
            {!isSourceOnly && (
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 rounded-full overflow-hidden bg-hover">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      translationProgress === 100 ? 'bg-accent' : 'bg-accent/70'
                    }`}
                    style={{ width: `${translationProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={xliffVersion}
              onChange={(value) => onVersionChange(value as "1.2" | "2.0")}
              options={[
                { value: "1.2", label: "XLIFF v1.2" },
                { value: "2.0", label: "XLIFF v2.0" },
              ]}
              className="w-32"
            />

            {hasChanges && (
              <button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 bg-accent text-secondary shadow-lg hover:shadow-xl transition-all"
              >
                <Save size={16} />
                <span>{isSaving ? "Saving..." : `Save ${modifiedUnits.size} Changes`}</span>
              </button>
            )}

            <button
              onClick={() => setShowAddDialog(true)}
              className="px-3 py-2 rounded-full font-semibold text-sm flex items-center gap-2 bg-accent text-secondary shadow-lg hover:shadow-xl transition-all"
            >
              <Plus size={16} />
              <span>Add Key</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-4 py-1 bg-primary">
          <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: "0 3px" }}>
            <thead className="sticky top-0 bg-primary z-[5]">
              <tr>
                <th className="text-left px-2 py-2 font-semibold text-[10px] uppercase tracking-wider text-secondary w-8 bg-primary" />
                <th className="text-left px-3 py-2 font-semibold text-[10px] uppercase tracking-wider text-secondary w-[20%] bg-primary">
                  ID
                </th>
                <th className="text-left px-3 py-2 font-semibold text-[10px] uppercase tracking-wider text-secondary w-[35%] bg-primary">
                  Source ({sourceLanguage.toUpperCase()})
                </th>
                {!isSourceOnly && (
                  <th className="text-left px-3 py-2 font-semibold text-[10px] uppercase tracking-wider text-secondary w-[35%] bg-primary">
                    Translation ({targetLanguage.toUpperCase()})
                  </th>
                )}
                <th className="text-left px-3 py-2 font-semibold text-[10px] uppercase tracking-wider text-secondary w-[10%] bg-primary">
                  Actions
                </th>
              </tr>
            </thead>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredUnits.map((u) => u.id)}
                strategy={verticalListSortingStrategy}
              >
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
            </DndContext>
          </table>
        </div>
      </div>

      {/* Add Key Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg p-8 rounded-2xl shadow-2xl bg-primary border border-border">
            <h3 className="text-2xl font-semibold mb-6 text-primary">
              Add Translation Key
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-secondary">
                  Key ID
                </label>
                <input
                  type="text"
                  value={newKeyId}
                  onChange={(e) => setNewKeyId(e.target.value)}
                  placeholder="e.g., button.submit"
                  className="w-full px-4 py-3 rounded-lg font-mono bg-secondary text-primary border-2 border-border"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-secondary">
                  Source Text ({sourceLanguage.toUpperCase()})
                </label>
                <textarea
                  value={newKeySource}
                  onChange={(e) => setNewKeySource(e.target.value)}
                  placeholder="Enter source text..."
                  className="w-full px-4 py-3 rounded-lg resize-none bg-secondary text-primary border-2 border-border min-h-[100px]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddKey}
                  disabled={!newKeyId.trim() || !newKeySource.trim()}
                  className="flex-1 px-4 py-3 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform bg-accent text-white"
                >
                  Add Key
                </button>
                <button
                  onClick={() => {
                    setShowAddDialog(false);
                    setNewKeyId("");
                    setNewKeySource("");
                  }}
                  className="flex-1 px-4 py-3 rounded-full font-semibold hover:scale-105 transition-transform bg-hover text-primary"
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
