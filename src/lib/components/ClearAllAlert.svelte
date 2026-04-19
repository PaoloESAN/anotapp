<script lang="ts">
    import Trash2 from "@lucide/svelte/icons/trash-2";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";

    let { count, onClear }: { count: number; onClear: () => void } = $props();
</script>

{#if count > 0}
    <AlertDialog.Root>
        <AlertDialog.Trigger class="fixed bottom-6 right-6 z-50 flex items-center space-x-2 rounded-full border border-red-900/30 bg-zinc-900/80 backdrop-blur px-4 py-2.5 text-sm font-semibold text-red-400 shadow-xl transition-all hover:bg-red-950/50 hover:border-red-900/50 hover:text-red-300" title="Borrar todas las notas">
            <Trash2 class="w-4 h-4" />
            <span>Borrar todo</span>
        </AlertDialog.Trigger>
        <AlertDialog.Content>
            <AlertDialog.Header>
                <AlertDialog.Title>¿Estás absolutamente seguro?</AlertDialog.Title>
                <AlertDialog.Description class="leading-relaxed">
                    Esta acción no se puede deshacer. Se borrarán permanentemente del lienzo las
                    <span class="font-bold text-zinc-200">{count} anotaciones</span> actuales.
                </AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
                <AlertDialog.Cancel>Cancelar</AlertDialog.Cancel>
                <AlertDialog.Action class="bg-red-600 px-4 py-2 font-semibold text-zinc-50 hover:bg-red-500 transition-colors" onclick={onClear}>
                    Sí, borrar todo
                </AlertDialog.Action>
            </AlertDialog.Footer>
        </AlertDialog.Content>
    </AlertDialog.Root>
{/if}
