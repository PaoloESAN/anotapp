<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { mobileState } from "./mobile-state.svelte";
    import MobileHeader from "./components/MobileHeader.svelte";
    import ScannerView from "./components/ScannerView.svelte";
    import ConnectionSetup from "./components/ConnectionSetup.svelte";
    import ChatInterface from "./components/ChatInterface.svelte";
    import Loader2 from "@lucide/svelte/icons/loader-2";
    import { Card, CardContent } from "$lib/components/ui/card";

    mobileState.initSerialization();

    let isScanning = $state(false);

    onMount(async () => {
        const urlParams = new URLSearchParams(window.location.search);
        let urlPeerId = urlParams.get("peerId") || "";

        if (!urlPeerId && typeof sessionStorage !== "undefined") {
            urlPeerId = sessionStorage.getItem("anotapp_peerId") || "";
            if (urlPeerId) {
                const url = new URL(window.location.href);
                url.searchParams.set("peerId", urlPeerId);
                window.history.replaceState({}, "", url);
            }
        }

        if (urlPeerId) {
            mobileState.savePeerId(urlPeerId);
            await mobileState.initConnection(urlPeerId);
        }

        document.addEventListener("visibilitychange", () => mobileState.handleVisibilityChange());
    });

    onDestroy(() => {
        if (typeof document !== "undefined") {
            document.removeEventListener(
                "visibilitychange",
                () => mobileState.handleVisibilityChange(),
            );
        }
    });

    function handleQrResult(url: string) {
        try {
            const urlObj = new URL(url);
            const scannedPeerId = urlObj.searchParams.get("peerId");
            if (scannedPeerId) {
                mobileState.savePeerId(scannedPeerId);
                mobileState.initConnection(scannedPeerId);
            } else {
                alert("QR inválido: No se encontró el ID de conexión.");
            }
        } catch (e) {
            if (url && url.length > 0) {
                mobileState.savePeerId(url);
                mobileState.initConnection(url);
            }
        }
        isScanning = false;
    }
</script>

<svelte:head>
    <title>Anotapp Móvil</title>
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
    />
</svelte:head>

<main
    class="min-h-screen bg-background text-foreground flex flex-col font-sans p-4 sm:p-6 transition-colors duration-500"
>
    <MobileHeader {isScanning} />

    <div class="flex-1 flex flex-col gap-6 max-w-md w-full mx-auto justify-center pb-12">
        {#if mobileState.status === "connecting"}
            <Card class="animate-in fade-in zoom-in-95 duration-500">
                <CardContent class="pt-6 pb-6 flex flex-col items-center justify-center min-h-[200px] gap-4">
                    <div class="relative flex items-center justify-center">
                        <div class="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                        <Loader2 class="w-10 h-10 animate-spin text-primary relative z-10" />
                    </div>
                    <p class="text-sm text-muted-foreground font-medium animate-pulse">
                        Vinculando con la PC...
                    </p>
                </CardContent>
            </Card>
        {:else if isScanning}
            <ScannerView 
                onScanComplete={handleQrResult} 
                onCancel={() => isScanning = false} 
            />
        {:else if mobileState.status === "idle" || mobileState.status === "error"}
            <ConnectionSetup onStartScan={() => isScanning = true} />
        {:else if mobileState.status === "connected" || mobileState.status === "reconnecting"}
            <ChatInterface />
        {/if}
    </div>
</main>
