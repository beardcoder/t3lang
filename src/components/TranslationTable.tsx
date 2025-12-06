import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, X, Globe, Eraser } from 'lucide-react';

interface TranslationUnit {
  id: string;
  source: string;
  target: string;
}

interface TranslationTableProps {
  units: TranslationUnit[];
  onSave: (oldId: string, newId: string, source: string, target: string) => void;
  onDelete: (id: string) => void;
  onAddKey: (id: string, source: string) => void;
  onClearTranslation: (id: string) => void;
  searchQuery: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  xliffVersion: string;
  onVersionChange: (version: '1.2' | '2.0') => void;
  isSourceOnly: boolean;
}

export function TranslationTable({
  units,
  onSave,
  onDelete,
  onAddKey,
  onClearTranslation,
  searchQuery,
  sourceLanguage = 'en',
  targetLanguage = 'de',
  xliffVersion,
  onVersionChange,
  isSourceOnly
}: TranslationTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ id: '', source: '', target: '' });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newKeyId, setNewKeyId] = useState('');
  const [newKeySource, setNewKeySource] = useState('');

  const filteredUnits = units.filter(unit => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const targetHaystack = isSourceOnly ? [] : [unit.target.toLowerCase()];
    return (
      unit.id.toLowerCase().includes(query) ||
      unit.source.toLowerCase().includes(query) ||
      targetHaystack.some(value => value.includes(query))
    );
  });

  const handleEdit = (unit: TranslationUnit) => {
    setEditingId(unit.id);
    setEditValues({ id: unit.id, source: unit.source, target: unit.target });
  };

  const handleSave = () => {
    if (editingId) {
      onSave(editingId, editValues.id, editValues.source, editValues.target);
      setEditingId(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({ id: '', source: '', target: '' });
  };

  const handleAddKey = () => {
    if (newKeyId.trim() && newKeySource.trim()) {
      onAddKey(newKeyId.trim(), newKeySource.trim());
      setNewKeyId('');
      setNewKeySource('');
      setShowAddDialog(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingId && e.key === 'Escape') {
        handleCancel();
      }
      if (editingId && (e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (showAddDialog && e.key === 'Escape') {
        setShowAddDialog(false);
        setNewKeyId('');
        setNewKeySource('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingId, editValues, showAddDialog]);

  if (units.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="text-center">
          <Globe className="mx-auto mb-6" size={80} style={{ color: 'var(--color-text-secondary)', opacity: 0.2 }} />
          <h2 className="text-2xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            No Translations
          </h2>
          <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
            Open a file or folder to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderBottom: '1px solid var(--color-border)'
        }}>
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Translations
              </h2>
              <div className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                {sourceLanguage.toUpperCase()} → {targetLanguage.toUpperCase()} • {filteredUnits.length} of {units.length}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={xliffVersion}
              onChange={(e) => onVersionChange(e.target.value as '1.2' | '2.0')}
              className="px-3 py-2 rounded-md text-sm font-medium"
              style={{
                backgroundColor: 'var(--color-bg-hover)',
                color: 'var(--color-text-primary)',
                border: 'none'
              }}
            >
              <option value="1.2">XLIFF v1.2</option>
              <option value="2.0">XLIFF v2.0</option>
            </select>

            <button
              onClick={() => setShowAddDialog(true)}
              className="px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 hover:scale-105"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'white'
              }}
            >
              <Plus size={18} />
              <span>Add Key</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6">
          <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: '0 4px' }}>
            <thead style={{
              position: 'sticky',
              top: 0,
              backgroundColor: 'var(--color-bg-primary)',
              zIndex: 10
            }}>
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{
                  color: 'var(--color-text-secondary)',
                  width: '20%',
                  backgroundColor: 'var(--color-bg-primary)'
                }}>
                  ID
                </th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{
                  color: 'var(--color-text-secondary)',
                  width: '35%',
                  backgroundColor: 'var(--color-bg-primary)'
                }}>
                  Source ({sourceLanguage.toUpperCase()})
                </th>
                {!isSourceOnly && (
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{
                    color: 'var(--color-text-secondary)',
                    width: '35%',
                    backgroundColor: 'var(--color-bg-primary)'
                  }}>
                    Translation ({targetLanguage.toUpperCase()})
                  </th>
                )}
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{
                  color: 'var(--color-text-secondary)',
                  width: '10%',
                  backgroundColor: 'var(--color-bg-primary)'
                }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map((unit) => (
                <tr
                  key={unit.id}
                  className="group"
                  style={{
                    backgroundColor: editingId === unit.id ? 'var(--color-bg-hover)' : 'var(--color-bg-secondary)'
                  }}
                  onMouseEnter={(e) => {
                    if (editingId !== unit.id) {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (editingId !== unit.id) {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                    }
                  }}
                >
                  {/* ID Cell */}
                  <td className="px-4 py-3 text-sm align-top first:rounded-l-lg">
                    {editingId === unit.id ? (
                      <input
                        type="text"
                        value={editValues.id}
                        onChange={(e) => setEditValues(prev => ({ ...prev, id: e.target.value }))}
                        className="w-full px-3 py-2 rounded-md text-sm font-mono"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          color: 'var(--color-text-primary)',
                          border: '2px solid var(--color-accent)'
                        }}
                      />
                    ) : (
                      <div
                        onClick={() => handleEdit(unit)}
                        className="cursor-pointer px-3 py-2 rounded-md font-mono"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {unit.id}
                      </div>
                    )}
                  </td>

                  {/* Source Cell */}
                  <td className="px-4 py-3 text-sm align-top">
                    {editingId === unit.id ? (
                      <textarea
                        value={editValues.source}
                        onChange={(e) => setEditValues(prev => ({ ...prev, source: e.target.value }))}
                        className="w-full px-3 py-2 rounded-md resize-none"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          color: 'var(--color-text-primary)',
                          border: '2px solid var(--color-accent)',
                          minHeight: '80px'
                        }}
                      />
                    ) : (
                      <div
                        onClick={() => handleEdit(unit)}
                        className="cursor-pointer px-3 py-2 rounded-md"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {unit.source}
                      </div>
                    )}
                  </td>

                  {/* Target Cell */}
                  {!isSourceOnly && (
                    <td className="px-4 py-3 text-sm align-top">
                      {editingId === unit.id ? (
                        <textarea
                          value={editValues.target}
                          onChange={(e) => setEditValues(prev => ({ ...prev, target: e.target.value }))}
                          className="w-full px-3 py-2 rounded-md resize-none"
                          style={{
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            border: '2px solid var(--color-accent)',
                            minHeight: '80px'
                          }}
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => handleEdit(unit)}
                          className="cursor-pointer px-3 py-2 rounded-md"
                          style={{
                            color: unit.target ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                            fontStyle: unit.target ? 'normal' : 'italic'
                          }}
                        >
                          {unit.target || 'Click to add...'}
                        </div>
                      )}
                    </td>
                  )}

                  {/* Actions Cell */}
                  <td className="px-4 py-3 text-sm align-top last:rounded-r-lg">
                    {editingId === unit.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          className="p-2 rounded-full hover:scale-110"
                          style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
                          title="Save (Cmd/Ctrl+S)"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-2 rounded-full hover:scale-110"
                          style={{ backgroundColor: 'var(--color-bg-hover)', color: 'var(--color-text-primary)' }}
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
                              backgroundColor: 'var(--color-bg-hover)',
                              color: 'var(--color-text-primary)'
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
                            backgroundColor: 'var(--color-danger)',
                            color: 'white'
                          }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Key Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="w-full max-w-lg p-8 rounded-2xl shadow-2xl" style={{
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)'
          }}>
            <h3 className="text-2xl font-semibold mb-6" style={{ color: 'var(--color-text-primary)' }}>
              Add Translation Key
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Key ID
                </label>
                <input
                  type="text"
                  value={newKeyId}
                  onChange={(e) => setNewKeyId(e.target.value)}
                  placeholder="e.g., button.submit"
                  className="w-full px-4 py-3 rounded-lg font-mono"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                    border: '2px solid var(--color-border)'
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Source Text ({sourceLanguage.toUpperCase()})
                </label>
                <textarea
                  value={newKeySource}
                  onChange={(e) => setNewKeySource(e.target.value)}
                  placeholder="Enter source text..."
                  className="w-full px-4 py-3 rounded-lg resize-none"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                    border: '2px solid var(--color-border)',
                    minHeight: '100px'
                  }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddKey}
                  disabled={!newKeyId.trim() || !newKeySource.trim()}
                  className="flex-1 px-4 py-3 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'white'
                  }}
                >
                  Add Key
                </button>
                <button
                  onClick={() => {
                    setShowAddDialog(false);
                    setNewKeyId('');
                    setNewKeySource('');
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
    </>
  );
}
