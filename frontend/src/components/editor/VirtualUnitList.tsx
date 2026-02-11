import { useRef, useCallback, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useEditorStore } from '../../stores';
import { UnitRow } from './UnitRow';
import type { TranslationUnit } from '../../types';

interface VirtualUnitListProps {
  units: TranslationUnit[];
  filePath: string;
  isSourceOnly: boolean;
  onDeleteUnit: (unitId: string) => void;
}

const ROW_HEIGHT = 72;
const HEADER_HEIGHT = 42;

export function VirtualUnitList({ units, filePath, isSourceOnly, onDeleteUnit }: VirtualUnitListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const focusedUnitId = useEditorStore((state) => state.focusedUnitId);
  const setFocusedUnit = useEditorStore((state) => state.setFocusedUnit);
  const startEditing = useEditorStore((state) => state.startEditing);

  const virtualizer = useVirtualizer({
    count: units.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  // Navigate focus to adjacent row helper
  const moveFocus = useCallback((fromUnitId: string, direction: 'up' | 'down') => {
    const currentIndex = units.findIndex(u => u.id === fromUnitId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up'
      ? Math.max(0, currentIndex - 1)
      : Math.min(units.length - 1, currentIndex + 1);

    if (newIndex !== currentIndex) {
      const nextUnit = units[newIndex];
      setFocusedUnit(nextUnit.id, 'target');
      virtualizer.scrollToIndex(newIndex, { align: 'auto' });
      // Auto-start editing in the next row for Tab navigation
      if (!isSourceOnly) {
        requestAnimationFrame(() => startEditing(nextUnit.id, 'target'));
      }
    }
  }, [units, setFocusedUnit, virtualizer, isSourceOnly, startEditing]);

  // Listen for Tab navigation events from UnitRow
  useEffect(() => {
    const handleTabNavigate = (e: Event) => {
      const { direction, fromUnitId } = (e as CustomEvent).detail;
      moveFocus(fromUnitId, direction);
    };
    window.addEventListener('unit-tab-navigate', handleTabNavigate);
    return () => window.removeEventListener('unit-tab-navigate', handleTabNavigate);
  }, [moveFocus]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!focusedUnitId) return;

    const currentIndex = units.findIndex(u => u.id === focusedUnitId);
    if (currentIndex === -1) return;

    switch (e.key) {
      case 'ArrowUp':
        if (currentIndex > 0) {
          e.preventDefault();
          const prevUnit = units[currentIndex - 1];
          setFocusedUnit(prevUnit.id, 'target');
          virtualizer.scrollToIndex(currentIndex - 1, { align: 'auto' });
        }
        break;
      case 'ArrowDown':
        if (currentIndex < units.length - 1) {
          e.preventDefault();
          const nextUnit = units[currentIndex + 1];
          setFocusedUnit(nextUnit.id, 'target');
          virtualizer.scrollToIndex(currentIndex + 1, { align: 'auto' });
        }
        break;
    }
  }, [focusedUnitId, units, setFocusedUnit, virtualizer]);

  if (units.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="rounded-full bg-bg-tertiary px-3 py-1.5 text-sm text-text-tertiary">
          No translation units found
        </p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="soft-scroll h-full overflow-auto"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize() + HEADER_HEIGHT}px` }}
      >
        <div className="surface-glass sticky top-0 z-20 flex text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
          <div className="w-1/4 min-w-[150px] px-3 py-3">Key</div>
          <div className="flex-1 px-3 py-3">Source</div>
          {!isSourceOnly && <div className="flex-1 px-3 py-3">Translation</div>}
        </div>

        {virtualizer.getVirtualItems().map((virtualRow) => {
          const unit = units[virtualRow.index];
          return (
            <div
              key={unit.id}
              className="absolute left-0 top-0 w-full"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start + HEADER_HEIGHT}px)`,
              }}
            >
              <UnitRow
                unit={unit}
                filePath={filePath}
                isSourceOnly={isSourceOnly}
                isFocused={unit.id === focusedUnitId}
                onFocus={setFocusedUnit.bind(null, unit.id, 'target')}
                onDelete={onDeleteUnit}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
