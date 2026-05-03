<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Card, CardHeader, CardContent } from "$lib/components/ui/card";
    import Camera from "@lucide/svelte/icons/camera";
    import AlertCircle from "@lucide/svelte/icons/alert-circle";
    import { mobileState } from "../mobile-state.svelte";

    let { onStartScan } = $props<{ onStartScan: () => void }>();

    function handleConnectManual(e?: Event) {
        if (e) e.preventDefault();
        if (!mobileState.inputCode.trim()) return;
        mobileState.savePeerId(mobileState.inputCode.trim());
        mobileState.initConnection(mobileState.peerId);
    }
</script>

<Card class="animate-in fade-in slide-in-from-bottom-4 duration-500">
    <CardHeader>
        {#if mobileState.status === "error"}
            <div class="bg-destructive/10 text-destructive rounded-lg p-3 mb-4 flex items-center gap-2 text-sm font-medium">
                <AlertCircle class="w-4 h-4 shrink-0" />
                <span>Error de conexión. Inténtalo de nuevo.</span>
            </div>
        {/if}
        <Button
            size="lg"
            class="w-full h-14 rounded-xl text-base gap-3 bg-foreground text-background"
            onclick={onStartScan}
        >
            <Camera class="w-5 h-5" />
            Escanear código QR
        </Button>
    </CardHeader>
    <CardContent>
        <div class="relative flex items-center justify-center py-2 mb-4">
            <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-border"></div>
            </div>
            <div class="relative bg-card px-3 text-xs text-muted-foreground uppercase tracking-widest font-medium">
                O ingresa manualmente
            </div>
        </div>

        <form onsubmit={handleConnectManual} class="space-y-4">
            <div class="space-y-2">
                <Input
                    type="text"
                    placeholder="Ej: an-123456"
                    bind:value={mobileState.inputCode}
                    class="text-center text-lg tracking-wider font-mono h-12 focus-visible:ring-zinc-300 dark:focus-visible:ring-[#555555] focus-visible:ring-offset-0 outline-none"
                />
            </div>
            <Button
                variant="secondary"
                type="submit"
                class="w-full h-12 text-base font-medium"
                disabled={!mobileState.inputCode.trim()}
            >
                Conectar
            </Button>
        </form>
    </CardContent>
</Card>
