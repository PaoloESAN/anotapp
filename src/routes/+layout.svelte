<script lang="ts">
	import "./layout.css";
	import favicon from "$lib/assets/favicon.svg";
	import { ModeWatcher } from "mode-watcher";
	import { onMount } from "svelte";

	let { children } = $props();

	onMount(() => {
		const savedColor = localStorage.getItem("anotapp-primary-color");
		if (savedColor) {
			document.documentElement.style.setProperty("--primary", savedColor);
		} else {
			document.documentElement.style.setProperty(
				"--primary",
				"oklch(0.546 0.245 262.881)",
			);
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ModeWatcher />
{@render children()}
