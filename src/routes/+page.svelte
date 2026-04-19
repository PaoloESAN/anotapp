<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { readText, readImage } from "@tauri-apps/plugin-clipboard-manager";
    import MousePointer2 from "@lucide/svelte/icons/mouse-pointer-2";
    import type { ClipboardItem } from "$lib/types";
    import ClipboardCard from "$lib/components/ClipboardCard.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import ClearAllAlert from "$lib/components/ClearAllAlert.svelte";
    import ActionButtons from "$lib/components/ActionButtons.svelte";

    let _initialItems: ClipboardItem[] = [];
    let _initialZ = 1;
    let _initialHideHeaders = false;
    if (typeof localStorage !== "undefined") {
        try {
            const saved = localStorage.getItem("anotapp-items");
            if (saved) {
                _initialItems = JSON.parse(saved);
                _initialZ =
                    Math.max(0, ..._initialItems.map((i) => i.z || 0)) + 1;
            }
            const savedHeaders = localStorage.getItem("anotapp-hide-headers");
            if (savedHeaders === "true") _initialHideHeaders = true;
        } catch (e) {}
    }

    let items = $state<ClipboardItem[]>(_initialItems);
    let maxZ = $state(_initialZ);
    let pollInterval: ReturnType<typeof setInterval>;
    let lastText = $state("");
    let lastImageSize = $state("");
    let isReady = $state(false);
    let isAlertOpen = $state(false);

    let hideHeaders = $state(_initialHideHeaders);

    $effect(() => {
        // Deeply track items via JSON serialization
        const serialized = JSON.stringify(items);
        const hideState = hideHeaders;

        // Debounce storage writes to prevent IO blocking during drag/resize (60fps)
        const timer = setTimeout(() => {
            try {
                localStorage.setItem("anotapp-items", serialized);
                localStorage.setItem("anotapp-hide-headers", String(hideState));
            } catch (err) {
                console.warn("Storage exception, possibly exceeded quota", err);
            }
        }, 500);

        return () => clearTimeout(timer);
    });

    async function poll() {
        try {
            let text = "";
            let textFailed = false;
            try {
                text = await readText();
            } catch (err) {
                textFailed = true;
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

            if (!text || textFailed) {
                try {
                    const img = await readImage();
                    const size = await img.size();
                    const sizeStr = `${size.width}x${size.height}`;

                    if (sizeStr !== "0x0" && sizeStr !== lastImageSize) {
                        lastImageSize = sizeStr;
                        const rgba = await img.rgba();

                        const tempCanvas = document.createElement("canvas");
                        tempCanvas.width = size.width;
                        tempCanvas.height = size.height;
                        const tCtx = tempCanvas.getContext("2d");

                        if (tCtx) {
                            tCtx.putImageData(
                                new ImageData(
                                    new Uint8ClampedArray(rgba),
                                    size.width,
                                    size.height,
                                ),
                                0,
                                0,
                            );

                            // Scale down if it's monstrously huge to prevent UI thread lock
                            const scale = Math.min(
                                1,
                                1500 / Math.max(size.width, size.height),
                            );
                            const cw = Math.floor(size.width * scale);
                            const ch = Math.floor(size.height * scale);

                            const canvas = document.createElement("canvas");
                            canvas.width = cw;
                            canvas.height = ch;
                            const ctx = canvas.getContext("2d");

                            if (ctx) {
                                ctx.drawImage(tempCanvas, 0, 0, cw, ch);
                                // Use WebP or JPEG for 10x faster encoding than PNG
                                const dataUrl = canvas.toDataURL(
                                    "image/webp",
                                    0.9,
                                );

                                let targetW = size.width + 16;
                                let targetH = size.height + 56;
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
                                    addItem({
                                        type: "image",
                                        content: dataUrl,
                                        w: targetW,
                                        h: targetH,
                                    });
                                }
                            }
                        }
                    }
                } catch (imgErr) {}
            }
        } catch (fatal) {}
    }

    function addItem({
        type,
        content,
        w,
        h,
    }: {
        type: "text" | "image";
        content: string;
        w?: number;
        h?: number;
    }) {
        items.push({
            id: crypto.randomUUID(),
            type,
            content,
            x: window.innerWidth / 2 - 150 + (Math.random() * 100 - 50),
            y: window.innerHeight / 2 - 150 + (Math.random() * 100 - 50),
            z: maxZ++,
            w,
            h,
        });
    }

    function addEmptyText() {
        items.push({
            id: crypto.randomUUID(),
            type: "text",
            content: "",
            x: window.innerWidth / 2 - 140 + (Math.random() * 40 - 20),
            y: window.innerHeight / 2 - 75 + (Math.random() * 40 - 20),
            z: maxZ++,
            w: 280,
            h: 150,
            editing: false,
        });
    }

    onMount(() => {
        pollInterval = setInterval(poll, 1500);
        setTimeout(() => (isReady = true), 300);
    });

    onDestroy(() => clearInterval(pollInterval));

    let activeDrag: { id: string; offsetX: number; offsetY: number } | null =
        $state(null);
    let activeResize: {
        id: string;
        startW: number;
        startH: number;
        startX: number;
        startY: number;
    } | null = $state(null);

    function onDragStart(e: PointerEvent, id: string) {
        const item = items.find((i) => i.id === id);
        if (!item) return;
        item.z = maxZ++;
        activeDrag = {
            id,
            offsetX: e.clientX - item.x,
            offsetY: e.clientY - item.y,
        };
        const el = e.currentTarget as HTMLElement;
        el.setPointerCapture(e.pointerId);
    }

    function onResizeStart(e: PointerEvent, id: string) {
        e.stopPropagation();
        e.preventDefault();
        const item = items.find((i) => i.id === id);
        if (!item) return;
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
            const item = items.find((i) => i.id === activeDrag!.id);
            if (item) {
                item.x = e.clientX - activeDrag.offsetX;
                item.y = e.clientY - activeDrag.offsetY;
            }
        } else if (activeResize) {
            const item = items.find((i) => i.id === activeResize!.id);
            if (item) {
                item.w = Math.max(
                    item.type === "image" ? 100 : 200,
                    activeResize!.startW + (e.clientX - activeResize!.startX),
                );
                item.h = Math.max(
                    item.type === "image" ? 100 : 100,
                    activeResize!.startH + (e.clientY - activeResize!.startY),
                );
            }
        }
    }

    function onPointerUp(e: PointerEvent) {
        if (!activeDrag && !activeResize) return;
        try {
            const el = e.target as HTMLElement;
            if (el && el.releasePointerCapture)
                el.releasePointerCapture(e.pointerId);
        } catch (err) {}
        activeDrag = null;
        activeResize = null;
    }

    function onWindowResize() {
        const padding = 20;
        items.forEach((item) => {
            const el = document.getElementById(`card-${item.id}`);
            const w = item.w || el?.getBoundingClientRect().width || 280;
            const h = item.h || el?.getBoundingClientRect().height || 150;
            if (item.x + w > window.innerWidth - padding)
                item.x = Math.max(padding, window.innerWidth - w - padding);
            if (item.y + h > window.innerHeight - padding)
                item.y = Math.max(padding, window.innerHeight - h - padding);
            if (item.x < padding) item.x = padding;
            if (item.y < padding) item.y = padding;
        });
    }

    function onDelete(id: string) {
        items = items.filter((i) => i.id !== id);
    }

    function onBringToFront(id: string) {
        const item = items.find((i) => i.id === id);
        if (item) item.z = maxZ++;
    }

    async function onCopy(item: ClipboardItem) {
        try {
            if (item.type === "text") {
                const { writeText } = await import(
                    "@tauri-apps/plugin-clipboard-manager"
                );
                await writeText(item.content);
                lastText = item.content;
            } else if (item.type === "image") {
                const { writeImage } = await import(
                    "@tauri-apps/plugin-clipboard-manager"
                );
                const res = await fetch(item.content);
                const blob = await res.blob();
                const buffer = await blob.arrayBuffer();
                await writeImage(new Uint8Array(buffer));
            }
        } catch (err) {}
    }
