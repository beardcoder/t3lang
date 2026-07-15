<script lang="ts">
	// Dev-only preview harness with mock data, for checking the UI in a plain
	// browser (where the Tauri backend is unavailable). Not linked anywhere.
	import { dev } from '$app/environment';
	import { onMount } from 'svelte';
	import { app } from '$lib/state.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import CatalogView from '$lib/components/CatalogView.svelte';

	onMount(() => {
		if (!dev || app.catalogs.length) return;
		app.newProject('/tmp/demo/Resources/Private/Language', 'locallang', 'en', '1.2');
		app.addLanguage('de');
		app.addLanguage('fr');
		app.addLanguage('da');
		const texts: [string, string, string][] = [
			['header.title', 'Welcome to our site', 'Willkommen auf unserer Seite'],
			['header.subtitle', 'Everything in one place', 'Alles an einem Ort'],
			['button.save', 'Save changes', 'Änderungen sichern'],
			['button.cancel', 'Cancel', ''],
			['footer.imprint', 'Imprint', 'Impressum'],
			['footer.privacy', 'Privacy policy', 'Datenschutz']
		];
		for (const [id, src, de] of texts) {
			const u = app.addUnit(id, src);
			if (u && de) u.targets['de'] = { value: de, notes: [], state: 'translated' };
			if (u) u.targets['fr'] = { value: de ? 'Bonjour' : '', notes: [] };
		}
		app.newProject('/tmp/demo/Configuration/Sets/Site', 'labels', 'en', '2.0');
		app.addLanguage('de');
		const u = app.addUnit('site.name', 'My site');
		if (u) u.targets['de'] = { value: 'Meine Seite', notes: [] };
		app.activeId = app.catalogs[0].id;
		app.toasts.length = 0;
	});
</script>

<div class="app-shell" data-tauri-drag-region>
	<Sidebar onNewCatalog={() => {}} onSettings={() => {}} onAddLanguage={() => {}} />
	<main class="content">
		<CatalogView onAddUnit={() => {}} onAddLanguage={() => {}} onExport={() => {}} />
	</main>
</div>

<style>
	.app-shell {
		display: flex;
		gap: var(--gap);
		padding: var(--gap);
		height: 100vh;
		overflow: hidden;
	}
	.content {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		min-width: 0;
		min-height: 0;
	}
</style>
