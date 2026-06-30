<script lang="ts">
	import { app } from '$lib/state.svelte';
	import type { Catalog } from '$lib/project';
	import Icon from './Icon.svelte';

	let { onNewCatalog }: { onNewCatalog: () => void } = $props();

	let filter = $state('');
	let collapsed = $state<Record<string, boolean>>({});

	const groups = $derived.by(() => {
		const q = filter.trim().toLowerCase();
		const map = new Map<string, Catalog[]>();
		for (const c of app.catalogs) {
			if (q && !(`${c.relDir}/${c.base}`.toLowerCase().includes(q))) continue;
			const dir = c.relDir || '·';
			(map.get(dir) ?? map.set(dir, []).get(dir)!).push(c);
		}
		return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
	});

	// Average translation completeness across all languages of a catalog.
	function completeness(cat: Catalog): number {
		if (cat.languages.length === 0 || cat.units.length === 0) return 0;
		let done = 0;
		for (const lf of cat.languages)
			done += cat.units.filter((u) => (u.targets[lf.lang]?.value ?? '').trim()).length;
		return Math.round((done / (cat.languages.length * cat.units.length)) * 100);
	}
</script>

<aside class="sidebar">
	<div class="topspace" data-tauri-drag-region></div>

	<div class="brand" data-tauri-drag-region>
		<div class="logo"><Icon name="globe" size={16} /></div>
		<div class="brand-text">
			<strong>t3lang</strong>
			<span>XLIFF Manager</span>
		</div>
	</div>

	<div class="actions no-drag">
		<button class="mac-btn mac-btn-primary full" onclick={() => app.openProject()}>
			<Icon name="folder" size={14} /> Open project
		</button>
		<div class="row">
			<button class="mac-btn" onclick={() => app.openSingleFile()} title="Open a single XLIFF file">
				<Icon name="file" size={14} /> File
			</button>
			<button class="mac-btn" onclick={onNewCatalog} title="Create a new catalog">
				<Icon name="plus" size={14} /> New
			</button>
		</div>
	</div>

	{#if app.catalogs.length > 3}
		<div class="catfilter no-drag">
			<Icon name="search" size={13} />
			<input placeholder="Filter catalogs…" bind:value={filter} />
		</div>
	{/if}

	<nav class="list no-drag">
		{#if app.catalogs.length === 0}
			<div class="empty">
				<Icon name="folder" size={22} />
				<p>No catalogs open.<br />Open a project to begin.</p>
			</div>
		{/if}

		{#each groups as [dir, cats] (dir)}
			<div class="group">
				<button class="group-label" onclick={() => (collapsed[dir] = !collapsed[dir])}>
					<span class="chev" class:open={!collapsed[dir]}><Icon name="chevron" size={11} /></span>
					<span class="dir" title={dir}>{dir === '·' ? 'root' : dir}</span>
					<span class="gcount">{cats.length}</span>
				</button>

				{#if !collapsed[dir]}
					<div class="items">
						{#each cats as cat (cat.id)}
							<button
								class="item"
								class:active={cat.id === app.activeId}
								onclick={() => (app.activeId = cat.id)}
							>
								<Icon name="file" size={14} />
								<span class="info">
									<span class="name">{cat.base}<span class="ext">.{cat.ext}</span></span>
									<span class="sub">{cat.version} · {cat.languages.length + 1} languages</span>
								</span>
								{#if cat.languages.length}
									<span class="pct" title="{completeness(cat)}% translated">{completeness(cat)}%</span>
								{/if}
								{#if cat.dirty}<span class="dot"></span>{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</nav>

	<div class="footer no-drag">
		{#if app.projectName}
			<span class="proj" title={app.projectRoot ?? ''}><Icon name="folder" size={12} /> {app.projectName}</span>
		{:else}
			<span class="proj muted">No project</span>
		{/if}
		{#if app.dirtyCount > 0}
			<button class="mac-btn save-all" onclick={() => app.saveAll()} title="Save all changed catalogs (⌘S)">
				<Icon name="save" size={13} /> Save all ({app.dirtyCount})
			</button>
		{/if}
	</div>
</aside>

<style>
	.sidebar {
		width: var(--sidebar-w);
		flex-shrink: 0;
		background: var(--surface-sidebar);
		backdrop-filter: saturate(180%) blur(30px);
		-webkit-backdrop-filter: saturate(180%) blur(30px);
		border: 1px solid var(--island-border);
		border-radius: var(--island-radius);
		box-shadow: var(--island-shadow);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.topspace {
		height: 44px;
		flex-shrink: 0;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 2px 14px 12px;
	}
	.logo {
		width: 30px;
		height: 30px;
		border-radius: 9px;
		display: grid;
		place-items: center;
		color: white;
		background: linear-gradient(160deg, var(--mac-accent), color-mix(in srgb, var(--mac-accent) 55%, #8a5cf6));
		box-shadow: 0 3px 8px var(--mac-accent-weak);
		flex-shrink: 0;
	}
	.brand-text {
		display: flex;
		flex-direction: column;
		line-height: 1.2;
	}
	.brand-text strong {
		font-size: 14px;
		font-weight: 700;
		letter-spacing: -0.01em;
	}
	.brand-text span {
		font-size: 10.5px;
		color: var(--text-muted);
	}

	.actions {
		padding: 0 12px 10px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.full {
		justify-content: center;
		width: 100%;
	}
	.row {
		display: flex;
		gap: 6px;
	}
	.row .mac-btn {
		flex: 1;
		justify-content: center;
	}

	.catfilter {
		position: relative;
		display: flex;
		align-items: center;
		margin: 0 12px 8px;
	}
	.catfilter :global(svg) {
		position: absolute;
		left: 9px;
		color: var(--text-muted);
		pointer-events: none;
	}
	.catfilter input {
		width: 100%;
		border: 1px solid var(--border-soft);
		background: var(--surface-content);
		border-radius: 7px;
		padding: 5px 9px 5px 28px;
		font-size: 12px;
		color: var(--text-strong);
	}

	.list {
		flex: 1;
		overflow-y: auto;
		padding: 4px 8px 12px;
	}
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		color: var(--text-muted);
		text-align: center;
		margin-top: 36px;
		font-size: 12px;
		line-height: 1.6;
	}
	.empty p {
		margin: 0;
	}

	.group {
		margin-bottom: 4px;
	}
	.group-label {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 5px 6px;
		border: none;
		background: none;
		cursor: default;
		font-size: 10.5px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		border-radius: 6px;
	}
	.group-label:hover {
		background: var(--border-soft);
	}
	.chev {
		display: inline-flex;
		transition: transform 0.15s ease;
	}
	.chev.open {
		transform: rotate(90deg);
	}
	.dir {
		flex: 1;
		text-align: left;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.gcount {
		font-size: 10px;
		background: var(--border-soft);
		border-radius: 99px;
		padding: 0 6px;
		color: var(--text-muted);
	}
	.items {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 2px 0;
	}
	.item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 7px 9px;
		border-radius: 7px;
		border: none;
		background: transparent;
		color: var(--text-strong);
		cursor: default;
		text-align: left;
		transition: background 0.08s ease;
	}
	.item :global(svg) {
		color: var(--text-muted);
		flex-shrink: 0;
	}
	.item:hover {
		background: var(--surface-hover);
	}
	.item.active {
		background: var(--mac-accent);
		color: white;
	}
	.item.active :global(svg) {
		color: rgba(255, 255, 255, 0.85);
	}
	.info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		line-height: 1.25;
	}
	.name {
		font-size: 12.5px;
		font-weight: 500;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.ext {
		opacity: 0.55;
	}
	.sub {
		font-size: 10px;
		color: var(--text-muted);
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.item.active .sub {
		color: rgba(255, 255, 255, 0.78);
	}
	.pct {
		font-size: 10px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--text-muted);
		flex-shrink: 0;
	}
	.item.active .pct {
		color: rgba(255, 255, 255, 0.9);
	}
	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
		background: #f0a23b;
	}
	.item.active .dot {
		background: white;
	}

	.footer {
		flex-shrink: 0;
		border-top: 1px solid var(--border-soft);
		padding: 9px 12px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.proj {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 11px;
		font-weight: 600;
		color: var(--text-strong);
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.proj.muted {
		color: var(--text-muted);
		font-weight: 500;
	}
	.save-all {
		justify-content: center;
		width: 100%;
		color: var(--mac-accent);
		border-color: var(--mac-accent-weak);
	}
</style>
