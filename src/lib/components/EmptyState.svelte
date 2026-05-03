<script lang="ts">
    import { fade } from "svelte/transition";
    import Copy from "@lucide/svelte/icons/copy";

    let { isReady, hasItems }: { isReady: boolean; hasItems: boolean } =
        $props();
</script>

{#if isReady && !hasItems}
    <div
        in:fade={{ duration: 600, delay: 200 }}
        out:fade={{ duration: 200 }}
        class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
    >
        <div
            class="w-24 h-24 mb-6 rounded-full bg-slate-100/50 dark:bg-zinc-800/50 flex items-center justify-center border border-slate-200/50 dark:border-zinc-700/50 shadow-2xl relative shadow-primary/10"
        >
            <Copy
                class="w-10 h-10 text-slate-400 dark:text-zinc-400"
                strokeWidth={1.5}
            />
        </div>
        <h1
            class="text-3xl tracking-tight font-light text-slate-700 dark:text-zinc-300"
        >
            Empieza a copiar
        </h1>
        <p class="text-slate-500 dark:text-zinc-500 mt-2 font-medium">
            los elementos aparecerán aquí como ventanas flotantes
        </p>
    </div>
{/if}
