<script lang="ts">
    import Trash2 from "@lucide/svelte/icons/trash-2";

    let { count, onClear }: { count: number; onClear: () => void } = $props();
    let isAlertOpen = $state(false);

    function handleClear() {
        onClear();
        isAlertOpen = false;
    }
</script>

<!-- Clear All Button -->
{#if count > 0}
    <button
        onclick={() => (isAlertOpen = true)}
        class="fixed bottom-6 right-6 z-50 flex items-center space-x-2 rounded-full border border-red-900/30 bg-zinc-900/80 backdrop-blur px-4 py-2.5 text-sm font-semibold text-red-400 shadow-xl transition-all hover:bg-red-950/50 hover:border-red-900/50 hover:text-red-300"
        title="Borrar todas las notas"
    >
        <Trash2 class="w-4 h-4" />
        <span>Borrar todo</span>
    </button>
{/if}

<!-- Shadcn Custom Alert Dialog -->
{#if isAlertOpen}
    <div class="relative z-100">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            onclick={() => (isAlertOpen = false)}
            class="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        ></div>
        <div
            class="fixed left-[50%] top-[50%] flex w-full max-w-lg translate-x-[-50%] translate-y-[-50%] flex-col gap-5 border border-zinc-800 bg-zinc-950 p-6 shadow-2xl sm:rounded-xl"
        >
            <div class="flex flex-col space-y-2 text-center sm:text-left">
                <h2 class="text-lg font-semibold text-zinc-50">
                    ¿Estás absolutamente seguro?
                </h2>
                <p class="text-sm text-zinc-400 leading-relaxed">
                    Esta acción no se puede deshacer. Se borrarán
                    permanentemente del lienzo las
                    <span class="font-bold text-zinc-200"
                        >{count} anotaciones</span
                    >
                    actuales.
                </p>
            </div>
            <div
                class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"
            >
                <button
                    onclick={() => (isAlertOpen = false)}
                    class="mt-2 inline-flex h-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-800 hover:text-zinc-50 sm:mt-0 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onclick={handleClear}
                    class="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-zinc-50 hover:bg-red-500 transition-colors"
                >
                    Sí, borrar todo
                </button>
            </div>
        </div>
    </div>
{/if}
