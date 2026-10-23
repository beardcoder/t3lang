import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useSnapshot } from 'valtio';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent, type Modifier } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { app } from '../lib/state';
import { statesFor } from '../lib/xliff/types';
import { languageLabel } from '../lib/xliff/typo3';
import type { Catalog } from '../lib/project';
import { showCatalogMenu, showLanguageMenu } from '../lib/contextMenu';
import { cx } from '../lib/hooks';
import { Icon } from './Icon';
import { EntryRow } from './EntryRow';
import { Welcome } from './Welcome';
import { BulkBar } from './BulkBar';
import { Checkbox } from './Checkbox';
import s from './CatalogView.module.css';

const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });

const isTextField = (el: EventTarget | null) =>
	el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

export function CatalogView({
	activeLang,
	setActiveLang,
	searchRef,
	sidebarOpen,
	onToggleSidebar,
	onAddUnit,
	onAddLanguage,
	onNewCatalog,
	onExport
}: {
	activeLang: string | null;
	setActiveLang: (lang: string | null) => void;
	searchRef: RefObject<HTMLInputElement | null>;
	sidebarOpen: boolean;
	onToggleSidebar: () => void;
	onAddUnit: () => void;
	onAddLanguage: () => void;
	onNewCatalog: () => void;
	onExport: () => void;
}) {
	const snap = useSnapshot(app, { sync: true });
	const cat = snap.active as Catalog | undefined;
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }));

	// Keep the selected language valid when switching catalogs or deleting a language.
	const langs = cat?.languages.map((l) => l.lang).join(',') ?? '';
	useEffect(() => {
		if (!cat) return;
		if (activeLang && cat.languages.some((l) => l.lang === activeLang)) return;
		setActiveLang(cat.languages[0]?.lang ?? null);
	}, [cat?.id, langs]);

	// ----- multi-select -------------------------------------------------
	const visibleKeys = snap.filteredUnits.map((u) => u.key);
	const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
	const anchorRef = useRef<string | null>(null);
	const visibleRef = useRef(visibleKeys);
	visibleRef.current = visibleKeys;

	useEffect(() => {
		setSelected(new Set());
		anchorRef.current = null;
	}, [cat?.id]);

	/** Toggle one row; with shift, select the range from the last clicked row. */
	const onSelect = useCallback((key: string, range: boolean) => {
		// Read the anchor now: the updater below runs later, after it was moved to `key`.
		const keys = visibleRef.current;
		const a = anchorRef.current ? keys.indexOf(anchorRef.current) : -1;
		const b = keys.indexOf(key);
		setSelected((prev) => {
			const next = new Set(prev);
			if (range && a >= 0 && b >= 0) {
				for (let i = Math.min(a, b); i <= Math.max(a, b); i++) next.add(keys[i]);
			} else if (!next.delete(key)) {
				next.add(key);
			}
			return next;
		});
		anchorRef.current = key;
	}, []);
	const clearSelection = useCallback(() => setSelected(new Set()), []);

	// Only act on rows that are currently visible (search may hide selected ones).
	const selectedKeys = visibleKeys.filter((k) => selected.has(k));
	const allState = selectedKeys.length === 0 ? 'off' : selectedKeys.length === visibleKeys.length ? 'on' : 'mixed';

	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (isTextField(e.target) || document.querySelector('[aria-modal]')) return;
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
				e.preventDefault();
				setSelected(new Set(visibleRef.current));
			} else if (e.key === 'Escape') {
				setSelected(new Set());
			}
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, []);

	// With the sidebar hidden, the editor's top row hosts the traffic lights + toggle.
	const chromeStart: ReactNode = sidebarOpen ? null : (
		<div className={s.chromeStart}>
			<button className="tool-btn" onClick={onToggleSidebar} title="Show sidebar (⌘B)" aria-label="Show sidebar">
				<Icon name="sidebar" size={16} stroke={1.6} />
			</button>
		</div>
	);

	if (!cat) return <Welcome onNewCatalog={onNewCatalog} chromeStart={chromeStart} />;

	const live = app.active!;
	const states = statesFor(cat.version);
	const crumbs = cat.relDir ? cat.relDir.split('/').filter(Boolean) : [];
	const searchActive = snap.search.trim().length > 0;
	const liveByKey = new Map(live.units.map((u) => [u.key, u]));

	function progress(lang: string): number {
		if (!cat || cat.units.length === 0) return 0;
		const done = cat.units.filter((u) => (u.targets[lang]?.value ?? '').trim().length > 0).length;
		return Math.round((done / cat.units.length) * 100);
	}

	function convert() {
		if (!cat) return;
		const target = cat.version === '1.2' ? '2.0' : '1.2';
		const note =
			target === '2.0'
				? 'Switches to XLIFF 2.0 (<unit>/<segment>, srcLang/trgLang). States are remapped; the v1.2 “approved” flag is kept but not written in 2.0.'
				: 'Switches back to XLIFF 1.2 (<trans-unit>, source/target-language). States are remapped to v1.2 values.';
		if (confirm(`Convert “${cat.base}.${cat.ext}” to XLIFF ${target}?\n\n${note}`)) app.convertVersion(target);
	}

	function onDragEnd({ active, over }: DragEndEvent) {
		if (!over || active.id === over.id) return;
		const units = live.units;
		const from = units.findIndex((u) => u.key === active.id);
		const to = units.findIndex((u) => u.key === over.id);
		if (from >= 0 && to >= 0) app.reorderUnits(arrayMove([...units], from, to));
	}

	const gridCols = activeLang
		? '30px 18px minmax(150px, 0.85fr) minmax(220px, 1.5fr) minmax(220px, 1.5fr) 236px'
		: '30px 18px minmax(150px, 0.85fr) minmax(220px, 1fr) 72px';

	return (
		<div className={`island ${s.editor}`}>
			{/* Language tabs + catalog actions — doubles as the window's drag area */}
			<header className={s.tabbar} data-tauri-drag-region>
				{chromeStart}
				<div className={s.tabs} role="tablist">
					<span className={cx(s.tab, s.source)} title={`Source language: ${languageLabel(cat.sourceLanguage)}`}>
						<Icon name="globe" size={12} stroke={1.7} />
						{cat.sourceLanguage}
						<span className={s.tabSub}>source</span>
					</span>
					{cat.languages.map((lf) => {
						const p = progress(lf.lang);
						return (
							<button
								key={lf.lang}
								className={cx(s.tab, activeLang === lf.lang && s.active)}
								role="tab"
								aria-selected={activeLang === lf.lang}
								onClick={() => setActiveLang(lf.lang)}
								onContextMenu={(e) => {
									e.preventDefault();
									showLanguageMenu(live, lf.lang);
								}}
								title={`${languageLabel(lf.lang)} · ${p}% translated${lf.exists ? '' : ' · not saved yet'}`}
							>
								{lf.lang}
								<span className={cx(s.tabSub, p === 100 && s.done)}>{p}%</span>
								{!lf.exists && <span className={s.newdot}></span>}
							</button>
						);
					})}
					<button className={cx('tool-btn', s.addTab)} onClick={onAddLanguage} title="Add language" aria-label="Add language">
						<Icon name="plus" size={14} />
					</button>
				</div>

				<div className={s.actions}>
					<label className={s.search}>
						<Icon name="search" size={12} />
						<input
							ref={searchRef}
							value={snap.search}
							onChange={(e) => (app.search = e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Escape') {
									app.search = '';
									e.currentTarget.blur();
								}
							}}
							placeholder="Search"
							spellCheck={false}
						/>
						{snap.search ? (
							<button className={s.clear} onClick={() => (app.search = '')} aria-label="Clear search">
								<Icon name="x" size={11} />
							</button>
						) : (
							<kbd>⌘F</kbd>
						)}
					</label>
					<button className="tool-btn" onClick={onAddUnit} title="New entry" aria-label="New entry">
						<Icon name="plus" size={15} stroke={1.7} />
					</button>
					<button className="tool-btn" onClick={() => app.sortUnits()} title="Sort entries by key (A–Z)" aria-label="Sort entries by key">
						<Icon name="sort" size={15} stroke={1.7} />
					</button>
					<button className="tool-btn" onClick={onExport} title="XML preview" aria-label="XML preview">
						<Icon name="download" size={15} stroke={1.7} />
					</button>
					<button className="tool-btn" onClick={() => showCatalogMenu(live, { onAddLanguage })} title="More actions" aria-label="More actions">
						<Icon name="more" size={16} stroke={2.4} />
					</button>
					<span className={s.sep}></span>
					<button className={cx('mac-btn mac-btn-primary', s.save)} onClick={() => app.saveActive()} disabled={!cat.dirty} title="Save (⌘S)">
						Save
					</button>
				</div>
			</header>

			{/* Breadcrumbs */}
			<div
				className={s.crumbs}
				onContextMenu={(e) => {
					e.preventDefault();
					showCatalogMenu(live, { onAddLanguage });
				}}
			>
				{crumbs.map((c, i) => (
					<span key={i} className={s.crumbSeg}>
						<span className={s.crumb}>{c}</span>
						<Icon name="chevron" size={10} stroke={2} />
					</span>
				))}
				<span className={cx(s.crumb, s.file)}>
					<Icon name="file" size={12} stroke={1.7} />
					<span>
						{cat.base}
						<span className={s.ext}>.{cat.ext}</span>
					</span>
				</span>
				{cat.dirty && <span className={s.dirty} title="Unsaved changes"></span>}
				<button className={s.ver} onClick={convert} title={`Convert to XLIFF ${cat.version === '1.2' ? '2.0' : '1.2'}`}>
					XLIFF {cat.version}
					<span className={s.swap}>→ {cat.version === '1.2' ? '2.0' : '1.2'}</span>
				</button>
			</div>

			{/* Table */}
			<div className={s.entrylist} key={cat.id}>
				<div className={s.thead} style={{ gridTemplateColumns: gridCols }}>
					<span className={s.checkCell}>
						{visibleKeys.length > 0 && (
							<Checkbox
								state={allState}
								label={allState === 'on' ? 'Deselect all' : 'Select all (⌘A)'}
								onClick={() => setSelected(allState === 'on' ? new Set() : new Set(visibleKeys))}
							/>
						)}
					</span>
					<span></span>
					<span>Key</span>
					<span>Source · {cat.sourceLanguage}</span>
					{activeLang && <span>Target · {activeLang}</span>}
					<span>{activeLang ? 'State' : ''}</span>
				</div>

				<DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[verticalOnly]} onDragEnd={onDragEnd}>
					<SortableContext items={visibleKeys} strategy={verticalListSortingStrategy}>
						<div className={s.tbody}>
							{visibleKeys.map((key) => (
								<EntryRow
									key={key}
									unit={liveByKey.get(key)!}
									activeLang={activeLang}
									version={cat.version}
									states={states}
									gridCols={gridCols}
									reorderDisabled={searchActive}
									selected={selected.has(key)}
									onSelect={onSelect}
								/>
							))}
						</div>
					</SortableContext>
				</DndContext>

				{visibleKeys.length === 0 && (
					<div className={s.noRows}>
						{snap.search ? (
							<>No entries match “{snap.search}”.</>
						) : (
							<>
								<p>No entries yet.</p>
								<button className="mac-btn mac-btn-primary" onClick={onAddUnit}>
									<Icon name="plus" size={13} /> Add first entry
								</button>
							</>
						)}
					</div>
				)}
			</div>

			{selectedKeys.length > 0 && (
				<BulkBar
					keys={selectedKeys}
					activeLang={activeLang}
					version={cat.version}
					states={states}
					onClear={clearSelection}
				/>
			)}
		</div>
	);
}
