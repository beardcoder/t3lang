import type { TransUnit, XliffDocument, XliffNote, XliffVersion } from './xliff/types';
import { buildXliffName, parseXliffName } from './xliff/typo3';

/** A file as returned by the Rust `scan_project` command. */
export interface ScannedFile {
	path: string;
	rel_path: string;
	rel_dir: string;
	name: string;
	size: number;
}

/** Per-language target value within a catalog unit. */
export interface TargetEntry {
	value: string;
	hasMarkup?: boolean;
	state?: string;
	approved?: boolean;
	notes: XliffNote[];
}

/** A merged translatable entry across all languages of a catalog. */
export interface CatalogUnit {
	/** Internal row key, stable across edits (needed for dnd + svelte keys). */
	key: string;
	id: string;
	resname?: string;
	source: string;
	sourceHasMarkup?: boolean;
	xmlSpace?: 'preserve' | 'default';
	notes: XliffNote[];
	extraAttrs?: Record<string, string>;
	targets: Record<string, TargetEntry>;
}

export interface LanguageFile {
	/** Language key (e.g. "de"); the source language uses its own code. */
	lang: string;
	/** Absolute path on disk. */
	path: string;
	/** Whether the file already exists on disk. */
	exists: boolean;
	/** v1.2 file/@original. */
	original?: string;
	/** v1.2 file/@product-name. */
	productName?: string;
	date?: string;
	fileId?: string;
}

/** A catalog groups the source file and all its translation files. */
export interface Catalog {
	id: string;
	dir: string;
	relDir: string;
	base: string;
	ext: string;
	version: XliffVersion;
	sourceLanguage: string;
	datatype?: string;
	/** The source/default-language file (no language prefix). */
	source: LanguageFile;
	/** Translation files (excluding the source file). */
	languages: LanguageFile[];
	units: CatalogUnit[];
	dirty: boolean;
}

interface FileRef {
	lang: string | null;
	path: string;
	name: string;
}

interface CatalogDescriptor {
	dir: string;
	relDir: string;
	base: string;
	ext: string;
	files: FileRef[];
}

function joinPath(dir: string, name: string): string {
	if (!dir) return name;
	return `${dir.replace(/\/$/, '')}/${name}`;
}

/** Group scanned files into catalog descriptors by directory + base name. */
export function groupFiles(files: ScannedFile[]): CatalogDescriptor[] {
	const map = new Map<string, CatalogDescriptor>();
	for (const f of files) {
		const parsed = parseXliffName(f.name);
		if (!parsed) continue;
		const dir = f.path.slice(0, f.path.length - f.name.length).replace(/\/$/, '');
		const key = `${dir}::${parsed.base}`;
		let desc = map.get(key);
		if (!desc) {
			desc = { dir, relDir: f.rel_dir, base: parsed.base, ext: parsed.ext, files: [] };
			map.set(key, desc);
		}
		desc.files.push({ lang: parsed.lang, path: f.path, name: f.name });
	}
	return [...map.values()].sort((a, b) =>
		(a.relDir + a.base).localeCompare(b.relDir + b.base)
	);
}

let keyCounter = 0;
export function nextKey(): string {
	keyCounter += 1;
	return `u${keyCounter}`;
}

/** Build a merged catalog from a descriptor and the parsed documents per path. */
export function buildCatalog(
	desc: CatalogDescriptor,
	docs: Map<string, XliffDocument>
): Catalog {
	const sourceRef = desc.files.find((f) => f.lang === null);
	const translationRefs = desc.files.filter((f) => f.lang !== null);

	// Determine the reference document for catalog-level metadata.
	const refDoc =
		(sourceRef && docs.get(sourceRef.path)) ??
		docs.get(translationRefs[0]?.path ?? '') ??
		undefined;

	const version: XliffVersion = refDoc?.version ?? '1.2';
	const sourceLanguage = refDoc?.sourceLanguage ?? 'en';

	const units: CatalogUnit[] = [];
	const byId = new Map<string, CatalogUnit>();

	const ensureUnit = (u: TransUnit): CatalogUnit => {
		let cu = byId.get(u.id);
		if (!cu) {
			cu = {
				key: nextKey(),
				id: u.id,
				resname: u.resname,
				source: u.source,
				sourceHasMarkup: u.sourceHasMarkup,
				xmlSpace: u.xmlSpace,
				notes: [],
				extraAttrs: u.extraAttrs,
				targets: {}
			};
			byId.set(u.id, cu);
			units.push(cu);
		}
		return cu;
	};

	// Seed from source file (defines order + source text + source-level notes).
	const sourceDoc = sourceRef ? docs.get(sourceRef.path) : undefined;
	if (sourceDoc) {
		for (const u of sourceDoc.units) {
			const cu = ensureUnit(u);
			cu.source = u.source;
			cu.sourceHasMarkup = u.sourceHasMarkup;
			cu.notes = u.notes;
			cu.resname = u.resname ?? cu.resname;
			cu.xmlSpace = u.xmlSpace ?? cu.xmlSpace;
		}
	}

	// Merge translation files.
	for (const ref of translationRefs) {
		const doc = docs.get(ref.path);
		if (!doc) continue;
		for (const u of doc.units) {
			const cu = ensureUnit(u);
			if (!sourceDoc) {
				cu.source = cu.source || u.source;
				cu.sourceHasMarkup = cu.sourceHasMarkup ?? u.sourceHasMarkup;
			}
			cu.targets[ref.lang!] = {
				value: u.target ?? '',
				hasMarkup: u.targetHasMarkup,
				state: u.state,
				approved: u.approved,
				notes: u.notes
			};
		}
	}

	const sourceFile: LanguageFile = {
		lang: sourceLanguage,
		path: sourceRef?.path ?? joinPath(desc.dir, buildXliffName(desc.base, null, desc.ext)),
		exists: !!sourceRef,
		original: sourceDoc?.original,
		productName: sourceDoc?.productName,
		date: sourceDoc?.date,
		fileId: sourceDoc?.fileId
	};

	const languages: LanguageFile[] = translationRefs.map((ref) => {
		const doc = docs.get(ref.path);
		return {
			lang: ref.lang!,
			path: ref.path,
			exists: true,
			original: doc?.original,
			productName: doc?.productName,
			date: doc?.date,
			fileId: doc?.fileId
		};
	});
	languages.sort((a, b) => a.lang.localeCompare(b.lang));

	return {
		id: `${desc.dir}::${desc.base}`,
		dir: desc.dir,
		relDir: desc.relDir,
		base: desc.base,
		ext: desc.ext,
		version,
		sourceLanguage,
		datatype: refDoc?.datatype,
		source: sourceFile,
		languages,
		units,
		dirty: false
	};
}

