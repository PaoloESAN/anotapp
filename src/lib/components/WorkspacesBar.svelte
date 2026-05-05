<script lang="ts">
    import { desktopState } from "../../routes/desktop-state.svelte";
    import Plus from "@lucide/svelte/icons/plus";
    import X from "@lucide/svelte/icons/x";
    import AlertCircle from "@lucide/svelte/icons/alert-circle";
    import { fade, fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import { tick } from "svelte";

    let editingId = $state<string | null>(null);
    let editValue = $state("");
    let isHovered = $state(false);

    let isExpandedActual = $derived(
        isHovered ||
            (!!desktopState.draggedItemId &&
                desktopState.pointerY > window.innerHeight - 100),
    );

    let isExpanded = $state(false);
    $effect(() => {
        if (isExpandedActual) {
            isExpanded = true;
        } else {
            const timer = setTimeout(() => (isExpanded = false), 80);
            return () => clearTimeout(timer);
        }
    });

    let workspaceToDelete = $state<string | null>(null);
    let showDeleteAlert = $state(false);

    async function startEditing(id: string, currentName: string) {
        editingId = id;
        editValue = currentName;
        await tick();
        const input = document.getElementById(
            `edit-ws-${id}`,
        ) as HTMLInputElement;
        if (input) {
            input.focus();
            input.select();
        }
    }

    function saveName(id: string) {
        const ws = desktopState.workspaces.find((w) => w.id === id);
        if (ws && editValue.trim()) {
            ws.name = editValue.trim();
        }
        editingId = null;
    }

    function handleKeydown(e: KeyboardEvent, id: string) {
        if (e.key === "Enter") saveName(id);
        if (e.key === "Escape") editingId = null;
    }

    function requestDelete(id: string) {
        const ws = desktopState.workspaces.find((w) => w.id === id);
        if (ws && ws.items.length > 0) {
            workspaceToDelete = id;
            showDeleteAlert = true;
        } else {
            desktopState.removeWorkspace(id);
        }
    }

    function confirmDelete() {
        if (workspaceToDelete) {
            desktopState.removeWorkspace(workspaceToDelete);
            workspaceToDelete = null;
            showDeleteAlert = false;
        }
    }
</script>

<div
    class="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center justify-end pb-6 h-24"
    role="region"
    aria-label="Barra de espacios de trabajo"
    onmouseenter={() => (isHovered = true)}
    onmouseleave={() => (isHovered = false)}
>
    <!-- Dock / Handle Morphing - Contenedor único que se expande -->
    <div
        class="flex items-center border border-border bg-background/95 backdrop-blur-xl shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden
        {isExpandedActual
            ? 'min-w-[140px] w-fit max-w-[90vw] h-14 p-2 rounded-full opacity-100 translate-y-0'
            : 'min-w-[140px] max-w-[140px] h-2 p-0 rounded-full opacity-80 translate-y-4 bg-background cursor-pointer'}"
    >
        <!-- Contenido del Dock -->
        {#if isExpanded}
            <div
                class="flex items-center gap-1.5"
                in:fly={{ y: 20, duration: 400, easing: quintOut }}
                out:fly={{ y: 20, duration: 300 }}
            >
                {#each desktopState.workspaces as ws, i (ws.id)}
                    <div class="relative group flex items-center">
                        <button
                            data-workspace-id={ws.id}
                            data-workspace-button
                            in:fly={{
                                y: 20,
                                duration: 500,
                                delay: 100 + i * 40,
                                easing: quintOut,
                            }}
                            class="px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 min-w-[70px] justify-center relative
                            {desktopState.activeWorkspaceId === ws.id
                                ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_8px_16px_-6px_rgba(var(--primary-rgb),0.2)] backdrop-blur-md'
                                : 'text-muted-foreground/70 hover:bg-foreground/10 hover:text-foreground hover:ring-1 hover:ring-border/50'}
                            {desktopState.draggedItemId
                                ? 'ring-2 ring-primary/20 scale-105'
                                : ''}"
                            onclick={() =>
                                (desktopState.activeWorkspaceId = ws.id)}
                            ondblclick={() => startEditing(ws.id, ws.name)}
                        >
                            {#if editingId === ws.id}
                                <div
                                    class="relative flex items-center justify-center min-w-[50px] px-2"
                                >
                                    <span
                                        class="invisible whitespace-pre px-4 font-bold text-sm"
                                        >{editValue || ws.name}</span
                                    >
                                    <input
                                        id="edit-ws-{ws.id}"
                                        bind:value={editValue}
                                        class="absolute inset-0 bg-muted border border-border outline-none text-center w-full rounded-full text-foreground px-3 font-bold text-sm focus:ring-1 focus:ring-primary/50"
                                        onblur={() => saveName(ws.id)}
                                        onkeydown={(e) =>
                                            handleKeydown(e, ws.id)}
                                    />
                                </div>
                            {:else}
                                <span in:fade={{ duration: 150 }}
                                    >{ws.name}</span
                                >
                            {/if}
                        </button>

                        {#if desktopState.workspaces.length > 1 && editingId !== ws.id}
                            <button
                                class="absolute -top-1 -right-1 w-5 h-5 bg-background border border-border text-muted-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-destructive-foreground shadow-xl z-20"
                                onclick={(e) => {
                                    e.stopPropagation();
                                    requestDelete(ws.id);
                                }}
                            >
                                <X class="w-3 h-3" />
                            </button>
                        {/if}
                    </div>
                {/each}

                <div
                    class="w-px h-6 bg-border/50 mx-1"
                    in:fly={{
                        y: 20,
                        duration: 500,
                        delay: 100 + desktopState.workspaces.length * 40,
                        easing: quintOut,
                    }}
                ></div>

                <button
                    class="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground/70 hover:bg-foreground/5 hover:text-foreground hover:ring-1 hover:ring-border/50 transition-all active:scale-90"
                    onclick={() => desktopState.addWorkspace()}
                    title="Nueva Mesa"
                    in:fly={{
                        y: 20,
                        duration: 400,
                        delay: 50,
                        easing: quintOut,
                    }}
                >
                    <Plus class="w-6 h-6" />
                </button>
            </div>
        {/if}
    </div>
</div>

<!-- Modal de confirmación -->
<AlertDialog.Root bind:open={showDeleteAlert}>
    <AlertDialog.Content
        class="bg-background border-border rounded-3xl shadow-2xl"
    >
        <AlertDialog.Header>
            <AlertDialog.Title
                class="text-foreground flex items-center gap-2 text-xl"
            >
                <AlertCircle class="w-6 h-6 text-destructive" />
                ¿Eliminar mesa de trabajo?
            </AlertDialog.Title>
            <AlertDialog.Description class="text-muted-foreground text-base">
                Esta mesa contiene notas. Si la eliminas, todo el contenido se
                borrará permanentemente.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer class="gap-3">
            <AlertDialog.Cancel
                class="bg-transparent border-border text-muted-foreground hover:bg-muted rounded-xl h-12 px-6"
                >Cancelar</AlertDialog.Cancel
            >
            <AlertDialog.Action
                class="bg-destructive hover:bg-destructive/90 text-destructive-foreground border-none rounded-xl h-12 px-6 font-bold"
                onclick={confirmDelete}
            >
                Eliminar mesa
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>

<style>
    div {
        user-select: none;
    }
</style>
