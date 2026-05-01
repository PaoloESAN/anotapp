<script lang="ts">
    import { onMount } from "svelte";
    import type { DataConnection } from "peerjs";
    import Send from "@lucide/svelte/icons/send";
    import ImagePlus from "@lucide/svelte/icons/image-plus";

    let peerId = $state("");
    let status = $state<"connecting" | "connected" | "error">("connecting");
    let peerInstance: any = null;
    let connection: DataConnection | null = $state(null);
    let textInput = $state("");

    onMount(async () => {
        // Read peerId from URL search params
        const urlParams = new URLSearchParams(window.location.search);
        peerId = urlParams.get("peerId") || "";

        if (!peerId) {
            status = "error";
            return;
        }

        try {
            const { Peer } = await import("peerjs");
            peerInstance = new Peer();

            peerInstance.on("open", () => {
                const conn = peerInstance.connect(peerId, { reliable: true });
                connection = conn;

                conn.on("open", () => {
                    status = "connected";
                });

                conn.on("error", (err: any) => {
                    console.error("Connection error:", err);
                    status = "error";
                });

                conn.on("close", () => {
                    status = "error";
                });
            });

            peerInstance.on("error", (err: any) => {
                console.error("Peer error:", err);
                status = "error";
            });
        } catch (err) {
            console.error("Failed to load PeerJS:", err);
            status = "error";
        }
    });

    function sendText() {
        if (!textInput.trim() || !connection || status !== "connected") return;

        connection.send({
            type: "text",
            content: textInput.trim(),
        });

        textInput = ""; // Clear input after sending
    }

    function handleImageUpload(e: Event) {
        if (!connection || status !== "connected") return;

        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            // Send the base64 image data directly over WebRTC
            connection!.send({
                type: "image",
                content: dataUrl,
            });
            // Reset input so the same image can be uploaded again if needed
            input.value = "";
        };

        reader.readAsDataURL(file);
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
    class="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 flex flex-col font-sans p-6"
>
    <header class="text-center mb-8 pt-4">
        <h1 class="text-2xl font-bold tracking-tight mb-2 text-primary">
            Anotapp
        </h1>
        {#if status === "connecting"}
            <div
                class="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-full text-sm font-medium"
            >
                <div
                    class="w-2 h-2 rounded-full bg-yellow-500 animate-ping"
                ></div>
                Conectando...
            </div>
        {:else if status === "connected"}
            <div
                class="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-sm font-medium"
            >
                <div
                    class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                ></div>
                Conectado
            </div>
        {:else}
            <div
                class="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-600 dark:text-red-400 rounded-full text-sm font-medium"
            >
                <div class="w-2 h-2 rounded-full bg-red-500"></div>
                Error de conexión
            </div>
            <p class="text-xs text-muted-foreground mt-2">
                Asegúrate de que la aplicación de escritorio esté abierta y
                escanea el QR nuevamente.
            </p>
        {/if}
    </header>

    <div
        class="flex-1 flex flex-col gap-6 max-w-md w-full mx-auto justify-center pb-20"
    >
        <!-- Text Input Card -->
        <div
            class="bg-background border border-border/50 rounded-2xl p-5 shadow-sm"
        >
            <h2
                class="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3"
            >
                Enviar Texto
            </h2>
            <textarea
                bind:value={textInput}
                class="w-full bg-muted/50 border-transparent rounded-xl p-3 min-h-[120px] focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none transition-shadow text-foreground"
                placeholder="Escribe una nota rápida, un enlace..."
                disabled={status !== "connected"}
            ></textarea>
            <div class="mt-3 flex justify-end">
                <button
                    onclick={sendText}
                    disabled={status !== "connected" || !textInput.trim()}
                    class="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-medium transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-primary/20"
                >
                    <Send class="w-4 h-4" />
                    Enviar
                </button>
            </div>
        </div>

        <!-- Image Upload Card -->
        <div
            class="bg-background border border-border/50 rounded-2xl p-5 shadow-sm"
        >
            <h2
                class="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3"
            >
                Enviar Imagen
            </h2>

            <button
                onclick={() =>
                    document.getElementById("mobile-image-upload")?.click()}
                disabled={status !== "connected"}
                class="w-full border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none group"
            >
                <div
                    class="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform"
                >
                    <ImagePlus class="w-7 h-7" />
                </div>
                <div class="text-center">
                    <p class="font-medium text-foreground">
                        Subir foto o captura
                    </p>
                    <p class="text-xs text-muted-foreground mt-1">
                        Se enviará directamente al lienzo
                    </p>
                </div>
            </button>

            <input
                type="file"
                id="mobile-image-upload"
                accept="image/*"
                class="hidden"
                onchange={handleImageUpload}
            />
        </div>
    </div>
</main>
