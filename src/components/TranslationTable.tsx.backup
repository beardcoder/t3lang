import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Check,
  X,
  Globe,
  Eraser,
  Loader2,
  GripVertical,
} from "lucide-react";
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
  onSave: (
    oldId: string,
    newId: string,
    source: string,
    target: string
  ) => Promise<void> | void;
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
  isEditing: boolean;
  isSaving: boolean;
  isJustSaved: boolean;
  isSourceOnly: boolean;
  editValues: { id: string; source: string; target: string };
  isDirty: boolean;
  onEdit: (unit: TranslationUnit) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onClearTranslation: (id: string) => void;
  setEditValues: (values: {
    id: string;
    source: string;
    target: string;
  }) => void;
}

function SortableRow({
  unit,
  isEditing,
  isSaving,
  isJustSaved,
  isSourceOnly,
  editValues,
  isDirty,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onClearTranslation,
  setEditValues,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: unit.id, disabled: isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="group"
      onMouseEnter={(e) => {
        if (!isEditing && !isJustSaved) {
          e.currentTarget.style.backgroundColor = "var(--color-bg-hover)";
        }
      }}
      onMouseLeave={(e) => {
        if (isJustSaved) {
          e.currentTarget.style.backgroundColor = "rgba(34,197,94,0.12)";
        } else if (!isEditing) {
          e.currentTarget.style.backgroundColor = "var(--color-bg-secondary)";
        }
      }}
    >
      {/* Drag Handle Cell */}
      <td className="px-2 py-2.5 align-top first:rounded-l-lg w-6 max-w-6">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded"
          style={{
            color: "var(--color-text-secondary)",
            opacity: isEditing ? 0.3 : 0.6,
          }}
        >
          <GripVertical size={16} />
        </div>
      </td>

      {/* ID Cell */}
      <td className="px-3 py-2.5 text-xs align-top">
        {isEditing ? (
          <input
            type="text"
            value={editValues.id}
            onChange={(e) =>
              setEditValues({ ...editValues, id: e.target.value })
            }
            className="w-full px-3 py-2 rounded-md text-xs font-mono"
            style={{
              backgroundColor: "var(--color-bg-primary)",
              color: "var(--color-text-primary)",
              border: "2px solid var(--color-accent)",
            }}
          />
        ) : (
          <div
            onClick={() => onEdit(unit)}
            className="cursor-pointer px-3 py-2 rounded-md font-mono"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {unit.id}
          </div>
        )}
      </td>

      {/* Source Cell */}
      <td className="px-3 py-2.5 text-xs align-top">
        {isEditing ? (
          <textarea
            value={editValues.source}
            onChange={(e) =>
              setEditValues({ ...editValues, source: e.target.value })
            }
            className="w-full px-3 py-2 rounded-md resize-none"
            style={{
              backgroundColor: "var(--color-bg-primary)",
              color: "var(--color-text-primary)",
              border: "2px solid var(--color-accent)",
              minHeight: "80px",
            }}
          />
        ) : (
          <div
            onClick={() => onEdit(unit)}
            className="cursor-pointer px-3 py-2 rounded-md"
            style={{ color: "var(--color-text-primary)" }}
          >
            {unit.source}
          </div>
        )}
      </td>

      {/* Target Cell */}
      {!isSourceOnly && (
        <td className="px-3 py-2.5 text-xs align-top">
          {isEditing ? (
            <textarea
              value={editValues.target}
              onChange={(e) =>
                setEditValues({ ...editValues, target: e.target.value })
              }
              className="w-full px-3 py-2 rounded-md resize-none"
              style={{
                backgroundColor: "var(--color-bg-primary)",
                color: "var(--color-text-primary)",
                border: "2px solid var(--color-accent)",
                minHeight: "80px",
              }}
              autoFocus
            />
          ) : (
            <div
              onClick={() => onEdit(unit)}
              className="cursor-pointer px-3 py-2 rounded-md"
              style={{
                color: unit.target
                  ? "var(--color-text-primary)"
                  : "var(--color-text-secondary)",
                fontStyle: unit.target ? "normal" : "italic",
              }}
            >
              {unit.target || "Click to add..."}
            </div>
          )}
        </td>
      )}

      {/* Actions Cell */}
      <td className="px-3 py-2.5 text-xs align-top last:rounded-r-lg w-full">
        {isEditing ? (
          <div className="flex gap-2 items-center">
            <button
              onClick={onSave}
              disabled={isSaving || !isDirty}
              className="p-2 rounded-full hover:scale-110 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--color-accent)", color: "white" }}
              title="Save (Cmd/Ctrl+S or Cmd/Ctrl+Enter)"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Check size={18} />
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="p-2 rounded-full hover:scale-110 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--color-bg-hover)",
                color: "var(--color-text-primary)",
              }}
              title="Cancel (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            {!isSourceOnly && !!unit.target && (
              <button
                onClick={() => onClearTranslation(unit.id)}
                className="p-2 rounded-full hover:scale-110"
                style={{
                  backgroundColor: "var(--color-bg-hover)",
                  color: "var(--color-text-primary)",
                }}
                title="Clear translation"
              >
                <Eraser size={16} />
              </button>
            )}
            <button
              onClick={() => onDelete(unit.id)}
              className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:scale-110"
              style={{
                backgroundColor: "var(--color-danger)",
                color: "white",
              }}
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    id: "",
    source: "",
    target: "",
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newKeyId, setNewKeyId] = useState("");
  const [newKeySource, setNewKeySource] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [recentlySavedId, setRecentlySavedId] = useState<string | null>(null);

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

  const handleEdit = (unit: TranslationUnit) => {
    setEditingId(unit.id);
    setEditValues({ id: unit.id, source: unit.source, target: unit.target });
  };

  const handleSave = async () => {
    if (editingId) {
      setSavingId(editingId);
      await onSave(
        editingId,
        editValues.id,
        editValues.source,
        editValues.target
      );
      setEditingId(null);
      setSavingId(null);
      setRecentlySavedId(editValues.id);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({ id: "", source: "", target: "" });
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

        // Map back to full units array while preserving search filter
        const reorderedFullUnits = [...units];
        const idsInNewOrder = newOrder.map((u) => u.id);

        // Sort the full units array based on the new order
        reorderedFullUnits.sort((a, b) => {
          const aIndex = idsInNewOrder.indexOf(a.id);
          const bIndex = idsInNewOrder.indexOf(b.id);

          // If both are in the filtered list, sort by their new position
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }
          // If only one is in the filtered list, it comes first
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
          // If neither is in the filtered list, maintain original order
          return 0;
        });

        onReorder(reorderedFullUnits);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingId && e.key === "Escape") {
        handleCancel();
      }
      if (editingId && (e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if (editingId && (e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
      if (showAddDialog && e.key === "Escape") {
        setShowAddDialog(false);
        setNewKeyId("");
        setNewKeySource("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingId, editValues, showAddDialog]);

  useEffect(() => {
    if (!recentlySavedId) return;
    const timer = setTimeout(() => setRecentlySavedId(null), 1200);
    return () => clearTimeout(timer);
  }, [recentlySavedId]);

  const editingUnit = useMemo(
    () => units.find((u) => u.id === editingId),
    [editingId, units]
  );
  const isDirty = editingUnit
    ? editingUnit.id !== editValues.id ||
      editingUnit.source !== editValues.source ||
      (!isSourceOnly && editingUnit.target !== editValues.target)
    : false;

  if (units.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ backgroundColor: "var(--color-bg-primary)" }}
      >
        <div className="text-center">
          <Globe
            className="mx-auto mb-6"
            size={80}
            style={{ color: "var(--color-text-secondary)", opacity: 0.2 }}
          />
          <h2
            className="text-2xl font-semibold mb-3"
            style={{ color: "var(--color-text-primary)" }}
          >
            No Translations
          </h2>
          <p
            className="text-base"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Open a file or folder to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="flex flex-col h-full"
        style={{ backgroundColor: "var(--color-bg-primary)" }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div className="flex items-center gap-4">
            <div>
              <h2
                className="text-xl font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Translations
              </h2>
              <div
                className="text-xs mt-0.5 flex items-center gap-2"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <span>
                  {sourceLanguage.toUpperCase()} →{" "}
                  {targetLanguage.toUpperCase()}
                </span>
                <span>•</span>
                <span>
                  {filteredUnits.length} of {units.length}
                </span>
                {!isSourceOnly && (
                  <>
                    <span>•</span>
                    <span
                      className="font-semibold"
                      style={{
                        color:
                          translationProgress === 100
                            ? "var(--color-accent)"
                            : "var(--color-text-secondary)",
                      }}
                    >
                      {translationProgress}% translated
                    </span>
                  </>
                )}
              </div>
            </div>
            {!isSourceOnly && (
              <div className="flex items-center gap-2">
                <div
                  className="w-32 h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--color-bg-hover)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor:
                        translationProgress === 100
                          ? "var(--color-accent)"
                          : "rgba(30, 215, 96, 0.7)",
                    }}
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

            <button
              onClick={() => setShowAddDialog(true)}
              className="px-3 py-2 rounded-full font-semibold text-xs flex items-center gap-2"
              style={{
                backgroundColor: "var(--color-accent)",
                color: "var(--color-bg-secondary)",
                boxShadow: "0 6px 20px rgba(30, 215, 96, 0.25)",
              }}
            >
              <Plus size={16} />
              <span>Add Key</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div
          className="flex-1 overflow-auto px-4 py-1"
          style={{ backgroundColor: "var(--color-bg-primary)" }}
        >
          <table
            className="w-full text-xs"
            style={{ borderCollapse: "separate", borderSpacing: "0 3px" }}
          >
            <thead
              style={{
                position: "sticky",
                top: 0,
                backgroundColor: "var(--color-bg-primary)",
                zIndex: 5,
              }}
            >
              <tr>
                <th
                  className="text-left px-2 py-2 font-semibold uppercase tracking-wider w-6 max-w-6"
                  style={{
                    color: "var(--color-text-secondary)",
                    backgroundColor: "var(--color-bg-primary)",
                  }}
                ></th>
                <th
                  className="text-left px-3 py-2 font-semibold uppercase tracking-wider"
                  style={{
                    color: "var(--color-text-secondary)",
                    width: "20%",
                    backgroundColor: "var(--color-bg-primary)",
                  }}
                >
                  ID
                </th>
                <th
                  className="text-left px-3 py-2 font-semibold uppercase tracking-wider"
                  style={{
                    color: "var(--color-text-secondary)",
                    width: "35%",
                    backgroundColor: "var(--color-bg-primary)",
                  }}
                >
                  Source ({sourceLanguage.toUpperCase()})
                </th>
                {!isSourceOnly && (
                  <th
                    className="text-left px-3 py-2 font-semibold uppercase tracking-wider"
                    style={{
                      color: "var(--color-text-secondary)",
                      width: "35%",
                      backgroundColor: "var(--color-bg-primary)",
                    }}
                  >
                    Translation ({targetLanguage.toUpperCase()})
                  </th>
                )}
                <th
                  className="text-left px-3 py-2 font-semibold uppercase tracking-wider"
                  style={{
                    color: "var(--color-text-secondary)",
                    width: "10%",
                    backgroundColor: "var(--color-bg-primary)",
                  }}
                >
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
                    const isEditing = editingId === unit.id;
                    const isSaving = savingId === unit.id;
                    const isJustSaved = recentlySavedId === unit.id;
                    return (
                      <SortableRow
                        key={unit.id}
                        unit={unit}
                        isEditing={isEditing}
                        isSaving={isSaving}
                        isJustSaved={isJustSaved}
                        isSourceOnly={isSourceOnly}
                        editValues={editValues}
                        isDirty={isDirty}
                        onEdit={handleEdit}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        onDelete={onDelete}
                        onClearTranslation={onClearTranslation}
                        setEditValues={setEditValues}
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
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="w-full max-w-lg p-8 rounded-2xl shadow-2xl"
            style={{
              backgroundColor: "var(--color-bg-primary)",
              border: "1px solid var(--color-border)",
            }}
          >
            <h3
              className="text-2xl font-semibold mb-6"
              style={{ color: "var(--color-text-primary)" }}
            >
              Add Translation Key
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  className="block text-xs font-semibold mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Key ID
                </label>
                <input
                  type="text"
                  value={newKeyId}
                  onChange={(e) => setNewKeyId(e.target.value)}
                  placeholder="e.g., button.submit"
                  className="w-full px-4 py-3 rounded-lg font-mono"
                  style={{
                    backgroundColor: "var(--color-bg-secondary)",
                    color: "var(--color-text-primary)",
                    border: "2px solid var(--color-border)",
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Source Text ({sourceLanguage.toUpperCase()})
                </label>
                <textarea
                  value={newKeySource}
                  onChange={(e) => setNewKeySource(e.target.value)}
                  placeholder="Enter source text..."
                  className="w-full px-4 py-3 rounded-lg resize-none"
                  style={{
                    backgroundColor: "var(--color-bg-secondary)",
                    color: "var(--color-text-primary)",
                    border: "2px solid var(--color-border)",
                    minHeight: "100px",
                  }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddKey}
                  disabled={!newKeyId.trim() || !newKeySource.trim()}
                  className="flex-1 px-4 py-3 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    color: "white",
                  }}
                >
                  Add Key
                </button>
                <button
                  onClick={() => {
                    setShowAddDialog(false);
                    setNewKeyId("");
                    setNewKeySource("");
                  }}
                  className="flex-1 px-4 py-3 rounded-full font-semibold hover:scale-105"
                  style={{
                    backgroundColor: "var(--color-bg-hover)",
                    color: "var(--color-text-primary)",
                  }}
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
