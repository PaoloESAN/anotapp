<script lang="ts">
    import Check from "@lucide/svelte/icons/check";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import { setMode, resetMode } from "mode-watcher";
    import { onMount } from "svelte";
    import { Switch } from "$lib/components/ui/switch/index.js";
    import { Label } from "$lib/components/ui/label/index.js";

    let {
        open = $bindable(false),
        hideHeaders = $bindable(false),
    }: {
        open: boolean;
        hideHeaders: boolean;
    } = $props();

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
            name: "Azul Oscuro",
            value: "oklch(0.546 0.245 262.881)",
            class: "bg-blue-600",
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
            name: "Celeste",
            value: "oklch(0.6 0.15 240)",
            class: "bg-sky-400",
        },
    ];

    function setPrimaryColor(oklch: string) {
        document.documentElement.style.setProperty("--primary", oklch);
        localStorage.setItem("anotapp-primary-color", oklch);
        currentColor = oklch;
    }

    function handleSetMode(m: "light" | "dark" | "system") {
        themeMode = m;
        if (m === "system") {
            resetMode();
        } else {
            setMode(m);
        }
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content
        class="sm:max-w-md bg-background border-border text-foreground p-6 rounded-xl shadow-2xl"
    >
        <Dialog.Header>
            <Dialog.Title
                class="text-xl font-bold tracking-tight text-foreground mb-1"
                >Configuración general</Dialog.Title
            >
            <Dialog.Description class="text-muted-foreground">
                Ajusta el motor visual para adaptar Anotapp a ti.
            </Dialog.Description>
        </Dialog.Header>

        <div class="grid gap-8 py-6">
            <!-- Interface Control -->
            <div
                class="flex items-center justify-between gap-3 bg-muted/40 p-4 rounded-xl border border-border/50 shadow-sm"
            >
                <div class="space-y-1">
                    <Label
                        class="text-sm font-semibold tracking-wide text-foreground"
                        >Ocultar Etiquetas</Label
                    >
                </div>
                <Switch bind:checked={hideHeaders} />
            </div>

            <!-- Theme Control -->
            <div class="flex flex-col gap-3">
                <h4
                    class="text-sm font-semibold tracking-wide text-foreground uppercase"
                >
                    Tema del sistema
                </h4>
                <div
                    class="flex items-center gap-2 bg-muted/60 p-1 rounded-lg border border-border/50"
                >
                    <button
                        onclick={() => handleSetMode("light")}
                        class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 {themeMode ===
                        'light'
                            ? 'bg-background text-foreground shadow-md border border-border/50'
                            : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'}"
                        >Claro</button
                    >
                    <button
                        onclick={() => handleSetMode("dark")}
                        class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 {themeMode ===
                        'dark'
                            ? 'bg-background text-foreground shadow-md border border-border/50'
                            : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'}"
                        >Oscuro</button
                    >
                    <button
                        onclick={() => handleSetMode("system")}
                        class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 {themeMode ===
                        'system'
                            ? 'bg-background text-foreground shadow-md border border-border/50'
                            : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'}"
                        >Auto</button
                    >
                </div>
            </div>

            <!-- Color Palette Control -->
            <div class="flex flex-col gap-3">
                <h4
                    class="text-sm font-semibold tracking-wide text-foreground uppercase"
                >
                    Tono primario
                </h4>
                <div
                    class="flex items-center gap-3 bg-muted/60 p-3 rounded-xl border border-border/50 flex-wrap"
                >
                    {#each colors as c}
                        <button
                            onclick={() => setPrimaryColor(c.value)}
                            class="{c.class} flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all hover:scale-110 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-primary {currentColor ===
                            c.value
                                ? 'border-background ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-lg shadow-primary/40'
                                : 'border-transparent'}"
                            title={c.name}
                            aria-label={c.name}
                        >
                            {#if currentColor === c.value}
                                <Check
                                    class="w-5 h-5 text-white drop-shadow-md"
                                />
                            {/if}
                        </button>
                    {/each}
                </div>
            </div>
        </div>
    </Dialog.Content>
</Dialog.Root>
