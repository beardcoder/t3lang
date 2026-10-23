import { useState } from 'react';
import { useSnapshot } from 'valtio';
import { app } from '../lib/state';
import type { Catalog } from '../lib/project';
import { showCatalogMenu, showListMenu } from '../lib/contextMenu';
import { cx } from '../lib/hooks';
import { Icon } from './Icon';
import s from './Sidebar.module.css';

// Average translation completeness across all languages of a catalog.
function completeness(cat: Catalog): number {
	if (cat.languages.length === 0 || cat.units.length === 0) return 0;
	let done = 0;
	for (const lf of cat.languages)
		done += cat.units.filter((u) => (u.targets[lf.lang]?.value ?? '').trim()).length;
	return Math.round((done / (cat.languages.length * cat.units.length)) * 100);
}

export function Sidebar({
	onNewCatalog,
	onAddLanguage,
	onToggleSidebar
}: {
	onNewCatalog: () => void;
	onAddLanguage: () => void;
	onToggleSidebar: () => void;
}) {
	const snap = useSnapshot(app);
	const [filter, setFilter] = useState('');
	const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

	const q = filter.trim().toLowerCase();
	const map = new Map<string, Catalog[]>();
	for (const c of snap.catalogs as Catalog[]) {
		if (q && !`${c.relDir}/${c.base}`.toLowerCase().includes(q)) continue;
		const dir = c.relDir || '·';
		(map.get(dir) ?? map.set(dir, []).get(dir)!).push(c);
	}
	const groups = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
	const allCollapsed = groups.length > 0 && groups.every(([dir]) => collapsed[dir]);

	function toggleAll() {
		setCollapsed(Object.fromEntries(groups.map(([dir]) => [dir, !allCollapsed])));
	}

	// Native menus act on the live (mutable) catalog, not the render snapshot.
	const live = (id: string) => app.catalogs.find((c) => c.id === id)!;

	return (
		<aside className={`island ${s.sidebar}`}>
			{/* Window chrome row: the native traffic lights sit on the left. */}
			<div className={s.chrome} data-tauri-drag-region>
				<button className="tool-btn" onClick={onToggleSidebar} title="Hide sidebar (⌘B)" aria-label="Hide sidebar">
					<Icon name="sidebar" size={16} stroke={1.6} />
				</button>
			</div>

			<header className={s.paneHead}>
				<span className={s.paneTitle}>{snap.projectName || 'Catalogs'}</span>
				<div className={s.paneActions}>
					<button className="tool-btn" onClick={() => app.openProject()} title="Open project folder" aria-label="Open project folder">
						<Icon name="folder-open" size={15} stroke={1.6} />
					</button>
					<button className="tool-btn" onClick={() => app.openSingleFile()} title="Open XLIFF file" aria-label="Open XLIFF file">
						<Icon name="file" size={15} stroke={1.6} />
					</button>
					<button className="tool-btn" onClick={onNewCatalog} title="New catalog" aria-label="New catalog">
						<Icon name="file-plus" size={15} stroke={1.6} />
					</button>
					{groups.length > 1 && (
						<button className="tool-btn" onClick={toggleAll} title={allCollapsed ? 'Expand all' : 'Collapse all'} aria-label="Collapse all">
							<Icon name="collapse" size={14} stroke={1.6} />
						</button>
					)}
				</div>
			</header>

			{snap.catalogs.length > 3 && (
				<div className={s.catfilter}>
					<Icon name="search" size={12} />
					<input placeholder="Filter" value={filter} onChange={(e) => setFilter(e.target.value)} spellCheck={false} />
				</div>
			)}

			<nav
				className={s.list}
				onContextMenu={(e) => {
					e.preventDefault();
					showListMenu({ onNewCatalog });
				}}
			>
				{snap.catalogs.length === 0 && (
					<div className={s.empty}>
						<p>No catalogs open.</p>
						<button className="mac-btn mac-btn-primary" onClick={() => app.openProject()}>
							Open project…
						</button>
					</div>
				)}

				{groups.map(([dir, cats]) => (
					<div key={dir}>
						<button
							className={s.groupLabel}
							onClick={() => setCollapsed((c) => ({ ...c, [dir]: !c[dir] }))}
							title={dir}
						>
							<span className={cx(s.chev, !collapsed[dir] && s.open)}>
								<Icon name="chevron" size={10} stroke={2.2} />
							</span>
							<span className={s.dir}>{dir === '·' ? 'root' : dir}</span>
						</button>

						{!collapsed[dir] &&
							cats.map((cat) => {
								const p = completeness(cat);
								return (
									<button
										key={cat.id}
										className={cx(s.item, cat.id === snap.activeId && s.active)}
										onClick={() => (app.activeId = cat.id)}
										onContextMenu={(e) => {
											e.preventDefault();
											e.stopPropagation();
											showCatalogMenu(live(cat.id), { onAddLanguage });
										}}
										title={`${cat.base}.${cat.ext} · XLIFF ${cat.version} · ${cat.languages.length + 1} languages`}
									>
										<span className={s.ficon}>
											<Icon name="file" size={14} stroke={1.6} />
										</span>
										<span className={s.name}>
											{cat.base}
											<span className={s.ext}>.{cat.ext}</span>
										</span>
										{cat.dirty ? (
											<span className={s.dot} title="Unsaved changes"></span>
										) : (
											cat.languages.length > 0 && <span className={cx(s.pct, p === 100 && s.done)}>{p}%</span>
										)}
									</button>
								);
							})}
					</div>
				))}
			</nav>
		</aside>
	);
}
