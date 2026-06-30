<script lang="ts">
	import { onMount } from 'svelte';
	import { app } from '$lib/state.svelte';
	import { pickDirectory } from '$lib/tauri';
	import { KNOWN_LANGUAGES } from '$lib/xliff/typo3';
	import type { XliffVersion } from '$lib/xliff/types';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import CatalogView from '$lib/components/CatalogView.svelte';
	import Toasts from '$lib/components/Toasts.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let settingsOpen = $state(false);

	// --- New catalog modal -------------------------------------------------
	let newOpen = $state(false);
	let nDir = $state('');
	let nBase = $state('locallang');
	let nLang = $state('en');
	let nVersion = $state<XliffVersion>('1.2');

	function openNew() {
		nDir = app.projectRoot ?? '';
		nBase = 'locallang';
		nLang = 'en';
		nVersion = '1.2';
		newOpen = true;
	}
	async function chooseDir() {
		const d = await pickDirectory('Choose location for the new catalog');
		if (d) nDir = d;
	}
	function createCatalog() {
		if (!nDir || !nBase.trim()) {
			app.toast('error', 'Pick a folder and a base name');
			return;
		}
		app.newProject(nDir, nBase.trim(), nLang, nVersion);
		newOpen = false;
	}

	// --- Add language modal ------------------------------------------------
	let langOpen = $state(false);
	let langCode = $state('de');
	function openLang() {
		langCode = 'de';
		langOpen = true;
	}
	function addLang() {
		if (!langCode.trim()) return;
		app.addLanguage(langCode.trim());
		langOpen = false;
	}

	// --- Add unit modal ----------------------------------------------------
	let unitOpen = $state(false);
	let uId = $state('');
	let uSource = $state('');
	function openUnit() {
		uId = '';
		uSource = '';
		unitOpen = true;
	}
	function createUnit() {
		const u = app.addUnit(uId, uSource);
		if (u) {
			unitOpen = false;
			app.toast('success', `Added entry "${u.id}"`);
		}
	}

	// --- Export modal ------------------------------------------------------
	let exportOpen = $state(false);
	let exportText = $state('');
	function openExport() {
		exportText = app.exportActive() ?? '';
		exportOpen = true;
	}
	async function copyExport() {
		await navigator.clipboard.writeText(exportText);
		app.toast('success', 'Copied XML to clipboard');
	}

	onMount(() => {
		// Browser preview (no Tauri): seed a demo catalog when ?demo is present.
		const inTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
		if (!inTauri && location.search.includes('demo')) {
			app.loadDemo();
			return;
		}
		app.initFromCli();
	});

	function onkeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
			e.preventDefault();
			app.saveAll();
		}
	}
</script>

<svelte:window {onkeydown} />

<div class="app-shell" data-tauri-drag-region>
	<Sidebar onNewCatalog={openNew} onSettings={() => (settingsOpen = true)} />
	<main class="content">
		<CatalogView onAddUnit={openUnit} onAddLanguage={openLang} onExport={openExport} />
	</main>
</div>

<Toasts />

<SettingsModal bind:open={settingsOpen} />

<!-- New catalog -->
<Modal bind:open={newOpen} title="New translation catalog">
	<label class="f">
		<span>Folder</span>
		<div class="pickrow">
			<input class="mac-input mono" placeholder="/path/to/Resources/Private/Language" bind:value={nDir} />
			<button class="mac-btn" onclick={chooseDir}><Icon name="folder" size={14} /></button>
		</div>
	</label>
	<label class="f">
		<span>Base name</span>
		<input class="mac-input mono" bind:value={nBase} />
		<small>Creates <code>{nBase || 'name'}.xlf</code></small>
	</label>
	<div class="frow">
		<label class="f">
			<span>Source language</span>
			<select class="mac-input" bind:value={nLang}>
				{#each KNOWN_LANGUAGES as l}<option value={l.code}>{l.label} ({l.code})</option>{/each}
			</select>
		</label>
		<label class="f">
			<span>XLIFF version</span>
			<select class="mac-input" bind:value={nVersion}>
				<option value="1.2">1.2 (TYPO3 default)</option>
				<option value="2.0">2.0</option>
			</select>
		</label>
	</div>
	{#snippet footer()}
		<button class="mac-btn" onclick={() => (newOpen = false)}>Cancel</button>
		<button class="mac-btn mac-btn-primary" onclick={createCatalog}>Create</button>
	{/snippet}
</Modal>

<!-- Add language -->
<Modal bind:open={langOpen} title="Add language">
	<label class="f">
		<span>Language key</span>
		<input class="mac-input mono" list="langlist" bind:value={langCode} />
		<datalist id="langlist">
			{#each KNOWN_LANGUAGES as l}<option value={l.code}>{l.label}</option>{/each}
		</datalist>
		<small>Creates <code>{langCode || 'xx'}.{app.active?.base}.xlf</code></small>
	</label>
	{#snippet footer()}
		<button class="mac-btn" onclick={() => (langOpen = false)}>Cancel</button>
		<button class="mac-btn mac-btn-primary" onclick={addLang}>Add</button>
	{/snippet}
</Modal>

<!-- Add unit -->
<Modal bind:open={unitOpen} title="New entry">
	<label class="f">
		<span>ID / key</span>
		<input class="mac-input mono" placeholder="my.label.key" bind:value={uId} />
	</label>
	<label class="f">
		<span>Source text ({app.active?.sourceLanguage})</span>
		<textarea class="mac-input" rows="3" bind:value={uSource}></textarea>
	</label>
	{#snippet footer()}
		<button class="mac-btn" onclick={() => (unitOpen = false)}>Cancel</button>
		<button class="mac-btn mac-btn-primary" onclick={createUnit}>Add entry</button>
	{/snippet}
</Modal>

<!-- Export preview -->
<Modal bind:open={exportOpen} title="XML preview">
	<textarea class="mac-input mono export" readonly rows="18" value={exportText}></textarea>
	{#snippet footer()}
		<button class="mac-btn" onclick={() => (exportOpen = false)}>Close</button>
		<button class="mac-btn mac-btn-primary" onclick={copyExport}><Icon name="copy" size={14} /> Copy</button>
	{/snippet}
</Modal>

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
	.f {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 12px;
		font-weight: 600;
		color: var(--text-muted);
		flex: 1;
	}
	.f small {
		font-weight: 400;
		font-size: 11px;
	}
	.frow {
		display: flex;
		gap: 12px;
	}
	.pickrow {
		display: flex;
		gap: 6px;
	}
	.mono {
		font-family: 'SF Mono', ui-monospace, Menlo, monospace;
		font-size: 12px;
	}
	.export {
		width: 100%;
		font-size: 11px;
		line-height: 1.5;
		white-space: pre;
		overflow: auto;
	}
</style>
