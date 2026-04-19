<script lang="ts">
    import { fade, fly } from "svelte/transition";
    import Type from "@lucide/svelte/icons/type";
    import ImageIcon from "@lucide/svelte/icons/image";
    import Trash2 from "@lucide/svelte/icons/trash-2";
    import Copy from "@lucide/svelte/icons/copy";
    import type { ClipboardItem } from "$lib/types";

    let {
        item,
        onBringToFront,
        onDragStart,
        onResizeStart,
        onCopy,
        onDelete,
    }: {
        item: ClipboardItem;
        onBringToFront: (id: string) => void;
        onDragStart: (e: PointerEvent, id: string) => void;
        onResizeStart: (e: PointerEvent, id: string) => void;
        onCopy: (item: ClipboardItem) => void;
        onDelete: (id: string) => void;
    } = $props();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    id="card-{item.id}"
    in:fly={{ y: 20, duration: 400, opacity: 0 }}
    out:fade={{ duration: 200 }}
    class="absolute group select-none flex flex-col"
    style="left: {item.x}px; top: {item.y}px; z-index: {item.z}; {item.w
        ? `width: ${item.w}px;`
        : item.type === 'text'
          ? 'min-width: 200px; max-width: clamp(250px, 40vw, 400px);'
          : 'min-width: 150px;'} {item.h 
        ? `height: ${item.h}px;` 
        : item.type === 'text' ? 'max-height: clamp(120px, 35vh, 200px);' : ''}"
    onpointerdown={() => onBringToFront(item.id)}
>
    <!-- Card Container -->
    <div
        class="rounded-2xl border border-zinc-700/50 bg-zinc-900/60 backdrop-blur-xl shadow-2xl transition-all duration-300 group-hover:border-zinc-600/80 group-hover:shadow-indigo-500/5 ring-1 ring-white/5 flex flex-col w-full flex-1 min-h-0 relative"
    >
        <!-- Header Handle -->
        <div
            class="shrink-0 flex items-center justify-between px-3 py-2 border-b border-zinc-800/50 bg-zinc-900/80 rounded-t-2xl cursor-grab active:cursor-grabbing"
            onpointerdown={(e) => onDragStart(e, item.id)}
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
                        onclick={() => onCopy(item)}
                        class="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-200 transition-colors"
                        title="Copiar"
                    >
                        <Copy class="w-3.5 h-3.5" />
                    </button>
                {/if}
                <button
                    onpointerdown={(e) => e.stopPropagation()}
                    onclick={() => onDelete(item.id)}
                    class="p-1.5 hover:bg-red-500/20 rounded-md text-zinc-400 hover:text-red-400 transition-colors ml-1"
                    title="Eliminar"
                >
                    <Trash2 class="w-3.5 h-3.5" />
                </button>
            </div>
        </div>

        <!-- Content Area -->
        <div
            class="flex-1 flex overflow-hidden min-h-0 {item.type === 'image'
                ? 'p-1.5'
                : 'p-4'}"
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
                            if (e.key === "Enter" && e.ctrlKey)
                                item.editing = false;
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
                    <div
                        class="absolute inset-0 bg-cover bg-center opacity-30 blur-md scale-110 pointer-events-none"
                        style="background-image: url({item.content})"
                    ></div>
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
            onpointerdown={(e) => onResizeStart(e, item.id)}
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
