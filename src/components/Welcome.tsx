import type { ReactNode } from 'react';
import { useSnapshot } from 'valtio';
import { app } from '../lib/state';
import { settings } from '../lib/settings';
import { Icon } from './Icon';
import s from './Welcome.module.css';

export function Welcome({ onNewCatalog, chromeStart }: { onNewCatalog: () => void; chromeStart?: ReactNode }) {
	const { recents } = useSnapshot(settings);

	return (
		<div className={`island ${s.welcome}`}>
			<div className={s.chrome} data-tauri-drag-region>
				{chromeStart}
			</div>
			<div className={s.inner}>
				<div className={s.hero}>
					<div aria-hidden="true">
						{/* source → target file-card pair, the app's identity motif */}
						<svg viewBox="0 0 96 96" width="64" height="64">
							<g transform="rotate(-9 34 38)">
								<rect x="15" y="13" width="37" height="50" rx="9" className={s.cardBack} />
								<text x="29" y="45" className={`${s.glyph} ${s.glyphBack}`}>A</text>
							</g>
							<g transform="rotate(7 62 56)">
								<rect x="44" y="31" width="37" height="50" rx="9" className={s.cardFront} />
								<text x="62" y="64" className={`${s.glyph} ${s.glyphFront}`}>ä</text>
							</g>
						</svg>
					</div>
					<div>
						<h1>
							t<em>3</em>lang
						</h1>
						<p>TYPO3 XLIFF translation manager</p>
					</div>
				</div>

				<div className={s.columns}>
					<section>
						<h2>Start</h2>
						<button className={s.link} onClick={() => app.openProject()}>
							<Icon name="folder-open" size={15} stroke={1.6} /> Open project…
						</button>
						<button className={s.link} onClick={() => app.openSingleFile()}>
							<Icon name="file" size={15} stroke={1.6} /> Open file…
						</button>
						<button className={s.link} onClick={onNewCatalog}>
							<Icon name="file-plus" size={15} stroke={1.6} /> New catalog…
						</button>
						<p className={s.hint}>
							or from a terminal: <code>t3lang ./my-extension</code>
						</p>
					</section>

					<section>
						<h2>
							Recent
							{recents.length > 0 && (
								<button className={s.clearRecents} onClick={() => settings.clearRecents()}>
									Clear
								</button>
							)}
						</h2>
						{recents.length === 0 && <p className={s.hint}>Nothing opened yet.</p>}
						{recents.slice(0, 7).map((r) => (
							<button key={r.path} className={s.recent} onClick={() => app.openRecent(r)} title={r.path}>
								<span className={s.recentName}>{r.name}</span>
								<span className={s.recentPath}>{r.path}</span>
							</button>
						))}
					</section>
				</div>
			</div>
		</div>
	);
}
