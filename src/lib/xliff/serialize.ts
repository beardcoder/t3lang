import type { TransUnit, XliffDocument, XliffNote } from './types';

// Serialises the unified model back to a clean, TYPO3-conventional XLIFF string.
// Inner content of <source>/<target> is stored as already entity-encoded XML
// (see parse.ts), so it is embedded verbatim; attribute values and note text are
// escaped here.

export interface SerializeOptions {
	/** String used for one indentation level. Defaults to a tab. */
	indent?: string;
}

function escAttr(v: string): string {
	return v
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function escText(v: string): string {
	return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function attr(name: string, value: string | undefined): string {
	return value === undefined || value === '' ? '' : ` ${name}="${escAttr(value)}"`;
}

/** Emit a source/target body: raw inline markup verbatim, plain text escaped. */
function body(value: string, hasMarkup: boolean | undefined): string {
	return hasMarkup ? value : escText(value);
}

const TYPO3_NS = 'https://typo3.org/schemas/xliff';

function serializeV12(doc: XliffDocument, ind: (level: number) => string): string {
	const isTranslation = !!doc.targetLanguage;
	const lines: string[] = [];
	lines.push('<?xml version="1.0" encoding="UTF-8"?>');
	lines.push(`<xliff version="1.2" xmlns:t3="${TYPO3_NS}">`);

	let fileAttrs = '';
	fileAttrs += attr('source-language', doc.sourceLanguage);
	if (isTranslation) fileAttrs += attr('target-language', doc.targetLanguage);
	fileAttrs += attr('datatype', doc.datatype ?? 'plaintext');
	fileAttrs += attr('original', doc.original);
	fileAttrs += attr('date', doc.date);
	fileAttrs += attr('product-name', doc.productName);
	for (const [k, v] of Object.entries(doc.extraFileAttrs ?? {})) fileAttrs += attr(k, v);

	lines.push(`${ind(1)}<file${fileAttrs}>`);

	if (doc.headerNotes.length) {
		lines.push(`${ind(2)}<header>`);
		for (const n of doc.headerNotes) lines.push(`${ind(3)}${noteXml12(n)}`);
		lines.push(`${ind(2)}</header>`);
	} else {
		lines.push(`${ind(2)}<header/>`);
	}

	lines.push(`${ind(2)}<body>`);
	for (const u of doc.units) lines.push(...unitXml12(u, isTranslation, ind));
	lines.push(`${ind(2)}</body>`);

	lines.push(`${ind(1)}</file>`);
	lines.push('</xliff>');
	return lines.join('\n') + '\n';
}

function noteXml12(n: XliffNote): string {
	let a = '';
	a += attr('from', n.from);
	if (n.priority !== undefined) a += ` priority="${n.priority}"`;
	return `<note${a}>${escText(n.text)}</note>`;
}

function unitXml12(u: TransUnit, isTranslation: boolean, ind: (level: number) => string): string[] {
	const out: string[] = [];
	let a = '';
	a += attr('id', u.id);
	a += attr('resname', u.resname);
	if (u.approved !== undefined) a += ` approved="${u.approved ? 'yes' : 'no'}"`;
	if (u.xmlSpace) a += ` xml:space="${u.xmlSpace}"`;
	for (const [k, v] of Object.entries(u.extraAttrs ?? {})) a += attr(k, v);

	out.push(`${ind(3)}<trans-unit${a}>`);
	out.push(`${ind(4)}<source>${body(u.source, u.sourceHasMarkup)}</source>`);
	if (isTranslation && u.target !== undefined) {
		const stateAttr = u.state ? ` state="${escAttr(u.state)}"` : '';
		out.push(`${ind(4)}<target${stateAttr}>${body(u.target, u.targetHasMarkup)}</target>`);
	}
	for (const n of u.notes) out.push(`${ind(4)}${noteXml12(n)}`);
	out.push(`${ind(3)}</trans-unit>`);
	return out;
}

function serializeV20(doc: XliffDocument, ind: (level: number) => string): string {
	const isTranslation = !!doc.targetLanguage;
	const lines: string[] = [];
	lines.push('<?xml version="1.0" encoding="UTF-8"?>');
	let rootAttrs = `xmlns="urn:oasis:names:tc:xliff:document:2.0" version="2.0"`;
	rootAttrs += ` srcLang="${escAttr(doc.sourceLanguage)}"`;
	if (isTranslation) rootAttrs += ` trgLang="${escAttr(doc.targetLanguage!)}"`;
	lines.push(`<xliff ${rootAttrs}>`);

	let fileAttrs = '';
	fileAttrs += attr('id', doc.fileId ?? 'f1');
	fileAttrs += attr('original', doc.original);
	for (const [k, v] of Object.entries(doc.extraFileAttrs ?? {})) fileAttrs += attr(k, v);
	lines.push(`${ind(1)}<file${fileAttrs}>`);

	if (doc.headerNotes.length) {
		lines.push(`${ind(2)}<notes>`);
		for (const n of doc.headerNotes) lines.push(`${ind(3)}${noteXml20(n)}`);
		lines.push(`${ind(2)}</notes>`);
	}

	for (const u of doc.units) lines.push(...unitXml20(u, isTranslation, ind));

	lines.push(`${ind(1)}</file>`);
	lines.push('</xliff>');
	return lines.join('\n') + '\n';
}

function noteXml20(n: XliffNote): string {
	let a = '';
	a += attr('category', n.category);
	a += attr('appliesTo', n.appliesTo);
	if (n.priority !== undefined) a += ` priority="${n.priority}"`;
	return `<note${a}>${escText(n.text)}</note>`;
}

function unitXml20(u: TransUnit, isTranslation: boolean, ind: (level: number) => string): string[] {
	const out: string[] = [];
	let a = '';
	a += attr('id', u.id);
	a += attr('name', u.resname);
	for (const [k, v] of Object.entries(u.extraAttrs ?? {})) a += attr(k, v);
	out.push(`${ind(2)}<unit${a}>`);

	if (u.notes.length) {
		out.push(`${ind(3)}<notes>`);
		for (const n of u.notes) out.push(`${ind(4)}${noteXml20(n)}`);
		out.push(`${ind(3)}</notes>`);
	}

	const stateAttr = isTranslation && u.state ? ` state="${escAttr(u.state)}"` : '';
	out.push(`${ind(3)}<segment${stateAttr}>`);
	out.push(`${ind(4)}<source>${body(u.source, u.sourceHasMarkup)}</source>`);
	if (isTranslation && u.target !== undefined) {
		out.push(`${ind(4)}<target>${body(u.target, u.targetHasMarkup)}</target>`);
	}
	out.push(`${ind(3)}</segment>`);
	out.push(`${ind(2)}</unit>`);
	return out;
}

export function serializeXliff(doc: XliffDocument, options: SerializeOptions = {}): string {
	const unit = options.indent ?? '\t';
	const ind = (level: number) => unit.repeat(level);
	return doc.version === '2.0' ? serializeV20(doc, ind) : serializeV12(doc, ind);
}
