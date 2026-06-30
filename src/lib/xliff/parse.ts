import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import type { TransUnit, XliffDocument, XliffNote, XliffVersion } from './types';

// fast-xml-parser is configured in preserveOrder mode so that mixed content
// (inline elements like <g>, <x/>, <ph>, <pc>) inside <source>/<target> is
// kept intact and can be round-tripped as raw inner XML strings.

const ATTR_PREFIX = '@_';

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: ATTR_PREFIX,
	preserveOrder: true,
	trimValues: false,
	processEntities: true,
	htmlEntities: true,
	parseTagValue: false,
	parseAttributeValue: false,
	allowBooleanAttributes: true
});

// Used to rebuild the inner XML of <source>/<target> (inline markup preserved).
const innerBuilder = new XMLBuilder({
	ignoreAttributes: false,
	attributeNamePrefix: ATTR_PREFIX,
	preserveOrder: true,
	processEntities: true,
	suppressEmptyNode: true
});

/** A preserveOrder node: one tag key + optional ':@' attribute bag. */
type PoNode = Record<string, unknown> & { ':@'?: Record<string, string> };

function tagOf(node: PoNode): string | undefined {
	for (const k of Object.keys(node)) {
		if (k !== ':@' && k !== '#text') return k;
	}
	return undefined;
}

function attrs(node: PoNode): Record<string, string> {
	const a = node[':@'] as Record<string, string> | undefined;
	if (!a) return {};
	const out: Record<string, string> = {};
	for (const [k, v] of Object.entries(a)) {
		out[k.startsWith(ATTR_PREFIX) ? k.slice(ATTR_PREFIX.length) : k] = String(v);
	}
	return out;
}

function childArray(node: PoNode | undefined, tag: string): PoNode[] | undefined {
	const v = node?.[tag];
	return Array.isArray(v) ? (v as PoNode[]) : undefined;
}

/** Find the first direct child with the given tag name. */
function firstChild(children: PoNode[] | undefined, tag: string): PoNode | undefined {
	return children?.find((c) => tagOf(c) === tag);
}

/** Pure text content (no inline markup) of a node's children. */
function textContent(node: PoNode, tag: string): string {
	const arr = childArray(node, tag);
	if (!arr) return '';
	return arr.map((c) => (typeof c['#text'] === 'string' ? (c['#text'] as string) : '')).join('');
}

/** Extract a source/target value: decoded plain text, or raw inline XML when
 *  the element contains inline markup. */
function extractValue(node: PoNode | undefined, tag: string): { value: string; hasMarkup: boolean } {
	if (!node) return { value: '', hasMarkup: false };
	const arr = childArray(node, tag) ?? [];
	const hasMarkup = arr.some((c) => {
		const t = tagOf(c);
		return t !== undefined && t !== '#text';
	});
	if (hasMarkup) {
		const built = innerBuilder.build(arr);
		return { value: typeof built === 'string' ? built : String(built ?? ''), hasMarkup: true };
	}
	return { value: textContent(node, tag), hasMarkup: false };
}

function collectByTag(children: PoNode[] | undefined, tag: string, into: PoNode[]) {
	if (!children) return;
	for (const c of children) {
		const t = tagOf(c);
		if (t === tag) into.push(c);
		// recurse into <group> (and any container) to flatten nested units
		else if (t === 'group') collectByTag(childArray(c, 'group'), tag, into);
	}
}

const KNOWN_UNIT_ATTRS_12 = new Set(['id', 'resname', 'approved', 'xml:space']);
const KNOWN_UNIT_ATTRS_20 = new Set(['id', 'name']);

function parseV12(fileNode: PoNode): XliffDocument {
	const fa = attrs(fileNode);
	const fileChildren = childArray(fileNode, 'file');
	const body = firstChild(fileChildren, 'body');
	const header = firstChild(fileChildren, 'header');

	const headerNotes: XliffNote[] = [];
	if (header) {
		const hc = childArray(header, 'header');
		for (const c of hc ?? []) {
			if (tagOf(c) === 'note') headerNotes.push(parseNote12(c));
		}
	}

	const rawUnits: PoNode[] = [];
	collectByTag(childArray(body, 'body'), 'trans-unit', rawUnits);

	const units = rawUnits.map((u) => parseUnit12(u));

	const knownFileAttrs = new Set([
		'source-language',
		'target-language',
		'datatype',
		'original',
		'product-name',
		'date'
	]);
	const extraFileAttrs: Record<string, string> = {};
	for (const [k, v] of Object.entries(fa)) {
		if (!knownFileAttrs.has(k)) extraFileAttrs[k] = v;
	}

	return {
		version: '1.2',
		sourceLanguage: fa['source-language'] || 'en',
		targetLanguage: fa['target-language'] || undefined,
		datatype: fa['datatype'] || undefined,
		original: fa['original'] || undefined,
		productName: fa['product-name'] || undefined,
		date: fa['date'] || undefined,
		units,
		headerNotes,
		extraFileAttrs: Object.keys(extraFileAttrs).length ? extraFileAttrs : undefined
	};
}

function parseNote12(noteNode: PoNode): XliffNote {
	const a = attrs(noteNode);
	return {
		text: textContent(noteNode, 'note'),
		from: a['from'] || undefined,
		priority: a['priority'] ? Number(a['priority']) : undefined
	};
}

