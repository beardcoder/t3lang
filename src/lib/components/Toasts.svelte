<script lang="ts">
	import { app } from '$lib/state.svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { flip } from 'svelte/animate';
</script>

<div class="stack">
	{#each app.toasts as t (t.id)}
		<div
			class="toast {t.kind}"
			in:fly={{ y: 14, duration: 220, easing: cubicOut }}
			out:fly={{ y: 8, duration: 160, easing: cubicOut }}
			animate:flip={{ duration: 180 }}
		>
			{t.message}
		</div>
	{/each}
</div>

<style>
	.stack {
		position: fixed;
		bottom: 16px;
		right: 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		z-index: 200;
		pointer-events: none;
	}
	.toast {
		padding: 9px 14px;
		border-radius: 9px;
		font-size: 12px;
		font-weight: 500;
		color: white;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
		max-width: 360px;
	}
	.success {
		background: #2faa5b;
	}
	.error {
		background: #e0533d;
	}
	.info {
		background: #4b6478;
	}
</style>
