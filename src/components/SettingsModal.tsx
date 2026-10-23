import { useState } from 'react';
import { useSnapshot } from 'valtio';
import { settings } from '../lib/settings';
import { installCli } from '../lib/tauri';
import { cx } from '../lib/hooks';
import { Modal } from './Modal';
import { Icon } from './Icon';
import s from './SettingsModal.module.css';

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
	const snap = useSnapshot(settings);
	const [cliState, setCliState] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
	const [cliMessage, setCliMessage] = useState('');

	async function doInstallCli() {
		setCliState('working');
		try {
			setCliMessage(await installCli());
			setCliState('done');
		} catch (e) {
			setCliMessage(String(e));
			setCliState('error');
		}
	}

	// Live preview of the chosen indentation.
	const preview = [
		'<trans-unit id="example">',
		`${snap.indentUnit}<source>Hello</source>`,
		`${snap.indentUnit}<target>Hallo</target>`,
		'</trans-unit>'
	].join('\n');

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Settings"
			footer={
				<button className="mac-btn mac-btn-primary" onClick={onClose}>
					Done
				</button>
			}
		>
			<section className={s.section}>
				<h3>Indentation</h3>
				<p className={s.hint}>
					How saved <code>.xlf</code> files are indented.
				</p>
				<div className={s.seg}>
					<button className={cx(snap.indentStyle === 'tab' && s.active)} onClick={() => settings.setIndentStyle('tab')}>
						Tabs
					</button>
					<button className={cx(snap.indentStyle === 'space' && s.active)} onClick={() => settings.setIndentStyle('space')}>
						Spaces
					</button>
				</div>
				{snap.indentStyle === 'space' && (
					<div className={s.sizes}>
						{[2, 4, 8].map((n) => (
							<button key={n} className={cx(s.size, snap.indentSize === n && s.active)} onClick={() => settings.setIndentSize(n)}>
								{n}
							</button>
						))}
					</div>
				)}
				<pre className={s.preview}>{preview}</pre>
			</section>

			<section className={s.section}>
				<h3>Entry order</h3>
				<p className={s.hint}>
					Keep entries sorted alphabetically by key. Sorting on save overrides manual drag &amp; drop order.
				</p>
				<div className={s.seg}>
					<button className={cx(!snap.sortOnSave && s.active)} onClick={() => settings.setSortOnSave(false)}>
						Keep order
					</button>
					<button className={cx(snap.sortOnSave && s.active)} onClick={() => settings.setSortOnSave(true)}>
						Sort by key on save
					</button>
				</div>
			</section>

			<section className={s.section}>
				<h3>Command line</h3>
				<p className={s.hint}>
					Install a <code>t3lang</code> command so you can run <code>t3lang /path/to/folder</code> from the terminal.
				</p>
				<div className={s.cli}>
					<button className="mac-btn mac-btn-primary" onClick={doInstallCli} disabled={cliState === 'working'}>
						<Icon name="terminal" size={14} />
						{cliState === 'working' ? 'Installing…' : 'Install command line tool'}
					</button>
					{cliState === 'done' && (
						<p className={s.ok}>
							Installed at <code>{cliMessage}</code>. If <code>t3lang</code> isn't found, add that folder to your{' '}
							<code>PATH</code>.
						</p>
					)}
					{cliState === 'error' && <p className={s.err}>{cliMessage}</p>}
				</div>
			</section>

			<section className={s.section}>
				<h3>Recent projects</h3>
				<p className={s.hint}>{snap.recents.length} remembered.</p>
				<div>
					<button className="mac-btn" onClick={() => settings.clearRecents()} disabled={snap.recents.length === 0}>
						<Icon name="trash" size={13} /> Clear recent projects
					</button>
				</div>
			</section>

			<p className={s.version}>t3lang v3.3.0</p>
		</Modal>
	);
}
