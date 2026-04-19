<script lang="ts">
    import Plus from "@lucide/svelte/icons/plus";
    import SettingsIcon from "@lucide/svelte/icons/settings";
    import SettingsModal from "./SettingsModal.svelte";

    let {
        addEmptyText,
        hideHeaders = $bindable(false),
    }: { addEmptyText: () => void; hideHeaders: boolean } = $props();
    
    let isSettingsOpen = $state(false);
</script>

<!-- Action Buttons (Bottom Left) -->
<div class="fixed bottom-6 left-6 z-50 flex flex-col items-center gap-3">
    <button
        onclick={addEmptyText}
        class="flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-background/80 backdrop-blur-md text-primary shadow-xl transition-all hover:bg-primary/10 hover:border-primary/50 hover:text-primary/80 hover:scale-105 active:scale-95"
        title="Crear nueva nota manual"
    >
        <Plus class="w-6 h-6" />
    </button>
    <button
        onclick={() => (isSettingsOpen = true)}
        class="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-background/80 backdrop-blur-md text-muted-foreground shadow-md transition-all hover:bg-muted hover:border-border hover:text-foreground hover:scale-105 active:scale-95"
        title="Configuración"
    >
        <SettingsIcon class="w-5 h-5" />
    </button>
</div>

<SettingsModal bind:open={isSettingsOpen} bind:hideHeaders />
