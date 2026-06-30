// Persisted user settings and recent-projects list (stored in localStorage,
// which survives across launches inside the Tauri webview).

export type IndentStyle = 'tab' | 'space';

export interface RecentEntry {
	/** Absolute path to the folder (project) or file. */
	path: string;
	/** Display name (last path segment). */
	name: string;
	kind: 'project' | 'file';
	/** Epoch millis of last open. */
	at: number;
}

const SETTINGS_KEY = 't3lang.settings.v1';
const RECENT_KEY = 't3lang.recent.v1';
const MAX_RECENT = 12;

function hasStorage(): boolean {
	return typeof window !== 'undefined' && !!window.localStorage;
}

interface PersistedSettings {
	indentStyle: IndentStyle;
	indentSize: number;
}

class Settings {
	indentStyle = $state<IndentStyle>('tab');
	indentSize = $state(2);
	recents = $state<RecentEntry[]>([]);

	constructor() {
		if (!hasStorage()) return;
		try {
			const raw = localStorage.getItem(SETTINGS_KEY);
			if (raw) {
				const s = JSON.parse(raw) as Partial<PersistedSettings>;
				if (s.indentStyle === 'tab' || s.indentStyle === 'space') this.indentStyle = s.indentStyle;
				if (typeof s.indentSize === 'number') this.indentSize = s.indentSize;
			}
		} catch {
			/* ignore */
		}
		try {
			const raw = localStorage.getItem(RECENT_KEY);
			if (raw) this.recents = JSON.parse(raw) as RecentEntry[];
		} catch {
			/* ignore */
		}
	}

	/** One indentation level as a literal string for the serializer. */
	get indentUnit(): string {
		return this.indentStyle === 'tab' ? '\t' : ' '.repeat(this.indentSize);
	}

	setIndentStyle(style: IndentStyle) {
		this.indentStyle = style;
		this.persistSettings();
	}

	setIndentSize(size: number) {
		this.indentSize = size;
		this.persistSettings();
	}

	private persistSettings() {
		if (!hasStorage()) return;
		const data: PersistedSettings = { indentStyle: this.indentStyle, indentSize: this.indentSize };
		localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
	}

	addRecent(path: string, kind: 'project' | 'file') {
		const name = path.split('/').filter(Boolean).pop() ?? path;
		const entry: RecentEntry = { path, name, kind, at: Date.now() };
		this.recents = [entry, ...this.recents.filter((r) => r.path !== path)].slice(0, MAX_RECENT);
		this.persistRecents();
	}

	removeRecent(path: string) {
		this.recents = this.recents.filter((r) => r.path !== path);
		this.persistRecents();
	}

	clearRecents() {
		this.recents = [];
		this.persistRecents();
	}

	private persistRecents() {
		if (!hasStorage()) return;
		localStorage.setItem(RECENT_KEY, JSON.stringify(this.recents));
	}
}

export const settings = new Settings();
