<script lang="ts">
    import { desktopState } from "../../routes/desktop-state.svelte";
    import Plus from "@lucide/svelte/icons/plus";
    import X from "@lucide/svelte/icons/x";
    import AlertCircle from "@lucide/svelte/icons/alert-circle";
    import { fade } from "svelte/transition";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import { tick } from "svelte";

    let editingId = $state<string | null>(null);
    let editValue = $state("");
    let isHovered = $state(false);

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
        if (!ws) return;

        if (ws.items.length > 0) {
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

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center transition-all duration-500 ease-out"
    onmouseenter={() => (isHovered = true)}
    onmouseleave={() => (isHovered = false)}
>
    <!-- Handle de reposo - Consistente con el estilo de botones -->
    <div
        class="w-42 h-2 rounded-full border border-border/50 bg-background/80 backdrop-blur-md shadow-md transition-all duration-500 hover:bg-muted
        {isHovered
            ? 'opacity-0 -translate-y-4 scale-x-150'
            : 'opacity-100 translate-y-12'}"
    ></div>

    <!-- Dock Principal Adaptativo - Consistente con botones de acción -->
    <div
        class="flex items-center gap-2 p-2 rounded-2xl border border-border/50 bg-background/80 backdrop-blur-md shadow-md transition-all duration-500
        {isHovered
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-12 opacity-0 scale-90 pointer-events-none'}"
    >
        {#each desktopState.workspaces as ws (ws.id)}
            <div class="relative group flex items-center">
                <button
                    class="px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 min-w-[70px] justify-center relative
                    {desktopState.activeWorkspaceId === ws.id
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
                    onclick={() => (desktopState.activeWorkspaceId = ws.id)}
                    ondblclick={() => startEditing(ws.id, ws.name)}
                >
                    {#if editingId === ws.id}
                        <div
                            class="relative flex items-center justify-center min-w-[50px] px-2"
                        >
                            <!-- El span de medida con un poco más de margen -->
                            <span
                                class="invisible whitespace-pre px-4 font-bold text-sm"
                                >{editValue || ws.name}</span
                            >
                            <input
                                id="edit-ws-{ws.id}"
                                bind:value={editValue}
                                class="absolute inset-0 bg-black/60 border border-white/20 outline-none text-center w-full rounded-lg text-white px-3 font-bold text-sm focus:ring-1 focus:ring-primary/50"
                                onblur={() => saveName(ws.id)}
                                onkeydown={(e) => handleKeydown(e, ws.id)}
                            />
                        </div>
                    {:else}
                        <span in:fade={{ duration: 150 }}>{ws.name}</span>
                    {/if}
                </button>

                {#if desktopState.workspaces.length > 1 && editingId !== ws.id}
                    <button
                        class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-background border border-border text-muted-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-destructive-foreground shadow-xl z-20"
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

        <div class="w-px h-6 bg-border/50 mx-1"></div>

        <button
            class="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-90"
            onclick={() => desktopState.addWorkspace()}
            title="Nueva Mesa"
        >
            <Plus class="w-6 h-6" />
        </button>
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
