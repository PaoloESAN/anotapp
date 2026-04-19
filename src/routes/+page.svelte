<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { readText, readImage } from "@tauri-apps/plugin-clipboard-manager";
    import Trash2 from "@lucide/svelte/icons/trash-2";
    import ImageIcon from "@lucide/svelte/icons/image";
    import Type from "@lucide/svelte/icons/type";
    import Copy from "@lucide/svelte/icons/copy";
    import MousePointer2 from "@lucide/svelte/icons/mouse-pointer-2";
    import { fade, fly } from "svelte/transition";

    interface ClipboardItem {
        id: string;
        type: "text" | "image";
        content: string;
        x: number;
        y: number;
        z: number;
    }

    let items = $state<ClipboardItem[]>([]);
    let maxZ = $state(1);
    let pollInterval: ReturnType<typeof setInterval>;
    let lastText = $state("");
    let lastImageLen = $state(0);

    // App UI state
    let isReady = $state(false);
    let debugMsg = $state("");

    async function poll() {
        try {
            let text = "";
            let textFailed = false;
            try {
                text = await readText();
            } catch (err: any) {
                textFailed = true;
                debugMsg = "text err: " + err?.toString()?.substring(0, 50);
            }

            if (!textFailed && text && text !== lastText && !items.find((i) => i.type === "text" && i.content === text)) {
                lastText = text;
                addItem({ type: "text", content: text });
            }

            // Always try reading image if there's no new text
            if (!text || textFailed) {
                try {
                    const img = await readImage();
                    const rgba = await img.rgba();
    
                    if (rgba.length > 0 && rgba.length !== lastImageLen) {
                        lastImageLen = rgba.length;
                        const size = await img.size();
    
                        const canvas = document.createElement("canvas");
                        canvas.width = size.width;
                        canvas.height = size.height;
                        const ctx = canvas.getContext("2d");
                        if (ctx) {
                            const imgData = new ImageData(
                                new Uint8ClampedArray(rgba),
                                size.width,
                                size.height,
                            );
                            ctx.putImageData(imgData, 0, 0);
                            const dataUrl = canvas.toDataURL("image/png");
    
                            if (!items.find((i) => i.type === "image" && i.content === dataUrl)) {
                                addItem({ type: "image", content: dataUrl });
                            }
                        }
                    }
                } catch (imgErr: any) {
                    if (textFailed) {
                        // ignore both failed, typical empty clipboard
                        // debugMsg = "both failed: " + imgErr.toString();
                    }
                }
            }
        } catch (fatal: any) {
             debugMsg = "Fatal: " + fatal;
        }
    }

    function addItem({
        type,
        content,
    }: {
        type: "text" | "image";
        content: string;
    }) {
        const newX = window.innerWidth / 2 - 150 + (Math.random() * 100 - 50);
        const newY = window.innerHeight / 2 - 150 + (Math.random() * 100 - 50);

        items.push({
            id: crypto.randomUUID(),
            type,
            content,
            x: newX,
            y: newY,
            z: maxZ++,
        });
    }

    onMount(() => {
        pollInterval = setInterval(poll, 1500); // Polling every 1.5s to minimize resources
        setTimeout(() => {
            isReady = true;
        }, 300);
    });

    onDestroy(() => {
        clearInterval(pollInterval);
    });

    // Dragging logic
    let activeDrag: { id: string; offsetX: number; offsetY: number } | null =
        $state(null);

    function onPointerDown(e: PointerEvent, item: ClipboardItem) {
        item.z = maxZ++;
        const el = e.currentTarget as HTMLElement;
        activeDrag = {
            id: item.id,
            offsetX: e.clientX - item.x,
            offsetY: e.clientY - item.y,
        };
        el.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
        if (!activeDrag) return;
        const id = activeDrag.id;
        const item = items.find((i) => i.id === id);
        if (item) {
            item.x = e.clientX - activeDrag.offsetX;
            item.y = e.clientY - activeDrag.offsetY;
        }
    }

    function onPointerUp(e: PointerEvent) {
        if (activeDrag) {
            try {
                // If it was captured, the target might still be the element
                const el = e.target as HTMLElement;
                if (el && el.releasePointerCapture) {
                    el.releasePointerCapture(e.pointerId);
                }
            } catch (err) {
                // Ignore any release pointer capture errors
            }
            activeDrag = null;
        }
    }

    function deleteItem(id: string) {
        items = items.filter((i) => i.id !== id);
    }

    // Copy back to real clipboard
    async function copyToClipboard(item: ClipboardItem) {
        if (item.type === "text") {
            try {
                const { writeText } = await import(
                    "@tauri-apps/plugin-clipboard-manager"
                );
                await writeText(item.content);
                lastText = item.content; // update local so it doesn't trigger again
            } catch (err) {
                console.error("Failed to copy", err);
            }
        }
    }
</script>

<svelte:window onpointermove={onPointerMove} onpointerup={onPointerUp} />

<main
    class="h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 relative font-sans isolate selection:bg-indigo-500/30"
