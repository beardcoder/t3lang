import { parseXliff } from './xliff/parse';
import { serializeXliff } from './xliff/serialize';
import { settings, type RecentEntry } from './settings.svelte';
import {
	addLanguageToCatalog,
	addUnit,
	buildCatalog,
	catalogToDocuments,
	createEmptyCatalog,
	groupFiles,
	type Catalog,
	type CatalogUnit,
	type ScannedFile
} from './project';
import type { XliffDocument, XliffVersion } from './xliff/types';
import {
	fileExists,
	initialProject,
	pickDirectory,
	pickXliffFile,
	readTextFile,
	scanProject,
	writeTextFile
} from './tauri';

export interface Toast {
	id: number;
	kind: 'success' | 'error' | 'info';
	message: string;
}

// State value mapping between XLIFF versions.
const V12_TO_V20: Record<string, string> = {
	new: 'initial',
	'needs-translation': 'initial',
	'needs-l10n': 'initial',
	'needs-adaptation': 'initial',
	translated: 'translated',
	'needs-review-translation': 'reviewed',
	'needs-review-l10n': 'reviewed',
	'needs-review-adaptation': 'reviewed',
	final: 'final',
	'signed-off': 'final'
};
const V20_TO_V12: Record<string, string> = {
	initial: 'new',
	translated: 'translated',
	reviewed: 'needs-review-translation',
	final: 'final'
};

class AppState {
	projectRoot = $state<string | null>(null);
	projectName = $state<string>('');
	catalogs = $state<Catalog[]>([]);
	activeId = $state<string | null>(null);
	loading = $state(false);
	search = $state('');
	/** Which language column the editor focuses on (null = source only view). */
	toasts = $state<Toast[]>([]);

	private toastSeq = 0;

	get active(): Catalog | undefined {
		return this.catalogs.find((c) => c.id === this.activeId);
	}

	get dirtyCount(): number {
		return this.catalogs.filter((c) => c.dirty).length;
	}

	get filteredUnits(): CatalogUnit[] {
		const cat = this.active;
		if (!cat) return [];
		const q = this.search.trim().toLowerCase();
		if (!q) return cat.units;
		return cat.units.filter((u) => {
			if (u.id.toLowerCase().includes(q)) return true;
			if (u.resname?.toLowerCase().includes(q)) return true;
			if (u.source.toLowerCase().includes(q)) return true;
			return Object.values(u.targets).some((t) => t.value.toLowerCase().includes(q));
		});
	}

	toast(kind: Toast['kind'], message: string) {
		const id = ++this.toastSeq;
		this.toasts = [...this.toasts, { id, kind, message }];
		setTimeout(() => {
			this.toasts = this.toasts.filter((t) => t.id !== id);
		}, 4000);
	}

	/** Dev/browser-only: seed an in-memory demo catalog (no filesystem). */
	loadDemo() {
		const src = parseXliff(DEMO_SOURCE);
		const de = parseXliff(DEMO_DE);
		const desc = groupFiles([
			{ path: '/demo/locallang.xlf', rel_path: 'locallang.xlf', rel_dir: 'Resources/Private/Language', name: 'locallang.xlf', size: 0 },
			{ path: '/demo/de.locallang.xlf', rel_path: 'de.locallang.xlf', rel_dir: 'Resources/Private/Language', name: 'de.locallang.xlf', size: 0 }
		])[0];
		const docs = new Map<string, XliffDocument>([
			['/demo/locallang.xlf', src],
			['/demo/de.locallang.xlf', de]
		]);
		this.catalogs = [buildCatalog(desc, docs)];
		this.projectRoot = '/demo/my_extension';
		this.projectName = 'my_extension (demo)';
		this.activeId = this.catalogs[0].id;
	}

	/** Auto-open the folder or file passed on the command line. */
	async initFromCli() {
		try {
			const target = await initialProject();
			if (!target) return;
			if (/\.(xlf|xliff)$/i.test(target)) await this.openSingleFile(target);
			else await this.loadProject(target);
		} catch {
			/* not running under Tauri / no arg */
		}
	}

	/** Re-open a recent project or file. */
	async openRecent(entry: RecentEntry) {
		if (entry.kind === 'file') await this.openSingleFile(entry.path);
		else await this.loadProject(entry.path);
	}

	get recents(): RecentEntry[] {
		return settings.recents;
	}

	async openProject() {
		const dir = await pickDirectory();
		if (!dir) return;
		await this.loadProject(dir);
	}

