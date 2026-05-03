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
        hideCardButtons = $bindable(false),
        bgPattern = $bindable("grid"),
    }: {
        open: boolean;
        hideHeaders: boolean;
        hideCardButtons: boolean;
        bgPattern: string;
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

    let patterns = [
        { id: "none", name: "Liso" },
        { id: "grid", name: "Cuadrícula" },
        { id: "dots", name: "Puntitos" },
        { id: "cross", name: "Cruces" },
        { id: "waves", name: "Ondas" },
        { id: "custom-image", name: "Imagen" },
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

    function handleCustomImage(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                let w = img.width;
                let h = img.height;
                if (w > 1920) {
                    h = (1920 / w) * h;
                    w = 1920;
                }
                canvas.width = w;
                canvas.height = h;
                ctx?.drawImage(img, 0, 0, w, h);
                const dataUrl = canvas.toDataURL("image/webp", 0.8);

                try {
                    localStorage.setItem("anotapp-custom-bg-image", dataUrl);
                    bgPattern = "custom-image";
                    window.dispatchEvent(
                        new CustomEvent("anotapp-bg-updated", {
                            detail: dataUrl,
                        }),
                    );
                } catch (e) {
                    console.error("Imagen muy grande para guardar");
                }
            };
            img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content
        class="sm:max-w-md bg-background border-border text-foreground p-6 rounded-xl shadow-2xl flex flex-col max-h-[85vh]"
    >
        <Dialog.Header class="shrink-0">
            <Dialog.Title
                class="text-xl font-bold tracking-tight text-foreground mb-1"
                >Configuración general</Dialog.Title
            >
            <Dialog.Description class="text-muted-foreground">
                Ajusta el motor visual para adaptar Anotapp a ti.
            </Dialog.Description>
        </Dialog.Header>

        <div
            class="grid gap-8 py-6 overflow-y-auto custom-scrollbar pr-2 min-h-0"
        >
            <!-- Interface Control -->
            <div
                class="flex items-center justify-between gap-3 bg-muted/40 p-4 rounded-xl border border-border/50 shadow-sm"
            >
                <div class="space-y-1">
                    <Label
                        class="text-sm font-semibold tracking-wide text-foreground"
                        >Ocultar Títulos</Label
                    >
                </div>
                <Switch bind:checked={hideHeaders} />
            </div>

            <!-- Card Buttons Control -->
            <div
                class="flex items-center justify-between gap-3 bg-muted/40 p-4 rounded-xl border border-border/50 shadow-sm"
            >
                <div class="space-y-1">
                    <Label
                        class="text-sm font-semibold tracking-wide text-foreground"
                        >Ocultar Botones de Tarjeta</Label
                    >
                </div>
                <Switch bind:checked={hideCardButtons} />
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

            <!-- Background Pattern Control -->
            <div class="flex flex-col gap-3">
                <h4
                    class="text-sm font-semibold tracking-wide text-foreground uppercase"
                >
                    Fondo de Lienzo
                </h4>
                <div
                    class="flex items-center gap-3 bg-muted/60 p-3 rounded-xl border border-border/50 flex-wrap"
                >
                    {#each patterns as p}
                        <button
                            onclick={() => {
                                if (p.id === "custom-image") {
                                    document
                                        .getElementById("hidden-bg-upload")
                                        ?.click();
                                } else {
                                    bgPattern = p.id;
                                }
                            }}
                            class="relative flex flex-col items-center justify-center w-18 h-12 rounded-lg border-2 overflow-hidden transition-all hover:scale-105 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-primary {bgPattern ===
                            p.id
                                ? 'border-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-background shadow-md shadow-primary/20'
                                : 'border-border/60 hover:border-border'}"
                            title={p.name}
                            aria-label={p.name}
                        >
                            <div
                                class="absolute inset-0 bg-background pattern-{p.id}"
                            ></div>
                            <div
                                class="relative z-10 flex items-center justify-center w-full h-full bg-background/50 backdrop-blur-[1px]"
                            >
                                <span
                                    class="text-[0.65rem] font-semibold text-foreground/80 drop-shadow-sm"
                                    >{p.name}</span
                                >
                            </div>
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Input oculto para cargar la imagen -->
            <input
                type="file"
                id="hidden-bg-upload"
                accept="image/*"
                class="hidden"
                onchange={handleCustomImage}
            />
        </div>
    </Dialog.Content>
</Dialog.Root>
