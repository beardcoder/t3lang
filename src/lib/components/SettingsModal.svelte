<script lang="ts">
	import Modal from './Modal.svelte';
	import Icon from './Icon.svelte';
	import { settings } from '$lib/settings.svelte';
	import { app } from '$lib/state.svelte';
	import { installCli } from '$lib/tauri';

	let { open = $bindable(false) }: { open: boolean } = $props();

	let cliState = $state<'idle' | 'working' | 'done' | 'error'>('idle');
	let cliMessage = $state('');

	async function doInstallCli() {
		cliState = 'working';
		try {
			const path = await installCli();
			cliState = 'done';
			cliMessage = path;
		} catch (e) {
			cliState = 'error';
			cliMessage = String(e);
		}
	}

	// Live preview of the chosen indentation.
	const preview = $derived(
		[
			'<trans-unit id="example">',
			`${settings.indentUnit}<source>Hello</source>`,
			`${settings.indentUnit}<target>Hallo</target>`,
			'</trans-unit>'
		].join('\n')
	);
</script>

<Modal bind:open title="Settings">
	<section>
		<h3>Indentation</h3>
		<p class="hint">How saved <code>.xlf</code> files are indented.</p>
		<div class="seg">
			<button class:active={settings.indentStyle === 'tab'} onclick={() => settings.setIndentStyle('tab')}>
				Tabs
			</button>
			<button class:active={settings.indentStyle === 'space'} onclick={() => settings.setIndentStyle('space')}>
				Spaces
			</button>
		</div>
		{#if settings.indentStyle === 'space'}
			<div class="sizes">
				{#each [2, 4, 8] as n}
					<button class="size" class:active={settings.indentSize === n} onclick={() => settings.setIndentSize(n)}>
						{n}
					</button>
				{/each}
			</div>
		{/if}
		<pre class="preview">{preview}</pre>
	</section>

	<section>
		<h3>Command line</h3>
		<p class="hint">Install a <code>t3lang</code> command so you can run <code>t3lang /path/to/folder</code> from the terminal.</p>
		<div class="cli">
			<button class="mac-btn mac-btn-primary" onclick={doInstallCli} disabled={cliState === 'working'}>
				<Icon name="terminal" size={14} />
				{cliState === 'working' ? 'Installing…' : 'Install command line tool'}
			</button>
			{#if cliState === 'done'}
				<p class="ok">Installed at <code>{cliMessage}</code>. If <code>t3lang</code> isn't found, add that folder to your <code>PATH</code>.</p>
			{:else if cliState === 'error'}
				<p class="err">{cliMessage}</p>
			{/if}
		</div>
	</section>

	<section>
		<h3>Recent projects</h3>
		<p class="hint">{app.recents.length} remembered.</p>
		<button class="mac-btn" onclick={() => settings.clearRecents()} disabled={app.recents.length === 0}>
			<Icon name="trash" size={13} /> Clear recent projects
		</button>
	</section>

	<p class="version">t3lang v3.1.0</p>

	{#snippet footer()}
		<button class="mac-btn mac-btn-primary" onclick={() => (open = false)}>Done</button>
	{/snippet}
</Modal>

<style>
	section {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding-bottom: 14px;
		border-bottom: 0.5px solid var(--border-soft);
	}
	h3 {
		font-size: 12px;
		font-weight: 700;
		margin: 0;
	}
	.hint {
		font-size: 11.5px;
		color: var(--text-muted);
		margin: 0;
		line-height: 1.5;
	}
	code {
		font-family: var(--font-mono);
		font-size: 0.92em;
		background: var(--surface-hover);
		padding: 1px 5px;
		border-radius: 4px;
	}
	.seg {
		display: inline-flex;
		gap: 2px;
		background: var(--surface-raised);
		border: 0.5px solid var(--border-soft);
		border-radius: 999px;
		padding: 2.5px;
		width: fit-content;
	}
	.seg button {
		border: none;
		background: transparent;
		border-radius: 999px;
		padding: 5px 16px;
		font-size: 12px;
		font-weight: 600;
		color: var(--text-strong);
		cursor: default;
	}
	.seg button.active {
		background: var(--surface-content);
		color: var(--mac-accent);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
	}
	.sizes {
		display: flex;
		gap: 6px;
	}
	.size {
		width: 34px;
		height: 28px;
		border-radius: 9px;
		border: 0.5px solid var(--border-strong);
		background: var(--surface-content);
		font-size: 12px;
		font-weight: 600;
		color: var(--text-strong);
		cursor: default;
	}
	.size.active {
		background: var(--mac-accent-solid);
		border-color: transparent;
		color: var(--on-accent);
	}
	.preview {
		margin: 2px 0 0;
		padding: 10px 12px;
		background: var(--surface-raised);
		border: 0.5px solid var(--border-soft);
		border-radius: 8px;
		font-family: var(--font-mono);
		font-size: 11px;
		line-height: 1.55;
		white-space: pre;
		overflow-x: auto;
		color: var(--text-strong);
		tab-size: 4;
	}
	.cli {
		display: flex;
		flex-direction: column;
		gap: 7px;
		align-items: flex-start;
	}
	.ok {
		font-size: 11px;
		color: var(--ok);
		margin: 0;
		line-height: 1.5;
	}
	.err {
		font-size: 11px;
		color: var(--danger);
		margin: 0;
		line-height: 1.5;
	}
	section:last-of-type {
		border-bottom: none;
	}
	.version {
		font-size: 11px;
		color: var(--text-muted);
		text-align: center;
		margin: 0;
	}
</style>
