<script lang="ts">
    import Check from "@lucide/svelte/icons/check";
    import Download from "@lucide/svelte/icons/download";
    import Upload from "@lucide/svelte/icons/upload";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import * as Tabs from "$lib/components/ui/tabs/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { setMode, resetMode } from "mode-watcher";
    import { onMount } from "svelte";
    import { Switch } from "$lib/components/ui/switch/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { desktopState } from "../../../routes/desktop-state.svelte";

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
    let fileInputRef: HTMLInputElement;

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
            class: "bg-blue-600 hover:!bg-blue-600",
        },
        {
            name: "Rojo Vivo",
            value: "oklch(0.6 0.25 25)",
            class: "bg-red-500 hover:!bg-red-500",
        },
        {
            name: "Verde Esmeralda",
            value: "oklch(0.65 0.15 150)",
            class: "bg-emerald-500 hover:!bg-emerald-500",
        },
        {
            name: "Rosa Neón",
            value: "oklch(0.65 0.25 330)",
            class: "bg-pink-500 hover:!bg-pink-500",
        },
        {
            name: "Dorado",
            value: "oklch(0.7 0.15 80)",
            class: "bg-yellow-500 hover:!bg-yellow-500",
        },
        {
            name: "Celeste",
            value: "oklch(0.6 0.15 240)",
            class: "bg-sky-400 hover:!bg-sky-400",
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

    function handleImportClick() {
        if (fileInputRef) {
            fileInputRef.click();
        }
    }

    async function handleFileSelected(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;
        const file = input.files[0];
        await desktopState.importWorkspaces(file);
        input.value = "";
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content
        class="sm:max-w-[500px] bg-background border-border text-foreground p-0 rounded-2xl shadow-2xl flex flex-col h-[85vh] md:h-auto max-h-[85vh] overflow-hidden"
    >
        <Dialog.Header class="shrink-0 p-6 pb-4 border-b">
            <Dialog.Title
                class="text-2xl font-bold tracking-tight text-foreground"
                >Configuración</Dialog.Title
            >
            <Dialog.Description class="text-muted-foreground mt-1.5">
                Adapta Anotapp a tus necesidades y gestiona tus datos.
            </Dialog.Description>
        </Dialog.Header>

        <div class="flex-1 overflow-y-auto custom-scrollbar p-6 pt-2">
            <Tabs.Root value="appearance" class="w-full">
                <Tabs.List
                    class="grid w-full grid-cols-3 mb-6 bg-muted/50 p-1 rounded-xl"
                >
                    <Tabs.Trigger
                        value="appearance"
                        class="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >Apariencia</Tabs.Trigger
                    >
                    <Tabs.Trigger
                        value="interface"
                        class="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >Interfaz</Tabs.Trigger
                    >
                    <Tabs.Trigger
                        value="data"
                        class="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >Datos</Tabs.Trigger
                    >
                </Tabs.List>

                <!-- Pestaña Apariencia -->
                <Tabs.Content
                    value="appearance"
                    class="space-y-8 animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
                >
                    <!-- Theme Control -->
                    <div class="flex flex-col gap-3">
                        <Label
                            class="text-sm font-semibold tracking-wide text-foreground uppercase"
                        >
                            Tema del sistema
                        </Label>
                        <div
                            class="flex items-center gap-2 bg-muted/40 p-1.5 rounded-xl border border-border/50"
                        >
                            <Button
                                variant="ghost"
                                onclick={() => handleSetMode("light")}
                                class="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all {themeMode ===
                                'light'
                                    ? 'bg-background text-foreground shadow-sm border border-border/50 scale-100 hover:bg-background'
                                    : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground scale-95'}"
                                >Claro</Button
                            >
                            <Button
                                variant="ghost"
                                onclick={() => handleSetMode("dark")}
                                class="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all {themeMode ===
                                'dark'
                                    ? 'bg-background text-foreground shadow-sm border border-border/50 scale-100 hover:bg-background'
                                    : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground scale-95'}"
                                >Oscuro</Button
                            >
                            <Button
                                variant="ghost"
                                onclick={() => handleSetMode("system")}
                                class="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all {themeMode ===
                                'system'
                                    ? 'bg-background text-foreground shadow-sm border border-border/50 scale-100 hover:bg-background'
                                    : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground scale-95'}"
                                >Auto</Button
                            >
                        </div>
                    </div>

                    <!-- Color Palette Control -->
                    <div class="flex flex-col gap-3">
                        <Label
                            class="text-sm font-semibold tracking-wide text-foreground uppercase"
                        >
                            Tono primario
                        </Label>
                        <div
                            class="flex items-center gap-3 bg-muted/40 p-4 rounded-xl border border-border/50 flex-wrap"
                        >
                            {#each colors as c}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onclick={() => setPrimaryColor(c.value)}
                                    class="{c.class} flex items-center justify-center w-11 h-11 rounded-full border-2 transition-all hover:scale-110 active:scale-95 {currentColor ===
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
                                </Button>
                            {/each}
                        </div>
                    </div>

                    <!-- Background Pattern Control -->
                    <div class="flex flex-col gap-3">
                        <Label
                            class="text-sm font-semibold tracking-wide text-foreground uppercase"
                        >
                            Fondo de Lienzo
                        </Label>
                        <div
                            class="flex items-center gap-3 bg-muted/40 p-4 rounded-xl border border-border/50 flex-wrap"
                        >
                            {#each patterns as p}
                                <Button
                                    variant="outline"
                                    onclick={() => {
                                        if (p.id === "custom-image") {
                                            document
                                                .getElementById(
                                                    "hidden-bg-upload",
                                                )
                                                ?.click();
                                        } else {
                                            bgPattern = p.id;
                                        }
                                    }}
                                    class="relative p-0 flex flex-col items-center justify-center w-18 h-14 rounded-xl border-2 overflow-hidden transition-all hover:scale-105 active:scale-95 {bgPattern ===
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
                                            class="text-xs font-semibold text-foreground/90 drop-shadow-sm"
                                            >{p.name}</span
                                        >
                                    </div>
                                </Button>
                            {/each}
                        </div>
                    </div>
                </Tabs.Content>

                <!-- Pestaña Interfaz -->
                <Tabs.Content
                    value="interface"
                    class="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
                >
                    <div
                        class="flex items-center justify-between gap-4 bg-muted/30 p-5 rounded-2xl border border-border/50 shadow-sm transition-colors hover:bg-muted/50"
                    >
                        <div class="space-y-1">
                            <Label
                                class="text-base font-semibold text-foreground"
                                >Ocultar Títulos</Label
                            >
                            <p class="text-sm text-muted-foreground">
                                Oculta los encabezados de las tarjetas para un
                                diseño más limpio.
                            </p>
                        </div>
                        <Switch bind:checked={hideHeaders} />
                    </div>

                    <div
                        class="flex items-center justify-between gap-4 bg-muted/30 p-5 rounded-2xl border border-border/50 shadow-sm transition-colors hover:bg-muted/50"
                    >
                        <div class="space-y-1">
                            <Label
                                class="text-base font-semibold text-foreground"
                                >Ocultar Botones de Tarjeta</Label
                            >
                            <p class="text-sm text-muted-foreground">
                                Oculta los botones de acción dentro de las
                                notas.
                            </p>
                        </div>
                        <Switch bind:checked={hideCardButtons} />
                    </div>
                </Tabs.Content>

                <!-- Pestaña Datos -->
                <Tabs.Content
                    value="data"
                    class="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
                >
                    <div
                        class="rounded-2xl border border-border/60 bg-muted/20 p-6 shadow-sm"
                    >
                        <h3
                            class="text-lg font-semibold text-foreground flex items-center gap-2 mb-2"
                        >
                            Respaldo y Restauración
                        </h3>
                        <p class="text-sm text-muted-foreground mb-6">
                            Exporta tus mesas de trabajo y notas a un archivo
                            seguro para tener un respaldo, o impórtalo en otro
                            dispositivo para no perder tu contenido.
                        </p>

                        <div class="flex flex-col gap-4">
                            <Button
                                variant="secondary"
                                class="w-full justify-start gap-3 h-12 text-base font-medium rounded-xl shadow-md"
                                onclick={() => desktopState.exportWorkspaces()}
                            >
                                <Download class="w-5 h-5" />
                                Exportar Datos
                            </Button>

                            <Button
                                variant="outline"
                                class="w-full justify-start gap-3 h-12 text-base font-medium rounded-xl border-border/60 hover:bg-accent"
                                onclick={handleImportClick}
                            >
                                <Upload class="w-5 h-5" />
                                Importar Datos
                            </Button>
                        </div>
                    </div>
                </Tabs.Content>
            </Tabs.Root>

            <!-- Inputs ocultos -->
            <input
                type="file"
                id="hidden-bg-upload"
                accept="image/*"
                class="hidden"
                onchange={handleCustomImage}
            />
            <input
                type="file"
                accept=".json"
                class="hidden"
                bind:this={fileInputRef}
                onchange={handleFileSelected}
            />
        </div>
    </Dialog.Content>
</Dialog.Root>
