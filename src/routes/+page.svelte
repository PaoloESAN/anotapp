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
        w?: number;
        h?: number;
        editing?: boolean;
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

            if (
                !textFailed &&
                text &&
                text !== lastText &&
                !items.find((i) => i.type === "text" && i.content === text)
            ) {
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

                            // Calculate proper initial wrap size
                            let targetW = size.width + 16; // Add minor layout padding
                            let targetH = size.height + 56; // Add header height + padding
                            if (targetW > 350) {
                                targetH = (350 / targetW) * targetH;
                                targetW = 350;
                            }
                            if (targetH > 400) {
                                targetW = (400 / targetH) * targetW;
                                targetH = 400;
                            }

                            if (
                                !items.find(
                                    (i) =>
                                        i.type === "image" &&
                                        i.content === dataUrl,
                                )
                            ) {
                                addItem({ type: "image", content: dataUrl, w: targetW, h: targetH });
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
        w,
        h
    }: {
        type: "text" | "image";
        content: string;
        w?: number;
        h?: number;
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
            w,
            h
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

    // Dragging and Resizing logic
    let activeDrag: { id: string; offsetX: number; offsetY: number } | null =
        $state(null);
    let activeResize: {
        id: string;
        startW: number;
        startH: number;
        startX: number;
        startY: number;
    } | null = $state(null);

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

    function onResizeStart(e: PointerEvent, item: ClipboardItem) {
        e.stopPropagation();
        e.preventDefault();
        item.z = maxZ++;
        const el = document.getElementById(`card-${item.id}`);
        const rect = el?.getBoundingClientRect();

        activeResize = {
            id: item.id,
            startW: rect ? rect.width : item.w || 280,
            startH: rect ? rect.height : item.h || 150,
            startX: e.clientX,
            startY: e.clientY,
        };
        const handle = e.currentTarget as HTMLElement;
        handle.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
        if (activeDrag) {
            const id = activeDrag.id;
            const item = items.find((i) => i.id === id);
            if (item) {
                // Remove clamp here to allow free dragging, only clamp on window resize
                item.x = e.clientX - activeDrag.offsetX;
                item.y = e.clientY - activeDrag.offsetY;
            }
        } else if (activeResize) {
            const item = items.find((i) => i.id === activeResize!.id);
            if (item) {
                const newW =
                    activeResize!.startW + (e.clientX - activeResize!.startX);
                const newH =
                    activeResize!.startH + (e.clientY - activeResize!.startY);
                // Minimum limits separated by type
                const minW = item.type === "image" ? 100 : 200;
                const minH = item.type === "image" ? 100 : 100;
                item.w = Math.max(minW, newW);
                item.h = Math.max(minH, newH);
            }
        }
    }

    function onPointerUp(e: PointerEvent) {
        if (activeDrag || activeResize) {
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
            activeResize = null;
        }
    }

    // Keep items in view when window resizes
    function onWindowResize() {
        const padding = 20;
        let modified = false;
        items.forEach((item) => {
            const el = document.getElementById(`card-${item.id}`);
            const w = item.w || el?.getBoundingClientRect().width || 280;
            const h = item.h || el?.getBoundingClientRect().height || 150;

            if (item.x + w > window.innerWidth - padding) {
                item.x = Math.max(padding, window.innerWidth - w - padding);
                modified = true;
            }
            if (item.y + h > window.innerHeight - padding) {
                item.y = Math.max(padding, window.innerHeight - h - padding);
                modified = true;
            }
            if (item.x < padding) {
                item.x = padding;
                modified = true;
            }
            if (item.y < padding) {
                item.y = padding;
                modified = true;
            }

            // force reactivity properly in svelte 5 deep state if object is mutated directly
        });
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

<svelte:window
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onresize={onWindowResize}
/>

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
            id="card-{item.id}"
            in:fly={{ y: 20, duration: 400, opacity: 0 }}
            out:fade={{ duration: 200 }}
            class="absolute group select-none flex flex-col"
            style="left: {item.x}px; top: {item.y}px; z-index: {item.z}; {item.w
                ? `width: ${item.w}px;`
                : item.type === 'text' ? 'min-width: 280px; max-width: 400px;' : 'min-width: 150px;'} {item.h
                ? `height: ${item.h}px;`
                : ''}"
            onpointerdown={() => { item.z = maxZ++; }}
        >
            <!-- Card Container (Glassmorphism design) -->
            <div
                class="rounded-2xl border border-zinc-700/50 bg-zinc-900/60 backdrop-blur-xl shadow-2xl transition-all duration-300 group-hover:border-zinc-600/80 group-hover:shadow-indigo-500/5 ring-1 ring-white/5 flex flex-col w-full h-full relative"
            >
                <!-- Header (Drag Handle) -->
                <div
                    class="shrink-0 flex items-center justify-between px-3 py-2 border-b border-zinc-800/50 bg-zinc-900/80 rounded-t-2xl cursor-grab active:cursor-grabbing"
                    onpointerdown={(e) => onPointerDown(e, item)}
                >
                    <div class="flex items-center space-x-2 text-zinc-400 min-w-0">
                        {#if item.type === "text"}
                            <Type class="w-4 h-4 text-indigo-400 shrink-0" />
                            {#if !item.w || item.w >= 140}
                                <span
                                    class="text-xs font-semibold tracking-wider text-zinc-500 truncate"
                                >
                                    TEXTO
                                </span>
                            {/if}
                        {:else}
                            <ImageIcon class="w-4 h-4 text-emerald-400 shrink-0" />
                            {#if !item.w || item.w >= 140}
                                <span
                                    class="text-xs font-semibold tracking-wider text-zinc-500 truncate"
                                >
                                    IMAGEN
                                </span>
                            {/if}
                        {/if}
                    </div>

                    <div
                        class="flex items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
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
                <div
                    class="flex-1 flex overflow-hidden min-h-0 {item.type === 'image' ? 'p-1.5' : 'p-4'}"
                >
                    {#if item.type === "text"}
                        {#if item.editing}
                            <!-- svelte-ignore a11y_autofocus -->
                            <textarea
                                bind:value={item.content}
                                autofocus
                                onblur={() => (item.editing = false)}
                                onkeydown={(e) => {
                                    if (e.key === "Escape") item.editing = false;
                                    if (e.key === "Enter" && e.ctrlKey) item.editing = false;
                                }}
                                class="w-full h-full bg-zinc-950/50 rounded px-1 py-0.5 text-zinc-200 text-sm font-medium leading-relaxed resize-none outline-none ring-1 ring-indigo-500/50 custom-scrollbar wrap-break-word"
                                style="scrollbar-width: thin; scrollbar-color: #3f3f46 transparent;"
                            ></textarea>
                        {:else}
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div
                                ondblclick={() => (item.editing = true)}
                                class="text-zinc-200 text-sm font-medium leading-relaxed w-full h-full overflow-y-auto pr-2 custom-scrollbar wrap-break-word cursor-text select-text hover:bg-zinc-800/20 rounded transition-colors"
                                style="scrollbar-width: thin; scrollbar-color: #3f3f46 transparent;"
                                title="Doble clic para editar"
                            >
                                {item.content}
                            </div>
                        {/if}
                    {:else}
                        <div
                            class="flex flex-1 items-center justify-center bg-zinc-950/60 rounded overflow-hidden border border-zinc-800/80 w-full h-full relative"
                        >
                            <!-- Ambient blur behind image for a premium look -->
                            <div class="absolute inset-0 bg-cover bg-center opacity-30 blur-md scale-110 pointer-events-none" style="background-image: url({item.content})"></div>
                            
                            <img
                                src={item.content}
                                alt="Clipboard capture"
                                class="w-full h-full object-contain pointer-events-none drop-shadow-lg z-10"
                            />
                        </div>
                    {/if}
                </div>

                <!-- Resize Handle -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    class="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onpointerdown={(e) => onResizeStart(e, item)}
                >
                    <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        class="text-zinc-500"
                    >
                        <path
                            d="M9 9L9 4"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                        />
                        <path
                            d="M4 9L9 9"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                        />
                        <path
                            d="M5 5L9 9"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                        />
                    </svg>
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