function parseUnit12(u: PoNode): TransUnit {
	const a = attrs(u);
	const children = childArray(u, 'trans-unit');
	const sourceNode = firstChild(children, 'source');
	const targetNode = firstChild(children, 'target');

	const notes: XliffNote[] = [];
	for (const c of children ?? []) {
		if (tagOf(c) === 'note') notes.push(parseNote12(c));
	}

	const targetAttrs = targetNode ? attrs(targetNode) : {};

	const extraAttrs: Record<string, string> = {};
	for (const [k, v] of Object.entries(a)) {
		if (!KNOWN_UNIT_ATTRS_12.has(k)) extraAttrs[k] = v;
	}

	const src = extractValue(sourceNode, 'source');
	const tgt = targetNode ? extractValue(targetNode, 'target') : undefined;

	return {
		id: a['id'] ?? '',
		resname: a['resname'] || undefined,
		source: src.value,
		sourceHasMarkup: src.hasMarkup || undefined,
		target: tgt?.value,
		targetHasMarkup: tgt?.hasMarkup || undefined,
		state: targetAttrs['state'] || undefined,
		approved: a['approved'] === 'yes' ? true : a['approved'] === 'no' ? false : undefined,
		xmlSpace: (a['xml:space'] as 'preserve' | 'default') || undefined,
		notes,
		extraAttrs: Object.keys(extraAttrs).length ? extraAttrs : undefined
	};
}

function parseV20(root: PoNode): XliffDocument {
	const ra = attrs(root);
	const rootChildren = childArray(root, 'xliff');
	const fileNode = firstChild(rootChildren, 'file');
	const fa = fileNode ? attrs(fileNode) : {};

	const headerNotes: XliffNote[] = [];
	const fileChildren = fileNode ? childArray(fileNode, 'file') : undefined;
	const notesNode = firstChild(fileChildren, 'notes');
	for (const c of childArray(notesNode ?? ({} as PoNode), 'notes') ?? []) {
		if (tagOf(c) === 'note') headerNotes.push(parseNote20(c));
	}

	const rawUnits: PoNode[] = [];
	collectByTag(fileChildren, 'unit', rawUnits);
	const units = rawUnits.map((u) => parseUnit20(u));

	const knownFileAttrs = new Set(['id', 'original']);
	const extraFileAttrs: Record<string, string> = {};
	for (const [k, v] of Object.entries(fa)) {
		if (!knownFileAttrs.has(k)) extraFileAttrs[k] = v;
	}

	return {
		version: '2.0',
		sourceLanguage: ra['srcLang'] || 'en',
		targetLanguage: ra['trgLang'] || undefined,
		original: fa['original'] || undefined,
		fileId: fa['id'] || undefined,
		units,
		headerNotes,
		extraFileAttrs: Object.keys(extraFileAttrs).length ? extraFileAttrs : undefined
	};
}

function parseNote20(noteNode: PoNode): XliffNote {
	const a = attrs(noteNode);
	return {
		text: textContent(noteNode, 'note'),
		category: a['category'] || undefined,
		appliesTo: (a['appliesTo'] as 'source' | 'target') || undefined,
		priority: a['priority'] ? Number(a['priority']) : undefined
	};
}

function parseUnit20(u: PoNode): TransUnit {
	const a = attrs(u);
	const children = childArray(u, 'unit');

	// notes
	const notes: XliffNote[] = [];
	const notesNode = firstChild(children, 'notes');
	for (const c of childArray(notesNode ?? ({} as PoNode), 'notes') ?? []) {
		if (tagOf(c) === 'note') notes.push(parseNote20(c));
	}

	// first segment
	const segment = firstChild(children, 'segment');
	const segChildren = segment ? childArray(segment, 'segment') : undefined;
	const sourceNode = firstChild(segChildren, 'source');
	const targetNode = firstChild(segChildren, 'target');
	const segAttrs = segment ? attrs(segment) : {};

	const extraAttrs: Record<string, string> = {};
	for (const [k, v] of Object.entries(a)) {
		if (!KNOWN_UNIT_ATTRS_20.has(k)) extraAttrs[k] = v;
	}

	const src = extractValue(sourceNode, 'source');
	const tgt = targetNode ? extractValue(targetNode, 'target') : undefined;

	return {
		id: a['id'] ?? '',
		resname: a['name'] || undefined,
		source: src.value,
		sourceHasMarkup: src.hasMarkup || undefined,
		target: tgt?.value,
		targetHasMarkup: tgt?.hasMarkup || undefined,
		state: segAttrs['state'] || undefined,
		notes,
		extraAttrs: Object.keys(extraAttrs).length ? extraAttrs : undefined
	};
}

/** Detect XLIFF version from the root element attributes. */
function detectVersion(root: PoNode): XliffVersion {
	const a = attrs(root);
	if (a['version'] === '2.0' || a['srcLang']) return '2.0';
	return '1.2';
}

/** Parse an XLIFF document string into the unified model. */
export function parseXliff(xml: string): XliffDocument {
	const tree = parser.parse(xml) as PoNode[];
	const root = tree.find((n) => tagOf(n) === 'xliff');
	if (!root) throw new Error('No <xliff> root element found.');
	const version = detectVersion(root);
	if (version === '2.0') return parseV20(root);

	// v1.2: <xliff><file>...
	const rootChildren = childArray(root, 'xliff');
	const fileNode = firstChild(rootChildren, 'file');
	if (!fileNode) throw new Error('No <file> element found in XLIFF 1.2 document.');
	return parseV12(fileNode);
}
