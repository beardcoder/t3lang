import type { TransUnit, XliffDocument, XliffNote } from './types';

// Serialises the unified model back to a clean, TYPO3-conventional XLIFF string.
// Inner content of <source>/<target> is stored as already entity-encoded XML
// (see parse.ts), so it is embedded verbatim; attribute values and note text are
// escaped here.

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

function serializeV12(doc: XliffDocument): string {
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

	lines.push(`\t<file${fileAttrs}>`);

	if (doc.headerNotes.length) {
		lines.push('\t\t<header>');
		for (const n of doc.headerNotes) lines.push(`\t\t\t${noteXml12(n)}`);
		lines.push('\t\t</header>');
	} else {
		lines.push('\t\t<header/>');
	}

	lines.push('\t\t<body>');
	for (const u of doc.units) lines.push(...unitXml12(u, isTranslation));
	lines.push('\t\t</body>');

	lines.push('\t</file>');
	lines.push('</xliff>');
	return lines.join('\n') + '\n';
}

function noteXml12(n: XliffNote): string {
	let a = '';
	a += attr('from', n.from);
	if (n.priority !== undefined) a += ` priority="${n.priority}"`;
	return `<note${a}>${escText(n.text)}</note>`;
}

function unitXml12(u: TransUnit, isTranslation: boolean): string[] {
	const out: string[] = [];
	let a = '';
	a += attr('id', u.id);
	a += attr('resname', u.resname);
	if (u.approved !== undefined) a += ` approved="${u.approved ? 'yes' : 'no'}"`;
	if (u.xmlSpace) a += ` xml:space="${u.xmlSpace}"`;
	for (const [k, v] of Object.entries(u.extraAttrs ?? {})) a += attr(k, v);

	out.push(`\t\t\t<trans-unit${a}>`);
	out.push(`\t\t\t\t<source>${body(u.source, u.sourceHasMarkup)}</source>`);
	if (isTranslation && u.target !== undefined) {
		const stateAttr = u.state ? ` state="${escAttr(u.state)}"` : '';
		out.push(`\t\t\t\t<target${stateAttr}>${body(u.target, u.targetHasMarkup)}</target>`);
	}
	for (const n of u.notes) out.push(`\t\t\t\t${noteXml12(n)}`);
	out.push('\t\t\t</trans-unit>');
	return out;
}

function serializeV20(doc: XliffDocument): string {
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
	lines.push(`\t<file${fileAttrs}>`);

	if (doc.headerNotes.length) {
		lines.push('\t\t<notes>');
		for (const n of doc.headerNotes) lines.push(`\t\t\t${noteXml20(n)}`);
		lines.push('\t\t</notes>');
	}

	for (const u of doc.units) lines.push(...unitXml20(u, isTranslation));

	lines.push('\t</file>');
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

function unitXml20(u: TransUnit, isTranslation: boolean): string[] {
	const out: string[] = [];
	let a = '';
	a += attr('id', u.id);
	a += attr('name', u.resname);
	for (const [k, v] of Object.entries(u.extraAttrs ?? {})) a += attr(k, v);
	out.push(`\t\t<unit${a}>`);

	if (u.notes.length) {
		out.push('\t\t\t<notes>');
		for (const n of u.notes) out.push(`\t\t\t\t${noteXml20(n)}`);
		out.push('\t\t\t</notes>');
	}

	const stateAttr = isTranslation && u.state ? ` state="${escAttr(u.state)}"` : '';
	out.push(`\t\t\t<segment${stateAttr}>`);
	out.push(`\t\t\t\t<source>${body(u.source, u.sourceHasMarkup)}</source>`);
	if (isTranslation && u.target !== undefined) {
		out.push(`\t\t\t\t<target>${body(u.target, u.targetHasMarkup)}</target>`);
	}
	out.push('\t\t\t</segment>');
	out.push('\t\t</unit>');
	return out;
}

export function serializeXliff(doc: XliffDocument): string {
	return doc.version === '2.0' ? serializeV20(doc) : serializeV12(doc);
}
