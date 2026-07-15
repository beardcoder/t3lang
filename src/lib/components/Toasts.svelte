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
			<span class="tdot"></span>{t.message}
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
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 9px 15px 9px 13px;
		border-radius: 14px;
		font-size: 12px;
		font-weight: 500;
		color: #f5f2ee;
		background: rgba(30, 27, 24, 0.85);
		backdrop-filter: blur(14px) saturate(160%);
		-webkit-backdrop-filter: blur(14px) saturate(160%);
		border: 0.5px solid rgba(255, 255, 255, 0.12);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.32);
		max-width: 360px;
	}
	.tdot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.success .tdot {
		background: #3cba68;
	}
	.error .tdot {
		background: #e8604a;
	}
	.info .tdot {
		background: #9db4c9;
	}
</style>
