<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import QRCode from "qrcode";

    let {
        open = $bindable(false),
        peerId = "",
    }: { open: boolean; peerId: string } = $props();

    let canvas = $state<HTMLCanvasElement>();

    // We will assume the mobile UI is hosted on a free public domain.
    // For local testing, this could be the local IP, but Vercel/Netlify is recommended for production.
    // In this example, we generate a placeholder URL that the user should replace with their actual hosted domain.
    const baseUrl = "https://anotapp-mobile.vercel.app";

    $effect(() => {
        if (open && canvas && peerId) {
            const url = `${baseUrl}?peerId=${peerId}`;
            QRCode.toCanvas(
                canvas,
                url,
                {
                    width: 250,
                    margin: 2,
                    color: {
                        dark: "#000000FF",
                        light: "#FFFFFFFF",
                    },
                },
                function (error) {
                    if (error) console.error(error);
                },
            );
        }
    });
</script>

<Dialog.Root bind:open>
    <Dialog.Content
        class="sm:max-w-md bg-background border-border text-foreground p-6 rounded-xl shadow-2xl flex flex-col items-center"
    >
        <Dialog.Header class="shrink-0 w-full text-center mb-4">
            <Dialog.Title
                class="text-xl font-bold tracking-tight text-foreground mb-1"
            >
                Vincular Celular
            </Dialog.Title>
            <Dialog.Description class="text-muted-foreground">
                Escanea este código QR con tu celular para conectarte por
                WebRTC.
            </Dialog.Description>
        </Dialog.Header>

        <div
            class="bg-white p-4 rounded-xl shadow-inner flex items-center justify-center"
        >
            <canvas bind:this={canvas}></canvas>
        </div>

        {#if peerId}
            <div class="mt-4 text-center">
                <p
                    class="text-xs text-muted-foreground uppercase tracking-wider font-semibold"
                >
                    ID de Conexión
                </p>
                <p
                    class="font-mono bg-muted px-3 py-1 rounded-md text-sm mt-1 select-all"
                >
                    {peerId}
                </p>
            </div>
        {/if}

        <p class="text-xs text-center text-muted-foreground mt-4 px-4">
            Asegúrate de tener conexión a internet. La transferencia de imágenes
            se realizará directamente entre ambos dispositivos de forma rápida y
            segura.
        </p>
    </Dialog.Content>
</Dialog.Root>
