<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
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



    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(text);
            if (text.trim()) {
                onPinToCanvas(text);
            }
            open = false;
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
    let resizing = $state<"nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w" | null>(null);
    let startX = $state(0);
    let startY = $state(0);
    let selection = $state<{ x: number, y: number, w: number, h: number } | null>(null);
    let initialSelection = $state<{ x: number, y: number, w: number, h: number } | null>(null);

    function handlePointerDown(e: PointerEvent) {
        if (!imgElement) return;
        const rect = imgElement.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
        selection = { x: startX, y: startY, w: 0, h: 0 };
        isDrawing = true;
        resizing = null;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }

    function startResize(e: PointerEvent, handle: "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w") {
        e.stopPropagation();
        if (!imgElement || !selection) return;
        const rect = imgElement.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
        initialSelection = { ...selection };
        resizing = handle;
        isDrawing = false;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }

    function handlePointerMove(e: PointerEvent) {
        if (!imgElement) return;
        const rect = imgElement.getBoundingClientRect();
        const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

        if (isDrawing && selection) {
            selection = {
                x: Math.min(startX, currentX),
                y: Math.min(startY, currentY),
                w: Math.abs(currentX - startX),
                h: Math.abs(currentY - startY)
            };
        } else if (resizing && initialSelection) {
            let newX = initialSelection.x;
            let newY = initialSelection.y;
            let newW = initialSelection.w;
            let newH = initialSelection.h;

            const dx = currentX - startX;
            const dy = currentY - startY;

            if (resizing.includes("w")) {
                newX = Math.min(initialSelection.x + initialSelection.w, Math.max(0, initialSelection.x + dx));
                newW = initialSelection.x + initialSelection.w - newX;
            }
            if (resizing.includes("e")) {
                newW = Math.min(rect.width - initialSelection.x, Math.max(0, initialSelection.w + dx));
            }
            if (resizing.includes("n")) {
                newY = Math.min(initialSelection.y + initialSelection.h, Math.max(0, initialSelection.y + dy));
                newH = initialSelection.y + initialSelection.h - newY;
            }
            if (resizing.includes("s")) {
                newH = Math.min(rect.height - initialSelection.y, Math.max(0, initialSelection.h + dy));
            }

            selection = { x: newX, y: newY, w: newW, h: newH };
        }
    }

    function handlePointerUp(e: PointerEvent) {
        isDrawing = false;
        resizing = null;
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
    <Dialog.Content class="sm:max-w-2xl p-6 flex flex-col max-h-[85vh] overflow-hidden gap-4">
        <Dialog.Header class="flex flex-row items-center justify-between space-y-0">
            <div>
                <Dialog.Title class="flex items-center gap-2">
                    {#if mode === "crop"}
                        Seleccionar Área
                    {:else}
                        Texto Extraído
                    {/if}
                    {#if isLoading}
                        <Loader2 class="w-5 h-5 text-primary animate-spin" />
                    {/if}
                </Dialog.Title>
                <Dialog.Description class="mt-1">
                    {#if mode === "crop"}
                        Arrastra para seleccionar el texto que deseas extraer.
                    {:else}
                        Puedes editar el texto libremente antes de copiarlo.
                    {/if}
                </Dialog.Description>
            </div>
        </Dialog.Header>

        <div class="flex-1 overflow-hidden min-h-[300px] flex flex-col relative rounded-md border border-input">
            {#if isLoading}
                <div class="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-md">
                    <Loader2 class="w-8 h-8 text-primary animate-spin mb-3" />
                    <p class="text-sm font-medium text-muted-foreground">Analizando texto...</p>
                </div>
            {/if}
            
            {#if mode === "crop"}
                <div class="w-full h-full flex items-center justify-center relative select-none bg-muted/50 overflow-hidden">
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
                            class="max-w-full max-h-[50vh] object-contain pointer-events-none rounded-md"
                            draggable="false"
                        />
                        
                        {#if selection}
                            <!-- Dark overlay outside crop -->
                            <div class="absolute inset-0 bg-black/40 pointer-events-none rounded-md" style="clip-path: polygon(0% 0%, 0% 100%, {selection.x}px 100%, {selection.x}px {selection.y}px, {selection.x + selection.w}px {selection.y}px, {selection.x + selection.w}px {selection.y + selection.h}px, {selection.x}px {selection.y + selection.h}px, {selection.x}px 100%, 100% 100%, 100% 0%);"></div>
                            
                            <!-- Selection Box -->
                            <div 
                                class="absolute border-2 border-primary bg-primary/10 pointer-events-none box-border"
                                style="left: {selection.x}px; top: {selection.y}px; width: {selection.w}px; height: {selection.h}px;"
                            >
                                <!-- Corner handles for visual appeal -->
                                <div 
                                    class="absolute top-[-5px] left-[-5px] w-3 h-3 bg-white border border-primary pointer-events-auto cursor-nwse-resize z-10"
                                    onpointerdown={(e) => startResize(e, "nw")}
                                    onpointermove={handlePointerMove}
                                    onpointerup={handlePointerUp}
                                    role="separator"
                                    tabindex="-1"
                                    aria-label="Redimensionar esquina superior izquierda"
                                ></div>
                                <div 
                                    class="absolute top-[-5px] right-[-5px] w-3 h-3 bg-white border border-primary pointer-events-auto cursor-nesw-resize z-10"
                                    onpointerdown={(e) => startResize(e, "ne")}
                                    onpointermove={handlePointerMove}
                                    onpointerup={handlePointerUp}
                                    role="separator"
                                    tabindex="-1"
                                    aria-label="Redimensionar esquina superior derecha"
                                ></div>
                                <div 
                                    class="absolute bottom-[-5px] left-[-5px] w-3 h-3 bg-white border border-primary pointer-events-auto cursor-nesw-resize z-10"
                                    onpointerdown={(e) => startResize(e, "sw")}
                                    onpointermove={handlePointerMove}
                                    onpointerup={handlePointerUp}
                                    role="separator"
                                    tabindex="-1"
                                    aria-label="Redimensionar esquina inferior izquierda"
                                ></div>
                                <div 
                                    class="absolute bottom-[-5px] right-[-5px] w-3 h-3 bg-white border border-primary pointer-events-auto cursor-nwse-resize z-10"
                                    onpointerdown={(e) => startResize(e, "se")}
                                    onpointermove={handlePointerMove}
                                    onpointerup={handlePointerUp}
                                    role="separator"
                                    tabindex="-1"
                                    aria-label="Redimensionar esquina inferior derecha"
                                ></div>
                                
                                <!-- Invisible edge handles -->
                                <div 
                                    class="absolute top-[-5px] left-0 right-0 h-[10px] pointer-events-auto cursor-ns-resize"
                                    onpointerdown={(e) => startResize(e, "n")}
                                    onpointermove={handlePointerMove}
                                    onpointerup={handlePointerUp}
                                    role="separator"
                                    tabindex="-1"
                                ></div>
                                <div 
                                    class="absolute bottom-[-5px] left-0 right-0 h-[10px] pointer-events-auto cursor-ns-resize"
                                    onpointerdown={(e) => startResize(e, "s")}
                                    onpointermove={handlePointerMove}
                                    onpointerup={handlePointerUp}
                                    role="separator"
                                    tabindex="-1"
                                ></div>
                                <div 
                                    class="absolute top-0 bottom-0 left-[-5px] w-[10px] pointer-events-auto cursor-ew-resize"
                                    onpointerdown={(e) => startResize(e, "w")}
                                    onpointermove={handlePointerMove}
                                    onpointerup={handlePointerUp}
                                    role="separator"
                                    tabindex="-1"
                                ></div>
                                <div 
                                    class="absolute top-0 bottom-0 right-[-5px] w-[10px] pointer-events-auto cursor-ew-resize"
                                    onpointerdown={(e) => startResize(e, "e")}
                                    onpointermove={handlePointerMove}
                                    onpointerup={handlePointerUp}
                                    role="separator"
                                    tabindex="-1"
                                ></div>
                            </div>
                        {/if}
                    </div>
                </div>
            {:else}
                <textarea
                    bind:value={text}
                    class="flex-1 w-full h-full min-h-[300px] rounded-md bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none custom-scrollbar transition-colors leading-relaxed border-0"
                    placeholder={isLoading ? "" : "No se detectó texto en la imagen..."}
                    style="scrollbar-width: thin; scrollbar-color: #a1a1aa transparent;"
                ></textarea>
            {/if}
        </div>

        <Dialog.Footer class="sm:justify-between w-full items-center">
            {#if mode === "crop"}
                <div class="flex-1"></div>
                <div class="flex gap-2">
                    <Button variant="outline" disabled={isLoading} onclick={() => triggerExtract(false)}>
                        Procesar Todo
                    </Button>
                    <Button disabled={!selection || isLoading} onclick={() => triggerExtract(true)}>
                        <ScanText class="w-4 h-4 mr-2" /> Extraer Selección
                    </Button>
                </div>
            {:else}
                <div class="flex-1 flex justify-start">
                    {#if imageSrc}
                        <Button variant="outline" onclick={() => mode = "crop"}>
                            Volver a recortar
                        </Button>
                    {/if}
                </div>
                <div class="flex gap-2 mt-4 sm:mt-0">
                    <Button variant="outline" disabled={isLoading || !text.trim()} onclick={handlePin}>
                        <Pin class="w-4 h-4 mr-2" /> Fijar en Lienzo
                    </Button>
                    <Button disabled={isLoading || !text.trim()} onclick={handleCopy}>
                        {#if copied}
                            <Check class="w-4 h-4 mr-2" /> Copiado
                        {:else}
                            <Copy class="w-4 h-4 mr-2" /> Copiar Todo
                        {/if}
                    </Button>
                </div>
            {/if}
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
