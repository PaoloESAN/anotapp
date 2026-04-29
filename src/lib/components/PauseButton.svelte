<script lang="ts">
    import CirclePause from "@lucide/svelte/icons/circle-pause";
    import CirclePlay from "@lucide/svelte/icons/circle-play";

    let {
        paused = $bindable(false),
    }: {
        paused: boolean;
    } = $props();
</script>

<button
    onclick={() => (paused = !paused)}
    class="group fixed bottom-20 right-6 z-50 flex items-center rounded-full border backdrop-blur p-3 hover:px-5 text-sm font-semibold shadow-xl transition-all duration-300 ease-out {paused
        ? 'border-primary/60 bg-primary/15 text-primary hover:bg-primary/25 hover:border-primary/80'
        : 'border-border/50 bg-white/80 dark:bg-zinc-900/80 text-muted-foreground hover:bg-muted hover:border-border hover:text-foreground'}"
    title={paused ? "Reanudar captura" : "Pausar captura"}
>
    {#if paused}
        <CirclePlay class="w-5 h-5 shrink-0" />
    {:else}
        <CirclePause class="w-5 h-5 shrink-0" />
    {/if}
    <span
        class="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-out group-hover:max-w-[160px] group-hover:opacity-100 group-hover:ml-2.5"
    >
        {paused ? "Reanudar" : "Pausar captura"}
    </span>
</button>