>
    <!-- Dynamic Background Grid -->
    <div
        class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] pointer-events-none -z-10"
        aria-hidden="true"
    ></div>

    <!-- Soft Ambient Glow -->
    <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 opacity-50 blur-[120px] rounded-full pointer-events-none -z-10"
    ></div>

    <!-- Empty State -->
    {#if isReady && items.length === 0}
        <div
            in:fade={{ duration: 600, delay: 200 }}
            out:fade={{ duration: 200 }}
            class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        >
            <div
                class="w-24 h-24 mb-6 rounded-full bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50 shadow-2xl relative shadow-indigo-500/10"
            >
                <Copy class="w-10 h-10 text-zinc-400" strokeWidth={1.5} />
                <!-- Ping indicator -->
                <div class="absolute top-0 right-0 w-3 h-3">
                    <span
                        class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"
                    ></span>
                    <span
                        class="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"
                    ></span>
                </div>
            </div>
            <h1 class="text-3xl tracking-tight font-light text-zinc-300">
                Empieza a copiar
            </h1>
            <p class="text-zinc-500 mt-2 font-medium">
                los elementos aparecerán aquí como ventanas flotantes
            </p>
        </div>
    {/if}

    <!-- Items Canvas -->
    {#each items as item (item.id)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            in:fly={{ y: 20, duration: 400, opacity: 0 }}
            out:fade={{ duration: 200 }}
            class="absolute cursor-grab active:cursor-grabbing group min-w-[280px] max-w-[400px] select-none"
            style="left: {item.x}px; top: {item.y}px; z-index: {item.z};"
            onpointerdown={(e) => onPointerDown(e, item)}
        >
            <!-- Card Container (Glassmorphism design) -->
            <div
                class="rounded-2xl border border-zinc-700/50 bg-zinc-900/60 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300 transform group-hover:border-zinc-600/80 group-hover:shadow-indigo-500/5 ring-1 ring-white/5"
            >
                <!-- Header (Drag Handle) -->
                <div
                    class="flex items-center justify-between px-3 py-2 border-b border-zinc-800/50 bg-zinc-900/80"
                >
                    <div class="flex items-center space-x-2 text-zinc-400">
                        {#if item.type === "text"}
                            <Type class="w-4 h-4 text-indigo-400" />
                            <span
                                class="text-xs font-medium uppercase tracking-wider text-zinc-500"
                                >Texto</span
                            >
                        {:else}
                            <ImageIcon class="w-4 h-4 text-emerald-400" />
                            <span
                                class="text-xs font-medium uppercase tracking-wider text-zinc-500"
                                >Imagen</span
                            >
                        {/if}
                    </div>

                    <div
                        class="flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        {#if item.type === "text"}
                            <button
                                onpointerdown={(e) => e.stopPropagation()}
                                onclick={() => copyToClipboard(item)}
                                class="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-200 transition-colors"
                                title="Copiar"
                            >
                                <Copy class="w-3.5 h-3.5" />
                            </button>
                        {/if}
                        <button
                            onpointerdown={(e) => e.stopPropagation()}
                            onclick={() => deleteItem(item.id)}
                            class="p-1.5 hover:bg-red-500/20 rounded-md text-zinc-400 hover:text-red-400 transition-colors ml-1"
                            title="Eliminar"
                        >
                            <Trash2 class="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                <!-- Content Area -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div class="p-4" onpointerdown={(e) => e.stopPropagation()}>
                    {#if item.type === "text"}
                        <div
                            class="text-zinc-200 text-sm font-medium leading-relaxed max-h-[150px] overflow-y-auto pr-2 custom-scrollbar wrap-break-word cursor-text select-text"
                            style="scrollbar-width: thin; scrollbar-color: #3f3f46 transparent;"
                        >
                            {item.content}
                        </div>
                    {:else}
                        <div
                            class="flex justify-center bg-zinc-950/30 rounded-lg overflow-hidden border border-zinc-800/50"
                        >
                            <img
                                src={item.content}
                                alt="Clipboard capture"
                                class="max-w-full max-h-[250px] object-scale-down rounded-sm pointer-events-none"
                            />
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    {/each}

    <!-- Top App Header / Deco -->
    <div
        class="fixed top-0 left-0 w-full px-6 py-4 pointer-events-none z-50 flex items-center justify-between"
    >
        <div
            class="flex items-center space-x-3 text-zinc-200 font-semibold tracking-tight text-lg drop-shadow-md"
        >
            <div
                class="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30"
            >
                <MousePointer2 class="w-3.5 h-3.5 text-white" />
            </div>
            <span>Anotapp</span>
        </div>
    </div>
</main>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        background: #09090b;
    }

    :global(.custom-scrollbar::-webkit-scrollbar) {
        width: 4px;
    }
    :global(.custom-scrollbar::-webkit-scrollbar-track) {
        background: transparent;
    }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb) {
        background-color: #3f3f46;
        border-radius: 4px;
    }
</style>
