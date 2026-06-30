// Unified XLIFF data model covering XLIFF 1.2, XLIFF 2.0 and TYPO3 specifics.
// The same in-memory model is used for both versions; the version is stored per
// file and drives parsing/serialisation.

export type XliffVersion = '1.2' | '2.0';

/** Translation state. v1.2 uses many values on <target state="...">,
 *  v2.0 uses a constrained set on <segment state="...">. We keep the raw
 *  string and offer well-known constants in the UI. */
export type TranslationState = string;

export interface XliffNote {
	text: string;
	/** v1.2 `from`, v2.0 has no direct equivalent (kept as appliesTo/category). */
	from?: string;
	/** v1.2 `priority` (1 = highest). */
	priority?: number;
	/** v2.0 note category / v1.2 annotates */
	category?: string;
	/** Which part the note applies to. */
	appliesTo?: 'source' | 'target';
}

/** A single translatable entry, normalised across versions. */
export interface TransUnit {
	/** Stable identifier (trans-unit/@id in v1.2, unit/@id in v2.0). */
	id: string;
	/** v1.2 resname (human-readable key). */
	resname?: string;
	/** Source value. Plain text (decoded) unless `sourceHasMarkup`, then raw inline XML. */
	source: string;
	/** True when `source` contains inline XLIFF markup (e.g. <g>, <ph>, <pc>). */
	sourceHasMarkup?: boolean;
	/** Target value for the translated language (undefined in source files). */
	target?: string;
	/** True when `target` contains inline XLIFF markup. */
	targetHasMarkup?: boolean;
	/** Target translation state. */
	state?: TranslationState;
	/** v1.2 `approved="yes"`. */
	approved?: boolean;
	/** xml:space — TYPO3 commonly uses "preserve". */
	xmlSpace?: 'preserve' | 'default';
	notes: XliffNote[];
	/** Preserved unknown attributes for loss-less round-tripping. */
	extraAttrs?: Record<string, string>;
}

/** A parsed XLIFF document. */
export interface XliffDocument {
	version: XliffVersion;
	sourceLanguage: string;
	targetLanguage?: string;
	/** v1.2 file/@datatype (TYPO3: "plaintext"). */
	datatype?: string;
	/** v1.2 file/@original / v2.0 file/@original. */
	original?: string;
	/** TYPO3 file/@product-name (v1.2) */
	productName?: string;
	/** v1.2 file/@date */
	date?: string;
	/** v2.0 file/@id */
	fileId?: string;
	units: TransUnit[];
	/** File-level notes (v1.2 header / v2.0 file notes). */
	headerNotes: XliffNote[];
	/** Preserved unknown file-level attributes. */
	extraFileAttrs?: Record<string, string>;
}

/** Well-known TYPO3 / XLIFF target states for the dropdown. */
export const XLIFF_12_STATES = [
	'new',
	'needs-translation',
	'needs-l10n',
	'needs-adaptation',
	'translated',
	'needs-review-translation',
	'needs-review-l10n',
	'needs-review-adaptation',
	'final',
	'signed-off'
] as const;

export const XLIFF_20_STATES = ['initial', 'translated', 'reviewed', 'final'] as const;

export function statesFor(version: XliffVersion): readonly string[] {
	return version === '2.0' ? XLIFF_20_STATES : XLIFF_12_STATES;
}
