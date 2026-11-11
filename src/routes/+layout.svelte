<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Drill Insights</title>
	<meta
		name="description"
		content="Explore 1.2 million synthetic phishing-drill results in the browser."
	/>
</svelte:head>

{@render children()}
