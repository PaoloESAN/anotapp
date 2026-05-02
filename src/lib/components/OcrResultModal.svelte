<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import Copy from "@lucide/svelte/icons/copy";
    import Check from "@lucide/svelte/icons/check";
    import Pin from "@lucide/svelte/icons/pin";
    import Loader2 from "@lucide/svelte/icons/loader-circle";
    import ScanText from "@lucide/svelte/icons/scan-text";
    import Crop from "@lucide/svelte/icons/crop";

    let {
        open = $bindable(false),
        text = $bindable(""),
        imageSrc = "",
        isLoading = false,
        onPinToCanvas,
        onExtract
    }: {
        open: boolean;
        text: string;
        imageSrc: string;
        isLoading: boolean;
        onPinToCanvas: (text: string) => void;
        onExtract: (rect?: { top: number, left: number, width: number, height: number }) => void;
    } = $props();

    let copied = $state(false);
    let mode = $state<"crop" | "result">("crop");

    // Reset mode when opened
    $effect(() => {
        if (open) {
            mode = "crop";
            // Reset crop area
            selection = null;
        }
    });

    // Switch to result mode automatically when text arrives
    $effect(() => {
        if (text && !isLoading && mode === "crop") {
            mode = "result";
        }
    });

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(text);
            copied = true;
            setTimeout(() => (copied = false), 2000);
        } catch (e) {
            console.error("Failed to copy", e);
        }
    }

    function handlePin() {
        if (text.trim()) {
            onPinToCanvas(text);
            open = false;
        }
    }

    // --- CROP LOGIC ---
    let imgElement = $state<HTMLImageElement | null>(null);
    let isDrawing = $state(false);
    let startX = $state(0);
    let startY = $state(0);
    let selection = $state<{ x: number, y: number, w: number, h: number } | null>(null);

    function handlePointerDown(e: PointerEvent) {
        if (!imgElement) return;
        const rect = imgElement.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
        selection = { x: startX, y: startY, w: 0, h: 0 };
        isDrawing = true;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }

    function handlePointerMove(e: PointerEvent) {
        if (!isDrawing || !imgElement || !selection) return;
        const rect = imgElement.getBoundingClientRect();
        const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

        selection = {
            x: Math.min(startX, currentX),
            y: Math.min(startY, currentY),
            w: Math.abs(currentX - startX),
            h: Math.abs(currentY - startY)
        };
    }

    function handlePointerUp(e: PointerEvent) {
        isDrawing = false;
        if (selection && (selection.w < 10 || selection.h < 10)) {
            // Ignore tiny accidental clicks
            selection = null;
        }
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }

    function triggerExtract(useCrop: boolean) {
        if (useCrop && selection && imgElement) {
            // Calculate natural coordinates
            const scaleX = imgElement.naturalWidth / imgElement.clientWidth;
            const scaleY = imgElement.naturalHeight / imgElement.clientHeight;

            onExtract({
                left: Math.round(selection.x * scaleX),
                top: Math.round(selection.y * scaleY),
                width: Math.round(selection.w * scaleX),
                height: Math.round(selection.h * scaleY)
            });
        } else {
            onExtract(); // Full image
        }
        mode = "result";
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-2xl bg-background border-border text-foreground p-0 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div class="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
            <div>
                <Dialog.Title class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    {#if mode === "crop"}
                        <Crop class="w-5 h-5 text-indigo-500" />
                        Seleccionar Área
                    {:else}
                        <ScanText class="w-5 h-5 text-indigo-500" />
                        Texto Extraído
                    {/if}
                    {#if isLoading}
                        <Loader2 class="w-5 h-5 text-primary animate-spin" />
                    {/if}
                </Dialog.Title>
                <Dialog.Description class="text-sm text-muted-foreground mt-1">
                    {#if mode === "crop"}
                        Arrastra para seleccionar el texto que deseas extraer.
                    {:else}
                        Puedes editar el texto libremente antes de copiarlo.
                    {/if}
                </Dialog.Description>
            </div>
            {#if mode === "result" && imageSrc}
                <button 
                    onclick={() => mode = "crop"} 
                    class="text-sm text-indigo-600 hover:text-indigo-700 font-medium px-3 py-1.5 rounded-md hover:bg-indigo-50 transition-colors"
                >
                    Volver a recortar
                </button>
            {/if}
        </div>

        <div class="p-6 flex-1 overflow-hidden min-h-[300px] flex flex-col bg-background relative">
            {#if isLoading}
                <div class="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader2 class="w-8 h-8 text-primary animate-spin mb-3" />
                    <p class="text-sm font-medium text-muted-foreground">Analizando texto...</p>
                </div>
            {/if}
            
            {#if mode === "crop"}
                <div class="w-full h-full flex items-center justify-center relative select-none bg-slate-100 dark:bg-zinc-900 rounded-lg overflow-hidden border border-border/50">
                    <div 
                        role="application"
                        tabindex="-1"
                        aria-label="Lienzo de recorte de imagen"
                        class="relative inline-block touch-none outline-none"
                        onpointerdown={handlePointerDown}
                        onpointermove={handlePointerMove}
                        onpointerup={handlePointerUp}
                    >
                        <img 
                            bind:this={imgElement}
                            src={imageSrc} 
                            alt="Imagen a recortar" 
                            class="max-w-full max-h-[50vh] object-contain pointer-events-none"
                            draggable="false"
                        />
                        
                        {#if selection}
                            <!-- Dark overlay outside crop -->
                            <div class="absolute inset-0 bg-black/40 pointer-events-none" style="clip-path: polygon(0% 0%, 0% 100%, {selection.x}px 100%, {selection.x}px {selection.y}px, {selection.x + selection.w}px {selection.y}px, {selection.x + selection.w}px {selection.y + selection.h}px, {selection.x}px {selection.y + selection.h}px, {selection.x}px 100%, 100% 100%, 100% 0%);"></div>
                            
                            <!-- Selection Box -->
                            <div 
                                class="absolute border-2 border-indigo-500 bg-indigo-500/10 pointer-events-none box-border"
                                style="left: {selection.x}px; top: {selection.y}px; width: {selection.w}px; height: {selection.h}px;"
                            >
                                <!-- Corner handles for visual appeal -->
                                <div class="absolute top-[-4px] left-[-4px] w-2 h-2 bg-white border border-indigo-500"></div>
                                <div class="absolute top-[-4px] right-[-4px] w-2 h-2 bg-white border border-indigo-500"></div>
                                <div class="absolute bottom-[-4px] left-[-4px] w-2 h-2 bg-white border border-indigo-500"></div>
                                <div class="absolute bottom-[-4px] right-[-4px] w-2 h-2 bg-white border border-indigo-500"></div>
                            </div>
                        {/if}
                    </div>
                </div>
            {:else}
                <textarea
                    bind:value={text}
                    class="w-full h-full min-h-[250px] bg-muted/30 border border-border/50 rounded-xl p-4 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none custom-scrollbar transition-all font-medium leading-relaxed"
                    placeholder={isLoading ? "" : "No se detectó texto en la imagen..."}
                    style="scrollbar-width: thin; scrollbar-color: #a1a1aa transparent;"
                ></textarea>
            {/if}
        </div>

        <div class="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between">
            {#if mode === "crop"}
                <div class="text-xs text-muted-foreground">
                    {#if selection}
                        Área seleccionada: {Math.round(selection.w)}x{Math.round(selection.h)}px
                    {:else}
                        Dibuja un rectángulo sobre el texto
                    {/if}
                </div>
                <div class="flex gap-2">
                    <button
                        onclick={() => triggerExtract(false)}
                        disabled={isLoading}
                        class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-border rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                    >
                        Procesar Todo
                    </button>
                    <button
                        onclick={() => triggerExtract(true)}
                        disabled={!selection || isLoading}
                        class="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm w-36 justify-center"
                    >
                        <ScanText class="w-4 h-4" /> Extraer Selección
                    </button>
                </div>
            {:else}
                <div class="flex-1"></div>
                <div class="flex gap-3">
                    <button
                        onclick={handlePin}
                        disabled={isLoading || !text.trim()}
                        class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-border rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        <Pin class="w-4 h-4" />
                        Fijar en Lienzo
                    </button>
                    <button
                        onclick={handleCopy}
                        disabled={isLoading || !text.trim()}
                        class="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-primary/20 w-32 justify-center"
                    >
                        {#if copied}
                            <Check class="w-4 h-4" /> Copiado
                        {:else}
                            <Copy class="w-4 h-4" /> Copiar Todo
                        {/if}
                    </button>
                </div>
            {/if}
        </div>
    </Dialog.Content>
</Dialog.Root>
