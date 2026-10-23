import { memo, useRef, useState } from 'react';
import { useSnapshot } from 'valtio';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { app } from '../lib/state';
import type { CatalogUnit, TargetEntry } from '../lib/project';
import type { XliffVersion } from '../lib/xliff/types';
import { cx, useAutosize } from '../lib/hooks';
import { Icon } from './Icon';
import { Checkbox } from './Checkbox';
import s from './CatalogView.module.css';

function ensureTarget(unit: CatalogUnit, lang: string): TargetEntry {
	if (!unit.targets[lang]) unit.targets[lang] = { value: '', notes: [] };
	return unit.targets[lang];
}

function AutoTextarea({
	value,
	placeholder,
	onChange
}: {
	value: string;
	placeholder?: string;
	onChange: (v: string) => void;
}) {
	const ref = useRef<HTMLTextAreaElement>(null);
	useAutosize(ref, value);
	return (
		<textarea
			ref={ref}
			className={s.fld}
			rows={1}
			placeholder={placeholder}
			value={value}
			onChange={(e) => onChange(e.target.value)}
		/>
	);
}

/**
 * One editable entry. Receives the live (mutable) unit proxy and subscribes to
 * just that unit, so typing re-renders this row only.
 */
export const EntryRow = memo(function EntryRow({
	unit,
	activeLang,
	version,
	states,
	gridCols,
	reorderDisabled,
	selected,
	onSelect
}: {
	unit: CatalogUnit;
	activeLang: string | null;
	version: XliffVersion;
	states: readonly string[];
	gridCols: string;
	reorderDisabled: boolean;
	selected: boolean;
	onSelect: (key: string, range: boolean) => void;
}) {
	// sync: update synchronously so controlled inputs keep their caret position
	const u = useSnapshot(unit, { sync: true });
	const [expanded, setExpanded] = useState(false);
	const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
		id: u.key,
		disabled: reorderDisabled
	});

	const t = activeLang ? u.targets[activeLang] : undefined;
	const empty = activeLang ? !(t?.value ?? '').trim() : false;

	const edit = (fn: () => void) => {
		fn();
		app.markDirty();
	};

	const rowActions = (
		<div className={s.rowactions}>
			<button className={s.iconbtn} title="Duplicate" aria-label="Duplicate" onClick={() => app.duplicateUnit(u.key)}>
				<Icon name="copy" size={13} />
			</button>
			<button className={cx(s.iconbtn, s.danger)} title="Delete" aria-label="Delete" onClick={() => app.removeUnit(u.key)}>
				<Icon name="trash" size={13} />
			</button>
		</div>
	);

	return (
		<div
			ref={setNodeRef}
			className={cx(s.rowwrap, isDragging && s.dragging)}
			style={{ transform: CSS.Translate.toString(transform), transition }}
		>
			<div className={cx(s.row, empty && s.todo, selected && s.selected)} style={{ gridTemplateColumns: gridCols }}>
				<span className={s.checkCell}>
					<Checkbox
						state={selected ? 'on' : 'off'}
						label={selected ? 'Deselect entry' : 'Select entry (⇧ for range)'}
						onClick={(e) => onSelect(u.key, e.shiftKey)}
					/>
				</span>
				<button
					ref={setActivatorNodeRef}
					className={cx(s.grip, reorderDisabled && s.disabled)}
					title={reorderDisabled ? 'Clear search to reorder' : 'Drag to reorder'}
					aria-label="Reorder"
					{...attributes}
					{...listeners}
				>
					<Icon name="grip" size={13} />
				</button>

				<div className={cx(s.cell, s.keyCell)}>
					<button
						className={cx(s.disc, expanded && s.open)}
						onClick={() => setExpanded((v) => !v)}
						title="Details & notes"
						aria-label="Toggle details"
						aria-expanded={expanded}
					>
						<Icon name="chevron" size={10} stroke={2.2} />
					</button>
					<input
						className={cx(s.fld, s.mono)}
						value={u.id}
						spellCheck={false}
						onChange={(e) => edit(() => (unit.id = e.target.value))}
					/>
				</div>

				<div className={s.cell}>
					<AutoTextarea value={u.source} onChange={(v) => edit(() => (unit.source = v))} />
				</div>

				{activeLang ? (
					<>
						<div className={s.cell}>
							<AutoTextarea
								value={t?.value ?? ''}
								placeholder="Not translated"
								onChange={(v) => edit(() => (ensureTarget(unit, activeLang).value = v))}
							/>
						</div>

						<div className={cx(s.cell, s.trailing)}>
							{version === '1.2' && (
								<button
									className={cx(s.appr, t?.approved && s.on)}
									title={t?.approved ? 'Approved' : 'Mark as approved'}
									aria-label="Approved"
									aria-pressed={!!t?.approved}
									onClick={() =>
										edit(() => {
											const te = ensureTarget(unit, activeLang);
											te.approved = !te.approved;
										})
									}
								>
									<Icon name="check" size={11} stroke={2.6} />
								</button>
							)}
							<select
								className={cx(s.stateSel, !t?.state && s.unset)}
								title={t?.state ?? 'No state'}
								value={t?.state ?? ''}
								onChange={(e) => edit(() => (ensureTarget(unit, activeLang).state = e.target.value || undefined))}
							>
								<option value="">No state</option>
								{states.map((st) => (
									<option key={st} value={st}>
										{st}
									</option>
								))}
							</select>
							{rowActions}
						</div>
					</>
				) : (
					<div className={cx(s.cell, s.trailing)}>{rowActions}</div>
				)}
			</div>

			{expanded && (
				<div className={s.detail}>
					<div className={s.dfields}>
						<label className={s.dfield}>
							<span>resname</span>
							<input
								className={cx('mac-input', s.mono)}
								value={u.resname ?? ''}
								onChange={(e) => edit(() => (unit.resname = e.target.value || undefined))}
							/>
						</label>
						{version === '1.2' && (
							<label className={cx(s.dfield, s.narrow)}>
								<span>xml:space</span>
								<select
									className="mac-input"
									value={u.xmlSpace ?? ''}
									onChange={(e) =>
										edit(() => (unit.xmlSpace = (e.target.value || undefined) as CatalogUnit['xmlSpace']))
									}
								>
									<option value="">unset</option>
									<option value="preserve">preserve</option>
									<option value="default">default</option>
								</select>
							</label>
						)}
					</div>
					<div className={s.notes}>
						<div className={s.notesHead}>
							<span>Notes</span>
							<button className={s.textbtn} onClick={() => edit(() => unit.notes.push({ text: '' }))}>
								<Icon name="plus" size={11} /> Add
							</button>
						</div>
						{u.notes.length === 0 && <p className={s.muted}>No notes on this entry.</p>}
						{u.notes.map((note, i) => (
							<div key={i} className={s.noteRow}>
								<input
									className="mac-input"
									placeholder="Note"
									value={note.text}
									onChange={(e) => edit(() => (unit.notes[i].text = e.target.value))}
								/>
								<input
									className={cx('mac-input', s.from)}
									placeholder="From"
									value={note.from ?? ''}
									onChange={(e) => edit(() => (unit.notes[i].from = e.target.value || undefined))}
								/>
								<button
									className={cx(s.iconbtn, s.danger)}
									aria-label="Remove note"
									onClick={() => edit(() => unit.notes.splice(i, 1))}
								>
									<Icon name="trash" size={12} />
								</button>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
});