	async loadProject(dir: string) {
		this.loading = true;
		try {
			const files: ScannedFile[] = await scanProject(dir);
			const descriptors = groupFiles(files);
			const catalogs: Catalog[] = [];
			for (const desc of descriptors) {
				const docs = new Map<string, XliffDocument>();
				for (const f of desc.files) {
					try {
						const text = await readTextFile(f.path);
						docs.set(f.path, parseXliff(text));
					} catch (e) {
						this.toast('error', `Failed to parse ${f.name}: ${e}`);
					}
				}
				catalogs.push(buildCatalog(desc, docs));
			}
			this.catalogs = catalogs;
			this.projectRoot = dir;
			this.projectName = dir.split('/').filter(Boolean).pop() ?? dir;
			this.activeId = catalogs[0]?.id ?? null;
			settings.addRecent(dir, 'project');
			this.toast('success', `Loaded ${catalogs.length} catalog(s) from ${this.projectName}`);
		} catch (e) {
			this.toast('error', `Could not open project: ${e}`);
		} finally {
			this.loading = false;
		}
	}

	async openSingleFile(pathArg?: string) {
		const path = pathArg ?? (await pickXliffFile());
		if (!path) return;
		this.loading = true;
		try {
			const name = path.split('/').pop() ?? path;
			const dir = path.slice(0, path.length - name.length).replace(/\/$/, '');
			const files: ScannedFile[] = [{ path, rel_path: name, rel_dir: '', name, size: 0 }];
			// Also pull sibling translations of the same base from the directory.
			try {
				const siblings = await scanProject(dir);
				for (const s of siblings) if (s.rel_dir === '') files.push(s);
			} catch {
				/* ignore */
			}
			const unique = new Map(files.map((f) => [f.path, f]));
			const descriptors = groupFiles([...unique.values()]);
			const catalogs: Catalog[] = [];
			for (const desc of descriptors) {
				const docs = new Map<string, XliffDocument>();
				for (const f of desc.files) {
					try {
						docs.set(f.path, parseXliff(await readTextFile(f.path)));
					} catch (e) {
						this.toast('error', `Failed to parse ${f.name}: ${e}`);
					}
				}
				catalogs.push(buildCatalog(desc, docs));
			}
			this.catalogs = catalogs;
			this.projectRoot = dir;
			this.projectName = dir.split('/').filter(Boolean).pop() ?? dir;
			// Activate the catalog that actually contains the opened file.
			const owning = catalogs.find(
				(c) => c.source.path === path || c.languages.some((l) => l.path === path)
			);
			this.activeId = owning?.id ?? catalogs[0]?.id ?? null;
			settings.addRecent(path, 'file');
		} catch (e) {
			this.toast('error', `Could not open file: ${e}`);
		} finally {
			this.loading = false;
		}
	}

	newProject(dir: string, base: string, sourceLanguage: string, version: XliffVersion) {
		const cat = createEmptyCatalog(dir, base, sourceLanguage, version);
		this.catalogs = [...this.catalogs, cat];
		if (!this.projectRoot) {
			this.projectRoot = dir;
			this.projectName = dir.split('/').filter(Boolean).pop() ?? dir;
		}
		this.activeId = cat.id;
		this.toast('success', `Created catalog ${base}.xlf`);
	}

	markDirty() {
		const cat = this.active;
		if (cat) cat.dirty = true;
	}

	addLanguage(lang: string) {
		const cat = this.active;
		if (!cat) return;
		if (cat.languages.some((l) => l.lang === lang) || lang === cat.sourceLanguage) {
			this.toast('info', `Language ${lang} already exists`);
			return;
		}
		addLanguageToCatalog(cat, lang);
		this.toast('success', `Added language ${lang}`);
	}

	/** Convert the active catalog between XLIFF 1.2 and 2.0, remapping states. */
	convertVersion(target: XliffVersion) {
		const cat = this.active;
		if (!cat || cat.version === target) return;
		const map = target === '2.0' ? V12_TO_V20 : V20_TO_V12;
		for (const u of cat.units) {
			for (const t of Object.values(u.targets)) {
				if (t.state) t.state = map[t.state] ?? (target === '2.0' ? 'initial' : 'new');
			}
		}
		cat.version = target;
		cat.dirty = true;
		this.toast('success', `Converted ${cat.base} to XLIFF ${target}`);
	}

	removeLanguage(lang: string) {
		const cat = this.active;
		if (!cat) return;
		cat.languages = cat.languages.filter((l) => l.lang !== lang);
		for (const u of cat.units) delete u.targets[lang];
		cat.dirty = true;
		this.toast('info', `Removed language ${lang} from catalog`);
	}

