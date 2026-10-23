import { useSnapshot } from 'valtio';
import { app } from '../lib/state';
import { settings } from '../lib/settings';
import { Icon } from './Icon';
import s from './StatusBar.module.css';

export function StatusBar({ activeLang, onSettings }: { activeLang: string | null; onSettings: () => void }) {
	const snap = useSnapshot(app);
	const { indentStyle, indentSize } = useSnapshot(settings);
	const cat = snap.active;

	let progress: { done: number; pct: number } | null = null;
	if (cat && activeLang && cat.units.length) {
		const done = cat.units.filter((u) => (u.targets[activeLang]?.value ?? '').trim()).length;
		progress = { done, pct: Math.round((done / cat.units.length) * 100) };
	}

	return (
		<footer className={s.statusbar}>
			<div className={s.side}>
				<button className={`${s.item} ${s.btn}`} onClick={onSettings} title="Settings (⌘,)" aria-label="Settings">
					<Icon name="gear" size={13} stroke={1.7} />
				</button>
				{snap.projectRoot && (
					<span className={s.item} title={snap.projectRoot}>
						<Icon name="folder" size={12} stroke={1.7} /> {snap.projectName}
					</span>
				)}
				{snap.dirtyCount > 0 && (
					<button
						className={`${s.item} ${s.btn} ${s.dirty}`}
						onClick={() => app.saveAll()}
						title="Save all changed catalogs (⌘S)"
					>
						<span className={s.dot}></span>
						{snap.dirtyCount} unsaved
					</button>
				)}
			</div>

			{cat && (
				<div className={s.side}>
					<span className={s.item}>
						{snap.search.trim() ? `${snap.filteredUnits.length} of ` : ''}
						{cat.units.length} entries
					</span>
					{progress && (
						<span className={s.item} title={`${progress.done} of ${cat.units.length} entries translated`}>
							<span className={s.meter}>
								<span style={{ width: `${progress.pct}%` }} className={progress.pct === 100 ? s.done : ''}></span>
							</span>
							{activeLang} {progress.pct}%
						</span>
					)}
					<button className={`${s.item} ${s.btn}`} onClick={onSettings} title="Indentation used when saving">
						{indentStyle === 'tab' ? 'Tabs' : `Spaces: ${indentSize}`}
					</button>
					<span className={s.item}>XLIFF {cat.version}</span>
				</div>
			)}
		</footer>
	);
}
