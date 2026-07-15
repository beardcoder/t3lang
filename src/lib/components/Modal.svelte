<script lang="ts">
	import Icon from './Icon.svelte';
	import type { Snippet } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	let {
		open = $bindable(false),
		title,
		children,
		footer
	}: {
		open: boolean;
		title: string;
		children: Snippet;
		footer?: Snippet;
	} = $props();

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}
</script>

<svelte:window {onkeydown} />

{#if open}
	<div
		class="backdrop"
		role="button"
		tabindex="-1"
		onclick={(e) => {
			if (e.target === e.currentTarget) open = false;
		}}
		onkeydown={() => {}}
		transition:fade={{ duration: 130 }}
	>
		<div
			class="mac-card panel"
			role="dialog"
			aria-modal="true"
			in:scale={{ start: 0.95, opacity: 0, duration: 200, easing: cubicOut }}
			out:scale={{ start: 0.97, opacity: 0, duration: 120, easing: cubicOut }}
		>
			<header>
				<h2>{title}</h2>
				<button class="mac-btn mac-btn-ghost" onclick={() => (open = false)} aria-label="Close">
					<Icon name="x" />
				</button>
			</header>
			<div class="body">
				{@render children()}
			</div>
			{#if footer}
				<footer>
					{@render footer()}
				</footer>
			{/if}
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(20, 15, 10, 0.3);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}
	.panel {
		width: min(460px, 92vw);
		max-height: 84vh;
		display: flex;
		flex-direction: column;
		border-radius: 15px;
		box-shadow: 0 24px 70px rgba(0, 0, 0, 0.32);
		overflow: hidden;
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 14px;
		border-bottom: 1px solid var(--border-soft);
	}
	h2 {
		font-size: 14px;
		font-weight: 600;
		margin: 0;
	}
	.body {
		padding: 16px;
		overflow: auto;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	footer {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		padding: 12px 14px;
		border-top: 1px solid var(--border-soft);
		background: var(--surface-raised);
	}
</style>
