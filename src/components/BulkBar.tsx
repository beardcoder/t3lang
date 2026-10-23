import { useState } from 'react';
import { app } from '../lib/state';
import type { XliffVersion } from '../lib/xliff/types';
import { Icon } from './Icon';
import s from './BulkBar.module.css';

/** Floating action bar for editing several selected entries at once. */
export function BulkBar({
	keys,
	activeLang,
	version,
	states,
	onClear
}: {
	keys: string[];
	activeLang: string | null;
	version: XliffVersion;
	states: readonly string[];
	onClear: () => void;
}) {
	const [text, setText] = useState('');
	const n = keys.length;

	function setTranslation() {
		if (!activeLang) return;
		app.updateTargets(keys, activeLang, (t) => (t.value = text));
		setText('');
	}

	function remove() {
		if (!confirm(`Delete ${n} ${n === 1 ? 'entry' : 'entries'}? This removes them from all languages.`)) return;
		app.removeUnits(keys);
		onClear();
	}

	return (
		<div className={s.bar} role="toolbar" aria-label="Edit selected entries">
			<button className="tool-btn" onClick={onClear} title="Clear selection (Esc)" aria-label="Clear selection">
				<Icon name="x" size={13} />
			</button>
			<span className={s.count}>{n} selected</span>

			{activeLang && (
				<>
					<span className={s.sep}></span>
					<form
						className={s.setText}
						onSubmit={(e) => {
							e.preventDefault();
							setTranslation();
						}}
					>
						<input
							value={text}
							onChange={(e) => setText(e.target.value)}
							placeholder={`Set ${activeLang} translation…`}
							spellCheck={false}
						/>
						<button className="mac-btn" type="submit" title={`Set this ${activeLang} text on all selected entries`}>
							Apply
						</button>
					</form>

					<select
						className={s.select}
						value=""
						title="Set state on all selected entries"
						onChange={(e) => {
							const v = e.target.value;
							app.updateTargets(keys, activeLang, (t) => (t.state = v === '__none' ? undefined : v));
						}}
					>
						<option value="" disabled>
							Set state…
						</option>
						<option value="__none">No state</option>
						{states.map((st) => (
							<option key={st} value={st}>
								{st}
							</option>
						))}
					</select>

					{version === '1.2' && (
						<>
							<button className={s.textBtn} onClick={() => app.updateTargets(keys, activeLang, (t) => (t.approved = true))}>
								<Icon name="check" size={12} stroke={2.4} /> Approve
							</button>
							<button className={s.textBtn} onClick={() => app.updateTargets(keys, activeLang, (t) => (t.approved = false))}>
								Unapprove
							</button>
						</>
					)}

					<span className={s.sep}></span>
					<button
						className="tool-btn"
						onClick={() => app.updateTargets(keys, activeLang, (t, u) => (t.value = u.source))}
						title={`Copy source text into the ${activeLang} translation`}
						aria-label="Copy source to translation"
					>
						<Icon name="copy" size={14} />
					</button>
					<button
						className="tool-btn"
						onClick={() => app.updateTargets(keys, activeLang, (t) => (t.value = ''))}
						title={`Clear the ${activeLang} translation`}
						aria-label="Clear translation"
					>
						<Icon name="eraser" size={14} />
					</button>
				</>
			)}

			<button className={`tool-btn ${s.danger}`} onClick={remove} title="Delete selected entries" aria-label="Delete selected entries">
				<Icon name="trash" size={14} />
			</button>
		</div>
	);
}