</script>

<svelte:window
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onresize={onWindowResize}
/>

<main
    class="h-screen w-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 relative font-sans isolate selection:bg-primary/30 transition-colors duration-500"
>
    <div
        class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] pointer-events-none -z-10"
        aria-hidden="true"
    ></div>
    <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 opacity-50 blur-[120px] rounded-full pointer-events-none -z-10"
    ></div>

    <EmptyState {isReady} hasItems={items.length > 0} />

    {#each items as item (item.id)}
        <ClipboardCard
            {item}
            {onBringToFront}
            {onDragStart}
            {onResizeStart}
            {onDelete}
            {onCopy}
            {hideHeaders}
        />
    {/each}

    <div
        class="fixed top-0 left-0 w-full px-6 py-4 pointer-events-none z-50 flex items-center justify-between"
    >
        <div
            class="flex items-center space-x-3 text-slate-700 dark:text-zinc-200 font-semibold tracking-tight text-lg drop-shadow-md"
        >
            <div
                class="w-6 h-6 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
            >
                <MousePointer2 class="w-3.5 h-3.5 text-white" />
            </div>
            <span>Anotapp</span>
        </div>
    </div>

    <ActionButtons {addEmptyText} bind:hideHeaders />

    <ClearAllAlert count={items.length} onClear={() => (items = [])} />
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
