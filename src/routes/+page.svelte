<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import {
        startListening,
        onTextUpdate,
        onImageUpdate,
        onFilesUpdate,
    } from "tauri-plugin-clipboard-api";
    import type { ClipboardItem } from "$lib/types";
    import ClipboardCard from "$lib/components/ClipboardCard.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import ClearAllAlert from "$lib/components/ClearAllAlert.svelte";
    import ActionButtons from "$lib/components/ActionButtons.svelte";
    import PauseButton from "$lib/components/PauseButton.svelte";
    import Titlebar from "$lib/components/Titlebar.svelte";
    import MobileLinkModal from "$lib/components/modals/MobileLinkModal.svelte";
    import OcrResultModal from "$lib/components/modals/OcrResultModal.svelte";
    import CanvasBackground from "$lib/components/CanvasBackground.svelte";
    import WorkspacesBar from "$lib/components/WorkspacesBar.svelte";
    import type { DataConnection } from "peerjs";
    import { desktopState } from "./desktop-state.svelte";
    import { interactionManager } from "./interaction-manager.svelte";

    desktopState.initSerialization();

    let stopListening: (() => Promise<void>) | null = null;

    function onScanText(item: ClipboardItem) {
        if (item.type !== "image" || !item.content) return;
        desktopState.ocrImageSrc = item.content;
        desktopState.ocrText = "";
        desktopState.isOcrModalOpen = true;
    }

    onMount(async () => {
        window.addEventListener("anotapp-bg-updated", ((e: CustomEvent) => {
            desktopState.customBgImage = e.detail;
        }) as EventListener);

        stopListening = await startListening();
        await onTextUpdate((text) => {
            if (desktopState.clipboardPaused) return;
            if (!text || text === desktopState.lastText) return;
            if (
                desktopState.items.find(
                    (i) => i.type === "text" && i.content === text,
                )
            )
                return;
            desktopState.lastText = text;
            desktopState.addItem({ type: "text", content: text });
        });
        await onImageUpdate((b64) => {
            if (!desktopState.clipboardPaused)
                desktopState.handleImageUpdate(b64);
        });
        await onFilesUpdate((files) => {
            if (!desktopState.clipboardPaused)
                desktopState.handleFilesUpdate(files);
        });

        // Initialize PeerJS
        try {
            const { Peer } = await import("peerjs");
            const id = crypto.randomUUID();
            desktopState.peerInstance = new Peer(id);

            desktopState.peerInstance.on("open", (id: string) => {
                desktopState.peerId = id;
            });

            desktopState.peerInstance.on(
                "connection",
                (conn: DataConnection) => {
                    desktopState.isMobileLinkOpen = false;

                    conn.on("data", (data: any) => {
                        desktopState.handleIncomingPeerData(data);
                    });
                },
            );
        } catch (err) {
            console.error("Failed to initialize PeerJS:", err);
        }

        setTimeout(() => (desktopState.isReady = true), 300);
    });

    onDestroy(async () => {
        if (stopListening) await stopListening();
        if (desktopState.peerInstance) desktopState.peerInstance.destroy();
    });

    async function onCopy(item: ClipboardItem) {
        try {
            if (item.type === "text") {
                const { writeText } = await import(
                    "tauri-plugin-clipboard-api"
                );
                await writeText(item.content);
                desktopState.lastText = item.content;
            } else if (item.type === "image") {
                const { writeImageBase64 } = await import(
                    "tauri-plugin-clipboard-api"
                );
                const b64 = item.content.replace(/^data:[^;]+;base64,/, "");
                await writeImageBase64(b64);
            } else if (item.type === "files" && item.files?.length) {
                const { writeFilesURIs } = await import(
                    "tauri-plugin-clipboard-api"
                );
                await writeFilesURIs(item.files);
            }
        } catch (err) {
            console.log(err);
        }
    }
</script>

<svelte:window
    onpointermove={(e) => interactionManager.onPointerMove(e)}
    onpointerup={(e) => interactionManager.onPointerUp(e)}
    onresize={() => interactionManager.onWindowResize()}
/>

<main
    class="h-screen w-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 relative font-sans isolate selection:bg-primary/30 transition-colors duration-500"
>
    <CanvasBackground />

    <EmptyState
        isReady={desktopState.isReady}
        hasItems={desktopState.items.length > 0}
    />

    {#each desktopState.items as item (item.id)}
        <ClipboardCard
            {item}
            onBringToFront={(id) => {
                const item = desktopState.items.find((i) => i.id === id);
                if (item) item.z = desktopState.maxZ++;
            }}
            onDragStart={(e, id) => interactionManager.onDragStart(e, id)}
            onResizeStart={(e, id, dir) =>
                interactionManager.onResizeStart(e, id, dir)}
            onDelete={(id) =>
                (desktopState.items = desktopState.items.filter(
                    (i) => i.id !== id,
                ))}
            {onCopy}
            {onScanText}
            hideHeaders={desktopState.hideHeaders}
        />
    {/each}

    <Titlebar />

    <ActionButtons
        addEmptyText={() => desktopState.addEmptyText()}
        openMobileLink={() => (desktopState.isMobileLinkOpen = true)}
        bind:hideHeaders={desktopState.hideHeaders}
        bind:bgPattern={desktopState.bgPattern}
    />

    <MobileLinkModal
        bind:open={desktopState.isMobileLinkOpen}
        peerId={desktopState.peerId}
    />

    <OcrResultModal
        bind:open={desktopState.isOcrModalOpen}
        bind:text={desktopState.ocrText}
        imageSrc={desktopState.ocrImageSrc}
        isLoading={desktopState.ocrLoading}
        onExtract={(rect) => desktopState.handleExtractText(rect)}
        onPinToCanvas={(text) => {
            desktopState.addItem({ type: "text", content: text });
        }}
    />

    <PauseButton bind:paused={desktopState.clipboardPaused} />

    <WorkspacesBar />

    <ClearAllAlert
        count={desktopState.items.length}
        onClear={() => (desktopState.items = [])}
    />
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
