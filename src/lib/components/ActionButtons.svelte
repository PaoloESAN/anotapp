<script lang="ts">
    import Plus from "@lucide/svelte/icons/plus";
    import Settings from "@lucide/svelte/icons/settings";
    import Check from "@lucide/svelte/icons/check";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import { setMode, resetMode } from "mode-watcher";
    import { onMount } from "svelte";

    let { addEmptyText }: { addEmptyText: () => void } = $props();
    let isSettingsOpen = $state(false);
    let currentColor = $state("oklch(0.546 0.245 262.881)");
    let themeMode = $state("system");

    onMount(() => {
        const savedColor = localStorage.getItem("anotapp-primary-color");
        if (savedColor) currentColor = savedColor;
        const savedMode = localStorage.getItem("mode-watcher-mode");
        if (savedMode) themeMode = savedMode;
    });

    let colors = [
        {
            name: "Morado Real",
            value: "oklch(0.546 0.245 262.881)",
            class: "bg-indigo-500",
        },
        { name: "Rojo Vivo", value: "oklch(0.6 0.25 25)", class: "bg-red-500" },
        {
            name: "Verde Esmeralda",
            value: "oklch(0.65 0.15 150)",
            class: "bg-emerald-500",
        },
        {
            name: "Rosa Neón",
            value: "oklch(0.65 0.25 330)",
            class: "bg-pink-500",
        },
        { name: "Dorado", value: "oklch(0.7 0.15 80)", class: "bg-yellow-500" },
        {
            name: "Azul Océano",
            value: "oklch(0.6 0.15 240)",
            class: "bg-blue-500",
        },
    ];

    function setPrimaryColor(oklch: string) {
        document.documentElement.style.setProperty("--primary", oklch);
        localStorage.setItem("anotapp-primary-color", oklch);
        currentColor = oklch;
    }

    function handleSetMode(m: 'light'|'dark'|'system') {
        themeMode = m;
        if (m === 'system') {
            resetMode();
        } else {
            setMode(m);
        }
    }
</script>

<!-- Action Buttons (Bottom Left) -->
<div class="fixed bottom-6 left-6 z-50 flex flex-col items-center gap-3">
    <button
        onclick={addEmptyText}
        class="flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-zinc-900/80 backdrop-blur-md text-primary shadow-xl transition-all hover:bg-primary/10 hover:border-primary/50 hover:text-primary/80 hover:scale-105 active:scale-95"
        title="Crear nueva nota manual"
    >
        <Plus class="w-6 h-6" />
    </button>
    <button
        onclick={() => (isSettingsOpen = true)}
        class="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700/50 bg-zinc-900/80 backdrop-blur-md text-zinc-400 shadow-md transition-all hover:bg-zinc-800 hover:border-zinc-600 hover:text-zinc-200 hover:scale-105 active:scale-95"
        title="Configuración"
    >
        <Settings class="w-5 h-5" />
    </button>
</div>

<Dialog.Root bind:open={isSettingsOpen}>
    <Dialog.Content
        class="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100 p-6 rounded-xl shadow-2xl"
    >
        <Dialog.Header>
            <Dialog.Title
                class="text-xl font-bold tracking-tight text-white mb-1"
                >Configuración general</Dialog.Title
            >
            <Dialog.Description class="text-zinc-400">
                Ajusta el motor visual para adaptar Anotapp a ti.
            </Dialog.Description>
        </Dialog.Header>

        <div class="grid gap-8 py-6">
            <!-- Theme Control -->
            <div class="flex flex-col gap-3">
                <h4
                    class="text-sm font-semibold tracking-wide text-zinc-200 uppercase"
                >
                    Tema del sistema
                </h4>
                <div
                    class="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800/50"
                >
                    <button
                        onclick={() => handleSetMode("light")}
                        class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 {themeMode === 'light' ? 'bg-zinc-700/80 text-white shadow-md' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}"
                        >Claro</button>
                    <button
                        onclick={() => handleSetMode("dark")}
                        class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 {themeMode === 'dark' ? 'bg-zinc-700/80 text-white shadow-md' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}"
                        >Oscuro</button>
                    <button
                        onclick={() => handleSetMode("system")}
                        class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 {themeMode === 'system' ? 'bg-zinc-700/80 text-white shadow-md' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}"
                        >Auto</button>
                </div>
            </div>

            <!-- Color Palette Control -->
            <div class="flex flex-col gap-3">
                <h4
                    class="text-sm font-semibold tracking-wide text-zinc-200 uppercase"
                >
                    Tono primario
                </h4>
                <div
                    class="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50 flex-wrap"
                >
                    {#each colors as c}
                        <button
                            onclick={() => setPrimaryColor(c.value)}
                            class="{c.class} flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all hover:scale-110 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 {currentColor === c.value ? 'border-white ring-2 ring-primary ring-offset-2 ring-offset-zinc-950 scale-110' : 'border-transparent'}"
                            title={c.name}
                            aria-label={c.name}
                        >
                            {#if currentColor === c.value}
                                <Check class="w-5 h-5 text-zinc-50 drop-shadow-md" />
                            {/if}
                        </button>
                    {/each}
                </div>
            </div>
        </div>
    </Dialog.Content>
</Dialog.Root>
