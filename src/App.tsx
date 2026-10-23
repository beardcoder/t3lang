import { useEffect, useRef, useState } from 'react';
import { useSnapshot } from 'valtio';
import { app } from './lib/state';
import { pickDirectory } from './lib/tauri';
import { KNOWN_LANGUAGES } from './lib/xliff/typo3';
import type { XliffVersion } from './lib/xliff/types';
import { Sidebar } from './components/Sidebar';
import { CatalogView } from './components/CatalogView';
import { StatusBar } from './components/StatusBar';
import { Toasts } from './components/Toasts';
import { Modal } from './components/Modal';
import { SettingsModal } from './components/SettingsModal';
import { Icon } from './components/Icon';
import s from './App.module.css';

// StrictMode runs mount effects twice in dev; only boot once.
let booted = false;

export function App() {
	const snap = useSnapshot(app);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [activeLang, setActiveLang] = useState<string | null>(null);
	const searchRef = useRef<HTMLInputElement>(null);

	// --- New catalog modal -------------------------------------------------
	const [newOpen, setNewOpen] = useState(false);
	const [nDir, setNDir] = useState('');
	const [nBase, setNBase] = useState('locallang');
	const [nLang, setNLang] = useState('en');
	const [nVersion, setNVersion] = useState<XliffVersion>('1.2');

	function openNew() {
		setNDir(app.projectRoot ?? '');
		setNBase('locallang');
		setNLang('en');
		setNVersion('1.2');
		setNewOpen(true);
	}
	async function chooseDir() {
		const d = await pickDirectory('Choose location for the new catalog');
		if (d) setNDir(d);
	}
	function createCatalog() {
		if (!nDir || !nBase.trim()) {
			app.toast('error', 'Pick a folder and a base name');
			return;
		}
		app.newProject(nDir, nBase.trim(), nLang, nVersion);
		setNewOpen(false);
	}

	// --- Add language modal ------------------------------------------------
	const [langOpen, setLangOpen] = useState(false);
	const [langCode, setLangCode] = useState('de');
	function openLang() {
		setLangCode('de');
		setLangOpen(true);
	}
	function addLang() {
		if (!langCode.trim()) return;
		app.addLanguage(langCode.trim());
		setLangOpen(false);
	}

	// --- Add unit modal ----------------------------------------------------
	const [unitOpen, setUnitOpen] = useState(false);
	const [uId, setUId] = useState('');
	const [uSource, setUSource] = useState('');
	function openUnit() {
		setUId('');
		setUSource('');
		setUnitOpen(true);
	}
	function createUnit() {
		const u = app.addUnit(uId, uSource);
		if (u) {
			setUnitOpen(false);
			app.toast('success', `Added entry "${u.id}"`);
		}
	}

	// --- Export modal ------------------------------------------------------
	const [exportOpen, setExportOpen] = useState(false);
	const [exportText, setExportText] = useState('');
	function openExport() {
		setExportText(app.exportActive() ?? '');
		setExportOpen(true);
	}
	async function copyExport() {
		await navigator.clipboard.writeText(exportText);
		app.toast('success', 'Copied XML to clipboard');
	}

	useEffect(() => {
		if (booted) return;
		booted = true;
		// Browser preview (no Tauri): seed a demo catalog when ?demo is present.
		const inTauri = '__TAURI_INTERNALS__' in window;
		if (!inTauri && location.search.includes('demo')) {
			app.loadDemo();
			return;
		}
		app.initFromCli();
	}, []);

	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
			const key = e.key.toLowerCase();
			if (key === 's') {
				e.preventDefault();
				app.saveAll();
			} else if (key === 'b') {
				e.preventDefault();
				setSidebarOpen((v) => !v);
			} else if (key === 'f' && app.active) {
				e.preventDefault();
				searchRef.current?.focus();
				searchRef.current?.select();
			} else if (key === ',') {
				e.preventDefault();
				setSettingsOpen(true);
			}
		}
		// Like AppKit, dim selection/accent colours while the window is in the background.
		const setInactive = (inactive: boolean) =>
			document.documentElement.classList.toggle('inactive', inactive);
		const onFocus = () => setInactive(false);
		const onBlur = () => setInactive(true);
		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('focus', onFocus);
		window.addEventListener('blur', onBlur);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('focus', onFocus);
			window.removeEventListener('blur', onBlur);
		};
	}, []);

	const toggleSidebar = () => setSidebarOpen((v) => !v);

	return (
		<>
			<div className={s.window}>
				<div className={s.workbench}>
					{sidebarOpen && (
						<Sidebar onNewCatalog={openNew} onAddLanguage={openLang} onToggleSidebar={toggleSidebar} />
					)}
					<main className={s.content}>
						<CatalogView
							activeLang={activeLang}
							setActiveLang={setActiveLang}
							searchRef={searchRef}
							sidebarOpen={sidebarOpen}
							onToggleSidebar={toggleSidebar}
							onAddUnit={openUnit}
							onAddLanguage={openLang}
							onNewCatalog={openNew}
							onExport={openExport}
						/>
					</main>
				</div>
				<StatusBar activeLang={activeLang} onSettings={() => setSettingsOpen(true)} />
			</div>

			<Toasts />

			<SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

			{/* New catalog */}
			<Modal
				open={newOpen}
				onClose={() => setNewOpen(false)}
				title="New translation catalog"
				footer={
					<>
						<button className="mac-btn" onClick={() => setNewOpen(false)}>Cancel</button>
						<button className="mac-btn mac-btn-primary" onClick={createCatalog}>Create</button>
					</>
				}
			>
				<label className={s.field}>
					<span>Folder</span>
					<div className={s.pickrow}>
						<input
							className={`mac-input ${s.mono}`}
							placeholder="/path/to/Resources/Private/Language"
							value={nDir}
							onChange={(e) => setNDir(e.target.value)}
						/>
						<button className="mac-btn" onClick={chooseDir} aria-label="Choose folder">
							<Icon name="folder" size={14} />
						</button>
					</div>
				</label>
				<label className={s.field}>
					<span>Base name</span>
					<input className={`mac-input ${s.mono}`} value={nBase} onChange={(e) => setNBase(e.target.value)} />
					<small>
						Creates <code>{nBase || 'name'}.xlf</code>
					</small>
				</label>
				<div className={s.frow}>
					<label className={s.field}>
						<span>Source language</span>
						<select className="mac-input" value={nLang} onChange={(e) => setNLang(e.target.value)}>
							{KNOWN_LANGUAGES.map((l) => (
								<option key={l.code} value={l.code}>
									{l.label} ({l.code})
								</option>
							))}
						</select>
					</label>
					<label className={s.field}>
						<span>XLIFF version</span>
						<select
							className="mac-input"
							value={nVersion}
							onChange={(e) => setNVersion(e.target.value as XliffVersion)}
						>
							<option value="1.2">1.2 (TYPO3 default)</option>
							<option value="2.0">2.0</option>
						</select>
					</label>
				</div>
			</Modal>

			{/* Add language */}
			<Modal
				open={langOpen}
				onClose={() => setLangOpen(false)}
				title="Add language"
				footer={
					<>
						<button className="mac-btn" onClick={() => setLangOpen(false)}>Cancel</button>
						<button className="mac-btn mac-btn-primary" onClick={addLang}>Add</button>
					</>
				}
			>
				<label className={s.field}>
					<span>Language key</span>
					<input
						className={`mac-input ${s.mono}`}
						list="langlist"
						value={langCode}
						onChange={(e) => setLangCode(e.target.value)}
						onKeyDown={(e) => e.key === 'Enter' && addLang()}
						autoFocus
					/>
					<datalist id="langlist">
						{KNOWN_LANGUAGES.map((l) => (
							<option key={l.code} value={l.code}>
								{l.label}
							</option>
						))}
					</datalist>
					<small>
						Creates <code>{langCode || 'xx'}.{snap.active?.base}.xlf</code>
					</small>
				</label>
			</Modal>

			{/* Add unit */}
			<Modal
				open={unitOpen}
				onClose={() => setUnitOpen(false)}
				title="New entry"
				footer={
					<>
						<button className="mac-btn" onClick={() => setUnitOpen(false)}>Cancel</button>
						<button className="mac-btn mac-btn-primary" onClick={createUnit}>Add entry</button>
					</>
				}
			>
				<label className={s.field}>
					<span>ID / key</span>
					<input
						className={`mac-input ${s.mono}`}
						placeholder="my.label.key"
						value={uId}
						onChange={(e) => setUId(e.target.value)}
						autoFocus
					/>
				</label>
				<label className={s.field}>
					<span>Source text ({snap.active?.sourceLanguage})</span>
					<textarea className="mac-input" rows={3} value={uSource} onChange={(e) => setUSource(e.target.value)} />
				</label>
			</Modal>

			{/* Export preview */}
			<Modal
				open={exportOpen}
				onClose={() => setExportOpen(false)}
				title="XML preview"
				footer={
					<>
						<button className="mac-btn" onClick={() => setExportOpen(false)}>Close</button>
						<button className="mac-btn mac-btn-primary" onClick={copyExport}>
							<Icon name="copy" size={13} /> Copy
						</button>
					</>
				}
			>
				<textarea className={`mac-input ${s.mono} ${s.export}`} readOnly rows={18} value={exportText} />
			</Modal>
		</>
	);
}
