<script lang="ts">
	import { untrack } from 'svelte';
	import { flip } from 'svelte/animate';
	import { slide, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { dndzone, type DndEvent } from 'svelte-dnd-action';
	import { app } from '$lib/state.svelte';
	import { settings } from '$lib/settings.svelte';
	import { statesFor } from '$lib/xliff/types';
	import { languageLabel } from '$lib/xliff/typo3';
	import type { CatalogUnit, TargetEntry } from '$lib/project';
	import { autosize } from '$lib/actions';
	import Icon from './Icon.svelte';

	let {
		onAddUnit,
		onAddLanguage,
		onExport
	}: { onAddUnit: () => void; onAddLanguage: () => void; onExport: () => void } = $props();

	const cat = $derived(app.active);
	const states = $derived(cat ? statesFor(cat.version) : []);

	let activeLang = $state<string | null>(null);
	$effect(() => {
		const c = app.active;
		if (!c) return;
		untrack(() => {
			if (activeLang && c.languages.some((l) => l.lang === activeLang)) return;
			activeLang = c.languages[0]?.lang ?? null;
		});
	});

	// ----- drag & drop (handle-only) -------------------------------------
	type Row = { id: string; unit: CatalogUnit };
	let rows = $state<Row[]>([]);
	let dragging = $state(false);
	let dragDisabled = $state(true);

	const searchActive = $derived(app.search.trim().length > 0);
	const sig = $derived(
		`${app.active?.id ?? ''}|${app.search}|${app.filteredUnits.map((u) => u.key).join(',')}`
	);
	$effect(() => {
		sig;
		if (!dragging) rows = untrack(() => app.filteredUnits.map((u) => ({ id: u.key, unit: u })));
	});

	function startDrag() {
		if (!searchActive) dragDisabled = false;
	}
	function consider(e: CustomEvent<DndEvent<Row>>) {
		dragging = true;
		rows = e.detail.items;
	}
	function finalize(e: CustomEvent<DndEvent<Row>>) {
		rows = e.detail.items;
		dragging = false;
		dragDisabled = true;
		app.reorderUnits(rows.map((r) => r.unit));
	}

	function ensureTarget(unit: CatalogUnit, lang: string): TargetEntry {
		if (!unit.targets[lang]) unit.targets[lang] = { value: '', notes: [] };
		return unit.targets[lang];
	}

	let expanded = $state<Record<string, boolean>>({});

	function progress(lang: string): number {
		if (!cat || cat.units.length === 0) return 0;
		const done = cat.units.filter((u) => (u.targets[lang]?.value ?? '').trim().length > 0).length;
		return Math.round((done / cat.units.length) * 100);
	}

	function convert() {
		if (!cat) return;
		const target = cat.version === '1.2' ? '2.0' : '1.2';
		const note =
			target === '2.0'
				? 'Switches to XLIFF 2.0 (<unit>/<segment>, srcLang/trgLang). States are remapped; the v1.2 “approved” flag is kept but not written in 2.0.'
				: 'Switches back to XLIFF 1.2 (<trans-unit>, source/target-language). States are remapped to v1.2 values.';
		if (confirm(`Convert “${cat.base}.${cat.ext}” to XLIFF ${target}?\n\n${note}`))
			app.convertVersion(target);
	}

	const gridCols = $derived(
		activeLang
			? '26px minmax(150px, 0.85fr) minmax(220px, 1.5fr) minmax(220px, 1.5fr) 214px'
			: '26px minmax(150px, 0.85fr) minmax(220px, 1fr) 130px'
	);
</script>

{#if !cat}
	<div class="placeholder">
		<div class="drag-strip" data-tauri-drag-region></div>
		<div class="hero">
			<div class="hero-icon"><Icon name="globe" size={30} /></div>
			<h1>TYPO3 XLIFF Manager</h1>
			<p>Open a project folder or a single <code>.xlf</code> file to manage translations.</p>
			<div class="hero-actions">
				<button class="mac-btn mac-btn-primary" onclick={() => app.openProject()}>
					<Icon name="folder" size={14} /> Open project
				</button>
				<button class="mac-btn" onclick={() => app.openSingleFile()}>
					<Icon name="file" size={14} /> Open file
				</button>
			</div>
			<p class="hint">or from a terminal: <code>t3lang ./my-extension</code></p>

			{#if app.recents.length}
				<div class="recents">
					<div class="recents-head">
						<span><Icon name="clock" size={12} /> Recent</span>
						<button class="recents-clear" onclick={() => settings.clearRecents()}>Clear</button>
					</div>
					{#each app.recents.slice(0, 6) as r (r.path)}
						<button class="recent" onclick={() => app.openRecent(r)} title={r.path}>
							<Icon name={r.kind === 'file' ? 'file' : 'folder'} size={14} />
							<span class="recent-info">
								<span class="recent-name">{r.name}</span>
								<span class="recent-path">{r.path}</span>
							</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="view">
		<!-- Toolbar -->
		<header class="toolbar" data-tauri-drag-region>
			<div class="title" data-tauri-drag-region>
				<h1 data-tauri-drag-region>{cat.base}<span class="ext">.{cat.ext}</span></h1>
				<button class="ver no-drag" onclick={convert} title="Convert XLIFF version">
					XLIFF {cat.version}<span class="swap">→ {cat.version === '1.2' ? '2.0' : '1.2'}</span>
				</button>
				{#if cat.dirty}<span class="dirty no-drag" title="Unsaved changes"></span>{/if}
			</div>
			<div class="tools no-drag">
				<label class="search">
					<Icon name="search" size={13} />
					<input placeholder="Filter" bind:value={app.search} />
					{#if app.search}<button class="clear" onclick={() => (app.search = '')} aria-label="Clear"><Icon name="x" size={11} /></button>{/if}
				</label>
				<button class="mac-btn" onclick={onAddUnit}><Icon name="plus" size={13} /> Entry</button>
				<button class="mac-btn icon" onclick={onExport} title="XML preview / export"><Icon name="download" size={14} /></button>
				<button class="mac-btn mac-btn-primary" onclick={() => app.saveActive()} disabled={!cat.dirty}>
					<Icon name="save" size={13} /> Save
				</button>
			</div>
		</header>

		<!-- Language switcher -->
		<div class="langbar no-drag">
			<div class="seg">
				<span class="seg-item source"><Icon name="globe" size={11} /> {cat.sourceLanguage}</span>
				{#each cat.languages as lf (lf.lang)}
					<button
						class="seg-item"
						class:active={activeLang === lf.lang}
						onclick={() => (activeLang = lf.lang)}
						title={languageLabel(lf.lang)}
					>
						{lf.lang}
						<span class="prog"><span class="bar" style="width:{progress(lf.lang)}%"></span></span>
						{#if !lf.exists}<span class="newdot" title="not saved yet"></span>{/if}
					</button>
				{/each}
				<button class="seg-add" onclick={onAddLanguage} title="Add language"><Icon name="plus" size={12} /></button>
			</div>
			<div class="langbar-right">
				{#if activeLang}
					<button
						class="ghost-x"
						title="Remove “{activeLang}” from catalog"
						onclick={() => {
							const l = activeLang!;
							if (confirm(`Remove language “${l}” from this catalog? The file stays on disk until you delete it.`))
								app.removeLanguage(l);
						}}><Icon name="trash" size={12} /></button>
				{/if}
				<span class="count">{cat.units.length} entries · {progress(activeLang ?? '')}%</span>
			</div>
		</div>

		<!-- Table -->
		{#key cat.id}
		<div class="entrylist" in:fade={{ duration: 130 }}>
			<div class="thead" style="grid-template-columns: {gridCols}">
				<span></span>
				<span>Key</span>
				<span>{cat.sourceLanguage} · source</span>
				{#if activeLang}<span>{activeLang} · target</span>{/if}
				<span class="state-h">{activeLang ? 'State' : ''}</span>
			</div>

			<div
				class="tbody"
				use:dndzone={{ items: rows, flipDurationMs: 170, dragDisabled, dropTargetStyle: {} }}
				onconsider={consider}
				onfinalize={finalize}
			>
				{#each rows as row (row.id)}
					{@const u = row.unit}
					{@const t = activeLang ? u.targets[activeLang] : undefined}
					{@const empty = activeLang ? !(t?.value ?? '').trim() : false}
					<div class="rowwrap" animate:flip={{ duration: 170 }}>
						<div class="row" class:todo={empty} style="grid-template-columns: {gridCols}">
							<button
								class="grip"
								class:disabled={searchActive}
								onpointerdown={startDrag}
								title={searchActive ? 'Clear filter to reorder' : 'Drag to reorder'}
								aria-label="Reorder"
							><Icon name="grip" size={13} /></button>

							<div class="cell key-cell">
								<button
									class="disc"
									class:open={expanded[u.key]}
									onclick={() => (expanded[u.key] = !expanded[u.key])}
									title="Details & notes"
									aria-label="Toggle details"
								><Icon name="chevron" size={11} /></button>
								<input
									class="fld mono"
									value={u.id}
									spellcheck="false"
									oninput={(e) => {
										u.id = e.currentTarget.value;
										app.markDirty();
									}}
								/>
							</div>

							<div class="cell">
								<textarea
									class="fld"
									rows="1"
									value={u.source}
									use:autosize={u.source}
									oninput={(e) => {
										u.source = e.currentTarget.value;
										app.markDirty();
									}}
								></textarea>
							</div>

							{#if activeLang}
								<div class="cell">
									<textarea
										class="fld"
										rows="1"
										placeholder="—"
										value={t?.value ?? ''}
										use:autosize={t?.value}
										oninput={(e) => {
											ensureTarget(u, activeLang!).value = e.currentTarget.value;
											app.markDirty();
										}}
									></textarea>
								</div>

								<div class="cell trailing">
									{#if cat.version === '1.2'}
										<button
											class="appr"
											class:on={t?.approved}
											title="Approved"
											onclick={() => {
												const te = ensureTarget(u, activeLang!);
												te.approved = !te.approved;
												app.markDirty();
											}}><Icon name="check" size={12} /></button>
									{/if}
									<select
										class="state-sel"
										value={t?.state ?? ''}
										onchange={(e) => {
											ensureTarget(u, activeLang!).state = e.currentTarget.value || undefined;
											app.markDirty();
										}}
									>
										<option value="">— state —</option>
										{#each states as s}<option value={s}>{s}</option>{/each}
									</select>
									<div class="rowactions">
										<button class="iconbtn" title="Duplicate" onclick={() => app.duplicateUnit(u.key)}><Icon name="copy" size={13} /></button>
										<button class="iconbtn danger" title="Delete" onclick={() => app.removeUnit(u.key)}><Icon name="trash" size={13} /></button>
									</div>
								</div>
							{:else}
								<div class="cell trailing">
									<div class="rowactions">
										<button class="iconbtn" title="Duplicate" onclick={() => app.duplicateUnit(u.key)}><Icon name="copy" size={13} /></button>
										<button class="iconbtn danger" title="Delete" onclick={() => app.removeUnit(u.key)}><Icon name="trash" size={13} /></button>
									</div>
								</div>
							{/if}
						</div>

						{#if expanded[u.key]}
							<div class="detail" transition:slide={{ duration: 200, easing: cubicOut }}>
								<div class="dfields">
									<label class="dfield">
										<span>resname</span>
										<input class="mac-input mono" value={u.resname ?? ''} oninput={(e) => { u.resname = e.currentTarget.value || undefined; app.markDirty(); }} />
									</label>
									{#if cat.version === '1.2'}
										<label class="dfield narrow">
											<span>xml:space</span>
											<select class="mac-input" value={u.xmlSpace ?? ''} onchange={(e) => { u.xmlSpace = (e.currentTarget.value || undefined) as 'preserve' | 'default' | undefined; app.markDirty(); }}>
												<option value="">unset</option>
												<option value="preserve">preserve</option>
												<option value="default">default</option>
											</select>
										</label>
									{/if}
								</div>
								<div class="notes">
									<div class="notes-head">
										<span>Notes</span>
										<button class="textbtn" onclick={() => { u.notes = [...u.notes, { text: '' }]; app.markDirty(); }}><Icon name="plus" size={11} /> add</button>
									</div>
									{#each u.notes as note, i}
										<div class="note-row">
											<input class="mac-input" placeholder="note text" value={note.text} oninput={(e) => { note.text = e.currentTarget.value; app.markDirty(); }} />
											<input class="mac-input from" placeholder="from" value={note.from ?? ''} oninput={(e) => { note.from = e.currentTarget.value || undefined; app.markDirty(); }} />
											<button class="iconbtn danger" onclick={() => { u.notes = u.notes.filter((_, j) => j !== i); app.markDirty(); }}><Icon name="trash" size={12} /></button>
										</div>
									{:else}
										<p class="muted">No notes on this entry.</p>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>

			{#if rows.length === 0}
				<div class="no-rows">
					{#if app.search}
						No entries match “{app.search}”.
					{:else}
						<p>No entries yet.</p>
						<button class="mac-btn mac-btn-primary" onclick={onAddUnit}><Icon name="plus" size={13} /> Add first entry</button>
					{/if}
				</div>
			{/if}
		</div>
		{/key}
	</div>
{/if}

<style>
	.view {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		min-width: 0;
		min-height: 0;
		background: var(--surface-content);
		backdrop-filter: saturate(180%) blur(30px);
		-webkit-backdrop-filter: saturate(180%) blur(30px);
		border: 0.5px solid var(--island-border);
		border-radius: var(--island-radius);
		box-shadow: var(--island-shadow);
	}

	/* ---- placeholder ---- */
	.placeholder {
		flex: 1;
		display: grid;
		place-items: center;
		background: var(--surface-content);
		backdrop-filter: saturate(180%) blur(30px);
		-webkit-backdrop-filter: saturate(180%) blur(30px);
		border: 0.5px solid var(--island-border);
		border-radius: var(--island-radius);
		box-shadow: var(--island-shadow);
		position: relative;
	}
	.drag-strip {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 44px;
	}
	.hero {
		text-align: center;
		max-width: 420px;
		color: var(--text-muted);
		padding: 32px;
	}
	.hero-icon {
		width: 60px;
		height: 60px;
		border-radius: 15px;
		display: grid;
		place-items: center;
		margin: 0 auto 16px;
		background: linear-gradient(160deg, var(--mac-accent), color-mix(in srgb, var(--mac-accent) 60%, #7a5cf6));
		color: white;
		box-shadow: 0 8px 22px var(--mac-accent-weak);
	}
	.hero h1 {
		font-size: 19px;
		font-weight: 700;
		color: var(--text-strong);
		margin: 0 0 6px;
		letter-spacing: -0.01em;
	}
	.hero p {
		font-size: 12.5px;
		line-height: 1.5;
		margin: 0 0 16px;
	}
	.hero-actions {
		display: flex;
		gap: 8px;
		justify-content: center;
	}
	.hint {
		margin-top: 20px;
		font-size: 11px;
		opacity: 0.75;
	}
	.recents {
		margin-top: 26px;
		text-align: left;
		border-top: 0.5px solid var(--border-soft);
		padding-top: 14px;
	}
	.recents-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		margin-bottom: 6px;
	}
	.recents-head span {
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}
	.recents-clear {
		border: none;
		background: none;
		color: var(--mac-accent);
		font-size: 10.5px;
		font-weight: 600;
		cursor: default;
		text-transform: none;
		letter-spacing: 0;
	}
	.recent {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 7px 8px;
		border: none;
		background: transparent;
		border-radius: 8px;
		cursor: default;
		text-align: left;
		color: var(--text-strong);
	}
	.recent :global(svg) {
		color: var(--text-muted);
		flex-shrink: 0;
	}
	.recent:hover {
		background: var(--surface-hover);
	}
	.recent-info {
		min-width: 0;
		display: flex;
		flex-direction: column;
		line-height: 1.25;
	}
	.recent-name {
		font-size: 12.5px;
		font-weight: 600;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.recent-path {
		font-size: 10px;
		color: var(--text-muted);
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		direction: rtl;
	}
	code {
		font-family: 'SF Mono', ui-monospace, Menlo, monospace;
		font-size: 0.92em;
		background: var(--surface-hover);
		padding: 1px 5px;
		border-radius: 4px;
	}

	/* ---- toolbar ---- */
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		padding: 13px 16px 13px 20px;
		border-bottom: 0.5px solid var(--border-soft);
		flex-shrink: 0;
	}
	.title {
		display: flex;
		align-items: center;
		gap: 9px;
		min-width: 0;
	}
	.title h1 {
		font-size: 14px;
		font-weight: 700;
		letter-spacing: -0.01em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.ext {
		color: var(--text-muted);
		font-weight: 500;
	}
	.ver {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		font-size: 10.5px;
		font-weight: 600;
		color: var(--text-muted);
		background: var(--surface-hover);
		border: none;
		border-radius: 5px;
		padding: 2px 7px;
		cursor: default;
	}
	.ver:hover {
		color: var(--mac-accent);
	}
	.ver .swap {
		max-width: 0;
		overflow: hidden;
		opacity: 0;
		transition: max-width 0.14s ease, opacity 0.14s ease;
		white-space: nowrap;
	}
	.ver:hover .swap {
		max-width: 50px;
		opacity: 0.9;
		margin-left: 2px;
	}
	.dirty {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #f0a23b;
	}
	.tools {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}
	.search {
		position: relative;
		display: flex;
		align-items: center;
	}
	.search :global(svg:first-child) {
		position: absolute;
		left: 8px;
		color: var(--text-muted);
		pointer-events: none;
	}
	.search input {
		width: 130px;
		padding: 4px 24px 4px 26px;
		border: 0.5px solid var(--border-strong);
		border-radius: 6px;
		background: var(--surface-content);
		color: var(--text-strong);
		font-size: 12px;
	}
	.search input:focus-visible {
		outline: none;
		border-color: var(--mac-accent);
		box-shadow: 0 0 0 2px var(--mac-accent-weak);
	}
	.clear {
		position: absolute;
		right: 5px;
		border: none;
		background: none;
		color: var(--text-muted);
		display: flex;
		padding: 2px;
		border-radius: 4px;
	}
	.clear:hover {
		background: var(--surface-hover);
	}
	.icon {
		padding: 4px 7px;
	}

	/* ---- language switcher ---- */
	.langbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 11px 18px;
		border-bottom: 0.5px solid var(--border-soft);
		flex-shrink: 0;
	}
	.seg {
		display: flex;
		align-items: center;
		gap: 2px;
		background: var(--surface-raised);
		border: 0.5px solid var(--border-soft);
		padding: 2px;
		border-radius: 8px;
		overflow-x: auto;
		max-width: 100%;
	}
	.seg-item {
		display: flex;
		align-items: center;
		gap: 5px;
		border: none;
		background: transparent;
		border-radius: 6px;
		padding: 4px 9px;
		font-size: 11.5px;
		font-weight: 600;
		color: var(--text-strong);
		white-space: nowrap;
		cursor: default;
		transition: background 0.1s ease, box-shadow 0.1s ease;
	}
	.seg-item.source {
		color: var(--text-muted);
	}
	.seg-item:not(.source):hover {
		background: var(--surface-hover);
	}
	.seg-item.active {
		background: var(--surface-content);
		color: var(--mac-accent);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
	}
	.prog {
		width: 26px;
		height: 3px;
		border-radius: 99px;
		background: var(--border-strong);
		overflow: hidden;
	}
	.bar {
		display: block;
		height: 100%;
		background: currentColor;
		transition: width 0.2s ease;
	}
	.newdot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #f0a23b;
	}
	.seg-add {
		display: grid;
		place-items: center;
		border: none;
		background: transparent;
		border-radius: 6px;
		padding: 4px 7px;
		color: var(--text-muted);
		cursor: default;
	}
	.seg-add:hover {
		background: var(--surface-hover);
		color: var(--mac-accent);
	}
	.langbar-right {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}
	.ghost-x {
		display: grid;
		place-items: center;
		border: none;
		background: none;
		color: var(--text-muted);
		padding: 4px;
		border-radius: 5px;
		cursor: default;
	}
	.ghost-x:hover {
		background: var(--surface-hover);
		color: #e0533d;
	}
	.count {
		font-size: 11px;
		color: var(--text-muted);
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	/* ---- table ---- */
	.entrylist {
		flex: 1;
		overflow: auto;
		min-height: 0;
	}
	.thead {
		display: grid;
		position: sticky;
		top: 0;
		z-index: 3;
		background: color-mix(in srgb, var(--surface-content) 86%, transparent);
		backdrop-filter: blur(8px);
		border-bottom: 0.5px solid var(--border-strong);
		min-width: max-content;
	}
	.thead span {
		padding: 9px 11px;
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}
	.tbody {
		min-width: max-content;
	}
	.rowwrap {
		border-bottom: 0.5px solid var(--border-soft);
		animation: rowIn 0.24s cubic-bezier(0.22, 0.61, 0.36, 1) both;
	}
	@keyframes rowIn {
		from {
			opacity: 0;
			transform: translateY(-3px);
		}
	}
	.row {
		display: grid;
		align-items: center;
		min-width: max-content;
		min-height: 46px;
		position: relative;
		transition: background 0.08s ease;
	}
	.row:hover {
		background: var(--surface-hover);
	}
	.row.todo::before {
		content: '';
		position: absolute;
		left: 0;
		top: 4px;
		bottom: 4px;
		width: 2px;
		border-radius: 2px;
		background: #f0a23b;
	}
	.grip {
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: none;
		color: var(--text-muted);
		cursor: grab;
		opacity: 0;
		height: 100%;
	}
	.row:hover .grip {
		opacity: 0.55;
	}
	.grip:hover {
		opacity: 1 !important;
	}
	.grip.disabled {
		cursor: default;
	}
	.cell {
		padding: 6px 8px;
		min-width: 0;
		align-self: stretch;
		display: flex;
		align-items: center;
	}
	.key-cell {
		gap: 2px;
	}
	.disc {
		display: grid;
		place-items: center;
		border: none;
		background: none;
		color: var(--text-muted);
		padding: 2px;
		border-radius: 4px;
		cursor: default;
		flex-shrink: 0;
		transition: transform 0.12s ease;
	}
	.disc.open {
		transform: rotate(90deg);
	}
	.disc:hover {
		color: var(--text-strong);
	}
	.fld {
		width: 100%;
		font: inherit;
		font-size: 13px;
		color: var(--text-strong);
		background: transparent;
		border: 1px solid transparent;
		border-radius: 6px;
		padding: 6px 9px;
		resize: none;
		overflow: hidden;
		line-height: 1.5;
		transition: background 0.1s ease, border-color 0.1s ease;
	}
	.fld.mono {
		font-family: 'SF Mono', ui-monospace, Menlo, monospace;
		font-size: 11.5px;
		font-weight: 500;
	}
	.fld::placeholder {
		color: var(--text-muted);
		opacity: 0.6;
	}
	.fld:hover {
		background: var(--surface-content);
		border-color: var(--border-soft);
	}
	.row:hover .fld:not(:focus) {
		border-color: var(--border-soft);
	}
	.fld:focus {
		outline: none;
		background: var(--surface-content);
		border-color: var(--mac-accent);
		box-shadow: 0 0 0 2.5px var(--mac-accent-weak);
		overflow: auto;
	}
	.trailing {
		gap: 4px;
		justify-content: flex-start;
	}
	.appr {
		display: grid;
		place-items: center;
		width: 22px;
		height: 22px;
		border-radius: 5px;
		border: 0.5px solid var(--border-strong);
		background: var(--surface-content);
		color: transparent;
		cursor: default;
		flex-shrink: 0;
	}
	.appr.on {
		background: #2faa5b;
		border-color: #2faa5b;
		color: white;
	}
	.state-sel {
		flex: 1;
		min-width: 0;
		font-size: 11px;
		border: 0.5px solid var(--border-soft);
		border-radius: 5px;
		padding: 3px 4px;
		background: transparent;
		color: var(--text-muted);
		cursor: default;
	}
	.state-sel:hover {
		background: var(--surface-content);
		border-color: var(--border-strong);
	}
	.rowactions {
		display: flex;
		gap: 1px;
		opacity: 0;
		flex-shrink: 0;
	}
	.row:hover .rowactions {
		opacity: 1;
	}
	.iconbtn {
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		border-radius: 5px;
		border: none;
		background: transparent;
		color: var(--text-muted);
		cursor: default;
	}
	.iconbtn:hover {
		background: var(--surface-hover);
		color: var(--text-strong);
	}
	.danger:hover {
		color: #e0533d;
	}

	/* ---- detail ---- */
	.detail {
		padding: 8px 16px 12px 40px;
		background: var(--surface-raised);
		display: flex;
		flex-direction: column;
		gap: 10px;
		border-top: 0.5px solid var(--border-soft);
	}
	.dfields {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}
	.dfield {
		display: flex;
		flex-direction: column;
		gap: 3px;
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-muted);
		flex: 1;
		min-width: 200px;
	}
	.dfield.narrow {
		flex: 0 0 130px;
		min-width: 0;
	}
	.notes {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}
	.notes-head {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-muted);
	}
	.textbtn {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		border: none;
		background: none;
		color: var(--mac-accent);
		font-size: 11px;
		font-weight: 600;
		cursor: default;
		text-transform: none;
		letter-spacing: 0;
	}
	.note-row {
		display: flex;
		gap: 6px;
		align-items: center;
	}
	.note-row .from {
		max-width: 130px;
	}
	.muted {
		font-size: 11.5px;
		color: var(--text-muted);
		margin: 0;
	}

	.no-rows {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 70px 20px;
		text-align: center;
		color: var(--text-muted);
		font-size: 13px;
	}
	.no-rows p {
		margin: 0;
	}
</style>
