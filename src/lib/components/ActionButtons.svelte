<script lang="ts">
    import Plus from "@lucide/svelte/icons/plus";
    import Settings from "@lucide/svelte/icons/settings";

    let { addEmptyText }: { addEmptyText: () => void } = $props();
</script>

<!-- Action Buttons (Bottom Left) -->
<div class="fixed bottom-6 left-6 z-50 flex flex-col items-center gap-3">
    <button
        onclick={addEmptyText}
        class="flex h-12 w-12 items-center justify-center rounded-full border border-indigo-500/30 bg-zinc-900/80 backdrop-blur text-indigo-400 shadow-xl transition-all hover:bg-indigo-950/50 hover:border-indigo-500/50 hover:text-indigo-300 hover:scale-105 active:scale-95"
        title="Crear nueva nota manual"
    >
        <Plus class="w-6 h-6" />
    </button>
    <button
        class="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700/50 bg-zinc-900/80 backdrop-blur text-zinc-400 shadow-md transition-all hover:bg-zinc-800 hover:border-zinc-600 hover:text-zinc-200 hover:scale-105 active:scale-95"
        title="Configuración"
    >
        <Settings class="w-5 h-5" />
    </button>
</div>
