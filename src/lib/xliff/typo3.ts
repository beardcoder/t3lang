// TYPO3 XLIFF file-naming conventions.
//
//   locallang.xlf          -> source/default language file (no prefix, source-language="en")
//   de.locallang.xlf       -> German translation
//   pt_BR.locallang.xlf    -> Brazilian Portuguese translation
//
// Translations use a "<languageKey>." prefix in front of the source file name.

export interface ParsedXliffName {
	/** Language key prefix, or null for the source/default file. */
	lang: string | null;
	/** Base name without the language prefix and without the `.xlf` extension. */
	base: string;
	/** Original extension (xlf / xliff). */
	ext: string;
}

const NAME_RE = /^(?:([A-Za-z]{2,3}(?:[_-][A-Za-z]{2,4})?)\.)?(.+)\.(xlf|xliff)$/;

/** Parse a TYPO3 XLIFF filename into its language prefix and base name. */
export function parseXliffName(filename: string): ParsedXliffName | null {
	const m = NAME_RE.exec(filename);
	if (!m) return null;
	const [, lang, base, ext] = m;
	// A two/three letter token is only treated as a language prefix when it is a
	// plausible language key; otherwise it is part of the base name.
	if (lang && !isLikelyLanguageKey(lang)) {
		return { lang: null, base: `${lang}.${base}`, ext };
	}
	return { lang: lang ?? null, base, ext };
}

/** Build a TYPO3 filename for the given base + language (null = source file). */
export function buildXliffName(base: string, lang: string | null, ext = 'xlf'): string {
	return lang ? `${lang}.${base}.${ext}` : `${base}.${ext}`;
}

function isLikelyLanguageKey(token: string): boolean {
	const lower = token.toLowerCase().replace('-', '_');
	const primary = lower.split('_')[0];
	return KNOWN_LANGUAGES.some((l) => l.code === primary) || /^[a-z]{2,3}$/.test(primary);
}

export interface LanguageInfo {
	code: string;
	label: string;
}

/** A practical set of languages for the picker (TYPO3 language keys). */
export const KNOWN_LANGUAGES: LanguageInfo[] = [
	{ code: 'en', label: 'English' },
	{ code: 'de', label: 'German' },
	{ code: 'fr', label: 'French' },
	{ code: 'es', label: 'Spanish' },
	{ code: 'it', label: 'Italian' },
	{ code: 'pt', label: 'Portuguese' },
	{ code: 'pt_BR', label: 'Portuguese (Brazil)' },
	{ code: 'nl', label: 'Dutch' },
	{ code: 'pl', label: 'Polish' },
	{ code: 'ru', label: 'Russian' },
	{ code: 'cs', label: 'Czech' },
	{ code: 'sk', label: 'Slovak' },
	{ code: 'da', label: 'Danish' },
	{ code: 'sv', label: 'Swedish' },
	{ code: 'no', label: 'Norwegian' },
	{ code: 'fi', label: 'Finnish' },
	{ code: 'hu', label: 'Hungarian' },
	{ code: 'ro', label: 'Romanian' },
	{ code: 'bg', label: 'Bulgarian' },
	{ code: 'el', label: 'Greek' },
	{ code: 'tr', label: 'Turkish' },
	{ code: 'uk', label: 'Ukrainian' },
	{ code: 'hr', label: 'Croatian' },
	{ code: 'sl', label: 'Slovenian' },
	{ code: 'sr', label: 'Serbian' },
	{ code: 'ja', label: 'Japanese' },
	{ code: 'zh', label: 'Chinese' },
	{ code: 'zh_CN', label: 'Chinese (Simplified)' },
	{ code: 'zh_TW', label: 'Chinese (Traditional)' },
	{ code: 'ko', label: 'Korean' },
	{ code: 'ar', label: 'Arabic' },
	{ code: 'he', label: 'Hebrew' },
	{ code: 'fa', label: 'Persian' },
	{ code: 'hi', label: 'Hindi' },
	{ code: 'th', label: 'Thai' },
	{ code: 'vi', label: 'Vietnamese' },
	{ code: 'id', label: 'Indonesian' },
	{ code: 'ms', label: 'Malay' },
	{ code: 'ca', label: 'Catalan' },
	{ code: 'et', label: 'Estonian' },
	{ code: 'lv', label: 'Latvian' },
	{ code: 'lt', label: 'Lithuanian' }
];

export function languageLabel(code: string): string {
	const found = KNOWN_LANGUAGES.find((l) => l.code === code);
	return found ? `${found.label} (${code})` : code;
}
