<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<title>t3lang — TYPO3 XLIFF Manager</title>
</svelte:head>

{@render children?.()}
