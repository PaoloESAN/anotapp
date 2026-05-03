<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import type { DataConnection } from "peerjs";
    import jsQR from "jsqr";
    import ImagePlus from "@lucide/svelte/icons/image-plus";
    import Camera from "@lucide/svelte/icons/camera";
    import AlertCircle from "@lucide/svelte/icons/alert-circle";
    import CheckCircle2 from "@lucide/svelte/icons/check-circle-2";
    import Loader2 from "@lucide/svelte/icons/loader-2";
    import X from "@lucide/svelte/icons/x";
    import Paperclip from "@lucide/svelte/icons/paperclip";
    import ArrowUp from "@lucide/svelte/icons/arrow-up";
    import Sun from "@lucide/svelte/icons/sun";
    import Moon from "@lucide/svelte/icons/moon";
    import { setMode, resetMode } from "mode-watcher";

    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import {
        Card,
        CardContent,
        CardFooter,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";

    let peerId = $state("");
    let status = $state<"idle" | "connecting" | "connected" | "error" | "reconnecting">("idle");
    let peerInstance: any = null;
    let connection: DataConnection | null = $state(null);
    let textInput = $state("");
    let inputCode = $state("");

    // Scanner state
    let isScanning = $state(false);
    let videoElement: HTMLVideoElement | null = $state(null);
    let canvasElement: HTMLCanvasElement | null = $state(null);
    let scanStream: MediaStream | null = $state(null);

    function handleVisibilityChange() {
        if (document.visibilityState === "visible" && peerId) {
            if (status === "error") {
                initConnection(peerId, false);
            } else if (
                (status === "connected" || status === "reconnecting") &&
                connection &&
                !connection.open
            ) {
                initConnection(peerId, true);
            }
        }
    }

    $effect(() => {
        if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem("anotapp_textInput", textInput);
        }
    });

    function savePeerId(id: string) {
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("peerId", id);
            window.history.replaceState({}, "", url);
            sessionStorage.setItem("anotapp_peerId", id);
        }
    }

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

        if (typeof sessionStorage !== "undefined") {
            const savedText = sessionStorage.getItem("anotapp_textInput");
            if (savedText) textInput = savedText;
        }

        if (urlPeerId) {
            peerId = urlPeerId;
            await initConnection(peerId);
        } else {
            status = "idle";
        }

        document.addEventListener("visibilitychange", handleVisibilityChange);
    });

    onDestroy(() => {
        stopScanner();
        if (peerInstance) peerInstance.destroy();
        if (typeof document !== "undefined") {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
        }
    });

    async function initConnection(id: string, isAutoReconnect = false) {
        if (!id) return;
        status = isAutoReconnect ? "reconnecting" : "connecting";

        try {
            const { Peer } = await import("peerjs");
            if (peerInstance) {
                peerInstance.destroy();
            }

            peerInstance = new Peer();

            peerInstance.on("open", () => {
                const conn = peerInstance.connect(id, { reliable: true });
                connection = conn;

                conn.on("open", () => {
                    status = "connected";
                });

                conn.on("error", (err: any) => {
                    console.error("Connection error:", err);
                    if (status === "connected" || status === "reconnecting") {
                        setTimeout(() => initConnection(id, true), 3000);
                    } else {
                        status = "error";
                    }
                });

                conn.on("close", () => {
                    if (status === "connected" || status === "reconnecting") {
                        status = "reconnecting";
                        setTimeout(() => initConnection(id, true), 3000);
                    } else {
                        status = "error";
                    }
                });
            });

            peerInstance.on("error", (err: any) => {
                console.error("Peer error:", err);
                if (status === "connected" || status === "reconnecting") {
                    setTimeout(() => initConnection(id, true), 3000);
                } else {
                    status = "error";
                }
            });
        } catch (err) {
            console.error("Failed to load PeerJS:", err);
            status = "error";
        }
    }

    function handleConnectManual(e?: Event) {
        if (e) e.preventDefault();
        if (!inputCode.trim()) return;
        peerId = inputCode.trim();
        savePeerId(peerId);
        initConnection(peerId);
    }

    function sendText() {
        if (!textInput.trim() || !connection || status !== "connected") return;

        connection.send({
            type: "text",
            content: textInput.trim(),
        });

        textInput = "";
    }

    function handleImageUpload(e: Event) {
        if (!connection || status !== "connected") return;

        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            connection!.send({
                type: "image",
                content: dataUrl,
            });
            input.value = "";
        };

        reader.readAsDataURL(file);
    }

    async function startScanner() {
        try {
            isScanning = true;
            scanStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            });

            if (videoElement) {
                videoElement.srcObject = scanStream;
                videoElement.setAttribute("playsinline", "true");
                videoElement.play();

                requestAnimationFrame(tick);
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("No se pudo acceder a la cámara.");
            isScanning = false;
        }
    }

    function stopScanner() {
        isScanning = false;
        if (scanStream) {
            scanStream.getTracks().forEach((track) => track.stop());
            scanStream = null;
        }
    }

    function tick() {
        if (!isScanning || !videoElement || !canvasElement) return;

        if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
            canvasElement.height = videoElement.videoHeight;
            canvasElement.width = videoElement.videoWidth;
            const ctx = canvasElement.getContext("2d");
            if (ctx) {
                ctx.drawImage(
                    videoElement,
                    0,
                    0,
                    canvasElement.width,
                    canvasElement.height,
                );
                const imageData = ctx.getImageData(
                    0,
                    0,
                    canvasElement.width,
                    canvasElement.height,
                );
                const code = jsQR(
                    imageData.data,
                    imageData.width,
                    imageData.height,
                    { inversionAttempts: "dontInvert" },
                );
                if (code) {
                    stopScanner();
                    handleQrResult(code.data);
                }
            }
        }
        if (isScanning) {
            requestAnimationFrame(tick);
        }
    }

    function handleQrResult(url: string) {
        try {
            const urlObj = new URL(url);
            const scannedPeerId = urlObj.searchParams.get("peerId");
            if (scannedPeerId) {
                peerId = scannedPeerId;
                savePeerId(peerId);
                initConnection(peerId);
            } else {
                alert("QR inválido: No se encontró el ID de conexión.");
            }
        } catch (e) {
            if (url && url.length > 0) {
                peerId = url;
                savePeerId(peerId);
                initConnection(peerId);
            }
        }
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
    <header class="text-center mb-8 pt-6 h-20 relative">
        <div class="absolute right-0 top-4">
            <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                    {#snippet child({ props })}
                        <Button
                            {...props}
                            variant="ghost"
                            size="icon"
                            class="rounded-full text-muted-foreground hover:text-foreground"
                        >
                            <Sun
                                class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
                            />
                            <Moon
                                class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
                            />
                            <span class="sr-only">Cambiar tema</span>
                        </Button>
                    {/snippet}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content
                    align="end"
                    class="border-border/50 shadow-lg rounded-xl min-w-[120px]"
                >
                    <DropdownMenu.Item
                        onclick={() => setMode("light")}
                        class="cursor-pointer py-2">Claro</DropdownMenu.Item
                    >
                    <DropdownMenu.Item
                        onclick={() => setMode("dark")}
                        class="cursor-pointer py-2">Oscuro</DropdownMenu.Item
                    >
                    <DropdownMenu.Item
                        onclick={() => resetMode()}
                        class="cursor-pointer py-2">Sistema</DropdownMenu.Item
                    >
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </div>

        <h1 class="text-3xl font-extrabold tracking-tight mb-2 text-foreground">
            Anotapp
        </h1>
        {#if status === "connected"}
            <div
                class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-semibold animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300"
            >
                <CheckCircle2 class="w-3.5 h-3.5" />
                Conectado a la PC
            </div>
        {:else if status === "reconnecting"}
            <div
                class="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full text-xs font-semibold animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300"
            >
                <Loader2 class="w-3.5 h-3.5 animate-spin" />
                Reconectando...
            </div>
        {/if}
    </header>

    <div
        class="flex-1 flex flex-col gap-6 max-w-md w-full mx-auto justify-center pb-12"
    >
        {#if status === "connecting"}
            <!-- Connecting State View -->
            <Card class="animate-in fade-in zoom-in-95 duration-500">
                <CardContent
                    class="pt-6 pb-6 flex flex-col items-center justify-center min-h-[200px] gap-4"
                >
                    <div class="relative flex items-center justify-center">
                        <div
                            class="absolute inset-0 bg-primary/20 blur-xl rounded-full"
                        ></div>
                        <Loader2
                            class="w-10 h-10 animate-spin text-primary relative z-10"
                        />
                    </div>
                    <p
                        class="text-sm text-muted-foreground font-medium animate-pulse"
                    >
                        Vinculando con la PC...
                    </p>
                </CardContent>
            </Card>
        {:else if isScanning}
            <!-- Scanner View -->
            <Card
                class="overflow-hidden animate-in fade-in zoom-in-95 duration-300"
            >
                <CardHeader
                    class="flex flex-row items-center justify-between bg-muted/30 pb-4 border-b"
                >
                    <CardTitle class="flex items-center gap-2 text-base m-0">
                        <Camera class="w-4 h-4 text-primary" />
                        Escanear QR
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        class="w-8 h-8 rounded-full"
                        onclick={stopScanner}
                    >
                        <X class="w-4 h-4" />
                    </Button>
                </CardHeader>
                <CardContent
                    class="p-0 relative bg-black aspect-4/3 w-full flex items-center justify-center"
                >
                    <!-- svelte-ignore a11y_media_has_caption -->
                    <video
                        bind:this={videoElement}
                        class="w-full h-full object-cover"
                    ></video>
                    <canvas bind:this={canvasElement} class="hidden"></canvas>

                    <!-- Scanner overlay -->
                    <div
                        class="absolute inset-0 pointer-events-none flex items-center justify-center"
                    >
                        <div
                            class="w-48 h-48 border-2 border-primary/50 rounded-xl relative"
                        >
                            <div
                                class="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg"
                            ></div>
                            <div
                                class="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"
                            ></div>
                            <div
                                class="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg"
                            ></div>
                            <div
                                class="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg"
                            ></div>
                            <!-- Scanning animation line -->
                            <div
                                class="w-full h-0.5 bg-primary absolute top-0 left-0 shadow-[0_0_8px_2px_rgba(var(--primary),0.5)] animate-[scan_2s_ease-in-out_infinite]"
                            ></div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter
                    class="p-4 flex-col text-center text-sm text-muted-foreground bg-muted/10"
                >
                    Apunta la cámara al código QR de la aplicación de escritorio
                </CardFooter>
            </Card>
        {:else if status === "idle" || status === "error"}
            <!-- Connection Setup View -->
            <Card
                class="animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
                <CardHeader>
                    {#if status === "error"}
                        <div
                            class="bg-destructive/10 text-destructive rounded-lg p-3 mb-4 flex items-center gap-2 text-sm font-medium"
                        >
                            <AlertCircle class="w-4 h-4 shrink-0" />
                            <span>Error de conexión. Inténtalo de nuevo.</span>
                        </div>
                    {/if}
                    <Button
                        size="lg"
                        class="w-full h-14 rounded-xl text-base gap-3 bg-foreground text-background"
                        onclick={startScanner}
                    >
                        <Camera class="w-5 h-5" />
                        Escanear código QR
                    </Button>
                </CardHeader>
                <CardContent>
                    <div
                        class="relative flex items-center justify-center py-2 mb-4"
                    >
                        <div class="absolute inset-0 flex items-center">
                            <div class="w-full border-t border-border"></div>
                        </div>
                        <div
                            class="relative bg-card px-3 text-xs text-muted-foreground uppercase tracking-widest font-medium"
                        >
                            O ingresa manualmente
                        </div>
                    </div>

                    <form onsubmit={handleConnectManual} class="space-y-4">
                        <div class="space-y-2">
                            <Input
                                type="text"
                                placeholder="Ej: an-123456"
                                bind:value={inputCode}
                                class="text-center text-lg tracking-wider font-mono h-12 focus-visible:ring-zinc-300 dark:focus-visible:ring-[#555555] focus-visible:ring-offset-0 outline-none"
                            />
                        </div>
                        <Button
                            variant="secondary"
                            type="submit"
                            class="w-full h-12 text-base font-medium"
                            disabled={!inputCode.trim()}
                        >
                            Conectar
                        </Button>
                    </form>
                </CardContent>
            </Card>
        {:else if status === "connected" || status === "reconnecting"}
            <!-- Connected View (ChatGPT style input) -->
            <div
                class="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full"
            >
                <div
                    class="relative bg-muted/40 dark:bg-[#212121] rounded-3xl border border-zinc-200 dark:border-[#424242] shadow-sm flex flex-col p-3 transition-colors focus-within:border-zinc-300 dark:focus-within:border-[#555555]"
                >
                    <textarea
                        bind:value={textInput}
                        class="w-full min-h-[80px] max-h-[200px] bg-transparent border-0 px-3 py-2 text-[15px] resize-none outline-none placeholder:text-muted-foreground/70 custom-scrollbar"
                        placeholder="Escribe algo para enviar..."
                        onkeydown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendText();
                            }
                        }}
                    ></textarea>

                    <div class="flex items-center justify-between mt-2 px-1">
                        <div class="flex items-center gap-2">
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger>
                                    {#snippet child({ props })}
                                        <Button
                                            {...props}
                                            variant="ghost"
                                            size="icon"
                                            class="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                                        >
                                            <Paperclip class="w-5 h-5" />
                                        </Button>
                                    {/snippet}
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content
                                    align="start"
                                    side="top"
                                    class="w-48 mb-2 border-border/50 shadow-lg rounded-xl"
                                >
                                    <DropdownMenu.Item
                                        onclick={() =>
                                            document
                                                .getElementById(
                                                    "mobile-camera-capture",
                                                )
                                                ?.click()}
                                        class="cursor-pointer gap-2 py-2.5"
                                    >
                                        <Camera
                                            class="h-4 w-4 text-muted-foreground"
                                        />
                                        <span>Tomar Foto</span>
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                        onclick={() =>
                                            document
                                                .getElementById(
                                                    "mobile-image-upload",
                                                )
                                                ?.click()}
                                        class="cursor-pointer gap-2 py-2.5"
                                    >
                                        <ImagePlus
                                            class="h-4 w-4 text-muted-foreground"
                                        />
                                        <span>Subir de Galería</span>
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                        </div>

                        <Button
                            onclick={sendText}
                            disabled={!textInput.trim()}
                            class="h-9 w-9 rounded-full bg-foreground text-background p-0 disabled:bg-muted disabled:text-muted-foreground transition-all shadow-sm shrink-0"
                        >
                            <ArrowUp class="w-5 h-5" />
                        </Button>
                    </div>

                    <input
                        type="file"
                        id="mobile-camera-capture"
                        accept="image/*"
                        capture="environment"
                        class="hidden"
                        onchange={handleImageUpload}
                    />
                    <input
                        type="file"
                        id="mobile-image-upload"
                        accept="image/*"
                        class="hidden"
                        onchange={handleImageUpload}
                    />
                </div>
            </div>
        {/if}
    </div>
</main>

<style>
    @keyframes scan {
        0%,
        100% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(192px);
        }
    }
</style>
