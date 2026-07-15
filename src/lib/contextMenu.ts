import type { Catalog } from './project';
import { app } from './state.svelte';
import { confirmDialog, revealInDir } from './tauri';

/** Native menus need the Tauri runtime; in a plain browser we fall back to nothing. */
const inTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

type Item = { text: string; enabled?: boolean; action?: () => void } | 'separator';

async function popup(items: Item[]) {
	const { Menu, MenuItem, PredefinedMenuItem } = await import('@tauri-apps/api/menu');
	const built = await Promise.all(
		items.map((it) =>
			it === 'separator'
				? PredefinedMenuItem.new({ item: 'Separator' })
				: MenuItem.new({ text: it.text, enabled: it.enabled ?? true, action: it.action })
		)
	);
	const menu = await Menu.new({ items: built });
	await menu.popup();
}

/** Right-click menu for a catalog (sidebar item or editor title). */
export async function showCatalogMenu(cat: Catalog, hooks: { onAddLanguage: () => void }) {
	if (!inTauri) return;
	const fileCount = [cat.source, ...cat.languages].filter((f) => f.exists).length;
	await popup([
		{
			text: 'Add language…',
			action: () => {
				app.activeId = cat.id;
				hooks.onAddLanguage();
			}
		},
		{
			text: 'Reveal in Finder',
			enabled: cat.source.exists,
			action: () => void revealInDir(cat.source.path)
		},
		'separator',
		{
			text: `Move “${cat.base}.${cat.ext}” to Trash…`,
			action: async () => {
				const ok = await confirmDialog(
					fileCount
						? `Move “${cat.base}.${cat.ext}” and its translations to the trash?\n\n${fileCount} file(s) will be moved.`
						: `Remove “${cat.base}.${cat.ext}”? No files exist on disk yet.`,
					'Delete catalog'
				);
				if (ok) await app.deleteCatalog(cat.id);
			}
		}
	]);
}

/** Right-click menu for a single translation file (language pill). */
export async function showLanguageMenu(cat: Catalog, lang: string) {
	if (!inTauri) return;
	const lf = cat.languages.find((l) => l.lang === lang);
	if (!lf) return;
	const name = lf.path.split('/').pop() ?? lf.path;
	await popup([
		{ text: 'Reveal in Finder', enabled: lf.exists, action: () => void revealInDir(lf.path) },
		'separator',
		{
			text: `Move “${name}” to Trash…`,
			action: async () => {
				const ok = await confirmDialog(
					lf.exists
						? `Move “${name}” to the trash?\n\nAll ${lang} translations are removed from this catalog.`
						: `Remove language “${lang}”? Its file has not been saved yet.`,
					'Delete language file'
				);
				if (ok) await app.deleteLanguage(cat.id, lang);
			}
		}
	]);
}

/** Right-click menu for the catalog list background. */
export async function showListMenu(hooks: { onNewCatalog: () => void }) {
	if (!inTauri) return;
	await popup([
		{ text: 'New catalog…', action: hooks.onNewCatalog },
		{
			text: 'Reveal project in Finder',
			enabled: !!app.projectRoot,
			action: () => void revealInDir(app.projectRoot!)
		}
	]);
}