	addUnit(id: string, source: string): CatalogUnit | null {
		const cat = this.active;
		if (!cat) return null;
		if (!id.trim()) {
			this.toast('error', 'ID must not be empty');
			return null;
		}
		if (cat.units.some((u) => u.id === id)) {
			this.toast('error', `ID "${id}" already exists`);
			return null;
		}
		const u = addUnit(cat, id.trim(), source);
		return u;
	}

	removeUnit(key: string) {
		const cat = this.active;
		if (!cat) return;
		cat.units = cat.units.filter((u) => u.key !== key);
		cat.dirty = true;
	}

	duplicateUnit(key: string) {
		const cat = this.active;
		if (!cat) return;
		const idx = cat.units.findIndex((u) => u.key === key);
		if (idx < 0) return;
		const src = cat.units[idx];
		let newId = `${src.id}_copy`;
		let n = 1;
		while (cat.units.some((u) => u.id === newId)) newId = `${src.id}_copy${++n}`;
		const clone: CatalogUnit = {
			...structuredClone({ ...src, key: '' }),
			key: crypto.randomUUID(),
			id: newId
		};
		cat.units = [...cat.units.slice(0, idx + 1), clone, ...cat.units.slice(idx + 1)];
		cat.dirty = true;
	}

	reorderUnits(newOrder: CatalogUnit[]) {
		const cat = this.active;
		if (!cat) return;
		cat.units = newOrder;
		cat.dirty = true;
	}

	async saveCatalog(cat: Catalog) {
		const docs = catalogToDocuments(cat);
		try {
			for (const d of docs) {
				// Skip writing an empty, non-existent source file only if there is nothing.
				await writeTextFile(d.path, serializeXliff(d.doc, { indent: settings.indentUnit }));
			}
			cat.source.exists = true;
			for (const lf of cat.languages) lf.exists = true;
			cat.dirty = false;
			this.toast('success', `Saved ${cat.base} (${docs.length} file(s))`);
		} catch (e) {
			this.toast('error', `Save failed: ${e}`);
		}
	}

	async saveActive() {
		const cat = this.active;
		if (cat) await this.saveCatalog(cat);
	}

	async saveAll() {
		const dirty = this.catalogs.filter((c) => c.dirty);
		for (const c of dirty) await this.saveCatalog(c);
		if (dirty.length === 0) this.toast('info', 'Nothing to save');
	}

	exportActive(): string | null {
		const cat = this.active;
		if (!cat) return null;
		return catalogToDocuments(cat)
			.map(
				(d) =>
					`<!-- ${d.path.split('/').pop()} -->\n${serializeXliff(d.doc, { indent: settings.indentUnit })}`
			)
			.join('\n\n');
	}

	// re-export for components needing fs checks
	fileExists = fileExists;
}

export const app = new AppState();

const DEMO_SOURCE = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns:t3="https://typo3.org/schemas/xliff">
	<file source-language="en" datatype="plaintext" original="EXT:my_extension/Resources/Private/Language/locallang.xlf" product-name="my_extension">
		<header/>
		<body>
			<trans-unit id="login.header" resname="login.header" xml:space="preserve">
				<source>Please log in &amp; continue</source>
				<note from="developer">Shown on the login screen</note>
			</trans-unit>
			<trans-unit id="login.button"><source>Log in</source></trans-unit>
			<trans-unit id="logout.button"><source>Log out</source></trans-unit>
			<trans-unit id="error.required"><source>This field is required.</source></trans-unit>
			<trans-unit id="welcome.message"><source>Welcome back!</source></trans-unit>
		</body>
	</file>
</xliff>`;

const DEMO_DE = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns:t3="https://typo3.org/schemas/xliff">
	<file source-language="en" target-language="de" datatype="plaintext" original="EXT:my_extension/Resources/Private/Language/locallang.xlf" product-name="my_extension">
		<header/>
		<body>
			<trans-unit id="login.header" resname="login.header" approved="yes" xml:space="preserve">
				<source>Please log in &amp; continue</source>
				<target state="translated">Bitte einloggen &amp; fortfahren</target>
			</trans-unit>
			<trans-unit id="login.button"><source>Log in</source><target state="translated">Einloggen</target></trans-unit>
			<trans-unit id="logout.button"><source>Log out</source><target state="needs-review-translation">Ausloggen</target></trans-unit>
			<trans-unit id="error.required"><source>This field is required.</source><target>Dieses Feld ist erforderlich.</target></trans-unit>
			<trans-unit id="welcome.message"><source>Welcome back!</source><target></target></trans-unit>
		</body>
	</file>
</xliff>`;