/** Convert a catalog unit back to a TransUnit for a specific language (or source). */
function unitForLang(u: CatalogUnit, lang: string | null): TransUnit {
	if (lang === null) {
		return {
			id: u.id,
			resname: u.resname,
			source: u.source,
			sourceHasMarkup: u.sourceHasMarkup,
			xmlSpace: u.xmlSpace,
			notes: u.notes,
			extraAttrs: u.extraAttrs
		};
	}
	const t = u.targets[lang];
	return {
		id: u.id,
		resname: u.resname,
		source: u.source,
		sourceHasMarkup: u.sourceHasMarkup,
		target: t?.value ?? '',
		targetHasMarkup: t?.hasMarkup,
		state: t?.state,
		approved: t?.approved,
		xmlSpace: u.xmlSpace,
		notes: t?.notes ?? [],
		extraAttrs: u.extraAttrs
	};
}

export interface CatalogDocument {
	lang: string | null;
	path: string;
	doc: XliffDocument;
}

/** Split a catalog into one XLIFF document per file for saving. */
export function catalogToDocuments(cat: Catalog): CatalogDocument[] {
	const out: CatalogDocument[] = [];

	out.push({
		lang: null,
		path: cat.source.path,
		doc: {
			version: cat.version,
			sourceLanguage: cat.sourceLanguage,
			datatype: cat.datatype ?? 'plaintext',
			original: cat.source.original,
			productName: cat.source.productName,
			date: cat.source.date,
			fileId: cat.source.fileId,
			units: cat.units.map((u) => unitForLang(u, null)),
			headerNotes: []
		}
	});

	for (const lf of cat.languages) {
		out.push({
			lang: lf.lang,
			path: lf.path,
			doc: {
				version: cat.version,
				sourceLanguage: cat.sourceLanguage,
				targetLanguage: lf.lang,
				datatype: cat.datatype ?? 'plaintext',
				original: lf.original,
				productName: lf.productName,
				date: lf.date,
				fileId: lf.fileId,
				units: cat.units.map((u) => unitForLang(u, lf.lang)),
				headerNotes: []
			}
		});
	}

	return out;
}

/** Create an empty catalog (new translation project). */
export function createEmptyCatalog(
	dir: string,
	base: string,
	sourceLanguage: string,
	version: XliffVersion
): Catalog {
	return {
		id: `${dir}::${base}`,
		dir,
		relDir: '',
		base,
		ext: 'xlf',
		version,
		sourceLanguage,
		datatype: 'plaintext',
		source: {
			lang: sourceLanguage,
			path: joinPath(dir, buildXliffName(base, null)),
			exists: false
		},
		languages: [],
		units: [],
		dirty: true
	};
}

export function addLanguageToCatalog(cat: Catalog, lang: string): LanguageFile {
	const path = joinPath(cat.dir, buildXliffName(cat.base, lang, cat.ext));
	const lf: LanguageFile = { lang, path, exists: false };
	cat.languages = [...cat.languages, lf].sort((a, b) => a.lang.localeCompare(b.lang));
	for (const u of cat.units) {
		if (!u.targets[lang]) u.targets[lang] = { value: '', state: undefined, notes: [] };
	}
	cat.dirty = true;
	return lf;
}

export function addUnit(cat: Catalog, id: string, source: string): CatalogUnit {
	const unit: CatalogUnit = {
		key: nextKey(),
		id,
		resname: id,
		source,
		xmlSpace: cat.version === '1.2' ? 'preserve' : undefined,
		notes: [],
		targets: {}
	};
	for (const lf of cat.languages) unit.targets[lf.lang] = { value: '', notes: [] };
	cat.units = [...cat.units, unit];
	cat.dirty = true;
	return unit;
}
